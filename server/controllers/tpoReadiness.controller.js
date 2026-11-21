import mongoose from "mongoose";
import User from "../models/User.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import Institution from "../models/Institution.model.js";
import Resume from "../models/Resume.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import ReadinessSnapshot from "../models/ReadinessSnapshot.model.js";

/**
 * Core explainable readiness calculation for an individual student
 * Does not invent data; normalizes across available signals.
 */
export const computeStudentReadiness = async (
  userId,
  institutionId,
  customWeights = null,
) => {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const institution = await Institution.findById(institutionId).lean();
  const weights = customWeights ||
    institution?.settings?.readinessWeights || {
      resume: 30,
      interview: 40,
      technical: 20,
      engagement: 10,
    };

  // 1. RESUME EVALUATION (Quality & completeness)
  const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 }).lean();
  let resumeScore = null;
  let resumeDataAvailable = false;
  const resumeDetails = {
    totalResumes: resumes.length,
    bestScore: null,
    completionRate: null,
    skillCount: 0,
    hasExperience: false,
    hasProjects: false,
    hasCertifications: false,
  };

  if (resumes.length > 0) {
    resumeDataAvailable = true;
    let maxResumePts = 0;

    resumes.forEach((r) => {
      let pts = 0;
      // Header/contact: 15 pts
      if (r.name && (r.contact?.email || r.contact?.phone)) pts += 15;
      // Summary: 15 pts
      if (r.summary && r.summary.trim().length > 30) pts += 15;
      // Experience: 20 pts
      if (r.experience && r.experience.length > 0) {
        pts += 20;
        resumeDetails.hasExperience = true;
      }
      // Projects: 20 pts
      if (r.projects && r.projects.length > 0) {
        pts += 20;
        resumeDetails.hasProjects = true;
      }
      // Skills: 15 pts
      const skillsInResume =
        r.skills?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0;
      if (skillsInResume > 0) {
        pts += Math.min(15, skillsInResume * 2);
        resumeDetails.skillCount = Math.max(
          resumeDetails.skillCount,
          skillsInResume,
        );
      }
      // Education: 15 pts
      if (r.education && r.education.length > 0) pts += 15;

      if (pts > maxResumePts) maxResumePts = pts;
    });

    resumeScore = Math.min(100, Math.max(10, maxResumePts));
    resumeDetails.bestScore = resumeScore;
    resumeDetails.completionRate = Math.round(maxResumePts);
  }

  // 2. INTERVIEW EVALUATION (AI Mock Performance)
  const interviewResults = await InterviewResult.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  let interviewScore = null;
  let interviewDataAvailable = false;
  const interviewDetails = {
    totalInterviews: interviewResults.length,
    avgScore: null,
    bestScore: null,
    technicalScore: null,
    communicationScore: null,
    completionRate: null,
  };

  if (interviewResults.length > 0) {
    interviewDataAvailable = true;
    const scores = interviewResults.map((ir) => ir.overallScore || 0);
    const avgScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );
    const bestScore = Math.max(...scores);

    let techScores = [];
    let commScores = [];
    interviewResults.forEach((ir) => {
      if (ir.skillBreakdown?.technicalKnowledge?.score) {
        techScores.push(ir.skillBreakdown.technicalKnowledge.score);
      }
      if (ir.skillBreakdown?.communication?.score) {
        commScores.push(ir.skillBreakdown.communication.score);
      }
    });

    const avgTech = techScores.length
      ? Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length)
      : avgScore;
    const avgComm = commScores.length
      ? Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length)
      : avgScore;

    interviewScore = avgScore;
    interviewDetails.avgScore = avgScore;
    interviewDetails.bestScore = bestScore;
    interviewDetails.technicalScore = avgTech;
    interviewDetails.communicationScore = avgComm;
    interviewDetails.completionRate = Math.min(
      100,
      interviewResults.length * 20,
    ); // 5 interviews = 100%
  }

  // 3. TECHNICAL SKILLS EVALUATION
  let technicalScore = null;
  let technicalDataAvailable = false;
  const technicalDetails = {
    skillsFromResume: [],
    technicalInterviewScore: interviewDetails.technicalScore,
    topicBreakdown: {},
  };

  const extractedSkills = new Set();
  resumes.forEach((r) => {
    if (Array.isArray(r.skills)) {
      r.skills.forEach((cat) => {
        cat.items?.forEach((item) => {
          if (item) extractedSkills.add(item.trim());
        });
      });
    }
  });

  technicalDetails.skillsFromResume = Array.from(extractedSkills).slice(0, 30);

  if (
    technicalDetails.skillsFromResume.length > 0 ||
    interviewDetails.technicalScore !== null
  ) {
    technicalDataAvailable = true;
    let baseSkillPoints = Math.min(
      50,
      technicalDetails.skillsFromResume.length * 5,
    ); // up to 50 pts
    let interviewTechPoints =
      interviewDetails.technicalScore !== null
        ? interviewDetails.technicalScore * 0.5
        : 25;
    technicalScore = Math.min(
      100,
      Math.round(baseSkillPoints + interviewTechPoints),
    );
  }

  // 4. PLATFORM ENGAGEMENT EVALUATION
  let engagementScore = 30; // base signup engagement
  let engagementDataAvailable = true;
  const engagementDetails = {
    resumesCreated: user.usage?.resumesCreated || resumes.length,
    interviewsCompleted: interviewResults.length,
    lastActiveAt: user.lastLogin,
    platformDaysActive: 1,
  };

  if (engagementDetails.resumesCreated >= 1) engagementScore += 25;
  if (engagementDetails.resumesCreated >= 2) engagementScore += 10;
  if (engagementDetails.interviewsCompleted >= 1) engagementScore += 25;
  if (engagementDetails.interviewsCompleted >= 3) engagementScore += 10;
  engagementScore = Math.min(100, engagementScore);

  // NORMALIZED OVERALL SCORE CALCULATION
  // Re-scale available components so missing components don't drag down student unfairly
  let totalAvailableWeight = 0;
  let weightedSum = 0;

  if (resumeDataAvailable && resumeScore !== null) {
    totalAvailableWeight += weights.resume;
    weightedSum += resumeScore * weights.resume;
  }
  if (interviewDataAvailable && interviewScore !== null) {
    totalAvailableWeight += weights.interview;
    weightedSum += interviewScore * weights.interview;
  }
  if (technicalDataAvailable && technicalScore !== null) {
    totalAvailableWeight += weights.technical;
    weightedSum += technicalScore * weights.technical;
  }
  if (engagementDataAvailable && engagementScore !== null) {
    totalAvailableWeight += weights.engagement;
    weightedSum += engagementScore * weights.engagement;
  }

  const overallScore =
    totalAvailableWeight > 0
      ? Math.round(weightedSum / totalAvailableWeight)
      : 0;

  const dataCompleteness = Math.round(
    ((resumeDataAvailable ? 1 : 0) +
      (interviewDataAvailable ? 1 : 0) +
      (technicalDataAvailable ? 1 : 0) +
      (engagementDataAvailable ? 1 : 0)) *
      25,
  );

  // GENERATE EXPLAINABLE STRENGTHS & RECOMMENDATIONS
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];
  const skillGaps = [];

  if (resumeScore >= 75) {
    strengths.push(
      "Comprehensive resume with well-structured sections and verified details.",
    );
  } else if (resumeDataAvailable) {
    weaknesses.push(
      "Resume sections can be expanded with more quantified project outcomes.",
    );
    recommendations.push(
      "Enhance resume bullet points with measurable metrics and action verbs.",
    );
  } else {
    recommendations.push(
      "Create your primary professional resume using the ATS builder.",
    );
  }

  if (interviewScore >= 75) {
    strengths.push(
      "High confidence and clear technical articulation in AI mock interviews.",
    );
  } else if (interviewDataAvailable) {
    weaknesses.push(
      "Opportunity to improve structure when responding to technical deep-dives.",
    );
    recommendations.push(
      "Practice role-specific mock interviews focusing on STAR method responses.",
    );
  } else {
    recommendations.push(
      "Complete at least one AI mock interview to establish baseline interview readiness.",
    );
  }

  if (technicalDetails.skillsFromResume.length >= 8) {
    strengths.push(
      `Diverse verified technical skill stack (${technicalDetails.skillsFromResume.length} core technologies identified).`,
    );
  } else {
    recommendations.push(
      "Add targeted core domain skills and relevant frameworks to your profile.",
    );
  }

  // Extract recurring weaknesses from interview results
  interviewResults.forEach((ir) => {
    if (Array.isArray(ir.weaknesses)) {
      ir.weaknesses.forEach((w) => {
        if (w && !skillGaps.includes(w) && skillGaps.length < 5) {
          skillGaps.push(w);
        }
      });
    }
  });

  // Check previous snapshot for trend
  const previousSnapshot = await ReadinessSnapshot.findOne({
    userId,
    institutionId,
  })
    .sort({ computedAt: -1 })
    .lean();

  let trend = "new";
  let previousScore = null;
  let scoreChange = null;

  if (previousSnapshot && previousSnapshot.overallScore !== null) {
    previousScore = previousSnapshot.overallScore;
    scoreChange = overallScore - previousScore;
    if (scoreChange > 2) trend = "improving";
    else if (scoreChange < -2) trend = "declining";
    else trend = "stable";
  }

  // Create and save snapshot
  const snapshot = new ReadinessSnapshot({
    userId,
    institutionId,
    overallScore,
    components: {
      resume: {
        score: resumeScore,
        weight: weights.resume,
        dataAvailable: resumeDataAvailable,
        details: resumeDetails,
      },
      interview: {
        score: interviewScore,
        weight: weights.interview,
        dataAvailable: interviewDataAvailable,
        details: interviewDetails,
      },
      technical: {
        score: technicalScore,
        weight: weights.technical,
        dataAvailable: technicalDataAvailable,
        details: technicalDetails,
      },
      engagement: {
        score: engagementScore,
        weight: weights.engagement,
        dataAvailable: engagementDataAvailable,
        details: engagementDetails,
      },
    },
    strengths,
    weaknesses,
    recommendations,
    skillGaps,
    previousScore,
    scoreChange,
    trend,
    dataCompleteness,
    computedAt: new Date(),
  });

  await snapshot.save();
  return snapshot;
};

/**
 * Get aggregated readiness scores across the institution
 * GET /api/tpo/readiness
 */
export const getInstitutionReadiness = async (req, res) => {
  try {
    const { departmentId, batchId, refresh } = req.query;

    const studentQuery = {
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    };

    if (departmentId)
      studentQuery.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (batchId) studentQuery.batchId = new mongoose.Types.ObjectId(batchId);

    const activeLinks = await StudentInstitution.find(studentQuery)
      .populate("userId", "name email profilePicture lastLogin")
      .lean();

    const userIds = activeLinks.map((l) => l.userId?._id).filter(Boolean);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: {
          students: [],
          stats: {
            averageScore: 0,
            distribution: { excellent: 0, good: 0, average: 0, needsWork: 0 },
            componentAverages: {
              resume: 0,
              interview: 0,
              technical: 0,
              engagement: 0,
            },
            totalAssessed: 0,
          },
        },
      });
    }

    // If refresh requested, recompute for active students (capped to 50 per batch)
    if (refresh === "true") {
      const batchToRefresh = userIds.slice(0, 50);
      for (const uid of batchToRefresh) {
        try {
          await computeStudentReadiness(uid, req.institutionId);
        } catch (err) {
          console.error(
            `Readiness refresh error for user ${uid}:`,
            err.message,
          );
        }
      }
    }

    // Get latest snapshot for each student
    const snapshots = await ReadinessSnapshot.find({
      institutionId: req.institutionId,
      userId: { $in: userIds },
    })
      .sort({ computedAt: -1 })
      .lean();

    const latestSnapshotMap = {};
    snapshots.forEach((s) => {
      const uid = s.userId.toString();
      if (!latestSnapshotMap[uid]) {
        latestSnapshotMap[uid] = s;
      }
    });

    const students = [];
    let totalScoreSum = 0;
    let assessedCount = 0;
    const distribution = {
      excellent: 0, // >= 80
      good: 0, // 60-79
      average: 0, // 40-59
      needsWork: 0, // < 40
    };

    const compSums = {
      resume: { sum: 0, count: 0 },
      interview: { sum: 0, count: 0 },
      technical: { sum: 0, count: 0 },
      engagement: { sum: 0, count: 0 },
    };

    for (const link of activeLinks) {
      const u = link.userId;
      if (!u) continue;
      let snap = latestSnapshotMap[u._id.toString()];

      // If no snapshot exists yet, compute on demand
      if (!snap) {
        try {
          snap = await computeStudentReadiness(u._id, req.institutionId);
        } catch {
          // ignore error
        }
      }

      if (snap && snap.overallScore !== null) {
        const score = snap.overallScore;
        totalScoreSum += score;
        assessedCount++;

        if (score >= 80) distribution.excellent++;
        else if (score >= 60) distribution.good++;
        else if (score >= 40) distribution.average++;
        else distribution.needsWork++;

        // Component averages
        if (snap.components?.resume?.score !== null) {
          compSums.resume.sum += snap.components.resume.score;
          compSums.resume.count++;
        }
        if (snap.components?.interview?.score !== null) {
          compSums.interview.sum += snap.components.interview.score;
          compSums.interview.count++;
        }
        if (snap.components?.technical?.score !== null) {
          compSums.technical.sum += snap.components.technical.score;
          compSums.technical.count++;
        }
        if (snap.components?.engagement?.score !== null) {
          compSums.engagement.sum += snap.components.engagement.score;
          compSums.engagement.count++;
        }
      }

      students.push({
        userId: u._id,
        name: u.name,
        email: u.email,
        profilePicture: u.profilePicture,
        rollNumber: link.rollNumber,
        departmentId: link.departmentId,
        batchId: link.batchId,
        readinessScore: snap?.overallScore ?? null,
        trend: snap?.trend ?? "new",
        scoreChange: snap?.scoreChange ?? null,
        components: snap?.components ?? null,
        dataCompleteness: snap?.dataCompleteness ?? 0,
        strengths: snap?.strengths ?? [],
        recommendations: snap?.recommendations ?? [],
        computedAt: snap?.computedAt ?? null,
      });
    }

    students.sort((a, b) => (b.readinessScore || 0) - (a.readinessScore || 0));

    const stats = {
      averageScore:
        assessedCount > 0 ? Math.round(totalScoreSum / assessedCount) : 0,
      totalAssessed: assessedCount,
      totalEnrolled: userIds.length,
      distribution,
      componentAverages: {
        resume:
          compSums.resume.count > 0
            ? Math.round(compSums.resume.sum / compSums.resume.count)
            : 0,
        interview:
          compSums.interview.count > 0
            ? Math.round(compSums.interview.sum / compSums.interview.count)
            : 0,
        technical:
          compSums.technical.count > 0
            ? Math.round(compSums.technical.sum / compSums.technical.count)
            : 0,
        engagement:
          compSums.engagement.count > 0
            ? Math.round(compSums.engagement.sum / compSums.engagement.count)
            : 0,
      },
    };

    return res.json({
      success: true,
      data: {
        students,
        stats,
      },
    });
  } catch (error) {
    console.error("getInstitutionReadiness error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve readiness data.",
    });
  }
};

/**
 * Get individual student readiness breakdown
 * GET /api/tpo/readiness/:studentId
 */
export const getStudentReadiness = async (req, res) => {
  try {
    const { studentId } = req.params;

    let snapshot = await ReadinessSnapshot.findOne({
      userId: studentId,
      institutionId: req.institutionId,
    })
      .sort({ computedAt: -1 })
      .lean();

    // Recompute if none or older than 12 hours
    const isStale =
      snapshot &&
      new Date() - new Date(snapshot.computedAt) > 12 * 60 * 60 * 1000;
    if (!snapshot || isStale) {
      snapshot = await computeStudentReadiness(studentId, req.institutionId);
    }

    // History of snapshots for timeline
    const history = await ReadinessSnapshot.find({
      userId: studentId,
      institutionId: req.institutionId,
    })
      .sort({ computedAt: 1 })
      .limit(10)
      .select("overallScore computedAt components")
      .lean();

    return res.json({
      success: true,
      data: {
        readiness: snapshot,
        history,
      },
    });
  } catch (error) {
    console.error("getStudentReadiness error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student readiness.",
    });
  }
};

/**
 * Trigger background recomputation for all students
 * POST /api/tpo/readiness/refresh
 */
export const refreshAllReadiness = async (req, res) => {
  try {
    const activeLinks = await StudentInstitution.find({
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    })
      .select("userId")
      .lean();

    const userIds = activeLinks.map((l) => l.userId).filter(Boolean);

    // Process first 30 synchronously
    let processed = 0;
    for (const uid of userIds.slice(0, 30)) {
      try {
        await computeStudentReadiness(uid, req.institutionId);
        processed++;
      } catch (err) {
        console.error("Recompute error for user:", uid, err.message);
      }
    }

    return res.json({
      success: true,
      message: `Readiness recomputed for ${processed} of ${userIds.length} students.`,
      data: {
        total: userIds.length,
        processed,
      },
    });
  } catch (error) {
    console.error("refreshAllReadiness error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh readiness scores.",
    });
  }
};

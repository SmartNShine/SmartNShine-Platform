/**
 * tpoAnalytics.controller.js
 * ---------------------------
 * Resume and interview analytics for the SmartNShine TPO Dashboard.
 *
 * All data is scoped to institutionId (set by TPO auth middleware).
 * Only students who have given consentGiven=true are processed.
 * An audit log is written after every read operation.
 *
 * Middleware expectations:
 *   req.institutionId  — MongoDB ObjectId of the TPO's institution
 *   req.tpoUser        — authenticated TPO User document (lean or full)
 */

import mongoose from "mongoose";
import StudentInstitution from "../models/StudentInstitution.model.js";
import Resume from "../models/Resume.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";

// ---------------------------------------------------------------------------
// Internal helper — write an audit log entry (non-blocking; errors are silent)
// ---------------------------------------------------------------------------
const writeAuditLog = async ({
  institutionId,
  tpoUserId,
  action,
  targetType,
  targetId,
  description,
  metadata,
  req,
}) => {
  try {
    await TPOAuditLog.create({
      institutionId,
      tpoUserId,
      action,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      success: true,
    });
  } catch (_) {
    // Audit log failures must never break API responses
  }
};

// ---------------------------------------------------------------------------
// Internal helper — build a date filter object from query params
// ---------------------------------------------------------------------------
const buildDateFilter = (dateFrom, dateTo) => {
  const filter = {};
  if (dateFrom) filter.$gte = new Date(dateFrom);
  if (dateTo) filter.$lte = new Date(dateTo);
  return Object.keys(filter).length ? filter : null;
};

// ---------------------------------------------------------------------------
// Internal helper — build 12-month trend buckets (labels oldest → newest)
// ---------------------------------------------------------------------------
const buildMonthBuckets = () => {
  const buckets = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      count: 0,
      totalScore: 0,
    });
  }
  return buckets;
};

// ---------------------------------------------------------------------------
// 1. getResumeAnalytics — GET /tpo/analytics/resumes
//    Query params: departmentId, batchId, dateFrom, dateTo
// ---------------------------------------------------------------------------
export const getResumeAnalytics = async (req, res) => {
  try {
    const { institutionId, tpoUser } = req;
    const { departmentId, batchId, dateFrom, dateTo } = req.query;

    // ------------------------------------------------------------------
    // Step 1: Fetch all active, consented students in this institution
    // ------------------------------------------------------------------
    const studentFilter = {
      institutionId,
      status: "active",
      consentGiven: true,
    };
    if (departmentId) studentFilter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (batchId) studentFilter.batchId = new mongoose.Types.ObjectId(batchId);

    const studentLinks = await StudentInstitution.find(studentFilter)
      .select("userId dataPermissions")
      .lean();

    const totalStudents = studentLinks.length;
    const studentUserIds = studentLinks.map((s) => s.userId);

    if (totalStudents === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          totalStudentsWithResumes: 0,
          totalResumesCreated: 0,
          avgResumeCount: 0,
          skillsFrequency: [],
          resumeCreationTrend: buildMonthBuckets().map((b) => ({
            month: b.month,
            count: 0,
          })),
          templateUsage: [],
          studentsWithNoResume: 0,
          completionBreakdown: {
            hasSummary: 0,
            hasExperience: 0,
            hasEducation: 0,
            hasSkills: 0,
            hasProjects: 0,
            hasCertifications: 0,
          },
        },
      });
    }

    // ------------------------------------------------------------------
    // Step 2: Query resumes for all consented students
    // ------------------------------------------------------------------
    const resumeFilter = { userId: { $in: studentUserIds } };
    const dateFilter = buildDateFilter(dateFrom, dateTo);
    if (dateFilter) resumeFilter.createdAt = dateFilter;

    const resumes = await Resume.find(resumeFilter)
      .select(
        "userId resumeTitle templateId summary skills experience education projects certifications createdAt updatedAt"
      )
      .lean();

    // ------------------------------------------------------------------
    // Step 3: Aggregate statistics — no individual content is returned
    // ------------------------------------------------------------------

    // Students who have at least one resume
    const studentIdsWithResumes = new Set(resumes.map((r) => r.userId.toString()));
    const totalStudentsWithResumes = studentIdsWithResumes.size;
    const totalResumesCreated = resumes.length;
    const studentsWithNoResume = totalStudents - totalStudentsWithResumes;
    const avgResumeCount =
      totalStudentsWithResumes > 0
        ? parseFloat((totalResumesCreated / totalStudentsWithResumes).toFixed(2))
        : 0;

    // Skills frequency — top 20 skill items across all skill categories
    const skillCountMap = {};
    resumes.forEach((r) => {
      if (Array.isArray(r.skills)) {
        r.skills.forEach((cat) => {
          if (Array.isArray(cat.items)) {
            cat.items.forEach((item) => {
              if (item) {
                const key = item.trim().toLowerCase();
                skillCountMap[key] = (skillCountMap[key] || 0) + 1;
              }
            });
          }
        });
      }
    });
    const skillsFrequency = Object.entries(skillCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));

    // Resume creation trend — last 12 months
    const trendBuckets = buildMonthBuckets();
    resumes.forEach((r) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = trendBuckets.find((b) => b.month === key);
      if (bucket) bucket.count += 1;
    });
    const resumeCreationTrend = trendBuckets.map((b) => ({
      month: b.month,
      count: b.count,
    }));

    // Template usage — top 5
    const templateCountMap = {};
    resumes.forEach((r) => {
      const tpl = r.templateId || "unknown";
      templateCountMap[tpl] = (templateCountMap[tpl] || 0) + 1;
    });
    const templateUsage = Object.entries(templateCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([templateId, count]) => ({ templateId, count }));

    // Section completion breakdown — count students whose best resume has each section
    const completionBreakdown = {
      hasSummary: 0,
      hasExperience: 0,
      hasEducation: 0,
      hasSkills: 0,
      hasProjects: 0,
      hasCertifications: 0,
    };
    // Group resumes by student, evaluate the best (most complete) resume per student
    const resumesByStudent = {};
    resumes.forEach((r) => {
      const uid = r.userId.toString();
      if (!resumesByStudent[uid]) resumesByStudent[uid] = [];
      resumesByStudent[uid].push(r);
    });

    Object.values(resumesByStudent).forEach((studentResumes) => {
      // Pick any one resume per student to check section presence
      // (we flag the student if ANY of their resumes has the section)
      const hasSummary = studentResumes.some((r) => r.summary && r.summary.trim().length > 0);
      const hasExperience = studentResumes.some(
        (r) => Array.isArray(r.experience) && r.experience.length > 0
      );
      const hasEducation = studentResumes.some(
        (r) => Array.isArray(r.education) && r.education.length > 0
      );
      const hasSkills = studentResumes.some(
        (r) => Array.isArray(r.skills) && r.skills.length > 0
      );
      const hasProjects = studentResumes.some(
        (r) => Array.isArray(r.projects) && r.projects.length > 0
      );
      const hasCertifications = studentResumes.some(
        (r) => Array.isArray(r.certifications) && r.certifications.length > 0
      );

      if (hasSummary) completionBreakdown.hasSummary += 1;
      if (hasExperience) completionBreakdown.hasExperience += 1;
      if (hasEducation) completionBreakdown.hasEducation += 1;
      if (hasSkills) completionBreakdown.hasSkills += 1;
      if (hasProjects) completionBreakdown.hasProjects += 1;
      if (hasCertifications) completionBreakdown.hasCertifications += 1;
    });

    // ------------------------------------------------------------------
    // Step 4: Audit log
    // ------------------------------------------------------------------
    await writeAuditLog({
      institutionId,
      tpoUserId: tpoUser._id,
      action: "resume.analytics",
      targetType: "institution",
      targetId: institutionId,
      description: "TPO viewed institution resume analytics",
      metadata: {
        filters: { departmentId, batchId, dateFrom, dateTo },
        totalStudents,
        totalResumesCreated,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalStudentsWithResumes,
        totalResumesCreated,
        avgResumeCount,
        skillsFrequency,
        resumeCreationTrend,
        templateUsage,
        studentsWithNoResume,
        completionBreakdown,
      },
    });
  } catch (error) {
    console.error("[tpoAnalytics] getResumeAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch resume analytics." });
  }
};

// ---------------------------------------------------------------------------
// 2. getStudentResumeAnalytics — GET /tpo/analytics/resumes/:studentId
// ---------------------------------------------------------------------------
export const getStudentResumeAnalytics = async (req, res) => {
  try {
    const { institutionId, tpoUser } = req;
    const { studentId } = req.params;

    // Validate student belongs to this institution and has consented
    const studentLink = await StudentInstitution.findOne({
      institutionId,
      userId: studentId,
      status: "active",
      consentGiven: true,
    }).lean();

    if (!studentLink) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this institution or consent not given.",
      });
    }

    // Determine whether full resume content may be returned
    const showContent = studentLink.dataPermissions?.viewResumeContent === true;

    // Fetch resumes — select summary-level fields always; add content only if permitted
    const selectFields = showContent
      ? undefined // all fields
      : "resumeTitle templateId createdAt updatedAt summary skills experience education projects certifications";

    const query = Resume.find({ userId: studentId }).sort({ createdAt: -1 });
    if (selectFields) query.select(selectFields);
    const resumes = await query.lean();

    // Build safe response list
    const resumeList = resumes.map((r) => ({
      resumeId: r._id,
      resumeTitle: r.resumeTitle || "Untitled Resume",
      templateId: r.templateId || "classic",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      skillCount: Array.isArray(r.skills)
        ? r.skills.reduce((acc, cat) => acc + (cat.items?.length || 0), 0)
        : 0,
      hasSummary: !!(r.summary && r.summary.trim().length > 0),
      hasExperience: Array.isArray(r.experience) && r.experience.length > 0,
      hasProjects: Array.isArray(r.projects) && r.projects.length > 0,
      hasCertifications: Array.isArray(r.certifications) && r.certifications.length > 0,
      hasEducation: Array.isArray(r.education) && r.education.length > 0,
      hasSkills: Array.isArray(r.skills) && r.skills.length > 0,
      // Only include full content if permission allows
      ...(showContent ? { fullContent: r } : {}),
    }));

    const firstCreatedAt = resumes.length > 0 ? resumes[resumes.length - 1].createdAt : null;
    const lastUpdatedAt = resumes.length > 0 ? resumes[0].updatedAt : null;

    // Audit log
    await writeAuditLog({
      institutionId,
      tpoUserId: tpoUser._id,
      action: "resume.view",
      targetType: "student",
      targetId: studentLink.userId,
      description: `TPO viewed resume analytics for student ${studentId}`,
      metadata: { resumeCount: resumes.length, showContent },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        studentId,
        resumeCount: resumes.length,
        firstCreatedAt,
        lastUpdatedAt,
        resumes: resumeList,
        contentAccessGranted: showContent,
      },
    });
  } catch (error) {
    console.error("[tpoAnalytics] getStudentResumeAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student resume analytics." });
  }
};

// ---------------------------------------------------------------------------
// 3. getInterviewAnalytics — GET /tpo/analytics/interviews
//    Query params: departmentId, batchId, dateFrom, dateTo, interviewType
// ---------------------------------------------------------------------------
export const getInterviewAnalytics = async (req, res) => {
  try {
    const { institutionId, tpoUser } = req;
    const { departmentId, batchId, dateFrom, dateTo, interviewType } = req.query;

    // ------------------------------------------------------------------
    // Step 1: Fetch consented active students
    // ------------------------------------------------------------------
    const studentFilter = {
      institutionId,
      status: "active",
      consentGiven: true,
    };
    if (departmentId) studentFilter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (batchId) studentFilter.batchId = new mongoose.Types.ObjectId(batchId);

    const studentLinks = await StudentInstitution.find(studentFilter)
      .select("userId")
      .lean();

    const totalStudents = studentLinks.length;
    const studentUserIds = studentLinks.map((s) => s.userId);

    if (totalStudents === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          totalInterviews: 0,
          totalSessions: 0,
          completionRate: 0,
          avgOverallScore: null,
          scoreDistribution: [],
          byInterviewType: [],
          skillBreakdown: {},
          trend: buildMonthBuckets().map((b) => ({ month: b.month, avgScore: null, count: 0 })),
          studentsWithNoInterview: 0,
        },
      });
    }

    // ------------------------------------------------------------------
    // Step 2: Fetch all interview sessions & results for those students
    // ------------------------------------------------------------------
    const sessionFilter = { userId: { $in: studentUserIds } };
    if (interviewType) sessionFilter.interviewType = interviewType;
    const dateFilter = buildDateFilter(dateFrom, dateTo);
    if (dateFilter) sessionFilter.createdAt = dateFilter;

    const [allSessions, allResults] = await Promise.all([
      InterviewSession.find(sessionFilter)
        .select("userId interviewType role status createdAt completedAt")
        .lean(),
      InterviewResult.find({
        userId: { $in: studentUserIds },
        ...(interviewType ? { interviewType } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      })
        .select(
          "userId sessionId overallScore interviewType skillBreakdown createdAt"
        )
        .lean(),
    ]);

    const completedSessions = allSessions.filter((s) => s.status === "completed");
    const totalSessions = allSessions.length;
    const totalInterviews = completedSessions.length;
    const completionRate =
      totalSessions > 0 ? parseFloat((totalInterviews / totalSessions).toFixed(4)) : 0;

    // Average overall score
    const avgOverallScore =
      allResults.length > 0
        ? parseFloat(
            (
              allResults.reduce((sum, r) => sum + r.overallScore, 0) / allResults.length
            ).toFixed(2)
          )
        : null;

    // Score distribution in bands of 20
    const bands = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];
    allResults.forEach((r) => {
      const band = bands.find((b) => r.overallScore >= b.min && r.overallScore <= b.max);
      if (band) band.count += 1;
    });
    const scoreDistribution = bands.map(({ range, count }) => ({ range, count }));

    // By interview type
    const typeMap = {};
    allResults.forEach((r) => {
      const t = r.interviewType || "unknown";
      if (!typeMap[t]) typeMap[t] = { type: t, count: 0, totalScore: 0 };
      typeMap[t].count += 1;
      typeMap[t].totalScore += r.overallScore;
    });
    const byInterviewType = Object.values(typeMap).map((t) => ({
      type: t.type,
      count: t.count,
      avgScore: t.count > 0 ? parseFloat((t.totalScore / t.count).toFixed(2)) : null,
    }));

    // Skill breakdown averages
    const skillKeys = [
      "communication",
      "technicalKnowledge",
      "problemSolving",
      "situationalAwareness",
      "culturalFit",
    ];
    const skillTotals = {};
    const skillCounts = {};
    skillKeys.forEach((k) => {
      skillTotals[k] = 0;
      skillCounts[k] = 0;
    });
    allResults.forEach((r) => {
      if (r.skillBreakdown) {
        skillKeys.forEach((k) => {
          const score = r.skillBreakdown[k]?.score;
          if (score != null && !isNaN(score)) {
            skillTotals[k] += score;
            skillCounts[k] += 1;
          }
        });
      }
    });
    const skillBreakdown = {};
    skillKeys.forEach((k) => {
      skillBreakdown[k] =
        skillCounts[k] > 0
          ? parseFloat((skillTotals[k] / skillCounts[k]).toFixed(2))
          : null;
    });

    // Trend — last 12 months (avg score + count per month)
    const trendBuckets = buildMonthBuckets();
    allResults.forEach((r) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = trendBuckets.find((b) => b.month === key);
      if (bucket) {
        bucket.count += 1;
        bucket.totalScore += r.overallScore;
      }
    });
    const trend = trendBuckets.map((b) => ({
      month: b.month,
      count: b.count,
      avgScore: b.count > 0 ? parseFloat((b.totalScore / b.count).toFixed(2)) : null,
    }));

    // Students with no completed interview
    const studentsWithInterviews = new Set(
      completedSessions.map((s) => s.userId.toString())
    );
    const studentsWithNoInterview = totalStudents - studentsWithInterviews.size;

    // ------------------------------------------------------------------
    // Step 3: Audit log
    // ------------------------------------------------------------------
    await writeAuditLog({
      institutionId,
      tpoUserId: tpoUser._id,
      action: "interview.analytics",
      targetType: "institution",
      targetId: institutionId,
      description: "TPO viewed institution interview analytics",
      metadata: {
        filters: { departmentId, batchId, dateFrom, dateTo, interviewType },
        totalStudents,
        totalInterviews,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalInterviews,
        totalSessions,
        completionRate,
        avgOverallScore,
        scoreDistribution,
        byInterviewType,
        skillBreakdown,
        trend,
        studentsWithNoInterview,
      },
    });
  } catch (error) {
    console.error("[tpoAnalytics] getInterviewAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch interview analytics." });
  }
};

// ---------------------------------------------------------------------------
// 4. getStudentInterviewAnalytics — GET /tpo/analytics/interviews/:studentId
// ---------------------------------------------------------------------------
export const getStudentInterviewAnalytics = async (req, res) => {
  try {
    const { institutionId, tpoUser } = req;
    const { studentId } = req.params;

    // Validate student access
    const studentLink = await StudentInstitution.findOne({
      institutionId,
      userId: studentId,
      status: "active",
      consentGiven: true,
    }).lean();

    if (!studentLink) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this institution or consent not given.",
      });
    }

    // Fetch sessions and results
    const [sessions, results] = await Promise.all([
      InterviewSession.find({ userId: studentId })
        .sort({ createdAt: -1 })
        .select("_id interviewType role status createdAt completedAt")
        .lean(),
      InterviewResult.find({ userId: studentId })
        .sort({ createdAt: 1 }) // oldest first for trend
        .select("sessionId overallScore skillBreakdown createdAt interviewType role")
        .lean(),
    ]);

    // Map results by sessionId for quick lookup
    const resultBySession = {};
    results.forEach((r) => {
      resultBySession[r.sessionId.toString()] = r;
    });

    // Build session list with linked scores
    const sessionList = sessions.map((s) => {
      const linked = resultBySession[s._id.toString()];
      return {
        sessionId: s._id,
        interviewType: s.interviewType,
        role: s.role,
        status: s.status,
        createdAt: s.createdAt,
        completedAt: s.completedAt || null,
        overallScore: linked ? linked.overallScore : null,
      };
    });

    // Improvement trend (overallScore over time, oldest → newest)
    const improvementTrend = results.map((r) => ({
      date: r.createdAt,
      overallScore: r.overallScore,
      interviewType: r.interviewType,
      role: r.role,
    }));

    // Skill breakdown from latest InterviewResult
    const latestResult = results.length > 0 ? results[results.length - 1] : null;
    const latestSkillBreakdown = latestResult ? latestResult.skillBreakdown : null;

    // Audit log
    await writeAuditLog({
      institutionId,
      tpoUserId: tpoUser._id,
      action: "interview.view",
      targetType: "student",
      targetId: studentLink.userId,
      description: `TPO viewed interview analytics for student ${studentId}`,
      metadata: { sessionCount: sessions.length, resultCount: results.length },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        studentId,
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s) => s.status === "completed").length,
        sessions: sessionList,
        improvementTrend,
        latestSkillBreakdown,
      },
    });
  } catch (error) {
    console.error("[tpoAnalytics] getStudentInterviewAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student interview analytics." });
  }
};

// ---------------------------------------------------------------------------
// 5. getSkillGapAnalysis — GET /tpo/analytics/skill-gaps
//    Aggregates missedKeywords + weaknesses across all students' InterviewResults
// ---------------------------------------------------------------------------
export const getSkillGapAnalysis = async (req, res) => {
  try {
    const { institutionId, tpoUser } = req;
    const { departmentId, batchId } = req.query;

    // Fetch consented active students
    const studentFilter = {
      institutionId,
      status: "active",
      consentGiven: true,
    };
    if (departmentId) studentFilter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (batchId) studentFilter.batchId = new mongoose.Types.ObjectId(batchId);

    const studentLinks = await StudentInstitution.find(studentFilter)
      .select("userId")
      .lean();

    const studentUserIds = studentLinks.map((s) => s.userId);

    if (studentUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { totalStudentsAnalyzed: 0, skillGaps: [], weaknesses: [] },
      });
    }

    // Fetch all results for consented students
    const results = await InterviewResult.find({ userId: { $in: studentUserIds } })
      .select("missedKeywords weaknesses")
      .lean();

    // Count missed keywords frequency
    const keywordMap = {};
    const weaknessMap = {};

    results.forEach((r) => {
      // Missed keywords
      if (Array.isArray(r.missedKeywords)) {
        r.missedKeywords.forEach((kw) => {
          if (kw) {
            const key = kw.trim().toLowerCase();
            keywordMap[key] = (keywordMap[key] || 0) + 1;
          }
        });
      }
      // Weaknesses
      if (Array.isArray(r.weaknesses)) {
        r.weaknesses.forEach((w) => {
          if (w) {
            const key = w.trim().toLowerCase();
            weaknessMap[key] = (weaknessMap[key] || 0) + 1;
          }
        });
      }
    });

    const skillGaps = Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([keyword, frequency]) => ({ keyword, frequency }));

    const weaknesses = Object.entries(weaknessMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([weakness, frequency]) => ({ weakness, frequency }));

    // Audit log
    await writeAuditLog({
      institutionId,
      tpoUserId: tpoUser._id,
      action: "interview.analytics",
      targetType: "institution",
      targetId: institutionId,
      description: "TPO viewed skill gap analysis",
      metadata: {
        filters: { departmentId, batchId },
        totalStudentsAnalyzed: studentLinks.length,
        resultsAnalyzed: results.length,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalStudentsAnalyzed: studentLinks.length,
        totalResultsAnalyzed: results.length,
        skillGaps,
        weaknesses,
      },
    });
  } catch (error) {
    console.error("[tpoAnalytics] getSkillGapAnalysis error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch skill gap analysis." });
  }
};

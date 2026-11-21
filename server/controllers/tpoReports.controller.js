import mongoose from "mongoose";
import User from "../models/User.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import Institution from "../models/Institution.model.js";
import Resume from "../models/Resume.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import Assignment from "../models/Assignment.model.js";
import AssignmentSubmission from "../models/AssignmentSubmission.model.js";
import ReadinessSnapshot from "../models/ReadinessSnapshot.model.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";

/**
 * Overview KPIs for TPO Dashboard
 * GET /api/tpo/reports/overview
 */
export const getOverviewStats = async (req, res) => {
  try {
    const institutionId = req.institutionId;

    // 1. Student counts
    const totalEnrolled = await StudentInstitution.countDocuments({
      institutionId,
    });
    const activeStudents = await StudentInstitution.countDocuments({
      institutionId,
      status: "active",
      consentGiven: true,
    });
    const pendingInvites = await StudentInstitution.countDocuments({
      institutionId,
      status: "pending",
    });

    const activeLinks = await StudentInstitution.find({
      institutionId,
      status: "active",
      consentGiven: true,
    })
      .select("userId")
      .lean();

    const activeUserIds = activeLinks.map((l) => l.userId).filter(Boolean);

    // 2. Resumes created
    const totalResumes = await Resume.countDocuments({
      userId: { $in: activeUserIds },
    });

    // 3. Mock Interviews completed
    const totalInterviews = await InterviewSession.countDocuments({
      userId: { $in: activeUserIds },
      status: "completed",
    });

    // 4. Assignments stats
    const totalAssignments = await Assignment.countDocuments({
      institutionId,
      status: "active",
    });
    const completedSubmissions = await AssignmentSubmission.countDocuments({
      institutionId,
      status: "submitted",
    });

    // 5. Readiness stats
    const snapshots = await ReadinessSnapshot.find({
      institutionId,
      userId: { $in: activeUserIds },
    })
      .sort({ computedAt: -1 })
      .lean();

    const seenUsers = new Set();
    let readinessScoreSum = 0;
    let assessedCount = 0;
    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      needsWork: 0,
    };

    snapshots.forEach((s) => {
      const uid = s.userId.toString();
      if (!seenUsers.has(uid)) {
        seenUsers.add(uid);
        if (s.overallScore !== null) {
          readinessScoreSum += s.overallScore;
          assessedCount++;
          if (s.overallScore >= 80) distribution.excellent++;
          else if (s.overallScore >= 60) distribution.good++;
          else if (s.overallScore >= 40) distribution.average++;
          else distribution.needsWork++;
        }
      }
    });

    const avgReadiness =
      assessedCount > 0 ? Math.round(readinessScoreSum / assessedCount) : 0;

    // 6. Recent institution activity logs
    const recentLogs = await TPOAuditLog.find({ institutionId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("tpoUserId", "name email")
      .lean();

    return res.json({
      success: true,
      data: {
        kpis: {
          totalEnrolled,
          activeStudents,
          pendingInvites,
          totalResumes,
          totalInterviews,
          totalAssignments,
          completedSubmissions,
          avgReadiness,
        },
        readinessDistribution: distribution,
        recentActivity: recentLogs.map((log) => ({
          id: log._id,
          action: log.action,
          description: log.description,
          performedBy: log.tpoUserId?.name || "TPO Officer",
          timestamp: log.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("getOverviewStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate dashboard overview metrics.",
    });
  }
};

/**
 * Department-wise student readiness report
 * GET /api/tpo/reports/department-readiness
 */
export const getDepartmentReadinessReport = async (req, res) => {
  try {
    const institution = await Institution.findById(req.institutionId)
      .select("departments")
      .lean();

    const departments = institution?.departments || [];

    const activeLinks = await StudentInstitution.find({
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    })
      .select("userId departmentId")
      .lean();

    const deptGroupMap = {};
    departments.forEach((d) => {
      deptGroupMap[d._id.toString()] = {
        id: d._id,
        name: d.name,
        code: d.code,
        userIds: [],
      };
    });

    // Also include "Unassigned"
    deptGroupMap["unassigned"] = {
      id: "unassigned",
      name: "Unassigned Department",
      code: "N/A",
      userIds: [],
    };

    activeLinks.forEach((link) => {
      const dId = link.departmentId
        ? link.departmentId.toString()
        : "unassigned";
      if (deptGroupMap[dId]) {
        deptGroupMap[dId].userIds.push(link.userId);
      } else {
        deptGroupMap["unassigned"].userIds.push(link.userId);
      }
    });

    const report = [];

    for (const dId of Object.keys(deptGroupMap)) {
      const group = deptGroupMap[dId];
      if (group.userIds.length === 0 && dId === "unassigned") continue;

      const snapshots = await ReadinessSnapshot.find({
        institutionId: req.institutionId,
        userId: { $in: group.userIds },
      })
        .sort({ computedAt: -1 })
        .lean();

      const seen = new Set();
      let scoreSum = 0;
      let count = 0;
      let high = 0;
      let low = 100;

      snapshots.forEach((s) => {
        const uid = s.userId.toString();
        if (!seen.has(uid) && s.overallScore !== null) {
          seen.add(uid);
          scoreSum += s.overallScore;
          count++;
          if (s.overallScore > high) high = s.overallScore;
          if (s.overallScore < low) low = s.overallScore;
        }
      });

      report.push({
        departmentId: group.id,
        departmentName: group.name,
        departmentCode: group.code,
        studentCount: group.userIds.length,
        assessedCount: count,
        avgReadiness: count > 0 ? Math.round(scoreSum / count) : 0,
        highestScore: count > 0 ? high : 0,
        lowestScore: count > 0 ? low : 0,
      });
    }

    return res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    console.error("getDepartmentReadinessReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate department readiness report.",
    });
  }
};

/**
 * Batch-wise performance report
 * GET /api/tpo/reports/batch-performance
 */
export const getBatchPerformanceReport = async (req, res) => {
  try {
    const institution = await Institution.findById(req.institutionId)
      .select("batches")
      .lean();

    const batches = institution?.batches || [];

    const activeLinks = await StudentInstitution.find({
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    })
      .select("userId batchId")
      .lean();

    const batchGroupMap = {};
    batches.forEach((b) => {
      batchGroupMap[b._id.toString()] = {
        id: b._id,
        name: b.name,
        startYear: b.startYear,
        endYear: b.endYear,
        userIds: [],
      };
    });

    batchGroupMap["unassigned"] = {
      id: "unassigned",
      name: "Unassigned Batch",
      userIds: [],
    };

    activeLinks.forEach((link) => {
      const bId = link.batchId ? link.batchId.toString() : "unassigned";
      if (batchGroupMap[bId]) {
        batchGroupMap[bId].userIds.push(link.userId);
      } else {
        batchGroupMap["unassigned"].userIds.push(link.userId);
      }
    });

    const report = [];

    for (const bId of Object.keys(batchGroupMap)) {
      const group = batchGroupMap[bId];
      if (group.userIds.length === 0 && bId === "unassigned") continue;

      const resumeCount = await Resume.countDocuments({
        userId: { $in: group.userIds },
      });
      const interviewCount = await InterviewSession.countDocuments({
        userId: { $in: group.userIds },
        status: "completed",
      });

      const snapshots = await ReadinessSnapshot.find({
        institutionId: req.institutionId,
        userId: { $in: group.userIds },
      })
        .sort({ computedAt: -1 })
        .lean();

      const seen = new Set();
      let scoreSum = 0;
      let count = 0;

      snapshots.forEach((s) => {
        const uid = s.userId.toString();
        if (!seen.has(uid) && s.overallScore !== null) {
          seen.add(uid);
          scoreSum += s.overallScore;
          count++;
        }
      });

      report.push({
        batchId: group.id,
        batchName: group.name,
        studentCount: group.userIds.length,
        resumesCreated: resumeCount,
        interviewsCompleted: interviewCount,
        avgReadiness: count > 0 ? Math.round(scoreSum / count) : 0,
      });
    }

    return res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    console.error("getBatchPerformanceReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate batch performance report.",
    });
  }
};

/**
 * Institutional skill gap report
 * GET /api/tpo/reports/skill-gaps
 */
export const getSkillGapReport = async (req, res) => {
  try {
    const activeLinks = await StudentInstitution.find({
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    })
      .select("userId")
      .lean();

    const userIds = activeLinks.map((l) => l.userId).filter(Boolean);

    const interviewResults = await InterviewResult.find({
      userId: { $in: userIds },
    })
      .select("weaknesses missedKeywords role")
      .lean();

    const weaknessFrequency = {};
    const keywordFrequency = {};
    const roleMap = {};

    interviewResults.forEach((r) => {
      if (Array.isArray(r.weaknesses)) {
        r.weaknesses.forEach((w) => {
          if (w) {
            const clean = w.trim();
            weaknessFrequency[clean] = (weaknessFrequency[clean] || 0) + 1;
          }
        });
      }
      if (Array.isArray(r.missedKeywords)) {
        r.missedKeywords.forEach((k) => {
          if (k) {
            const clean = k.trim();
            keywordFrequency[clean] = (keywordFrequency[clean] || 0) + 1;
          }
        });
      }
      if (r.role) {
        roleMap[r.role] = (roleMap[r.role] || 0) + 1;
      }
    });

    const topWeaknesses = Object.entries(weaknessFrequency)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topMissedKeywords = Object.entries(keywordFrequency)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return res.json({
      success: true,
      data: {
        totalEvaluatedSessions: interviewResults.length,
        topWeaknesses,
        topMissedKeywords,
        roleDistribution: Object.entries(roleMap).map(([role, count]) => ({
          role,
          count,
        })),
      },
    });
  } catch (error) {
    console.error("getSkillGapReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate skill gap report.",
    });
  }
};

/**
 * Individual student comprehensive progress report
 * GET /api/tpo/reports/students/:studentId
 */
export const getStudentProgressReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const user = await User.findById(studentId)
      .select("name email createdAt lastLogin")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const resumes = await Resume.find({ userId: studentId })
      .select("resumeTitle createdAt updatedAt skills templateId")
      .sort({ createdAt: 1 })
      .lean();

    const interviews = await InterviewResult.find({ userId: studentId })
      .select("overallScore skillBreakdown role interviewType createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const submissions = await AssignmentSubmission.find({
      userId: studentId,
      institutionId: req.institutionId,
    })
      .populate("assignmentId", "title type dueDate")
      .lean();

    const readinessHistory = await ReadinessSnapshot.find({
      userId: studentId,
      institutionId: req.institutionId,
    })
      .sort({ computedAt: 1 })
      .select("overallScore computedAt components")
      .lean();

    return res.json({
      success: true,
      data: {
        student: user,
        resumeTimeline: resumes,
        interviewTimeline: interviews,
        assignmentSubmissions: submissions,
        readinessTimeline: readinessHistory,
      },
    });
  } catch (error) {
    console.error("getStudentProgressReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate student progress report.",
    });
  }
};

/**
 * Assignment completion report across institution
 * GET /api/tpo/reports/assignment-completion
 */
export const getAssignmentCompletionReport = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      institutionId: req.institutionId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const report = [];

    for (const a of assignments) {
      const submissions = await AssignmentSubmission.find({
        assignmentId: a._id,
      }).lean();
      const submittedCount = submissions.filter(
        (s) => s.status === "submitted",
      ).length;
      const totalCount = submissions.length;

      const scores = submissions
        .filter((s) => s.score !== undefined)
        .map((s) => s.score);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)
          : null;

      report.push({
        id: a._id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate,
        status: a.status,
        totalAssigned: totalCount,
        totalSubmitted: submittedCount,
        completionRate:
          totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0,
        averageScore: avgScore,
      });
    }

    return res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    console.error("getAssignmentCompletionReport error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to compile assignment completion report.",
    });
  }
};

/**
 * Export students list as CSV
 * GET /api/tpo/reports/export/students
 */
export const exportStudentsCSV = async (req, res) => {
  try {
    const activeLinks = await StudentInstitution.find({
      institutionId: req.institutionId,
    })
      .populate("userId", "name email lastLogin createdAt usage")
      .lean();

    const institution = await Institution.findById(req.institutionId)
      .select("departments batches")
      .lean();

    const deptMap = {};
    institution?.departments?.forEach((d) => {
      deptMap[d._id.toString()] = d.name;
    });

    const batchMap = {};
    institution?.batches?.forEach((b) => {
      batchMap[b._id.toString()] = b.name;
    });

    // CSV Header
    let csv =
      "Name,Email,Roll Number,Department,Batch,Status,Consent,Resumes Created,Interviews Completed,Last Active\n";

    for (const link of activeLinks) {
      const u = link.userId || {};
      const name = `"${(u.name || "").replace(/"/g, '""')}"`;
      const email = `"${(u.email || "").replace(/"/g, '""')}"`;
      const roll = `"${(link.rollNumber || "").replace(/"/g, '""')}"`;
      const dept = `"${(link.departmentId ? deptMap[link.departmentId.toString()] || "N/A" : "N/A").replace(/"/g, '""')}"`;
      const batch = `"${(link.batchId ? batchMap[link.batchId.toString()] || "N/A" : "N/A").replace(/"/g, '""')}"`;
      const status = link.status;
      const consent = link.consentGiven ? "Yes" : "No";
      const resumes = u.usage?.resumesCreated || 0;
      const interviews = 0; // count from usage if present
      const lastActive =
        link.lastActiveAt || u.lastLogin
          ? new Date(link.lastActiveAt || u.lastLogin)
              .toISOString()
              .split("T")[0]
          : "N/A";

      csv += `${name},${email},${roll},${dept},${batch},${status},${consent},${resumes},${interviews},${lastActive}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="smartnshine_students.csv"',
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.error("exportStudentsCSV error:", error);
    return res
      .status(500)
      .json({ success: false, message: "CSV export failed." });
  }
};

/**
 * Export readiness report as CSV
 * GET /api/tpo/reports/export/readiness
 */
export const exportReadinessCSV = async (req, res) => {
  try {
    const activeLinks = await StudentInstitution.find({
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    })
      .populate("userId", "name email")
      .lean();

    const userIds = activeLinks.map((l) => l.userId?._id).filter(Boolean);

    const snapshots = await ReadinessSnapshot.find({
      institutionId: req.institutionId,
      userId: { $in: userIds },
    })
      .sort({ computedAt: -1 })
      .lean();

    const snapshotMap = {};
    snapshots.forEach((s) => {
      const uid = s.userId.toString();
      if (!snapshotMap[uid]) snapshotMap[uid] = s;
    });

    let csv =
      "Name,Email,Roll Number,Overall Readiness,Resume Score,Interview Score,Technical Score,Engagement Score,Trend\n";

    for (const link of activeLinks) {
      const u = link.userId || {};
      const snap = snapshotMap[u._id?.toString()];

      const name = `"${(u.name || "").replace(/"/g, '""')}"`;
      const email = `"${(u.email || "").replace(/"/g, '""')}"`;
      const roll = `"${(link.rollNumber || "").replace(/"/g, '""')}"`;
      const overall = snap?.overallScore !== null ? snap?.overallScore : "N/A";
      const resume =
        snap?.components?.resume?.score !== null
          ? snap?.components.resume.score
          : "N/A";
      const interview =
        snap?.components?.interview?.score !== null
          ? snap?.components.interview.score
          : "N/A";
      const tech =
        snap?.components?.technical?.score !== null
          ? snap?.components.technical.score
          : "N/A";
      const eng =
        snap?.components?.engagement?.score !== null
          ? snap?.components.engagement.score
          : "N/A";
      const trend = snap?.trend || "N/A";

      csv += `${name},${email},${roll},${overall},${resume},${interview},${tech},${eng},${trend}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="smartnshine_readiness_report.csv"',
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.error("exportReadinessCSV error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Readiness CSV export failed." });
  }
};

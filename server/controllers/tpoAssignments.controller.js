/**
 * TPO Assignments Controller
 * Handles all assignment-related operations for the SmartNShine TPO Dashboard.
 * All queries are scoped to institutionId for strict data isolation.
 */

import Assignment from "../models/Assignment.model.js";
import AssignmentSubmission from "../models/AssignmentSubmission.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import User from "../models/User.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import Resume from "../models/Resume.model.js";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the list of student userIds that should receive this assignment,
 * based on targetType and the accompanying filter arrays.
 * Only active, consented students belonging to the institution are returned.
 *
 * @param {string} institutionId
 * @param {string} targetType  - "all" | "batch" | "department" | "individual"
 * @param {object} filters     - { targetBatchIds, targetDepartmentIds, targetStudentIds }
 * @returns {Promise<mongoose.Types.ObjectId[]>}
 */
async function resolveTargetStudents(institutionId, targetType, filters = {}) {
  const baseQuery = {
    institutionId,
    status: "active",
    consentGiven: true,
  };

  switch (targetType) {
    case "all": {
      const links = await StudentInstitution.find(baseQuery)
        .select("userId")
        .lean();
      return links.map((l) => l.userId);
    }

    case "batch": {
      const { targetBatchIds = [] } = filters;
      if (!targetBatchIds.length) return [];
      const links = await StudentInstitution.find({
        ...baseQuery,
        batchId: { $in: targetBatchIds },
      })
        .select("userId")
        .lean();
      return links.map((l) => l.userId);
    }

    case "department": {
      const { targetDepartmentIds = [] } = filters;
      if (!targetDepartmentIds.length) return [];
      const links = await StudentInstitution.find({
        ...baseQuery,
        departmentId: { $in: targetDepartmentIds },
      })
        .select("userId")
        .lean();
      return links.map((l) => l.userId);
    }

    case "individual": {
      const { targetStudentIds = [] } = filters;
      if (!targetStudentIds.length) return [];
      // Verify each student is an active, consented member of this institution
      const links = await StudentInstitution.find({
        ...baseQuery,
        userId: { $in: targetStudentIds },
      })
        .select("userId")
        .lean();
      return links.map((l) => l.userId);
    }

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// 1. createAssignment  — POST /api/tpo/assignments
// ---------------------------------------------------------------------------

/**
 * Create a new assignment and auto-create submission records for each
 * targeted student.
 */
export const createAssignment = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const createdBy = req.user.userId;

    const {
      title,
      description,
      type,
      targetType = "all",
      targetBatchIds = [],
      targetDepartmentIds = [],
      targetStudentIds = [],
      startDate,
      dueDate,
      requirements = {},
      sendReminders = true,
      reminderDaysBefore = 1,
    } = req.body;

    // --- Validation ---
    if (!title || !type || !startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "title, type, startDate, and dueDate are required.",
      });
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (due <= start) {
      return res.status(400).json({
        success: false,
        message: "dueDate must be after startDate.",
      });
    }

    // --- Resolve targeted students ---
    const studentIds = await resolveTargetStudents(institutionId, targetType, {
      targetBatchIds,
      targetDepartmentIds,
      targetStudentIds,
    });

    // --- Create the Assignment document ---
    const assignment = await Assignment.create({
      institutionId,
      createdBy,
      title,
      description,
      type,
      targetType,
      targetBatchIds,
      targetDepartmentIds,
      targetStudentIds,
      startDate: start,
      dueDate: due,
      requirements,
      sendReminders,
      reminderDaysBefore,
      status: "active",
      "stats.totalAssigned": studentIds.length,
    });

    // --- Bulk-create one AssignmentSubmission per student ---
    if (studentIds.length > 0) {
      const submissions = studentIds.map((userId) => ({
        assignmentId: assignment._id,
        userId,
        institutionId,
        status: "assigned",
      }));

      // insertMany with ordered:false so a duplicate doesn't abort the rest
      await AssignmentSubmission.insertMany(submissions, { ordered: false }).catch(
        (err) => {
          // Ignore duplicate key errors (student already had this assignment)
          if (err.code !== 11000) throw err;
        }
      );
    }

    return res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error("❌ createAssignment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create assignment." });
  }
};

// ---------------------------------------------------------------------------
// 2. getAssignments  — GET /api/tpo/assignments
// ---------------------------------------------------------------------------

/**
 * Return a paginated list of assignments for the institution.
 * Query params: status, type, page, limit
 */
export const getAssignments = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { status, type, page = 1, limit = 20 } = req.query;

    const filter = { institutionId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Assignment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ getAssignments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch assignments." });
  }
};

// ---------------------------------------------------------------------------
// 3. getAssignment  — GET /api/tpo/assignments/:assignmentId
// ---------------------------------------------------------------------------

/**
 * Return a single assignment with a submission status breakdown.
 */
export const getAssignment = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      institutionId,
    }).lean();

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found." });
    }

    // Submission status breakdown
    const submissionBreakdown = await AssignmentSubmission.aggregate([
      { $match: { assignmentId: new mongoose.Types.ObjectId(assignmentId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const breakdown = submissionBreakdown.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: { ...assignment, submissionBreakdown: breakdown },
    });
  } catch (error) {
    console.error("❌ getAssignment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch assignment." });
  }
};

// ---------------------------------------------------------------------------
// 4. updateAssignment  — PUT /api/tpo/assignments/:assignmentId
// ---------------------------------------------------------------------------

/**
 * Update allowed fields on an assignment.
 * Note: targetType cannot be changed after creation.
 */
export const updateAssignment = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { assignmentId } = req.params;

    const { title, description, dueDate, status } = req.body;

    // Explicitly disallow targetType changes
    if ("targetType" in req.body) {
      return res.status(400).json({
        success: false,
        message: "targetType cannot be changed after an assignment is created.",
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      institutionId,
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found." });
    }

    if (assignment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled assignments cannot be updated.",
      });
    }

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (status !== undefined) assignment.status = status;

    if (dueDate !== undefined) {
      const due = new Date(dueDate);
      if (due <= assignment.startDate) {
        return res.status(400).json({
          success: false,
          message: "dueDate must be after startDate.",
        });
      }
      assignment.dueDate = due;
    }

    await assignment.save();

    return res.json({ success: true, data: assignment });
  } catch (error) {
    console.error("❌ updateAssignment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update assignment." });
  }
};

// ---------------------------------------------------------------------------
// 5. deleteAssignment  — DELETE /api/tpo/assignments/:assignmentId
// ---------------------------------------------------------------------------

/**
 * Soft-delete an assignment by setting status to "cancelled".
 */
export const deleteAssignment = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, institutionId },
      { status: "cancelled" },
      { new: true }
    );

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found." });
    }

    return res.json({
      success: true,
      data: { message: "Assignment cancelled successfully.", assignment },
    });
  } catch (error) {
    console.error("❌ deleteAssignment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel assignment." });
  }
};

// ---------------------------------------------------------------------------
// 6. getAssignmentSubmissions  — GET /api/tpo/assignments/:assignmentId/submissions
// ---------------------------------------------------------------------------

/**
 * Return all submissions for an assignment, joined with basic student info.
 */
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { assignmentId } = req.params;

    // Verify assignment belongs to this institution
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      institutionId,
    })
      .select("_id title")
      .lean();

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found." });
    }

    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate("userId", "name email profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: { assignment, submissions } });
  } catch (error) {
    console.error("❌ getAssignmentSubmissions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch submissions." });
  }
};

// ---------------------------------------------------------------------------
// 7. getStudentAssignments  — GET /api/tpo/assignments/student/:studentId
// ---------------------------------------------------------------------------

/**
 * Return all assignments for a specific student along with their submission status.
 * Scoped to the TPO's institution.
 */
export const getStudentAssignments = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { studentId } = req.params;

    // Verify the student belongs to this institution
    const link = await StudentInstitution.findOne({
      userId: studentId,
      institutionId,
      status: "active",
    }).lean();

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this institution.",
      });
    }

    // Fetch all submission records for this student in this institution
    const submissions = await AssignmentSubmission.find({
      userId: studentId,
      institutionId,
    })
      .populate({
        path: "assignmentId",
        select: "title type status startDate dueDate requirements stats",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: submissions });
  } catch (error) {
    console.error("❌ getStudentAssignments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch student assignments." });
  }
};

// ---------------------------------------------------------------------------
// 8. markSubmissionReviewed  — PUT /api/tpo/assignments/:assignmentId/submissions/:userId
// ---------------------------------------------------------------------------

/**
 * Allow a TPO to add notes and mark a submission as reviewed.
 */
export const markSubmissionReviewed = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const reviewedBy = req.user.userId;
    const { assignmentId, userId } = req.params;
    const { tpoNotes } = req.body;

    // Verify assignment belongs to this institution
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      institutionId,
    })
      .select("_id")
      .lean();

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found." });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId, userId, institutionId },
      {
        reviewedBy,
        reviewedAt: new Date(),
        ...(tpoNotes !== undefined && { tpoNotes }),
      },
      { new: true }
    ).populate("userId", "name email");

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found." });
    }

    return res.json({ success: true, data: submission });
  } catch (error) {
    console.error("❌ markSubmissionReviewed error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to mark submission as reviewed." });
  }
};

// ---------------------------------------------------------------------------
// 9. getAssignmentStats  — GET /api/tpo/assignments/:assignmentId/stats
// ---------------------------------------------------------------------------

/**
 * Return detailed stats for an assignment:
 * completion rate, avg score, and department/batch breakdown.
 */
export const getAssignmentStats = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      institutionId,
    })
      .select("title stats targetType")
      .lean();

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found." });
    }

    const assignmentObjId = new mongoose.Types.ObjectId(assignmentId);

    // Overall submission breakdown
    const [statusBreakdown, scoreStats] = await Promise.all([
      AssignmentSubmission.aggregate([
        { $match: { assignmentId: assignmentObjId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      AssignmentSubmission.aggregate([
        {
          $match: {
            assignmentId: assignmentObjId,
            score: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            avgScore: { $avg: "$score" },
            minScore: { $min: "$score" },
            maxScore: { $max: "$score" },
            scoredCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Department-level breakdown: join submissions → StudentInstitution
    const departmentBreakdown = await AssignmentSubmission.aggregate([
      { $match: { assignmentId: assignmentObjId } },
      {
        $lookup: {
          from: "studentinstitutions",
          localField: "userId",
          foreignField: "userId",
          as: "link",
        },
      },
      { $unwind: { path: "$link", preserveNullAndEmpty: true } },
      {
        $match: { "link.institutionId": new mongoose.Types.ObjectId(institutionId) },
      },
      {
        $group: {
          _id: "$link.departmentId",
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                { $in: ["$status", ["submitted", "late-submitted"]] },
                1,
                0,
              ],
            },
          },
          avgScore: { $avg: "$score" },
        },
      },
    ]);

    const statusMap = statusBreakdown.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    const completed =
      (statusMap["submitted"] || 0) + (statusMap["late-submitted"] || 0);
    const total = assignment.stats?.totalAssigned || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const scoreData = scoreStats[0] || {};

    return res.json({
      success: true,
      data: {
        assignment,
        completionRate,
        statusBreakdown: statusMap,
        avgScore: scoreData.avgScore ? Math.round(scoreData.avgScore) : null,
        minScore: scoreData.minScore ?? null,
        maxScore: scoreData.maxScore ?? null,
        scoredSubmissions: scoreData.scoredCount ?? 0,
        departmentBreakdown,
      },
    });
  } catch (error) {
    console.error("❌ getAssignmentStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch assignment stats." });
  }
};

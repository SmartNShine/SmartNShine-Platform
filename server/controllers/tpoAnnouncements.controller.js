/**
 * TPO Announcements Controller
 * Handles all announcement-related operations for the SmartNShine TPO Dashboard.
 * All queries are scoped to institutionId for strict data isolation.
 */

import Announcement from "../models/Announcement.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Mongoose query filter that selects announcements visible to a given
 * student based on their batch and department membership.
 *
 * @param {object} studentLink  - StudentInstitution document (lean)
 * @returns {object} Mongoose filter
 */
function buildStudentAnnouncementFilter(studentLink) {
  const { institutionId, userId, batchId, departmentId } = studentLink;
  const targets = [
    { targetType: "all" },
    { targetType: "individual", targetStudentIds: userId },
  ];
  if (batchId) targets.push({ targetType: "batch", targetBatchIds: batchId });
  if (departmentId) {
    targets.push({ targetType: "department", targetDepartmentIds: departmentId });
  }

  return {
    institutionId,
    status: "published",
    $or: targets,
  };
}

async function getStudentAnnouncementFilters(userId) {
  const links = await StudentInstitution.find({ userId, status: "active" })
    .select("institutionId userId batchId departmentId")
    .populate({
      path: "institutionId",
      select: "_id",
      match: { status: { $nin: ["suspended", "rejected"] } },
    })
    .lean();
  return links
    .filter((link) => link.institutionId)
    .map((link) =>
      buildStudentAnnouncementFilter({ ...link, institutionId: link.institutionId._id }),
    );
}

// ---------------------------------------------------------------------------
// 1. createAnnouncement  — POST /api/tpo/announcements
// ---------------------------------------------------------------------------

/**
 * Create and immediately publish a new announcement.
 */
export const createAnnouncement = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const createdBy = req.user.userId;

    const {
      title,
      content,
      type = "general",
      targetType = "all",
      targetBatchIds = [],
      targetDepartmentIds = [],
      targetStudentIds = [],
      relatedAssignmentId,
      expiresAt,
      isPinned = false,
      priority = "medium",
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "title and content are required.",
      });
    }

    const announcement = await Announcement.create({
      institutionId,
      createdBy,
      title,
      content,
      type,
      targetType,
      targetBatchIds,
      targetDepartmentIds,
      targetStudentIds,
      ...(relatedAssignmentId && { relatedAssignmentId }),
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      isPinned,
      priority,
      status: "published",
      publishedAt: new Date(),
    });

    return res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error("❌ createAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create announcement." });
  }
};

// ---------------------------------------------------------------------------
// 2. getAnnouncements  — GET /api/tpo/announcements
// ---------------------------------------------------------------------------

/**
 * Return a paginated list of announcements for the institution.
 * Query params: status, type, page, limit
 */
export const getAnnouncements = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { status, type, page = 1, limit = 20 } = req.query;

    const filter = { institutionId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ isPinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    // Attach readCount to each announcement (avoids exposing the full readBy array)
    const enriched = announcements.map((a) => ({
      ...a,
      readCount: a.readBy ? a.readBy.length : 0,
      readBy: undefined, // strip raw array from list view
    }));

    return res.json({
      success: true,
      data: {
        announcements: enriched,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ getAnnouncements error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch announcements." });
  }
};

// ---------------------------------------------------------------------------
// 3. getAnnouncement  — GET /api/tpo/announcements/:id
// ---------------------------------------------------------------------------

/**
 * Return full detail for a single announcement, including full readBy list.
 */
export const getAnnouncement = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { id } = req.params;

    const announcement = await Announcement.findOne({ _id: id, institutionId })
      .populate("createdBy", "name email")
      .populate("relatedAssignmentId", "title type status")
      .lean();

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    return res.json({
      success: true,
      data: {
        ...announcement,
        readCount: announcement.readBy ? announcement.readBy.length : 0,
      },
    });
  } catch (error) {
    console.error("❌ getAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch announcement." });
  }
};

// ---------------------------------------------------------------------------
// 4. updateAnnouncement  — PUT /api/tpo/announcements/:id
// ---------------------------------------------------------------------------

/**
 * Update editable fields of an announcement.
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { id } = req.params;

    const allowedUpdates = [
      "title",
      "content",
      "type",
      "expiresAt",
      "isPinned",
      "priority",
      "status",
      "relatedAssignmentId",
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
    }

    const announcement = await Announcement.findOneAndUpdate(
      { _id: id, institutionId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    return res.json({ success: true, data: announcement });
  } catch (error) {
    console.error("❌ updateAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update announcement." });
  }
};

// ---------------------------------------------------------------------------
// 5. deleteAnnouncement  — DELETE /api/tpo/announcements/:id
// ---------------------------------------------------------------------------

/**
 * Soft-delete an announcement by setting status to "cancelled".
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { id } = req.params;

    const announcement = await Announcement.findOneAndUpdate(
      { _id: id, institutionId },
      { status: "cancelled" },
      { new: true }
    );

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    return res.json({
      success: true,
      data: { message: "Announcement cancelled successfully.", announcement },
    });
  } catch (error) {
    console.error("❌ deleteAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel announcement." });
  }
};

// ---------------------------------------------------------------------------
// 6. pinAnnouncement  — PUT /api/tpo/announcements/:id/pin
// ---------------------------------------------------------------------------

/**
 * Toggle the pinned state of an announcement.
 */
export const pinAnnouncement = async (req, res) => {
  try {
    const institutionId = req.institutionId;
    const { id } = req.params;

    const announcement = await Announcement.findOne({ _id: id, institutionId });

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    return res.json({
      success: true,
      data: {
        isPinned: announcement.isPinned,
        message: announcement.isPinned
          ? "Announcement pinned."
          : "Announcement unpinned.",
      },
    });
  } catch (error) {
    console.error("❌ pinAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle pin." });
  }
};

// ---------------------------------------------------------------------------
// 7. getStudentAnnouncements  — GET /api/tpo/announcements/for-student/:studentId
// ---------------------------------------------------------------------------

/**
 * Return all published announcements that apply to a specific student
 * based on their batch and department membership in the institution.
 */
export const getStudentAnnouncements = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const filters = await getStudentAnnouncementFilters(studentId);
    if (!filters.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this institution.",
      });
    }

    const announcements = await Announcement.find({ $or: filters })
      .sort({ isPinned: -1, publishedAt: -1 })
      .lean();

    // Annotate each announcement with whether this student has read it
    const studentObjId = new mongoose.Types.ObjectId(studentId);

    const enriched = announcements.map((a) => ({
      ...a,
      isRead: (a.readBy || []).some(
        (r) => r.userId && r.userId.equals(studentObjId)
      ),
      readCount: a.readBy ? a.readBy.length : 0,
      readBy: undefined, // strip from student-facing view
    }));

    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("❌ getStudentAnnouncements error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch student announcements." });
  }
};

// ---------------------------------------------------------------------------
// 8. markRead  — POST /api/tpo/announcements/:id/read
// ---------------------------------------------------------------------------

/**
 * Mark an announcement as read by the authenticated student.
 * Idempotent — calling it multiple times has no adverse effect.
 */
export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid announcement ID." });
    }

    const filters = await getStudentAnnouncementFilters(userId);
    const filter = { _id: id, $or: filters };
    if (!filters.length || !(await Announcement.exists(filter))) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    const result = await Announcement.updateOne(
      { ...filter, "readBy.userId": { $ne: userId } },
      { $push: { readBy: { userId, readAt: new Date() } } },
    );
    const alreadyRead = result.modifiedCount === 0;

    return res.json({
      success: true,
      data: { message: "Announcement marked as read.", alreadyRead },
    });
  } catch (error) {
    console.error("❌ markRead error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to mark announcement as read." });
  }
};

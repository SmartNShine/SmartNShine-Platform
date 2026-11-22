import mongoose from "mongoose";

/**
 * Announcement Model
 * TPO-created announcements sent to students.
 */
const announcementSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // TPO user
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ["general", "assignment", "assessment", "reminder", "urgent"],
      default: "general",
    },
    // Targeting
    targetType: {
      type: String,
      enum: ["all", "batch", "department", "individual"],
      default: "all",
    },
    targetBatchIds: [{ type: mongoose.Schema.Types.ObjectId }],
    targetDepartmentIds: [{ type: mongoose.Schema.Types.ObjectId }],
    targetStudentIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    // Related assignment (if announcement is about one)
    relatedAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
    // Scheduling
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "published", "expired", "cancelled"],
      default: "published",
      index: true,
    },
    // Read tracking (array of userIds who have read it)
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ institutionId: 1, status: 1, publishedAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;


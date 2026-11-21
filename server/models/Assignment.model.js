import mongoose from "mongoose";

/**
 * Assignment Model
 * TPO-created tasks assigned to students or batches.
 * Integrated with SmartNShine Resume Builder and Interview Simulator.
 */
const assignmentSchema = new mongoose.Schema(
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
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // Assignment type — integrates with existing SmartNShine features
    type: {
      type: String,
      enum: [
        "create-resume",        // Resume Builder
        "improve-resume",       // Resume Builder improvement
        "technical-interview",  // AI Interview Simulator — technical
        "behavioral-interview", // AI Interview Simulator — behavioral
        "mock-interview",       // AI Interview Simulator — general
        "ats-check",            // ATS Analyzer
        "practice-skill",       // Open-ended skill practice
        "custom",               // Custom TPO task
      ],
      required: true,
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
    // Scheduling
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    // Requirements / criteria
    requirements: {
      minResumeScore: { type: Number, min: 0, max: 100 },
      minInterviewScore: { type: Number, min: 0, max: 100 },
      specificSkills: [{ type: String }],
      interviewType: {
        type: String,
        enum: ["technical", "behavioral", "mixed", "resume-based"],
      },
    },
    // Status
    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    // Notifications
    sendReminders: {
      type: Boolean,
      default: true,
    },
    reminderDaysBefore: {
      type: Number,
      default: 1,
    },
    // Stats cache
    stats: {
      totalAssigned: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ institutionId: 1, status: 1 });
assignmentSchema.index({ institutionId: 1, dueDate: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;


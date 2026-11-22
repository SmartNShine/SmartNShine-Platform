import mongoose from "mongoose";

/**
 * AssignmentSubmission Model
 * Tracks student completion of assignments.
 * Links to existing Resume or InterviewSession records.
 */
const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "assigned",
        "in-progress",
        "submitted",
        "late-submitted",
        "missed",
      ],
      default: "assigned",
      index: true,
    },
    // Link to actual SmartNShine resource created for this assignment
    linkedResourceType: {
      type: String,
      enum: ["resume", "interview-session", "interview-result", null],
      default: null,
    },
    linkedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Score / performance on this assignment
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
    // TPO acknowledgement
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    tpoNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Unique: one submission per student per assignment
assignmentSubmissionSchema.index(
  { assignmentId: 1, userId: 1 },
  { unique: true },
);
assignmentSubmissionSchema.index({ userId: 1, status: 1 });

const AssignmentSubmission = mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema,
);

export default AssignmentSubmission;

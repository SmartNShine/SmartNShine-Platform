import mongoose from "mongoose";

/**
 * StudentInstitution Model
 * Represents the link between a SmartNShine student (User) and an Institution.
 * A student can belong to only one institution at a time.
 * Requires student consent before TPO can access their data.
 */
const studentInstitutionSchema = new mongoose.Schema(
  {
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
    // Academic info
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    // Link status
    status: {
      type: String,
      enum: ["pending", "active", "deactivated", "rejected"],
      default: "pending",
      index: true,
    },
    // Invitation tracking
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // TPO user who invited
    },
    invitedAt: {
      type: Date,
    },
    inviteToken: {
      type: String,
      index: true,
      sparse: true,
    },
    inviteTokenExpires: {
      type: Date,
    },
    // Consent
    consentGiven: {
      type: Boolean,
      default: false,
    },
    consentGivenAt: {
      type: Date,
    },
    // Data access permissions (what TPO can see for this student)
    dataPermissions: {
      viewResumeSummary: { type: Boolean, default: true },
      viewResumeContent: { type: Boolean, default: false },
      viewInterviewScores: { type: Boolean, default: true },
      viewInterviewDetails: { type: Boolean, default: false },
    },
    // Activity tracking
    lastActiveAt: {
      type: Date,
    },
    linkedAt: {
      type: Date,
    },
    deactivatedAt: {
      type: Date,
    },
    deactivatedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one student per institution
studentInstitutionSchema.index(
  { userId: 1, institutionId: 1 },
  { unique: true }
);
studentInstitutionSchema.index({ institutionId: 1, status: 1 });

const StudentInstitution = mongoose.model(
  "StudentInstitution",
  studentInstitutionSchema
);

export default StudentInstitution;


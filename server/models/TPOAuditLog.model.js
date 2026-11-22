import mongoose from "mongoose";

/**
 * TPOAuditLog Model
 * Immutable audit trail for all TPO actions on student data.
 * Required for security compliance and institutional accountability.
 */
const tpoAuditLogSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    tpoUserId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "tpoModel",
      required: true,
      index: true,
    },
    tpoModel: {
      type: String,
      enum: ["TPO", "User"],
      default: "TPO",
    },
    // Action category
    action: {
      type: String,
      enum: [
        "student.view",
        "student.invite",
        "student.deactivate",
        "student.import",
        "resume.view",
        "resume.analytics",
        "interview.view",
        "interview.analytics",
        "readiness.view",
        "assignment.create",
        "assignment.update",
        "assignment.delete",
        "announcement.create",
        "announcement.delete",
        "report.export",
        "institution.settings.update",
        "tpo.register",
        "tpo.login",
        "tpo.logout",
        "tpo.invite",
        "institution.create",
      ],
      required: true,
    },
    // Target of the action
    targetType: {
      type: String,
      enum: ["student", "resume", "interview", "assignment", "announcement", "report", "institution", "tpo"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Context
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    // Result
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Prevent modification of audit logs
    versionKey: false,
  }
);

tpoAuditLogSchema.index({ institutionId: 1, createdAt: -1 });
tpoAuditLogSchema.index({ tpoUserId: 1, createdAt: -1 });
tpoAuditLogSchema.index({ action: 1, institutionId: 1 });

const TPOAuditLog = mongoose.model("TPOAuditLog", tpoAuditLogSchema);

export default TPOAuditLog;


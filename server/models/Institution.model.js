import mongoose from "mongoose";
import { normalizeInstitutionStatus } from "../utils/institutionStatus.js";

/**
 * Institution Model
 * Represents a college/university onboarded to SmartNShine TPO system
 */
const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    type: { type: String, trim: true, default: "Engineering" }, // e.g. "Engineering", "Management", "Computer Applications", "Sciences", "Medical/Pharmacy", "Commerce", "Arts/Humanities", "Other"
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "2024-2028"
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: "India" },
      pincode: String,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    // Email domain for auto-linking students (optional)
    emailDomain: {
      type: String,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    // Academic structure
    departments: [departmentSchema],
    batches: [batchSchema],
    /** Max students (pending + active links) allowed on the platform for this campus */
    studentLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    // Institution-level settings
    settings: {
      allowStudentSelfLink: { type: Boolean, default: true },
      requireStudentConsent: { type: Boolean, default: true },
      showResumeContent: { type: Boolean, default: false }, // TPOs see summary only
      showDetailedScores: { type: Boolean, default: true },
      readinessWeights: {
        resume: { type: Number, default: 30 },
        interview: { type: Number, default: 40 },
        technical: { type: Number, default: 20 },
        engagement: { type: Number, default: 10 },
      },
    },
    // Stats cache (refreshed periodically)
    statsCache: {
      totalStudents: { type: Number, default: 0 },
      activeStudents: { type: Number, default: 0 },
      avgReadinessScore: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

institutionSchema.pre("validate", function coerceCampusStatus() {
  this.status = normalizeInstitutionStatus(this.status);
});

institutionSchema.index({ name: 1 });
institutionSchema.index({ emailDomain: 1 });

const Institution = mongoose.model("Institution", institutionSchema);

export default Institution;


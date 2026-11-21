import mongoose from "mongoose";

/**
 * ReadinessSnapshot Model
 * Cached readiness scores per student per institution.
 * Computed from actual Resume + InterviewResult + User.usage data.
 * Never invented — missing components are clearly noted.
 */
const readinessSnapshotSchema = new mongoose.Schema(
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
    // Computed overall score (0-100)
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Component scores (null = no data available)
    components: {
      resume: {
        score: { type: Number, min: 0, max: 100, default: null },
        weight: { type: Number, default: 30 },
        dataAvailable: { type: Boolean, default: false },
        details: {
          totalResumes: { type: Number, default: 0 },
          bestScore: { type: Number, default: null },
          completionRate: { type: Number, default: null },
          skillCount: { type: Number, default: 0 },
          hasExperience: { type: Boolean, default: false },
          hasProjects: { type: Boolean, default: false },
          hasCertifications: { type: Boolean, default: false },
        },
      },
      interview: {
        score: { type: Number, min: 0, max: 100, default: null },
        weight: { type: Number, default: 40 },
        dataAvailable: { type: Boolean, default: false },
        details: {
          totalInterviews: { type: Number, default: 0 },
          avgScore: { type: Number, default: null },
          bestScore: { type: Number, default: null },
          technicalScore: { type: Number, default: null },
          communicationScore: { type: Number, default: null },
          completionRate: { type: Number, default: null },
        },
      },
      technical: {
        score: { type: Number, min: 0, max: 100, default: null },
        weight: { type: Number, default: 20 },
        dataAvailable: { type: Boolean, default: false },
        details: {
          skillsFromResume: [{ type: String }],
          technicalInterviewScore: { type: Number, default: null },
          topicBreakdown: { type: mongoose.Schema.Types.Mixed },
        },
      },
      engagement: {
        score: { type: Number, min: 0, max: 100, default: null },
        weight: { type: Number, default: 10 },
        dataAvailable: { type: Boolean, default: false },
        details: {
          resumesCreated: { type: Number, default: 0 },
          interviewsCompleted: { type: Number, default: 0 },
          lastActiveAt: { type: Date, default: null },
          platformDaysActive: { type: Number, default: 0 },
        },
      },
    },
    // Explainability
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],
    skillGaps: [{ type: String }],
    // Trend
    previousScore: { type: Number, default: null },
    scoreChange: { type: Number, default: null },
    trend: {
      type: String,
      enum: ["improving", "stable", "declining", "new"],
      default: "new",
    },
    // Metadata
    computedAt: {
      type: Date,
      default: Date.now,
    },
    dataCompleteness: {
      type: Number, // 0-100 percentage of how much data was available
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

readinessSnapshotSchema.index({ userId: 1, institutionId: 1 });
readinessSnapshotSchema.index({ institutionId: 1, overallScore: -1 });
readinessSnapshotSchema.index({ computedAt: -1 });

// Unique: one current snapshot per student per institution
readinessSnapshotSchema.index(
  { userId: 1, institutionId: 1, computedAt: -1 }
);

const ReadinessSnapshot = mongoose.model(
  "ReadinessSnapshot",
  readinessSnapshotSchema
);

export default ReadinessSnapshot;


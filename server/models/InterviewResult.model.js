import mongoose from "mongoose";

/**
 * Skill Breakdown Schema
 * Represents scores for different skill areas
 */
const skillBreakdownSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    questionsAsked: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
    },
  },
  {_id: false}
);

/**
 * Interview Result Schema
 * Stores the final analysis and report for a completed interview
 */
const interviewResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      unique: true,
      index: true,
    },
    // Overall Scores
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    // Skill-wise Breakdown
    skillBreakdown: {
      communication: {
        score: {type: Number, min: 0, max: 100, default: 0},
        feedback: String,
      },
      technicalKnowledge: {
        score: {type: Number, min: 0, max: 100, default: 0},
        feedback: String,
      },
      problemSolving: {
        score: {type: Number, min: 0, max: 100, default: 0},
        feedback: String,
      },
      situationalAwareness: {
        score: {type: Number, min: 0, max: 100, default: 0},
        feedback: String,
      },
      culturalFit: {
        score: {type: Number, min: 0, max: 100, default: 0},
        feedback: String,
      },
    },
    // 5D Executive Radar Competencies
    radarCompetencies: {
      technicalDepth: { score: { type: Number, default: 0 }, summary: String },
      architecturalTradeoffs: { score: { type: Number, default: 0 }, summary: String },
      evidenceAndGrounding: { score: { type: Number, default: 0 }, summary: String },
      starProblemSolving: { score: { type: Number, default: 0 }, summary: String },
      communicationSignal: { score: { type: Number, default: 0 }, summary: String },
    },
    // Topic-wise Breakdown (e.g., JavaScript, React, System Design)
    topicBreakdown: [skillBreakdownSchema],
    // Strengths & Weaknesses
    strengths: [
      {
        type: String,
      },
    ],
    weaknesses: [
      {
        type: String,
      },
    ],
    // Keywords Analysis
    expectedKeywords: [
      {
        type: String,
      },
    ],
    mentionedKeywords: [
      {
        type: String,
      },
    ],
    missedKeywords: [
      {
        type: String,
      },
    ],
    // Recommendations
    resumeImprovements: [
      {
        type: String,
      },
    ],
    practiceAreas: [
      {
        type: String,
      },
    ],
    resourceRecommendations: [
      {
        title: String,
        url: String,
        type: {type: String, enum: ["article", "video", "course", "book"]},
      },
    ],
    // 14-Day Growth Roadmap
    studyRoadmap: [
      {
        day: String,
        focus: String,
        recommendedResource: String,
      },
    ],
    // Summary
    summary: {
      type: String,
      required: true,
    },
    detailedFeedback: {
      type: String,
    },
    // Performance Metrics
    metrics: {
      totalQuestions: {type: Number, default: 0},
      answeredQuestions: {type: Number, default: 0},
      skippedQuestions: {type: Number, default: 0},
      averageTimePerQuestion: {type: Number, default: 0}, // in seconds
      totalDuration: {type: Number, default: 0}, // in seconds
      questionsAboveThreshold: {type: Number, default: 0}, // questions with score >= 70
    },
    // Video & Proctoring Audit
    videoRecordingUrl: {
      type: String,
      default: null,
    },
    proctoringAudit: {
      integrityScore: { type: Number, min: 0, max: 100, default: 100 },
      flagCounts: {
        phone: { type: Number, default: 0 },
        gaze: { type: Number, default: 0 },
        multipleFaces: { type: Number, default: 0 },
        absent: { type: Number, default: 0 },
        tabSwitch: { type: Number, default: 0 },
        identitySwitch: { type: Number, default: 0 },
        offline: { type: Number, default: 0 },
      },
      verdict: {
        type: String,
        enum: ["VERIFIED_CLEAN", "REVIEW_RECOMMENDED", "FLAGGED_SUSPICIOUS"],
        default: "VERIFIED_CLEAN",
      },
      events: [
        {
          timestampSeconds: Number,
          eventType: String,
          severity: String,
          confidence: Number,
          durationMs: Number,
          evidenceCount: Number,
          faceCount: Number,
          detectorVersion: String,
          meta: mongoose.Schema.Types.Mixed,
          snapshotUrl: String,
          details: String,
        },
      ],
    },
    // Comparison & Progress
    comparisonData: {
      previousScore: {type: Number},
      scoreChange: {type: Number},
      percentileRank: {type: Number}, // compared to other users in same role
      trend: {type: String, enum: ["improving", "stable", "declining"]},
    },
    // Interview Context (copied from session for quick access)
    interviewType: {
      type: String,
      enum: [
        "resume-based",
        "job-description",
        "technical",
        "behavioral",
        "mixed",
      ],
    },
    role: {
      type: String,
    },
    experienceLevel: {
      type: String,
    },
    // AI Model used for analysis
    aiModel: {
      type: String,
      enum: ["gemini", "gpt4o"],
    },
    // Hiring Recommendation
    hiringRecommendation: {
      recommendation: {
        type: String,
        enum: ["strong-hire", "hire", "maybe", "no-hire", "strong-no-hire"],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      reasoning: String,
    },
    // Flag for premium features
    isPremiumAnalysis: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
interviewResultSchema.index({userId: 1, createdAt: -1});
interviewResultSchema.index({role: 1, overallScore: -1});

// Virtual for grade
interviewResultSchema.virtual("grade").get(function () {
  const score = this.overallScore;
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  if (score >= 45) return "D";
  return "F";
});

// Virtual for performance level
interviewResultSchema.virtual("performanceLevel").get(function () {
  const score = this.overallScore;
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Average";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
});

// Static method to get user's improvement trend
interviewResultSchema.statics.getImprovementTrend = async function (
  userId,
  limit = 10
) {
  const results = await this.find({userId})
    .sort({createdAt: -1})
    .limit(limit)
    .select("overallScore createdAt role interviewType")
    .lean();

  return results.reverse(); // Oldest first for trend visualization
};

// Static method to calculate percentile for a role
interviewResultSchema.statics.calculatePercentile = async function (
  role,
  score
) {
  const allScores = await this.find({role}).select("overallScore").lean();

  if (allScores.length === 0) return 50; // Default to 50th percentile

  const scoresBelow = allScores.filter((r) => r.overallScore < score).length;
  return Math.round((scoresBelow / allScores.length) * 100);
};

// Static method to get role-wise stats
interviewResultSchema.statics.getRoleStats = async function (role) {
  const results = await this.find({role}).lean();

  if (results.length === 0) {
    return {averageScore: 0, totalInterviews: 0, topScore: 0};
  }

  const scores = results.map((r) => r.overallScore);
  return {
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    totalInterviews: results.length,
    topScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
  };
};

// Ensure virtuals are included in JSON
interviewResultSchema.set("toJSON", {virtuals: true});
interviewResultSchema.set("toObject", {virtuals: true});

const InterviewResult = mongoose.model(
  "InterviewResult",
  interviewResultSchema
);

export default InterviewResult;

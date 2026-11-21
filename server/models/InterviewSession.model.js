import mongoose from "mongoose";

/**
 * Interview Question Schema
 * Represents a single question in an interview session
 */
const interviewQuestionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: [
      "technical",
      "behavioral",
      "situational",
      "resume-based",
      "follow-up",
    ],
    default: "technical",
  },
  category: {
    type: String, // e.g., "JavaScript", "System Design", "Leadership"
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  userAnswer: {
    type: String,
    default: "",
  },
  answerMode: {
    type: String,
    enum: ["text", "voice", "live"],
    default: "text",
  },
  audioUrl: {
    type: String, // Temporary audio file URL if voice mode
  },
  transcribedText: {
    type: String, // Whisper/Sarvam transcription for voice answers
  },
  transcriptionLanguage: {
    type: String, // Auto-detected language code (e.g. en-IN, hi-IN)
  },
  languageProbability: {
    type: Number,
  },
  startedAt: {
    type: Date,
  },
  answeredAt: {
    type: Date,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  evaluation: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    relevance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    technicalAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    clarity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    roleFit: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
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
    missingKeywords: [
      {
        type: String,
      },
    ],
    suggestedAnswer: {
      type: String,
    },
    improvementTips: [
      {
        type: String,
      },
    ],
    feedback: {
      type: String,
    },
    starBreakdown: {
      situation: String,
      task: String,
      action: String,
      result: String,
    },
    depthAndTradeoffs: Number,
    evidenceAndGrounding: Number,
  },
  cognitiveLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 2,
  },
  cognitiveMeta: {
    type: mongoose.Schema.Types.Mixed,
  },
  syllabusPhase: {
    type: String,
  },
  turnDecision: {
    type: String,
  },
  acknowledgmentBridge: {
    type: String,
  },
  signals: {
    type: mongoose.Schema.Types.Mixed,
  },
  isFollowUp: {
    type: Boolean,
    default: false,
  },
  parentQuestionNumber: {
    type: Number, // Reference to the question this is a follow-up to
  },
  skipped: {
    type: Boolean,
    default: false,
  },
});

/**
 * Interview Session Schema
 * Represents a complete interview session
 */
const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Interview Configuration
    interviewType: {
      type: String,
      enum: [
        "resume-based",
        "job-description",
        "technical",
        "behavioral",
        "mixed",
      ],
      required: true,
    },
    role: {
      type: String,
      required: true, // e.g., "Frontend Developer", "Backend Developer", "Full Stack"
    },
    experienceLevel: {
      type: String,
      enum: ["fresher", "junior", "mid", "senior", "lead"],
      default: "mid",
    },
    mode: {
      type: String,
      enum: ["text", "voice", "mixed", "live"],
      default: "text",
    },
    interviewLanguage: {
      type: String,
      default: "unknown",
    },
    // Source Data
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    resumeText: {
      type: String, // Cached resume text for context
    },
    jobDescription: {
      type: String, // JD text if job-description type
    },
    targetSkills: [
      {
        type: String, // Specific skills to focus on
      },
    ],
    // Session State
    status: {
      type: String,
      enum: ["created", "in-progress", "paused", "completed", "abandoned"],
      default: "created",
      index: true,
    },
    stateHistory: [
      {
        state: String,
        timestamp: { type: Date, default: Date.now },
        reason: String,
      }
    ],
    pausedAt: {
      type: Date,
    },
    resumedAt: {
      type: Date,
    },
    pauseDurations: [
      {
        startedAt: Date,
        endedAt: Date,
        durationSeconds: Number,
      }
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 10,
      min: 5,
      max: 20,
    },
    questions: [interviewQuestionSchema],
    syllabus: [
      {
        phase: String,
        phaseIndex: Number,
        targetQuestionNumber: Number,
        category: String,
        questionType: String,
        cognitiveLevel: Number,
        objective: String,
      },
    ],
    currentCognitiveLevel: {
      type: Number,
      default: 2,
    },
    // Timing
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    totalDurationSeconds: {
      type: Number,
      default: 0,
    },
    // AI Configuration
    aiModel: {
      type: String,
      enum: ["gemini", "gpt4o"],
      default: "gemini",
    },
    difficultyProgression: {
      type: String,
      enum: ["fixed", "adaptive"], // adaptive increases difficulty based on performance
      default: "adaptive",
    },
    // Metadata & Environment
    voiceEngineUsed: {
      type: String,
      enum: ["sarvam", "local", "browser", "auto", "none"],
      default: "sarvam",
    },
    personaUsed: {
      type: String,
      default: "shubh",
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    // Comprehensive Cost Tracking (Sarvam STT/TTS & LLM)
    costBreakdown: {
      stt: {
        durationSeconds: { type: Number, default: 0 },
        characterCount: { type: Number, default: 0 },
        costInr: { type: Number, default: 0 },
        costUsd: { type: Number, default: 0 },
      },
      tts: {
        characterCount: { type: Number, default: 0 },
        audioSeconds: { type: Number, default: 0 },
        costInr: { type: Number, default: 0 },
        costUsd: { type: Number, default: 0 },
      },
      llm: {
        promptTokens: { type: Number, default: 0 },
        completionTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        costInr: { type: Number, default: 0 },
        costUsd: { type: Number, default: 0 },
      },
      totalCostInr: { type: Number, default: 0 },
      totalCostUsd: { type: Number, default: 0 },
    },
    // Video & Proctoring
    hasVideoRecording: {
      type: Boolean,
      default: false,
    },
    videoRecordingUrl: {
      type: String,
      default: null,
    },
    proctoringEvents: [
      {
        timestampSeconds: { type: Number, default: 0 },
        eventType: {
          type: String,
          enum: [
            "PHONE_DETECTED",
            "MULTIPLE_FACES",
            "FACE_ABSENT",
            "GAZE_DEVIATION",
            "TAB_SWITCH",
            "WINDOW_BLUR",
            "PASTE_ATTEMPT",
            "IDENTITY_SWITCH",
            "PROCTORING_OFFLINE",
          ],
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        confidence: { type: Number, default: 1 },
        durationMs: { type: Number, default: 0 },
        evidenceCount: { type: Number, default: 0 },
        faceCount: { type: Number, default: null },
        detectorVersion: { type: String, default: "unknown" },
        meta: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
        snapshotUrl: { type: String, default: null },
        details: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    proctoringSummary: {
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
    },
    proctoringHeartbeat: {
      enabled: { type: Boolean, default: false },
      lastSeenAt: Date,
      lastReceivedAt: Date,
      offline: { type: Boolean, default: false },
      detectorVersion: { type: String, default: "unknown" },
    },
    metadata: {
      browserInfo: String,
      ipAddress: String,
      deviceType: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
interviewSessionSchema.index({userId: 1, status: 1});
interviewSessionSchema.index({userId: 1, createdAt: -1});
interviewSessionSchema.index({interviewType: 1, status: 1});
interviewSessionSchema.index({status: 1, "proctoringHeartbeat.enabled": 1, "proctoringHeartbeat.lastSeenAt": 1});

// Virtual for calculating overall progress
interviewSessionSchema.virtual("progress").get(function () {
  if (this.totalQuestions === 0) return 0;
  const answeredQuestions = this.questions.filter(
    (q) => q.userAnswer || q.skipped
  ).length;
  return Math.round((answeredQuestions / this.totalQuestions) * 100);
});

// Virtual for calculating average score
interviewSessionSchema.virtual("averageScore").get(function () {
  const evaluatedQuestions = this.questions.filter(
    (q) => q.evaluation?.score > 0
  );
  if (evaluatedQuestions.length === 0) return 0;
  const totalScore = evaluatedQuestions.reduce(
    (sum, q) => sum + q.evaluation.score,
    0
  );
  return Math.round(totalScore / evaluatedQuestions.length);
});

// Removed brittle auto-complete pre-save hook.
// State Machine now handles auto-completion.

// Method to add a question
interviewSessionSchema.methods.addQuestion = function (questionData) {
  const questionNumber = this.questions.length + 1;
  this.questions.push({
    questionNumber,
    ...questionData,
    startedAt: new Date(),
  });
  return this.questions[this.questions.length - 1];
};

// Method to submit an answer
interviewSessionSchema.methods.submitAnswer = function (
  questionNumber,
  answer,
  mode = "text"
) {
  const question = this.questions.find(
    (q) => q.questionNumber === questionNumber
  );
  if (!question) {
    throw new Error(`Question ${questionNumber} not found`);
  }

  question.userAnswer = answer;
  question.answerMode = mode;
  question.answeredAt = new Date();

  if (question.startedAt) {
    question.timeSpentSeconds = Math.round(
      (question.answeredAt - question.startedAt) / 1000
    );
  }

  return question;
};

// Method to add evaluation
interviewSessionSchema.methods.addEvaluation = function (
  questionNumber,
  evaluation
) {
  const question = this.questions.find(
    (q) => q.questionNumber === questionNumber
  );
  if (!question) {
    throw new Error(`Question ${questionNumber} not found`);
  }

  question.evaluation = {
    ...question.evaluation,
    ...evaluation,
  };

  return question;
};

// Static method to get user's interview history
interviewSessionSchema.statics.getUserHistory = async function (
  userId,
  options = {}
) {
  const {limit = 10, skip = 0, status} = options;

  const query = {userId};
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .select("-questions.evaluation.suggestedAnswer") // Exclude detailed answers in list view
    .lean();
};

// Static method to get user's interview stats
interviewSessionSchema.statics.getUserStats = async function (userId) {
  const sessions = await this.find({userId, status: "completed"});

  if (sessions.length === 0) {
    return {
      totalInterviews: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      interviewsByType: {},
      recentScores: [],
    };
  }

  const stats = {
    totalInterviews: sessions.length,
    averageScore: 0,
    totalTimeSpent: 0,
    interviewsByType: {},
    recentScores: [],
  };

  let totalScore = 0;
  let scoredSessions = 0;

  sessions.forEach((session) => {
    // Total time
    stats.totalTimeSpent += session.totalDurationSeconds || 0;

    // By type
    stats.interviewsByType[session.interviewType] =
      (stats.interviewsByType[session.interviewType] || 0) + 1;

    // Average score from questions
    const evaluatedQuestions = session.questions.filter(
      (q) => q.evaluation?.score > 0
    );
    if (evaluatedQuestions.length > 0) {
      const sessionScore =
        evaluatedQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) /
        evaluatedQuestions.length;
      totalScore += sessionScore;
      scoredSessions++;

      stats.recentScores.push({
        date: session.completedAt,
        score: Math.round(sessionScore),
        type: session.interviewType,
      });
    }
  });

  stats.averageScore =
    scoredSessions > 0 ? Math.round(totalScore / scoredSessions) : 0;
  stats.recentScores = stats.recentScores.slice(-10).reverse(); // Last 10, most recent first

  return stats;
};

// Ensure virtuals are included in JSON
interviewSessionSchema.set("toJSON", {virtuals: true});
interviewSessionSchema.set("toObject", {virtuals: true});

const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);

export default InterviewSession;

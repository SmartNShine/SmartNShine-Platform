import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import Resume from "../models/Resume.model.js";
import * as interviewService from "../services/interview.service.js";
import * as interviewStateManager from "../services/interview-state.service.js";
import * as sarvamService from "../services/sarvam.service.js";
import {transcribeAudioWithAI} from "../services/openai.service.js";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";
import { EVENT_WEIGHTS, normalizeProctoringEvent } from "../services/proctoring-scoring.js";
import { appendProctoringEvent, checkOfflineProctoring } from "../services/proctoring.service.js";

import {
  finishPendingEvaluations, prepareNextInterviewQuestion, saveInterviewTurn,
  scheduleInterviewWork, validateInterviewTurn,
} from "../services/interview-progression.service.js";
import { estimateQuestionCount, getAnswerTimeLimitSec } from "../services/interview-difficulty.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interview Controller
 * Handles all interview-related API endpoints
 */

/**
 * Get interview configuration options
 * GET /api/interview/config
 */
export const getInterviewConfig = async (req, res) => {
  try {
    const config = {
      interviewTypes: [
        {
          id: "resume-based",
          name: "Resume-Based Interview",
          description: "Questions derived from your resume",
        },
        {
          id: "job-description",
          name: "Job Description Interview",
          description: "Questions based on a job posting",
        },
        {
          id: "technical",
          name: "Technical Interview",
          description: "Role-specific technical questions",
        },
        {
          id: "behavioral",
          name: "Behavioral Interview",
          description: "STAR-based situational questions",
        },
        {
          id: "mixed",
          name: "Mixed Interview",
          description: "Combination of technical and behavioral",
        },
      ],
      roles: interviewService.getAvailableRoles(),
      experienceLevels: interviewService.getExperienceLevels(),
      limits: interviewService.getInterviewLimits(),
      modes: [
        {id: "text", name: "Text Mode", description: "Type your answers"},
        {
          id: "voice",
          name: "Voice Mode",
          description: "Speak your answers (requires microphone)",
        },
        {
          id: "live",
          name: "Live Interview",
          description:
            "Real-time conversation with AI interviewer (voice-to-voice)",
          requiresTTS: true,
        },
      ],
      ttsAvailable: true, // Always true - Browser TTS (Web Speech API) is always available as fallback
    };

    res.json({success: true, data: config});
  } catch (error) {
    console.error("❌ Get interview config error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to get interview configuration"});
  }
};

/**
 * Create a new interview session
 * POST /api/interview/sessions
 */
export const createSession = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      interviewType,
      role,
      experienceLevel = "mid",
      mode = "text",
      resumeId,
      jobDescription,
      targetSkills = [],
      totalQuestions = 10,
      interviewDuration,
      voiceEngineUsed = "sarvam",
      personaUsed = "shubh",
      interviewLanguage = "unknown",
    } = req.body;

    // Validate required fields
    if (!interviewType || !role) {
      return res.status(400).json({
        success: false,
        error: "Interview type and role are required",
      });
    }

    // Validate interview type
    const validTypes = [
      "resume-based",
      "job-description",
      "technical",
      "behavioral",
      "mixed",
    ];
    if (!validTypes.includes(interviewType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interview type. Must be one of: ${validTypes.join(
          ", "
        )}`,
      });
    }

    // Get resume text if resume-based interview
    let resumeText = "";
    if (resumeId || interviewType === "resume-based") {
      if (!resumeId) {
        return res.status(400).json({
          success: false,
          error: "Resume ID is required for resume-based interviews",
        });
      }

      const resume = await Resume.findOne({_id: resumeId, userId});
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: "Resume not found",
        });
      }

      resumeText = resume.rawText || convertResumeToText(resume);
    }

    // Validate job description for JD-based interviews
    if (interviewType === "job-description" && !jobDescription) {
      return res.status(400).json({
        success: false,
        error: "Job description is required for job-description interviews",
      });
    }

    // Question count follows the chosen duration: spoken turns get 2-3 min each.
    const durationBasedCount = estimateQuestionCount(interviewDuration, mode);
    const clampedTotalQuestions = durationBasedCount ??
      Math.min(Math.max(Number(totalQuestions) || 10, 2), 15);
    const syllabus = interviewService.generateInterviewSyllabus({
      role,
      experienceLevel,
      interviewType,
      resumeText,
      jobDescription,
      totalQuestions: clampedTotalQuestions,
      targetSkills,
    });

    // Create session
    const session = new InterviewSession({
      userId,
      interviewType,
      role,
      experienceLevel,
      mode,
      resumeId,
      resumeText,
      jobDescription,
      targetSkills,
      totalQuestions: clampedTotalQuestions,
      syllabus,
      currentCognitiveLevel: 2,
      status: "created",
      startedAt: new Date(),
      voiceEngineUsed: mode === "text" ? "none" : voiceEngineUsed,
      personaUsed: mode === "text" ? "standard" : personaUsed,
      interviewLanguage: sarvamService.normalizeSttLanguage(interviewLanguage),
      aiModel: selectAIModel(req.user),
      metadata: {
        browserInfo: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    await session.save();

    console.log(
      `✅ Interview session created: ${session._id} for user ${userId}`
    );

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        interviewType: session.interviewType,
        role: session.role,
        experienceLevel: session.experienceLevel,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("❌ Create session error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to create interview session"});
  }
};

/**
 * Start an interview session and get first question
 * POST /api/interview/sessions/:sessionId/start
 */
export const startSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    try {
      await interviewStateManager.transitionTo(session, interviewStateManager.STATES.IN_PROGRESS, "User started session");
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    const firstPlan = session.syllabus?.[0] || {
      category: "Core Technical Fundamentals",
      cognitiveLevel: 2,
      phase: "Phase 1: Foundations",
      questionType: session.interviewType === "behavioral" ? "behavioral" : "technical",
    };

    // Generate first question
    const questionConfig = {
      interviewType: firstPlan.questionType || session.interviewType,
      role: session.role,
      experienceLevel: session.experienceLevel,
      resumeText: session.resumeText,
      jobDescription: session.jobDescription,
      targetSkills: session.targetSkills,
      previousQuestions: [],
      previousAnswers: [],
      currentDifficulty: (firstPlan.cognitiveLevel || 2) >= 4 ? "hard" : (firstPlan.cognitiveLevel || 2) <= 2 ? "easy" : "medium",
      questionNumber: 1,
      targetCategory: firstPlan.category,
      cognitiveLevel: firstPlan.cognitiveLevel || 2,
    };

    const questionData = await interviewService.generateQuestion(
      questionConfig,
      req.user
    );

    const cogLevel = firstPlan.cognitiveLevel || 2;
    const cogMeta = interviewService.COGNITIVE_LEVELS?.[cogLevel] || null;

    // Add question to session
    session.addQuestion({
      questionText: questionData.question,
      questionType: questionData.questionType || firstPlan.questionType,
      category: questionData.category || firstPlan.category,
      difficulty: questionData.difficulty,
      cognitiveLevel: cogLevel,
      cognitiveMeta: cogMeta,
      syllabusPhase: firstPlan.phase || "Phase 1: Foundations",
    });

    await session.save();

    console.log(
      `✅ Interview session started: ${session._id} (mode: ${session.mode}, cognitiveLevel: ${cogLevel})`
    );

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        status: session.status,
        mode: session.mode,
        currentQuestion: {
          number: 1,
          text: questionData.question,
          type: questionData.questionType,
          category: questionData.category || firstPlan.category,
          cognitiveLevel: cogLevel,
          cognitiveMeta: cogMeta,
          difficulty: questionData.difficulty,
          answerTimeLimitSec: getAnswerTimeLimitSec({ cognitiveLevel: cogLevel, difficulty: questionData.difficulty }),
          audio: null,
        },
        progress: {
          current: 1,
          total: session.totalQuestions,
          percentage: Math.round((1 / session.totalQuestions) * 100),
        },
      },
    });
    void prepareNextInterviewQuestion(session, req.user).catch((error) => {
      console.warn("Could not prepare the next interview question:", error.message);
    });
  } catch (error) {
    console.error("❌ Start session error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to start interview session"});
  }
};

function sendInterviewTurn(res, turn, questionNumber, user) {
  res.json({ success: true, data: turn.data });
  scheduleInterviewWork(turn, questionNumber, user);
}

function sendTurnError(res, error, fallbackMessage) {
  if (error.status === 400 || error.status === 409) {
    return res.status(error.status).json({ success: false, error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, error: fallbackMessage });
}

export const submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer, questionNumber, answerMode = "text" } = req.body;
    const userId = req.user.userId || req.user._id;
    if (typeof answer !== "string" || answer.trim().length < 10) {
      return res.status(400).json({
        success: false, error: "Please provide a more detailed answer (at least 10 characters)",
      });
    }
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    const turn = await saveInterviewTurn(session, questionNumber, { answer: answer.trim(), answerMode });
    sendInterviewTurn(res, turn, questionNumber, req.user);
  } catch (error) {
    sendTurnError(res, error, "Failed to process your answer");
  }
};

export const skipQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionNumber } = req.body;
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    const turn = await saveInterviewTurn(session, questionNumber, { skipped: true });
    sendInterviewTurn(res, turn, questionNumber, req.user);
  } catch (error) {
    sendTurnError(res, error, "Failed to skip question");
  }
};

/**
 * Complete interview and generate report
 * POST /api/interview/sessions/:sessionId/complete
 */
export const completeSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    let session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    // Idempotency: Return existing result immediately if already generated
    const existingResult = await InterviewResult.findOne({sessionId});
    if (existingResult) {
      return res.json({success: true, data: existingResult});
    }

    if (["created", "abandoned"].includes(session.status)) {
      return res.status(400).json({ success: false, error: "This interview cannot be completed." });
    }

    // Mark session as completed and calculate total duration
    await checkOfflineProctoring(session);
    session.status = "completed";
    session.completedAt ||= new Date();
    const startTime = session.startedAt || session.createdAt || session.completedAt;
    const computedSec = Math.max(1, Math.round((session.completedAt.getTime() - new Date(startTime).getTime()) / 1000));
    if (!session.totalDurationSeconds || session.totalDurationSeconds <= 0) {
      session.totalDurationSeconds = computedSec;
    }
    await session.save();
    session = await finishPendingEvaluations(await InterviewSession.findById(session._id));

    // Generate comprehensive report with safe fallback
    let reportData;
    try {
      reportData = await interviewService.generateReport(session, req.user);
    } catch (reportErr) {
      console.error("⚠️ Error generating LLM report, using fallback evaluation:", reportErr.message);
      const evaluatedQuestions = session.questions.filter(
        (q) => q.evaluation && typeof q.evaluation.score === "number"
      );
      const scores = evaluatedQuestions.map((q) => q.evaluation.score);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 70;

      reportData = {
        overallScore: avgScore,
        grade: avgScore >= 80 ? "A" : avgScore >= 60 ? "B" : "C",
        skillBreakdown: [],
        topicBreakdown: [],
        strengths: evaluatedQuestions.flatMap((q) => q.evaluation?.strengths || []).slice(0, 5),
        weaknesses: evaluatedQuestions.flatMap((q) => q.evaluation?.weaknesses || []).slice(0, 5),
        missedKeywords: [],
        resumeImprovements: [],
        practiceAreas: [],
        summary: "Interview session completed successfully.",
        detailedFeedback: "Performance evaluated across all answered questions.",
        hiringRecommendation: avgScore >= 75 ? "Hire" : "Needs Practice",
      };
    }

    // Calculate metrics
    const answeredQuestions = session.questions.filter(
      (q) => q.userAnswer || q.transcribedText
    ).length;
    const skippedQuestions = session.questions.filter((q) => q.skipped).length;
    const questionsAboveThreshold = session.questions.filter(
      (q) => (q.evaluation?.score || 0) >= 70
    ).length;
    const totalTime = session.questions.reduce(
      (sum, q) => sum + (q.timeSpentSeconds || 0),
      0
    );
    const avgTimePerQuestion =
      answeredQuestions > 0 ? Math.round(totalTime / answeredQuestions) : 0;

    // Get previous result for comparison
    const previousResult = await InterviewResult.findOne({
      userId,
      role: session.role,
      sessionId: {$ne: sessionId},
    }).sort({createdAt: -1});

    // Calculate percentile
    let percentile = 75;
    try {
      percentile = await InterviewResult.calculatePercentile(
        session.role,
        reportData.overallScore
      );
    } catch (_) {}

    // Create result document
    // Event requests may have arrived while answers/report generation were running.
    const auditSession = await InterviewSession.findById(sessionId)
      .select("proctoringSummary proctoringEvents").lean();
    const result = new InterviewResult({
      userId,
      sessionId: session._id,
      overallScore: reportData.overallScore || 70,
      grade: reportData.overallScore >= 80 ? "A" : reportData.overallScore >= 60 ? "B" : "C",
      radarCompetencies: reportData.radarCompetencies || {},
      studyRoadmap: reportData.studyRoadmap || [],
      skillBreakdown: reportData.skillBreakdown || [],
      topicBreakdown: reportData.topicBreakdown || [],
      strengths: reportData.strengths || [],
      weaknesses: reportData.weaknesses || [],
      expectedKeywords: [],
      mentionedKeywords: [],
      missedKeywords: reportData.missedKeywords || [],
      resumeImprovements: reportData.resumeImprovements || [],
      practiceAreas: reportData.practiceAreas || [],
      summary: reportData.summary || "Interview completed.",
      detailedFeedback: reportData.detailedFeedback || "",
      overallFeedback: reportData.summary || reportData.detailedFeedback || "Great effort! Review the detailed breakdown below.",
      metrics: {
        totalQuestions: session.totalQuestions || 10,
        answeredQuestions,
        skippedQuestions,
        averageTimePerQuestion: avgTimePerQuestion,
        totalDuration: session.totalDurationSeconds || 0,
        questionsAboveThreshold,
      },
      comparisonData: {
        previousScore: previousResult?.overallScore,
        scoreChange: previousResult
          ? (reportData.overallScore || 70) - previousResult.overallScore
          : null,
        percentileRank: percentile,
        trend: previousResult
          ? (reportData.overallScore || 70) > previousResult.overallScore
            ? "improving"
            : (reportData.overallScore || 70) < previousResult.overallScore
            ? "declining"
            : "stable"
          : null,
      },
      interviewType: session.interviewType,
      role: session.role,
      experienceLevel: session.experienceLevel,
      aiModel: session.aiModel || "gpt-4",
      hiringRecommendation: reportData.hiringRecommendation || "Consider",
      isPremiumAnalysis: isPremiumUser(req.user),
      videoRecordingUrl: session.videoRecordingUrl || null,
      proctoringAudit: {
        integrityScore: auditSession.proctoringSummary?.integrityScore ?? 100,
        flagCounts: auditSession.proctoringSummary?.flagCounts || {
          phone: 0,
          gaze: 0,
          multipleFaces: 0,
          absent: 0,
          tabSwitch: 0,
        },
        verdict: auditSession.proctoringSummary?.verdict || "VERIFIED_CLEAN",
        events: (auditSession.proctoringEvents || []).map((e) => ({
          timestampSeconds: e.timestampSeconds,
          eventType: e.eventType,
          severity: e.severity,
          confidence: e.confidence,
          durationMs: e.durationMs,
          evidenceCount: e.evidenceCount,
          faceCount: e.faceCount,
          detectorVersion: e.detectorVersion,
          meta: e.meta,
          snapshotUrl: e.snapshotUrl,
          details: e.details,
        })),
      },
    });

    try {
      await result.save();
    } catch (error) {
      if (error.code !== 11000) throw error;
      const savedResult = await InterviewResult.findOne({sessionId});
      if (!savedResult) throw error;
      return res.json({success: true, data: savedResult});
    }

    console.log(`✅ Interview completed and report generated: ${session._id}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Complete session error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to generate interview report"});
  }
};

/**
 * Get session details
 * GET /api/interview/sessions/:sessionId
 */
export const getSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      userId,
    }).select("-preparedQuestion").populate("resumeId", "resumeTitle name");

    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    res.json({success: true, data: session});
  } catch (error) {
    console.error("❌ Get session error:", error);
    res.status(500).json({success: false, error: "Failed to get session"});
  }
};

/**
 * Get interview result
 * GET /api/interview/results/:sessionId
 */
export const getResult = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    let result = await InterviewResult.findOne({sessionId, userId});
    const session = await InterviewSession.findOne({_id: sessionId, userId});

    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    // If result document doesn't exist yet (e.g. abandoned or in-progress session), generate partial summary from session evaluations
    if (!result && session) {
      const evaluatedQuestions = session.questions.filter(
        (q) => q.evaluation && typeof q.evaluation.score === "number"
      );
      const scores = evaluatedQuestions.map((q) => q.evaluation.score);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      result = {
        _id: `partial-${session._id}`,
        sessionId: session._id,
        userId: session.userId,
        overallScore: avgScore,
        grade: avgScore >= 80 ? "A" : avgScore >= 60 ? "B" : avgScore > 0 ? "C" : "N/A",
        status: session.status,
        skillScores: [],
        strengths: evaluatedQuestions
          .flatMap((q) => q.evaluation?.strengths || [])
          .slice(0, 5),
        weaknesses: evaluatedQuestions
          .flatMap((q) => q.evaluation?.weaknesses || [])
          .slice(0, 5),
        isPartial: true,
      };
    }

    res.json({
      success: true,
      data: {
        result,
        session,
      },
    });
  } catch (error) {
    console.error("❌ Get result error:", error);
    res.status(500).json({success: false, error: "Failed to get result"});
  }
};

/**
 * Get user's interview history
 * GET /api/interview/history
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {limit = 10, skip = 0, status} = req.query;

    const sessions = await InterviewSession.getUserHistory(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      status,
    });

    // Get results for completed sessions
    const completedSessionIds = sessions
      .filter((s) => s.status === "completed")
      .map((s) => s._id);

    const results = await InterviewResult.find({
      sessionId: {$in: completedSessionIds},
    }).select("sessionId overallScore grade");

    const resultsMap = new Map(results.map((r) => [r.sessionId.toString(), r]));

    // Combine session data with results
    const history = sessions.map((session) => ({
      ...session,
      result: resultsMap.get(session._id.toString()) || null,
    }));

    // Get total count
    const totalCount = await InterviewSession.countDocuments({
      userId,
      ...(status && {status}),
    });

    res.json({
      success: true,
      data: {
        interviews: history,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: totalCount > parseInt(skip) + parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get history error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to get interview history"});
  }
};

/**
 * Get user's interview statistics
 * GET /api/interview/stats
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const stats = await InterviewSession.getUserStats(userId);

    // Get improvement trend
    const trend = await InterviewResult.getImprovementTrend(userId, 10);

    res.json({
      success: true,
      data: {
        ...stats,
        improvementTrend: trend,
      },
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({success: false, error: "Failed to get statistics"});
  }
};

/**
 * Abandon/cancel an interview session
 * POST /api/interview/sessions/:sessionId/abandon
 */
/**
 * Pause interview session
 * POST /api/interview/sessions/:sessionId/pause
 */
export const pauseSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    await interviewStateManager.transitionTo(session, interviewStateManager.STATES.PAUSED, "User paused session");

    res.json({success: true, message: "Interview session paused", status: session.status});
  } catch (error) {
    console.error("❌ Pause session error:", error);
    res.status(400).json({success: false, error: error.message});
  }
};

/**
 * Resume interview session
 * POST /api/interview/sessions/:sessionId/resume
 */
export const resumeSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    await interviewStateManager.transitionTo(session, interviewStateManager.STATES.IN_PROGRESS, "User resumed session");

    res.json({success: true, message: "Interview session resumed", status: session.status});
  } catch (error) {
    console.error("❌ Resume session error:", error);
    res.status(400).json({success: false, error: error.message});
  }
};

export const abandonSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    if (session.status === interviewStateManager.STATES.COMPLETED) {
      return res
        .status(400)
        .json({success: false, error: "Cannot abandon a completed session"});
    }

    try {
      await interviewStateManager.transitionTo(session, interviewStateManager.STATES.ABANDONED, "User abandoned session");
    } catch (err) {
      return res.status(400).json({success: false, error: err.message});
    }

    res.json({success: true, message: "Interview session abandoned"});
  } catch (error) {
    console.error("❌ Abandon session error:", error);
    res.status(500).json({success: false, error: "Failed to abandon session"});
  }
};

// Helper functions

function convertResumeToText(resume) {
  const parts = [];

  if (resume.name) parts.push(`Name: ${resume.name}`);
  if (resume.summary) parts.push(`Summary: ${resume.summary}`);

  if (resume.skills?.length) {
    const skills = resume.skills
      .map((s) => `${s.category}: ${s.items?.join(", ")}`)
      .join("; ");
    parts.push(`Skills: ${skills}`);
  }

  if (resume.experience?.length) {
    const exp = resume.experience
      .map(
        (e) =>
          `${e.title} at ${e.company} (${e.startDate} - ${
            e.endDate
          }): ${e.bullets?.join(". ")}`
      )
      .join(" | ");
    parts.push(`Experience: ${exp}`);
  }

  if (resume.education?.length) {
    const edu = resume.education
      .map((e) => `${e.degree} in ${e.field} from ${e.institution}`)
      .join("; ");
    parts.push(`Education: ${edu}`);
  }

  if (resume.projects?.length) {
    const proj = resume.projects
      .map((p) => `${p.name}: ${p.description} (${p.technologies?.join(", ")})`)
      .join(" | ");
    parts.push(`Projects: ${proj}`);
  }

  return parts.join("\n\n");
}

function selectAIModel(user) {
  return "gpt4o";
}

function isPremiumUser(user) {
  return user.role === "admin" || user.subscription?.tier === "pro";
}

/**
 * Submit voice answer (audio file)
 * POST /api/interview/sessions/:sessionId/voice-answer
 */
export const submitVoiceAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const questionNumber = Number(req.body.questionNumber);
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    const replay = validateInterviewTurn(session, questionNumber);
    if (replay) return sendInterviewTurn(res, { session, data: replay, accepted: false }, questionNumber, req.user);

    const audioFile = req.file;
    if (!audioFile?.buffer?.length) {
      return res.status(400).json({ success: false, error: "No audio recorded. Please record your answer and try again." });
    }
    const transcription = await transcribeInterviewAnswer(audioFile, req.body);
    if (!transcription) {
      return res.status(422).json({ success: false, error: "Could not transcribe the audio. You can retry or record the answer again." });
    }

    const text = transcription.text;
    const request = text.split(/\s+/).length < 12 && (
      /^(repeat\b|can you repeat\b|please repeat\b|say that again\b|what was the question\b)/i.test(text) ? "repeat" :
      /^(clarify\b|can you clarify\b|what do you mean\b|i don.t understand\b)/i.test(text) ? "clarify" : null
    );
    if (session.mode === "live" && request) {
      return res.json({ success: true, data: { transcription, questionRequest: request } });
    }

    const turn = await saveInterviewTurn(session, questionNumber, { answer: text, answerMode: "voice", transcription });
    sendInterviewTurn(res, turn, questionNumber, req.user);
  } catch (error) {
    sendTurnError(res, error, "Failed to process voice answer");
  }
};

async function transcribeInterviewAnswer(audioFile, body) {
  const engine = body.voiceEngine || body.engine || process.env.VOICE_ENGINE_PREFERENCE || "auto";
  const clientText = typeof body.clientTranscript === "string" ? body.clientTranscript.trim() : "";
  const seconds = Number(body.durationSeconds);
  const duration = Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  const audio = { filename: audioFile.originalname, mimetype: audioFile.mimetype };
  const fromClient = clientText.length >= 4 ? { text: clientText, duration, provider: "client-web-speech" } : null;
  if (engine === "browser" && fromClient) return fromClient;

  const providers = {
    sarvam: async () => sarvamService.speechToText(audioFile.buffer, {
      ...audio, language_code: body.languageCode,
    }),
    "openai-whisper": async () => ({
      text: await transcribeAudioWithAI(audioFile.buffer, audio), language: "unknown",
    }),
    "local-whisper": async () => {
      const url = process.env.VOICE_SERVICE_URL || process.env.ML_SERVICE_URL || "http://localhost:5001";
      const form = new FormData();
      form.append("audio", audioFile.buffer, { filename: audio.filename, contentType: audio.mimetype });
      const { data } = await axios.post(`${url}/transcribe`, form, { headers: form.getHeaders(), timeout: 25000 });
      return { text: data.data?.text, language: data.data?.language, languageProbability: data.data?.language_probability };
    },
  };
  const canUseSarvam = sarvamService.isAvailable() && (duration === null || duration <= 28);
  const order = canUseSarvam ? ["sarvam", "openai-whisper"] : ["openai-whisper"];
  if (engine === "local" || engine === "local-whisper") order.unshift("local-whisper");
  else if (process.env.NODE_ENV !== "production" || process.env.VOICE_SERVICE_URL || process.env.ML_SERVICE_URL) order.push("local-whisper");

  for (const provider of order) {
    try {
      const result = await providers[provider]();
      const text = result.text?.trim();
      if (text) return { ...result, text, provider, duration };
    } catch (error) {
      console.warn(`Interview transcription via ${provider} failed:`, error.message);
    }
  }
  return fromClient;
}

/**
 * Record a client-detected proctoring event
 * POST /api/interview/sessions/:sessionId/proctoring/event
 */
export const recordProctoringEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId || req.user._id;
    const {
      eventType,
      severity = "medium",
      timestampSeconds = 0,
      details = "",
      snapshotData = null,
    } = req.body;

    const validEvents = Object.keys(EVENT_WEIGHTS);

    if (!validEvents.includes(eventType)) {
      return res.status(400).json({ success: false, error: "Invalid proctoring event type" });
    }
    if (!["low", "medium", "high"].includes(severity)) {
      return res.status(400).json({ success: false, error: "Invalid proctoring severity" });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    if (session.status !== "in-progress") {
      return res.status(409).json({ success: false, error: "Proctoring requires an active session" });
    }

    // Optional snapshot image processing (if client provided base64 data URL)
    let snapshotUrl = null;
    if (snapshotData && typeof snapshotData === "string" && snapshotData.startsWith("data:image")) {
      try {
        const matches = snapshotData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const snapshotsDir = path.join(__dirname, "..", "uploads", "interviews", "snapshots");
          if (!fs.existsSync(snapshotsDir)) {
            fs.mkdirSync(snapshotsDir, { recursive: true });
          }
          const filename = `snap-${sessionId}-${Date.now()}.${ext}`;
          fs.writeFileSync(path.join(snapshotsDir, filename), buffer);
          snapshotUrl = `/uploads/interviews/snapshots/${filename}`;
        }
      } catch (snapErr) {
        console.warn("⚠️ Failed to persist proctoring snapshot:", snapErr.message);
      }
    }

    const eventRecord = normalizeProctoringEvent({ ...req.body, snapshotUrl });
    const updated = await appendProctoringEvent(sessionId, eventRecord, { userId });
    if (!updated) {
      return res.status(409).json({ success: false, error: "Session is no longer active" });
    }

    logger.proctor(sessionId, eventType, details || "Proctoring flag logged", {
      severity,
      confidence: eventRecord.confidence,
      timestampSeconds: Number(timestampSeconds) || 0,
      hasSnapshot: Boolean(snapshotUrl),
    });

    res.json({
      success: true,
      data: {
        summary: updated.proctoringSummary,
        event: eventRecord,
      },
    });
  } catch (error) {
    console.error("❌ Record proctoring event error:", error);
    res.status(500).json({ success: false, error: "Failed to record proctoring event" });
  }
};

export const recordProctoringHeartbeat = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, userId }).lean();
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    if (session.status !== "in-progress") return res.status(409).json({ success: false, error: "Session is not active" });
    // Check the previous gap BEFORE acknowledging recovery, including after a server restart.
    await checkOfflineProctoring(session);
    const now = new Date();
    const healthy = req.body.detectorHealthy === true;
    const set = {
      "proctoringHeartbeat.enabled": true,
      "proctoringHeartbeat.lastReceivedAt": now,
      "proctoringHeartbeat.detectorVersion": typeof req.body.detectorVersion === "string" ? req.body.detectorVersion.slice(0, 100) : "unknown",
    };
    if (healthy) {
      set["proctoringHeartbeat.lastSeenAt"] = now;
      set["proctoringHeartbeat.offline"] = false;
    } else if (!session.proctoringHeartbeat?.lastSeenAt) {
      set["proctoringHeartbeat.lastSeenAt"] = now;
    }
    const updated = await InterviewSession.findOneAndUpdate({ _id: session._id, userId, status: "in-progress" }, { $set: set }, { new: true });
    if (!updated) return res.status(409).json({ success: false, error: "Session is not active" });
    res.json({ success: true, data: { summary: updated.proctoringSummary, offline: updated.proctoringHeartbeat.offline } });
  } catch (error) {
    console.error("Proctoring heartbeat error:", error.message);
    res.status(500).json({ success: false, error: "Failed to record proctoring heartbeat" });
  }
};

/**
 * Upload the recorded interview session video
 * POST /api/interview/sessions/:sessionId/video-recording
 */
export const uploadVideoRecording = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId || req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No video file provided" });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    const videoUrl = `/uploads/interviews/${req.file.filename}`;
    session.hasVideoRecording = true;
    session.videoRecordingUrl = videoUrl;
    await session.save();

    // If an InterviewResult already exists, synchronize the video recording URL
    await InterviewResult.findOneAndUpdate(
      { sessionId: session._id },
      { $set: { videoRecordingUrl: videoUrl } }
    ).catch(() => {});

    console.log(`🎥 Video recording uploaded for session ${sessionId}: ${videoUrl}`);

    res.json({
      success: true,
      data: {
        videoRecordingUrl: videoUrl,
        sizeBytes: req.file.size,
      },
    });
  } catch (error) {
    console.error("❌ Upload video recording error:", error);
    res.status(500).json({ success: false, error: "Failed to upload video recording" });
  }
};

export default {
  getInterviewConfig,
  createSession,
  startSession,
  submitAnswer,
  submitVoiceAnswer,
  skipQuestion,
  completeSession,
  getSession,
  getResult,
  getHistory,
  getStats,
  abandonSession,
  recordProctoringEvent,
  recordProctoringHeartbeat,
  uploadVideoRecording,
};

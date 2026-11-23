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
  buildGenerationConfig, finishPendingEvaluations, getQuestionPlan, prepareNextInterviewQuestion, saveInterviewTurn,
  scheduleInterviewWork, validateInterviewTurn,
} from "../services/interview-progression.service.js";
import { estimateQuestionCount, getAnswerTimeLimitSec } from "../services/interview-difficulty.service.js";
import { isAdaptiveTurnsEnabled, planOpeningQuestion } from "../services/interview-conversation.service.js";
import { createTurnToken, timingAnomalyFor, verifyTurnToken } from "../services/interview-integrity.service.js";
import { normalizeProctoringLevel } from "../services/proctoring-events.js";
import {
  getLastFrameAt, markFrameAccepted, resolveScreenSharePolicy, screenFramePath, validateScreenFrame, writeScreenFrame,
} from "../services/screen-share.service.js";
import User from "../models/User.model.js";

// v2 adds the screen-capture line (security plan S1.5).
const PROCTORING_CONSENT_VERSION = "2026-11-23.2";

// Screen sharing is mandatory only for TPO-assigned assessments (not linked to sessions yet).
const isScreenShareRequired = () => false;

// Only the Shubh voice is offered; older clients may still send other persona ids.
const SUPPORTED_PERSONAS = new Set(["shubh"]);

function toQuestionPayload(question, sessionId) {
  return {
    turnToken: sessionId ? createTurnToken(sessionId, question.questionNumber) : undefined,
    number: question.questionNumber,
    text: question.questionText,
    type: question.questionType,
    category: question.category,
    cognitiveLevel: question.cognitiveLevel,
    cognitiveMeta: question.cognitiveMeta,
    difficulty: question.difficulty,
    answerTimeLimitSec: getAnswerTimeLimitSec(question),
    isFollowUp: Boolean(question.isFollowUp),
    leadIn: question.acknowledgmentBridge || "",
    audio: null,
  };
}

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
      proctoringLevel,
      proctoringConsent,
      screenShare: screenShareInput,
    } = req.body;

    // Validate required fields
    if (!interviewType || !role) {
      return res.status(400).json({
        success: false,
        error: "Interview type and role are required",
      });
    }

    if (normalizeProctoringLevel(proctoringLevel) === "proctored" && !proctoringConsent?.accepted) {
      return res.status(400).json({
        success: false,
        error: "Proctored interviews require accepting the monitoring terms",
      });
    }

    const screenSharePolicy = resolveScreenSharePolicy({
      level: normalizeProctoringLevel(proctoringLevel),
      screenShare: screenShareInput,
      required: isScreenShareRequired(req),
    });
    if (!screenSharePolicy.ok) {
      return res.status(400).json({ success: false, error: screenSharePolicy.error, code: "SCREEN_SHARE_REQUIRED" });
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
      personaUsed: mode === "text" ? "standard" : SUPPORTED_PERSONAS.has(personaUsed) ? personaUsed : "shubh",
      interviewLanguage: sarvamService.normalizeSttLanguage(interviewLanguage),
      aiModel: selectAIModel(req.user),
      proctoringLevel: normalizeProctoringLevel(proctoringLevel),
      proctoringConsent: proctoringConsent?.accepted ? {
        acceptedAt: new Date(),
        version: PROCTORING_CONSENT_VERSION,
        level: normalizeProctoringLevel(proctoringLevel),
      } : undefined,
      integrity: { turnTokens: true },
      screenShare: screenSharePolicy.screenShare,
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
        proctoringLevel: session.proctoringLevel,
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

    // Question 1 follows the format's blueprint: the plan picks the topic and
    // question type, the session format decides which context (resume/JD) is used.
    const firstPlan = getQuestionPlan(session);
    const questionData = await interviewService.generateQuestion(
      buildGenerationConfig(session, firstPlan, 1),
      req.user
    );

    const cogLevel = firstPlan.cognitiveLevel;
    const cogMeta = firstPlan.cognitiveMeta || null;

    // Store the plan's topic and type (not the model's own labels) so topic
    // tracking and answer timing stay consistent with the blueprint.
    const firstQuestion = session.addQuestion({
      questionText: questionData.question,
      questionType: firstPlan.questionType,
      category: firstPlan.category,
      difficulty: firstPlan.difficulty,
      cognitiveLevel: cogLevel,
      cognitiveMeta: cogMeta,
      syllabusPhase: firstPlan.syllabusPhase,
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
        currentQuestion: toQuestionPayload(firstQuestion, session._id),
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

function sendInterviewTurn(res, turn, questionNumber, user, receivedAt) {
  res.json({ success: true, data: turn.data });
  scheduleInterviewWork(turn, questionNumber, user);
  if (turn.accepted && receivedAt) void recordTimingCheck(turn.session, questionNumber, receivedAt);
}

// Server-measured answer time; flagged for review, never blocks the turn.
async function recordTimingCheck(session, questionNumber, receivedAt) {
  try {
    const event = timingAnomalyFor(session, questionNumber, receivedAt);
    if (event) await appendProctoringEvent(session._id, event);
  } catch (error) {
    console.warn("Timing integrity check failed:", error.message);
  }
}

function rejectInvalidTurnToken(res, session, questionNumber, token) {
  if (verifyTurnToken(session, questionNumber, token)) return false;
  res.status(403).json({ success: false, error: "This question is not active for your session. Please refresh the interview." });
  return true;
}

function sendTurnError(res, error, fallbackMessage) {
  if (error.status === 400 || error.status === 409) {
    return res.status(error.status).json({ success: false, error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ success: false, error: fallbackMessage });
}

export const submitAnswer = async (req, res) => {
  const receivedAt = new Date();
  try {
    const { sessionId } = req.params;
    const { answer, questionNumber, answerMode = "text", turnToken } = req.body;
    const userId = req.user.userId || req.user._id;
    if (typeof answer !== "string" || answer.trim().length < 10) {
      return res.status(400).json({
        success: false, error: "Please provide a more detailed answer (at least 10 characters)",
      });
    }
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    if (rejectInvalidTurnToken(res, session, questionNumber, turnToken)) return;

    const turn = await saveInterviewTurn(session, questionNumber, { answer: answer.trim(), answerMode });
    sendInterviewTurn(res, turn, questionNumber, req.user, receivedAt);
  } catch (error) {
    sendTurnError(res, error, "Failed to process your answer");
  }
};

export const skipQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionNumber, turnToken } = req.body;
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    if (rejectInvalidTurnToken(res, session, questionNumber, turnToken)) return;

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
        screenShare: toScreenShareAudit(auditSession),
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
 * Store the candidate's self-introduction and re-plan question 1 from it, so the
 * interview opens with a reaction to who they are rather than a canned question.
 * POST /api/interview/sessions/:sessionId/introduction
 * Body: { introduction: string }
 */
export const submitIntroduction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId || req.user._id;
    const introduction = typeof req.body.introduction === "string"
      ? req.body.introduction.trim().slice(0, 4000)
      : "";
    if (introduction.length < 4) {
      return res.status(400).json({ success: false, error: "Introduction is too short" });
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    if (![interviewStateManager.STATES.IN_PROGRESS, interviewStateManager.STATES.PAUSED].includes(session.status)) {
      return res.status(400).json({ success: false, error: `Cannot update a session with status: ${session.status}` });
    }

    const first = session.questions[0];
    const stillOnFirstQuestion = first && session.questions.length === 1 && !first.userAnswer && !first.skipped;
    if (!stillOnFirstQuestion || session.candidateIntroduction) {
      // Duplicate or late request: keep the current question as-is.
      return res.json({ success: true, data: { currentQuestion: toQuestionPayload(session.questions.at(-1), session._id) } });
    }

    const opening = isAdaptiveTurnsEnabled()
      ? await planOpeningQuestion({ session, introduction, userId: session.userId })
      : null;
    // Q1 is asked only now: restart its server-side clock for timing checks.
    const update = { candidateIntroduction: introduction, "questions.0.startedAt": new Date() };
    if (opening) {
      update["questions.0.questionText"] = opening.questionText;
      update["questions.0.acknowledgmentBridge"] = opening.acknowledgmentBridge;
    }

    const updated = await InterviewSession.findOneAndUpdate({
      _id: session._id,
      userId,
      "questions.1": { $exists: false },
      "questions.0.userAnswer": { $in: ["", null] },
      "questions.0.skipped": { $ne: true },
    }, { $set: update, $inc: { __v: 1 } }, { new: true });

    const current = (updated || session).questions.at(-1);
    res.json({ success: true, data: { currentQuestion: toQuestionPayload(current, session._id), adapted: Boolean(updated && opening) } });
  } catch (error) {
    console.error("❌ Submit introduction error:", error);
    res.status(500).json({ success: false, error: "Failed to process introduction" });
  }
};

/**
 * Submit voice answer (audio file)
 * POST /api/interview/sessions/:sessionId/voice-answer
 */
export const submitVoiceAnswer = async (req, res) => {
  const receivedAt = new Date();
  try {
    const { sessionId } = req.params;
    const questionNumber = Number(req.body.questionNumber);
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });

    if (rejectInvalidTurnToken(res, session, questionNumber, req.body.turnToken)) return;
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
    sendInterviewTurn(res, turn, questionNumber, req.user, receivedAt);
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

function toScreenShareAudit(session) {
  const share = session.screenShare;
  if (!share || session.proctoringLevel !== "proctored") return undefined;
  return {
    status: share.status,
    required: Boolean(share.required),
    stoppedMsTotal: share.stoppedMsTotal || 0,
    frames: (share.frames || []).map((frame) => ({
      id: String(frame._id),
      reason: frame.reason,
      timestampSeconds: frame.timestampSeconds,
    })),
  };
}

/**
 * Store one screen frame (proctored mode).
 * POST /api/interview/sessions/:sessionId/proctoring/screen-frame
 */
export const uploadScreenFrame = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findOne({ _id: sessionId, userId })
      .select("status proctoringLevel screenShare.frames._id")
      .lean();
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    const frame = validateScreenFrame({
      session,
      imageData: req.body?.imageData,
      reason: req.body?.reason,
      timestampSeconds: req.body?.timestampSeconds,
      lastFrameAt: getLastFrameAt(sessionId),
    });
    if (!frame.ok) return res.status(frame.status).json({ success: false, error: frame.error });
    markFrameAccepted(sessionId);
    const file = await writeScreenFrame(sessionId, frame.buffer, frame.ext);
    const updated = await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId, status: "in-progress" },
      { $push: { "screenShare.frames": { reason: frame.reason, timestampSeconds: frame.timestampSeconds, file, bytes: frame.buffer.length } } },
      { new: true, projection: { "screenShare.frames": { $slice: -1 } } }
    );
    if (!updated) return res.status(409).json({ success: false, error: "Session is no longer active" });
    res.status(201).json({ success: true, data: { frameId: String(updated.screenShare.frames[0]._id) } });
  } catch (error) {
    console.error("Screen frame upload error:", error.message);
    res.status(500).json({ success: false, error: "Failed to store screen frame" });
  }
};

/**
 * Record a change in the screen share (stopped, resumed, surface).
 * POST /api/interview/sessions/:sessionId/proctoring/screen-share
 */
export const updateScreenShareStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId || req.user._id;
    const { status, stoppedMs } = req.body || {};
    const set = {};
    if (["monitor", "window", "browser", "unknown", "unavailable", "declined", "off"].includes(status)) set["screenShare.status"] = status;
    const inc = {};
    const stopped = Number(stoppedMs);
    if (Number.isFinite(stopped) && stopped > 0) inc["screenShare.stoppedMsTotal"] = Math.min(stopped, 6 * 60 * 60 * 1000);
    if (!Object.keys(set).length && !Object.keys(inc).length) return res.status(400).json({ success: false, error: "Nothing to update" });
    const updated = await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId, status: "in-progress", proctoringLevel: "proctored" },
      { ...(Object.keys(set).length && { $set: set }), ...(Object.keys(inc).length && { $inc: inc }) },
      { new: true, projection: { "screenShare.status": 1, "screenShare.stoppedMsTotal": 1 } }
    );
    if (!updated) return res.status(409).json({ success: false, error: "Session is not an active proctored session" });
    res.json({ success: true, data: { status: updated.screenShare.status, stoppedMsTotal: updated.screenShare.stoppedMsTotal } });
  } catch (error) {
    console.error("Screen share status error:", error.message);
    res.status(500).json({ success: false, error: "Failed to update screen share" });
  }
};

/**
 * Serve one screen frame to the candidate or an admin. Never cached.
 * GET /api/interview/sessions/:sessionId/screen-frames/:frameId
 */
export const getScreenFrame = async (req, res) => {
  try {
    const { sessionId, frameId } = req.params;
    const userId = req.user.userId || req.user._id;
    const session = await InterviewSession.findById(sessionId).select("userId screenShare.frames").lean();
    if (!session) return res.status(404).json({ success: false, error: "Not found" });
    if (String(session.userId) !== String(userId)) {
      const viewer = await User.findById(userId).select("role").lean();
      if (viewer?.role !== "admin") return res.status(403).json({ success: false, error: "Access denied" });
      logger.info?.(`Admin ${userId} viewed screen frame ${frameId} of session ${sessionId}`);
    }
    const frame = (session.screenShare?.frames || []).find((item) => String(item._id) === frameId);
    const filePath = frame && screenFramePath(sessionId, frame.file);
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ success: false, error: "Frame not available" });
    res.set("Cache-Control", "private, no-store");
    res.type(path.extname(filePath));
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Screen frame read error:", error.message);
    res.status(500).json({ success: false, error: "Failed to load screen frame" });
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
  submitIntroduction,
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

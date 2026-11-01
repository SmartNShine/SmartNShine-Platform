import express from "express";
import {authenticateToken} from "../middleware/auth.middleware.js";
import {checkSubscription} from "../middleware/subscription.middleware.js";
import * as interviewController from "../controllers/interview.controller.js";
import {
  interviewLimiter,
  checkInterviewLimit,
  checkVoiceAccess,
} from "../middleware/interview.middleware.js";
import {audioUpload, videoUpload} from "../config/multer.config.js";

const router = express.Router();

/**
 * Interview Routes
 * Base path: /api/interview
 */

// =====================
// PUBLIC ROUTES (still need auth)
// =====================

/**
 * Get interview configuration options
 * GET /api/interview/config
 * Returns available interview types, roles, experience levels, and limits
 */
router.get(
  "/config",
  authenticateToken,
  interviewController.getInterviewConfig
);

// =====================
// SESSION MANAGEMENT
// =====================

/**
 * Create a new interview session
 * POST /api/interview/sessions
 * Body: { interviewType, role, experienceLevel, mode, resumeId?, jobDescription?, targetSkills?, totalQuestions? }
 */
router.post(
  "/sessions",
  authenticateToken,
  checkSubscription,
  interviewLimiter,
  checkInterviewLimit,
  interviewController.createSession
);

/**
 * Start an interview session (get first question)
 * POST /api/interview/sessions/:sessionId/start
 */
router.post(
  "/sessions/:sessionId/start",
  authenticateToken,
  checkSubscription,
  interviewController.startSession
);

/**
 * Submit answer to current question
 * POST /api/interview/sessions/:sessionId/answer
 * Body: { answer, questionNumber, answerMode? }
 */
router.post(
  "/sessions/:sessionId/answer",
  authenticateToken,
  checkSubscription,
  interviewController.submitAnswer
);

/**
 * Submit voice answer (audio file)
 * POST /api/interview/sessions/:sessionId/voice-answer
 * Body: multipart/form-data with 'audio' file and 'questionNumber'
 */
router.post(
  "/sessions/:sessionId/voice-answer",
  (req, res, next) => {
    console.log("🔵 Voice-answer route hit!");
    console.log("  - Content-Type:", req.headers["content-type"]);
    console.log("  - Content-Length:", req.headers["content-length"]);
    next();
  },
  authenticateToken,
  checkSubscription,
  audioUpload.single("audio"), // Multer MUST run before any middleware that accesses req.body
  interviewController.submitVoiceAnswer
);

/**
 * Skip current question
 * POST /api/interview/sessions/:sessionId/skip
 * Body: { questionNumber }
 */
router.post(
  "/sessions/:sessionId/skip",
  authenticateToken,
  checkSubscription,
  interviewController.skipQuestion
);

/**
 * Complete interview and generate report
 * POST /api/interview/sessions/:sessionId/complete
 */
router.post(
  "/sessions/:sessionId/complete",
  authenticateToken,
  checkSubscription,
  interviewController.completeSession
);

/**
 * Record a proctoring violation event
 * POST /api/interview/sessions/:sessionId/proctoring/event
 */
router.post(
  "/sessions/:sessionId/proctoring/event",
  authenticateToken,
  interviewController.recordProctoringEvent
);

/**
 * Upload the recorded interview session video
 * POST /api/interview/sessions/:sessionId/video-recording
 */
router.post(
  "/sessions/:sessionId/video-recording",
  authenticateToken,
  videoUpload.single("video"),
  interviewController.uploadVideoRecording
);

/**
 * Abandon/cancel an interview session
 * POST /api/interview/sessions/:sessionId/abandon
 */
router.post(
  "/sessions/:sessionId/abandon",
  authenticateToken,
  interviewController.abandonSession
);

/**
 * Pause an interview session
 * POST /api/interview/sessions/:sessionId/pause
 */
router.post(
  "/sessions/:sessionId/pause",
  authenticateToken,
  interviewController.pauseSession
);

/**
 * Resume an interview session
 * POST /api/interview/sessions/:sessionId/resume
 */
router.post(
  "/sessions/:sessionId/resume",
  authenticateToken,
  interviewController.resumeSession
);

/**
 * Get session details
 * GET /api/interview/sessions/:sessionId
 */
router.get(
  "/sessions/:sessionId",
  authenticateToken,
  interviewController.getSession
);

// =====================
// RESULTS & HISTORY
// =====================

/**
 * Get interview result for a session
 * GET /api/interview/results/:sessionId
 */
router.get(
  "/results/:sessionId",
  authenticateToken,
  interviewController.getResult
);

/**
 * Get user's interview history
 * GET /api/interview/history
 * Query: { limit?, skip?, status? }
 */
router.get("/history", authenticateToken, interviewController.getHistory);

/**
 * Get user's interview statistics
 * GET /api/interview/stats
 */
router.get("/stats", authenticateToken, interviewController.getStats);

export default router;

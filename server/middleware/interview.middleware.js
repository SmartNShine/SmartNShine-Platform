import rateLimit, {ipKeyGenerator} from "express-rate-limit";
import InterviewSession from "../models/InterviewSession.model.js";
import TPO from "../models/TPO.model.js";
import User from "../models/User.model.js";

/**
 * Interview Middleware
 * Rate limiting and usage tracking for AI interviews
 */

/**
 * Rate limiter for interview endpoints
 * Prevents rapid-fire requests to AI endpoints
 * TESTING MODE: High limits
 */
export const interviewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 1000, // 1000 requests per minute for testing
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function createSessionTrafficLimiter(max, error) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    keyGenerator: (req) => String(req.user?.userId || req.user?._id || ipKeyGenerator(req.ip)),
    standardHeaders: true,
    legacyHeaders: false,
    message: {success: false, error},
  });
}

export const interviewTurnLimiter = createSessionTrafficLimiter(120, "Interview request limit reached. Please wait before trying again.");
export const interviewProctoringLimiter = createSessionTrafficLimiter(360, "Camera monitoring request limit reached.");
// Screen frames (15 s cadence + away frames) get their own budget so they never starve events.
export const interviewScreenFrameLimiter = createSessionTrafficLimiter(300, "Screen monitoring request limit reached.");

// These authenticated routes have their own per-user budgets in the routers.
export function hasInterviewTrafficLimiter(req) {
  return req.method === "POST" && (
    /^\/interview\/sessions\/[^/]+\/(start|answer|voice-answer|skip|complete|proctoring\/(event|heartbeat|screen-frame|screen-share))\/?$/i.test(req.path) ||
    /^\/voice\/(transcribe|tts\/synthesize)\/?$/i.test(req.path)
  );
}

// Live turns need an account for AI usage logging. Billing is read only when
// admitting a new interview, so it cannot interrupt an existing session.
export async function loadInterviewAccount(req, res, next) {
  try {
    const userId = req.user.userId || req.user._id;
    const isTpo = req.user.role === "tpo" || req.user.userType === "tpo";
    const user = isTpo ? await TPO.findById(userId) || await User.findById(userId) : await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Your account could not be found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Failed to load interview account:", error);
    res.status(500).json({ success: false, error: "Failed to load your account." });
  }
}

/**
 * Middleware to validate interview session ownership
 */
export async function validateSessionOwnership(req, res, next) {
  try {
    const {sessionId} = req.params;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }

    const session = await InterviewSession.findOne({_id: sessionId, userId});

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Interview session not found",
      });
    }

    // Attach session to request for later use
    req.interviewSession = session;
    next();
  } catch (error) {
    console.error("❌ Session validation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate session",
    });
  }
}

export default {
  interviewLimiter,
  loadInterviewAccount,
  validateSessionOwnership,
};

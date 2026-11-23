import rateLimit, {ipKeyGenerator} from "express-rate-limit";
import InterviewSession from "../models/InterviewSession.model.js";

/**
 * Interview Middleware
 * Rate limiting and usage tracking for AI interviews
 */

// Daily interview limits per subscription tier
// TESTING MODE: High limits for development
const INTERVIEW_LIMITS = {
  free: 999, // Unlimited for testing
  "one-time": 999,
  pro: 999,
};

// Cooldown between interviews (in milliseconds)
// TESTING MODE: No cooldown
const INTERVIEW_COOLDOWN = {
  free: 0, // No cooldown for testing
  "one-time": 0,
  pro: 0,
};

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

/**
 * Check if user has exceeded their daily interview limit
 */
export async function checkInterviewLimit(req, res, next) {
  try {
    const user = req.user;
    const userId = user._id;
    const tier = user.subscription?.tier || "free";

    // Admin users have unlimited access to interviews
    if (user.role === "admin") {
      console.log(`✅ Admin user ${userId} - interview limit check bypassed`);
      req.interviewLimits = {
        dailyLimit: Infinity,
        used: 0,
        remaining: Infinity,
        tier: "admin",
      };
      return next();
    }

    // Get daily limit for user's tier
    const dailyLimit = INTERVIEW_LIMITS[tier] || INTERVIEW_LIMITS.free;

    // Count interviews started today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const interviewsToday = await InterviewSession.countDocuments({
      userId,
      createdAt: {$gte: today},
      status: {$in: ["created", "in-progress", "completed"]},
    });

    console.log(
      `📊 Interview limit check: ${interviewsToday}/${dailyLimit} (tier: ${tier})`
    );

    if (interviewsToday >= dailyLimit) {
      return res.status(429).json({
        success: false,
        error: "Daily interview limit reached",
        message: `You've used all ${dailyLimit} interviews for today. ${
          tier === "free"
            ? "Upgrade to Pro for more interviews!"
            : "Limit resets at midnight."
        }`,
        limit: dailyLimit,
        used: interviewsToday,
        resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Check cooldown between interviews
    const cooldownMs = INTERVIEW_COOLDOWN[tier] || INTERVIEW_COOLDOWN.free;

    if (cooldownMs > 0) {
      const lastInterview = await InterviewSession.findOne({userId})
        .sort({createdAt: -1})
        .select("createdAt");

      if (lastInterview) {
        const timeSinceLastInterview =
          Date.now() - lastInterview.createdAt.getTime();

        if (timeSinceLastInterview < cooldownMs) {
          const remainingSeconds = Math.ceil(
            (cooldownMs - timeSinceLastInterview) / 1000
          );
          const remainingMinutes = Math.ceil(remainingSeconds / 60);

          return res.status(429).json({
            success: false,
            error: "Interview cooldown active",
            message: `Please wait ${remainingMinutes} minute(s) before starting another interview.`,
            cooldownRemaining: remainingSeconds,
            cooldownEndsAt: new Date(
              lastInterview.createdAt.getTime() + cooldownMs
            ).toISOString(),
          });
        }
      }
    }

    // Attach limit info to request for later use
    req.interviewLimits = {
      dailyLimit,
      used: interviewsToday,
      remaining: dailyLimit - interviewsToday,
      tier,
    };

    next();
  } catch (error) {
    console.error("❌ Interview limit check error:", error);
    // On error, allow the request to proceed (fail open)
    next();
  }
}

/**
 * Check if user can use voice mode
 * Voice mode is a paid feature
 */
export function checkVoiceAccess(req, res, next) {
  const user = req.user;
  const tier = user?.subscription?.tier || "free";
  const mode = req.body.mode;

  // Admin users have unlimited access to voice mode
  if (user?.role === "admin") {
    console.log(`✅ Admin user - voice access granted`);
    return next();
  }

  // Voice/live mode is available for paid tiers
  const voiceEnabledTiers = ["one-time", "pro"];

  // Only check when creating session (mode is in body)
  // For voice-answer submissions, skip this check (mode is already validated at session creation)
  if (
    (mode === "voice" || mode === "live") &&
    !voiceEnabledTiers.includes(tier)
  ) {
    return res.status(403).json({
      success: false,
      error: "Voice mode requires a paid subscription",
      message: "Upgrade to Pro to unlock voice interviews!",
      upgradeUrl: "/pricing",
    });
  }

  next();
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

/**
 * Get user's interview usage stats
 */
export async function getInterviewUsage(userId) {
  const tier = "free"; // Would get from user object in real usage
  const dailyLimit = INTERVIEW_LIMITS[tier] || INTERVIEW_LIMITS.free;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const interviewsToday = await InterviewSession.countDocuments({
    userId,
    createdAt: {$gte: today},
  });

  const totalInterviews = await InterviewSession.countDocuments({userId});

  return {
    dailyLimit,
    usedToday: interviewsToday,
    remainingToday: Math.max(0, dailyLimit - interviewsToday),
    totalInterviews,
  };
}

export default {
  interviewLimiter,
  checkInterviewLimit,
  checkVoiceAccess,
  validateSessionOwnership,
  getInterviewUsage,
  INTERVIEW_LIMITS,
  INTERVIEW_COOLDOWN,
};

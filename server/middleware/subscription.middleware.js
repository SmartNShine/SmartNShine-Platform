import User from "../models/User.model.js";
import Subscription from "../models/Subscription.model.js";
import TPO from "../models/TPO.model.js";

const ACTIVE_TIERS = ["free", "one-time", "pro"];
const ACTION_FIELD_MAP = {
  edit: "canEdit",
  download: "canDownload",
  ai: "canUseAI",
  view: "canView",
};

/**
 * Subscription Middleware
 * Handles subscription checks, usage limits, and tracking
 */

/**
 * Check if user has an active subscription
 * Attaches subscription info to req.user
 */
export async function checkSubscription(req, res, next) {
  try {
    // Get userId from JWT payload (set by authenticateToken middleware)
    const userId = req.user.userId || req.user._id;

    console.log("🔍 checkSubscription middleware:");
    console.log("  - userId:", userId);
    console.log("  - req.user:", JSON.stringify(req.user, null, 2));

    // Support TPO accounts (stored in TPO collection)
    if (req.user?.role === "tpo" || req.user?.userType === "tpo") {
      const tpo = await TPO.findById(userId).populate("institutionId");
      if (tpo) {
        req.user = tpo;
        req.user.subscription = {
          tier: "campus",
          plan: "campus",
          status: "active",
          autoRenew: false,
          features: {
            canEdit: true,
            canDownload: true,
            canUseAI: true,
            canView: true,
          },
          hasActiveSubscription: true,
        };
        req.user.role = "tpo";
        req.user.isTpo = true;
        if (!req.user.getUsageLimit) req.user.getUsageLimit = () => Infinity;
        if (!req.user.hasReachedLimit) req.user.hasReachedLimit = () => false;
        if (!req.user.isPremiumUser) req.user.isPremiumUser = () => true;
        if (!req.user.canAccessFeature) req.user.canAccessFeature = () => true;
        console.log("✅ TPO user recognized in checkSubscription:", tpo.email);
        return next();
      }
    }

    // Fetch user with subscription details
    const user = await User.findById(userId);
    if (!user) {
      console.error("❌ User not found with ID:", userId);
      return res.status(404).json({
        error: "User not found",
        message: "Your account could not be found. Please contact support.",
      });
    }

    await Subscription.updateMany(
      {
        userId,
        status: "active",
        endDate: {$lte: new Date()},
      },
      {$set: {status: "expired", autoRenew: false}}
    );

    if (!ACTIVE_TIERS.includes(user.subscription?.tier)) {
      user.subscription.tier = "free";
      user.subscription.plan = "free";
      user.subscription.status = "active";
      user.subscription.endDate = undefined;
      user.subscription.autoRenew = false;
      await user.save();
    }

    // Check subscription status and expiry
    await user.checkSubscriptionExpiry();

    // Check if daily usage needs to be reset (for job matches and AI extractions)
    const now = new Date();
    const lastReset = user.usage.lastDailyReset;

    if (lastReset) {
      const hoursSinceReset = (now - new Date(lastReset)) / (1000 * 60 * 60);
      // Reset if more than 24 hours have passed
      if (hoursSinceReset >= 24) {
        console.log("🔄 Resetting daily usage counters for user:", user.email);
        await user.resetDailyUsage();
      }
    } else {
      // First time - initialize the reset date
      user.usage.lastDailyReset = now;
      await user.save();
    }

    // Attach updated user to request
    req.user = user;

    console.log("✅ Subscription check passed for:", user.email);
    console.log("  - Tier:", user.subscription?.tier || "free");
    console.log("  - Status:", user.subscription?.status || "N/A");

    next();
  } catch (error) {
    console.error("❌ Subscription check error:", error.message);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      error: "Subscription check failed",
      message: "Failed to check subscription status. Please try again.",
    });
  }
}

/**
 * Check if user has reached usage limit for a specific feature
 * @param {string} limitType - Type of limit to check (resumes, atsScans, jobMatches, coverLetters)
 */
export function checkUsageLimit(limitType) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        console.error("❌ checkUsageLimit: User not authenticated");
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to use this feature",
        });
      }

      // Admin and TPO users have unlimited access to all features
      if (user.role === "admin" || user.role === "tpo" || user.isTpo) {
        console.log(`✅ Staff/TPO user ${user._id} - usage limit check bypassed for ${limitType}`);
        return next();
      }

      // Map limitType to actual usage field
      const usageFieldMap = {
        resumesPerMonth: "resumesThisMonth",
        resumeDownloadsPerMonth: "resumesDownloadedThisMonth",
        atsScansPerMonth: "atsScansThisMonth",
        jobMatchesPerDay: "jobMatchesToday",
        coverLettersPerMonth: "coverLettersThisMonth",
        aiGenerationsPerMonth: "aiGenerationsThisMonth",
        aiResumeExtractionsPerDay: "aiResumeExtractionsToday",
      };

      const usageField = usageFieldMap[limitType];
      const actualUsage = user.usage?.[usageField] || 0;
      const usageLimit = user.getUsageLimit(limitType);
      const hasReached = user.hasReachedLimit(limitType);

      console.log(`🔍 Checking usage limit for ${limitType}:`, {
        userId: user._id,
        tier: user.subscription?.tier || "free",
        usageField: usageField,
        actualUsage: actualUsage,
        limit: usageLimit,
        hasReached: hasReached,
        comparison: `${actualUsage} >= ${usageLimit} = ${hasReached}`,
        rawUsageObject: user.usage, // Show full usage object for debugging
      });

      // Check if limit reached
      if (hasReached) {
        const limit = user.getUsageLimit(limitType);
        const tier = user.subscription?.tier || "free";

        console.log(`⚠️ User has reached limit for ${limitType}`);

        // Customize messages based on limit type and tier
        const limitMessages = {
          resumesPerMonth: {
            free: {
              title: "Resume Limit Reached",
              message:
                "You've created your 1 free resume for this month. Upgrade to create unlimited resumes!",
              action: "Upgrade to Pro",
            },
            "one-time": {
              title: "Resume Limit Reached",
              message:
                "You've already created your resume with the One-Time plan. Upgrade to Pro to create unlimited resumes!",
              action: "Upgrade to Pro",
            },
          },
          resumeDownloadsPerMonth: {
            free: {
              title: "Download Limit Reached",
              message:
                "You've used your 1 free download for this month. Upgrade to download unlimited times!",
              action: "Upgrade Now",
            },
            "one-time": {
              title: "Download Limit Reached",
              message:
                "You've reached your download limit. Upgrade to Pro for unlimited downloads!",
              action: "Upgrade to Pro",
            },
          },
          aiGenerationsPerMonth: {
            free: {
              title: "AI Feature Limit Reached",
              message:
                "You've used your 1 free AI generation for this month. Upgrade to use AI features unlimited times!",
              action: "Upgrade Now",
            },
            "one-time": {
              title: "AI Generation Limit Reached",
              message:
                "You've reached your monthly AI generation limit. Upgrade to Pro for unlimited AI features!",
              action: "Upgrade to Pro",
            },
          },
          atsScansPerMonth: {
            free: {
              title: "ATS Scan Not Available",
              message:
                "ATS scanning is not available on the free plan. Upgrade to unlock ATS analysis!",
              action: "Upgrade Now",
            },
            "one-time": {
              title: "ATS Scan Limit Reached",
              message:
                "You've used your ATS scans. Upgrade to Pro for unlimited scans!",
              action: "Upgrade to Pro",
            },
          },
          jobMatchesPerDay: {
            free: {
              title: "Job Matching Not Available",
              message:
                "Job matching is not available on the free plan. Upgrade to unlock this feature!",
              action: "Upgrade Now",
            },
            "one-time": {
              title: "Daily Job Match Limit Reached",
              message:
                "You've used your 3 job matches for today. Upgrade to Pro for more matches!",
              action: "Upgrade to Pro",
            },
          },
          coverLettersPerMonth: {
            free: {
              title: "Cover Letters Not Available",
              message:
                "Cover letter generation is not available on the free plan. Upgrade to unlock this feature!",
              action: "Upgrade Now",
            },
            "one-time": {
              title: "Cover Letter Limit Reached",
              message:
                "You've used your cover letters. Upgrade to Pro for unlimited cover letters!",
              action: "Upgrade to Pro",
            },
          },
          aiResumeExtractionsPerDay: {
            free: {
              title: "Daily AI Extraction Limit Reached",
              message:
                "You've used your 1 free AI resume extraction for today. Upgrade to extract more resumes!",
              action: "Upgrade Now",
            },
            "one-time": {
              title: "Daily AI Extraction Limit Reached",
              message:
                "You've used your 10 AI resume extractions for today. Try again tomorrow or upgrade to Pro!",
              action: "Upgrade to Pro",
            },
            pro: {
              title: "Daily AI Extraction Limit Reached",
              message:
                "You've used your 2 AI resume extractions for today. This limit resets at midnight!",
              action: "Try Tomorrow",
            },
          },
        };

        const defaultMessage = {
          title: "Limit Reached",
          message: `You have reached your ${limitType} limit (${limit}). Upgrade for more access!`,
          action: "Upgrade Now",
        };

        const customMessage =
          limitMessages[limitType]?.[tier] || defaultMessage;

        return res.status(403).json({
          success: false,
          error: customMessage.title,
          message: customMessage.message,
          action: customMessage.action,
          limit,
          current: tier,
          upgradeRequired: true,
          upgradeUrl: "/pricing",
        });
      }

      console.log(`✅ Usage limit check passed for ${limitType}`);
      next();
    } catch (error) {
      console.error(
        `❌ Usage limit check error (${limitType}):`,
        error.message
      );
      res.status(500).json({
        error: "Usage check failed",
        message: "Failed to check usage limit. Please try again.",
      });
    }
  };
}

/**
 * Require paid tier (one-time or pro)
 */
export async function requirePremium(req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({message: "User not authenticated"});
    }

    if (user.role === "admin" || user.role === "tpo" || user.isTpo) {
      return next();
    }

    if (!user.isPremiumUser()) {
      return res.status(403).json({
        message: "This feature requires a paid subscription",
        tier: user.subscription?.tier || "free",
        upgradeRequired: true,
        upgradeUrl: "/pricing",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Paid subscription check error:", error.message);
    res.status(500).json({message: "Failed to check subscription status"});
  }
}

/**
 * Require specific subscription tier
 * @param {Array<string>} allowedTiers - Array of allowed tiers
 */
export function requireTier(allowedTiers) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({message: "User not authenticated"});
      }

      if (user.role === "admin" || user.role === "tpo" || user.isTpo) {
        return next();
      }

      const userTier = user.subscription?.tier || "free";

      if (!allowedTiers.includes(userTier)) {
        return res.status(403).json({
          message: `This feature requires one of the following tiers: ${allowedTiers.join(
            ", "
          )}`,
          currentTier: userTier,
          requiredTiers: allowedTiers,
          upgradeRequired: true,
          upgradeUrl: "/pricing",
        });
      }

      next();
    } catch (error) {
      console.error("❌ Tier check error:", error.message);
      res.status(500).json({message: "Failed to check subscription tier"});
    }
  };
}

/**
 * Check if user can access a specific feature
 * @param {string} feature - Feature to check access for
 */
export function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({message: "User not authenticated"});
      }

      if (user.role === "admin" || user.role === "tpo" || user.isTpo) {
        return next();
      }

      if (!user.canAccessFeature(feature)) {
        return res.status(403).json({
          message: `This feature is not available in your current plan`,
          feature,
          tier: user.subscription?.tier || "free",
          upgradeRequired: true,
          upgradeUrl: "/pricing",
        });
      }

      next();
    } catch (error) {
      console.error(`❌ Feature check error (${feature}):`, error.message);
      res.status(500).json({message: "Failed to check feature access"});
    }
  };
}

/**
 * Track usage after successful operation
 * @param {string} usageType - Type of usage to track (resume, atsScan, jobMatch, coverLetter)
 */
export function trackUsage(usageType) {
  return async (req, res, next) => {
    // Store original res.json to intercept it
    const originalJson = res.json;

    res.json = async function (data) {
      try {
        // Only track if response was successful (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const user = req.user;

          if (user) {
            if (typeof user.incrementUsage === "function") {
              await user.incrementUsage(usageType);
              console.log(`✅ Tracked ${usageType} usage for user ${user._id}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Failed to track ${usageType} usage:`, error.message);
        // Don't fail the request if tracking fails
      }

      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Rate limiting based on tier
 * Free: 10 requests/hour
 * One-time: 20 requests/hour (during 21-day access)
 * Pro: 100 requests/hour
 */
const rateLimitStore = new Map(); // Simple in-memory store (use Redis in production)

export function tierBasedRateLimit(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({message: "User not authenticated"});
    }

    if (user.role === "admin" || user.role === "tpo" || user.isTpo) {
      return next();
    }

    const tier = user.subscription?.tier || "free";
    const userId = user._id.toString();

    // Define rate limits per tier (requests per hour)
    const limits = {
      free: 10,
      "one-time": 20,
      pro: 100,
    };

    const limit = limits[tier] || limits.free;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour

    // Get or create user's rate limit data
    if (!rateLimitStore.has(userId)) {
      rateLimitStore.set(userId, {
        count: 0,
        resetTime: now + windowMs,
      });
    }

    const userLimit = rateLimitStore.get(userId);

    // Reset if window expired
    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (userLimit.count >= limit) {
      const resetIn = Math.ceil((userLimit.resetTime - now) / 1000 / 60); // minutes
      return res.status(429).json({
        message: "Rate limit exceeded",
        limit,
        resetIn: `${resetIn} minutes`,
        tier,
        upgradeUrl: "/pricing",
      });
    }

    // Increment count
    userLimit.count++;
    rateLimitStore.set(userId, userLimit);

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": limit,
      "X-RateLimit-Remaining": limit - userLimit.count,
      "X-RateLimit-Reset": new Date(userLimit.resetTime).toISOString(),
    });

    next();
  } catch (error) {
    console.error("❌ Rate limit error:", error.message);
    // Don't block request on rate limit error
    next();
  }
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime + 60 * 60 * 1000) {
      // 1 hour after reset
      rateLimitStore.delete(userId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

/**
 * Get user's current usage statistics
 */
export async function getUserUsageStats(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({message: "User not authenticated"});
    }

    if (user.role === "tpo" || user.isTpo) {
      return res.json({
        tier: "campus",
        status: "active",
        usage: {
          resumes: { used: 0, limit: Infinity, unlimited: true },
          atsScans: { used: 0, limit: Infinity, unlimited: true },
          jobMatches: { used: 0, limit: Infinity, unlimited: true },
          coverLetters: { used: 0, limit: Infinity, unlimited: true },
        },
        subscription: {
          startDate: user.createdAt,
          endDate: null,
          autoRenew: false,
        },
      });
    }

    const stats = {
      tier: user.subscription?.tier || "free",
      status: user.subscription?.status || "active",
      usage: {
        resumes: {
          used: user.usage?.resumesThisMonth || 0,
          limit: user.getUsageLimit("resumesPerMonth"),
          unlimited: user.getUsageLimit("resumesPerMonth") === Infinity,
        },
        atsScans: {
          used: user.usage?.atsScansThisMonth || 0,
          limit: user.getUsageLimit("atsScansPerMonth"),
          unlimited: user.getUsageLimit("atsScansPerMonth") === Infinity,
        },
        jobMatches: {
          used: user.usage?.jobMatchesToday || 0,
          limit: user.getUsageLimit("jobMatchesPerDay"),
          unlimited: user.getUsageLimit("jobMatchesPerDay") === Infinity,
        },
        coverLetters: {
          used: user.usage?.coverLettersThisMonth || 0,
          limit: user.getUsageLimit("coverLettersPerMonth"),
          unlimited: user.getUsageLimit("coverLettersPerMonth") === Infinity,
        },
      },
      subscription: {
        startDate: user.subscription?.startDate,
        endDate: user.subscription?.endDate,
        autoRenew: user.subscription?.autoRenew || false,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("❌ Get usage stats error:", error.message);
    res.status(500).json({message: "Failed to get usage statistics"});
  }
}

export async function getResumeAccess(user, resume) {
  const baseAccess = {
    canView: true,
    canEdit: true,
    canDownload: false,
    canUseAI: false,
    accessTier: "free",
    lockReason: null,
    upgradeRequired: false,
  };

  if (!user || !resume) {
    return {
      ...baseAccess,
      canView: false,
      canEdit: false,
      lockReason: "Resume not found",
      upgradeRequired: true,
    };
  }

  if (user.role === "admin" || user.role === "tpo" || user.isTpo) {
    return {
      ...baseAccess,
      canEdit: true,
      canDownload: true,
      canUseAI: true,
      accessTier: user.role === "tpo" ? "campus" : "admin",
    };
  }

  const now = new Date();
  const userId = user._id || user.userId;
  const resumeId = resume._id;

  const activeSubscriptions = await Subscription.find({
    userId,
    status: "active",
    $or: [{endDate: {$exists: false}}, {endDate: {$gt: now}}],
  }).select("tier plan status endDate unlockedResumeId assignmentStatus");

  const activePro = activeSubscriptions.find((sub) => sub.tier === "pro");
  if (activePro) {
    return {
      ...baseAccess,
      canEdit: true,
      canDownload: true,
      canUseAI: true,
      accessTier: "pro",
    };
  }

  const matchingOneTime = activeSubscriptions.find(
    (sub) =>
      sub.tier === "one-time" &&
      sub.assignmentStatus === "assigned" &&
      sub.unlockedResumeId?.toString() === resumeId.toString()
  );

  if (matchingOneTime) {
    return {
      ...baseAccess,
      canEdit: true,
      canDownload: true,
      canUseAI: true,
      accessTier: "one-time",
    };
  }

  const hasActiveOneTime = activeSubscriptions.some(
    (sub) => sub.tier === "one-time"
  );

  if (hasActiveOneTime) {
    return {
      ...baseAccess,
      lockReason:
        "Your one-time plan unlocks a different resume. Unlock this resume with another one-time purchase or upgrade to Pro.",
      upgradeRequired: true,
    };
  }

  const createdWithPaidPlan =
    resume.subscriptionInfo?.createdWithSubscription &&
    ["one-time", "pro"].includes(resume.subscriptionInfo?.createdWithTier);

  if (createdWithPaidPlan) {
    return {
      ...baseAccess,
      accessTier: resume.subscriptionInfo.createdWithTier,
      lockReason:
        "The subscription that unlocked this resume has expired. Renew one-time access for this resume or upgrade to Pro.",
      upgradeRequired: true,
    };
  }

  return {
    ...baseAccess,
    canDownload: true,
    canUseAI: true,
    accessTier: "free",
  };
}

export function checkResumeActionAccess(action = "edit") {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resumeId = req.body.resumeId || req.params.id || req.params.resumeId;
      const actionField = ACTION_FIELD_MAP[action] || ACTION_FIELD_MAP.edit;

      if (!resumeId) {
        return res.status(400).json({
          error: "Resume ID required",
          message: "Please provide a resume ID",
        });
      }

      const Resume = (await import("../models/Resume.model.js")).default;
      const resume = await Resume.findById(resumeId);

      if (!resume) {
        return res.status(404).json({
          error: "Resume not found",
          message: "The requested resume could not be found",
        });
      }

      if (resume.userId.toString() !== user._id.toString()) {
        return res.status(403).json({
          error: "Access denied",
          message: "You don't have permission to access this resume",
        });
      }

      const access = await getResumeAccess(user, resume);

      if (!access[actionField]) {
        return res.status(403).json({
          error: "Resume locked",
          message:
            access.lockReason ||
            "This resume is locked for your current subscription.",
          requiresUpgrade: true,
          upgradeRequired: true,
          access,
          resumeAccess: access,
          resumeId,
        });
      }

      req.resume = resume;
      req.resumeAccess = access;
      return next();
    } catch (error) {
      console.error("❌ Resume access check error:", error);
      return res.status(500).json({
        error: "Access check failed",
        message: "Failed to verify resume access. Please try again.",
      });
    }
  };
}

/**
 * Backward-compatible alias for AI/edit access checks.
 */
export async function checkResumeSubscriptionAccess(req, res, next) {
  return checkResumeActionAccess("ai")(req, res, next);
}

/**
 * Legacy implementation retained in git history.
 */
/*
export async function checkResumeSubscriptionAccessLegacy(req, res, next) {
  try {
    const user = req.user;

    // Get resumeId from body or params
    const resumeId = req.body.resumeId || req.params.id || req.params.resumeId;

    if (!resumeId) {
      return res.status(400).json({
        error: "Resume ID required",
        message: "Please provide a resume ID",
      });
    }

    // Import Resume model
    const Resume = (await import("../models/Resume.model.js")).default;

    // Get the resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
        message: "The requested resume could not be found",
      });
    }

    // Verify ownership
    if (resume.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: "Access denied",
        message: "You don't have permission to access this resume",
      });
    }

    console.log(`🔍 Checking resume subscription access:`, {
      resumeId: resume._id,
      resumeTier: resume.subscriptionInfo?.createdWithTier || "free",
      resumeSubId: resume.subscriptionInfo?.subscriptionId || "none",
      userTier: user.subscription?.tier || "free",
      userStatus: user.subscription?.status || "N/A",
    });

    // PRO USERS: Can access ALL resumes (even old resumes without tracking)
    if (
      user.subscription?.tier === "pro" &&
      user.subscription?.status === "active"
    ) {
      console.log(
        `✅ ${user.subscription.tier.toUpperCase()} user - access granted to all resumes`
      );
      req.resume = resume;
      return next();
    }

    // OLD RESUMES (no subscription tracking): Allow access based on user's CURRENT subscription
    // These are resumes created before the tracking system was implemented
    if (!resume.subscriptionInfo?.createdWithSubscription) {
      console.log(
        "⚠️ Old resume without subscription tracking - allowing access for current user"
      );

      // Allow all users (including free tier) to access their old resumes
      // Usage limits will be enforced by checkUsageLimit middleware
      console.log(
        `✅ User with ${
          user.subscription?.tier || "free"
        } tier - access granted to old resume (usage limits will be checked separately)`
      );
      req.resume = resume;
      return next();
    }

    // FREE TIER RESUMES (explicitly marked as free): Always accessible
    if (resume.subscriptionInfo?.createdWithTier === "free") {
      console.log("✅ Free tier resume - access granted");
      req.resume = resume;
      return next();
    }

    // PRO USERS: Check subscription status again for safety
    if (
      user.subscription?.tier === "pro" &&
      user.subscription?.status === "active"
    ) {
      console.log(
        `✅ ${user.subscription.tier.toUpperCase()} user - access granted to all resumes`
      );
      req.resume = resume;
      return next();
    }

    // ONE-TIME SUBSCRIPTION RESUMES: Check if the specific subscription is still active
    if (resume.subscriptionInfo?.createdWithTier === "one-time") {
      const subscriptionId = resume.subscriptionInfo.subscriptionId;

      if (!subscriptionId) {
        console.log(
          "⚠️ One-time resume without subscription ID - denying access"
        );
        return res.status(403).json({
          error: "Subscription expired",
          message:
            "This resume was created with a one-time subscription that has expired. Upgrade to Pro to access all your resumes, or purchase a new one-time subscription.",
          requiresUpgrade: true,
          resumeTier: "one-time",
          suggestedAction: "upgrade_to_pro",
        });
      }

      // Check if that specific subscription is still active
      const subscription = await Subscription.findById(subscriptionId);

      if (
        !subscription ||
        subscription.status !== "active" ||
        (subscription.endDate && subscription.endDate < new Date())
      ) {
        console.log(`❌ One-time subscription expired for resume ${resumeId}`);
        return res.status(403).json({
          error: "Subscription expired",
          message:
            "Your one-time subscription for this resume has expired. Upgrade to Pro for unlimited access to all resumes, or purchase a new one-time subscription for a new resume.",
          requiresUpgrade: true,
          resumeTier: "one-time",
          subscriptionExpired: true,
          expiryDate: subscription?.endDate || null,
          suggestedAction: "upgrade_to_pro",
        });
      }

      console.log("✅ One-time subscription still active - access granted");
      req.resume = resume;
      return next();
    }

    // DEFAULT: If we reach here, deny access
    console.log("❌ No valid subscription found for resume access");
    return res.status(403).json({
      error: "Subscription required",
      message:
        "You need an active subscription to access this resume. Upgrade to Pro for unlimited access.",
      requiresUpgrade: true,
      suggestedAction: "upgrade_to_pro",
    });
  } catch (error) {
    console.error("❌ Resume subscription access check error:", error);
    return res.status(500).json({
      error: "Access check failed",
      message: "Failed to verify subscription access. Please try again.",
    });
  }
}
*/

export default {
  checkSubscription,
  checkUsageLimit,
  requirePremium,
  requireTier,
  requireFeature,
  trackUsage,
  tierBasedRateLimit,
  getUserUsageStats,
  getResumeAccess,
  checkResumeActionAccess,
  checkResumeSubscriptionAccess,
};

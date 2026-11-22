import * as paymentService from "../services/payment.service.js";
import Subscription from "../models/Subscription.model.js";
import UsageLog from "../models/UsageLog.model.js";
import User from "../models/User.model.js";

/**
 * Subscription Controller
 * Handles subscription-related operations
 */

/**
 * Get pricing information
 */
export async function getPricing(req, res) {
  try {
    const {pricing, promotion} = await paymentService.getDynamicPricing();
    res.json({
      success: true,
      pricing,
      promotion,
    });
  } catch (error) {
    console.error("❌ Get pricing error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get pricing information",
    });
  }
}

/**
 * Create payment order
 */
export async function createPaymentOrder(req, res) {
  try {
    const {tier, plan, resumeId} = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!tier || !plan) {
      return res.status(400).json({
        success: false,
        message: "Tier and plan are required",
      });
    }

    // Create order
    const order = await paymentService.createOrder(tier, plan, userId, resumeId);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Create payment order error:", error.message);
    const statusCode = error.message?.includes("Invalid subscription") ||
      error.message?.includes("select a resume") ||
      error.message?.includes("Selected resume")
      ? 400
      : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to create payment order",
    });
  }
}

/**
 * Verify payment and create subscription
 */
export async function verifyPayment(req, res) {
  try {
    const {orderId, paymentId, signature, tier, plan, resumeId} = req.body;
    const userId = req.user._id;
    const expectedAmount = await paymentService.getPlanAmountAsync(tier, plan);

    console.log("💳 Payment verification request:", {
      orderId,
      paymentId,
      signature: signature ? "Present" : "Missing",
      tier,
      plan,
      resumeId,
      amount: expectedAmount,
      userId,
    });

    // Validate inputs
    if (!orderId || !paymentId || !tier || !plan) {
      console.error("❌ Missing required fields:", {
        orderId: !!orderId,
        paymentId: !!paymentId,
        signature: !!signature,
        tier: !!tier,
        plan: !!plan,
      });
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
      });
    }

    // For UPI and some payment methods, signature might not be provided
    // In such cases, we verify the payment using Razorpay API instead
    let isValid = false;

    if (signature && signature !== "UPI_PAYMENT") {
      // Verify signature (for card payments, net banking, etc.)
      console.log("🔐 Verifying payment signature...");
      const hasValidSignature = paymentService.verifyPaymentSignature(
        orderId,
        paymentId,
        signature
      );
      const hasCapturedPayment = await paymentService.verifyPaymentViaAPI(
        paymentId,
        orderId,
        expectedAmount
      );
      isValid = hasValidSignature && hasCapturedPayment;
    } else {
      // For UPI payments, verify via Razorpay API
      console.log("💳 Verifying UPI payment via Razorpay API...");
      isValid = await paymentService.verifyPaymentViaAPI(
        paymentId,
        orderId,
        expectedAmount
      );
    }

    if (!isValid) {
      console.error("❌ Payment verification failed");
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature or payment verification failed",
      });
    }

    const isOrderValid = await paymentService.verifyOrderForPlan(
      orderId,
      userId,
      tier,
      plan,
      resumeId
    );

    if (!isOrderValid) {
      console.error("❌ Payment order validation failed");
      return res.status(400).json({
        success: false,
        message: "Payment order does not match selected subscription plan",
      });
    }

    console.log("✅ Payment verified successfully");

    // Create subscription
    const subscription = await paymentService.createSubscription(
      userId,
      tier,
      plan,
      paymentId,
      orderId,
      expectedAmount,
      resumeId
    );

    console.log("✅ Subscription created successfully:", {
      tier: subscription.tier,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    });

    // Fetch updated user with subscription
    const updatedUser = await User.findById(userId);

    console.log("✅ Updated user subscription:", updatedUser.subscription);

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        tier: subscription.tier,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        unlockedResumeId: subscription.unlockedResumeId,
        assignmentStatus: subscription.assignmentStatus,
      },
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        subscription: updatedUser.subscription,
      },
    });
  } catch (error) {
    console.error("❌ Verify payment error:", error.message);
    const statusCode =
      error.message?.includes("Invalid subscription") ||
      error.message?.includes("amount does not match") ||
      error.message?.includes("select a resume") ||
      error.message?.includes("Selected resume")
        ? 400
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(req, res) {
  try {
    const userId = req.user._id || req.user.userId;

    if (req.user?.role === "tpo" || req.user?.isTpo) {
      return res.json({
        success: true,
        subscription: {
          tier: "campus",
          plan: "campus",
          status: "active",
          isTpo: true,
          institutionId: req.user.institutionId,
          startDate: req.user.createdAt,
          endDate: null,
          daysRemaining: null,
          autoRenew: false,
          features: [
            "Institutional TPO Dashboard",
            "Unlimited Student Bulk Import",
            "Placement Readiness Scoring",
            "AI Mock Interview Simulator",
            "ATS Resume Diagnostics & Branch Scoring",
            "Campus-wide Assignments & Tracking",
          ],
        },
      });
    }

    console.log("📊 Getting subscription status for user:", userId);

    // Get active subscription from database (not cached req.user)
    const subscription = await Subscription.getActiveSubscription(userId);

    // Also get fresh user data from database
    const user = await User.findById(userId);

    console.log("📊 Active subscription from DB:", subscription);
    console.log("📊 User subscription from DB:", user?.subscription);

    const isAdmin = user?.role === "admin";
    // If there's an active subscription, use its data
    // Otherwise, fall back to user.subscription or free tier
    const subscriptionData = subscription || user?.subscription;
    let tier = paymentService.normalizeTier(subscriptionData?.tier || "free");
    if (isAdmin) {
      tier = "pro";
    }
    const plan = isAdmin ? "admin" : (tier === "free" ? "free" : subscriptionData?.plan);

    res.json({
      success: true,
      subscription: {
        tier,
        plan,
        status: "active",
        isAdmin,
        startDate: subscriptionData?.startDate || user?.createdAt,
        endDate: isAdmin ? null : subscriptionData?.endDate,
        daysRemaining: isAdmin ? null : (subscription ? subscription.daysRemaining() : null),
        autoRenew: isAdmin ? false : (subscriptionData?.autoRenew || false),
        features:
          paymentService.PRICING[tier]?.features || [],
      },
    });
  } catch (error) {
    console.error("❌ Get subscription status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get subscription status",
    });
  }
}

/**
 * Get subscription history
 */
export async function getSubscriptionHistory(req, res) {
  try {
    const userId = req.user._id;

    console.log("📊 Fetching subscription history for user:", userId);

    const history = await Subscription.getUserSubscriptionHistory(userId);

    console.log("📊 Subscription history query result:", {
      userId,
      count: history?.length || 0,
      hasData: history && history.length > 0,
    });

    if (history && history.length > 0) {
      console.log("📊 Sample subscription:", {
        tier: history[0].tier,
        plan: history[0].plan,
        amount: history[0].amount,
        receiptId: history[0].receiptId,
        createdAt: history[0].createdAt,
        status: history[0].status,
      });
    }

    res.json({
      success: true,
      history: history || [],
      count: history?.length || 0,
    });
  } catch (error) {
    console.error("❌ Get subscription history error:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to get subscription history",
      error: error.message,
    });
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(req, res) {
  try {
    const userId = req.user._id;
    const {reason} = req.body;

    const subscription = await paymentService.cancelSubscription(
      userId,
      reason
    );

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error("❌ Cancel subscription error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel subscription",
    });
  }
}

/**
 * Renew subscription
 */
export async function renewSubscription(req, res) {
  try {
    const {paymentId, orderId} = req.body;
    const userId = req.user._id;

    if (!paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and Order ID are required",
      });
    }

    const subscription = await paymentService.renewSubscription(
      userId,
      paymentId,
      orderId
    );

    res.json({
      success: true,
      message: "Subscription renewed successfully",
      subscription: {
        tier: subscription.tier,
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error("❌ Renew subscription error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to renew subscription",
    });
  }
}

/**
 * Get usage statistics
 */
export async function getUsageStats(req, res) {
  try {
    const userId = req.user._id;
    const user = req.user;

    const isAdmin = user.role === "admin";
    const tier = isAdmin ? "pro" : (user.subscription?.tier || "free");

    const getFeatureLimit = (limitType) => {
      const limit = user.getUsageLimit(limitType);
      const isUnlimited = isAdmin || limit === Infinity;
      return {
        limit: isUnlimited ? null : limit,
        unlimited: isUnlimited,
      };
    };

    // Get basic usage stats
    const basicStats = {
      tier,
      isAdmin,
      usage: {
        resumes: {
          used: user.usage?.resumesThisMonth || 0,
          total: user.usage?.resumesCreated || 0,
          ...getFeatureLimit("resumesPerMonth"),
        },
        aiGenerations: {
          used: user.usage?.aiGenerationsThisMonth || 0,
          total: user.usage?.aiGenerationsUsed || 0,
          ...getFeatureLimit("aiGenerationsPerMonth"),
        },
        atsScans: {
          used: user.usage?.atsScansThisMonth || 0,
          total: user.usage?.atsScans || 0,
          ...getFeatureLimit("atsScansPerMonth"),
        },
        jobMatches: {
          used: user.usage?.jobMatchesToday || 0,
          total: user.usage?.jobMatches || 0,
          ...getFeatureLimit("jobMatchesPerDay"),
        },
        coverLetters: {
          used: user.usage?.coverLettersThisMonth || 0,
          total: user.usage?.coverLetters || 0,
          ...getFeatureLimit("coverLettersPerMonth"),
        },
      },
    };

    // Get detailed usage logs for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const detailedUsage = await UsageLog.getUserUsageSummary(userId, {
      startDate: thirtyDaysAgo,
      endDate: new Date(),
    });

    res.json({
      success: true,
      stats: basicStats,
      detailed: detailedUsage,
    });
  } catch (error) {
    console.error("❌ Get usage stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get usage statistics",
    });
  }
}

/**
 * Get advanced analytics (Pro users only)
 * Provides comprehensive statistics and insights
 */
export async function getAdvancedAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const user = req.user;
    const tier = user.subscription?.tier || "free";

    // Check if user has access to advanced analytics
    if (tier !== "pro") {
      return res.status(403).json({
        success: false,
        error: "Advanced Analytics - Pro Feature",
        message: "Upgrade to Pro to access advanced analytics and insights!",
        upgradeRequired: true,
        upgradeUrl: "/pricing",
      });
    }

    // Import AIUsage and Resume models
    const AIUsage = (await import("../models/AIUsage.model.js")).default;
    const Resume = (await import("../models/Resume.model.js")).default;

    // Date ranges
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Overall usage summary
    const overallUsage = {
      resumesCreated: user.usage?.resumesCreated || 0,
      atsScans: user.usage?.atsScans || 0,
      jobMatches: user.usage?.jobMatches || 0,
      coverLetters: user.usage?.coverLetters || 0,
      aiRequestsTotal: user.usage?.tokensUsed || 0,
    };

    // 2. AI Usage Analytics
    const aiUsage = await AIUsage.aggregate([
      {$match: {userId: userId}},
      {
        $group: {
          _id: "$aiProvider",
          count: {$sum: 1},
          totalCost: {$sum: "$cost"},
          totalTokens: {$sum: "$tokens"},
        },
      },
    ]);

    const aiUsageLast7Days = await AIUsage.countDocuments({
      userId,
      createdAt: {$gte: last7Days},
    });

    const aiUsageLast30Days = await AIUsage.countDocuments({
      userId,
      createdAt: {$gte: last30Days},
    });

    const aiAnalytics = {
      byProvider: aiUsage.map((item) => ({
        provider: item._id || "unknown",
        requests: item.count,
        cost: item.totalCost,
        tokens: item.totalTokens,
      })),
      last7Days: aiUsageLast7Days,
      last30Days: aiUsageLast30Days,
      totalCost: aiUsage.reduce((sum, item) => sum + (item.totalCost || 0), 0),
    };

    // 3. Resume Analytics
    const resumes = await Resume.find({userId}).sort({updatedAt: -1});
    const resumeAnalytics = {
      total: resumes.length,
      last7Days: resumes.filter((r) => r.createdAt >= last7Days).length,
      last30Days: resumes.filter((r) => r.createdAt >= last30Days).length,
      byTemplate: resumes.reduce((acc, resume) => {
        const template = resume.template || "classic";
        acc[template] = (acc[template] || 0) + 1;
        return acc;
      }, {}),
      mostRecentlyUpdated: resumes.slice(0, 5).map((r) => ({
        id: r._id,
        title: r.resumeTitle || r.name || "Untitled",
        template: r.template,
        updatedAt: r.updatedAt,
      })),
    };

    // 4. Activity Timeline (last 30 days)
    const activityTimeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const aiRequests = await AIUsage.countDocuments({
        userId,
        createdAt: {$gte: startOfDay, $lte: endOfDay},
      });

      const resumesCreated = await Resume.countDocuments({
        userId,
        createdAt: {$gte: startOfDay, $lte: endOfDay},
      });

      activityTimeline.push({
        date: startOfDay.toISOString().split("T")[0],
        aiRequests,
        resumesCreated,
      });
    }

    // 5. Subscription Info
    const subscriptionInfo = {
      tier,
      plan: user.subscription?.plan || "free",
      status: user.subscription?.status || "active",
      startDate: user.subscription?.startDate,
      endDate: user.subscription?.endDate,
      daysRemaining: user.subscription?.endDate
        ? Math.ceil(
            (new Date(user.subscription.endDate) - now) / (1000 * 60 * 60 * 24)
          )
        : null,
    };

    // 6. Current Month Usage
    const currentMonthUsage = {
      resumes: {
        used: user.usage?.resumesThisMonth || 0,
        limit: user.getUsageLimit("resumesPerMonth"),
      },
      atsScans: {
        used: user.usage?.atsScansThisMonth || 0,
        limit: user.getUsageLimit("atsScansPerMonth"),
      },
      coverLetters: {
        used: user.usage?.coverLettersThisMonth || 0,
        limit: user.getUsageLimit("coverLettersPerMonth"),
      },
      jobMatches: {
        used: user.usage?.jobMatchesToday || 0,
        limit: user.getUsageLimit("jobMatchesPerDay"),
      },
    };

    // 7. Cost Savings (vs Pay-as-you-go)
    const costSavings = {
      estimatedPayAsYouGo:
        overallUsage.resumesCreated * 10 +
        overallUsage.atsScans * 5 +
        overallUsage.coverLetters * 8,
      actualPaid: tier === "pro" ? 199 : tier === "one-time" ? 49 : 0,
      saved: 0,
    };
    costSavings.saved =
      costSavings.estimatedPayAsYouGo - costSavings.actualPaid;

    res.json({
      success: true,
      analytics: {
        overallUsage,
        aiAnalytics,
        resumeAnalytics,
        activityTimeline,
        subscriptionInfo,
        currentMonthUsage,
        costSavings,
        generatedAt: now,
      },
    });
  } catch (error) {
    console.error("❌ Get advanced analytics error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get advanced analytics",
    });
  }
}

/**
 * Handle Razorpay webhooks
 */
export async function handleWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);
    const event = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;

    await paymentService.handleWebhook(event, signature, rawBody);

    res.json({success: true});
  } catch (error) {
    console.error("❌ Webhook handling error:", error.message);
    res.status(400).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
}

/**
 * Compare plans (for upgrade/downgrade decisions)
 */
export async function comparePlans(req, res) {
  try {
    const {fromTier, toTier} = req.query;

    if (!fromTier && !toTier) {
      return res.json({
        success: true,
        plans: paymentService.PRICING,
      });
    }

    if (!fromTier || !toTier) {
      return res.status(400).json({
        success: false,
        message: "fromTier and toTier are required",
      });
    }

    const fromPlan = paymentService.PRICING[fromTier];
    const toPlan = paymentService.PRICING[toTier];

    if (!fromPlan || !toPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid tier specified",
      });
    }

    res.json({
      success: true,
      comparison: {
        from: {
          tier: fromTier,
          features: fromPlan.features,
        },
        to: {
          tier: toTier,
          features: toPlan.features,
        },
        isUpgrade:
          toTier === "pro" && fromTier !== "pro",
      },
    });
  } catch (error) {
    console.error("❌ Compare plans error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to compare plans",
    });
  }
}

/**
 * Get AI service configuration for user
 * Returns tier-based AI model assignment (no user preferences)
 */
export async function getAIConfig(req, res) {
  try {
    const user = req.user;
    const tier = user.subscription?.tier || "free";

    const aiModel = "gpt4o";
    const config = {
      tier: paymentService.normalizeTier(tier),
      aiModel,
      isHybrid: false,
      provider: "openai",
      description: "OpenAI GPT-4o - State of the art AI engine",
    };

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("❌ Get AI config error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get AI configuration",
    });
  }
}

/**
 * Update AI model preference (DEPRECATED - kept for API compatibility)
 * All operations now use OpenAI GPT-4o exclusively
 */
export async function updateAIPreference(req, res) {
  try {
    const user = req.user;
    const tier = user.subscription?.tier || "free";

    res.json({
      success: true,
      message: "OpenAI GPT-4o is the active AI engine for all features",
      aiModel: "gpt4o",
      tier,
      provider: "openai",
    });
  } catch (error) {
    console.error("❌ Update AI preference error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get AI configuration",
    });
  }
}

export default {
  getPricing,
  createPaymentOrder,
  verifyPayment,
  getSubscriptionStatus,
  getSubscriptionHistory,
  cancelSubscription,
  renewSubscription,
  getUsageStats,
  getAdvancedAnalytics,
  handleWebhook,
  comparePlans,
  getAIConfig,
  updateAIPreference,
};

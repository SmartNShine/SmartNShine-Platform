import User from "../models/User.model.js";
import Resume from "../models/Resume.model.js";
import Contact from "../models/Contact.js";
import AIUsage from "../models/AIUsage.model.js";
import AdminLog from "../models/AdminLog.model.js";
import Template from "../models/Template.model.js";
import Portfolio from "../models/Portfolio.model.js";
import PortfolioProject from "../models/PortfolioProject.model.js";
import Feedback from "../models/Feedback.model.js";
import Settings from "../models/Settings.model.js";
import Subscription from "../models/Subscription.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import {getPlanAmount, PLAN_DURATIONS} from "../services/payment.service.js";
import * as openaiService from "../services/openai.service.js";
import * as openaiCreditService from "../services/openaiCredit.service.js";
import {sendCustomAdminTemplateEmail} from "../services/email.service.js";

const ACTIVE_SUBSCRIPTION_TIERS = ["free", "one-time", "pro"];
const MANAGEABLE_SUBSCRIPTION_TIERS = ["one-time", "pro"];
const SUBSCRIPTION_CURRENCIES = ["INR", "USD"];
const PLAN_DEFAULT_DAYS = {
  "one-time": 21,
  monthly: 30,
  yearly: 365,
};
const AI_QUOTA_LIMITS = {
  free: {daily: 10, monthly: 200},
  "one-time": {daily: 150, monthly: 150},
  pro: {daily: Infinity, monthly: Infinity},
  admin: {daily: Infinity, monthly: Infinity},
};

const getEffectiveTier = (user) => {
  if (user.role === "admin") return "admin";
  const tier = user.subscription?.tier || "free";
  return ACTIVE_SUBSCRIPTION_TIERS.includes(tier) ? tier : "free";
};

const createManualReceiptId = () =>
  `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const addDays = (fromDate, days) => {
  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + Number(days));
  return nextDate;
};

const getDefaultPlanDuration = (plan) => PLAN_DEFAULT_DAYS[plan] || 30;

const getResetPeriodUsage = (usage = {}) => {
  const currentUsage =
    typeof usage?.toObject === "function" ? usage.toObject() : usage;

  return {
    ...currentUsage,
    resumesThisMonth: 0,
    resumesDownloadedThisMonth: 0,
    atsScansThisMonth: 0,
    jobMatchesToday: 0,
    coverLettersThisMonth: 0,
    aiResumeExtractionsToday: 0,
    aiGenerationsThisMonth: 0,
    lastResetDate: new Date(),
    lastDailyReset: new Date(),
  };
};

const validateSubscriptionSelection = (tier, plan) => {
  if (!MANAGEABLE_SUBSCRIPTION_TIERS.includes(tier)) {
    return "Tier must be one-time or pro";
  }

  if (!PLAN_DURATIONS[tier]?.includes(plan)) {
    return `Plan must be one of: ${PLAN_DURATIONS[tier].join(", ")}`;
  }

  return null;
};

// Get Dashboard Statistics nicely
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalResumes,
      totalTemplates,
      totalAICalls,
      totalContacts,
      activeUsers,
      disabledUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Resume.countDocuments(),
      Template.countDocuments(),
      AIUsage.countDocuments(),
      Contact.countDocuments(),
      User.countDocuments({status: "active"}),
      User.countDocuments({status: "disabled"}),
    ]);

    // Get users growth (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {$gte: sevenDaysAgo},
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {format: "%Y-%m-%d", date: "$createdAt"},
          },
          count: {$sum: 1},
        },
      },
      {
        $sort: {_id: 1},
      },
    ]);

    // Get resumes growth (last 7 days)
    const resumesGrowth = await Resume.aggregate([
      {
        $match: {
          createdAt: {$gte: sevenDaysAgo},
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {format: "%Y-%m-%d", date: "$createdAt"},
          },
          count: {$sum: 1},
        },
      },
      {
        $sort: {_id: 1},
      },
    ]);

    // Get AI usage by feature
    const aiUsageByFeature = await AIUsage.aggregate([
      {
        $group: {
          _id: "$feature",
          count: {$sum: 1},
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
        },
      },
    ]);

    // Get recent activities
    const recentUsers = await User.find()
      .select("name email createdAt")
      .sort({createdAt: -1})
      .limit(5);

    const recentResumes = await Resume.find()
      .populate("userId", "name email")
      .select("name userId createdAt")
      .sort({createdAt: -1})
      .limit(5);

    // Get total cost from AI usage
    const totalAICost = await AIUsage.aggregate([
      {
        $group: {
          _id: null,
          total: {$sum: "$cost"},
        },
      },
    ]);

    // Get AI extraction statistics
    const aiExtractionStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalExtractionsToday: {$sum: "$usage.aiResumeExtractionsToday"},
          totalExtractionUsers: {
            $sum: {
              $cond: [{$gt: ["$usage.aiResumeExtractionsToday", 0]}, 1, 0],
            },
          },
        },
      },
    ]);

    // Get users who hit extraction limit today
    const usersAtExtractionLimit = await User.countDocuments({
      $expr: {
        $gte: [
          "$usage.aiResumeExtractionsToday",
          {
            $switch: {
              branches: [
                {case: {$eq: ["$subscription.tier", "free"]}, then: 1},
                {case: {$eq: ["$subscription.tier", "one-time"]}, then: 0},
                {case: {$eq: ["$subscription.tier", "pro"]}, then: 2},
              ],
              default: 1,
            },
          },
        ],
      },
    });

    // Get subscription earnings statistics (excluding manual admin grants)
    const paidSubscriptionMatch = {
      status: {$in: ["active", "expired"]},
      paymentMethod: {$ne: "manual"},
      isManualGrant: {$ne: true},
    };

    const [
      totalEarnings,
      earningsByTier,
      earningsByMonth,
      subscriptionCounts,
      recentSubscriptions,
    ] = await Promise.all([
      // Total earnings from all successful paid subscriptions
      Subscription.aggregate([
        {$match: paidSubscriptionMatch},
        {
          $group: {
            _id: null,
            totalRevenue: {$sum: "$amount"},
            totalINR: {
              $sum: {$cond: [{$eq: ["$currency", "INR"]}, "$amount", 0]},
            },
            totalUSD: {
              $sum: {$cond: [{$eq: ["$currency", "USD"]}, "$amount", 0]},
            },
            count: {$sum: 1},
          },
        },
      ]),
      // Earnings breakdown by tier
      Subscription.aggregate([
        {$match: paidSubscriptionMatch},
        {
          $group: {
            _id: "$tier",
            revenue: {$sum: "$amount"},
            count: {$sum: 1},
          },
        },
        {$sort: {revenue: -1}},
      ]),
      // Earnings by month (last 6 months)
      Subscription.aggregate([
        {
          $match: {
            ...paidSubscriptionMatch,
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {format: "%Y-%m", date: "$createdAt"},
            },
            revenue: {$sum: "$amount"},
            count: {$sum: 1},
          },
        },
        {$sort: {_id: 1}},
      ]),
      // Subscription counts by status
      Subscription.aggregate([
        {
          $group: {
            _id: "$status",
            count: {$sum: 1},
          },
        },
      ]),
      // Recent subscriptions
      Subscription.find({status: {$in: ["active", "expired"]}})
        .populate("userId", "name email")
        .sort({createdAt: -1})
        .limit(5)
        .select("userId tier plan amount currency status createdAt"),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalResumes,
          totalTemplates,
          totalAICalls,
          totalContacts,
          activeUsers,
          disabledUsers,
          totalAICost: totalAICost[0]?.total || 0,
          aiExtractions: {
            today: aiExtractionStats[0]?.totalExtractionsToday || 0,
            activeUsers: aiExtractionStats[0]?.totalExtractionUsers || 0,
            usersAtLimit: usersAtExtractionLimit,
          },
          earnings: {
            totalRevenue: totalEarnings[0]?.totalRevenue || 0,
            totalINR: totalEarnings[0]?.totalINR || 0,
            totalUSD: totalEarnings[0]?.totalUSD || 0,
            totalSubscriptions: totalEarnings[0]?.count || 0,
          },
        },
        charts: {
          usersGrowth,
          resumesGrowth,
          aiUsageByFeature,
          earningsByMonth,
          earningsByTier,
        },
        subscriptions: {
          byStatus: subscriptionCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recent: recentSubscriptions,
        },
        recentActivity: {
          users: recentUsers,
          resumes: recentResumes,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Get All Users with Filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {email: {$regex: search, $options: "i"}},
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Build sort query
    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const [resumeCounts, aiUsageStats] = await Promise.all([
      Resume.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
      AIUsage.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            totalCostUsd: { $sum: "$cost" },
            totalTokens: { $sum: "$tokensUsed" },
          },
        },
      ]),
    ]);

    const resumeCountMap = resumeCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const aiUsageMap = aiUsageStats.reduce((acc, item) => {
      acc[item._id.toString()] = {
        count: item.count,
        costUsd: item.totalCostUsd || 0,
        costInr: +((item.totalCostUsd || 0) * 86.5).toFixed(2),
        tokens: item.totalTokens || 0,
      };
      return acc;
    }, {});

    const usersWithStats = users.map((user) => {
      const uId = user._id.toString();
      const ai = aiUsageMap[uId] || { count: 0, costUsd: 0, costInr: 0, tokens: 0 };
      return {
        ...user.toObject(),
        resumeCount: resumeCountMap[uId] || 0,
        aiUsageCount: ai.count,
        aiCostInr: ai.costInr,
        aiCostUsd: ai.costUsd,
        aiTokensUsed: ai.tokens,
      };
    });

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Get Single User Details
export const getUserDetails = async (req, res) => {
  try {
    const {userId} = req.params;

    const user = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const safeLimit = (limitType) => {
      const limit = user.getUsageLimit(limitType);
      return {
        limit,
        unlimited: limit === Infinity,
      };
    };

    const usageLimits = {
      resumesPerMonth: {
        used: user.usage?.resumesThisMonth || 0,
        ...safeLimit("resumesPerMonth"),
      },
      resumeDownloadsPerMonth: {
        used: user.usage?.resumesDownloadedThisMonth || 0,
        ...safeLimit("resumeDownloadsPerMonth"),
      },
      atsScansPerMonth: {
        used: user.usage?.atsScansThisMonth || 0,
        ...safeLimit("atsScansPerMonth"),
      },
      jobMatchesPerDay: {
        used: user.usage?.jobMatchesToday || 0,
        ...safeLimit("jobMatchesPerDay"),
      },
      coverLettersPerMonth: {
        used: user.usage?.coverLettersThisMonth || 0,
        ...safeLimit("coverLettersPerMonth"),
      },
      aiGenerationsPerMonth: {
        used: user.usage?.aiGenerationsThisMonth || 0,
        ...safeLimit("aiGenerationsPerMonth"),
      },
      aiResumeExtractionsPerDay: {
        used: user.usage?.aiResumeExtractionsToday || 0,
        ...safeLimit("aiResumeExtractionsPerDay"),
        lastReset: user.usage?.lastDailyReset,
      },
    };

    const [
      resumes,
      resumeCount,
      aiUsage,
      aiStats,
      aiSummaryByProvider,
      aiSummaryByStatus,
      subscriptionHistory,
      interviewSessions,
      interviewCounts,
      adminActivity,
    ] = await Promise.all([
      Resume.find({userId})
        .select(
          "resumeTitle description name contact.email templateId colorTheme subscriptionInfo createdAt updatedAt"
        )
        .sort({createdAt: -1})
        .limit(25)
        .lean(),
      Resume.countDocuments({userId}),
      AIUsage.find({userId})
        .sort({createdAt: -1})
        .limit(20)
        .select(
          "aiProvider aiModel feature tokensUsed cost responseTime status countTowardsQuota errorMessage createdAt"
        )
        .lean(),
      AIUsage.aggregate([
        {$match: {userId: user._id}},
        {
          $group: {
            _id: "$feature",
            count: {$sum: 1},
            successCount: {
              $sum: {$cond: [{$eq: ["$status", "success"]}, 1, 0]},
            },
            errorCount: {
              $sum: {$cond: [{$eq: ["$status", "error"]}, 1, 0]},
            },
            timeoutCount: {
              $sum: {$cond: [{$eq: ["$status", "timeout"]}, 1, 0]},
            },
            totalTokens: {$sum: "$tokensUsed"},
            totalCost: {$sum: "$cost"},
            avgResponseTime: {$avg: "$responseTime"},
          },
        },
        {$sort: {count: -1}},
      ]),
      AIUsage.aggregate([
        {$match: {userId: user._id}},
        {
          $group: {
            _id: "$aiProvider",
            count: {$sum: 1},
            totalTokens: {$sum: "$tokensUsed"},
            totalCost: {$sum: "$cost"},
            avgResponseTime: {$avg: "$responseTime"},
          },
        },
        {$sort: {count: -1}},
      ]),
      AIUsage.aggregate([
        {$match: {userId: user._id}},
        {
          $group: {
            _id: "$status",
            count: {$sum: 1},
            totalTokens: {$sum: "$tokensUsed"},
            totalCost: {$sum: "$cost"},
          },
        },
      ]),
      Subscription.getUserSubscriptionHistory(userId),
      InterviewSession.find({userId})
        .select(
          "interviewType role experienceLevel mode status currentQuestionIndex totalQuestions questions.evaluation.score questions.userAnswer questions.skipped startedAt completedAt totalDurationSeconds createdAt updatedAt"
        )
        .sort({createdAt: -1})
        .limit(10),
      InterviewSession.aggregate([
        {$match: {userId: user._id}},
        {
          $group: {
            _id: "$status",
            count: {$sum: 1},
            totalDurationSeconds: {$sum: "$totalDurationSeconds"},
          },
        },
      ]),
      AdminLog.find({targetType: "user", targetId: user._id})
        .populate("adminId", "name email")
        .sort({createdAt: -1})
        .limit(10)
        .select("adminId action targetType targetId description createdAt")
        .lean(),
    ]);

    const interviewSessionSummaries = interviewSessions.map((session) => {
      const answeredQuestions = session.questions.filter(
        (question) => question.userAnswer || question.skipped
      ).length;
      const scoredQuestions = session.questions.filter(
        (question) => question.evaluation?.score > 0
      );
      const averageScore =
        scoredQuestions.length > 0
          ? Math.round(
              scoredQuestions.reduce(
                (sum, question) => sum + question.evaluation.score,
                0
              ) / scoredQuestions.length
            )
          : 0;

      return {
        _id: session._id,
        interviewType: session.interviewType,
        role: session.role,
        experienceLevel: session.experienceLevel,
        mode: session.mode,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        answeredQuestions,
        progress:
          session.totalQuestions > 0
            ? Math.round((answeredQuestions / session.totalQuestions) * 100)
            : 0,
        averageScore,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        totalDurationSeconds: session.totalDurationSeconds,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    });

    const aiTotals = aiStats.reduce(
      (totals, item) => ({
        calls: totals.calls + item.count,
        success: totals.success + item.successCount,
        errors: totals.errors + item.errorCount,
        timeouts: totals.timeouts + item.timeoutCount,
        tokens: totals.tokens + item.totalTokens,
        cost: totals.cost + item.totalCost,
      }),
      {calls: 0, success: 0, errors: 0, timeouts: 0, tokens: 0, cost: 0}
    );

    const activeSubscription =
      subscriptionHistory.find((subscription) => subscription.status === "active") ||
      subscriptionHistory[0] ||
      null;
    const successfulPaymentStatuses = ["active", "cancelled", "expired"];
    const paymentSummary = subscriptionHistory.reduce(
      (summary, subscription) => {
        const amount = Number(subscription.amount || 0);
        const currency = subscription.currency || "INR";

        summary.totalPayments += 1;
        summary.byStatus[subscription.status] =
          (summary.byStatus[subscription.status] || 0) + 1;

        if (subscription.receiptId) {
          summary.receipts += 1;
        }

        if (subscription.status === "failed") {
          summary.failedPayments += 1;
          summary.failedAmountByCurrency[currency] =
            (summary.failedAmountByCurrency[currency] || 0) + amount;
        }

        const isPaidRealPayment =
          successfulPaymentStatuses.includes(subscription.status) &&
          subscription.paymentMethod !== "manual" &&
          !subscription.isManualGrant;

        if (isPaidRealPayment) {
          summary.successfulPayments += 1;
          summary.paidAmountByCurrency[currency] =
            (summary.paidAmountByCurrency[currency] || 0) + amount;
        }

        return summary;
      },
      {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        receipts: 0,
        paidAmountByCurrency: {},
        failedAmountByCurrency: {},
        byStatus: {},
      }
    );

    res.json({
      success: true,
      data: {
        user,
        resumes,
        resumeSummary: {
          total: resumeCount,
          returned: resumes.length,
        },
        aiUsage,
        aiStats,
        aiSummary: {
          totals: aiTotals,
          byFeature: aiStats,
          byProvider: aiSummaryByProvider,
          byStatus: aiSummaryByStatus,
        },
        subscription: {
          current: user.subscription || null,
          activeRecord: activeSubscription,
          history: subscriptionHistory,
        },
        payments: {
          summary: paymentSummary,
          history: subscriptionHistory,
          failed: subscriptionHistory.filter(
            (subscription) => subscription.status === "failed"
          ),
          receipts: subscriptionHistory.filter(
            (subscription) => subscription.receiptId || subscription.invoiceUrl
          ),
        },
        interviews: {
          sessions: interviewSessionSummaries,
          summary: {
            total: interviewCounts.reduce((sum, item) => sum + item.count, 0),
            byStatus: interviewCounts,
            totalDurationSeconds: interviewCounts.reduce(
              (sum, item) => sum + (item.totalDurationSeconds || 0),
              0
            ),
          },
        },
        activity: adminActivity,
        usageLimits,
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: error.message,
    });
  }
};

// Update User Status (Enable/Disable)
export const updateUserStatus = async (req, res) => {
  try {
    const {userId} = req.params;
    const {status} = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {status},
      {new: true}
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Log admin action
    await AdminLog.create({
      adminId: req.user.userId,
      action: status === "active" ? "user_enabled" : "user_disabled",
      targetType: "user",
      targetId: userId,
      description: `User ${user.email} ${
        status === "active" ? "enabled" : "disabled"
      }`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${
        status === "active" ? "enabled" : "disabled"
      } successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const {userId} = req.params;
    const {role} = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role value",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {role},
      {new: true}
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Log admin action
    await AdminLog.create({
      adminId: req.user.userId,
      action: "other",
      targetType: "user",
      targetId: userId,
      description: `User ${user.email} role changed to ${role}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

// Manually Activate User Subscription
export const activateUserSubscription = async (req, res) => {
  try {
    const {userId} = req.params;
    const {
      tier,
      plan,
      durationDays,
      amount,
      currency = "INR",
      autoRenew = false,
      notes = "",
    } = req.body;

    const validationMessage = validateSubscriptionSelection(tier, plan);
    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    if (!SUBSCRIPTION_CURRENCIES.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Currency must be INR or USD",
      });
    }

    const normalizedDurationDays = Number(
      durationDays || getDefaultPlanDuration(plan)
    );
    if (!Number.isFinite(normalizedDurationDays) || normalizedDurationDays < 1) {
      return res.status(400).json({
        success: false,
        message: "Duration days must be a positive number",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();
    const endDate = addDays(now, normalizedDurationDays);
    // Admin manual activations are complimentary grants and must NOT increase platform earnings; default to 0
    const normalizedAmount =
      amount !== "" && amount !== null && amount !== undefined
        ? Math.max(0, Number(amount))
        : 0;

    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number",
      });
    }

    await Subscription.updateMany(
      {userId, status: "active"},
      {
        $set: {
          status: "expired",
          autoRenew: false,
          notes: "Replaced by admin manual activation",
        },
      }
    );

    const receiptId = createManualReceiptId();
    const subscription = await Subscription.create({
      userId,
      tier,
      plan,
      status: "active",
      startDate: now,
      endDate,
      amount: normalizedAmount,
      currency,
      paymentMethod: "manual",
      isManualGrant: true,
      receiptId,
      paymentId: receiptId,
      orderId: receiptId,
      autoRenew: Boolean(autoRenew),
      notes: notes || "Manually activated by admin (complimentary grant)",
      metadata: {
        activatedByAdminId: req.user.userId,
        durationDays: normalizedDurationDays,
        isManualGrant: true,
      },
    });

    user.subscription = {
      tier,
      plan,
      status: "active",
      startDate: now,
      endDate,
      paymentId: subscription.paymentId,
      orderId: subscription.orderId,
      receiptId,
      autoRenew: Boolean(autoRenew),
    };
    user.usage = getResetPeriodUsage(user.usage);
    await user.save();

    await AdminLog.create({
      adminId: req.user.userId,
      action: "other",
      targetType: "user",
      targetId: userId,
      description: `Subscription for ${user.email} manually activated as ${tier}/${plan}`,
      metadata: {
        tier,
        plan,
        durationDays: normalizedDurationDays,
        subscriptionId: subscription._id,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Subscription activated successfully",
      data: {subscription, user},
    });
  } catch (error) {
    console.error("Activate user subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate subscription",
      error: error.message,
    });
  }
};

// Extend User Subscription
export const extendUserSubscription = async (req, res) => {
  try {
    const {userId} = req.params;
    const {days, reason = ""} = req.body;
    const normalizedDays = Number(days);

    if (!Number.isFinite(normalizedDays) || normalizedDays < 1) {
      return res.status(400).json({
        success: false,
        message: "Days must be a positive number",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      !MANAGEABLE_SUBSCRIPTION_TIERS.includes(user.subscription?.tier) ||
      user.subscription?.status !== "active"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only active paid subscriptions can be extended",
      });
    }

    const activeSubscription = await Subscription.getActiveSubscription(userId);
    if (!activeSubscription) {
      return res.status(400).json({
        success: false,
        message: "No active subscription record found. Activate a new subscription instead.",
      });
    }

    const baseDate =
      user.subscription?.endDate && user.subscription.endDate > new Date()
        ? user.subscription.endDate
        : new Date();
    const newEndDate = addDays(baseDate, normalizedDays);

    activeSubscription.endDate = newEndDate;
    activeSubscription.status = "active";
    activeSubscription.notes = [
      activeSubscription.notes,
      `Extended by admin for ${normalizedDays} days${reason ? `: ${reason}` : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
    activeSubscription.metadata = {
      ...(activeSubscription.metadata || {}),
      lastExtendedByAdminId: req.user.userId,
      lastExtensionDays: normalizedDays,
      lastExtensionAt: new Date(),
    };
    await activeSubscription.save();

    user.subscription.status = "active";
    user.subscription.endDate = newEndDate;
    await user.save();

    await AdminLog.create({
      adminId: req.user.userId,
      action: "other",
      targetType: "user",
      targetId: userId,
      description: `Subscription for ${user.email} extended by ${normalizedDays} days`,
      metadata: {days: normalizedDays, reason, newEndDate},
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Subscription extended successfully",
      data: {subscription: activeSubscription, user},
    });
  } catch (error) {
    console.error("Extend user subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extend subscription",
      error: error.message,
    });
  }
};

// Cancel User Subscription Renewal/Access
export const cancelUserSubscription = async (req, res) => {
  try {
    const {userId} = req.params;
    const {reason = "Cancelled by admin"} = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!MANAGEABLE_SUBSCRIPTION_TIERS.includes(user.subscription?.tier)) {
      return res.status(400).json({
        success: false,
        message: "Only paid subscriptions can be cancelled",
      });
    }

    const activeSubscription = await Subscription.getActiveSubscription(userId);
    if (activeSubscription) {
      await activeSubscription.cancel(reason, "admin");
    }

    user.subscription.status = "cancelled";
    user.subscription.cancelledAt = new Date();
    user.subscription.cancelReason = reason;
    user.subscription.autoRenew = false;
    await user.save();

    await AdminLog.create({
      adminId: req.user.userId,
      action: "other",
      targetType: "user",
      targetId: userId,
      description: `Subscription for ${user.email} cancelled by admin`,
      metadata: {reason, subscriptionId: activeSubscription?._id},
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: {subscription: activeSubscription, user},
    });
  } catch (error) {
    console.error("Cancel user subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};

// Downgrade User To Free Plan
export const downgradeUserSubscription = async (req, res) => {
  try {
    const {userId} = req.params;
    const {reason = "Downgraded by admin"} = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();
    await Subscription.updateMany(
      {userId, status: "active"},
      {
        $set: {
          status: "cancelled",
          cancelledAt: now,
          cancelReason: reason,
          cancelledBy: "admin",
          autoRenew: false,
        },
      }
    );

    user.subscription = {
      tier: "free",
      plan: "free",
      status: "active",
      startDate: now,
      autoRenew: false,
    };
    user.usage = getResetPeriodUsage(user.usage);
    await user.save();

    await AdminLog.create({
      adminId: req.user.userId,
      action: "other",
      targetType: "user",
      targetId: userId,
      description: `Subscription for ${user.email} downgraded to free`,
      metadata: {reason},
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "User downgraded to free successfully",
      data: {user},
    });
  } catch (error) {
    console.error("Downgrade user subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to downgrade subscription",
      error: error.message,
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const {userId} = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user's resumes
    await Resume.deleteMany({userId});

    // Delete user's AI usage records
    await AIUsage.deleteMany({userId});

    // Delete user
    await User.findByIdAndDelete(userId);

    // Log admin action
    await AdminLog.create({
      adminId: req.user.userId,
      action: "user_deleted",
      targetType: "user",
      targetId: userId,
      description: `User ${user.email} deleted`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Get AI Usage Analytics
export const getAIAnalytics = async (req, res) => {
  try {
    const {period = "7d", feature = ""} = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "24h":
        startDate.setHours(now.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const matchFilter = {createdAt: {$gte: startDate}};
    if (feature) matchFilter.feature = feature;

    // Get usage over time
    const usageOverTime = await AIUsage.aggregate([
      {$match: matchFilter},
      {
        $group: {
          _id: {
            $dateToString: {format: "%Y-%m-%d", date: "$createdAt"},
          },
          count: {$sum: 1},
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
        },
      },
      {$sort: {_id: 1}},
    ]);

    // Get usage by AI provider (OpenAI vs Gemini)
    const usageByProvider = await AIUsage.aggregate([
      {$match: matchFilter},
      {
        $group: {
          _id: "$aiProvider",
          count: {$sum: 1},
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
          avgResponseTime: {$avg: "$responseTime"},
        },
      },
    ]);

    // Get usage by feature (separated by provider)
    const usageByFeature = await AIUsage.aggregate([
      {$match: matchFilter},
      {
        $group: {
          _id: {
            feature: "$feature",
            provider: "$aiProvider",
          },
          count: {$sum: 1},
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
          avgResponseTime: {$avg: "$responseTime"},
        },
      },
      {
        $group: {
          _id: "$_id.feature",
          providers: {
            $push: {
              provider: "$_id.provider",
              count: "$count",
              totalTokens: "$totalTokens",
              totalCost: "$totalCost",
              avgResponseTime: "$avgResponseTime",
            },
          },
          totalCount: {$sum: "$count"},
          totalTokens: {$sum: "$totalTokens"},
          totalCost: {$sum: "$totalCost"},
        },
      },
    ]);

    // Get usage by status
    const usageByStatus = await AIUsage.aggregate([
      {$match: matchFilter},
      {
        $group: {
          _id: "$status",
          count: {$sum: 1},
        },
      },
    ]);

    // Get top users
    const topUsers = await AIUsage.aggregate([
      {$match: matchFilter},
      {
        $group: {
          _id: "$userId",
          count: {$sum: 1},
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
          openaiCalls: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "openai"]},
                    {$eq: ["$aiModel", "gpt4o"]},
                  ],
                },
                1,
                0,
              ],
            },
          },
          geminiCalls: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "gemini"]},
                    {$eq: ["$aiModel", "gemini"]},
                  ],
                },
                1,
                0,
              ],
            },
          },
          openaiCost: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "openai"]},
                    {$eq: ["$aiModel", "gpt4o"]},
                  ],
                },
                "$cost",
                0,
              ],
            },
          },
          geminiCost: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "gemini"]},
                    {$eq: ["$aiModel", "gemini"]},
                  ],
                },
                "$cost",
                0,
              ],
            },
          },
        },
      },
      {$sort: {count: -1}},
      {$limit: 10},
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {$unwind: "$user"},
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          count: 1,
          totalTokens: 1,
          totalCost: 1,
          openaiCalls: 1,
          geminiCalls: 1,
          openaiCost: 1,
          geminiCost: 1,
        },
      },
    ]);

    // Get recent logs
    const recentLogs = await AIUsage.find(matchFilter)
      .populate("userId", "name email")
      .sort({createdAt: -1})
      .limit(50);

    // Get totals (separated by provider)
    const totals = await AIUsage.aggregate([
      {$match: matchFilter},
      {
        $group: {
          _id: null,
          totalCalls: {$sum: 1},
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
          avgResponseTime: {$avg: "$responseTime"},
          openaiCalls: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "openai"]},
                    {$eq: ["$aiModel", "gpt4o"]},
                  ],
                },
                1,
                0,
              ],
            },
          },
          geminiCalls: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "gemini"]},
                    {$eq: ["$aiModel", "gemini"]},
                  ],
                },
                1,
                0,
              ],
            },
          },
          hybridCalls: {
            $sum: {$cond: [{$eq: ["$aiProvider", "hybrid"]}, 1, 0]},
          },
          openaiTokens: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "openai"]},
                    {$eq: ["$aiModel", "gpt4o"]},
                  ],
                },
                "$tokensUsed",
                0,
              ],
            },
          },
          geminiTokens: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "gemini"]},
                    {$eq: ["$aiModel", "gemini"]},
                  ],
                },
                "$tokensUsed",
                0,
              ],
            },
          },
          openaiCost: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "openai"]},
                    {$eq: ["$aiModel", "gpt4o"]},
                  ],
                },
                "$cost",
                0,
              ],
            },
          },
          geminiCost: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {$eq: ["$aiProvider", "gemini"]},
                    {$eq: ["$aiModel", "gemini"]},
                  ],
                },
                "$cost",
                0,
              ],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totals: totals[0] || {
          totalCalls: 0,
          totalTokens: 0,
          totalCost: 0,
          avgResponseTime: 0,
          openaiCalls: 0,
          geminiCalls: 0,
          hybridCalls: 0,
          openaiTokens: 0,
          geminiTokens: 0,
          openaiCost: 0,
          geminiCost: 0,
        },
        charts: {
          usageOverTime,
          usageByFeature,
          usageByProvider,
          usageByStatus,
        },
        topUsers,
        recentLogs,
      },
    });
  } catch (error) {
    console.error("Get AI analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI analytics",
      error: error.message,
    });
  }
};

// Get All Contact Messages
export const getContactMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
      category = "",
      search = "",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {email: {$regex: search, $options: "i"}},
        {subject: {$regex: search, $options: "i"}},
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Contact.find(filter)
        .sort({createdAt: -1})
        .skip(skip)
        .limit(parseInt(limit)),
      Contact.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get contact messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
      error: error.message,
    });
  }
};

// Update Contact Message Status
export const updateContactStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const {status, notes} = req.body;

    const validStatuses = ["new", "read", "replied", "archived"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "replied") updateData.repliedAt = new Date();

    const contact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.json({
      success: true,
      message: "Contact status updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Update contact status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact status",
      error: error.message,
    });
  }
};

// Delete Contact Message
export const deleteContactMessage = async (req, res) => {
  try {
    const {id} = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact message",
      error: error.message,
    });
  }
};

// Get Contact Message Statistics
export const getContactStatistics = async (req, res) => {
  try {
    const [totalContacts, statusStats, categoryStats] = await Promise.all([
      Contact.countDocuments(),
      Contact.aggregate([
        {
          $group: {
            _id: "$status",
            count: {$sum: 1},
          },
        },
      ]),
      Contact.aggregate([
        {
          $group: {
            _id: "$category",
            count: {$sum: 1},
          },
        },
      ]),
    ]);

    // Get recent contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Contact.countDocuments({
      createdAt: {$gte: sevenDaysAgo},
    });

    res.json({
      success: true,
      data: {
        total: totalContacts,
        byStatus: statusStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        byCategory: categoryStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        recentCount,
      },
    });
  } catch (error) {
    console.error("Get contact statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact statistics",
      error: error.message,
    });
  }
};

// Get Admin Logs
export const getAdminLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action = "",
      adminId = "",
      startDate = "",
      endDate = "",
    } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (adminId) filter.adminId = adminId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .populate("adminId", "name email")
        .sort({createdAt: -1})
        .skip(skip)
        .limit(parseInt(limit)),
      AdminLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get admin logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin logs",
      error: error.message,
    });
  }
};

// Get All Templates with Search, Filters, and Stats
export const getAllTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category = "",
      tier = "",
      isActive = "",
      search = "",
      sortBy = "atsScore",
      order = "desc",
    } = req.query;

    const filter = {};
    if (category && category !== "all") {
      filter.category = new RegExp(`^${category}$`, "i");
    }
    if (tier && tier !== "all") {
      filter.tier = tier;
    }
    if (isActive !== "" && isActive !== "all") {
      filter.isActive = isActive === "true";
    }
    if (search) {
      filter.$or = [
        {name: {$regex: search, $options: "i"}},
        {templateId: {$regex: search, $options: "i"}},
        {description: {$regex: search, $options: "i"}},
        {tags: {$in: [new RegExp(search, "i")]}},
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sort = {};
    if (sortBy === "atsScore") sort.atsScore = sortOrder;
    else if (sortBy === "usageCount") sort.usageCount = sortOrder;
    else if (sortBy === "name") sort.name = sortOrder;
    else sort.createdAt = sortOrder;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If database is empty, auto-seed with defaults
    const count = await Template.countDocuments();
    if (count === 0) {
      await autoSeedTemplates();
    }

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Template.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get all templates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message,
    });
  }
};

// Get Template Statistics Overview
export const getTemplateStats = async (req, res) => {
  try {
    let allTemplates = await Template.find();
    if (allTemplates.length === 0) {
      await autoSeedTemplates();
      allTemplates = await Template.find();
    }

    const stats = {
      total: allTemplates.length,
      active: allTemplates.filter((t) => t.isActive).length,
      inactive: allTemplates.filter((t) => !t.isActive).length,
      freeTier: allTemplates.filter((t) => t.tier === "free").length,
      oneTimeTier: allTemplates.filter((t) => t.tier === "one-time").length,
      proTier: allTemplates.filter((t) => t.tier === "pro").length,
      averageAtsScore: Math.round(
        allTemplates.reduce((acc, t) => acc + (t.atsScore || 95), 0) /
          (allTemplates.length || 1)
      ),
      byCategory: {},
      featuredCount: allTemplates.filter((t) => t.isFeatured).length,
    };

    allTemplates.forEach((t) => {
      const cat = t.category || "Professional";
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get template statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch template statistics",
      error: error.message,
    });
  }
};

// Helper: Seed Default Standard Templates
const DEFAULT_STANDARD_TEMPLATES = [
  {
    templateId: "silicon-valley",
    name: "Silicon Valley Tech Lead",
    category: "Tech",
    emoji: "⚡",
    atsScore: 99,
    tier: "free",
    badge: "Flagship 2026",
    description: "Stripe & Linear-inspired high-craft developer layout with ATS-safe metric badges and domain skill capsules.",
    tags: ["Developer", "Tech Lead", "Metric Highlighting", "Modern"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "latex-academic",
    name: "Stanford / LaTeX Academic Pro",
    category: "Academic",
    emoji: "🎓",
    atsScore: 100,
    tier: "free",
    badge: "100% ATS Grade",
    description: "Mathematical precision with classic academic serif typography, fine hairline rules, and publication metrics.",
    tags: ["LaTeX", "Academic", "PhD", "Research", "High-ATS"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "nordic-split",
    name: "Nordic Two-Column Architect",
    category: "Leadership",
    emoji: "📐",
    atsScore: 99,
    tier: "free",
    badge: "New Split-Rail",
    description: "Asymmetric 32/68 split layout with stylish left sidebar rail for skills & credentials and spacious right body.",
    tags: ["Two-Column", "Split-Rail", "Executive", "ATS-Safe"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "executive",
    name: "The Wall Street / Ivy League",
    category: "Leadership",
    emoji: "🏛️",
    atsScore: 99,
    tier: "free",
    badge: "Ivy League",
    description: "Dignified Ivy League aesthetic with centered masthead, Oxford double-rules, small-caps headers, and deal metric highlighting.",
    tags: ["Finance", "Consulting", "Wall Street", "Ivy League"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "classic",
    name: "Classic",
    category: "Professional",
    emoji: "📋",
    atsScore: 95,
    tier: "free",
    badge: "Most Popular",
    description: "Traditional single-column layout with maximum ATS parser clarity, tailored for corporate and enterprise roles.",
    tags: ["ATS-Optimized", "Clean", "Corporate", "Traditional"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "modern",
    name: "Modern",
    category: "Modern",
    emoji: "🎨",
    atsScore: 92,
    tier: "free",
    badge: "ATS Pick",
    description: "Sleek layout with modern header accent, structured sections, and high readability for fast-growing industries.",
    tags: ["Modern", "Accented", "Readable", "Balanced"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "minimal",
    name: "Minimal",
    category: "Minimal",
    emoji: "✨",
    atsScore: 98,
    tier: "free",
    badge: "98% ATS Score",
    description: "Ultra-clean whitespace-driven design optimized to pass even the strictest legacy ATS scanners.",
    tags: ["Minimalist", "High-Scoring", "Clean", "Simple"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "professional",
    name: "Professional",
    category: "Professional",
    emoji: "💼",
    atsScore: 94,
    tier: "one-time",
    badge: "Executive Pick",
    description: "Polished two-tone header format with distinct skill matrices and comprehensive career timelines.",
    tags: ["Corporate", "Experienced", "Timeline", "Skills"],
    isFeatured: false,
    isActive: true,
  },
  {
    templateId: "professional-v2",
    name: "Professional V2",
    category: "Professional",
    emoji: "📄",
    atsScore: 96,
    tier: "one-time",
    badge: "Trending",
    description: "Refined professional aesthetic with structured metric callouts and project highlights.",
    tags: ["Metrics", "Projects", "High-Impact"],
    isFeatured: false,
    isActive: true,
  },
  {
    templateId: "professional2",
    name: "Professional Elite",
    category: "Professional",
    emoji: "🏆",
    atsScore: 98,
    tier: "pro",
    badge: "Elite Pro",
    description: "Gold-standard executive format engineered for Director, VP, and Senior Leadership roles.",
    tags: ["Leadership", "Executive", "Elite", "High-ATS"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "tech",
    name: "Tech Developer",
    category: "Tech",
    emoji: "💻",
    atsScore: 93,
    tier: "one-time",
    badge: "Engineers Pick",
    description: "Developer-focused design featuring GitHub integration points, tech stacks, and live project links.",
    tags: ["Tech", "Software Engineer", "GitHub", "Code"],
    isFeatured: false,
    isActive: true,
  },
  {
    templateId: "githubstyle",
    name: "Metro Grid Narrative",
    category: "Tech",
    emoji: "🏙️",
    atsScore: 96,
    tier: "pro",
    badge: "DevOps & Cloud",
    description: "Modern grid system emphasizing technical skills, architecture repositories, and open source contributions.",
    tags: ["Developer", "OpenSource", "Grid", "Architecture"],
    isFeatured: false,
    isActive: true,
  },
  {
    templateId: "creative2",
    name: "Creative Designer Pro",
    category: "Creative",
    emoji: "🎨",
    atsScore: 94,
    tier: "one-time",
    badge: "Design Pick",
    description: "Sophisticated typography and visual hierarchy for UX/UI designers, Product Managers, and Content Creators.",
    tags: ["Design", "Portfolio", "UI/UX", "Creative"],
    isFeatured: false,
    isActive: true,
  },
  {
    templateId: "strategic-leader",
    name: "Strategic Leadership",
    category: "Leadership",
    emoji: "🎯",
    atsScore: 97,
    tier: "pro",
    badge: "C-Level & VP",
    description: "Strategic executive framing emphasizing business impact, revenue growth, and team scaling achievements.",
    tags: ["Strategy", "C-Suite", "Executive", "Management"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "impact-pro",
    name: "Impact Pro",
    category: "Professional",
    emoji: "⚡",
    atsScore: 98,
    tier: "pro",
    badge: "Top Rated",
    description: "High-impact narrative design focused on quantifiable KPIs, revenue attribution, and career acceleration.",
    tags: ["KPIs", "Impact", "Quantifiable", "High-ATS"],
    isFeatured: true,
    isActive: true,
  },
  {
    templateId: "structured-photo",
    name: "Structured Photo Pro",
    category: "Creative",
    emoji: "📸",
    atsScore: 95,
    tier: "pro",
    badge: "International",
    description: "Structured format with professional portrait header suited for European and International market standards.",
    tags: ["Photo", "International", "Structured", "Modern"],
    isFeatured: false,
    isActive: true,
  },
];

async function autoSeedTemplates() {
  for (const tpl of DEFAULT_STANDARD_TEMPLATES) {
    await Template.findOneAndUpdate(
      {templateId: tpl.templateId},
      {$setOnInsert: tpl},
      {upsert: true, new: true}
    );
  }
}

// Sync / Reset Standard Templates
export const syncDefaultTemplates = async (req, res) => {
  try {
    const adminId = req.user?.userId || req.user?._id;
    const results = [];

    for (const tpl of DEFAULT_STANDARD_TEMPLATES) {
      const updated = await Template.findOneAndUpdate(
        {templateId: tpl.templateId},
        {
          $set: {
            name: tpl.name,
            category: tpl.category,
            emoji: tpl.emoji,
            atsScore: tpl.atsScore,
            tier: tpl.tier,
            badge: tpl.badge,
            description: tpl.description,
            tags: tpl.tags,
            isFeatured: tpl.isFeatured,
            ...(adminId && {createdBy: adminId}),
          },
          $setOnInsert: {isActive: true},
        },
        {upsert: true, new: true}
      );
      results.push(updated);
    }

    if (adminId) {
      await AdminLog.create({
        adminId,
        action: "template_synced",
        targetType: "template",
        description: `Synchronized ${results.length} standard ATS templates`,
        ipAddress: req.ip,
      });
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${results.length} standard templates!`,
      data: results,
    });
  } catch (error) {
    console.error("Sync default templates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync standard templates",
      error: error.message,
    });
  }
};

// Create Template
export const createTemplate = async (req, res) => {
  try {
    const adminId = req.user?.userId || req.user?._id;
    const {
      templateId,
      name,
      category = "Professional",
      description = "",
      emoji = "📄",
      atsScore = 95,
      tier = "free",
      badge = "",
      tags = [],
      isActive = true,
      isFeatured = false,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    const normalizedId = (
      templateId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    ).toLowerCase();

    const existing = await Template.findOne({templateId: normalizedId});
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Template ID '${normalizedId}' already exists`,
      });
    }

    const template = await Template.create({
      templateId: normalizedId,
      name,
      category,
      description,
      emoji,
      atsScore: Number(atsScore) || 95,
      tier,
      badge,
      tags: Array.isArray(tags) ? tags : [],
      isActive,
      isFeatured,
      seo: req.body.seo || {},
      createdBy: adminId,
    });

    if (adminId) {
      await AdminLog.create({
        adminId,
        action: "template_created",
        targetType: "template",
        targetId: template._id,
        description: `Created template '${name}' (${normalizedId})`,
        ipAddress: req.ip,
      });
    }

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: error.message,
    });
  }
};

// Update Template Details
export const updateTemplate = async (req, res) => {
  try {
    const {templateId} = req.params;
    const adminId = req.user?.userId || req.user?._id;
    const updates = req.body;

    const template = await Template.findByIdAndUpdate(
      templateId,
      {$set: updates},
      {new: true, runValidators: true}
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    if (adminId) {
      await AdminLog.create({
        adminId,
        action: "template_updated",
        targetType: "template",
        targetId: templateId,
        description: `Updated template '${template.name}'`,
        ipAddress: req.ip,
      });
    }

    res.json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: error.message,
    });
  }
};

// Generate Template SEO with AI (Google #1 Ranking Copywriter)
export const generateTemplateSeoWithAI = async (req, res) => {
  try {
    const {
      name,
      category = "Professional",
      description = "",
      atsScore = 95,
      tier = "free",
      tags = [],
      targetAudience = "",
    } = req.body;

    const systemPrompt = `You are an Elite SEO Strategist and Google Search Ranking Master specializing in career platforms, resume builders, and ATS templates.
Your mission is to generate high-CTR, search-optimized SEO metadata that will rank #1 on Google and Bing for high-intent search terms like "resume", "professional resume", "ATS resume templates", and "${(category || "professional").toLowerCase()} resume format".

Requirements:
- metaTitle: 50-60 characters, highly clickable, includes primary keyword and brand "| SmartNShine"
- metaDescription: 145-160 characters, high conversion action copy highlighting ATS score, free/pro access, and instant export
- keywords: 12-15 specific high-volume keywords including "resume", "professional resume", "ATS resume templates"
- targetSearchQueries: 5 exact Google search query strings this template dominates
- faqItems: Array of 3 high-value Q&As designed for Google FAQPage Rich Snippets (Question + 40-50 word authoritative answer)
- ogTitle: Catchy social share title
- ogDescription: Persuasive social description

Return ONLY valid JSON matching this schema with NO markdown codeblocks or surrounding text:
{
  "metaTitle": "string",
  "metaDescription": "string",
  "keywords": ["string"],
  "targetSearchQueries": ["string"],
  "faqItems": [
    {"question": "string", "answer": "string"}
  ],
  "ogTitle": "string",
  "ogDescription": "string"
}`;

    const userPrompt = `Generate optimized SEO copy for this Resume Template:
Template Name: ${name || "Professional Elite"}
Category: ${category}
Description: ${description || "ATS-optimized single column layout with structured hierarchy"}
ATS Compatibility Rating: ${atsScore}%
Access Tier: ${tier}
Tags: ${Array.isArray(tags) ? tags.join(", ") : tags}
Target Audience / Roles: ${targetAudience || "Job Seekers, Software Engineers, Managers, Executives"}`;

    let textContent = "";
    try {
      const aiResult = await openaiService.chatCompletion(systemPrompt, userPrompt, {
        temperature: 0.7,
      });
      textContent =
        typeof aiResult === "string"
          ? aiResult
          : aiResult?.text || JSON.stringify(aiResult || {});
    } catch (aiErr) {
      console.error("OpenAI SEO generation error:", aiErr.message);
      // High-quality fallback if API key offline
      return res.json({
        success: true,
        data: {
          metaTitle: `${name || "Professional"} Resume Template - 98% ATS Score | SmartNShine`,
          metaDescription: `Create an interview-winning ${category || "professional"} resume with our top-rated ATS-optimized template. Designed to pass recruiter scanners with high scoring.`,
          keywords: [
            "resume",
            "professional resume",
            "ATS resume templates",
            `${(category || "professional").toLowerCase()} resume template`,
            "best resume format 2026",
            "free ATS resume builder",
            "clean modern CV format",
          ],
          targetSearchQueries: [
            `best ${category || "professional"} resume template`,
            "ATS friendly resume format",
            "professional CV templates free",
            "resume format download",
          ],
          faqItems: [
            {
              question: `Why is the ${name || "this"} template 100% ATS compliant?`,
              answer: `This template uses standard section hierarchy, clean typography, and zero unreadable nested tables, ensuring 100% readability across Taleo, Workday, and Greenhouse ATS scanners.`,
            },
            {
              question: `Can I customize the color themes and sections in ${name || "this template"}?`,
              answer: `Yes, you can customize color themes, rearrange section order, and export directly in ATS-compatible PDF format with zero formatting issues.`,
            },
            {
              question: `Is this ${name || "template"} suitable for both freshers and experienced candidates?`,
              answer: `Yes, the flexible layout highlights projects, work experience, and core competencies, making it ideal for all career stages.`,
            },
          ],
          ogTitle: `${name || "Professional"} Resume Template | SmartNShine`,
          ogDescription: `Build an ATS-optimized professional resume with ${name || "this"} template. High recruiter pass rate.`,
        },
      });
    }

    let parsedData;
    try {
      const cleanJson = textContent
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response:", parseErr, textContent);
      parsedData = {
        metaTitle: `${name || "Professional"} Resume Template - ATS Optimized | SmartNShine`,
        metaDescription: `Create a professional ATS-friendly resume using the ${name} template. Optimized layout with ${atsScore || 95}% compatibility rating.`,
        keywords: [
          "resume",
          "professional resume",
          "ATS resume templates",
          `${(name || "resume").toLowerCase()} template`,
          "best resume format",
        ],
        targetSearchQueries: [
          `${(name || "resume").toLowerCase()} resume template`,
          "professional resume templates",
          "ATS resume builder",
        ],
        faqItems: [
          {
            question: `How does the ${name} template help me pass ATS scans?`,
            answer: `It utilizes standardized typography and semantic section markers that applicant tracking software parses with high accuracy.`,
          },
        ],
        ogTitle: `${name} Resume Template`,
        ogDescription: `Download and build your ATS-ready resume with the ${name} template on SmartNShine.`,
      };
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("Generate template SEO error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate SEO metadata with AI",
      error: error.message,
    });
  }
};

// Update Template Status (Instant Toggle)
export const updateTemplateStatus = async (req, res) => {
  try {
    const {templateId} = req.params;
    const {isActive} = req.body;
    const adminId = req.user?.userId || req.user?._id;

    const template = await Template.findByIdAndUpdate(
      templateId,
      {isActive},
      {new: true}
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Log admin action
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: isActive ? "template_enabled" : "template_disabled",
        targetType: "template",
        targetId: templateId,
        description: `Template ${template.name} ${
          isActive ? "enabled" : "disabled"
        }`,
        ipAddress: req.ip,
      });
    }

    res.json({
      success: true,
      message: `Template '${template.name}' ${isActive ? "enabled" : "disabled"} successfully`,
      data: template,
    });
  } catch (error) {
    console.error("Update template status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update template status",
      error: error.message,
    });
  }
};

// Delete Template
export const deleteTemplate = async (req, res) => {
  try {
    const {templateId} = req.params;
    const adminId = req.user?.userId || req.user?._id;

    const template = await Template.findByIdAndDelete(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Log admin action
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: "template_deleted",
        targetType: "template",
        targetId: templateId,
        description: `Template '${template.name}' deleted`,
        ipAddress: req.ip,
      });
    }

    res.json({
      success: true,
      message: `Template '${template.name}' deleted successfully`,
    });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: error.message,
    });
  }
};

// Get All Feedback (Admin)
export const getAllFeedback = async (req, res) => {
  try {
    const {type, status, priority, page = 1, limit = 20, search} = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        {title: {$regex: search, $options: "i"}},
        {description: {$regex: search, $options: "i"}},
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await Feedback.find(query)
      .sort({createdAt: -1})
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email")
      .populate("resolvedBy", "name email");

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all feedback error:", error);
    res.status(500).json({error: "Failed to fetch feedback"});
  }
};

// Update Feedback Status (Admin)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const {id} = req.params;
    const {status, adminResponse, adminNotes} = req.body;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({error: "Feedback not found"});
    }

    if (status) feedback.status = status;
    if (adminResponse) feedback.adminResponse = adminResponse;
    if (adminNotes) feedback.adminNotes = adminNotes;

    if (status === "resolved" || status === "closed") {
      feedback.resolvedAt = new Date();
      feedback.resolvedBy = req.user.userId;
    }

    await feedback.save();
    await feedback.populate("userId", "name email");
    await feedback.populate("resolvedBy", "name email");

    res.json({
      message: "Feedback updated successfully",
      feedback,
    });
  } catch (error) {
    console.error("Update feedback status error:", error);
    res.status(500).json({error: "Failed to update feedback"});
  }
};

// Delete Feedback (Admin)
export const deleteFeedbackAdmin = async (req, res) => {
  try {
    const {id} = req.params;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({error: "Feedback not found"});
    }

    await feedback.deleteOne();

    res.json({message: "Feedback deleted successfully"});
  } catch (error) {
    console.error("Delete feedback error:", error);
    res.status(500).json({error: "Failed to delete feedback"});
  }
};

// Get Feedback Statistics (Admin)
export const getFeedbackStatistics = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: {$sum: 1},
          improvements: {
            $sum: {$cond: [{$eq: ["$type", "improvement"]}, 1, 0]},
          },
          feedbacks: {
            $sum: {$cond: [{$eq: ["$type", "feedback"]}, 1, 0]},
          },
          bugs: {$sum: {$cond: [{$eq: ["$type", "bug"]}, 1, 0]}},
          open: {$sum: {$cond: [{$eq: ["$status", "open"]}, 1, 0]}},
          inProgress: {
            $sum: {$cond: [{$eq: ["$status", "in-progress"]}, 1, 0]},
          },
          resolved: {
            $sum: {$cond: [{$eq: ["$status", "resolved"]}, 1, 0]},
          },
          closed: {$sum: {$cond: [{$eq: ["$status", "closed"]}, 1, 0]}},
          avgUpvotes: {$avg: "$upvotes"},
        },
      },
    ]);

    // Get feedback by category
    const byCategory = await Feedback.aggregate([
      {
        $group: {
          _id: "$category",
          count: {$sum: 1},
        },
      },
      {
        $sort: {count: -1},
      },
    ]);

    // Get top upvoted feedback
    const topFeedback = await Feedback.find()
      .sort({upvotes: -1})
      .limit(10)
      .populate("userId", "name email");

    res.json({
      stats: stats[0] || {
        total: 0,
        improvements: 0,
        feedbacks: 0,
        bugs: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        avgUpvotes: 0,
      },
      byCategory,
      topFeedback,
    });
  } catch (error) {
    console.error("Get feedback statistics error:", error);
    res.status(500).json({error: "Failed to fetch statistics"});
  }
};

// ============================================
// AI QUOTA MONITORING ENDPOINTS
// ============================================

/**
 * Get all users with their AI quota status
 * GET /api/admin/ai-quota/users
 */
export const getUserQuotaStatus = async (req, res) => {
  try {
    const {sortBy = "usage", order = "desc", search = ""} = req.query;

    // Get all users
    const searchFilter = search
      ? {
          $or: [
            {name: {$regex: search, $options: "i"}},
            {email: {$regex: search, $options: "i"}},
          ],
        }
      : {};

    const users = await User.find(searchFilter).select(
      "name email role status subscription.tier createdAt"
    );

    // Calculate quota status for each user
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const quotaStatuses = await Promise.all(
      users.map(async (user) => {
        // Get daily and monthly usage
        const [dailyUsage, monthlyUsage] = await Promise.all([
          AIUsage.countDocuments({
            userId: user._id,
            createdAt: {$gte: startOfDay},
            status: "success",
            countTowardsQuota: {$ne: false}, // Only count records that count towards quota
          }),
          AIUsage.countDocuments({
            userId: user._id,
            createdAt: {$gte: startOfMonth},
            status: "success",
            countTowardsQuota: {$ne: false}, // Only count records that count towards quota
          }),
        ]);

        // Get monthly costs with provider breakdown
        const monthlyCosts = await AIUsage.aggregate([
          {
            $match: {
              userId: user._id,
              createdAt: {$gte: startOfMonth},
              status: "success",
            },
          },
          {
            $group: {
              _id: null,
              totalCost: {$sum: "$cost"},
              totalTokens: {$sum: "$tokensUsed"},
              openaiCost: {
                $sum: {
                  $cond: [{$eq: ["$aiProvider", "openai"]}, "$cost", 0],
                },
              },
              geminiCost: {
                $sum: {
                  $cond: [{$eq: ["$aiProvider", "gemini"]}, "$cost", 0],
                },
              },
              hybridCost: {
                $sum: {
                  $cond: [{$eq: ["$aiProvider", "hybrid"]}, "$cost", 0],
                },
              },
            },
          },
        ]);

        // Get provider breakdown for calls
        const providerBreakdown = await AIUsage.aggregate([
          {
            $match: {
              userId: user._id,
              createdAt: {$gte: startOfMonth},
              status: "success",
            },
          },
          {
            $group: {
              _id: "$aiProvider",
              calls: {$sum: 1},
              cost: {$sum: "$cost"},
              tokens: {$sum: "$tokensUsed"},
            },
          },
        ]);

        // Format provider data
        const providerData = {
          openai: {calls: 0, cost: 0, tokens: 0},
          gemini: {calls: 0, cost: 0, tokens: 0},
          hybrid: {calls: 0, cost: 0, tokens: 0},
        };

        providerBreakdown.forEach((item) => {
          if (item._id && providerData[item._id]) {
            providerData[item._id] = {
              calls: item.calls,
              cost: item.cost,
              tokens: item.tokens,
            };
          }
        });

        const tier = getEffectiveTier(user);
        const limits = AI_QUOTA_LIMITS;
        const dailyLimit = limits[tier].daily;
        const monthlyLimit = limits[tier].monthly;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          tier,
          quota: {
            daily: {
              used: dailyUsage,
              limit: dailyLimit,
              remaining: Math.max(0, dailyLimit - dailyUsage),
              percentage:
                dailyLimit === Infinity ? 0 : (dailyUsage / dailyLimit) * 100,
            },
            monthly: {
              used: monthlyUsage,
              limit: monthlyLimit,
              remaining: Math.max(0, monthlyLimit - monthlyUsage),
              percentage:
                monthlyLimit === Infinity
                  ? 0
                  : (monthlyUsage / monthlyLimit) * 100,
              totalCost: monthlyCosts[0]?.totalCost || 0,
              totalTokens: monthlyCosts[0]?.totalTokens || 0,
            },
          },
          providers: {
            openai: providerData.openai,
            gemini: providerData.gemini,
            hybrid: providerData.hybrid,
          },
          createdAt: user.createdAt,
        };
      })
    );

    // Sort results
    quotaStatuses.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "usage":
          comparison = b.quota.daily.used - a.quota.daily.used;
          break;
        case "cost":
          comparison = b.quota.monthly.totalCost - a.quota.monthly.totalCost;
          break;
        case "percentage":
          comparison = b.quota.daily.percentage - a.quota.daily.percentage;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = b.quota.daily.used - a.quota.daily.used;
      }
      return order === "desc" ? comparison : -comparison;
    });

    res.json({
      users: quotaStatuses,
      totalUsers: quotaStatuses.length,
      summary: {
        totalDailyUsage: quotaStatuses.reduce(
          (sum, u) => sum + u.quota.daily.used,
          0
        ),
        totalMonthlyCost: quotaStatuses.reduce(
          (sum, u) => sum + u.quota.monthly.totalCost,
          0
        ),
        openaiCost: quotaStatuses.reduce(
          (sum, u) => sum + (u.providers?.openai?.cost || 0),
          0
        ),
        geminiCost: quotaStatuses.reduce(
          (sum, u) => sum + (u.providers?.gemini?.cost || 0),
          0
        ),
        openaiCalls: quotaStatuses.reduce(
          (sum, u) => sum + (u.providers?.openai?.calls || 0),
          0
        ),
        geminiCalls: quotaStatuses.reduce(
          (sum, u) => sum + (u.providers?.gemini?.calls || 0),
          0
        ),
        usersNearLimit: quotaStatuses.filter(
          (u) => u.quota.daily.percentage >= 80 && u.tier !== "admin"
        ).length,
        usersOverLimit: quotaStatuses.filter(
          (u) => u.quota.daily.used >= u.quota.daily.limit && u.tier !== "admin"
        ).length,
      },
    });
  } catch (error) {
    console.error("Get user quota status error:", error);
    res.status(500).json({error: "Failed to fetch user quota status"});
  }
};

/**
 * Get detailed quota info for a specific user
 * GET /api/admin/ai-quota/users/:userId
 */
export const getUserQuotaDetails = async (req, res) => {
  try {
    const {userId} = req.params;

    const user = await User.findById(userId).select(
      "name email role status subscription.tier"
    );
    if (!user) {
      return res.status(404).json({error: "User not found"});
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get usage breakdown by feature
    const usageByFeature = await AIUsage.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: {$gte: startOfMonth},
        },
      },
      {
        $group: {
          _id: "$feature",
          count: {$sum: 1},
          successCount: {
            $sum: {$cond: [{$eq: ["$status", "success"]}, 1, 0]},
          },
          errorCount: {
            $sum: {$cond: [{$eq: ["$status", "error"]}, 1, 0]},
          },
          totalTokens: {$sum: "$tokensUsed"},
          totalCost: {$sum: "$cost"},
          avgResponseTime: {$avg: "$responseTime"},
        },
      },
    ]);

    // Get daily usage over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyUsage = await AIUsage.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: {$gte: thirtyDaysAgo},
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {format: "%Y-%m-%d", date: "$createdAt"},
          },
          count: {$sum: 1},
          successCount: {
            $sum: {$cond: [{$eq: ["$status", "success"]}, 1, 0]},
          },
          totalCost: {$sum: "$cost"},
        },
      },
      {$sort: {_id: 1}},
    ]);

    // Get recent requests
    const recentRequests = await AIUsage.find({userId: user._id})
      .sort({createdAt: -1})
      .limit(20)
      .select(
        "feature tokensUsed cost responseTime status createdAt errorMessage"
      );

    // Calculate quota status
    const [dailyUsageCount, monthlyUsageCount] = await Promise.all([
      AIUsage.countDocuments({
        userId: user._id,
        createdAt: {$gte: startOfDay},
        status: "success",
      }),
      AIUsage.countDocuments({
        userId: user._id,
        createdAt: {$gte: startOfMonth},
        status: "success",
      }),
    ]);

    const tier = getEffectiveTier(user);
    const limits = AI_QUOTA_LIMITS;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        tier,
      },
      quota: {
        daily: {
          used: dailyUsageCount,
          limit: limits[tier].daily,
          remaining: Math.max(0, limits[tier].daily - dailyUsageCount),
        },
        monthly: {
          used: monthlyUsageCount,
          limit: limits[tier].monthly,
          remaining: Math.max(0, limits[tier].monthly - monthlyUsageCount),
        },
      },
      usageByFeature,
      dailyUsage,
      recentRequests,
    });
  } catch (error) {
    console.error("Get user quota details error:", error);
    res.status(500).json({error: "Failed to fetch user quota details"});
  }
};

/**
 * Update user's subscription tier for quota/admin support.
 * PATCH /api/admin/ai-quota/users/:userId/tier
 */
export const updateUserTier = async (req, res) => {
  try {
    const {userId} = req.params;
    const {tier} = req.body;

    if (!ACTIVE_SUBSCRIPTION_TIERS.includes(tier)) {
      return res
        .status(400)
        .json({error: "Invalid tier. Must be 'free', 'one-time', or 'pro'"});
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({error: "User not found"});
    }

    user.subscription.tier = tier;
    user.subscription.plan =
      tier === "pro" ? user.subscription.plan || "monthly" : tier;
    user.subscription.status = "active";
    user.subscription.startDate = user.subscription.startDate || new Date();
    user.subscription.endDate = tier === "free" ? undefined : user.subscription.endDate;
    await user.save();

    res.json({
      message: `User tier updated to ${tier}`,
      tier: user.subscription.tier,
    });
  } catch (error) {
    console.error("Update user tier error:", error);
    res.status(500).json({error: "Failed to update user tier"});
  }
};

/**
 * Reset user's daily quota (for testing/support)
 * POST /api/admin/ai-quota/users/:userId/reset-daily
 */
export const resetUserDailyQuota = async (req, res) => {
  try {
    const {userId} = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({error: "User not found"});
    }

    // Reset ALL usage counters in the User model
    user.usage.resumesThisMonth = 0;
    user.usage.resumesDownloadedThisMonth = 0;
    user.usage.atsScansThisMonth = 0;
    user.usage.jobMatchesToday = 0;
    user.usage.coverLettersThisMonth = 0;
    user.usage.aiGenerationsThisMonth = 0; // ← This is what was missing!
    user.usage.aiResumeExtractionsToday = 0;
    user.usage.lastResetDate = new Date();
    user.usage.lastDailyReset = new Date();

    await user.save();
    console.log(`✅ Reset all usage counters for user: ${user.email}`);

    // Mark today's usage records as not counting towards quota
    // This preserves the data for analytics while resetting the quota
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await AIUsage.updateMany(
      {
        userId: user._id,
        createdAt: {$gte: startOfDay},
        status: "success",
        countTowardsQuota: {$ne: false}, // Only update records that currently count
      },
      {
        $set: {countTowardsQuota: false},
      }
    );

    await AdminLog.create({
      adminId: req.user.userId || req.user._id,
      action: "reset_user_quota",
      targetType: "user",
      targetId: userId,
      description: `Usage quotas reset for ${user.email}`,
      metadata: {
        resetRecords: result.modifiedCount,
      },
      ipAddress: req.ip,
    });

    res.json({
      message: `All usage counters reset successfully for ${user.name}`,
      resetRecords: result.modifiedCount,
      countersReset: {
        resumesThisMonth: 0,
        resumesDownloadedThisMonth: 0,
        atsScansThisMonth: 0,
        jobMatchesToday: 0,
        coverLettersThisMonth: 0,
        aiGenerationsThisMonth: 0,
        aiResumeExtractionsToday: 0,
      },
      note: "All usage counters reset to 0, usage records preserved for analytics",
    });
  } catch (error) {
    console.error("Reset user daily quota error:", error);
    res.status(500).json({error: "Failed to reset daily quota"});
  }
};

// ============================================
// SYSTEM SETTINGS ENDPOINTS
// ============================================

/**
 * Get all system settings
 * GET /api/admin/settings
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({settings});
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({error: "Failed to fetch settings"});
  }
};

/**
 * Update system settings
 * PATCH /api/admin/settings
 */
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const adminId = req.user?.userId || req.user?._id || req.user?.id;

    let settings = await Settings.getSettings();

    // Update settings with provided data
    Object.keys(updates).forEach((key) => {
      if (key !== "_id" && key !== "createdAt" && key !== "updatedAt") {
        if (typeof updates[key] === "object" && !Array.isArray(updates[key])) {
          // Handle nested objects
          settings[key] = {...settings[key], ...updates[key]};
        } else {
          settings[key] = updates[key];
        }
      }
    });

    if (adminId) {
      settings.lastUpdatedBy = adminId;
    }
    settings.markModified("promotion");
    settings.markModified("features");
    settings.markModified("aiQuota");
    settings.markModified("rateLimits");
    await settings.save();

    res.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({error: "Failed to update settings"});
  }
};

/**
 * Reset settings to defaults
 * POST /api/admin/settings/reset
 */
export const resetSettings = async (req, res) => {
  try {
    const adminId = req.user?.userId || req.user?._id || req.user?.id;

    // Delete existing settings
    await Settings.deleteMany({});

    // Create new default settings
    const settings = await Settings.create({
      ...(adminId && {lastUpdatedBy: adminId}),
    });

    res.json({
      message: "Settings reset to defaults successfully",
      settings,
    });
  } catch (error) {
    console.error("Reset settings error:", error);
    res.status(500).json({error: "Failed to reset settings"});
  }
};

/**
 * Get system statistics for settings page
 * GET /api/admin/settings/stats
 */
export const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalResumes,
      totalAIUsage,
      totalStorage,
      avgResponseTime,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({status: "active"}),
      Resume.countDocuments(),
      AIUsage.countDocuments(),
      Resume.aggregate([
        {
          $group: {
            _id: null,
            totalSize: {$sum: {$ifNull: ["$fileSize", 0]}},
          },
        },
      ]),
      AIUsage.aggregate([
        {
          $group: {
            _id: null,
            avgTime: {$avg: "$responseTime"},
          },
        },
      ]),
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsers, todayAIUsage] = await Promise.all([
      User.countDocuments({createdAt: {$gte: today}}),
      AIUsage.countDocuments({createdAt: {$gte: today}}),
    ]);

    // Calculate storage in MB
    const storageInMB = totalStorage[0]
      ? (totalStorage[0].totalSize / (1024 * 1024)).toFixed(2)
      : 0;

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          todayNew: todayUsers,
        },
        resumes: {
          total: totalResumes,
        },
        ai: {
          totalUsage: totalAIUsage,
          todayUsage: todayAIUsage,
          avgResponseTime: avgResponseTime[0]
            ? Math.round(avgResponseTime[0].avgTime)
            : 0,
        },
        storage: {
          used: storageInMB,
          unit: "MB",
        },
      },
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({error: "Failed to fetch system statistics"});
  }
};

/**
 * Update AI quota limits
 * PATCH /api/admin/settings/ai-quota
 */
export const updateAIQuotaLimits = async (req, res) => {
  try {
    const {tier, daily, monthly} = req.body;

    if (!["free", "one-time", "pro"].includes(tier)) {
      return res
        .status(400)
        .json({error: "Invalid tier. Must be 'free', 'one-time', or 'pro'"});
    }

    if (daily < 1 || monthly < 1) {
      return res.status(400).json({error: "Quota limits must be at least 1"});
    }

    const settings = await Settings.getSettings();
    if (!settings.aiQuota[tier]) {
      settings.aiQuota[tier] = {};
    }
    settings.aiQuota[tier].daily = daily;
    settings.aiQuota[tier].monthly = monthly;
    const adminId = req.user?.userId || req.user?._id || req.user?.id;
    if (adminId) {
      settings.lastUpdatedBy = adminId;
    }
    settings.markModified("aiQuota");
    await settings.save();

    res.json({
      message: `AI quota limits updated for ${tier} tier`,
      aiQuota: settings.aiQuota,
    });
  } catch (error) {
    console.error("Update AI quota limits error:", error);
    res.status(500).json({error: "Failed to update AI quota limits"});
  }
};

/**
 * Toggle feature flag
 * PATCH /api/admin/settings/features/:feature
 */
export const toggleFeature = async (req, res) => {
  try {
    const {feature} = req.params;
    const {enabled} = req.body;

    const settings = await Settings.getSettings();

    if (settings.features[feature] === undefined) {
      return res.status(400).json({error: "Invalid feature name"});
    }

    settings.features[feature] = enabled;
    const adminId = req.user?.userId || req.user?._id || req.user?.id;
    if (adminId) {
      settings.lastUpdatedBy = adminId;
    }
    settings.markModified("features");
    await settings.save();

    res.json({
      message: `Feature '${feature}' ${enabled ? "enabled" : "disabled"}`,
      features: settings.features,
    });
  } catch (error) {
    console.error("Toggle feature error:", error);
    res.status(500).json({error: "Failed to toggle feature"});
  }
};

/**
 * Update rate limits
 * PATCH /api/admin/settings/rate-limits
 */
export const updateRateLimits = async (req, res) => {
  try {
    const {category, windowMs, max} = req.body;

    if (!["general", "auth", "ai", "upload"].includes(category)) {
      return res.status(400).json({error: "Invalid rate limit category"});
    }

    if (windowMs < 1000 || max < 1) {
      return res.status(400).json({
        error: "Invalid values. windowMs must be >= 1000ms, max must be >= 1",
      });
    }

    const settings = await Settings.getSettings();
    settings.rateLimits[category].windowMs = windowMs;
    settings.rateLimits[category].max = max;
    const adminId = req.user?.userId || req.user?._id || req.user?.id;
    if (adminId) {
      settings.lastUpdatedBy = adminId;
    }
    settings.markModified("rateLimits");
    await settings.save();

    res.json({
      message: `Rate limits updated for ${category}`,
      rateLimits: settings.rateLimits,
    });
  } catch (error) {
    console.error("Update rate limits error:", error);
    res.status(500).json({error: "Failed to update rate limits"});
  }
};

/**
 * Get AI Resume Extraction Usage Overview
 * GET /api/admin/ai-extraction-usage
 */
export const getAIExtractionUsage = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      tier = "all",
      search = "",
      sortBy = "usage",
    } = req.query;

    const query = {isActive: true};
    if (tier !== "all") {
      query.tier = tier;
    }
    if (search) {
      query.$or = [
        {email: {$regex: search, $options: "i"}},
        {name: {$regex: search, $options: "i"}},
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("name email tier usage createdAt lastLoginAt")
      .sort(
        sortBy === "usage"
          ? {"usage.aiResumeExtractionsToday": -1}
          : sortBy === "total"
          ? {"usage.aiResumeExtractions": -1}
          : {createdAt: -1}
      )
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get quota limits from system settings
    const settings = await Settings.getSettings();
    const quotaLimits = {
      free: settings?.aiQuota?.free?.daily || 10,
      "one-time": settings?.aiQuota?.["one-time"]?.daily || 150,
      pro: settings?.aiQuota?.pro?.daily || 1000,
    };

    const usersWithLimits = users.map((user) => {
      const userTier = user.tier || "free";
      const dailyLimit = quotaLimits[userTier] || 10;
      const extractionsToday = user.usage?.aiResumeExtractionsToday || 0;
      const remainingToday = Math.max(0, dailyLimit - extractionsToday);
      const isAtLimit = extractionsToday >= dailyLimit;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        tier: userTier,
        extractionsToday,
        totalExtractions: user.usage?.aiResumeExtractions || 0,
        dailyLimit,
        remainingToday,
        isAtLimit,
        lastDailyReset: user.usage?.lastDailyReset || user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    });

    // Aggregate statistics
    const allActiveUsers = await User.find({isActive: true}).select(
      "tier usage"
    );
    const overview = {
      totalUsers: allActiveUsers.length,
      totalExtractionsToday: 0,
      totalUsersAtLimit: 0,
      byTier: {
        free: {count: 0, totalExtractions: 0, atLimit: 0},
        "one-time": {count: 0, totalExtractions: 0, atLimit: 0},
        pro: {count: 0, totalExtractions: 0, atLimit: 0},
      },
    };

    allActiveUsers.forEach((u) => {
      const tier = u.tier || "free";
      const used = u.usage?.aiResumeExtractionsToday || 0;
      const limit = quotaLimits[tier] || 10;
      const isAtLimit = used >= limit;

      if (overview.byTier[tier]) {
        overview.byTier[tier].count++;
        overview.byTier[tier].totalExtractions += used;
        if (isAtLimit) {
          overview.byTier[tier].atLimit++;
          overview.totalUsersAtLimit++;
        }
      }
      overview.totalExtractionsToday += used;
    });

    res.json({
      success: true,
      data: {
        users: usersWithLimits,
        overview,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get AI extraction usage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI extraction usage",
      error: error.message,
    });
  }
};

/**
 * Reset AI Extraction Counter for a User (Admin Override)
 * POST /api/admin/users/:userId/reset-extraction-counter
 */
export const resetUserExtractionCounter = async (req, res) => {
  try {
    const {userId} = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Reset the counter
    user.usage.aiResumeExtractionsToday = 0;
    user.usage.lastDailyReset = new Date();
    await user.save();

    // Log admin action
    await AdminLog.create({
      adminId: req.user.userId || req.user._id,
      action: "reset_ai_extraction_counter",
      targetType: "user",
      targetId: userId,
      description: `AI extraction counter reset for ${user.email}`,
      metadata: {
        userEmail: user.email,
        userName: user.name,
        resetAt: new Date(),
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `AI extraction counter reset for user: ${user.email}`,
      data: {
        extractionsToday: user.usage.aiResumeExtractionsToday,
        lastReset: user.usage.lastDailyReset,
      },
    });
  } catch (error) {
    console.error("Reset extraction counter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset extraction counter",
      error: error.message,
    });
  }
};

/**
 * Update promotion / festive sale settings
 * PATCH /api/admin/settings/promotion
 */
export const updatePromotionSettings = async (req, res) => {
  try {
    const promotionUpdates = req.body;
    const adminId = req.user?.userId || req.user?._id || req.user?.id;

    const settings = await Settings.getSettings();
    if (!settings.promotion) {
      settings.promotion = {};
    }

    // Merge updates into settings.promotion
    Object.assign(settings.promotion, promotionUpdates);
    if (adminId) {
      settings.lastUpdatedBy = adminId;
    }
    settings.markModified("promotion");
    await settings.save();

    res.json({
      success: true,
      message: "Promotion settings updated successfully",
      promotion: settings.promotion,
    });
  } catch (error) {
    console.error("Update promotion settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update promotion settings",
      details: error.message,
    });
  }
};

/**
 * Quick toggle promotion on/off
 * PATCH /api/admin/settings/promotion/toggle
 */
export const togglePromotion = async (req, res) => {
  try {
    const {enabled} = req.body;
    const adminId = req.user?.userId || req.user?._id || req.user?.id;

    const settings = await Settings.getSettings();
    if (!settings.promotion) {
      settings.promotion = {};
    }

    settings.promotion.enabled =
      typeof enabled === "boolean" ? enabled : !settings.promotion.enabled;
    if (adminId) {
      settings.lastUpdatedBy = adminId;
    }
    settings.markModified("promotion");
    await settings.save();

    res.json({
      success: true,
      message: `Promotion ${settings.promotion.enabled ? "enabled" : "disabled"} successfully`,
      enabled: settings.promotion.enabled,
      promotion: settings.promotion,
    });
  } catch (error) {
    console.error("Toggle promotion error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle promotion",
      details: error.message,
    });
  }
};

/**
 * Admin Global Search
 * GET /api/admin/search?q=...
 */
export const adminGlobalSearch = async (req, res) => {
  try {
    const {q = ""} = req.query;
    const query = q.trim();

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          users: [],
          resumes: [],
          subscriptions: [],
          feedbacks: [],
          contacts: [],
        },
      });
    }

    const regex = new RegExp(query, "i");

    // Search Users
    const usersPromise = User.find({
      $or: [{name: regex}, {email: regex}, {role: regex}, {"subscription.tier": regex}],
    })
      .select("name email role subscription createdAt")
      .limit(8)
      .lean();

    // Search Resumes
    const resumesPromise = Resume.find({
      $or: [{resumeTitle: regex}, {"contact.name": regex}, {"contact.email": regex}, {template: regex}],
    })
      .select("resumeTitle contact template createdAt updatedAt userId")
      .populate("userId", "name email")
      .limit(8)
      .lean();

    // Search Subscriptions
    const subscriptionsPromise = Subscription.find({
      $or: [{tier: regex}, {orderId: regex}, {paymentId: regex}, {status: regex}],
    })
      .select("userId tier status orderId amount currency createdAt")
      .populate("userId", "name email")
      .limit(8)
      .lean();

    // Search Feedback & Contacts
    const feedbacksPromise = Feedback.find({
      $or: [{message: regex}, {category: regex}, {name: regex}, {email: regex}],
    })
      .limit(5)
      .lean();

    const contactsPromise = Contact.find({
      $or: [{subject: regex}, {message: regex}, {name: regex}, {email: regex}],
    })
      .limit(5)
      .lean();

    const [users, resumes, subscriptions, feedbacks, contacts] = await Promise.all([
      usersPromise,
      resumesPromise,
      subscriptionsPromise,
      feedbacksPromise,
      contactsPromise,
    ]);

    res.json({
      success: true,
      data: {
        query,
        users,
        resumes,
        subscriptions,
        feedbacks,
        contacts,
        totalMatches:
          users.length +
          resumes.length +
          subscriptions.length +
          feedbacks.length +
          contacts.length,
      },
    });
  } catch (error) {
    console.error("Admin global search error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform global search",
      error: error.message,
    });
  }
};

// ==========================================
// PORTFOLIO MANAGEMENT ADMIN CONTROLLERS
// ==========================================

// Get Portfolio Admin Stats
export const getPortfolioAdminStats = async (req, res) => {
  try {
    const [
      totalPortfolios,
      publishedPortfolios,
      draftPortfolios,
      totalViewsAgg,
      themeDistribution,
      recentPortfolios,
    ] = await Promise.all([
      Portfolio.countDocuments(),
      Portfolio.countDocuments({status: "published"}),
      Portfolio.countDocuments({status: "draft"}),
      Portfolio.aggregate([
        {$group: {_id: null, totalViews: {$sum: "$views"}}},
      ]),
      Portfolio.aggregate([
        {$group: {_id: "$themeId", count: {$sum: 1}}},
        {$sort: {count: -1}},
      ]),
      Portfolio.find()
        .sort({createdAt: -1})
        .limit(5)
        .populate("userId", "name email profileImage subscription")
        .select("title slug themeId status views createdAt publishedAt")
        .lean(),
    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    // Last 7 days created portfolios
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysCount = await Portfolio.countDocuments({
      createdAt: {$gte: sevenDaysAgo},
    });

    res.json({
      success: true,
      data: {
        totalPortfolios,
        publishedPortfolios,
        draftPortfolios,
        totalViews,
        last7DaysCount,
        themeDistribution,
        recentPortfolios,
      },
    });
  } catch (error) {
    console.error("Get portfolio admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio stats",
      error: error.message,
    });
  }
};

// Get All Portfolios (Admin table with filters & pagination)
export const getAllAdminPortfolios = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      themeId = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (themeId && themeId !== "all") {
      filter.themeId = themeId;
    }

    if (search) {
      const userMatches = await User.find({
        $or: [
          {name: {$regex: search, $options: "i"}},
          {email: {$regex: search, $options: "i"}},
        ],
      }).select("_id");

      const userIds = userMatches.map((u) => u._id);

      filter.$or = [
        {title: {$regex: search, $options: "i"}},
        {slug: {$regex: search, $options: "i"}},
        {professionalTitle: {$regex: search, $options: "i"}},
        {userId: {$in: userIds}},
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = order === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [portfolios, total] = await Promise.all([
      Portfolio.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "name email profileImage subscription role")
        .select(
          "title slug professionalTitle themeId themeAccent status views createdAt updatedAt publishedAt location profileImage heroImage"
        )
        .lean(),
      Portfolio.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        portfolios,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get all admin portfolios error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin portfolios",
      error: error.message,
    });
  }
};

// Update Portfolio Status (Admin)
export const updateAdminPortfolioStatus = async (req, res) => {
  try {
    const {portfolioId} = req.params;
    const {status} = req.body;

    if (!["published", "draft", "unpublished"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'published', 'draft', or 'unpublished'.",
      });
    }

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    const previousStatus = portfolio.status;
    portfolio.status = status;
    if (status === "published" && !portfolio.publishedAt) {
      portfolio.publishedAt = new Date();
    }
    await portfolio.save();

    // Log admin action
    await AdminLog.create({
      adminId: req.user._id,
      action: "UPDATE_PORTFOLIO_STATUS",
      resourceType: "Portfolio",
      resourceId: portfolio._id,
      details: {
        slug: portfolio.slug,
        previousStatus,
        newStatus: status,
      },
    });

    res.json({
      success: true,
      message: `Portfolio status updated to ${status}`,
      data: portfolio,
    });
  } catch (error) {
    console.error("Update admin portfolio status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update portfolio status",
      error: error.message,
    });
  }
};

// Delete Portfolio (Admin)
export const deleteAdminPortfolio = async (req, res) => {
  try {
    const {portfolioId} = req.params;

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    // Delete associated projects
    await PortfolioProject.deleteMany({portfolioId: portfolio._id});
    await Portfolio.findByIdAndDelete(portfolioId);

    // Log admin action
    await AdminLog.create({
      adminId: req.user._id,
      action: "DELETE_PORTFOLIO",
      resourceType: "Portfolio",
      resourceId: portfolioId,
      details: {
        slug: portfolio.slug,
        title: portfolio.title,
        userId: portfolio.userId,
      },
    });

    res.json({
      success: true,
      message: "Portfolio and related assets deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin portfolio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete portfolio",
      error: error.message,
    });
  }
};

// Generate Portfolio SEO with AI
export const generatePortfolioSeoWithAI = async (req, res) => {
  try {
    const {title, role, skills, themeName, bio} = req.body;

    const prompt = `Generate high-ranking SEO metadata for a developer/creator portfolio:
Title: ${title || "Portfolio"}
Role: ${role || "Software Engineer"}
Theme: ${themeName || "Minimalist"}
Skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "Web Development"}
Bio: ${bio || ""}

Return a valid JSON object strictly matching this schema:
{
  "metaTitle": "Title tag (50-60 chars, e.g. Alex Vance | Senior Full Stack Engineer & Product Designer)",
  "metaDescription": "Meta description (140-160 chars, compelling and keyword rich)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "ogTitle": "OpenGraph title",
  "ogDescription": "OpenGraph description",
  "searchSummary": "1-line crisp search engine snippet"
}`;

    const rawResponse = await openaiService.generateJsonWithFallback({
      prompt,
      systemInstruction: "You are an expert technical SEO strategist. Output strictly valid JSON without markdown fences.",
    });

    res.json({
      success: true,
      data: rawResponse,
    });
  } catch (error) {
    console.error("Generate portfolio SEO error:", error);
    // Fallback if AI service times out
    res.json({
      success: true,
      data: {
        metaTitle: `${req.body.title || "Developer"} | Full Stack Engineer & Creative Portfolio`,
        metaDescription: `Explore the personal portfolio, engineering projects, and technical case studies of ${req.body.title || "Developer"}.`,
        keywords: ["portfolio", "software engineer", "developer", "full stack", "react", "clean code"],
        ogTitle: `${req.body.title || "Developer"} — Portfolio`,
        ogDescription: `Crafting high-performance digital products and software architecture.`,
        searchSummary: `Personal developer portfolio of ${req.body.title || "Developer"}.`,
      },
    });
  }
};

// ============================================
// OPENAI CREDIT & ACCOUNT BALANCE CONTROLLERS
// ============================================

/**
 * @route   GET /api/admin/openai-credits
 * @desc    Get real-time OpenAI credits, spent amounts, remaining balance & forecasts
 * @access  Admin only
 */
export const getOpenAICreditStatus = async (req, res) => {
  try {
    const summary = await openaiCreditService.getOpenAICreditSummary();
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get OpenAI credit status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve OpenAI credit status",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/admin/openai-credits/refill
 * @desc    Top up or reset allocated OpenAI credits budget
 * @access  Admin only
 */
export const refillOpenAICredits = async (req, res) => {
  try {
    const {amountUsd, isReset, notes} = req.body;
    const summary = await openaiCreditService.refillOpenAICredits({
      amountUsd,
      isReset,
      notes,
      userId: req.user?._id,
    });

    res.json({
      success: true,
      message: isReset
        ? `OpenAI budget reset to $${amountUsd}`
        : `Successfully added $${amountUsd} to OpenAI budget`,
      data: summary,
    });
  } catch (error) {
    console.error("Refill OpenAI credits error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to refill OpenAI credits",
    });
  }
};

/**
 * @route   POST /api/admin/openai-credits/set-balance
 * @desc    Set exact current balance from OpenAI account
 * @access  Admin only
 */
export const setExactOpenAIBalance = async (req, res) => {
  try {
    const {exactBalanceUsd, notes} = req.body;
    const summary = await openaiCreditService.setExactOpenAIBalance({
      exactBalanceUsd,
      notes,
      userId: req.user?._id,
    });

    res.json({
      success: true,
      message: `OpenAI account balance updated to $${Number(exactBalanceUsd).toFixed(2)}`,
      data: summary,
    });
  } catch (error) {
    console.error("Set exact OpenAI balance error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to set exact OpenAI balance",
    });
  }
};

/**
 * @route   POST /api/admin/openai-credits/settings
 * @desc    Update OpenAI credit alert thresholds and notification settings
 * @access  Admin only
 */
export const updateOpenAICreditSettings = async (req, res) => {
  try {
    const {alertThresholdUsd, autoAlertEnabled, notes} = req.body;
    const summary = await openaiCreditService.updateCreditSettings({
      alertThresholdUsd,
      autoAlertEnabled,
      notes,
      userId: req.user?._id,
    });

    res.json({
      success: true,
      message: "OpenAI credit settings updated successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Update OpenAI credit settings error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update OpenAI credit settings",
    });
  }
};

/**
 * @route   POST /api/admin/openai-credits/check
 * @desc    Test live OpenAI API connection, authorization and quota health
 * @access  Admin only
 */
export const checkOpenAIQuotaHealth = async (req, res) => {
  try {
    const health = await openaiCreditService.testOpenAIQuotaHealth();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error("Check OpenAI quota health error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform OpenAI quota health check",
      error: error.message,
    });
  }
};

// ============================================
// ADMIN CUSTOM EMAIL DISPATCHER CONTROLLER
// ============================================

/**
 * @route   POST /api/admin/send-email
 * @desc    Send customized branded template email to a user with 1 click
 * @access  Admin only
 */
export const sendCustomAdminEmail = async (req, res) => {
  try {
    const {
      toEmail,
      userName,
      subject,
      badgeText,
      heading,
      bodyMessage,
      cardTitle,
      cardMessage,
      buttonText,
      buttonUrl,
      noteBox,
      themeAccent = "indigo",
      sendCopyAdmin = true,
    } = req.body;

    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "A valid recipient email address is required.",
      });
    }

    if (!subject || !bodyMessage) {
      return res.status(400).json({
        success: false,
        message: "Email subject and message body cannot be empty.",
      });
    }

    const result = await sendCustomAdminTemplateEmail({
      toEmail,
      userName,
      subject,
      badgeText,
      heading,
      bodyMessage,
      cardTitle,
      cardMessage,
      buttonText,
      buttonUrl,
      noteBox,
      themeAccent,
      sendCopyAdmin,
    });

    // Log admin action safely (non-blocking)
    try {
      const adminId = req.user?.userId || req.user?._id || req.user?.id;
      if (adminId) {
        await AdminLog.create({
          adminId,
          action: "send_custom_email",
          targetType: "user",
          description: `Sent custom email "${subject}" to ${toEmail}`,
          metadata: {
            toEmail,
            subject,
            messageId: result.messageId,
          },
          ipAddress: req.ip,
        });
      }
    } catch (logErr) {
      console.warn("⚠️ Failed to write AdminLog entry for sent email:", logErr.message);
    }

    res.json({
      success: true,
      message: `Email successfully delivered to ${toEmail}`,
      data: result,
    });
  } catch (error) {
    console.error("Send custom admin email error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
};




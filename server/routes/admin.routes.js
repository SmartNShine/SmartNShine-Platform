import express from "express";
import {authenticateToken} from "../middleware/auth.middleware.js";
import {isAdmin, logAdminAction} from "../middleware/admin.middleware.js";
import {adminLimiter} from "../middleware/rateLimiter.middleware.js";
import {
  validateMongoId,
  validateUserId,
  validateTemplateId,
  validateSessionId,
  validateContactStatusUpdate,
  validateFeedbackStatusUpdate,
  validateUserRoleUpdate,
} from "../middleware/validation.middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  activateUserSubscription,
  cancelUserSubscription,
  downgradeUserSubscription,
  extendUserSubscription,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAIAnalytics,
  getContactMessages,
  updateContactStatus,
  deleteContactMessage,
  getContactStatistics,
  getAdminLogs,
  getAllTemplates,
  getTemplateStats,
  syncDefaultTemplates,
  createTemplate,
  updateTemplate,
  generateTemplateSeoWithAI,
  updateTemplateStatus,
  deleteTemplate,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedbackAdmin,
  getFeedbackStatistics,
  getUserQuotaStatus,
  getUserQuotaDetails,
  updateUserTier,
  resetUserDailyQuota,
  getSettings,
  updateSettings,
  resetSettings,
  getSystemStats,
  updateAIQuotaLimits,
  toggleFeature,
  updateRateLimits,
  getAIExtractionUsage,
  resetUserExtractionCounter,
  updatePromotionSettings,
  togglePromotion,
  adminGlobalSearch,
  getPortfolioAdminStats,
  getAllAdminPortfolios,
  updateAdminPortfolioStatus,
  deleteAdminPortfolio,
  generatePortfolioSeoWithAI,
  getOpenAICreditStatus,
  refillOpenAICredits,
  setExactOpenAIBalance,
  updateOpenAICreditSettings,
  checkOpenAIQuotaHealth,
  sendCustomAdminEmail,
} from "../controllers/admin.controller.js";
import {
  archiveNotification,
  deleteNotification,
  getAdminNotifications,
  getAdminNotificationStats,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/adminNotification.controller.js";

const router = express.Router();

// Apply auth, admin, rate limiting, and logging middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);
router.use(adminLimiter); // Higher limit for admin operations (200 req/15min)
router.use(logAdminAction);

// Global Search
router.get("/search", adminGlobalSearch);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);


// Notifications
router.get("/notifications", getAdminNotifications);
router.get("/notifications/stats", getAdminNotificationStats);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:id/read", validateMongoId, markNotificationRead);
router.patch("/notifications/:id/archive", validateMongoId, archiveNotification);
router.delete("/notifications/:id", validateMongoId, deleteNotification);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:userId", validateUserId, getUserDetails);
router.post(
  "/users/:userId/subscription/activate",
  validateUserId,
  activateUserSubscription
);
router.post(
  "/users/:userId/subscription/extend",
  validateUserId,
  extendUserSubscription
);
router.post(
  "/users/:userId/subscription/cancel",
  validateUserId,
  cancelUserSubscription
);
router.post(
  "/users/:userId/subscription/downgrade",
  validateUserId,
  downgradeUserSubscription
);
router.patch("/users/:userId/status", validateUserId, updateUserStatus);
router.patch("/users/:userId/role", validateUserRoleUpdate, updateUserRole);
router.delete("/users/:userId", validateUserId, deleteUser);

// AI Analytics & OpenAI Credit Tracking
router.get("/ai-analytics", getAIAnalytics);
router.get("/openai-credits", getOpenAICreditStatus);
router.post("/openai-credits/refill", refillOpenAICredits);
router.post("/openai-credits/set-balance", setExactOpenAIBalance);
router.post("/openai-credits/settings", updateOpenAICreditSettings);
router.post("/openai-credits/check", checkOpenAIQuotaHealth);

// Custom Email Dispatcher
router.post("/send-email", sendCustomAdminEmail);


// Contact Messages
router.get("/contacts", getContactMessages);
router.get("/contacts/statistics", getContactStatistics);
router.patch(
  "/contacts/:id/status",
  validateContactStatusUpdate,
  updateContactStatus
);
router.delete("/contacts/:id", validateMongoId, deleteContactMessage);

// Admin Logs
router.get("/logs", getAdminLogs);

// Template Management
router.get("/templates/stats", getTemplateStats);
router.post("/templates/sync-defaults", syncDefaultTemplates);
router.post("/templates/generate-seo", generateTemplateSeoWithAI);
router.get("/templates", getAllTemplates);
router.post("/templates", createTemplate);
router.put("/templates/:templateId", validateTemplateId, updateTemplate);
router.patch(
  "/templates/:templateId/status",
  validateTemplateId,
  updateTemplateStatus
);
router.delete("/templates/:templateId", validateTemplateId, deleteTemplate);

// Portfolio Management
router.get("/portfolios/stats", getPortfolioAdminStats);
router.post("/portfolios/generate-seo", generatePortfolioSeoWithAI);
router.get("/portfolios", getAllAdminPortfolios);
router.patch(
  "/portfolios/:portfolioId/status",
  updateAdminPortfolioStatus
);
router.delete("/portfolios/:portfolioId", deleteAdminPortfolio);

// Feedback Management
router.get("/feedback", getAllFeedback);
router.get("/feedback/statistics", getFeedbackStatistics);
router.patch(
  "/feedback/:id/status",
  validateFeedbackStatusUpdate,
  updateFeedbackStatus
);
router.delete("/feedback/:id", validateMongoId, deleteFeedbackAdmin);

// AI Quota Management
router.get("/ai-quota/users", getUserQuotaStatus);
router.get("/ai-quota/users/:userId", validateUserId, getUserQuotaDetails);
router.patch("/ai-quota/users/:userId/tier", validateUserId, updateUserTier);
router.post(
  "/ai-quota/users/:userId/reset-daily",
  validateUserId,
  resetUserDailyQuota
);

// AI Resume Extraction Usage Management
router.get("/ai-extraction-usage", getAIExtractionUsage);
router.post(
  "/users/:userId/reset-extraction-counter",
  validateUserId,
  resetUserExtractionCounter
);

import {
  getAllAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  toggleAdminQuestionStatus,
  deleteAdminQuestion,
} from "../controllers/adminQuestion.controller.js";

import {
  getInterviewAdminStats,
  getAllInterviewSessions,
  getInterviewSessionDetail,
  getInterviewPricingConfig,
  updateInterviewPricingConfig,
} from "../controllers/adminInterview.controller.js";

// AI Interview Management & Cost Intelligence
router.get("/interviews/stats", getInterviewAdminStats);
router.get("/interviews", getAllInterviewSessions);
router.get("/interviews/pricing-config", getInterviewPricingConfig);
router.patch("/interviews/pricing-config", updateInterviewPricingConfig);
router.get("/interviews/:sessionId", validateSessionId, getInterviewSessionDetail);

// Question Bank Management
router.get("/questions", getAllAdminQuestions);
router.post("/questions", createAdminQuestion);
router.put("/questions/:id", validateMongoId, updateAdminQuestion);
router.patch("/questions/:id/toggle-status", validateMongoId, toggleAdminQuestionStatus);
router.delete("/questions/:id", validateMongoId, deleteAdminQuestion);

// System Settings
router.get("/settings", getSettings);
router.get("/settings/stats", getSystemStats);
router.patch("/settings", updateSettings);
router.post("/settings/reset", resetSettings);
router.patch("/settings/ai-quota", updateAIQuotaLimits);
router.patch("/settings/features/:feature", toggleFeature);
router.patch("/settings/rate-limits", updateRateLimits);
router.patch("/settings/promotion", updatePromotionSettings);
router.patch("/settings/promotion/toggle", togglePromotion);

export default router;

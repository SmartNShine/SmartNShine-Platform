/**
 * API Barrel Export
 *
 * Centralized exports for all API modules.
 * Use: import { authAPI, resumeAPI } from '@/api'
 */

// Core API exports
export {authAPI, resumeAPI, contactAPI} from "./api";

// Admin API exports
export {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAIAnalytics,
  getContactMessages,
  getContactStatistics,
  updateContactStatus,
  deleteContactMessage,
  getAdminLogs,
  getAllTemplates,
  updateTemplateStatus,
  deleteTemplate,
  getAllFeedback,
  getFeedbackStatistics,
  updateFeedbackStatus,
  deleteFeedbackAdmin,
  getUserQuotaStatus,
  getUserQuotaDetails,
  resetUserQuota,
  getSystemSettings,
  updateSystemSettings,
  updatePaymentSettings,
  getAllAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  toggleAdminQuestionStatus,
  deleteAdminQuestion,
  getInterviewAdminStats,
  getAllAdminInterviews,
  getAdminInterviewDetail,
  getInterviewPricingConfig,
  updateInterviewPricingConfig,
} from "./admin.api";

// Subscription API exports
export {
  getPricing,
  createPaymentOrder,
  verifyPayment,
  getSubscriptionStatus,
  getSubscriptionHistory,
  cancelSubscription,
  getUsageStats,
  getAIConfig,
  updateAIPreference,
} from "./subscription.api";

// Feedback API exports
export {feedbackAPI} from "./feedback.api";

// Interview API exports
export {default as interviewAPI} from "./interview.api";

// Career Profile & Q&A API exports
export {default as careerAPI} from "./career.api";

// Career Application API exports
export {default as careerApplicationAPI} from "./careerApplication.api";

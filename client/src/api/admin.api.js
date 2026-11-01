import axios from "axios";
import {authStorage} from "@/utils/storage";
import {handleErrorByStatus} from "@/utils/errorHandler";
import {config} from "@/utils/constants";
import toast from "react-hot-toast";

const API_URL = config.apiUrl;

// Create axios instance
const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
adminAPI.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for admin API with comprehensive error handling
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error status codes for admin operations
    handleErrorByStatus(error, {
      401: () => {
        // Token is invalid or expired - redirect to login
        console.error("Admin authentication failed");
        authStorage.clearAuth();

        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          toast.error("Admin session expired. Please login again.");
          window.location.href = "/login";
        }
      },
      403: () => {
        // Admin permission denied
        toast.error("Admin access required for this action");
      },
      429: () => {
        // Rate limit exceeded
        const retryAfter = error.response?.data?.retryAfter || "a few minutes";
        toast.error(
          `Too many admin requests. Please try again after ${retryAfter}`
        );
      },
      500: () => {
        // Server error
        toast.error("Admin server error. Please try again later.");
      },
      default: (err) => {
        // For other errors, log in development
        if (config.isDev) {
          console.error("Admin API Error:", err);
        }
      },
    });

    return Promise.reject(error);
  }
);

// Dashboard Stats
export const getDashboardStats = () => adminAPI.get("/dashboard/stats");

// User Management
export const getAllUsers = (params) => adminAPI.get("/users", {params});
export const getUserDetails = (userId) => adminAPI.get(`/users/${userId}`);
export const activateUserSubscription = (userId, data) =>
  adminAPI.post(`/users/${userId}/subscription/activate`, data);
export const extendUserSubscription = (userId, data) =>
  adminAPI.post(`/users/${userId}/subscription/extend`, data);
export const cancelUserSubscription = (userId, data) =>
  adminAPI.post(`/users/${userId}/subscription/cancel`, data);
export const downgradeUserSubscription = (userId, data) =>
  adminAPI.post(`/users/${userId}/subscription/downgrade`, data);
export const updateUserStatus = (userId, status) =>
  adminAPI.patch(`/users/${userId}/status`, {status});
export const updateUserRole = (userId, role) =>
  adminAPI.patch(`/users/${userId}/role`, {role});
export const deleteUser = (userId) => adminAPI.delete(`/users/${userId}`);

// AI Analytics & OpenAI Credit Tracking
export const getAIAnalytics = (params) =>
  adminAPI.get("/ai-analytics", {params});
export const getOpenAICreditStatus = () =>
  adminAPI.get("/openai-credits");
export const refillOpenAICredits = (data) =>
  adminAPI.post("/openai-credits/refill", data);
export const setExactOpenAIBalance = (data) =>
  adminAPI.post("/openai-credits/set-balance", data);
export const updateOpenAICreditSettings = (data) =>
  adminAPI.post("/openai-credits/settings", data);
export const checkOpenAIQuotaHealth = () =>
  adminAPI.post("/openai-credits/check");
export const sendCustomAdminEmail = (data) =>
  adminAPI.post("/send-email", data);




// Contact Messages
export const getContactMessages = (params) =>
  adminAPI.get("/contacts", {params});
export const getContactStatistics = () => adminAPI.get("/contacts/statistics");
export const updateContactStatus = (id, data) =>
  adminAPI.patch(`/contacts/${id}/status`, data);
export const deleteContactMessage = (id) => adminAPI.delete(`/contacts/${id}`);

// Admin Logs
export const getAdminLogs = (params) => adminAPI.get("/logs", {params});
export const getSystemLogs = (params) =>
  axios.get(`${API_URL}/logs/admin`, {
    headers: { Authorization: `Bearer ${authStorage.getToken()}` },
    params,
  });
export const clearSystemLogs = () =>
  axios.delete(`${API_URL}/logs/admin`, {
    headers: { Authorization: `Bearer ${authStorage.getToken()}` },
  });

// Admin Notifications
export const getAdminNotifications = (params) =>
  adminAPI.get("/notifications", {params});
export const getAdminNotificationStats = () =>
  adminAPI.get("/notifications/stats");
export const markNotificationRead = (id) =>
  adminAPI.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  adminAPI.patch("/notifications/read-all");
export const archiveNotification = (id) =>
  adminAPI.patch(`/notifications/${id}/archive`);
export const deleteNotification = (id) =>
  adminAPI.delete(`/notifications/${id}`);

// Template Management
export const getAllTemplates = (params) => adminAPI.get("/templates", {params});
export const getTemplateStats = () => adminAPI.get("/templates/stats");
export const syncDefaultTemplates = () => adminAPI.post("/templates/sync-defaults");
export const createTemplate = (data) => adminAPI.post("/templates", data);
export const updateTemplate = (templateId, data) =>
  adminAPI.put(`/templates/${templateId}`, data);
export const updateTemplateStatus = (templateId, isActive) =>
  adminAPI.patch(`/templates/${templateId}/status`, {isActive});
export const generateTemplateSeoWithAI = (data) =>
  adminAPI.post("/templates/generate-seo", data);
export const deleteTemplate = (templateId) =>
  adminAPI.delete(`/templates/${templateId}`);

// Portfolio Management
export const getPortfolioAdminStats = () =>
  adminAPI.get("/portfolios/stats");
export const getAllAdminPortfolios = (params) =>
  adminAPI.get("/portfolios", {params});
export const updateAdminPortfolioStatus = (portfolioId, status) =>
  adminAPI.patch(`/portfolios/${portfolioId}/status`, {status});
export const deleteAdminPortfolio = (portfolioId) =>
  adminAPI.delete(`/portfolios/${portfolioId}`);
export const generatePortfolioSeoWithAI = (data) =>
  adminAPI.post("/portfolios/generate-seo", data);

// Feedback Management
export const getAllFeedback = (params) => adminAPI.get("/feedback", {params});
export const getFeedbackStatistics = () => adminAPI.get("/feedback/statistics");
export const updateFeedbackStatus = (id, data) =>
  adminAPI.patch(`/feedback/${id}/status`, data);
export const deleteFeedbackAdmin = (id) => adminAPI.delete(`/feedback/${id}`);

// AI Quota Management
export const getUserQuotaStatus = (params) =>
  adminAPI.get("/ai-quota/users", {params});
export const getUserQuotaDetails = (userId) =>
  adminAPI.get(`/ai-quota/users/${userId}`);
export const updateUserTier = (userId, tier) =>
  adminAPI.patch(`/ai-quota/users/${userId}/tier`, {tier});
export const resetUserDailyQuota = (userId) =>
  adminAPI.post(`/ai-quota/users/${userId}/reset-daily`);

// AI Extraction Management
export const getAIExtractionUsage = (params) =>
  adminAPI.get("/ai-extraction-usage", {params});
export const resetUserExtractionCounter = (userId) =>
  adminAPI.post(`/users/${userId}/reset-extraction-counter`);

// System Settings
export const getSettings = () => adminAPI.get("/settings");
export const getSystemStats = () => adminAPI.get("/settings/stats");
export const updateSettings = (settings) =>
  adminAPI.patch("/settings", settings);
export const resetSettings = () => adminAPI.post("/settings/reset");
export const updateAIQuotaLimits = (data) =>
  adminAPI.patch("/settings/ai-quota", data);
export const toggleFeature = (feature, enabled) =>
  adminAPI.patch(`/settings/features/${feature}`, {enabled});
export const updateRateLimits = (data) =>
  adminAPI.patch("/settings/rate-limits", data);
export const updatePromotionSettings = (data) =>
  adminAPI.patch("/settings/promotion", data);
export const togglePromotion = (enabled) =>
  adminAPI.patch("/settings/promotion/toggle", {enabled});

// Question Bank Management
export const getAllAdminQuestions = (params) =>
  adminAPI.get("/questions", {params});
export const createAdminQuestion = (data) =>
  adminAPI.post("/questions", data);
export const updateAdminQuestion = (id, data) =>
  adminAPI.put(`/questions/${id}`, data);
export const toggleAdminQuestionStatus = (id) =>
  adminAPI.patch(`/questions/${id}/toggle-status`);
export const deleteAdminQuestion = (id) =>
  adminAPI.delete(`/questions/${id}`);

// AI Interview Management & Cost Intelligence
export const getInterviewAdminStats = () =>
  adminAPI.get("/interviews/stats");
export const getAllAdminInterviews = (params) =>
  adminAPI.get("/interviews", {params});
export const getAdminInterviewDetail = (sessionId) =>
  adminAPI.get(`/interviews/${sessionId}`);
export const getInterviewPricingConfig = () =>
  adminAPI.get("/interviews/pricing-config");
export const updateInterviewPricingConfig = (data) =>
  adminAPI.patch("/interviews/pricing-config", data);

// Global Search
export const globalSearch = (q) => adminAPI.get("/search", {params: {q}});

// Backward compatibility aliases
export const resetUserQuota = resetUserDailyQuota;
export const getSystemSettings = getSettings;
export const updateSystemSettings = updateSettings;
export const updatePaymentSettings = updateSettings;

export default adminAPI;


/**
 * Subscription and Payment API Service Module
 *
 * Handles all subscription and Razorpay payment operations:
 * - Fetch pricing plans and comparisons
 * - Create payment orders via Razorpay
 * - Verify payment signatures
 * - Manage subscriptions (create, cancel, status)
 * - Get payment history and analytics
 *
 * Payment Gateway: Razorpay
 * Authentication: JWT token from localStorage
 *
 * @module subscription.api
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  console.log(
    "Auth token from localStorage:",
    token ? "Token exists" : "No token found"
  );
  return token ? {Authorization: `Bearer ${token}`} : {};
};

/**
 * Get all pricing plans
 * @returns {Promise<Object>} Pricing plans for all tiers
 */
export const getPricing = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscription/pricing`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pricing:", error);
    throw error.response?.data || {error: "Failed to fetch pricing"};
  }
};

/**
 * Create a payment order
 * @param {string} tier - Subscription tier (one-time or pro)
 * @param {string} plan - Billing plan (monthly, yearly, etc.)
 * @returns {Promise<Object>} Order details with orderId, amount, currency
 */
export const createPaymentOrder = async (tier, plan, resumeId = null) => {
  try {
    const authHeader = getAuthHeader();
    console.log("Creating payment order with:", {tier, plan, resumeId});
    console.log("Auth headers:", authHeader);
    console.log("Request URL:", `${API_BASE_URL}/subscription/create-order`);
    console.log("Full request config:", {
      url: `${API_BASE_URL}/subscription/create-order`,
      method: "POST",
      headers: authHeader,
      data: {tier, plan, resumeId},
    });

    const response = await axios.post(
      `${API_BASE_URL}/subscription/create-order`,
      {tier, plan, ...(resumeId && {resumeId})},
      {headers: authHeader}
    );
    return response.data;
  } catch (error) {
    console.error("Error creating payment order:", error);
    console.error("Error response:", error.response);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);
    console.error("Error response headers:", error.response?.headers);
    throw error.response?.data || {error: "Failed to create payment order"};
  }
};

/**
 * Verify payment and activate subscription
 * @param {Object} paymentData - Razorpay payment response
 * @returns {Promise<Object>} Subscription activation confirmation
 */
export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/subscription/verify-payment`,
      paymentData,
      {headers: getAuthHeader()}
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error.response?.data || {error: "Failed to verify payment"};
  }
};

/**
 * Get current subscription status
 * @returns {Promise<Object>} Current subscription details
 */
export const getSubscriptionStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscription/status`, {
      headers: getAuthHeader(),
    });
    console.log("📊 Subscription status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    throw (
      error.response?.data || {error: "Failed to fetch subscription status"}
    );
  }
};

/**
 * Get subscription history
 * @returns {Promise<Array>} Array of past subscriptions and payments
 */
export const getSubscriptionHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscription/history`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    throw (
      error.response?.data || {error: "Failed to fetch subscription history"}
    );
  }
};

/**
 * Cancel current subscription
 * @param {string} reason - Optional cancellation reason
 * @returns {Promise<Object>} Cancellation confirmation
 */
export const cancelSubscription = async (reason = "") => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/subscription/cancel`,
      {reason},
      {headers: getAuthHeader()}
    );
    return response.data;
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error.response?.data || {error: "Failed to cancel subscription"};
  }
};

/**
 * Get usage statistics
 * @returns {Promise<Object>} Usage stats with limits and reset dates
 */
export const getUsageStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscription/usage`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    throw error.response?.data || {error: "Failed to fetch usage stats"};
  }
};

/**
 * Get AI configuration for current user
 * @returns {Promise<Object>} AI service configuration
 */
export const getAIConfig = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscription/ai-config`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AI config:", error);
    throw error.response?.data || {error: "Failed to fetch AI config"};
  }
};

/**
 * Update AI preference (PRO tier only)
 * @param {string} preference - 'gpt4o'
 * @returns {Promise<Object>} Update confirmation
 */
export const updateAIPreference = async (preference) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/subscription/ai-preference`,
      {preference},
      {headers: getAuthHeader()}
    );
    return response.data;
  } catch (error) {
    console.error("Error updating AI preference:", error);
    throw error.response?.data || {error: "Failed to update AI preference"};
  }
};

// Export all functions as default
export default {
  getPricing,
  createPaymentOrder,
  verifyPayment,
  getSubscriptionStatus,
  getSubscriptionHistory,
  cancelSubscription,
  getUsageStats,
  getAIConfig,
  updateAIPreference,
};

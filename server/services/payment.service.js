import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/Subscription.model.js";
import User from "../models/User.model.js";
import Resume from "../models/Resume.model.js";
import Settings from "../models/Settings.model.js";
import {sendPaymentConfirmationEmail} from "./email.service.js";
import {notifyPaymentFailure} from "./adminNotification.service.js";

/**
 * Payment Service (Razorpay Integration)
 * Handles payment creation, verification, and subscription management
 */

/**
 * Generate unique receipt ID
 * Format: RCP-YYYYMMDD-XXXXXX (e.g., RCP-20251202-A1B2C3)
 */
function generateReceiptId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  return `RCP-${dateStr}-${random}`;
}

// Initialize Razorpay instance (with fallback for missing keys)
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// Pricing configuration (in INR)
export const PRICING = {
  free: {
    amount: 0,
    plan: "free",
    features: [
      "1 Active resume per month",
      "OpenAI GPT-4o AI model",
      "3 Core ATS templates",
      "Master Career Profile Hub",
      "5 Career Q&A interview questions",
      "Basic ATS keyword check",
      "Standard PDF export",
    ],
  },
  "one-time": {
    amount: 49,
    plan: "one-time",
    features: [
      "1 Dedicated resume (21-day pass)",
      "OpenAI GPT-4o AI rewriting",
      "All 11 ATS-Certified templates",
      "1 Deep ATS diagnostic scan",
      "1 Live Portfolio website",
      "Full Career Q&A Studio access",
      "AI PDF/DOCX resume parser",
      "21-day full access",
    ],
  },
  pro: {
    monthly: {
      amount: 199,
    },
    yearly: {
      amount: 1990, // ~17% discount (2 months free)
    },
    plan: "monthly",
    features: [
      "Unlimited resumes & exports",
      "OpenAI GPT-4o Premium AI model",
      "All 11 ATS-Certified templates",
      "Unlimited ATS diagnostic scans",
      "Unlimited Public Portfolio websites",
      "Unlimited Career Q&A mock interviews",
      "Unlimited AI resume file parsers",
      "Master Career Profile Hub 2-way sync",
      "Priority PDF rendering & 24/7 support",
    ],
  },
  campus: {
    plan: "campus",
    badge: "COLLEGE & TPO",
    features: [
      "Dedicated Institutional TPO Dashboard",
      "Unlimited student bulk import (CSV & Excel)",
      "Automated Placement Readiness Engine",
      "AI Mock Interview Simulator (Tech & Voice)",
      "ATS Resume diagnostics & branch scoring",
      "Batch & Branch analytics & leaderboards",
      "Campus-wide assignments & tracking",
      "NAAC / NBA Accreditation & Placement reports",
    ],
    contacts: [
      {
        name: "Rameshwar Sonwane",
        role: "Institutional Partnerships Lead",
        email: "rameshwar@smartnshine.app",
        phone: "+91 98765 43210",
      },
      {
        name: "Campus Onboarding Desk",
        role: "TPO Support & Operations",
        email: "campus@smartnshine.app",
        phone: "+91 91234 56789",
      },
    ],
  },
};

export const ACTIVE_TIERS = ["free", "one-time", "pro"];
export const PAID_TIERS = ["one-time", "pro"];
export const PLAN_DURATIONS = {
  free: ["free"],
  "one-time": ["one-time"],
  pro: ["monthly", "yearly"],
};

export function normalizeTier(tier) {
  return ACTIVE_TIERS.includes(tier) ? tier : "free";
}

/**
 * Fetch dynamic pricing merged with active festive/promotional settings
 */
export async function getDynamicPricing() {
  try {
    const settings = await Settings.getSettings();
    const promo = settings?.promotion;

    // Deep clone base pricing
    const pricing = JSON.parse(JSON.stringify(PRICING));

    pricing["one-time"].amount = 49;
    pricing["one-time"].originalAmount = 49;

    if (promo && promo.enabled) {
      if (typeof promo.oneTimePrice === "number" && promo.oneTimePrice >= 49) {
        pricing["one-time"].amount = promo.oneTimePrice;
        pricing["one-time"].originalAmount = promo.originalOneTimePrice || 49;
        pricing["one-time"].isPromo = promo.oneTimePrice < (promo.originalOneTimePrice || 49);
        pricing["one-time"].promoBadge = promo.badgeText || "SALE";
      }
      if (typeof promo.proMonthlyPrice === "number" && promo.proMonthlyPrice > 0) {
        pricing.pro.monthly.amount = promo.proMonthlyPrice;
        pricing.pro.monthly.originalAmount = promo.originalProMonthlyPrice || 199;
        pricing.pro.monthly.isPromo = promo.proMonthlyPrice < (promo.originalProMonthlyPrice || 199);
      }
      if (typeof promo.proYearlyPrice === "number" && promo.proYearlyPrice > 0) {
        pricing.pro.yearly.amount = promo.proYearlyPrice;
      }
    }

    return {pricing, promotion: promo};
  } catch (err) {
    console.error("Error getting dynamic pricing from settings:", err.message);
    return {pricing: PRICING, promotion: null};
  }
}

export function getPlanAmount(tier, plan) {
  const pricing = PRICING[tier];

  if (!pricing || !PLAN_DURATIONS[tier]?.includes(plan)) {
    throw new Error(`Invalid subscription selection: ${tier}/${plan}`);
  }

  if (tier === "pro") {
    return pricing[plan]?.amount;
  }

  return pricing.amount;
}

export async function getPlanAmountAsync(tier, plan) {
  const {pricing} = await getDynamicPricing();

  if (!pricing || !pricing[tier] || !PLAN_DURATIONS[tier]?.includes(plan)) {
    throw new Error(`Invalid subscription selection: ${tier}/${plan}`);
  }

  if (tier === "pro") {
    return pricing[tier][plan]?.amount || pricing[tier]?.monthly?.amount;
  }

  return pricing[tier].amount;
}

export function assertPaidPlan(tier, plan) {
  if (!PAID_TIERS.includes(tier)) {
    throw new Error("Cannot create an order for a free or legacy tier");
  }

  const amount = getPlanAmount(tier, plan);
  if (!amount || amount <= 0) {
    throw new Error("Cannot create an order for an invalid amount");
  }

  return amount;
}

export async function assertPaidPlanAsync(tier, plan) {
  if (!PAID_TIERS.includes(tier)) {
    throw new Error("Cannot create an order for a free or legacy tier");
  }

  const amount = await getPlanAmountAsync(tier, plan);
  if (!amount || amount <= 0) {
    throw new Error("Cannot create an order for an invalid amount");
  }

  return amount;
}

function getEndDateForPlan(plan, fromDate = new Date()) {
  const endDate = new Date(fromDate);

  switch (plan) {
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "yearly":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case "one-time":
      endDate.setDate(endDate.getDate() + 21);
      break;
    default:
      throw new Error(`Invalid plan: ${plan}`);
  }

  return endDate;
}

function getResetUsage(existingUsage = {}) {
  return {
    resumesCreated: 0,
    resumesThisMonth: 0,
    resumesDownloaded: existingUsage.resumesDownloaded || 0,
    resumesDownloadedThisMonth: 0,
    atsScans: 0,
    atsScansThisMonth: 0,
    jobMatches: 0,
    jobMatchesToday: 0,
    coverLetters: 0,
    coverLettersThisMonth: 0,
    aiResumeExtractions: existingUsage.aiResumeExtractions || 0,
    aiResumeExtractionsToday: 0,
    aiGenerationsUsed: 0,
    aiGenerationsThisMonth: 0,
    tokensUsed: 0,
    lastResetDate: new Date(),
    lastDailyReset: new Date(),
  };
}

/**
 * Create a Razorpay order for payment
 * @param {string} tier - Subscription tier
 * @param {string} plan - Plan duration (monthly, yearly, one-time, etc.)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Order details
 */
async function assertOwnedResume(userId, resumeId) {
  if (!resumeId) {
    throw new Error("Please select a resume for the one-time plan");
  }

  const resume = await Resume.findOne({_id: resumeId, userId}).select("_id");
  if (!resume) {
    throw new Error("Selected resume was not found for this account");
  }

  return resume;
}

export async function createOrder(tier, plan, userId, resumeId = null) {
  try {
    console.log(
      `📝 Creating order for tier: ${tier}, plan: ${plan}, userId: ${userId}`
    );

    console.log(`🔑 Razorpay initialized:`, razorpay ? "YES" : "NO");
    console.log(
      `🔑 Razorpay KEY_ID:`,
      process.env.RAZORPAY_KEY_ID ? "Set" : "Not set"
    );
    console.log(
      `🔑 Razorpay KEY_SECRET:`,
      process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not set"
    );

    if (!razorpay) {
      throw new Error(
        "Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
      );
    }

    const amount = await assertPaidPlanAsync(tier, plan);
    const normalizedResumeId = resumeId || null;

    if (tier === "one-time") {
      await assertOwnedResume(userId, normalizedResumeId);
    }

    console.log(`💰 Extracted amount: ${amount}`);

    if (!amount || amount === 0) {
      throw new Error("Cannot create order for free tier or invalid amount");
    }

    // Create Razorpay order
    console.log(`🔄 Attempting to create Razorpay order...`);

    // Generate short receipt ID (max 40 chars for Razorpay)
    // Format: rcpt_<timestamp>_<last8charsOfUserId>
    const timestamp = Date.now().toString();
    const userIdShort = userId.toString().slice(-8);
    const receipt = `rcpt_${timestamp}_${userIdShort}`;

    console.log(`📋 Order params:`, {
      amount: amount * 100,
      currency: "INR",
      receipt: receipt,
      receiptLength: receipt.length,
      notes: {userId, tier, plan, resumeId: normalizedResumeId},
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: receipt,
      notes: {
        userId: userId.toString(),
        tier,
        plan,
        ...(normalizedResumeId && {resumeId: normalizedResumeId.toString()}),
      },
    });

    console.log(`✅ Razorpay order created: ${order.id} for ₹${amount}`);

    return {
      orderId: order.id,
      amount: amount,
      amountPaise: amount * 100,
      currency: "INR",
      tier,
      plan,
      resumeId: normalizedResumeId,
    };
  } catch (error) {
    console.error("❌ Razorpay order creation error:", error);
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Full error object:", JSON.stringify(error, null, 2));

    const errorMessage =
      error.message ||
      error.description ||
      error.error?.description ||
      "Unknown error occurred";
    throw new Error(`Failed to create payment order: ${errorMessage}`);
  }
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} - True if signature is valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    return generated_signature === signature;
  } catch (error) {
    console.error("❌ Signature verification error:", error.message);
    return false;
  }
}

/**
 * Verify payment via Razorpay API (for UPI and other async payment methods)
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} orderId - Razorpay order ID
 * @param {number} amount - Expected amount
 * @returns {Promise<boolean>} - True if payment is valid
 */
export async function verifyPaymentViaAPI(paymentId, orderId, amount) {
  try {
    if (!razorpay) {
      console.error("❌ Razorpay not configured");
      return false;
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    console.log("💳 Payment details from Razorpay:", {
      id: payment.id,
      order_id: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
    });

    // Verify payment details
    const isValid =
      payment.status === "captured" &&
      payment.order_id === orderId &&
      payment.amount === amount * 100; // Razorpay amount is in paise

    if (isValid) {
      console.log("✅ Payment verified via Razorpay API");
    } else {
      console.error("❌ Payment verification failed:", {
        statusMatch: payment.status === "captured",
        orderIdMatch: payment.order_id === orderId,
        amountMatch: payment.amount === amount * 100,
      });
    }

    return isValid;
  } catch (error) {
    console.error("❌ Razorpay API verification error:", error.message);
    return false;
  }
}

export async function verifyOrderForPlan(
  orderId,
  userId,
  tier,
  plan,
  resumeId = null
) {
  try {
    if (!razorpay) {
      throw new Error("Razorpay not configured");
    }

    const expectedAmount = await assertPaidPlanAsync(tier, plan);
    const order = await razorpay.orders.fetch(orderId);

    const orderUserId = order.notes?.userId?.toString();
    const orderResumeId = order.notes?.resumeId?.toString() || null;
    const expectedResumeId = resumeId?.toString() || null;
    const isValid =
      order.id === orderId &&
      order.amount === expectedAmount * 100 &&
      order.currency === "INR" &&
      order.notes?.tier === tier &&
      order.notes?.plan === plan &&
      orderUserId === userId.toString() &&
      (tier !== "one-time" || orderResumeId === expectedResumeId);

    if (!isValid) {
      console.error("❌ Razorpay order metadata mismatch:", {
        orderId,
        expectedAmount,
        actualAmount: order.amount,
        expectedTier: tier,
        actualTier: order.notes?.tier,
        expectedPlan: plan,
        actualPlan: order.notes?.plan,
        expectedUserId: userId.toString(),
        actualUserId: orderUserId,
        expectedResumeId,
        actualResumeId: orderResumeId,
      });
    }

    return isValid;
  } catch (error) {
    console.error("❌ Razorpay order validation error:", error.message);
    return false;
  }
}

/**
 * Create subscription after successful payment
 * @param {string} userId - User ID
 * @param {string} tier - Subscription tier
 * @param {string} plan - Plan duration
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} orderId - Razorpay order ID
 * @param {number} amount - Amount paid
 * @returns {Promise<Object>} - Created subscription
 */
export async function createSubscription(
  userId,
  tier,
  plan,
  paymentId,
  orderId,
  amount,
  resumeId = null
) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate unique receipt ID
    const receiptId = generateReceiptId();
    console.log(`📧 Generated Receipt ID: ${receiptId}`);

    const startDate = new Date();
    const expectedAmount = await assertPaidPlanAsync(tier, plan);

    if (Number(amount) !== expectedAmount) {
      throw new Error("Payment amount does not match selected plan");
    }

    const endDate = getEndDateForPlan(plan, startDate);
    const normalizedResumeId = resumeId || null;

    if (tier === "one-time") {
      await assertOwnedResume(userId, normalizedResumeId);
    }

    // Create subscription record
    const subscription = await Subscription.create({
      userId,
      tier,
      plan,
      status: "active",
      startDate,
      endDate,
      amount,
      currency: "INR",
      paymentMethod: "razorpay",
      paymentId,
      orderId,
      receiptId, // Add receipt ID
      autoRenew: plan === "monthly" || plan === "yearly",
      unlockedResumeId: tier === "one-time" ? normalizedResumeId : null,
      assignmentStatus:
        tier === "one-time" && normalizedResumeId ? "assigned" : "pending",
      assignedAt: tier === "one-time" && normalizedResumeId ? startDate : null,
    });

    if (tier === "one-time" && normalizedResumeId) {
      await Resume.findOneAndUpdate(
        {_id: normalizedResumeId, userId},
        {
          $set: {
            "subscriptionInfo.subscriptionId": subscription._id,
            "subscriptionInfo.createdWithTier": "one-time",
            "subscriptionInfo.createdWithSubscription": true,
            "subscriptionInfo.linkedAt": startDate,
          },
        }
      );
    }

    // Update user subscription
    user.subscription = {
      tier,
      plan,
      status: "active",
      startDate,
      endDate,
      paymentId,
      orderId,
      receiptId, // Add receipt ID to user model
      autoRenew: subscription.autoRenew,
    };

    // Reset usage counters when new subscription is purchased
    // This allows users to buy the same plan again (e.g., one-time plan)
    // Reset both monthly/daily and total counters
    user.usage = getResetUsage(user.usage);

    await user.save();

    console.log(
      `✅ Subscription created for user ${userId}: ${tier} (${plan})`
    );
    console.log(`🔄 Usage counters reset for new subscription`);

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail(user.email, user.name, {
        receiptId,
        tier,
        plan,
        amount,
        paymentId,
        orderId,
        transactionDate: startDate,
        startDate,
        endDate,
      });
      console.log(`📧 Payment confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error(
        "❌ Failed to send payment confirmation email:",
        emailError.message
      );
      // Don't throw error - payment was successful even if email fails
    }

    return subscription;
  } catch (error) {
    console.error("❌ Subscription creation error:", error.message);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

/**
 * Cancel subscription
 * @param {string} userId - User ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} - Updated subscription
 */
export async function cancelSubscription(userId, reason = "User requested") {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get active subscription
    const subscription = await Subscription.getActiveSubscription(userId);
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    if (subscription.tier !== "pro") {
      throw new Error("Only active Pro subscriptions can be cancelled");
    }

    // Cancel subscription
    await subscription.cancel(reason);

    // Update user
    user.subscription.status = "cancelled";
    user.subscription.cancelledAt = new Date();
    user.subscription.autoRenew = false;

    await user.save();

    console.log(`✅ Subscription cancelled for user ${userId}`);

    return subscription;
  } catch (error) {
    console.error("❌ Subscription cancellation error:", error.message);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Renew subscription
 * @param {string} userId - User ID
 * @param {string} paymentId - New payment ID
 * @param {string} orderId - New order ID
 * @returns {Promise<Object>} - Renewed subscription
 */
export async function renewSubscription(userId, paymentId, orderId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentSub = await Subscription.getActiveSubscription(userId);
    if (!currentSub) {
      throw new Error("No subscription to renew");
    }

    const currentEndDate = new Date(currentSub.endDate);
    const now = new Date();
    const startDate = currentEndDate > now ? currentEndDate : now;

    if (currentSub.tier !== "pro") {
      throw new Error(`Cannot renew ${currentSub.tier} plan`);
    }

    const newEndDate = getEndDateForPlan(currentSub.plan, startDate);

    // Renew subscription
    await currentSub.renew(newEndDate);

    // Update payment details
    currentSub.paymentId = paymentId;
    currentSub.orderId = orderId;
    await currentSub.save();

    // Update user
    user.subscription.endDate = newEndDate;
    user.subscription.status = "active";
    user.subscription.paymentId = paymentId;
    user.subscription.orderId = orderId;

    await user.save();

    console.log(
      `✅ Subscription renewed for user ${userId} until ${newEndDate}`
    );

    return currentSub;
  } catch (error) {
    console.error("❌ Subscription renewal error:", error.message);
    throw new Error(`Failed to renew subscription: ${error.message}`);
  }
}

/**
 * Handle Razorpay webhook events
 * @param {Object} event - Webhook event
 * @param {string} signature - Razorpay signature
 * @returns {Promise<void>}
 */
export async function handleWebhook(event, signature, rawBody = null) {
  try {
    // Verify webhook signature
    const body = rawBody || JSON.stringify(event);
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const {event: eventType, payload} = event;

    console.log(`📨 Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity);
        break;

      case "subscription.activated":
        // Handle subscription activation
        console.log("Subscription activated:", payload.subscription.entity.id);
        break;

      case "subscription.cancelled":
        // Handle subscription cancellation
        console.log("Subscription cancelled:", payload.subscription.entity.id);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
  } catch (error) {
    console.error("❌ Webhook handling error:", error.message);
    throw error;
  }
}

/**
 * Verify webhook signature
 * @param {string} body - Request body
 * @param {string} signature - Razorpay signature
 * @returns {boolean} - True if valid
 */
function verifyWebhookSignature(body, signature) {
  try {
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return generated_signature === signature;
  } catch (error) {
    console.error("❌ Webhook signature verification error:", error.message);
    return false;
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payment) {
  console.log(
    `✅ Payment captured: ${payment.id} for ₹${payment.amount / 100}`
  );
  // Additional handling if needed
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payment) {
  console.log(`❌ Payment failed: ${payment.id}`);

  // Update subscription status if exists
  const subscription = await Subscription.findOne({
    orderId: payment.order_id,
  });

  if (subscription) {
    subscription.status = "failed";
    await subscription.save();

    // Update user
    const user = await User.findById(subscription.userId);
    if (user) {
      user.subscription.status = "failed";
      await user.save();
    }

    notifyPaymentFailure({user, payment, subscription});
  } else {
    notifyPaymentFailure({payment});
  }
}

/**
 * Get payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - Payment details
 */
export async function getPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("❌ Get payment details error:", error.message);
    throw new Error(`Failed to get payment details: ${error.message}`);
  }
}

/**
 * Refund payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (in paise)
 * @returns {Promise<Object>} - Refund details
 */
export async function refundPayment(paymentId, amount = null) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // null for full refund
      speed: "normal",
    });

    console.log(
      `✅ Refund initiated: ${refund.id} for ₹${refund.amount / 100}`
    );
    return refund;
  } catch (error) {
    console.error("❌ Refund error:", error.message);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}

export default {
  createOrder,
  verifyPaymentSignature,
  verifyPaymentViaAPI,
  verifyOrderForPlan,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  handleWebhook,
  getPaymentDetails,
  refundPayment,
  getDynamicPricing,
  getPlanAmount,
  getPlanAmountAsync,
  assertPaidPlan,
  assertPaidPlanAsync,
  PRICING,
};

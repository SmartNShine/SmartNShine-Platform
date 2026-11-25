import InterviewSession from "../models/InterviewSession.model.js";
import User from "../models/User.model.js";
import { isStateConflict, STATES, transitionTo } from "./interview-state.service.js";

export const FREE_INTERVIEW_MINUTES = 30;
export const PRO_INTERVIEWS_PER_MONTH = 10;

const hasUnlimitedInterviewAccess = (user) =>
  user.role === "admin" || user.role === "tpo" || user.isTpo;

function billingAnniversary(startedAt, months) {
  const date = new Date(startedAt);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const monthEnd = new Date(date);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(startedAt.getUTCDate(), monthEnd.getUTCDate()));
  return date;
}

function getProPeriod(user, now) {
  const subscription = user.subscription;
  if (subscription?.tier !== "pro" || subscription.status !== "active" ||
      (subscription.startDate && subscription.startDate > now) ||
      (subscription.endDate && subscription.endDate <= now)) {
    return null;
  }

  const startedAt = subscription.startDate || user.createdAt || now;
  let startsAt;
  let nextMonth;
  if (subscription.plan === "monthly") {
    // Match the monthly end dates used by checkout and renewal, including month-end rollover.
    startsAt = new Date(startedAt);
    nextMonth = new Date(startsAt);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    while (nextMonth <= now) {
      startsAt = new Date(nextMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
    }
  } else {
    let months = (now.getUTCFullYear() - startedAt.getUTCFullYear()) * 12 +
      now.getUTCMonth() - startedAt.getUTCMonth();
    if (billingAnniversary(startedAt, months) > now) months -= 1;
    startsAt = billingAnniversary(startedAt, months);
    nextMonth = billingAnniversary(startedAt, months + 1);
  }
  const resetsAt = subscription.endDate && subscription.endDate < nextMonth
    ? subscription.endDate
    : nextMonth;
  return { startsAt, resetsAt };
}

export async function getInterviewAccess(user, { transaction = null, now = new Date() } = {}) {
  if (hasUnlimitedInterviewAccess(user)) return { tier: "unlimited", canStart: true };

  const userId = user._id;
  const active = await InterviewSession.exists({
    userId,
    status: { $in: [STATES.IN_PROGRESS, STATES.PAUSED] },
  }).session(transaction);
  if (active) {
    return {
      canStart: false,
      code: "INTERVIEW_ALREADY_ACTIVE",
      message: "You have an unfinished interview.",
      activeSessionId: active._id,
    };
  }

  const period = getProPeriod(user, now);
  if (period) {
    const used = await InterviewSession.countDocuments({
      userId,
      accessTier: "pro",
      startedAt: { $gte: period.startsAt, $lt: period.resetsAt },
    }).session(transaction);
    const remainingInterviews = Math.max(0, PRO_INTERVIEWS_PER_MONTH - used);
    return {
      tier: "pro",
      canStart: remainingInterviews > 0,
      monthlyLimit: PRO_INTERVIEWS_PER_MONTH,
      remainingInterviews,
      resetsAt: period.resetsAt,
      ...(remainingInterviews === 0 && {
        code: "PRO_INTERVIEW_LIMIT_REACHED",
        message: `You've used all ${PRO_INTERVIEWS_PER_MONTH} AI interviews in this subscription month.`,
      }),
    };
  }

  const [usage] = await InterviewSession.aggregate([
    { $match: { userId, accessTier: "free", status: { $in: [STATES.COMPLETED, STATES.ABANDONED] } } },
    { $group: { _id: null, seconds: { $sum: "$totalDurationSeconds" } } },
  ]).session(transaction);
  const remainingSeconds = Math.max(0, FREE_INTERVIEW_MINUTES * 60 - (usage?.seconds ?? 0));
  return {
    tier: "free",
    canStart: remainingSeconds > 0,
    remainingSeconds,
    ...(remainingSeconds === 0 && {
      code: "FREE_INTERVIEW_ACCESS_EXHAUSTED",
      message: "You've used your 30 free minutes of AI Interview Simulation.",
      upgradeUrl: "/pricing",
    }),
  };
}

export function sendInterviewAccessDenied(res, access) {
  const status = access.code === "INTERVIEW_ALREADY_ACTIVE" ? 409 : 403;
  return res.status(status).json({
    success: false,
    error: access.message,
    code: access.code,
    access,
  });
}

export async function startInterviewWithAccess(user, sessionId, openingQuestion) {
  const start = async (account, transaction = null) => {
    const session = await InterviewSession.findOne({ _id: sessionId, userId: account._id }).session(transaction);
    if (!session) return {};
    if (session.status !== STATES.CREATED) return { session, started: false };

    const now = new Date();
    const access = await getInterviewAccess(account, { transaction, now });
    if (!access.canStart) return { access };

    if (access.tier !== "unlimited") session.accessTier = access.tier;
    session.addQuestion(openingQuestion);
    await transitionTo(session, STATES.IN_PROGRESS, "User started session", { now });
    return { session, started: true };
  };

  if (hasUnlimitedInterviewAccess(user)) {
    try {
      return await start(user);
    } catch (error) {
      if (!isStateConflict(error)) throw error;
      const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id });
      return { session, started: false };
    }
  }

  const outcome = await InterviewSession.db.transaction(async (transaction) => {
    // Write the account before reading usage, so simultaneous starts retry against fresh usage.
    const account = await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { interviewAccessVersion: 1 } },
      { session: transaction, new: true, timestamps: false },
    );
    return account ? start(account, transaction) : {};
  });
  outcome.session?.$session(null);
  return outcome;
}

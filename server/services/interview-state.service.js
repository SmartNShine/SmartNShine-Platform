/**
 * Interview State Machine Agent
 * Formalizes state transitions for InterviewSessions, preventing
 * race conditions and ensuring valid state lifecycles.
 */

import { checkOfflineProctoring } from "./proctoring.service.js";

// Valid states
export const STATES = {
  CREATED: "created",
  IN_PROGRESS: "in-progress",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
};

// Transition matrix: allowed moves from a state
const VALID_TRANSITIONS = {
  [STATES.CREATED]: [STATES.IN_PROGRESS, STATES.ABANDONED],
  [STATES.IN_PROGRESS]: [STATES.PAUSED, STATES.COMPLETED, STATES.ABANDONED],
  [STATES.PAUSED]: [STATES.IN_PROGRESS, STATES.COMPLETED, STATES.ABANDONED],
  [STATES.COMPLETED]: [],
  [STATES.ABANDONED]: [],
};

export const canTransition = (currentState, nextState) => {
  const allowed = VALID_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
};

export const isStateConflict = (error) =>
  error.name === "DocumentNotFoundError" || error.name === "VersionError";

export const transitionTo = async (session, nextState, reason = "", { now = new Date(), staleBefore } = {}) => {
  if (!session) throw new Error("Session required for state transition");

  const currentState = session.status;
  if (!canTransition(currentState, nextState)) {
    throw new Error(
      `Invalid state transition: Cannot move from '${currentState}' to '${nextState}'`
    );
  }

  // Pre-transition logic
  if (currentState === STATES.IN_PROGRESS && !staleBefore) await checkOfflineProctoring(session);
  
  if (nextState === STATES.IN_PROGRESS) {
    session.proctoringHeartbeat = {
      enabled: true, lastSeenAt: now, lastReceivedAt: now, offline: false,
      detectorVersion: session.proctoringHeartbeat?.detectorVersion || "unknown",
    };
    if (currentState === STATES.CREATED) {
      session.startedAt = now;
    } else if (currentState === STATES.PAUSED) {
      session.resumedAt = now;
      if (session.pausedAt) {
        const durationSeconds = Math.round((now - session.pausedAt) / 1000);
        session.pauseDurations.push({
          startedAt: session.pausedAt,
          endedAt: now,
          durationSeconds,
        });
      }
      session.pausedAt = null;
    }
  } else if (nextState === STATES.PAUSED) {
    session.pausedAt = now;
  } else if ([STATES.COMPLETED, STATES.ABANDONED].includes(nextState)) {
    if (nextState === STATES.COMPLETED) session.completedAt = now;
    if (currentState !== STATES.CREATED && session.startedAt) {
      const endedAt = session.pausedAt || (staleBefore ? session.updatedAt : now);
      const pausedMs = (session.pauseDurations || []).reduce((total, pause) =>
        total + (pause.startedAt && pause.endedAt
          ? Math.max(0, pause.endedAt - pause.startedAt)
          : (pause.durationSeconds || 0) * 1000), 0);
      session.totalDurationSeconds = Math.max(1, Math.round((endedAt - session.startedAt - pausedMs) / 1000));
    }
  }

  // Perform transition and write log
  session.status = nextState;
  
  if (!session.stateHistory) {
      session.stateHistory = [];
  }
  session.stateHistory.push({
    state: nextState,
    timestamp: now,
    reason: reason || "User triggered",
  });

  session.$where = { status: currentState, ...(staleBefore && { updatedAt: { $lt: staleBefore } }) };
  try {
    await session.save();
  } finally {
    session.$where = undefined;
  }
  return session;
};

/**
 * Checks if a session has all questions answered or skipped and transitions it to complete if so.
 */
export const checkAutoComplete = async (session, reason = "Auto-completed by answering all questions") => {
  if (session.status !== STATES.IN_PROGRESS && session.status !== STATES.PAUSED) return session;

  const answeredCount = session.questions.filter(
    (q) => q.userAnswer || q.skipped
  ).length;

  if (answeredCount >= session.totalQuestions) {
    try {
      return await transitionTo(session, STATES.COMPLETED, reason);
    } catch (error) {
      if (!isStateConflict(error)) throw error;
      const current = await session.constructor.findById(session._id);
      if (current?.status !== STATES.COMPLETED) throw error;
      return current;
    }
  }

  return session;
};

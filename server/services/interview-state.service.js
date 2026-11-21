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

export const transitionTo = async (session, nextState, reason = "") => {
  if (!session) throw new Error("Session required for state transition");

  const currentState = session.status;
  if (!canTransition(currentState, nextState)) {
    throw new Error(
      `Invalid state transition: Cannot move from '${currentState}' to '${nextState}'`
    );
  }

  // Pre-transition logic
  if (currentState === STATES.IN_PROGRESS) await checkOfflineProctoring(session);
  const now = new Date();
  
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
  } else if (nextState === STATES.COMPLETED) {
    session.completedAt = now;
    // Calculate final duration
    let totalDur = session.startedAt ? (session.completedAt - session.startedAt) / 1000 : 0;
    
    // Subtract pauses
    let pauseTotal = 0;
    if (session.pauseDurations?.length > 0) {
      pauseTotal = session.pauseDurations.reduce((sum, p) => sum + (p.durationSeconds || 0), 0);
    }
    
    session.totalDurationSeconds = Math.max(0, Math.round(totalDur - pauseTotal));
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

  await session.save();
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
    return await transitionTo(session, STATES.COMPLETED, reason);
  }

  return session;
};

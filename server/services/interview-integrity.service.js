/**
 * Server-authoritative interview integrity (security plan, Phase S2).
 * - Turn tokens: a submit/skip must carry a token the server issued with that
 *   question, so scripts can't answer questions that were never served.
 * - Timing: the server measures how long each answer took; the client timer is
 *   not trusted.
 */

import crypto from "crypto";
import { normalizeProctoringEvent } from "./proctoring-scoring.js";
import { INTRO_ANSWER_TIME_SEC, THINK_TIME_SEC, getAnswerTimeLimitSec } from "./interview-difficulty.service.js";

const tokenSecret = () => `${process.env.JWT_SECRET || "smartnshine-dev-secret"}:interview-turn`;

export function createTurnToken(sessionId, questionNumber) {
  return crypto
    .createHmac("sha256", tokenSecret())
    .update(`${sessionId}:${questionNumber}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Sessions created before turn tokens existed are accepted without one. */
export function verifyTurnToken(session, questionNumber, token) {
  if (!session.integrity?.turnTokens) return true;
  if (typeof token !== "string") return false;
  const expected = createTurnToken(session._id, questionNumber);
  const given = Buffer.from(token);
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

// Spoken question ≈ 2.5 words/s plus a lead-in; budget for one repeat.
const speakingSec = (text = "") => 6 + String(text).split(/\s+/).filter(Boolean).length / 2.5;
// Upload, transcription, network and the confirmation dialogs.
const PROCESSING_SLACK_SEC = 60;
const INTRO_BUDGET_SEC = 10 + THINK_TIME_SEC + INTRO_ANSWER_TIME_SEC + 30;

export function answerTimeBudgetSec(session, question) {
  const speaking = session.mode === "live" ? speakingSec(question.questionText) * 2 : 0;
  // If the intro never reached the server, Q1's clock started before the greeting.
  const intro = session.mode === "live" && question.questionNumber === 1 && !session.candidateIntroduction
    ? INTRO_BUDGET_SEC
    : 0;
  return Math.round(speaking + THINK_TIME_SEC + getAnswerTimeLimitSec(question) + PROCESSING_SLACK_SEC + intro);
}

/**
 * TIMING_ANOMALY when an answer arrives well after its time budget.
 * Text mode has no per-question timer, so it is never checked.
 * @returns {Object|null} normalized proctoring event
 */
export function timingAnomalyFor(session, questionNumber, receivedAt = new Date()) {
  if (session.mode === "text") return null;
  const question = session.questions?.find((item) => item.questionNumber === questionNumber);
  if (!question?.startedAt) return null;
  const elapsedSec = (receivedAt - new Date(question.startedAt)) / 1000;
  const budgetSec = answerTimeBudgetSec(session, question);
  if (elapsedSec <= budgetSec) return null;
  return normalizeProctoringEvent({
    eventType: "TIMING_ANOMALY",
    severity: elapsedSec > budgetSec * 1.5 ? "high" : "medium",
    confidence: 1,
    durationMs: Math.round((elapsedSec - budgetSec) * 1000),
    timestampSeconds: Math.max(0, (receivedAt - new Date(session.startedAt || receivedAt)) / 1000),
    detectorVersion: "server-timing-1",
    details: `Answer to question ${questionNumber} arrived ${Math.round(elapsedSec)}s after it was asked (allowed ${budgetSec}s).`,
    meta: { questionNumber, elapsedSec: Math.round(elapsedSec), budgetSec, source: "server-timing" },
  }, receivedAt);
}

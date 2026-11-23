/**
 * Interview Conversation Service
 *
 * Plans the next live-interview turn from what the candidate just said, the way a
 * real interviewer would: dig into a vague answer, push on a strong one, step back
 * to fundamentals after a confused one, or move on to the next syllabus topic.
 *
 * One fast LLM call per turn (latency-critical, it blocks the next question).
 * Full 5-dimension scoring still runs separately in the background.
 */

import AIUsage from "../models/AIUsage.model.js";
import { getOpenAIClient } from "./openai.service.js";
import { COGNITIVE_LEVELS, TURN_DECISIONS } from "./interview-difficulty.service.js";
import { analyzeAnswerSignals } from "./interview-evaluator.service.js";

export const MAX_CONSECUTIVE_FOLLOW_UPS = 2;
const PEOPLE_TYPES = new Set(["behavioral", "situational"]);
const TURN_TIMEOUT_MS = Number(process.env.INTERVIEW_TURN_TIMEOUT_MS) || 8000;
const QUESTION_TYPES = new Set(["technical", "behavioral", "situational", "resume-based"]);
const FOLLOW_UP_KINDS = {
  PROBE_DEEP: TURN_DECISIONS.PROBE_DEEP,
  CLARIFY: TURN_DECISIONS.PROBE_DEEP,
  CHALLENGE: TURN_DECISIONS.CHALLENGE_CONSTRAINT,
  STEP_DOWN: TURN_DECISIONS.STEP_DOWN_FOUNDATION,
};
// Reactions must stay neutral: the candidate should not hear a grade mid-interview.
const GRADING_PHRASES = /\b(great|excellent|perfect|awesome|fantastic|correct|incorrect|wrong|good job|well done|nice answer|good answer)\b/i;

const turnModel = () => process.env.INTERVIEW_TURN_MODEL || "gpt-4o-mini";

export function isAdaptiveTurnsEnabled() {
  return process.env.INTERVIEW_ADAPTIVE_TURNS !== "false" && Boolean(getOpenAIClient());
}

const clampLevel = (level, fallback = 2) => {
  const value = Math.round(Number(level));
  return Number.isFinite(value) ? Math.min(5, Math.max(1, value)) : fallback;
};

const difficultyForLevel = (level) => (level >= 4 ? "hard" : level <= 2 ? "easy" : "medium");

const truncate = (text = "", max) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
};

/**
 * Follow-ups use question slots, so short interviews get fewer of them and the
 * planned topics still get covered.
 */
export function getFollowUpBudget(totalQuestions = 5) {
  const total = Math.max(1, Number(totalQuestions) || 5);
  return {
    maxConsecutive: total >= 7 ? MAX_CONSECUTIVE_FOLLOW_UPS : 1,
    maxTotal: Math.max(1, Math.round(total * 0.35)),
  };
}

// In a mixed interview, keep at least one slot each for technical and people questions.
function missingMixedKinds(session) {
  if (session.interviewType !== "mixed") return 0;
  const main = (session.questions || []).filter((question) => !question.isFollowUp);
  const hasPeople = main.some((question) => PEOPLE_TYPES.has(question.questionType));
  const hasTechnical = main.some((question) => question.questionType === "technical");
  return (hasPeople ? 0 : 1) + (hasTechnical ? 0 : 1);
}

export function canFollowUp(session, answer) {
  const questions = session.questions || [];
  const { maxConsecutive, maxTotal } = getFollowUpBudget(session.totalQuestions);
  const slotsAfterThis = (session.totalQuestions || 0) - questions.length;
  return countTrailingFollowUps(questions) < maxConsecutive &&
    questions.filter((question) => question.isFollowUp).length < maxTotal &&
    slotsAfterThis > missingMixedKinds(session) &&
    String(answer || "").trim().split(/\s+/).length >= 6;
}

export function countTrailingFollowUps(questions = []) {
  let count = 0;
  for (let index = questions.length - 1; index >= 0 && questions[index].isFollowUp; index--) count++;
  return count;
}

/**
 * Next syllabus topic. Each main (non-follow-up) question consumes one planned
 * topic in order; follow-ups don't, so they never push a topic out. Categories
 * already asked are skipped as a guard against repeats.
 */
export function getNextTopic(session) {
  const syllabus = session.syllabus || [];
  const main = (session.questions || []).filter((question) => !question.isFollowUp);
  const opened = new Set(main.map((question) => question.category).filter(Boolean));
  const item = syllabus.slice(main.length).find((entry) => !opened.has(entry.category)) ||
    syllabus.find((entry) => !opened.has(entry.category)) ||
    syllabus.at(-1);
  const cognitiveLevel = clampLevel(item?.cognitiveLevel, 2);
  return {
    category: item?.category || "Core Technical Fundamentals",
    questionType: QUESTION_TYPES.has(item?.questionType) ? item.questionType : "technical",
    cognitiveLevel,
    phase: item?.phase,
    objective: item?.objective,
  };
}

const FORMAT_RULES = {
  technical: "FORMAT RULE: This is a TECHNICAL interview. Every question is technical. Never ask behavioral \"tell me about a time\" questions.",
  behavioral: "FORMAT RULE: This is a BEHAVIORAL interview. Every question is about past behaviour or a hypothetical workplace situation. NEVER ask technical, coding, tooling or system-design questions — even if the candidate mentions technology, ask about their actions, decisions, people and outcomes.",
  "resume-based": "FORMAT RULE: This is a RESUME-BASED interview. Every question must connect to the candidate's resume (a named project, role, skill or result).",
  "job-description": "FORMAT RULE: This is a JOB-DESCRIPTION interview. Every question must connect to a requirement or responsibility in the job description.",
  mixed: "FORMAT RULE: This is a MIXED interview. A follow-up stays the same kind as the question it follows (technical or behavioral); a new topic uses the NEXT TOPIC's type.",
};

const FOLLOW_UP_GUIDE = {
  technical: `How to decide:
- FOLLOW_UP + PROBE_DEEP: the answer was generic, buzzword-heavy or skipped the "how". Ask for specifics about something THEY mentioned.
- FOLLOW_UP + CHALLENGE: the answer was solid. Push one step further on the same thread: an edge case, a failure mode, a scale limit or a trade-off.
- FOLLOW_UP + STEP_DOWN: the answer was wrong or confused. Ask about the simpler concept underneath it.
- FOLLOW_UP + CLARIFY: the answer contradicted itself or a key claim was unclear.`,
  people: `How to decide (behavioral / situational answer — judge the STORY, not technical knowledge):
- FOLLOW_UP + PROBE_DEEP: a STAR part is missing or vague. Ask for it: what THEY personally did (not "we"), the concrete result or impact, or how they measured it.
- FOLLOW_UP + CHALLENGE: the story was complete. Add a twist: "What if your manager had disagreed?", "What would you do differently now?", "How did the other person react?"
- FOLLOW_UP + STEP_DOWN: they had no real example or went off-topic. Ask for a smaller, more recent example (college, internship, team project is fine).
- FOLLOW_UP + CLARIFY: the timeline or their role in the story was unclear.
Follow-ups here must stay about people, decisions and outcomes — never technical details.`,
};

function buildSystemPrompt(session, { allowFollowUp, opening, questionType }) {
  const role = session.role || "Software Engineer";
  const level = (session.experienceLevel || "mid").toUpperCase();
  const guide = PEOPLE_TYPES.has(questionType) ? FOLLOW_UP_GUIDE.people : FOLLOW_UP_GUIDE.technical;
  const task = opening
    ? `The candidate just introduced themselves. Thank them briefly and react to ONE concrete detail from their introduction, then ask the first question on the NEXT TOPIC. Connect it to their background when it fits naturally. "decision" must be "ADVANCE".`
    : `You just heard the candidate's answer. Decide the next turn like a real interviewer would.

${guide}
- ADVANCE: the topic is covered well enough, or the candidate clearly doesn't know it (don't keep drilling), or follow-ups are not allowed. Ask an opening question on the NEXT TOPIC.
${allowFollowUp ? "Prefer a follow-up when the answer gives you something concrete to dig into." : "Follow-ups are NOT allowed this turn: \"decision\" must be \"ADVANCE\"."}`;

  return `You are Shubh, a senior interviewer running a live, spoken mock interview for a ${level} ${role} (${session.interviewType} interview).
${FORMAT_RULES[session.interviewType] || ""}
${task}

Return ONLY a JSON object:
{"decision":"FOLLOW_UP"|"ADVANCE","kind":"PROBE_DEEP"|"CHALLENGE"|"STEP_DOWN"|"CLARIFY"|null,"reaction":string,"question":string,"cognitiveLevel":1-5}

"reaction" is spoken right before the question:
- 4 to 18 words of natural spoken English, neutral and professional.
- It may reference a specific detail they said, e.g. "You mentioned caching the session in Redis."
- Never grade or praise ("great answer", "correct", "wrong", "good job") and never reveal the right answer.
- When advancing, a short transition is enough, e.g. "Okay, let's switch gears a little."

"question":
- Exactly one question, at most 45 words, natural when spoken aloud.
- No lists, markdown, code or multi-part questions.
- Never repeat or rephrase a previously asked question.
- Always in English.`;
}

function buildUserPrompt(session, { question, answer, topic, opening }) {
  const history = (session.questions || [])
    .filter((item) => item.userAnswer || item.skipped)
    .slice(-4)
    .map((item) => `Q${item.questionNumber}${item.isFollowUp ? " (follow-up)" : ""}: ${truncate(item.questionText, 240)}\nA: ${item.skipped ? "[skipped]" : truncate(item.userAnswer, 500)}`)
    .join("\n\n");
  const asked = (session.questions || []).map((item) => `- ${truncate(item.questionText, 160)}`).join("\n");

  const resumeLimit = session.interviewType === "resume-based" ? 1500 : 700;
  const jdLimit = session.interviewType === "job-description" ? 1200 : 450;
  const parts = [
    "CANDIDATE CONTEXT",
    session.candidateIntroduction && !opening ? `Self-introduction: ${truncate(session.candidateIntroduction, 500)}` : null,
    session.resumeText ? `Resume: ${truncate(session.resumeText, resumeLimit)}` : null,
    session.jobDescription ? `Job description: ${truncate(session.jobDescription, jdLimit)}` : null,
    session.targetSkills?.length ? `Focus skills: ${session.targetSkills.join(", ")}` : null,
  ];

  if (opening) {
    parts.push("", `CANDIDATE'S INTRODUCTION:\n${truncate(answer, 2000)}`);
  } else {
    const signals = analyzeAnswerSignals(answer, question.questionType);
    parts.push(
      "",
      history ? `CONVERSATION SO FAR (most recent last):\n${history}` : null,
      "",
      `CURRENT QUESTION (#${question.questionNumber}, ${question.questionType || "technical"}, topic "${question.category}", level ${question.cognitiveLevel || 2}${question.isFollowUp ? ", already a follow-up" : ""}):\n${question.questionText}`,
      `CANDIDATE'S ANSWER:\n${truncate(answer, 3000)}`,
      `ANSWER SIGNALS: ${signals.wordCount} words; buzzwords: ${signals.detectedBuzzwords.join(", ") || "none"}; concrete numbers: ${signals.hasConcreteMetrics ? "yes" : "no"}`
    );
  }

  parts.push(
    "",
    `NEXT TOPIC (if advancing): "${topic.category}" — ${topic.questionType}, level ${topic.cognitiveLevel} (${COGNITIVE_LEVELS[topic.cognitiveLevel]?.name || ""})${topic.objective ? `. Objective: ${topic.objective}` : ""}`,
    asked ? `PREVIOUSLY ASKED (do not repeat):\n${asked}` : null
  );
  return parts.filter((part) => part !== null).join("\n");
}

async function logUsage(userId, usage, responseTime, error) {
  if (!userId) return;
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  try {
    await AIUsage.create({
      userId,
      aiProvider: "openai",
      aiModel: "gpt4o",
      feature: "ai_interview",
      tokensUsed: promptTokens + completionTokens,
      // gpt-4o-mini list price per 1K tokens; approximate for other models.
      cost: (promptTokens / 1000) * 0.00015 + (completionTokens / 1000) * 0.0006,
      responseTime,
      status: error ? (error.name === "APIConnectionTimeoutError" ? "timeout" : "error") : "success",
      errorMessage: error?.message || null,
      metadata: { action: "interview_turn_plan", model: turnModel() },
    });
  } catch (logError) {
    console.error("Failed to log interview turn usage:", logError.message);
  }
}

async function requestPlan(systemPrompt, userPrompt, userId) {
  const client = getOpenAIClient();
  if (!client) return null;
  const startedAt = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: turnModel(),
      temperature: 0.6,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }, { timeout: TURN_TIMEOUT_MS, maxRetries: 0 });
    void logUsage(userId, completion.usage, Date.now() - startedAt);
    return JSON.parse(completion.choices[0]?.message?.content || "null");
  } catch (error) {
    void logUsage(userId, null, Date.now() - startedAt, error);
    console.warn("⚠️ Interview turn planning failed, using syllabus fallback:", error.message);
    return null;
  }
}

function cleanReaction(reaction) {
  const text = truncate(reaction, 200);
  if (!text || GRADING_PHRASES.test(text)) return "";
  return text;
}

function validateQuestion(text, session) {
  const question = truncate(text, 400);
  if (question.length < 12) return null;
  const normalized = question.toLowerCase();
  const isRepeat = (session.questions || []).some((item) => item.questionText?.trim().toLowerCase() === normalized);
  return isRepeat ? null : question;
}

/**
 * Decide the next question after an answer.
 * @returns {Promise<null | { turnDecision: string, nextQuestion: Object }>} null → caller falls back.
 */
export async function planNextTurn({ session, question, answer, userId, request = requestPlan }) {
  const allowFollowUp = canFollowUp(session, answer);
  const topic = getNextTopic(session);

  const plan = await request(
    buildSystemPrompt(session, { allowFollowUp, opening: false, questionType: question.questionType }),
    buildUserPrompt(session, { question, answer, topic, opening: false }),
    userId
  );
  if (!plan) return null;

  const questionText = validateQuestion(plan.question, session);
  if (!questionText) return null;
  const isFollowUp = plan.decision === "FOLLOW_UP" && allowFollowUp;
  if (plan.decision === "FOLLOW_UP" && !allowFollowUp) return null; // ignored the guard

  const reaction = cleanReaction(plan.reaction);
  if (isFollowUp) {
    const cognitiveLevel = clampLevel(plan.cognitiveLevel, question.cognitiveLevel || 2);
    return {
      turnDecision: FOLLOW_UP_KINDS[plan.kind] || TURN_DECISIONS.PROBE_DEEP,
      nextQuestion: {
        questionText,
        // Keep the parent's type so timing, scoring and format rules still apply.
        questionType: QUESTION_TYPES.has(question.questionType) ? question.questionType : "technical",
        category: question.category,
        cognitiveLevel,
        cognitiveMeta: COGNITIVE_LEVELS[cognitiveLevel],
        difficulty: difficultyForLevel(cognitiveLevel),
        syllabusPhase: question.syllabusPhase,
        isFollowUp: true,
        parentQuestionNumber: question.parentQuestionNumber || question.questionNumber,
        acknowledgmentBridge: reaction,
      },
    };
  }

  return {
    turnDecision: TURN_DECISIONS.ADVANCE_SYLLABUS,
    nextQuestion: {
      questionText,
      questionType: topic.questionType,
      category: topic.category,
      cognitiveLevel: topic.cognitiveLevel,
      cognitiveMeta: COGNITIVE_LEVELS[topic.cognitiveLevel],
      difficulty: difficultyForLevel(topic.cognitiveLevel),
      syllabusPhase: topic.phase,
      isFollowUp: false,
      acknowledgmentBridge: reaction,
    },
  };
}

/**
 * Re-plan question 1 from the candidate's self-introduction.
 * @returns {Promise<null | { questionText: string, acknowledgmentBridge: string }>}
 */
export async function planOpeningQuestion({ session, introduction, userId, request = requestPlan }) {
  const first = session.questions?.[0];
  const topic = {
    category: first?.category || "Core Technical Fundamentals",
    questionType: QUESTION_TYPES.has(first?.questionType) ? first.questionType : "technical",
    cognitiveLevel: clampLevel(first?.cognitiveLevel, 2),
    objective: session.syllabus?.[0]?.objective,
  };
  const plan = await request(
    buildSystemPrompt(session, { allowFollowUp: false, opening: true, questionType: topic.questionType }),
    buildUserPrompt({ ...session.toObject?.() ?? session, questions: [] }, { answer: introduction, topic, opening: true }),
    userId
  );
  const questionText = plan && validateQuestion(plan.question, { questions: [] });
  if (!questionText) return null;
  return { questionText, acknowledgmentBridge: cleanReaction(plan.reaction) };
}

export default {
  MAX_CONSECUTIVE_FOLLOW_UPS,
  getFollowUpBudget,
  canFollowUp,
  isAdaptiveTurnsEnabled,
  planNextTurn,
  planOpeningQuestion,
  getNextTopic,
  countTrailingFollowUps,
};

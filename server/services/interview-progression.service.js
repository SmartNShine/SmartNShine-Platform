import InterviewSession from "../models/InterviewSession.model.js";
import { generateQuestion } from "./interview.service.js";
import { COGNITIVE_LEVELS, TURN_DECISIONS, getAnswerTimeLimitSec } from "./interview-difficulty.service.js";
import { generateInterviewSyllabus } from "./interview-syllabus.service.js";
import { processInterviewTurn } from "./interview-turn.service.js";
import { checkAutoComplete, STATES } from "./interview-state.service.js";
import { getNextTopic, isAdaptiveTurnsEnabled, planNextTurn } from "./interview-conversation.service.js";
import { createTurnToken } from "./interview-integrity.service.js";

const activeStates = [STATES.IN_PROGRESS, STATES.PAUSED];
const evaluations = new Map();

export function getQuestionPlan(session) {
  const syllabus = session.syllabus?.length ? session.syllabus : generateInterviewSyllabus(session);
  // Topics are tracked by category so follow-ups (which use up question numbers)
  // never cause a planned topic to be skipped.
  const plan = getNextTopic({ syllabus, questions: session.questions || [] });
  const cognitiveLevel = plan.cognitiveLevel || 2;
  return {
    questionType: plan.questionType,
    category: plan.category,
    syllabusPhase: plan.phase,
    objective: plan.objective,
    cognitiveLevel,
    cognitiveMeta: COGNITIVE_LEVELS[cognitiveLevel],
    difficulty: cognitiveLevel >= 4 ? "hard" : cognitiveLevel <= 2 ? "easy" : "medium",
  };
}

/**
 * Prompt config for generating a planned question: the session's format decides
 * which context (resume / JD) is included, the plan decides the question type.
 */
export function buildGenerationConfig(session, plan, questionNumber) {
  return {
    interviewType: plan.questionType,
    interviewFormat: session.interviewType,
    questionType: plan.questionType,
    objective: plan.objective,
    role: session.role,
    experienceLevel: session.experienceLevel,
    resumeText: session.resumeText,
    jobDescription: session.jobDescription,
    targetSkills: session.targetSkills,
    previousQuestions: (session.questions || []).map((question) => question.questionText),
    previousAnswers: (session.questions || []).map((question) => question.userAnswer || ""),
    currentDifficulty: plan.difficulty,
    questionNumber,
    targetCategory: plan.category,
    cognitiveLevel: plan.cognitiveLevel,
  };
}

// Template question used only when AI generation fails. Matches the planned type
// so a behavioral interview never falls back to a technical question.
export function getFallbackQuestion(session, plan) {
  const topic = String(plan.category || "this area")
    .replace(/^(JD|Resume|Target Skill):\s*/i, "")
    .replace(/\s*\(\d+\)$/, "");
  const lower = topic.charAt(0).toLowerCase() + topic.slice(1);
  const byType = {
    behavioral: [
      `Tell me about a time that tested your ${lower}. What did you personally do, and what was the outcome?`,
      `Describe a situation where ${lower} really mattered. What was your role, and what would you do differently?`,
    ],
    situational: [
      `Imagine you joined a new team and ${lower} quickly became a challenge. What would you do in your first week?`,
      `Suppose a deadline is at risk and it comes down to ${lower}. How would you handle it, and who would you involve?`,
    ],
    "resume-based": [
      "Pick the project on your resume you're most proud of. What was your exact role, and what was the hardest decision you made?",
      "Walk me through a result on your resume. How did you measure it, and what did you personally contribute?",
    ],
    technical: [
      `Walk me through a practical example of ${topic}. What would you measure to know your approach is working?`,
      `What failure would you plan for when working on ${topic}, and how would you detect and recover from it?`,
      `For a ${session.role} working on ${topic}, what trade-offs would you consider before choosing an approach?`,
    ],
  };
  const prompts = byType[plan.questionType] || byType.technical;
  const used = new Set(session.questions.map((question) => question.questionText));
  return {
    ...plan,
    questionText: prompts.find((prompt) => !used.has(prompt)) ||
      `What would you change about your approach to ${lower} if the team had half its usual time, and why?`,
  };
}

export async function prepareNextInterviewQuestion(session, user) {
  // Adaptive turns plan the next question from the answer; pre-generating one
  // before the answer would be a wasted GPT-4o call.
  if (isAdaptiveTurnsEnabled()) return;
  const currentNumber = session.questions.length;
  if (currentNumber >= session.totalQuestions || session.preparedQuestion?.questionNumber === currentNumber + 1) return;

  const plan = getQuestionPlan(session);
  const generated = await generateQuestion(buildGenerationConfig(session, plan, currentNumber + 1), user);

  const questionText = typeof generated.question === "string" ? generated.question.trim() : "";
  if (!questionText || generated.aiModel === "fallback-resilient" ||
      session.questions.some((question) => question.questionText === questionText)) return;

  await InterviewSession.updateOne({
    _id: session._id,
    status: { $in: activeStates },
    [`questions.${currentNumber}`]: { $exists: false },
  }, {
    $set: { preparedQuestion: { ...plan, objective: undefined, questionNumber: currentNumber + 1, questionText } },
  });
}

export function getInterviewTurnResponse(session, questionNumber) {
  const question = session.questions.find((item) => item.questionNumber === questionNumber);
  if (!question || (!question.userAnswer && !question.skipped)) return null;
  const next = session.questions.find((item) => item.questionNumber === questionNumber + 1);
  const current = session.questions.filter((item) => item.userAnswer || item.skipped).length;
  const isComplete = current >= session.totalQuestions;
  const data = {
    evaluation: question.evaluationPending ? null : question.evaluation,
    evaluationPending: question.evaluationPending,
    progress: { current, total: session.totalQuestions, percentage: Math.round(current / session.totalQuestions * 100) },
    mode: session.mode,
    skipped: question.skipped,
    turnDecision: question.turnDecision,
    isComplete,
    nextQuestion: next ? {
      number: next.questionNumber,
      text: next.questionText,
      type: next.questionType,
      category: next.category,
      cognitiveLevel: next.cognitiveLevel,
      cognitiveMeta: next.cognitiveMeta,
      difficulty: next.difficulty,
      answerTimeLimitSec: getAnswerTimeLimitSec(next),
      isFollowUp: Boolean(next.isFollowUp),
      leadIn: next.acknowledgmentBridge || "",
      turnToken: createTurnToken(session._id, next.questionNumber),
      audio: null,
    } : null,
  };
  if (question.transcribedText) {
    data.transcription = {
      text: question.transcribedText,
      duration: question.transcriptionDuration ?? null,
      wordCount: question.transcribedText.split(/\s+/).length,
      provider: question.transcriptionProvider,
      language: question.transcriptionLanguage,
      languageProbability: question.languageProbability,
    };
  }
  return data;
}

export function validateInterviewTurn(session, questionNumber) {
  const latest = session.questions.at(-1);
  if (!Number.isInteger(questionNumber) || questionNumber < 1 || !latest ||
      questionNumber > latest.questionNumber) {
    throw Object.assign(new Error("Question not found"), { status: 400 });
  }
  if (questionNumber < latest.questionNumber - 1 ||
      (questionNumber < latest.questionNumber && !getInterviewTurnResponse(session, questionNumber))) {
    throw Object.assign(new Error("This question is no longer active"), { status: 409 });
  }
  const replay = getInterviewTurnResponse(session, questionNumber);
  if (replay) return replay;
  if (!activeStates.includes(session.status)) {
    throw Object.assign(new Error(`Cannot submit a turn for a session with status: ${session.status}`), { status: 400 });
  }
  return null;
}

export async function saveInterviewTurn(session, questionNumber, { answer, answerMode, skipped, transcription }) {
  // Plan the next question from this answer before taking the write lock: the
  // LLM call is the slow part and must not sit inside the optimistic-retry loop.
  let adaptive = null;
  if (!skipped && isAdaptiveTurnsEnabled()) {
    const replay = validateInterviewTurn(session, questionNumber);
    if (replay) return { session, data: replay, accepted: false };
    const current = session.questions.at(-1);
    if (current?.questionNumber === questionNumber && session.questions.length < session.totalQuestions) {
      adaptive = await planNextTurn({ session, question: current, answer, userId: session.userId });
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const replay = validateInterviewTurn(session, questionNumber);
    if (replay) return { session, data: replay, accepted: false };

    const question = session.questions.at(-1);
    if (skipped) {
      question.skipped = true;
      question.answeredAt = new Date();
      question.evaluation = { score: 0, feedback: "Question was skipped" };
    } else {
      session.submitAnswer(questionNumber, answer, answerMode);
      question.evaluationPending = true;
      if (transcription) {
        question.transcribedText = answer;
        question.transcriptionLanguage = transcription.language;
        question.languageProbability = transcription.languageProbability;
        question.transcriptionProvider = transcription.provider;
        question.transcriptionDuration = transcription.duration;
      }
    }

    if (session.questions.length < session.totalQuestions && adaptive && question.questionNumber === questionNumber) {
      question.turnDecision = adaptive.turnDecision;
      session.addQuestion(adaptive.nextQuestion);
    } else if (session.questions.length < session.totalQuestions) {
      question.turnDecision = TURN_DECISIONS.ADVANCE_SYLLABUS;
      const prepared = session.preparedQuestion;
      const next = prepared?.questionNumber === questionNumber + 1
        ? prepared.toObject()
        : getFallbackQuestion(session, getQuestionPlan(session));
      session.addQuestion(next);
    }

    // Compare the question revision so a completed grade or a competing turn cannot be overwritten.
    const updated = await InterviewSession.findOneAndUpdate({
      _id: session._id,
      userId: session.userId,
      status: { $in: activeStates },
      __v: session.__v === undefined ? { $exists: false } : session.__v,
    }, {
      $set: { questions: session.questions.map((item) => item.toObject()) },
      $unset: { preparedQuestion: 1 },
      $inc: { __v: 1 },
    }, { new: true, runValidators: true });

    if (updated) {
      await checkAutoComplete(updated);
      return { session: updated, data: getInterviewTurnResponse(updated, questionNumber), accepted: true };
    }
    session = await InterviewSession.findOne({ _id: session._id, userId: session.userId });
    if (!session) break;
  }
  throw Object.assign(new Error("The interview changed. Please try submitting again."), { status: 409 });
}

export function evaluatePendingAnswer(session, question) {
  const key = `${session._id}:${question.questionNumber}`;
  if (evaluations.has(key)) return evaluations.get(key);

  const task = (async () => {
    const result = await processInterviewTurn({
      session,
      currentQuestion: question,
      answerText: question.userAnswer,
      userId: session.userId,
      isComplete: true,
      detectedLanguage: question.transcriptionLanguage || "unknown",
    });
    await InterviewSession.updateOne({
      _id: session._id,
      questions: { $elemMatch: { _id: question._id, userAnswer: question.userAnswer, evaluationPending: true } },
    }, {
      $set: {
        "questions.$.evaluation": result.evaluation,
        "questions.$.signals": result.signals,
        "questions.$.evaluationPending": false,
      },
      $inc: { __v: 1 },
    }, { runValidators: true });
  })().finally(() => evaluations.delete(key));
  evaluations.set(key, task);
  return task;
}

export async function finishPendingEvaluations(session) {
  const pending = session.questions.filter((question) => question.evaluationPending && question.userAnswer);
  if (!pending.length) return session;
  await Promise.all(pending.map((question) => evaluatePendingAnswer(session, question)));
  return InterviewSession.findById(session._id);
}

export function scheduleInterviewWork(turn, questionNumber, user) {
  const question = turn.session.questions.find((item) => item.questionNumber === questionNumber);
  if (question?.evaluationPending) {
    void evaluatePendingAnswer(turn.session, question).catch((error) => {
      console.error("Interview answer evaluation failed:", error.message);
    });
  }
  if (turn.accepted && !turn.data.isComplete) {
    void prepareNextInterviewQuestion(turn.session, user).catch((error) => {
      console.warn("Could not prepare the next interview question:", error.message);
    });
  }
}

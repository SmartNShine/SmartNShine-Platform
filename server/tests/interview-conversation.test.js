import test from "node:test";
import assert from "node:assert/strict";
import {
  countTrailingFollowUps,
  getNextTopic,
  planNextTurn,
  planOpeningQuestion,
} from "../services/interview-conversation.service.js";

const syllabus = [
  { category: "APIs", questionType: "technical", cognitiveLevel: 2, phase: "Phase 1" },
  { category: "Databases", questionType: "technical", cognitiveLevel: 3, phase: "Phase 2" },
  { category: "Teamwork", questionType: "behavioral", cognitiveLevel: 2, phase: "Phase 3" },
];

const makeSession = (questions) => ({
  role: "Backend Developer",
  experienceLevel: "junior",
  interviewType: "technical",
  totalQuestions: 5,
  syllabus,
  questions,
});

const apiQuestion = {
  questionNumber: 1,
  questionText: "What is an API and how have you used one?",
  questionType: "technical",
  category: "APIs",
  cognitiveLevel: 2,
};
const answer = "An API lets two programs talk. I built a REST API in Express with JWT auth for a college project.";
const planWith = (plan) => async () => plan;

test("follow-up stays on the parent topic and keeps a neutral lead-in", async () => {
  const turn = await planNextTurn({
    session: makeSession([apiQuestion]),
    question: apiQuestion,
    answer,
    request: planWith({
      decision: "FOLLOW_UP",
      kind: "PROBE_DEEP",
      reaction: "You mentioned JWT auth in your Express API.",
      question: "Where did you store the JWT on the client, and how did you handle token expiry?",
      cognitiveLevel: 3,
    }),
  });
  assert.equal(turn.nextQuestion.isFollowUp, true);
  assert.equal(turn.nextQuestion.category, "APIs");
  assert.equal(turn.nextQuestion.parentQuestionNumber, 1);
  assert.equal(turn.nextQuestion.questionType, "technical", "follow-ups keep the parent's type");
  assert.equal(turn.nextQuestion.acknowledgmentBridge, "You mentioned JWT auth in your Express API.");
  assert.equal(turn.turnDecision, "PROBE_DEEP");
});

test("advance moves to the next unopened syllabus topic", async () => {
  const turn = await planNextTurn({
    session: makeSession([apiQuestion]),
    question: apiQuestion,
    answer,
    request: planWith({ decision: "ADVANCE", reaction: "Okay, let's switch gears.", question: "How would you choose between SQL and NoSQL for a new service?" }),
  });
  assert.equal(turn.nextQuestion.isFollowUp, false);
  assert.equal(turn.nextQuestion.category, "Databases");
  assert.equal(turn.nextQuestion.cognitiveLevel, 3);
  assert.equal(turn.turnDecision, "ADVANCE_SYLLABUS");
});

test("follow-ups are capped after two in a row", async () => {
  const questions = [
    apiQuestion,
    { ...apiQuestion, questionNumber: 2, questionText: "Follow-up one?", isFollowUp: true, userAnswer: "x" },
    { ...apiQuestion, questionNumber: 3, questionText: "Follow-up two?", isFollowUp: true },
  ];
  assert.equal(countTrailingFollowUps(questions), 2);
  let systemPrompt = "";
  const turn = await planNextTurn({
    session: makeSession(questions),
    question: questions[2],
    answer,
    request: async (system) => {
      systemPrompt = system;
      return { decision: "FOLLOW_UP", question: "Yet another drill-down question here?" };
    },
  });
  assert.match(systemPrompt, /Follow-ups are NOT allowed/);
  assert.equal(turn, null, "a follow-up that ignores the cap falls back");
});

test("very short answers cannot trigger a follow-up", async () => {
  let systemPrompt = "";
  await planNextTurn({
    session: makeSession([apiQuestion]),
    question: apiQuestion,
    answer: "I don't know",
    request: async (system) => { systemPrompt = system; return null; },
  });
  assert.match(systemPrompt, /Follow-ups are NOT allowed/);
});

test("grading phrases are dropped from the spoken reaction", async () => {
  const turn = await planNextTurn({
    session: makeSession([apiQuestion]),
    question: apiQuestion,
    answer,
    request: planWith({ decision: "ADVANCE", reaction: "Great answer, that's correct!", question: "How would you index a users table?" }),
  });
  assert.equal(turn.nextQuestion.acknowledgmentBridge, "");
});

test("repeated or empty questions fall back", async () => {
  const repeat = await planNextTurn({
    session: makeSession([apiQuestion]),
    question: apiQuestion,
    answer,
    request: planWith({ decision: "ADVANCE", question: apiQuestion.questionText }),
  });
  assert.equal(repeat, null);
  const failed = await planNextTurn({ session: makeSession([apiQuestion]), question: apiQuestion, answer, request: planWith(null) });
  assert.equal(failed, null);
});

test("next topic skips categories already opened by main questions only", () => {
  const followUpOnDatabases = { questionNumber: 2, category: "Databases", isFollowUp: true };
  assert.equal(getNextTopic(makeSession([apiQuestion, followUpOnDatabases])).category, "Databases");
  assert.equal(getNextTopic(makeSession([apiQuestion, { ...followUpOnDatabases, isFollowUp: false }])).category, "Teamwork");
});

test("opening question reacts to the introduction", async () => {
  const opening = await planOpeningQuestion({
    session: makeSession([apiQuestion]),
    introduction: "I'm a final-year student who built a food delivery app with Node and MongoDB.",
    request: planWith({ decision: "ADVANCE", reaction: "Thanks. A food delivery app sounds like a fun build.", question: "In your food delivery app, how did you design the order API?" }),
  });
  assert.equal(opening.questionText, "In your food delivery app, how did you design the order API?");
  assert.match(opening.acknowledgmentBridge, /food delivery/);
});

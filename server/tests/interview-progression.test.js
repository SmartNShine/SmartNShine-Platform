import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import mongoose from "mongoose";
import InterviewSession from "../models/InterviewSession.model.js";
import {
  evaluatePendingAnswer,
  finishPendingEvaluations,
  saveInterviewTurn,
} from "../services/interview-progression.service.js";
import { apiLimiter } from "../middleware/rateLimiter.middleware.js";
import { interviewProctoringLimiter, interviewTurnLimiter } from "../middleware/interview.middleware.js";

function sessionFixture() {
  return InterviewSession.hydrate({
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    status: "in-progress",
    interviewType: "technical",
    role: "Backend Engineer",
    mode: "live",
    totalQuestions: 5,
    __v: 2,
    questions: [{ questionNumber: 1, questionText: "What are the trade-offs of an index?" }],
    syllabus: [
      { targetQuestionNumber: 1, category: "Indexes", questionType: "technical" },
      { targetQuestionNumber: 2, category: "Transactions", questionType: "technical" },
    ],
  });
}

test("voice answer commits with a pending grade and returns the prepared question", async (t) => {
  const session = sessionFixture();
  session.preparedQuestion = {
    questionNumber: 2, questionText: "How do you handle a deadlock?", category: "Transactions",
  };
  const data = session.toObject();
  const write = t.mock.method(InterviewSession.collection, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.__v, 2);
    assert.deepEqual(update.$inc, { __v: 1 });
    assert.equal(update.$unset.preparedQuestion, 1);
    assert.equal(update.$set.questions[0].evaluationPending, true);
    assert.equal(update.$set.questions[0].transcriptionProvider, "sarvam");
    return { ...data, questions: update.$set.questions, preparedQuestion: undefined, __v: 3 };
  });

  const answer = "Indexes speed reads but increase write overhead.";
  const turn = await saveInterviewTurn(session, 1, {
    answer, answerMode: "voice", transcription: { provider: "sarvam", language: "en-IN", duration: 42 },
  });
  assert.equal(turn.data.nextQuestion.text, "How do you handle a deadlock?");
  assert.equal(turn.data.evaluation, null);
  assert.equal(turn.data.transcription.text, answer);
  assert.equal(turn.data.transcription.duration, 42);

  const replay = await saveInterviewTurn(turn.session, 1, { answer: "Different repeated answer" });
  assert.equal(replay.accepted, false);
  assert.equal(replay.data.transcription.text, answer);
  assert.equal(replay.data.nextQuestion.number, 2);
  assert.equal(write.mock.callCount(), 1);
});

test("a racing turn reloads the accepted answer and does not append a duplicate question", async (t) => {
  const stale = sessionFixture();
  const accepted = InterviewSession.hydrate(stale.toObject());
  accepted.submitAnswer(1, "This answer was accepted first.");
  accepted.questions[0].evaluationPending = true;
  accepted.addQuestion({ questionText: "Which isolation level would you choose?" });
  t.mock.method(InterviewSession, "findOneAndUpdate", async () => null);
  t.mock.method(InterviewSession, "findOne", async () => accepted);

  const turn = await saveInterviewTurn(stale, 1, { skipped: true });
  assert.equal(turn.accepted, false);
  assert.equal(turn.data.nextQuestion.number, 2);
  assert.equal(turn.session.questions.length, 2);
  assert.equal(turn.session.questions[0].userAnswer, "This answer was accepted first.");
});

test("a skip returns a syllabus question even without a prepared question", async (t) => {
  const session = sessionFixture();
  const data = session.toObject();
  t.mock.method(InterviewSession.collection, "findOneAndUpdate", async (_filter, update) => ({
    ...data, questions: update.$set.questions, __v: 3,
  }));

  const turn = await saveInterviewTurn(session, 1, { skipped: true });
  assert.equal(turn.data.skipped, true);
  assert.equal(turn.data.evaluation.score, 0);
  assert.match(turn.data.nextQuestion.text, /Transactions/);
});

test("report generation joins pending evaluation and waits for the grade to be saved", async (t) => {
  const configuredKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  t.after(() => { if (configuredKey !== undefined) process.env.OPENAI_API_KEY = configuredKey; });

  const session = sessionFixture();
  const question = session.submitAnswer(1, "Indexes affect maintenance costs and can slow down writes.");
  question.evaluationPending = true;
  const write = t.mock.method(InterviewSession, "updateOne", async (filter, update) => {
    assert.equal(filter.questions.$elemMatch.evaluationPending, true);
    assert.equal(update.$set["questions.$.evaluationPending"], false);
    question.evaluation = update.$set["questions.$.evaluation"];
    question.evaluationPending = false;
  });
  t.mock.method(InterviewSession, "findById", async () => session);
  const background = evaluatePendingAnswer(session, question);
  const reportSession = await finishPendingEvaluations(session);
  await background;
  assert.equal(write.mock.callCount(), 1);
  assert.equal(reportSession.questions[0].evaluationPending, false);
  assert.equal(typeof reportSession.questions[0].evaluation.score, "number");
});

test("camera traffic and another user cannot exhaust a candidate's question budget", async (t) => {
  const app = express();
  const authenticate = (req, _res, next) => {
    req.user = { userId: req.headers.authorization };
    next();
  };
  app.use("/api", apiLimiter);
  app.post("/api/interview/sessions/demo/proctoring/heartbeat", authenticate, interviewProctoringLimiter, (_req, res) => res.sendStatus(204));
  app.post("/api/interview/sessions/demo/answer", authenticate, interviewTurnLimiter, (_req, res) => res.sendStatus(204));

  const server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  t.after(() => server.close());
  const request = async (path, user) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/interview/sessions/demo/${path}`, {
      method: "POST", headers: { authorization: `Bearer ${user}` },
    });
    await response.arrayBuffer();
    return response.status;
  };

  for (let index = 0; index < 125; index++) {
    assert.equal(await request("proctoring/heartbeat", "candidate"), 204);
  }
  for (let index = 0; index < 120; index++) {
    assert.equal(await request("answer", "other-candidate"), 204);
  }
  assert.equal(await request("answer", "other-candidate"), 429);
  assert.equal(await request("answer", "candidate"), 204);
});

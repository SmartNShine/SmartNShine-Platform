import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import mongoose from "mongoose";
import { generateToken } from "../middleware/auth.middleware.js";
import InterviewSession from "../models/InterviewSession.model.js";
import User from "../models/User.model.js";
import interviewRoutes from "../routes/interview.routes.js";
import { getInterviewAccess } from "../services/interview-access.service.js";
import { PRICING } from "../services/payment.service.js";

const mongoUri = process.env.INTERVIEW_TEST_MONGODB_URI;
const interview = { interviewType: "technical", role: "Backend Engineer", mode: "text", interviewDuration: 10 };

test("pricing lists the free simulation and ten monthly interviews on the ₹199 Pro plan", () => {
  assert.equal(PRICING.pro.monthly.amount, 199);
  assert.ok(PRICING.free.features.includes("30-Minute AI Interview Simulation"));
  assert.ok(PRICING.pro.features.includes("10 AI interviews per month"));
});

test("interview access is enforced by the authenticated API and serialized in MongoDB", {
  skip: !mongoUri && "Set INTERVIEW_TEST_MONGODB_URI to an isolated MongoDB replica set",
}, async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  const previousApiKey = process.env.OPENAI_API_KEY;
  process.env.JWT_SECRET = "interview-access-integration-test";
  process.env.OPENAI_API_KEY = "";
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
  });

  await mongoose.connect(mongoUri, {
    dbName: `interview_access_test_${randomUUID().replaceAll("-", "")}`,
    serverSelectionTimeoutMS: 5000,
  });
  t.after(async () => {
    try {
      await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

  const app = express();
  app.use(express.json());
  app.use("/api/interview", interviewRoutes);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const createUser = (name, subscription) =>
    User.create({ name, email: `${name}@example.test`, password: "test-password", subscription });

  const request = async (user, resource, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/interview/${resource}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${generateToken(user._id, user.email)}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };

  const createDraft = async (user) => {
    const response = await request(user, "sessions", interview);
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body.data.sessionId;
  };

  await t.test("twenty minutes used leaves exactly ten minutes of usable free access", async () => {
    const candidate = await createUser("ten-minutes-left");
    await InterviewSession.create({
      ...interview, userId: candidate._id, status: "completed", accessTier: "free", totalDurationSeconds: 20 * 60,
    });
    const access = await request(candidate, "access");
    assert.equal(access.status, 200);
    assert.deepEqual(access.body.data, { tier: "free", canStart: true, remainingSeconds: 600 });
    const draft = await createDraft(candidate);
    assert.equal((await request(candidate, `sessions/${draft}/start`, {})).status, 200);
  });

  await t.test("free time accumulates across sessions and crossing 30 minutes preserves the live session and report", async () => {
    const candidate = await createUser("free");
    const other = await createUser("other");
    await InterviewSession.create({
      ...interview, userId: candidate._id, status: "completed", totalDurationSeconds: 2400,
    });
    assert.equal((await request(candidate, "access")).body.data.remainingSeconds, 1800);

    const first = await createDraft(candidate);
    const draft = await createDraft(candidate);
    assert.equal((await request(candidate, "access")).body.data.remainingSeconds, 1800);
    assert.equal((await request(candidate, `sessions/${first}/start`, {})).status, 200);
    const startedAt = new Date(Date.now() - 100 * 1000);
    await InterviewSession.updateOne({ _id: first }, { startedAt });
    assert.equal((await request(candidate, `sessions/${first}/abandon`, {})).status, 200);
    const abandoned = await InterviewSession.findById(first);
    assert.ok(abandoned.totalDurationSeconds >= 100);
    assert.equal((await request(candidate, "access")).body.data.remainingSeconds, 1800 - abandoned.totalDurationSeconds);

    const last = await createDraft(candidate);
    const started = await request(candidate, `sessions/${last}/start`, {});
    assert.equal(started.status, 200, JSON.stringify(started.body));
    assert.equal((await request(other, `sessions/${last}/complete`, {})).status, 404);
    await InterviewSession.updateOne({ _id: last }, { startedAt: new Date(Date.now() - 1801 * 1000) });
    assert.equal((await request(candidate, "access")).body.data.code, "INTERVIEW_ALREADY_ACTIVE");
    assert.equal((await request(candidate, `sessions/${last}/pause`, {})).status, 200);
    assert.equal((await request(candidate, `sessions/${last}/resume`, {})).status, 200);
    const question = started.body.data.currentQuestion;
    assert.equal((await request(candidate, `sessions/${last}/skip`, {
      questionNumber: question.number, turnToken: question.turnToken,
    })).status, 200);

    const [finished, retry] = await Promise.all([
      request(candidate, `sessions/${last}/complete`, {}),
      request(candidate, `sessions/${last}/complete`, {}),
    ]);
    assert.equal(finished.status, 200, JSON.stringify(finished.body));
    assert.equal(retry.status, 200, JSON.stringify(retry.body));
    assert.equal(retry.body.data._id, finished.body.data._id);
    const access = (await request(candidate, "access")).body.data;
    assert.equal(access.code, "FREE_INTERVIEW_ACCESS_EXHAUSTED");
    assert.equal(access.upgradeUrl, "/pricing");
    assert.equal((await request(candidate, "sessions", interview)).status, 403);
    assert.equal((await request(candidate, `sessions/${draft}/start`, {})).status, 403);
    assert.equal((await request(other, "access")).body.data.remainingSeconds, 1800);

    await User.updateOne({ _id: candidate._id }, { "subscription.tier": "one-time" });
    assert.equal((await request(candidate, "access")).body.data.code, "FREE_INTERVIEW_ACCESS_EXHAUSTED");
  });

  await t.test("simultaneous starts spend the final Pro interview once", async () => {
    const startDate = new Date(Date.now() - 60 * 1000);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const candidate = await createUser("pro", { tier: "pro", plan: "monthly", status: "active", startDate, endDate });
    const usedInterviews = Array.from({ length: 9 }, () => ({
      ...interview, userId: candidate._id, status: "abandoned", accessTier: "pro", startedAt: new Date(),
    }));
    await InterviewSession.insertMany(usedInterviews.slice(0, 5));
    const upgradedAccess = (await request(candidate, "access")).body.data;
    assert.equal(upgradedAccess.monthlyLimit, 10);
    assert.equal(upgradedAccess.remainingInterviews, 5);

    await InterviewSession.insertMany(usedInterviews.slice(5));
    const drafts = await Promise.all([createDraft(candidate), createDraft(candidate)]);
    const results = await Promise.all(drafts.map((id) => request(candidate, `sessions/${id}/start`, {})));
    assert.deepEqual(results.map(({ status }) => status).sort(), [200, 409]);
    const winner = results.findIndex(({ status }) => status === 200);
    const started = drafts[winner];
    const unused = drafts[1 - winner];

    const replay = await request(candidate, `sessions/${started}/start`, {});
    assert.equal(replay.status, 200);
    assert.equal(replay.body.data.currentQuestion.turnToken, results[winner].body.data.currentQuestion.turnToken);
    assert.equal((await request(candidate, `sessions/${started}/abandon`, {})).status, 200);
    const rejected = await request(candidate, `sessions/${unused}/start`, {});
    assert.equal(rejected.status, 403);
    assert.equal(rejected.body.code, "PRO_INTERVIEW_LIMIT_REACHED");
    assert.match(rejected.body.error, /all 10 AI interviews/);
    assert.equal((await request(candidate, "access")).body.data.remainingInterviews, 0);

    await User.updateOne({ _id: candidate._id }, { "subscription.status": "cancelled" });
    assert.equal((await request(candidate, "access")).body.data.remainingSeconds, 1800);
  });

  await t.test("an already started interview survives subscription expiry", async () => {
    const candidate = await createUser("expiring", {
      tier: "pro", plan: "monthly", status: "active",
      startDate: new Date(Date.now() - 60 * 1000), endDate: new Date(Date.now() + 60 * 1000),
    });
    const draft = await createDraft(candidate);
    const started = await request(candidate, `sessions/${draft}/start`, {});
    assert.equal(started.status, 200);
    await User.updateOne({ _id: candidate._id }, { "subscription.endDate": new Date(Date.now() - 1000) });
    const question = started.body.data.currentQuestion;
    assert.equal((await request(candidate, `sessions/${draft}/skip`, {
      questionNumber: question.number, turnToken: question.turnToken,
    })).status, 200);
    assert.equal((await request(candidate, `sessions/${draft}/complete`, {})).status, 200);
    assert.equal((await request(candidate, "access")).body.data.remainingSeconds, 1800);
  });

  await t.test("monthly billing rollover does not grant an extra allowance and the next paid period renews it", async () => {
    const startDate = new Date("2026-01-31T12:00:00Z");
    const endDate = new Date("2026-03-03T12:00:00Z");
    const candidate = await createUser("month-end", { tier: "pro", plan: "monthly", status: "active", startDate, endDate });
    await InterviewSession.insertMany(Array.from({ length: 10 }, () => ({
      ...interview, userId: candidate._id, status: "completed", accessTier: "pro", startedAt: new Date("2026-02-01T12:00:00Z"),
    })));
    const atMonthEnd = await getInterviewAccess(candidate, { now: new Date("2026-03-01T12:00:00Z") });
    assert.equal(atMonthEnd.remainingInterviews, 0);
    assert.deepEqual(atMonthEnd.resetsAt, endDate);
    candidate.subscription.endDate = new Date("2026-04-03T12:00:00Z");
    const renewed = await getInterviewAccess(candidate, { now: endDate });
    assert.equal(renewed.remainingInterviews, 10);
  });
});

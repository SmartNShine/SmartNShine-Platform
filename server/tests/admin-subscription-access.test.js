import assert from "node:assert/strict";
import {once} from "node:events";
import test from "node:test";
import express from "express";
import {Types} from "mongoose";
import PDFDocument from "pdfkit";
import {generateToken} from "../middleware/auth.middleware.js";
import AIUsage from "../models/AIUsage.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import Resume from "../models/Resume.model.js";
import Subscription from "../models/Subscription.model.js";
import User from "../models/User.model.js";
import interviewRoutes from "../routes/interview.routes.js";
import resumeRoutes from "../routes/resume.routes.js";
import subscriptionRoutes from "../routes/subscription.routes.js";

test("the stored admin role grants interview and plan access without billing records", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "local-admin-subscription-test";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const admin = new User({
    _id: new Types.ObjectId(),
    role: "admin",
    email: "admin@example.test",
    subscription: {tier: "free", status: "expired"},
  });
  const candidate = new User({
    _id: new Types.ObjectId(),
    role: "user",
    email: "candidate@example.test",
    subscription: {tier: "free", status: "active"},
    usage: {lastDailyReset: new Date()},
  });
  t.mock.method(User, "findById", async (id) =>
    [admin, candidate].find((user) => user._id.equals(id))
  );
  const expiryCheck = t.mock.method(Subscription, "updateMany", async () => ({}));
  const billingLookup = t.mock.method(Subscription, "getActiveSubscription", async () => null);
  const activeInterview = t.mock.method(InterviewSession, "exists", () => ({session: async () => null}));
  t.mock.method(InterviewSession, "aggregate", () => ({session: async () => [{seconds: 1800}]}));
  const saveInterview = t.mock.method(InterviewSession.prototype, "save", async function () {
    assert.ok(this.userId.equals(admin._id));
  });

  const app = express();
  app.use(express.json());
  app.use("/api/interview", interviewRoutes);
  app.use("/api/subscription", subscriptionRoutes);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const request = (user, path, body) =>
    fetch(`http://127.0.0.1:${server.address().port}/api/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${generateToken(user._id, user.email)}`,
        "Content-Type": "application/json",
      },
      body: body && JSON.stringify(body),
    });

  const interview = {interviewType: "technical", role: "Backend Engineer", mode: "live"};
  const adminSession = await request(admin, "interview/sessions", interview);
  assert.equal(adminSession.status, 201);
  assert.equal((await adminSession.json()).data.mode, "live");
  assert.equal(activeInterview.mock.callCount(), 0);
  assert.equal(saveInterview.mock.callCount(), 1);

  const adminStatus = await request(admin, "subscription/status");
  assert.equal(adminStatus.status, 200);
  const {subscription} = await adminStatus.json();
  assert.equal(subscription.isAdmin, true);
  assert.equal(subscription.plan, "admin");
  assert.equal(subscription.endDate, null);
  assert.equal(expiryCheck.mock.callCount(), 0);
  assert.equal(billingLookup.mock.callCount(), 0);
  assert.equal(admin.subscription.status, "expired");
  assert.equal(admin.isPremiumUser(), true);
  assert.equal(admin.canAccessFeature("analytics"), true);

  const candidateSession = await request(candidate, "interview/sessions", interview);
  assert.equal(candidateSession.status, 403);
  assert.equal((await candidateSession.json()).code, "FREE_INTERVIEW_ACCESS_EXHAUSTED");
  const candidateStatus = await request(candidate, "subscription/status");
  assert.equal(candidateStatus.status, 200);
  assert.equal((await candidateStatus.json()).subscription.tier, "free");
  assert.equal(expiryCheck.mock.callCount(), 1);
  assert.equal(billingLookup.mock.callCount(), 1);
  assert.equal(candidate.isPremiumUser(), false);
  assert.equal(candidate.canAccessFeature("analytics"), false);
});

test("admins can upload, save, edit and export without a paid resume entitlement", async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousApiBase = process.env.OPENAI_BASE_URL;
  process.env.JWT_SECRET = "local-admin-resume-test";
  process.env.OPENAI_API_KEY = "local-provider-fixture";
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    if (previousApiBase === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previousApiBase;
  });

  const admin = new User({
    _id: new Types.ObjectId(), role: "admin", email: "admin@example.test",
    subscription: {tier: "one-time", status: "active", endDate: new Date(0)},
    usage: {resumesThisMonth: 100, resumesDownloadedThisMonth: 100, aiGenerationsThisMonth: 100},
  });
  const candidate = new User({
    _id: new Types.ObjectId(), role: "user", email: "candidate@example.test",
    subscription: {tier: "free", status: "active"}, usage: {lastDailyReset: new Date()},
  });
  const owned = new Resume({
    userId: admin._id, name: "Admin Resume",
    subscriptionInfo: {createdWithSubscription: true, createdWithTier: "one-time"},
  });
  const foreign = new Resume({userId: candidate._id, name: "Another User's Resume"});
  t.mock.method(User, "findById", async (id) => [admin, candidate].find((user) => user._id.equals(id)));
  t.mock.method(User, "findByIdAndUpdate", async () => {});
  t.mock.method(AIUsage, "create", async () => ({}));
  t.mock.method(Subscription, "updateMany", async () => ({}));
  const linkPlan = t.mock.method(Subscription, "findOne", () => {
    assert.fail("Admin resumes should not consume a paid plan");
  });
  t.mock.method(Resume, "findById", async (id) => [owned, foreign].find((resume) => resume._id.equals(id)));
  t.mock.method(Resume, "findOneAndUpdate", async (filter, update) => {
    assert.ok(admin._id.equals(filter.userId));
    assert.ok(owned._id.equals(filter._id));
    return {...owned.toObject(), ...update.$set};
  });
  t.mock.method(Resume.prototype, "save", async function () {
    assert.ok(this.userId.equals(admin._id));
    assert.equal(this.subscriptionInfo.createdWithSubscription, false);
  });
  const app = express();
  app.use(express.json());
  let providerCalls = 0;
  let providerAvailable = false;
  app.post("/provider/chat/completions", (_req, res) => {
    providerCalls++;
    if (providerAvailable) {
      return res.json({choices: [{message: {content: "An updated summary for the admin's draft."}}]});
    }
    res.set("x-should-retry", "false").status(429).json({
      error: {message: "You exceeded your current quota", code: "insufficient_quota"},
    });
  });
  app.use("/api/resume", resumeRoutes);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${server.address().port}/provider`;

  const request = (user, path, body, method = "POST") =>
    fetch(`http://127.0.0.1:${server.address().port}/api/resume/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${generateToken(user._id, user.email)}`,
        ...(body instanceof FormData ? {} : {"Content-Type": "application/json"}),
      },
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

  const pdf = new PDFDocument();
  const chunks = [];
  pdf.on("data", (chunk) => chunks.push(chunk));
  const ready = once(pdf, "end");
  pdf.text("Candidate Resume. Built reliable software services and maintained automated tests for production releases.");
  pdf.end();
  await ready;
  const upload = () => {
    const form = new FormData();
    form.set("resume", new Blob(chunks, {type: "application/pdf"}), "candidate.pdf");
    return form;
  };

  const uploaded = await request(admin, "upload", upload());
  assert.equal(uploaded.status, 200);
  const draft = await uploaded.json();
  assert.equal(draft.aiUsed, null);
  assert.equal(draft.upgradeRequired, undefined);
  assert.equal(draft.extractionsRemaining, null);
  assert.match(draft.data.customSections[0].items[0].description, /Built reliable software services/);

  const saved = await request(admin, "save", draft.data);
  assert.equal(saved.status, 201);
  assert.equal((await saved.json()).customSections[0].title, "Imported Resume");
  assert.equal(linkPlan.mock.callCount(), 0);

  const edited = await request(admin, owned._id, {name: "Updated Admin Resume"}, "PUT");
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).name, "Updated Admin Resume");

  for (const payload of [{}, {resumeId: owned._id}]) {
    const download = await request(admin, "track-download", payload);
    assert.equal(download.status, 200);
    await download.json();
  }

  const denied = await request(admin, "track-download", {resumeId: foreign._id});
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error, "Access denied");

  const providerFailure = await request(candidate, "upload", upload());
  assert.equal(providerFailure.status, 503);
  assert.equal((await providerFailure.json()).upgradeRequired, undefined);
  assert.equal(providerCalls, 2);

  providerAvailable = true;
  const enhanced = await request(admin, "enhance", {
    sectionType: "summary", content: "This unsaved draft should be available to the admin.",
  });
  assert.equal(enhanced.status, 200);
  assert.match((await enhanced.json()).enhanced, /updated summary/);

  const candidateDraftDownload = await request(candidate, "track-download", {});
  assert.equal(candidateDraftDownload.status, 400);
  assert.equal((await candidateDraftDownload.json()).error, "Resume ID required");

  candidate.usage.resumesThisMonth = 1;
  const candidateSave = await request(candidate, "save", {name: "New Resume"});
  assert.equal(candidateSave.status, 403);
  assert.equal((await candidateSave.json()).upgradeRequired, true);
});

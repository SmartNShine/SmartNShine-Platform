import test from "node:test";
import assert from "node:assert/strict";
import InterviewSession from "../models/InterviewSession.model.js";
import {
  EVENT_WEIGHTS, PROCTORING_EVENTS, PROCTORING_EVENT_TYPES, normalizeProctoringLevel, sanitizeEventMeta,
} from "../services/proctoring-events.js";
import { FLAG_COUNT_KEYS, normalizeProctoringEvent, scoreProctoringEvents } from "../services/proctoring-scoring.js";
import {
  answerTimeBudgetSec, createTurnToken, timingAnomalyFor, verifyTurnToken,
} from "../services/interview-integrity.service.js";

test("event catalog drives the model enum, weights and flag counters", () => {
  const enumValues = InterviewSession.schema.path("proctoringEvents").schema.path("eventType").enumValues;
  assert.deepEqual([...enumValues].sort(), [...PROCTORING_EVENT_TYPES].sort());
  for (const [type, spec] of Object.entries(PROCTORING_EVENTS)) {
    assert.equal(EVENT_WEIGHTS[type], spec.weight);
    assert.ok(["low", "medium", "high"].includes(spec.severity), type);
    assert.ok(spec.label && spec.family, type);
  }
  for (const key of Object.values(FLAG_COUNT_KEYS)) {
    assert.ok(InterviewSession.schema.path(`proctoringSummary.flagCounts.${key}`), `flagCounts.${key} is persisted`);
  }
});

test("event meta is kept small and flat", () => {
  assert.deepEqual(sanitizeEventMeta(null), {});
  assert.deepEqual(sanitizeEventMeta({ ok: 1, nested: { a: 1 }, "bad key": 2, label: "x".repeat(500) }), { ok: 1, label: "x".repeat(200) });
  assert.deepEqual(normalizeProctoringEvent({ eventType: "TAB_SWITCH", meta: [1, 2] }).meta, {});
});

test("proctoring level defaults to practice", () => {
  assert.equal(normalizeProctoringLevel("proctored"), "proctored");
  assert.equal(normalizeProctoringLevel("exam"), "practice");
  assert.equal(normalizeProctoringLevel(undefined), "practice");
});

test("virtual devices are hard evidence only in proctored mode", () => {
  const virtual = { eventType: "VIRTUAL_DEVICE", confidence: 1 };
  assert.equal(scoreProctoringEvents([virtual], { level: "practice" }).verdict, "REVIEW_RECOMMENDED");
  assert.equal(scoreProctoringEvents([virtual], { level: "proctored" }).verdict, "FLAGGED_SUSPICIOUS");
  assert.equal(scoreProctoringEvents([{ eventType: "MULTI_SCREEN" }]).verdict, "REVIEW_RECOMMENDED");
  assert.equal(scoreProctoringEvents([{ eventType: "FULLSCREEN_EXIT", confidence: 0.5 }]).verdict, "VERIFIED_CLEAN");
  assert.equal(scoreProctoringEvents([{ eventType: "TIMING_ANOMALY" }, { eventType: "TIMING_ANOMALY" }]).flagCounts.timing, 2);
});

test("turn tokens are bound to session and question", () => {
  const session = { _id: "abc", integrity: { turnTokens: true } };
  const token = createTurnToken("abc", 2);
  assert.equal(verifyTurnToken(session, 2, token), true);
  assert.equal(verifyTurnToken(session, 3, token), false, "token for a different question");
  assert.equal(verifyTurnToken({ ...session, _id: "other" }, 2, token), false, "token from another session");
  assert.equal(verifyTurnToken(session, 2, undefined), false);
  assert.equal(verifyTurnToken({ _id: "legacy" }, 2, undefined), true, "legacy sessions without tokens still work");
});

test("timing anomalies are measured by the server against the question's budget", () => {
  const askedAt = new Date("2026-11-23T10:00:00Z");
  const question = { questionNumber: 2, questionText: "Tell me about a time you resolved a conflict.", questionType: "behavioral", cognitiveLevel: 2, startedAt: askedAt };
  const session = { mode: "live", startedAt: askedAt, candidateIntroduction: "hi", questions: [question] };
  const budget = answerTimeBudgetSec(session, question);
  assert.ok(budget >= 150 + 10 + 60, `budget ${budget}s covers think + answer + slack`);
  assert.equal(timingAnomalyFor(session, 2, new Date(askedAt.getTime() + (budget - 5) * 1000)), null);
  const late = timingAnomalyFor(session, 2, new Date(askedAt.getTime() + (budget + 120) * 1000));
  assert.equal(late.eventType, "TIMING_ANOMALY");
  assert.equal(late.meta.budgetSec, budget);
  assert.equal(timingAnomalyFor({ ...session, mode: "text" }, 2, new Date(askedAt.getTime() + 3600e3)), null, "text mode is untimed");
  const q1 = { ...question, questionNumber: 1 };
  assert.ok(answerTimeBudgetSec({ ...session, candidateIntroduction: undefined }, q1) > answerTimeBudgetSec(session, q1),
    "Q1 gets the intro budget when the introduction never reached the server");
});

// ---- Screen sharing (security plan S1.5) ----
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MAX_SCREEN_FRAMES, MAX_SCREEN_FRAME_BYTES, SCREEN_FRAME_MIN_INTERVAL_MS } from "../services/proctoring-events.js";
import { SCREEN_SHARE_OFF_REVIEW_MS } from "../services/proctoring-scoring.js";
import {
  purgeExpiredScreenFrames, resolveScreenSharePolicy, screenFramePath, validateScreenFrame, writeScreenFrame,
} from "../services/screen-share.service.js";

test("screen-share events only recommend review in proctored mode", () => {
  for (const eventType of ["SCREEN_SHARE_UNAVAILABLE", "SCREEN_SHARE_PARTIAL"]) {
    assert.equal(PROCTORING_EVENTS[eventType].levels.join(), "proctored");
    assert.equal(scoreProctoringEvents([{ eventType }], { level: "proctored" }).verdict, "REVIEW_RECOMMENDED", eventType);
    assert.equal(scoreProctoringEvents([{ eventType }], { level: "practice" }).verdict, "VERIFIED_CLEAN", eventType);
  }
  const shortStop = { eventType: "SCREEN_SHARE_STOPPED", durationMs: 5000 };
  assert.equal(scoreProctoringEvents([shortStop], { level: "proctored" }).verdict, "VERIFIED_CLEAN");
  assert.equal(scoreProctoringEvents([shortStop, shortStop, shortStop], { level: "proctored" }).verdict, "REVIEW_RECOMMENDED");
  const longStop = { eventType: "SCREEN_SHARE_STOPPED", durationMs: SCREEN_SHARE_OFF_REVIEW_MS + 1000 };
  assert.equal(scoreProctoringEvents([longStop], { level: "proctored" }).verdict, "REVIEW_RECOMMENDED");
  assert.equal(scoreProctoringEvents([longStop], { level: "proctored" }).flagCounts.screenShareStopped, 1);
});

test("screen-share policy: flagged when optional, blocked when required", () => {
  assert.deepEqual(resolveScreenSharePolicy({ level: "practice", screenShare: { status: "monitor" } }).screenShare,
    { required: false, status: "off" });
  const optional = resolveScreenSharePolicy({ level: "proctored", screenShare: { status: "declined" } });
  assert.equal(optional.ok, true);
  assert.equal(optional.screenShare.status, "declined");
  assert.equal(resolveScreenSharePolicy({ level: "proctored", screenShare: { status: "bogus" } }).screenShare.status, "unavailable");
  for (const status of ["declined", "unavailable", "window", "browser"]) {
    assert.equal(resolveScreenSharePolicy({ level: "proctored", screenShare: { status }, required: true }).ok, false, status);
  }
  for (const status of ["monitor", "unknown"]) {
    const required = resolveScreenSharePolicy({ level: "proctored", screenShare: { status }, required: true });
    assert.equal(required.ok, true, status);
    assert.equal(required.screenShare.required, true);
  }
});

test("screen frames are validated before storage", () => {
  const session = { status: "in-progress", proctoringLevel: "proctored", screenShare: { frames: [] } };
  const image = `data:image/webp;base64,${Buffer.from("frame").toString("base64")}`;
  const ok = validateScreenFrame({ session, imageData: image, reason: "tab_hidden", timestampSeconds: 12 });
  assert.equal(ok.ok, true);
  assert.equal(ok.reason, "tab_hidden");
  assert.equal(validateScreenFrame({ session, imageData: image, reason: "nope" }).reason, "periodic");

  const status = (overrides) => validateScreenFrame({ session, imageData: image, ...overrides }).status;
  assert.equal(status({ session: { ...session, proctoringLevel: "practice" } }), 400);
  assert.equal(status({ session: { ...session, status: "completed" } }), 409);
  assert.equal(status({ session: { ...session, screenShare: { frames: new Array(MAX_SCREEN_FRAMES) } } }), 409);
  assert.equal(status({ imageData: "data:image/png;base64,AAAA" }), 400);
  assert.equal(status({ imageData: `data:image/jpeg;base64,${Buffer.alloc(MAX_SCREEN_FRAME_BYTES + 1).toString("base64")}` }), 413);
  const now = Date.now();
  assert.equal(validateScreenFrame({ session, imageData: image, lastFrameAt: now - 1000, now }).status, 429);
  assert.equal(validateScreenFrame({ session, imageData: image, lastFrameAt: now - SCREEN_FRAME_MIN_INTERVAL_MS, now }).ok, true);
});

test("screen frames are stored by session and purged after retention", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "screen-frames-"));
  const oldId = "a".repeat(24);
  const freshId = "b".repeat(24);
  try {
    const file = await writeScreenFrame(oldId, Buffer.from("x"), "webp", root);
    assert.ok(fs.existsSync(screenFramePath(oldId, file, root)));
    assert.equal(screenFramePath(oldId, "../../etc/passwd", root), null);
    assert.throws(() => screenFramePath("../evil", file, root));
    await writeScreenFrame(freshId, Buffer.from("y"), "jpg", root);
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    fs.utimesSync(path.join(root, oldId), old, old);

    assert.deepEqual(await purgeExpiredScreenFrames({ root, days: 30 }), [oldId]);
    assert.equal(fs.existsSync(path.join(root, oldId)), false);
    assert.equal(fs.existsSync(path.join(root, freshId)), true);
    assert.deepEqual(await purgeExpiredScreenFrames({ root: path.join(root, "missing") }), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("screen-frame endpoints: owner uploads, others are refused", async (t) => {
  const { default: InterviewSessionModel } = await import("../models/InterviewSession.model.js");
  const { default: User } = await import("../models/User.model.js");
  const { uploadScreenFrame, getScreenFrame, updateScreenShareStatus } = await import("../controllers/interview.controller.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "screen-frames-api-"));
  const previousDir = process.env.SCREEN_FRAMES_DIR;
  process.env.SCREEN_FRAMES_DIR = root;
  t.after(() => {
    process.env.SCREEN_FRAMES_DIR = previousDir;
    if (previousDir === undefined) delete process.env.SCREEN_FRAMES_DIR;
    fs.rmSync(root, { recursive: true, force: true });
  });
  const res = () => ({
    statusCode: 200, headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set(key, value) { this.headers[key] = value; return this; },
    type() { return this; },
  });
  const sessionId = "c".repeat(24);
  const stored = { _id: sessionId, userId: "owner", status: "in-progress", proctoringLevel: "proctored", screenShare: { frames: [] } };
  t.mock.method(InterviewSessionModel, "findOne", () => ({ select: () => ({ lean: async () => stored }) }));
  t.mock.method(InterviewSessionModel, "findOneAndUpdate", async (query, update) => {
    if (update.$push) {
      const frame = { _id: "f".repeat(24), ...update.$push["screenShare.frames"] };
      stored.screenShare.frames.push(frame);
      return { screenShare: { frames: [frame] } };
    }
    assert.equal(query.proctoringLevel, "proctored");
    return { screenShare: { status: update.$set?.["screenShare.status"], stoppedMsTotal: update.$inc?.["screenShare.stoppedMsTotal"] || 0 } };
  });
  t.mock.method(InterviewSessionModel, "findById", () => ({ select: () => ({ lean: async () => stored }) }));
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => ({ role: "student" }) }) }));

  const imageData = `data:image/webp;base64,${Buffer.from("frame").toString("base64")}`;
  const upload = res();
  await uploadScreenFrame({ params: { sessionId }, user: { userId: "owner" }, body: { imageData, reason: "tab_hidden", timestampSeconds: 30 } }, upload);
  assert.equal(upload.statusCode, 201);
  assert.equal(upload.body.data.frameId, "f".repeat(24));
  assert.equal(stored.screenShare.frames[0].reason, "tab_hidden");
  assert.ok(fs.existsSync(path.join(root, sessionId, stored.screenShare.frames[0].file)));

  const tooSoon = res();
  await uploadScreenFrame({ params: { sessionId }, user: { userId: "owner" }, body: { imageData } }, tooSoon);
  assert.equal(tooSoon.statusCode, 429);

  const stranger = res();
  await getScreenFrame({ params: { sessionId, frameId: "f".repeat(24) }, user: { userId: "someone-else" } }, stranger);
  assert.equal(stranger.statusCode, 403);

  const missing = res();
  await getScreenFrame({ params: { sessionId, frameId: "0".repeat(24) }, user: { userId: "owner" } }, missing);
  assert.equal(missing.statusCode, 404);

  const stopped = res();
  await updateScreenShareStatus({ params: { sessionId }, user: { userId: "owner" }, body: { status: "monitor", stoppedMs: 12000 } }, stopped);
  assert.deepEqual(stopped.body.data, { status: "monitor", stoppedMsTotal: 12000 });
  const empty = res();
  await updateScreenShareStatus({ params: { sessionId }, user: { userId: "owner" }, body: { status: "hacked" } }, empty);
  assert.equal(empty.statusCode, 400);
});

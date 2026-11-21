import test from "node:test";
import assert from "node:assert/strict";
import { TemporalEvidence, CandidateContinuity, faceDescriptor } from "../../client/src/components/interview/proctoring/temporalEvidence.js";
import { normalizeProctoringEvent, scoreProctoringEvents, offlineEventFor } from "../services/proctoring-scoring.js";
import { appendProctoringEvent, checkOfflineProctoring, startProctoringWatchdog } from "../services/proctoring.service.js";
import { transitionTo } from "../services/interview-state.service.js";
import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import { recordProctoringHeartbeat, recordProctoringEvent } from "../controllers/interview.controller.js";
import logger from "../utils/logger.js";

function responseStub() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

function observeFor(engine, eventType, duration, options = {}) {
  const events = [];
  for (let now = 0; now <= duration; now += 250) {
    const event = engine.observe(eventType, { present: true, confidence: 0.85, now, ...options });
    if (event) events.push(event);
  }
  return events;
}

test("transient and low-confidence phone detections do not emit", () => {
  assert.equal(observeFor(new TemporalEvidence(), "PHONE_DETECTED", 750).length, 0);
  assert.equal(observeFor(new TemporalEvidence(), "PHONE_DETECTED", 5000, { confidence: 0.5 }).length, 0);
});

test("sustained phone presence emits enriched evidence once during cooldown", () => {
  const events = observeFor(new TemporalEvidence(), "PHONE_DETECTED", 5000);
  assert.equal(events.length, 1);
  assert.ok(events[0].durationMs >= 2000);
  assert.ok(events[0].evidenceCount >= 7);
  assert.ok(events[0].confidence >= 0.6);
  assert.equal(events[0].detectorVersion, "temporal-vision-2");
});

test("N-of-M evidence tolerates isolated misses but rejects disconnected frames", () => {
  const engine = new TemporalEvidence();
  const events = [];
  for (let now = 0; now <= 3000; now += 250) {
    const event = engine.observe("PHONE_DETECTED", { now, present: now !== 1000 && now !== 1750, confidence: 0.9 });
    if (event) events.push(event);
  }
  assert.equal(events.length, 1);
  const sparse = new TemporalEvidence();
  assert.equal(observeFor(sparse, "PHONE_DETECTED", 500).length, 0);
  assert.equal(sparse.observe("PHONE_DETECTED", { now: 4500, present: true, confidence: 0.9 }), null);
  assert.equal(sparse.isActive("PHONE_DETECTED"), false);
});

test("second person and absence require sustained observations with face counts", () => {
  assert.equal(observeFor(new TemporalEvidence(), "MULTIPLE_FACES", 1000, { faceCount: 2 }).length, 0);
  const multiple = observeFor(new TemporalEvidence(), "MULTIPLE_FACES", 4000, { faceCount: 2 });
  assert.equal(multiple.length, 1);
  assert.equal(multiple[0].faceCount, 2);
  assert.equal(scoreProctoringEvents(multiple).verdict, "FLAGGED_SUSPICIOUS");
  const absent = observeFor(new TemporalEvidence(), "FACE_ABSENT", 5000, { faceCount: 0 });
  assert.equal(absent.length, 1);
  assert.equal(absent[0].faceCount, 0);
});

test("persistent violations can repeat after cooldown; cleared phone state recovers", () => {
  const engine = new TemporalEvidence();
  assert.equal(observeFor(engine, "PHONE_DETECTED", 20000).length, 2);
  engine.observe("PHONE_DETECTED", { now: 20250, present: false, confidence: 0 });
  assert.equal(engine.isActive("PHONE_DETECTED"), true); // One miss does not flicker the HUD.
  for (let now = 20500; now <= 21250; now += 250) engine.observe("PHONE_DETECTED", { now, present: false, confidence: 0 });
  assert.equal(engine.isActive("PHONE_DETECTED"), false);
});

test("candidate replacement is stabilized against the original calibrated face", () => {
  const continuity = new CandidateContinuity();
  const baseline = [1.5, 2, 0.4, 1.1, 0.7];
  for (let now = 0; now <= 2500; now += 250) assert.equal(continuity.observe(baseline, now).changed, false);
  assert.equal(continuity.observe(baseline.map((value) => value * 1.05), 2750).changed, false);
  continuity.observe(null, 3000); // Losing the face must not discard the enrolled candidate.
  const evidence = new TemporalEvidence();
  const events = [];
  for (let now = 3250; now <= 7250; now += 250) {
    const result = continuity.observe(baseline.map((value) => value * 1.4), now);
    const event = evidence.observe("IDENTITY_SWITCH", { now, present: result.changed, confidence: result.confidence, faceCount: 1 });
    if (event) events.push(event);
  }
  assert.equal(events.length, 1);
  assert.ok(events[0].durationMs >= 3000);
});

test("face descriptors reject unusable landmarks and are translation/scale invariant", () => {
  assert.equal(faceDescriptor([]), null);
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  points[33] = { x: 0.3, y: 0.3 };
  points[263] = { x: 0.7, y: 0.3 };
  const original = faceDescriptor(points);
  const moved = faceDescriptor(points.map(({ x, y }) => ({ x: x * 0.5 + 0.1, y: y * 0.5 + 0.2 })));
  original.forEach((value, index) => assert.ok(Math.abs(value - moved[index]) < 1e-10));
});

test("legacy payload defaults are finite and retain zero confidence/face count", () => {
  const legacy = normalizeProctoringEvent({ eventType: "PHONE_DETECTED" });
  assert.equal(legacy.durationMs, 0);
  assert.equal(legacy.faceCount, null);
  assert.equal(legacy.detectorVersion, "unknown");
  const event = normalizeProctoringEvent({ confidence: 0, faceCount: 0, durationMs: Infinity, evidenceCount: -4, meta: null });
  assert.equal(event.confidence, 0);
  assert.equal(event.faceCount, 0);
  assert.equal(event.durationMs, 0);
  assert.equal(event.evidenceCount, 0);
  assert.deepEqual(event.meta, {});
});

test("weighted score and hard rules produce all three verdicts", () => {
  const phone = { eventType: "PHONE_DETECTED", confidence: 0.8, durationMs: 2000 };
  assert.equal(scoreProctoringEvents([]).verdict, "VERIFIED_CLEAN");
  assert.equal(scoreProctoringEvents([phone]).verdict, "VERIFIED_CLEAN");
  assert.equal(scoreProctoringEvents([phone, phone]).verdict, "FLAGGED_SUSPICIOUS");
  assert.equal(scoreProctoringEvents([{ eventType: "PROCTORING_OFFLINE" }]).verdict, "REVIEW_RECOMMENDED");
  assert.equal(scoreProctoringEvents([{ eventType: "MULTIPLE_FACES", durationMs: 5000, confidence: 0.8 }]).verdict, "FLAGGED_SUSPICIOUS");
  const identity = { eventType: "IDENTITY_SWITCH", confidence: 0.7, durationMs: 2000 };
  assert.equal(scoreProctoringEvents([identity, identity]).verdict, "REVIEW_RECOMMENDED");
  assert.equal(scoreProctoringEvents([identity, identity, identity]).verdict, "FLAGGED_SUSPICIOUS");
  const weak = scoreProctoringEvents([{ ...phone, confidence: 0.3 }]).integrityScore;
  const strong = scoreProctoringEvents([{ ...phone, confidence: 1, durationMs: 10000 }]).integrityScore;
  assert.ok(weak > strong);
  assert.equal(scoreProctoringEvents(Array(50).fill(phone)).integrityScore, 0);
});

test("heartbeat grace, lifecycle and deduplication suppress false offline flags", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  const session = { status: "in-progress", startedAt: new Date(now - 120000), proctoringHeartbeat: { enabled: true, lastSeenAt: new Date(now - 59000) } };
  assert.equal(offlineEventFor(session, now), null);
  session.proctoringHeartbeat.lastSeenAt = new Date(now - 61000);
  assert.equal(offlineEventFor(session, now).eventType, "PROCTORING_OFFLINE");
  for (const status of ["paused", "completed", "abandoned"]) assert.equal(offlineEventFor({ ...session, status }, now), null);
  session.proctoringHeartbeat.offline = true;
  assert.equal(offlineEventFor(session, now), null);
  assert.equal(offlineEventFor({ status: "in-progress" }, now), null); // Legacy sessions aren't enrolled retroactively.
});

test("persistence retries concurrent events without losing evidence or score", async (t) => {
  let stored = { _id: "session", status: "in-progress", proctoringEvents: [] };
  let calls = 0;
  t.mock.method(InterviewSession, "findOne", () => ({ lean: async () => structuredClone(stored) }));
  t.mock.method(InterviewSession, "findOneAndUpdate", async (query, update) => {
    calls += 1;
    if (calls === 1) {
      stored.proctoringEvents.push(normalizeProctoringEvent({ eventType: "TAB_SWITCH" }));
      return null;
    }
    assert.equal(query.$expr.$eq[1], stored.proctoringEvents.length);
    stored.proctoringEvents.push(update.$push.proctoringEvents);
    stored.proctoringSummary = update.$set.proctoringSummary;
    return stored;
  });
  const result = await appendProctoringEvent("session", normalizeProctoringEvent({ eventType: "PHONE_DETECTED" }));
  assert.equal(result.proctoringEvents.length, 2);
  assert.deepEqual(result.proctoringSummary, scoreProctoringEvents(result.proctoringEvents));
});

test("server offline check inserts evidence through scoring with an atomic gap guard", async (t) => {
  const now = new Date();
  const session = { _id: "session", status: "in-progress", startedAt: new Date(now - 120000), proctoringEvents: [], proctoringHeartbeat: { enabled: true, lastSeenAt: new Date(now - 70000) } };
  t.mock.method(InterviewSession, "findOne", () => ({ lean: async () => session }));
  t.mock.method(InterviewSession, "findOneAndUpdate", async (query, update) => {
    assert.equal(query["proctoringHeartbeat.lastSeenAt"], session.proctoringHeartbeat.lastSeenAt);
    assert.deepEqual(query["proctoringHeartbeat.offline"], { $ne: true });
    assert.equal(update.$set["proctoringHeartbeat.offline"], true);
    assert.equal(update.$push.proctoringEvents.eventType, "PROCTORING_OFFLINE");
    return { ...session, proctoringSummary: update.$set.proctoringSummary };
  });
  const updated = await checkOfflineProctoring(session, now);
  assert.equal(updated.proctoringSummary.flagCounts.offline, 1);
  assert.equal(updated.proctoringSummary.verdict, "REVIEW_RECOMMENDED");
});

test("watchdog detects a missing heartbeat without receiving another client request", async (t) => {
  const session = { _id: "session", status: "in-progress", proctoringEvents: [], proctoringHeartbeat: { enabled: true, lastSeenAt: new Date(Date.now() - 90000) } };
  let tick;
  let inserted = 0;
  t.mock.method(globalThis, "setInterval", (callback, interval) => {
    assert.equal(interval, 10000);
    tick = callback;
    return { unref() {} };
  });
  t.mock.method(globalThis, "clearInterval", () => {});
  t.mock.method(InterviewSession, "find", () => ({ lean: () => ({ cursor: async function* () { yield session; } }) }));
  t.mock.method(InterviewSession, "findOne", () => ({ lean: async () => session }));
  t.mock.method(InterviewSession, "findOneAndUpdate", async (_query, update) => {
    inserted += 1;
    assert.equal(update.$push.proctoringEvents.eventType, "PROCTORING_OFFLINE");
    return session;
  });
  const stop = startProctoringWatchdog();
  await tick();
  assert.equal(inserted, 1);
  stop();
});

test("start and resume enroll monitoring with a fresh grace period", async () => {
  for (const status of ["created", "paused"]) {
    const session = { status, pauseDurations: [], proctoringHeartbeat: { enabled: true, offline: true, lastSeenAt: new Date(0) }, save: async () => {} };
    await transitionTo(session, "in-progress");
    assert.equal(session.proctoringHeartbeat.offline, false);
    assert.ok(Date.now() - session.proctoringHeartbeat.lastSeenAt < 1000);
  }
});

test("heartbeat endpoint checks ownership and rejects inactive sessions", async (t) => {
  let session = null;
  t.mock.method(InterviewSession, "findOne", (query) => {
    assert.equal(query.userId, "candidate");
    assert.equal(query._id, "session");
    return { lean: async () => session };
  });
  const req = { user: { userId: "candidate" }, params: { sessionId: "session" }, body: {} };
  let res = responseStub();
  await recordProctoringHeartbeat(req, res);
  assert.equal(res.statusCode, 404);
  session = { status: "completed" };
  res = responseStub();
  await recordProctoringHeartbeat(req, res);
  assert.equal(res.statusCode, 409);
});

test("heartbeat recovery records the stale gap before renewing monitoring", async (t) => {
  const session = { _id: "session", status: "in-progress", proctoringEvents: [], proctoringHeartbeat: { enabled: true, lastSeenAt: new Date(Date.now() - 90000), offline: false } };
  let phase = 0;
  t.mock.method(InterviewSession, "findOne", () => ({ lean: async () => session }));
  t.mock.method(InterviewSession, "findOneAndUpdate", async (_query, update) => {
    phase += 1;
    if (phase === 1) {
      assert.equal(update.$push.proctoringEvents.eventType, "PROCTORING_OFFLINE");
      session.proctoringSummary = update.$set.proctoringSummary;
      session.proctoringHeartbeat.offline = true;
    } else {
      assert.equal(update.$set["proctoringHeartbeat.offline"], false);
      assert.ok(Date.now() - update.$set["proctoringHeartbeat.lastSeenAt"] < 1000);
      session.proctoringHeartbeat.offline = false;
    }
    return session;
  });
  const res = responseStub();
  await recordProctoringHeartbeat({ params: { sessionId: "session" }, user: { userId: "candidate" }, body: { detectorHealthy: true, detectorVersion: "test" } }, res);
  assert.equal(phase, 2);
  assert.equal(res.body.data.summary.flagCounts.offline, 1);
  assert.equal(res.body.data.offline, false);
});

test("unhealthy detector heartbeats cannot renew last healthy camera time", async (t) => {
  const session = { _id: "session", status: "in-progress", proctoringHeartbeat: { enabled: true, lastSeenAt: new Date(Date.now() - 20000), offline: false } };
  t.mock.method(InterviewSession, "findOne", () => ({ lean: async () => session }));
  t.mock.method(InterviewSession, "findOneAndUpdate", async (_query, update) => {
    assert.equal(update.$set["proctoringHeartbeat.lastSeenAt"], undefined);
    assert.equal(update.$set["proctoringHeartbeat.offline"], undefined);
    return session;
  });
  const res = responseStub();
  await recordProctoringHeartbeat({ params: { sessionId: "session" }, user: { userId: "candidate" }, body: { detectorHealthy: false } }, res);
  assert.equal(res.body.success, true);
});

test("event endpoint preserves enriched response contract and zero values", async (t) => {
  const session = { _id: "session", status: "in-progress", proctoringEvents: [] };
  t.mock.method(InterviewSession, "findOne", () => ({ then: (resolve, reject) => Promise.resolve(session).then(resolve, reject), lean: async () => session }));
  t.mock.method(InterviewSession, "findOneAndUpdate", async (query, update) => {
    assert.equal(query.userId, "candidate");
    return { ...session, proctoringSummary: update.$set.proctoringSummary };
  });
  t.mock.method(logger, "proctor", () => {});
  const res = responseStub();
  await recordProctoringEvent({ params: { sessionId: "session" }, user: { userId: "candidate" }, body: { eventType: "FACE_ABSENT", confidence: 0, faceCount: 0, durationMs: 4000, evidenceCount: 20, detectorVersion: "test", meta: { sampleCount: 20 } } }, res);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.event.faceCount, 0);
  assert.equal(res.body.data.event.confidence, 0);
  assert.equal(res.body.data.event.evidenceCount, 20);
  assert.equal(res.body.data.summary.flagCounts.absent, 1);
});

test("session and result schemas retain enriched evidence and new counters", () => {
  const evidence = normalizeProctoringEvent({ eventType: "IDENTITY_SWITCH", durationMs: 3500, evidenceCount: 14, faceCount: 1, detectorVersion: "test", meta: { source: "continuity" } });
  const session = new InterviewSession({ proctoringEvents: [evidence], proctoringSummary: scoreProctoringEvents([evidence]) });
  assert.equal(session.proctoringEvents[0].validateSync(), undefined);
  assert.equal(session.proctoringEvents[0].durationMs, 3500);
  assert.equal(session.proctoringSummary.flagCounts.identitySwitch, 1);
  const result = new InterviewResult({ proctoringAudit: { events: [evidence], flagCounts: { offline: 1, identitySwitch: 1 } } }).toObject();
  assert.equal(result.proctoringAudit.events[0].meta.source, "continuity");
  assert.equal(result.proctoringAudit.events[0].evidenceCount, 14);
  assert.equal(result.proctoringAudit.flagCounts.offline, 1);
});

export const EVENT_WEIGHTS = {
  PHONE_DETECTED: 15, MULTIPLE_FACES: 15, FACE_ABSENT: 8,
  GAZE_DEVIATION: 3, TAB_SWITCH: 5, WINDOW_BLUR: 4, PASTE_ATTEMPT: 5,
  IDENTITY_SWITCH: 18, PROCTORING_OFFLINE: 10,
};

export const nonNegative = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;

export function normalizeProctoringEvent(payload, now = new Date()) {
  return {
    eventType: payload.eventType,
    severity: payload.severity || "medium",
    confidence: Math.min(1, nonNegative(payload.confidence ?? 1, 1)),
    timestampSeconds: nonNegative(payload.timestampSeconds),
    durationMs: nonNegative(payload.durationMs),
    evidenceCount: Math.floor(nonNegative(payload.evidenceCount)),
    faceCount: payload.faceCount == null ? null : Math.floor(nonNegative(payload.faceCount)),
    detectorVersion: typeof payload.detectorVersion === "string" ? payload.detectorVersion.slice(0, 100) : "unknown",
    meta: payload.meta && typeof payload.meta === "object" && !Array.isArray(payload.meta) ? payload.meta : {},
    details: typeof payload.details === "string" ? payload.details : "",
    snapshotUrl: payload.snapshotUrl || null,
    createdAt: now,
  };
}

export function scoreProctoringEvents(events) {
  const flagCounts = { phone: 0, gaze: 0, multipleFaces: 0, absent: 0, tabSwitch: 0, identitySwitch: 0, offline: 0 };
  const countKey = { PHONE_DETECTED: "phone", MULTIPLE_FACES: "multipleFaces", FACE_ABSENT: "absent", GAZE_DEVIATION: "gaze", TAB_SWITCH: "tabSwitch", IDENTITY_SWITCH: "identitySwitch", PROCTORING_OFFLINE: "offline" };
  let penaltyPoints = 0;
  let sustainedMultipleFaces = false;
  for (const event of events) {
    if (countKey[event.eventType]) flagCounts[countKey[event.eventType]] += 1;
    const confidence = Math.min(1.4, Math.max(0.6, nonNegative(event.confidence ?? 1, 1) * 1.4));
    const duration = nonNegative(event.durationMs);
    // Legacy events without duration retain their original duration weight.
    const durationMultiplier = duration === 0 ? 1 : duration < 3000 ? 0.75 : duration < 8000 ? 1 : 1.5;
    penaltyPoints += (EVENT_WEIGHTS[event.eventType] || 0) * confidence * durationMultiplier;
    if (event.eventType === "MULTIPLE_FACES" && duration >= 2000 && (event.confidence ?? 1) >= 0.7) sustainedMultipleFaces = true;
  }
  const integrityScore = Math.max(0, Math.round(100 - penaltyPoints));
  let verdict = "VERIFIED_CLEAN";
  if (integrityScore < 70 || sustainedMultipleFaces || flagCounts.phone >= 2 || flagCounts.multipleFaces >= 2 || flagCounts.identitySwitch >= 3) {
    verdict = "FLAGGED_SUSPICIOUS";
  } else if (integrityScore < 85 || flagCounts.tabSwitch >= 2 || flagCounts.absent >= 2 || flagCounts.identitySwitch >= 2 || flagCounts.offline > 0) {
    verdict = "REVIEW_RECOMMENDED";
  }
  return { integrityScore, flagCounts, verdict };
}

export const HEARTBEAT_GRACE_MS = 60000;
export function offlineEventFor(session, now = new Date()) {
  const heartbeat = session.proctoringHeartbeat;
  if (session.status !== "in-progress" || !heartbeat?.enabled || heartbeat.offline || !heartbeat.lastSeenAt) return null;
  const durationMs = now - new Date(heartbeat.lastSeenAt);
  if (durationMs < HEARTBEAT_GRACE_MS) return null;
  return normalizeProctoringEvent({
    eventType: "PROCTORING_OFFLINE", severity: "high", confidence: 1,
    durationMs, detectorVersion: heartbeat.detectorVersion,
    timestampSeconds: Math.max(0, (now - new Date(session.startedAt || now)) / 1000),
    details: "Camera/detector heartbeat unavailable beyond the 60-second grace period",
    meta: { source: "server-watchdog" },
  }, now);
}

import InterviewSession from "../models/InterviewSession.model.js";
import { HEARTBEAT_GRACE_MS, offlineEventFor, scoreProctoringEvents } from "./proctoring-scoring.js";

// Compare-and-swap the event count so simultaneous heartbeat/event requests cannot
// lose evidence or overwrite the summary with a score from an older event list.
export async function appendProctoringEvent(sessionId, event, conditions = {}, extraSet = {}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const session = await InterviewSession.findOne({ _id: sessionId, status: "in-progress", ...conditions }).lean();
    if (!session) return null;
    const events = session.proctoringEvents || [];
    const updated = await InterviewSession.findOneAndUpdate({
      _id: sessionId, status: "in-progress", ...conditions,
      $expr: { $eq: [{ $size: { $ifNull: ["$proctoringEvents", []] } }, events.length] },
    }, {
      $push: { proctoringEvents: event },
      $set: { proctoringSummary: scoreProctoringEvents([...events, event]), ...extraSet },
    }, { new: true, runValidators: true });
    if (updated) return updated;
  }
  throw new Error("Proctoring evidence update contention; retry request");
}

export async function checkOfflineProctoring(session, now = new Date()) {
  const event = offlineEventFor(session, now);
  if (!event) return null;
  return appendProctoringEvent(session._id, event, {
    "proctoringHeartbeat.enabled": true,
    "proctoringHeartbeat.offline": { $ne: true },
    "proctoringHeartbeat.lastSeenAt": session.proctoringHeartbeat.lastSeenAt,
  }, { "proctoringHeartbeat.offline": true });
}

export function startProctoringWatchdog() {
  let checking = false;
  const timer = setInterval(async () => {
    if (checking) return;
    checking = true;
    try {
      const sessions = InterviewSession.find({
        status: "in-progress", "proctoringHeartbeat.enabled": true,
        "proctoringHeartbeat.offline": { $ne: true },
        "proctoringHeartbeat.lastSeenAt": { $lte: new Date(Date.now() - HEARTBEAT_GRACE_MS) },
      }).lean().cursor();
      for await (const session of sessions) await checkOfflineProctoring(session);
    } catch (error) {
      console.error("Proctoring watchdog failed:", error.message);
    } finally {
      checking = false;
    }
  }, 10000);
  timer.unref();
  return () => clearInterval(timer);
}

import InterviewSession from "../models/InterviewSession.model.js";
import { STATES, transitionTo } from "./interview-state.service.js";
import { purgeExpiredScreenFrames } from "./screen-share.service.js";

/**
 * Delete expired screen-share frames (files + DB references). Used by the daily
 * job and by scripts/purgeScreenFrames.js.
 */
export async function purgeScreenFrames(options) {
  const purged = await purgeExpiredScreenFrames(options);
  if (purged.length) {
    await InterviewSession.updateMany({ _id: { $in: purged } }, { $set: { "screenShare.frames": [] } });
    console.log(`🧹 Deleted screen frames of ${purged.length} interview session(s) past retention.`);
  }
  return purged;
}

/**
 * Sweeps the database for stale interview sessions and aborts them.
 * This prevents users from getting stuck in "in-progress" if they close the 
 * tab without proper pausing.
 */
export const startCleanupJob = () => {
  // Run every 10 minutes
  setInterval(async () => {
    try {
      console.log("🧹 Running interview session cleanup...");
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Abandon stale "in-progress" sessions older than 2 hours
      const staleSessions = await InterviewSession.find({
        status: STATES.IN_PROGRESS,
        updatedAt: { $lt: twoHoursAgo }
      });
      
      for (const session of staleSessions) {
        await transitionTo(session, STATES.ABANDONED, "Auto-abandoned due to timeout");
      }
      
      // Abandon stale "paused" sessions older than 7 days
      const ancientPausedSessions = await InterviewSession.find({
        status: STATES.PAUSED,
        updatedAt: { $lt: sevenDaysAgo }
      });
      
      for (const session of ancientPausedSessions) {
        await transitionTo(session, STATES.ABANDONED, "Auto-abandoned due to max pause duration exceeded");
      }
      
      if (staleSessions.length > 0 || ancientPausedSessions.length > 0) {
        console.log(`🧹 Cleanup complete: Abandoned ${staleSessions.length} stale sessions and ${ancientPausedSessions.length} expired paused sessions.`);
      }
    } catch (error) {
      console.error("❌ Error in interview session cleanup job:", error);
    }
  }, 10 * 60 * 1000);

  // Screen-share frames: retention sweep shortly after start, then daily.
  const runPurge = () => purgeScreenFrames().catch((error) => console.error("❌ Screen frame purge failed:", error.message));
  setTimeout(runPurge, 60 * 1000);
  setInterval(runPurge, 24 * 60 * 60 * 1000);
};
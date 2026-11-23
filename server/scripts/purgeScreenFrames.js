/**
 * Delete interview screen-share frames older than the retention period.
 * The server also runs this daily; use the script for a manual sweep.
 *
 *   node scripts/purgeScreenFrames.js            # SCREEN_FRAME_RETENTION_DAYS (default 30)
 *   node scripts/purgeScreenFrames.js --days=7
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { purgeScreenFrames } = await import("../services/interview-cleanup.service.js");

const daysArg = Number(process.argv.find((arg) => arg.startsWith("--days="))?.split("=")[1]);

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const purged = await purgeScreenFrames(Number.isFinite(daysArg) && daysArg > 0 ? { days: daysArg } : undefined);
  console.log(`Done. ${purged.length} session folder(s) deleted.`);
} catch (error) {
  console.error("Screen frame purge failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

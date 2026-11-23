/**
 * Screen sharing for proctored interviews (docs/interview-security-plan.md, S1.5).
 *
 * Frames are small periodic/away screenshots of the candidate's shared screen.
 * They can contain personal content (notifications, chat previews), so they live
 * outside the public `/uploads` static folder and are served only through an
 * authenticated route, then deleted after SCREEN_FRAME_RETENTION_DAYS.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  MAX_SCREEN_FRAME_BYTES,
  MAX_SCREEN_FRAMES,
  SCREEN_FRAME_MIN_INTERVAL_MS,
  SCREEN_FRAME_REASONS,
  SCREEN_SHARE_OK,
  SCREEN_SHARE_STATUSES,
} from "./proctoring-events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolved on each call so tests and deployments can point SCREEN_FRAMES_DIR elsewhere.
export const screenFramesRoot = () => process.env.SCREEN_FRAMES_DIR ||
  path.join(__dirname, "..", "storage", "screen-frames");

export const screenFrameRetentionDays = () => {
  const days = Number(process.env.SCREEN_FRAME_RETENTION_DAYS);
  return Number.isFinite(days) && days > 0 ? days : 30;
};

/**
 * Screen-share policy for a new session. `required` is not client-controlled:
 * TPO-assigned assessments will set it; self-chosen proctored practice never does.
 *
 * @returns {{ ok: true, screenShare: object } | { ok: false, error: string }}
 */
export function resolveScreenSharePolicy({ level, screenShare, required = false }) {
  if (level !== "proctored") return { ok: true, screenShare: { required: false, status: "off" } };
  const status = SCREEN_SHARE_STATUSES.includes(screenShare?.status) ? screenShare.status : "unavailable";
  if (required && !SCREEN_SHARE_OK.has(status)) {
    return { ok: false, error: "This assessment requires sharing your entire screen. Use Chrome or Edge on a computer and share the entire screen." };
  }
  return {
    ok: true,
    screenShare: {
      required: Boolean(required),
      status,
      startedAt: SCREEN_SHARE_OK.has(status) || ["window", "browser"].includes(status) ? new Date() : undefined,
      stoppedMsTotal: 0,
      frames: [],
    },
  };
}

const DATA_URL = /^data:image\/(webp|jpeg);base64,([A-Za-z0-9+/=]+)$/;

/**
 * Validate an uploaded frame against the session. Pure: no I/O.
 * @returns {{ ok: true, buffer: Buffer, ext: string, reason: string, timestampSeconds: number } | { ok: false, status: number, error: string }}
 */
export function validateScreenFrame({ session, imageData, reason, timestampSeconds, lastFrameAt, now = Date.now() }) {
  if (session.status !== "in-progress") return { ok: false, status: 409, error: "Screen frames require an active session" };
  if (session.proctoringLevel !== "proctored") return { ok: false, status: 400, error: "Screen frames are only collected in proctored mode" };
  if ((session.screenShare?.frames?.length || 0) >= MAX_SCREEN_FRAMES) return { ok: false, status: 409, error: "Screen frame limit reached" };
  if (lastFrameAt && now - lastFrameAt < SCREEN_FRAME_MIN_INTERVAL_MS) return { ok: false, status: 429, error: "Screen frames are sent too often" };
  const match = typeof imageData === "string" ? imageData.match(DATA_URL) : null;
  if (!match) return { ok: false, status: 400, error: "Screen frame must be a webp or jpeg image" };
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_SCREEN_FRAME_BYTES) return { ok: false, status: 413, error: "Screen frame is too large" };
  return {
    ok: true,
    buffer,
    ext: match[1] === "jpeg" ? "jpg" : "webp",
    reason: SCREEN_FRAME_REASONS.includes(reason) ? reason : "periodic",
    timestampSeconds: Math.max(0, Number(timestampSeconds) || 0),
  };
}

// Last accepted frame per session (rate limit). One process; good enough for a soft cap.
const lastFrameAtBySession = new Map();
export const getLastFrameAt = (sessionId) => lastFrameAtBySession.get(String(sessionId));
export const markFrameAccepted = (sessionId, at = Date.now()) => {
  lastFrameAtBySession.set(String(sessionId), at);
  if (lastFrameAtBySession.size > 5000) lastFrameAtBySession.delete(lastFrameAtBySession.keys().next().value);
};

const sessionDir = (sessionId, root = screenFramesRoot()) => {
  if (!/^[a-f0-9]{24}$/i.test(String(sessionId))) throw new Error("Invalid session id");
  return path.join(root, String(sessionId));
};

export async function writeScreenFrame(sessionId, buffer, ext, root = screenFramesRoot()) {
  const dir = sessionDir(sessionId, root);
  await fs.promises.mkdir(dir, { recursive: true });
  const file = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  await fs.promises.writeFile(path.join(dir, file), buffer);
  return file;
}

/** Absolute path of a stored frame, or null if the name is not one we wrote. */
export function screenFramePath(sessionId, file, root = screenFramesRoot()) {
  if (typeof file !== "string" || !/^\d+-[a-f0-9]{8}\.(webp|jpg)$/.test(file)) return null;
  return path.join(sessionDir(sessionId, root), file);
}

export async function deleteSessionScreenFrames(sessionId, root = screenFramesRoot()) {
  await fs.promises.rm(sessionDir(sessionId, root), { recursive: true, force: true });
}

/**
 * Delete frame folders whose newest file is older than the retention period.
 * @returns {Promise<string[]>} session ids whose frames were deleted
 */
export async function purgeExpiredScreenFrames({ root = screenFramesRoot(), days = screenFrameRetentionDays(), now = Date.now() } = {}) {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  let entries = [];
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const purged = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-f0-9]{24}$/i.test(entry.name)) continue;
    const dir = path.join(root, entry.name);
    const stat = await fs.promises.stat(dir);
    if (stat.mtimeMs < cutoff) {
      await fs.promises.rm(dir, { recursive: true, force: true });
      purged.push(entry.name);
    }
  }
  return purged;
}

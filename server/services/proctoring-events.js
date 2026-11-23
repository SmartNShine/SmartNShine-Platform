/**
 * Proctoring event catalog — the single source of truth for event types.
 * The InterviewSession enum, scoring weights and request validation are all
 * derived from this list (see docs/interview-security-plan.md §7).
 *
 * family:   vision | audio | env | server
 * levels:   proctoring levels in which the client is expected to emit the event
 * weight:   integrity penalty per event before confidence/duration multipliers
 * label:    reviewer-facing name
 */
export const PROCTORING_LEVELS = ["practice", "proctored"];

const BOTH = PROCTORING_LEVELS;
const PROCTORED = ["proctored"];

export const PROCTORING_EVENTS = {
  // Vision
  PHONE_DETECTED: { family: "vision", levels: BOTH, severity: "high", weight: 15, label: "Phone in view" },
  MULTIPLE_FACES: { family: "vision", levels: BOTH, severity: "high", weight: 15, label: "Another person in view" },
  FACE_ABSENT: { family: "vision", levels: BOTH, severity: "medium", weight: 8, label: "Candidate not visible" },
  IDENTITY_SWITCH: { family: "vision", levels: BOTH, severity: "high", weight: 18, label: "Candidate continuity changed" },
  GAZE_DEVIATION: { family: "vision", levels: BOTH, severity: "low", weight: 3, label: "Looking away from screen" },

  // Browser / environment
  TAB_SWITCH: { family: "env", levels: BOTH, severity: "medium", weight: 5, label: "Left the interview tab" },
  WINDOW_BLUR: { family: "env", levels: BOTH, severity: "low", weight: 4, label: "Interview window lost focus" },
  PASTE_ATTEMPT: { family: "env", levels: BOTH, severity: "medium", weight: 5, label: "Pasted text" },
  COPY_ATTEMPT: { family: "env", levels: BOTH, severity: "low", weight: 2, label: "Copied question text" },
  FULLSCREEN_EXIT: { family: "env", levels: PROCTORED, severity: "medium", weight: 5, label: "Left fullscreen" },
  MULTI_SCREEN: { family: "env", levels: BOTH, severity: "medium", weight: 8, label: "Extra display connected" },
  VIRTUAL_DEVICE: { family: "env", levels: BOTH, severity: "high", weight: 20, label: "Virtual camera or microphone" },
  MULTI_SESSION: { family: "env", levels: BOTH, severity: "medium", weight: 6, label: "Interview open in another tab" },
  WINDOW_RESIZE: { family: "env", levels: PROCTORED, severity: "low", weight: 2, label: "Interview window shrunk" },
  SCREEN_SHARE_UNAVAILABLE: { family: "env", levels: PROCTORED, severity: "medium", weight: 4, label: "Screen not shared" },
  SCREEN_SHARE_PARTIAL: { family: "env", levels: PROCTORED, severity: "low", weight: 3, label: "Shared a window, not the whole screen" },
  SCREEN_SHARE_STOPPED: { family: "env", levels: PROCTORED, severity: "medium", weight: 6, label: "Stopped sharing the screen" },

  // Server-side
  TIMING_ANOMALY: { family: "server", levels: BOTH, severity: "medium", weight: 8, label: "Answer took longer than allowed" },
  PROCTORING_OFFLINE: { family: "server", levels: BOTH, severity: "high", weight: 10, label: "Proctoring offline" },
};

export const PROCTORING_EVENT_TYPES = Object.keys(PROCTORING_EVENTS);

// Screen sharing (security plan S1.5).
// monitor/window/browser: displaySurface reported by the browser · unknown: shared,
// surface not reported (non-Chromium) · unavailable: API missing or blocked ·
// declined: picker cancelled · off: not requested (practice) or never started.
export const SCREEN_SHARE_STATUSES = ["monitor", "window", "browser", "unknown", "unavailable", "declined", "off"];
export const SCREEN_SHARE_OK = new Set(["monitor", "unknown"]);
export const SCREEN_FRAME_REASONS = ["periodic", "tab_hidden", "window_blur", "share_resumed"];
export const MAX_SCREEN_FRAMES = 400;
export const MAX_SCREEN_FRAME_BYTES = 250 * 1024;
export const SCREEN_FRAME_MIN_INTERVAL_MS = 4000;

export const EVENT_WEIGHTS = Object.fromEntries(
  PROCTORING_EVENT_TYPES.map((type) => [type, PROCTORING_EVENTS[type].weight])
);

export const isKnownEventType = (type) => Object.hasOwn(PROCTORING_EVENTS, type);

export const normalizeProctoringLevel = (level) => (PROCTORING_LEVELS.includes(level) ? level : "practice");

// Client-supplied meta is evidence context, not storage: keep it small and flat.
const MAX_META_BYTES = 2048;
export function sanitizeEventMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const flat = {};
  for (const [key, value] of Object.entries(meta).slice(0, 20)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value) || value === null) {
      flat[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
  }
  return JSON.stringify(flat).length <= MAX_META_BYTES ? flat : {};
}

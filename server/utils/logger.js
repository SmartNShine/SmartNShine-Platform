import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, "..", "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per log file
const MAX_BACKUP_FILES = 3;
const IN_MEMORY_BUFFER_SIZE = 500;

// In-memory circular buffer for instant fast retrieval via API and AI agent inspection
const memoryBuffer = [];

function pushToMemoryBuffer(entry) {
  memoryBuffer.push(entry);
  if (memoryBuffer.length > IN_MEMORY_BUFFER_SIZE) {
    memoryBuffer.shift();
  }
}

// Log file rotation
function rotateLogIfNeeded(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    if (stats.size >= MAX_LOG_SIZE_BYTES) {
      for (let i = MAX_BACKUP_FILES - 1; i >= 1; i--) {
        const older = `${filePath}.${i}`;
        const newer = `${filePath}.${i + 1}`;
        if (fs.existsSync(older)) {
          fs.renameSync(older, newer);
        }
      }
      fs.renameSync(filePath, `${filePath}.1`);
    }
  } catch (err) {
    console.error("Log rotation error:", err.message);
  }
}

// File append helper
function appendToFile(filename, line) {
  try {
    const fullPath = path.join(LOGS_DIR, filename);
    rotateLogIfNeeded(fullPath);
    fs.appendFileSync(fullPath, line + "\n", "utf8");
  } catch (err) {
    console.error(`Failed writing to ${filename}:`, err.message);
  }
}

const ANSI_COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

/**
 * Format entry for storage and console
 */
function createLogEntry(level, tag, message, meta = {}) {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    tag,
    message,
    meta: Object.keys(meta).length ? meta : undefined,
  };
}

class UnifiedLogger {
  constructor() {
    this.logsDir = LOGS_DIR;
  }

  formatConsoleLine(entry) {
    const { timestamp, level, tag, message, meta } = entry;
    const timeStr = timestamp.substring(11, 19);

    let levelColor = ANSI_COLORS.blue;
    let icon = "ℹ️";

    if (level === "WARN") {
      levelColor = ANSI_COLORS.yellow;
      icon = "⚠️";
    } else if (level === "ERROR") {
      levelColor = ANSI_COLORS.red;
      icon = "❌";
    } else if (level === "INTERVIEW") {
      levelColor = ANSI_COLORS.magenta;
      icon = "🎙️";
    } else if (level === "PROCTOR") {
      levelColor = ANSI_COLORS.cyan;
      icon = "🛡️";
    }

    const tagStr = tag ? `[${tag}] ` : "";
    const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ANSI_COLORS.dim}${timeStr}${ANSI_COLORS.reset} ${icon} ${levelColor}[${level}]${ANSI_COLORS.reset} ${tagStr}${message}${metaStr}`;
  }

  writeEntry(entry, destFiles = ["app.log"]) {
    pushToMemoryBuffer(entry);

    const logLine = JSON.stringify(entry);
    for (const f of destFiles) {
      appendToFile(f, logLine);
    }

    // Always output to console for local dev observability
    const consoleLine = this.formatConsoleLine(entry);
    if (entry.level === "ERROR") {
      console.error(consoleLine);
    } else if (entry.level === "WARN") {
      console.warn(consoleLine);
    } else {
      console.log(consoleLine);
    }
  }

  info(message, meta = {}, tag = "SERVER") {
    const entry = createLogEntry("INFO", tag, message, meta);
    this.writeEntry(entry, ["app.log"]);
  }

  warn(message, meta = {}, tag = "SERVER") {
    const entry = createLogEntry("WARN", tag, message, meta);
    this.writeEntry(entry, ["app.log"]);
  }

  error(message, error = null, meta = {}, tag = "SERVER") {
    const errMeta = {
      ...meta,
      ...(error
        ? {
            errorMessage: error.message || String(error),
            stack: error.stack,
            code: error.code,
          }
        : {}),
    };
    const entry = createLogEntry("ERROR", tag, message, errMeta);
    this.writeEntry(entry, ["app.log", "error.log"]);
  }

  debug(message, meta = {}, tag = "SERVER") {
    if (process.env.NODE_ENV === "production" && !process.env.DEBUG) return;
    const entry = createLogEntry("DEBUG", tag, message, meta);
    this.writeEntry(entry, ["app.log"]);
  }

  /**
   * Dedicated AI Mock Interview turn & voice pipeline logging
   */
  interview(sessionId, stage, message, meta = {}) {
    const entry = createLogEntry("INTERVIEW", `Session:${sessionId || "unknown"}:${stage}`, message, {
      sessionId,
      stage,
      ...meta,
    });
    this.writeEntry(entry, ["app.log", "interview.log"]);
  }

  /**
   * Dedicated Real-Time Anti-Cheat & Video Proctoring logging
   */
  proctor(sessionId, eventType, details, meta = {}) {
    const entry = createLogEntry("PROCTOR", `Session:${sessionId || "unknown"}:${eventType}`, details, {
      sessionId,
      eventType,
      ...meta,
    });
    this.writeEntry(entry, ["app.log", "interview.log"]);
  }

  /**
   * Receive and log client-side browser telemetry
   */
  client(level, tag, message, meta = {}) {
    const normLevel = (level || "INFO").toUpperCase();
    const entry = createLogEntry(normLevel, `CLIENT:${tag || "BROWSER"}`, message, meta);
    const dests = ["app.log"];
    if (normLevel === "ERROR") dests.push("error.log");
    if (meta.sessionId) dests.push("interview.log");
    this.writeEntry(entry, dests);
  }

  /**
   * Query recent logs from memory or disk
   */
  getRecentLogs({ level, sessionId, limit = 100, stream = "memory" } = {}) {
    let entries = [];

    if (stream === "interview") {
      entries = this.readLogFileLines("interview.log", limit * 2);
    } else if (stream === "error") {
      entries = this.readLogFileLines("error.log", limit * 2);
    } else if (stream === "app") {
      entries = this.readLogFileLines("app.log", limit * 2);
    } else {
      // Memory buffer default
      entries = [...memoryBuffer];
    }

    if (level) {
      const upLevel = level.toUpperCase();
      entries = entries.filter((e) => e.level === upLevel);
    }

    if (sessionId) {
      entries = entries.filter(
        (e) =>
          e.meta?.sessionId === sessionId ||
          e.tag?.includes(sessionId) ||
          e.message?.includes(sessionId)
      );
    }

    return entries.slice(-limit);
  }

  readLogFileLines(filename, maxLines = 200) {
    try {
      const fullPath = path.join(LOGS_DIR, filename);
      if (!fs.existsSync(fullPath)) return [];
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.trim().split("\n").filter(Boolean);
      const recent = lines.slice(-maxLines);
      return recent
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch (_) {
            return { message: l, raw: true };
          }
        })
        .filter(Boolean);
    } catch (err) {
      console.warn(`Could not read log file ${filename}:`, err.message);
      return [];
    }
  }

  clearLogs() {
    try {
      memoryBuffer.length = 0;
      const files = ["app.log", "error.log", "interview.log"];
      for (const f of files) {
        const fullPath = path.join(LOGS_DIR, f);
        if (fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, "", "utf8");
        }
      }
      return true;
    } catch (err) {
      console.error("Could not clear logs:", err.message);
      return false;
    }
  }
}

export const logger = new UnifiedLogger();
export default logger;

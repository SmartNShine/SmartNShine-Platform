import logger from "./logger";

/**
 * Client-to-Server Remote Telemetry & Observability Logger
 * Automatically transmits browser errors, vision model failures,
 * and audio/speech recognition events to the backend log files
 */

class RemoteLogger {
  constructor() {
    this.queue = [];
    this.flushTimeout = null;
    this.isFlushing = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    // Listen for uncaught browser errors
    window.addEventListener("error", (event) => {
      this.error("UNCAUGHT_EXCEPTION", event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Listen for unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      this.error(
        "UNHANDLED_PROMISE",
        reason?.message || String(reason),
        {
          stack: reason?.stack,
        }
      );
    });
  }

  log(level, tag, message, meta = {}) {
    // 1. Console in dev
    if (level === "ERROR") {
      logger.error(`[${tag}]`, message, meta);
    } else if (level === "WARN") {
      logger.warn(`[${tag}]`, message, meta);
    } else {
      logger.log(`[${tag}]`, message, meta);
    }

    // 2. Queue for server transmission
    this.queue.push({
      level,
      tag,
      message,
      meta: {
        ...meta,
        clientTimestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.pathname : "",
      },
    });

    // Immediate flush for errors, debounced (3s) for info/warn
    if (level === "ERROR") {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  info(tag, message, meta = {}) {
    this.log("INFO", tag, message, meta);
  }

  warn(tag, message, meta = {}) {
    this.log("WARN", tag, message, meta);
  }

  error(tag, message, meta = {}) {
    this.log("ERROR", tag, message, meta);
  }

  interview(sessionId, stage, message, meta = {}) {
    this.log("INFO", `INTERVIEW:${stage}`, message, { sessionId, ...meta });
  }

  proctor(sessionId, eventType, details, meta = {}) {
    this.log("WARN", `PROCTOR:${eventType}`, details, { sessionId, ...meta });
  }

  scheduleFlush() {
    if (this.flushTimeout) return;
    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flush();
    }, 3000);
  }

  async flush() {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    const itemsToSend = [...this.queue];
    this.queue = [];

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("token");

      for (const item of itemsToSend) {
        await fetch(`${baseUrl}/logs/client`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(item),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (_) {
      // Avoid recursive error loops
    } finally {
      this.isFlushing = false;
    }
  }
}

export const remoteLogger = new RemoteLogger();
if (typeof window !== "undefined") {
  remoteLogger.init();
}

export default remoteLogger;

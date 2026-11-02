import logger from "../utils/logger.js";

/**
 * Log Controller
 * Ingests client-side browser telemetry & exposes admin log queries
 */

/**
 * Receive client-side error or telemetry event
 * POST /api/logs/client
 */
export const ingestClientLog = async (req, res) => {
  try {
    const { level = "INFO", tag = "CLIENT", message = "", meta = {} } = req.body || {};

    if (!message && !meta.details && !meta.error) {
      return res.status(400).json({ success: false, error: "Log message required" });
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    logger.client(level, tag, message, {
      ...meta,
      clientIp,
      userAgent: userAgent ? userAgent.substring(0, 100) : undefined,
      userId: req.user?.userId || req.user?._id || meta.userId,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Fetch logs for Admin Dashboard and AI Agent diagnostics
 * GET /api/admin/logs
 */
export const getSystemLogs = async (req, res) => {
  try {
    const { level, sessionId, limit = 100, stream = "memory" } = req.query;

    const parsedLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));

    const logs = logger.getRecentLogs({
      level,
      sessionId,
      limit: parsedLimit,
      stream,
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      stream,
      data: logs,
    });
  } catch (err) {
    logger.error("Failed to query system logs", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Clear logs (Admin only)
 * DELETE /api/admin/logs
 */
export const clearSystemLogs = async (req, res) => {
  try {
    const cleared = logger.clearLogs();
    logger.info("System logs cleared by admin", { adminId: req.user?.userId || req.user?._id });
    return res.status(200).json({ success: cleared });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

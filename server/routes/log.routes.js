import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {
  ingestClientLog,
  getSystemLogs,
  clearSystemLogs,
} from "../controllers/log.controller.js";

const router = express.Router();

/**
 * Ingest client-side errors and proctoring telemetry
 * POST /api/logs/client
 */
router.post("/client", ingestClientLog);

/**
 * Fetch system logs (Admin / Agent diagnostic endpoint)
 * GET /api/logs/admin
 */
router.get("/admin", authenticateToken, isAdmin, getSystemLogs);

/**
 * Clear system logs (Admin only)
 * DELETE /api/logs/admin
 */
router.delete("/admin", authenticateToken, isAdmin, clearSystemLogs);

export default router;

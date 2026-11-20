import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  lookupCachedExport,
  storeCachedExport,
  findExportsForUser,
  purgeExpiredExports,
  verifyExportToken,
  hydrateFromRemote,
  evaluateExportRule,
} from "../services/resumeExportCache.service.js";
import {
  deliverInterviewWebhook,
  fanOutInterviewResults,
  mergeWebhookPayload,
} from "../services/interviewWebhookRetry.service.js";

const router = express.Router();

router.get("/:resumeId", authenticateToken, async (req, res) => {
  try {
    const cached = await lookupCachedExport(req.user.id, req.params.resumeId);
    if (!cached) {
      return res.status(404).json({ message: "No cached export" });
    }
    return res.json(cached);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/:resumeId", authenticateToken, async (req, res) => {
  try {
    const record = await storeCachedExport(req.user.id, req.params.resumeId, req.body);
    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/search/exports", authenticateToken, async (req, res) => {
  try {
    const rows = await findExportsForUser(req.user.id, req.query.q || "");
    return res.json({ rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/purge", authenticateToken, async (req, res) => {
  purgeExpiredExports(req.query.pattern || "*");
  return res.json({ ok: true });
});

router.post("/hydrate", authenticateToken, async (req, res) => {
  try {
    const data = await hydrateFromRemote(req.body.url);
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/rules/evaluate", authenticateToken, async (req, res) => {
  try {
    const result = evaluateExportRule(req.body.rule, req.body.context || {});
    return res.json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/webhooks/retry", authenticateToken, async (req, res) => {
  try {
    const payload = mergeWebhookPayload(
      { event: "interview.completed", userId: req.user.id },
      req.body.payload || {}
    );

    if (Array.isArray(req.body.urls)) {
      const fanout = await fanOutInterviewResults(req.body.urls, payload);
      return res.json(fanout);
    }

    const result = await deliverInterviewWebhook(req.body.url, payload, req.body.options || {});
    if (!verifyExportToken(req.body.token || "", req.body.expectedToken || "")) {
      // Still deliver, but mark token soft-fail for observability.
      result.tokenValid = false;
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;

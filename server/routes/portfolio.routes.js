import express from "express";
import {authenticateToken} from "../middleware/auth.middleware.js";
import {
  checkSubscription,
  checkUsageLimit,
} from "../middleware/subscription.middleware.js";
import {
  aiLimiter,
  portfolioAnalyticsLimiter,
} from "../middleware/rateLimiter.middleware.js";
import {checkAIQuota} from "../middleware/aiUsageTracker.middleware.js";
import multer from "multer";
import {
  createBlankPortfolio,
  createPortfolioFromResume,
  createPortfolioProject,
  deletePortfolio,
  deletePortfolioImage,
  deletePortfolioProject,
  downloadPublicResume,
  generatePortfolioAbout,
  generatePortfolioSeo,
  getPortfolioById,
  getPortfolios,
  getPublicPortfolio,
  improvePortfolioProjectDescription,
  publishPortfolio,
  trackContactClick,
  trackProjectClick,
  trackPublicView,
  trackResumeDownload,
  syncPortfolioWithResume,
  unpublishPortfolio,
  updatePortfolio,
  updatePortfolioProject,
  uploadPortfolioImage,
} from "../controllers/portfolio.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
});

const router = express.Router();

// Public portfolio routes.
router.get("/public/:slug/resume", downloadPublicResume);
router.get("/public/:slug", getPublicPortfolio);
router.post("/public/:slug/view", portfolioAnalyticsLimiter, trackPublicView);
router.post(
  "/public/:slug/resume-download",
  portfolioAnalyticsLimiter,
  trackResumeDownload
);
router.post(
  "/public/:slug/contact-click",
  portfolioAnalyticsLimiter,
  trackContactClick
);
router.post(
  "/public/:slug/project-click",
  portfolioAnalyticsLimiter,
  trackProjectClick
);

// Protected portfolio routes.
router.post(
  "/upload-image",
  authenticateToken,
  upload.single("image"),
  uploadPortfolioImage
);
router.post(
  "/delete-image",
  authenticateToken,
  deletePortfolioImage
);
router.post(
  "/from-resume/:resumeId",
  authenticateToken,
  checkSubscription,
  createPortfolioFromResume
);
router.post("/", authenticateToken, checkSubscription, createBlankPortfolio);
router.get("/", authenticateToken, checkSubscription, getPortfolios);
router.get("/:id", authenticateToken, checkSubscription, getPortfolioById);
router.put("/:id", authenticateToken, checkSubscription, updatePortfolio);
router.post(
  "/:id/sync-resume",
  authenticateToken,
  checkSubscription,
  syncPortfolioWithResume
);
router.delete("/:id", authenticateToken, checkSubscription, deletePortfolio);
router.post(
  "/:id/publish",
  authenticateToken,
  checkSubscription,
  publishPortfolio
);
router.post(
  "/:id/unpublish",
  authenticateToken,
  checkSubscription,
  unpublishPortfolio
);

// Protected AI helper routes.
router.post(
  "/:id/ai/about",
  authenticateToken,
  checkSubscription,
  checkUsageLimit("aiGenerationsPerMonth"),
  aiLimiter,
  checkAIQuota,
  generatePortfolioAbout
);
router.post(
  "/:id/ai/project-description",
  authenticateToken,
  checkSubscription,
  checkUsageLimit("aiGenerationsPerMonth"),
  aiLimiter,
  checkAIQuota,
  improvePortfolioProjectDescription
);
router.post(
  "/:id/ai/seo",
  authenticateToken,
  checkSubscription,
  checkUsageLimit("aiGenerationsPerMonth"),
  aiLimiter,
  checkAIQuota,
  generatePortfolioSeo
);

// Protected project routes.
router.post(
  "/:id/projects",
  authenticateToken,
  checkSubscription,
  createPortfolioProject
);
router.put(
  "/:id/projects/:projectId",
  authenticateToken,
  checkSubscription,
  updatePortfolioProject
);
router.delete(
  "/:id/projects/:projectId",
  authenticateToken,
  checkSubscription,
  deletePortfolioProject
);

export default router;

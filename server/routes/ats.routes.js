import express from "express";
import multer from "multer";
import {
  analyzeResume,
  calculateMatchScore,
  analyzeSkills,
} from "../controllers/ats.controller.js";
import {authenticateToken} from "../middleware/auth.middleware.js";
import {
  aiLimiter,
  uploadLimiter,
} from "../middleware/rateLimiter.middleware.js";
import {checkAIQuota} from "../middleware/aiUsageTracker.middleware.js";
import {validateATSAnalysis} from "../middleware/validation.middleware.js";

const router = express.Router();

// Configure multer for file upload (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

// Analyze resume against job description (AI-powered + file upload + quota check)
router.post(
  "/analyze-resume",
  authenticateToken,
  uploadLimiter, // Limit file uploads
  aiLimiter, // Limit AI usage
  checkAIQuota, // Check AI quota
  upload.single("resumeFile"),
  analyzeResume
);

// Calculate match score between resume data and job description
router.post(
  "/match-score",
  authenticateToken,
  aiLimiter,
  checkAIQuota,
  calculateMatchScore
);

// Analyze skills from resume data
router.post(
  "/analyze-skills",
  authenticateToken,
  aiLimiter,
  checkAIQuota,
  analyzeSkills
);

export default router;

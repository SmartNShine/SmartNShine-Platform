import express from "express";
import passport from "../config/passport.config.js";
import jwt from "jsonwebtoken";
import {getSafeClientRedirectUrl} from "../utils/oauthRedirect.js";
import {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import {authenticateToken} from "../middleware/auth.middleware.js";
import {authLimiter} from "../middleware/rateLimiter.middleware.js";
import {
  validateRegister,
  validateLogin,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// OAuth configuration status endpoint
router.get("/oauth-status", (req, res) => {
  const googleConfigured =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes("PLACEHOLDER");

  const githubConfigured =
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    !process.env.GITHUB_CLIENT_ID.includes("PLACEHOLDER");

  res.json({
    google: googleConfigured,
    github: githubConfigured,
  });
});

// Public routes with rate limiting and validation for security
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);

// Password reset routes (public with rate limiting)
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

// Check if Google OAuth is configured
const isGoogleConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes("PLACEHOLDER");

// Initiate Google OAuth
router.get("/google", (req, res, next) => {
  if (!isGoogleConfigured) {
    return res.status(503).json({
      error: "Google OAuth is not configured on this server",
      message:
        "Please contact the administrator to enable Google authentication",
    });
  }
  const origin = req.query.origin || req.headers.referer;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: origin ? encodeURIComponent(origin) : undefined,
  })(req, res, next);
});

// Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    const clientUrl = getSafeClientRedirectUrl(req);
    if (!isGoogleConfigured) {
      return res.redirect(
        `${clientUrl}/login?error=google_not_configured`
      );
    }
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${clientUrl}/login?error=google_auth_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const clientUrl = getSafeClientRedirectUrl(req);
    try {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: req.user._id,
          email: req.user.email,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
      );

      // Redirect to frontend with token
      res.redirect(
        `${clientUrl}/auth/callback?token=${token}&provider=google`
      );
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(
        `${clientUrl}/login?error=token_generation_failed`
      );
    }
  }
);

// ==========================================
// GITHUB OAUTH ROUTES
// ==========================================

// Check if GitHub OAuth is configured
const isGitHubConfigured =
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  !process.env.GITHUB_CLIENT_ID.includes("PLACEHOLDER");

// Initiate GitHub OAuth
router.get("/github", (req, res, next) => {
  if (!isGitHubConfigured) {
    return res.status(503).json({
      error: "GitHub OAuth is not configured on this server",
      message:
        "Please contact the administrator to enable GitHub authentication",
    });
  }
  const origin = req.query.origin || req.headers.referer;
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
    state: origin ? encodeURIComponent(origin) : undefined,
  })(req, res, next);
});

// GitHub OAuth callback
router.get(
  "/github/callback",
  (req, res, next) => {
    const clientUrl = getSafeClientRedirectUrl(req);
    if (!isGitHubConfigured) {
      return res.redirect(
        `${clientUrl}/login?error=github_not_configured`
      );
    }
    passport.authenticate("github", {
      session: false,
      failureRedirect: `${clientUrl}/login?error=github_auth_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const clientUrl = getSafeClientRedirectUrl(req);
    try {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: req.user._id,
          email: req.user.email,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
      );

      // Redirect to frontend with token
      res.redirect(
        `${clientUrl}/auth/callback?token=${token}&provider=github`
      );
    } catch (error) {
      console.error("GitHub callback error:", error);
      res.redirect(
        `${clientUrl}/login?error=token_generation_failed`
      );
    }
  }
);

// Protected routes
router.get("/me", authenticateToken, getCurrentUser);

export default router;

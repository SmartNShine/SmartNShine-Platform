import dotenv from "dotenv";
import path from "path";
import {fileURLToPath} from "url";

// Load environment variables immediately before any other module evaluation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.join(__dirname, ".env"), override: true});
dotenv.config({override: true}); // fallback to root .env if present

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Windows querySrv ECONNREFUSED with MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // fallback if custom DNS setting is restricted
}
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import passport from "./config/passport.config.js";
import resumeRoutes from "./routes/resume.routes.js";
import authRoutes from "./routes/auth.routes.js";
import githubRoutes from "./routes/github.routes.js";
import atsRoutes from "./routes/ats.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import jobsRoutes from "./routes/jobs.js";
import voiceRoutes from "./routes/voice.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import {handleWebhook as handleSubscriptionWebhook} from "./controllers/subscription.controller.js";
import interviewRoutes from "./routes/interview.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import careerRoutes from "./routes/career.routes.js";
import careerApplicationRoutes from "./routes/careerApplication.routes.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";
import logRoutes from "./routes/log.routes.js";
import Template from "./models/Template.model.js";
import Portfolio from "./models/Portfolio.model.js";
import Settings from "./models/Settings.model.js";
import {apiLimiter} from "./middleware/rateLimiter.middleware.js";
import {
  securityHeaders,
  additionalSecurityHeaders,
  corsOptions,
  securityLogger,
} from "./middleware/security.middleware.js";
import {notifySystemError} from "./services/adminNotification.service.js";

// =========================================
// ENVIRONMENT VALIDATION
// =========================================

// Validate critical environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((envVar) => {
    console.error(`   - ${envVar}`);
  });
  console.error("\n💡 Please check your .env file");
  process.exit(1);
}

// Validate OPENAI_API_KEY format
if (process.env.OPENAI_API_KEY) {
  const apiKey = process.env.OPENAI_API_KEY.trim();
  if (apiKey.length < 20) {
    console.error("❌ OPENAI_API_KEY appears to be invalid (too short)");
  } else {
    console.log(
      `✅ OPENAI_API_KEY is present (${apiKey.substring(
        0,
        7
      )}...${apiKey.substring(apiKey.length - 4)})`
    );
  }
} else {
  console.warn("⚠️  OPENAI_API_KEY not configured - set OPENAI_API_KEY in .env");
}

// Warn about optional OAuth variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "⚠️  Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
  );
}
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn(
    "⚠️  GitHub OAuth not configured - set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
  );
}

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// TRUST PROXY (Must be set first for reverse proxies)
// ==========================================

// Enable trust proxy for apps behind reverse proxies (Nginx, Vercel, Cloudflare, etc.)
// This allows Express to correctly read X-Forwarded-* headers
app.set("trust proxy", 1); // Trust first proxy

// ==========================================
// SECURITY MIDDLEWARE (Applied First)
// ==========================================

// 1. Security Headers - Helmet.js configuration
app.use(securityHeaders);

// 2. Additional custom security headers
app.use(additionalSecurityHeaders);

// 3. CORS - Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// 4. Security logging (optional - for monitoring)
if (process.env.NODE_ENV === "development") {
  app.use(securityLogger);
}

// ==========================================
// SESSION & PASSPORT (For OAuth)
// ==========================================

// Express session with MongoDB store (required by Passport for OAuth)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // lazy session update (in seconds)
      crypto: {
        secret: process.env.SESSION_SECRET || "session-encryption-secret",
      },
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // For cross-site OAuth
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ==========================================
// *  RATE LIMITING
// ==========================================

// Apply global rate limiter to all API routes
app.use("/api/", apiLimiter);

// ==========================================
// BODY PARSING & DATA SANITIZATION
// ==========================================

// Razorpay requires the original raw request body for webhook signature checks.
app.post(
  "/api/subscription/webhook",
  express.raw({type: "application/json"}),
  handleSubscriptionWebhook
);

// Body parser with generous size limits for portfolios, resumes, and images
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// MongoDB Connection with better error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
  })
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Connected to database:", mongoose.connection.name);

    // Synchronize API keys with MongoDB Settings so all dev/prod devices share the verified working key
    try {
      const settings = await Settings.getSettings();
      const envKey = process.env.OPENAI_API_KEY?.trim();
      const dbKey = settings?.aiApiKeys?.openaiApiKey?.trim();
      const dbAdminKey = settings?.aiApiKeys?.openaiAdminKey?.trim();

      if (envKey && envKey.startsWith("sk-") && !envKey.includes("YOUR_") && envKey !== dbKey) {
        // Fresh .env key provided -> update MongoDB Atlas with the active key
        if (!settings.aiApiKeys) settings.aiApiKeys = {};
        settings.aiApiKeys.openaiApiKey = envKey;
        if (process.env.OPENAI_ADMIN_KEY?.trim()) {
          settings.aiApiKeys.openaiAdminKey = process.env.OPENAI_ADMIN_KEY.trim();
        }
        await settings.save();
        console.log(`🔑 [CONFIG] Synced and updated MongoDB Atlas with active OpenAI API Key (...${envKey.slice(-6)})`);
      } else if (dbKey && dbKey.startsWith("sk-")) {
        // Shared database has the verified working key -> enforce it across all devices
        process.env.OPENAI_API_KEY = dbKey;
        if (dbAdminKey) {
          process.env.OPENAI_ADMIN_KEY = dbAdminKey;
        }
        console.log(
          `🔑 [CONFIG] Active OpenAI Key enforced from MongoDB Atlas (...${dbKey.slice(-6)})`
        );
      }
    } catch (syncErr) {
      console.warn("⚠️  Settings key synchronization notice:", syncErr.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("💡 Possible fixes:");
    console.error("   1. Check if your IP is whitelisted in MongoDB Atlas");
    console.error("   2. Verify your MongoDB connection string");
    console.error("   3. Check your network/firewall settings");
    process.exit(1);
  });

// Handle mongoose connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});

// Serve uploaded interview recordings & snapshots statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
// TEMPORARILY HIDDEN FOR RAZORPAY COMPLIANCE - Job Search Features
// app.use("/api/jobs", jobsRoutes);
app.use("/api/voice", voiceRoutes); // Voice transcription routes
app.use("/api/subscription", subscriptionRoutes); // Subscription & payment routes
app.use("/api/interview", interviewRoutes); // AI Interview routes
app.use("/api/portfolio", portfolioRoutes); // Portfolio builder routes
app.use("/api/career", careerRoutes); // Career profile & personalized Q&A routes
app.use("/api/career-applications", careerApplicationRoutes); // Founding team career application submissions & admin routes
app.use("/api/super-admin", superAdminRoutes); // Super Admin panel & environment management routes
app.use("/api/logs", logRoutes); // Centralized Observability & Agent Logs routes

// Helper to escape HTML attributes safely
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Server-side OpenGraph & SEO handler for WhatsApp & Social Media scrapers
app.get(["/u/:slug", "/portfolio/:slug"], async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug) return next();

    // Check if user-agent is a crawler or social scraper
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const isCrawler =
      /bot|crawl|slurp|spider|whatsapp|facebookexternalhit|meta-externalagent|twitterbot|telegrambot|linkedinbot|discordbot|slackbot|skypeuripreview|pinterest|redditbot/i.test(
        userAgent
      );

    const portfolio = await Portfolio.findOne({
      slug: slug.toLowerCase(),
      status: "published",
    })
      .populate("userId", "name email profileImage")
      .populate("resumeId", "name contact summary personalInfo")
      .lean();

    if (!portfolio) {
      if (isCrawler) {
        return res
          .status(404)
          .send(
            `<!DOCTYPE html><html><head><title>Portfolio Not Found | SmartNShine</title><meta name="description" content="Portfolio not found or is currently private."></head><body><h1>Portfolio Not Found</h1></body></html>`
          );
      }
      return next();
    }

    const name =
      portfolio.userId?.name ||
      portfolio.resumeId?.name ||
      portfolio.title ||
      "Professional Portfolio";
    const rawTitle =
      portfolio.seo?.title || `${name} | Interactive Portfolio`;
    const title = escapeHtml(rawTitle);

    const rawDescription =
      portfolio.seo?.description ||
      portfolio.tagline ||
      portfolio.about ||
      portfolio.resumeId?.summary ||
      `Explore ${name}'s verified projects, technical skills, and professional experience on SmartNShine.`;
    const description = escapeHtml(rawDescription.substring(0, 300));

    // Determine Base URL
    const host = req.get("host") || "www.smartnshine.app";
    const protocol =
      req.protocol === "https" ||
      req.headers["x-forwarded-proto"] === "https"
        ? "https"
        : "http";
    const baseUrl = `${protocol}://${host}`;
    const canonicalUrl = `${baseUrl}/u/${encodeURIComponent(portfolio.slug)}`;

    // Resolve OG Image
    let rawOgImage =
      portfolio.seo?.ogImage ||
      portfolio.profileImage ||
      portfolio.heroImage ||
      portfolio.userId?.profileImage ||
      portfolio.resumeId?.personalInfo?.photo ||
      "";

    let ogImageUrl = `${baseUrl}/social-preview.png`;
    if (rawOgImage) {
      if (
        rawOgImage.startsWith("http://") ||
        rawOgImage.startsWith("https://")
      ) {
        ogImageUrl = rawOgImage;
      } else {
        ogImageUrl = `${baseUrl}${
          rawOgImage.startsWith("/") ? "" : "/"
        }${rawOgImage}`;
      }
    }
    const escapedOgImage = escapeHtml(ogImageUrl);

    // Resolve Favicon (with fallback to custom favicon -> profile photo -> og image -> default)
    let rawFavicon =
      portfolio.seo?.favicon ||
      portfolio.favicon ||
      portfolio.seo?.ogImage ||
      portfolio.profileImage ||
      portfolio.heroImage ||
      portfolio.userId?.profileImage ||
      portfolio.resumeId?.personalInfo?.photo ||
      "";
    let faviconUrl = "";
    if (rawFavicon) {
      if (
        rawFavicon.startsWith("http://") ||
        rawFavicon.startsWith("https://")
      ) {
        faviconUrl = rawFavicon;
      } else {
        faviconUrl = `${baseUrl}${
          rawFavicon.startsWith("/") ? "" : "/"
        }${rawFavicon}`;
      }
    }
    const escapedFavicon = faviconUrl
      ? escapeHtml(faviconUrl)
      : `${baseUrl}/favicon.ico`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="${escapedFavicon}">
  <link rel="shortcut icon" href="${escapedFavicon}">
  <link rel="apple-touch-icon" href="${escapedFavicon}">
  
  <!-- Open Graph / Facebook / WhatsApp (Crucial for WhatsApp Card previews) -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="SmartNShine">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${escapedOgImage}">
  <meta property="og:image:secure_url" content="${escapedOgImage}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapedOgImage}">

  ${
    portfolio.settings?.allowIndexing === false
      ? '<meta name="robots" content="noindex,nofollow">'
      : '<meta name="robots" content="index,follow,max-image-preview:large">'
  }

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #111827; border-radius: 20px; padding: 36px; max-width: 520px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.08); }
    .avatar { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px; border: 3px solid #6366f1; box-shadow: 0 0 20px rgba(99,102,241,0.3); }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 10px; color: #fff; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 14px rgba(79,70,229,0.4); }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.6); }
  </style>
</head>
<body>
  <div class="card">
    ${
      escapedOgImage
        ? `<img class="avatar" src="${escapedOgImage}" alt="${title}" />`
        : ""
    }
    <h1>${title}</h1>
    <p>${description}</p>
    <a class="btn" href="/u/${encodeURIComponent(portfolio.slug)}">Open Interactive Portfolio</a>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    return res.send(html);
  } catch (error) {
    console.error("Error serving public portfolio SEO page:", error);
    next();
  }
});

// Dynamic Real-time XML Sitemap for Search Crawlers
app.get(["/sitemap.xml", "/api/sitemap.xml"], async (req, res) => {
  try {
    const baseUrl = "https://www.smartnshine.app";
    const today = new Date().toISOString().split("T")[0];

    // Query active templates from MongoDB
    const activeTemplates = await Template.find({ isActive: true })
      .select("templateId category updatedAt createdAt")
      .lean();

    const staticRoutes = [
      { url: "/", changefreq: "daily", priority: "1.0" },
      { url: "/templates", changefreq: "daily", priority: "1.0" },
      { url: "/templates?category=professional", changefreq: "weekly", priority: "0.95" },
      { url: "/templates?category=tech", changefreq: "weekly", priority: "0.95" },
      { url: "/templates?category=leadership", changefreq: "weekly", priority: "0.95" },
      { url: "/templates?category=creative", changefreq: "weekly", priority: "0.90" },
      { url: "/templates?category=modern", changefreq: "weekly", priority: "0.90" },
      { url: "/templates?category=minimal", changefreq: "weekly", priority: "0.90" },
      { url: "/ats-analyzer", changefreq: "weekly", priority: "0.90" },
      { url: "/job-search", changefreq: "daily", priority: "0.85" },
      { url: "/smart-job-match", changefreq: "weekly", priority: "0.85" },
      { url: "/ai-interview", changefreq: "weekly", priority: "0.85" },
      { url: "/pricing", changefreq: "weekly", priority: "0.80" },
      { url: "/contact", changefreq: "monthly", priority: "0.60" },
      { url: "/privacy-policy", changefreq: "monthly", priority: "0.40" },
      { url: "/terms", changefreq: "monthly", priority: "0.40" },
      { url: "/refund-policy", changefreq: "monthly", priority: "0.40" },
      { url: "/shipping-policy", changefreq: "monthly", priority: "0.40" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">\n`;

    // Static Routes
    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${route.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${baseUrl}/social-preview.png</image:loc>\n`;
      xml += `      <image:title>SmartNShine ATS Resume Builder</image:title>\n`;
      xml += `    </image:image>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic Templates from Database
    activeTemplates.forEach((tpl) => {
      const lastMod = tpl.updatedAt
        ? new Date(tpl.updatedAt).toISOString().split("T")[0]
        : today;
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/templates?template=${encodeURIComponent(tpl.templateId)}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.90</priority>\n`;
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${baseUrl}/social-preview.png</image:loc>\n`;
      xml += `      <image:title>${tpl.name || "Professional"} ATS Resume Template</image:title>\n`;
      xml += `    </image:image>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(xml);
  } catch (error) {
    console.error("Dynamic sitemap generation error:", error);
    res.status(500).send("Error generating dynamic sitemap");
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ATS Resume API is running",
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isCorsError =
    err.isCors ||
    err.message === "Not allowed by CORS" ||
    (typeof err.message === "string" && err.message.includes("CORS"));

  if (isCorsError) {
    return res.status(403).json({
      error: "Access denied by CORS policy",
    });
  }

  // Only trigger admin notification for actual internal server errors (5xx)
  // to avoid flooding notification logs with client 4xx / unauthorized / CORS errors
  if (status >= 500) {
    console.error("Server Error [500]:", err);
    notifySystemError({
      source: "express",
      error: err,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    console.warn(`Client Error [${status}]:`, err.message);
  }

  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && {stack: err.stack}),
  });
});

// Check voice services availability (non-blocking)
async function checkVoiceServices() {
  const voiceServiceUrl =
    process.env.VOICE_SERVICE_URL ||
    process.env.ML_SERVICE_URL ||
    "http://localhost:5001";
  const chatterboxUrl =
    process.env.CHATTERBOX_SERVICE_URL || "http://localhost:5002";

  try {
    await fetch(`${voiceServiceUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    console.log("✅ Whisper STT service: available on", voiceServiceUrl);
  } catch {
    console.warn(
      `⚠️  Whisper STT service not reachable on ${voiceServiceUrl} (AI Interview voice input will be unavailable)`
    );
  }

  try {
    const response = await fetch(`${chatterboxUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.chatterbox_available === true) {
      console.log("✅ Chatterbox TTS service: available on", chatterboxUrl);
    } else {
      console.warn(
        `⚠️  Chatterbox TTS service reachable on ${chatterboxUrl}, but model is not loaded (Browser TTS will be used as fallback)`
      );
    }
  } catch {
    console.warn(
      `⚠️  Chatterbox TTS service not reachable on ${chatterboxUrl} (Browser TTS will be used as fallback)`
    );
  }
}

import { startCleanupJob } from "./services/interview-cleanup.service.js";

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);

  // Start background jobs
  startCleanupJob();

  // Check voice services after startup (non-blocking)
  checkVoiceServices();
});

export default app;

import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import OpenAI from "openai";
import axios from "axios";
import Settings from "../models/Settings.model.js";

// Helper: Determine .env file location
export const getEnvPath = () => {
  const possiblePaths = [
    process.env.DOTENV_CONFIG_PATH,
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "server", ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  // Default to .env in current working directory
  return path.resolve(process.cwd(), ".env");
};

// Helper: Ensure backup directory exists
const getBackupDir = () => {
  const backupDir = path.resolve(process.cwd(), "backups", "env-backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, {recursive: true});
  }
  return backupDir;
};

// Helper: Create a backup of current .env
const backupCurrentEnv = () => {
  const envPath = getEnvPath();
  if (fs.existsSync(envPath)) {
    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFilePath = path.join(backupDir, `env-backup-${timestamp}.env`);
    fs.copyFileSync(envPath, backupFilePath);
    return {
      filename: `env-backup-${timestamp}.env`,
      path: backupFilePath,
      timestamp: new Date().toISOString(),
    };
  }
  return null;
};

// Variable metadata definition for UI categorization and tips
const VARIABLE_METADATA = {
  // AI & LLM Services
  OPENAI_API_KEY: {
    category: "AI & Intelligence",
    label: "OpenAI API Key",
    description: "Powers AI resume tailoring, ATS extraction, bullet rewriting, and interview simulations (sk-...)",
    isSensitive: true,
    testable: "openai",
    icon: "openai",
  },
  OPENAI_ADMIN_KEY: {
    category: "AI & Intelligence",
    label: "OpenAI Admin API Key",
    description: "Admin key (sk-admin-...) for automated real-time Organization Usage & Costs sync",
    isSensitive: true,
    icon: "openai",
  },
  OPENAI_TOTAL_CREDITS: {
    category: "AI & Intelligence",
    label: "OpenAI Total Credit Pool (USD)",
    description: "Configured total credit balance in USD for real-time burn-rate tracking",
    isSensitive: false,
    icon: "database",
  },
  SARVAM_API_KEY: {
    category: "AI & Intelligence",
    label: "Sarvam AI API Key",
    description: "Production voice synthesis & Indian multilingual speech recognition (Saaras v3 / Bulbul v3)",
    isSensitive: true,
    testable: "sarvam",
    icon: "sarvam",
  },
  VOICE_ENGINE_PREFERENCE: {
    category: "AI & Intelligence",
    label: "Default Voice Engine Preference",
    description: "Default voice engine: 'auto' (hybrid), 'sarvam' (cloud), or 'local' (Whisper + Chatterbox)",
    isSensitive: false,
    icon: "voice",
  },
  VOICE_SERVICE_URL: {
    category: "AI & Intelligence",
    label: "Local Whisper STT Service URL",
    description: "URL for offline local speech-to-text Python microservice (default: http://localhost:5001)",
    isSensitive: false,
    testable: "whisper",
    icon: "voice",
  },
  CHATTERBOX_SERVICE_URL: {
    category: "AI & Intelligence",
    label: "Local Chatterbox TTS Service URL",
    description: "URL for offline local text-to-speech Python microservice (default: http://localhost:5002)",
    isSensitive: false,
    testable: "chatterbox",
    icon: "voice",
  },
  ELEVENLABS_API_KEY: {
    category: "AI & Intelligence",
    label: "ElevenLabs API Key",
    description: "Optional voice synthesis API key",
    isSensitive: true,
    icon: "voice",
  },

  // Media & Cloud Storage
  CLOUDINARY_CLOUD_NAME: {
    category: "Media & Cloud Storage",
    label: "Cloudinary Cloud Name",
    description: "Cloud name for portfolio hero cutouts, profile avatars, and template media hosting",
    isSensitive: false,
    testable: "cloudinary",
    icon: "image",
  },
  CLOUDINARY_API_KEY: {
    category: "Media & Cloud Storage",
    label: "Cloudinary API Key",
    description: "Public API key for Cloudinary REST authentication",
    isSensitive: false,
    testable: "cloudinary",
    icon: "key",
  },
  CLOUDINARY_API_SECRET: {
    category: "Media & Cloud Storage",
    label: "Cloudinary API Secret",
    description: "Secret key for secure SHA-1 upload signatures and asset management",
    isSensitive: true,
    testable: "cloudinary",
    icon: "lock",
  },

  // Payment Gateway
  RAZORPAY_KEY_ID: {
    category: "Payments & Billing",
    label: "Razorpay Key ID",
    description: "Public key for Razorpay checkout integration (rzp_test_... or rzp_live_...)",
    isSensitive: false,
    testable: "razorpay",
    icon: "razorpay",
  },
  RAZORPAY_KEY_SECRET: {
    category: "Payments & Billing",
    label: "Razorpay Key Secret",
    description: "Secret key for Razorpay signature verification and order creation",
    isSensitive: true,
    testable: "razorpay",
    icon: "lock",
  },
  RAZORPAY_WEBHOOK_SECRET: {
    category: "Payments & Billing",
    label: "Razorpay Webhook Secret",
    description: "Used to authenticate automated webhook events from Razorpay",
    isSensitive: true,
    icon: "webhook",
  },

  // Database & Core Security
  MONGODB_URI: {
    category: "Database & Security",
    label: "MongoDB Connection URI",
    description: "Primary database connection string (mongodb+srv://...)",
    isSensitive: true,
    testable: "mongodb",
    icon: "database",
  },
  JWT_SECRET: {
    category: "Database & Security",
    label: "JWT Secret Key",
    description: "Secret used to sign and verify user authentication tokens",
    isSensitive: true,
    icon: "key",
  },
  SESSION_SECRET: {
    category: "Database & Security",
    label: "Express Session Secret",
    description: "Secret key used for secure session encryption with Passport & MongoStore",
    isSensitive: true,
    icon: "shield",
  },
  SUPER_ADMIN_PASSWORD: {
    category: "Database & Security",
    label: "Super Admin Master Password",
    description: "Password required to log into this Super Admin Panel directly",
    isSensitive: true,
    icon: "lock",
  },

  // Email & SMTP
  EMAIL_SERVICE: {
    category: "Email & SMTP",
    label: "Email Service Provider",
    description: "Email service provider (e.g. 'gmail' or leave blank for custom SMTP host)",
    isSensitive: false,
    icon: "mail",
  },
  EMAIL_USER: {
    category: "Email & SMTP",
    label: "SMTP Email Address",
    description: "Sender email address for OTPs, account verifications, and receipts",
    isSensitive: false,
    testable: "smtp",
    icon: "user",
  },
  EMAIL_PASSWORD: {
    category: "Email & SMTP",
    label: "SMTP App Password",
    description: "App Password or SMTP password (e.g. Google 16-character App Password)",
    isSensitive: true,
    testable: "smtp",
    icon: "key",
  },
  CLIENT_URL: {
    category: "Email & SMTP",
    label: "Client URL (for Emails)",
    description: "Frontend base URL used in verification links inside outgoing emails",
    isSensitive: false,
    icon: "link",
  },

  // OAuth Authentication
  GOOGLE_CLIENT_ID: {
    category: "OAuth & Social Login",
    label: "Google OAuth Client ID",
    description: "Google Cloud Console OAuth 2.0 Client ID",
    isSensitive: false,
    icon: "google",
  },
  GOOGLE_CLIENT_SECRET: {
    category: "OAuth & Social Login",
    label: "Google OAuth Client Secret",
    description: "Google Cloud Console OAuth 2.0 Client Secret",
    isSensitive: true,
    icon: "lock",
  },
  GITHUB_CLIENT_ID: {
    category: "OAuth & Social Login",
    label: "GitHub OAuth Client ID",
    description: "GitHub Developer OAuth Application Client ID",
    isSensitive: false,
    icon: "github",
  },
  GITHUB_CLIENT_SECRET: {
    category: "OAuth & Social Login",
    label: "GitHub OAuth Client Secret",
    description: "GitHub Developer OAuth Application Client Secret",
    isSensitive: true,
    icon: "lock",
  },

  // Network, URLs & Services
  PORT: {
    category: "Server & Network",
    label: "Server Port",
    description: "Local port where Express backend listens (default: 5000)",
    isSensitive: false,
    icon: "server",
  },
  NODE_ENV: {
    category: "Server & Network",
    label: "Node Environment",
    description: "Current environment mode ('development' or 'production')",
    isSensitive: false,
    icon: "activity",
  },
  CLIENT_ORIGIN: {
    category: "Server & Network",
    label: "Client Origin",
    description: "Primary client origin URL allowed for CORS requests",
    isSensitive: false,
    icon: "globe",
  },
  ALLOWED_ORIGINS: {
    category: "Server & Network",
    label: "Allowed CORS Origins",
    description: "Comma-separated list of allowed origins (e.g. http://localhost:5173,https://smartnshine.in)",
    isSensitive: false,
    icon: "globe",
  },
  SERVER_URL: {
    category: "Server & Network",
    label: "Backend Server URL",
    description: "Full URL of backend server used for OAuth callbacks",
    isSensitive: false,
    icon: "link",
  },
  VOICE_SERVICE_URL: {
    category: "Server & Network",
    label: "Whisper STT Voice Service URL",
    description: "URL of local or cloud Whisper STT voice service (default: http://localhost:5001)",
    isSensitive: false,
    icon: "mic",
  },
  CHATTERBOX_SERVICE_URL: {
    category: "Server & Network",
    label: "Chatterbox TTS Service URL",
    description: "URL of local Chatterbox TTS speech synthesis service (default: http://localhost:5002)",
    isSensitive: false,
    icon: "volume",
  },
};

/**
 * Super Admin Login
 * Verifies password and issues a Super Admin JWT token
 */
export const superAdminLogin = async (req, res) => {
  try {
    const {password} = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Super Admin password is required",
      });
    }

    const currentSuperPassword =
      process.env.SUPER_ADMIN_PASSWORD || "SmartNShine@SuperAdmin2026!";
    const isDefault = !process.env.SUPER_ADMIN_PASSWORD;

    if (password !== currentSuperPassword) {
      return res.status(401).json({
        success: false,
        error: "Incorrect Super Admin password. Please check and try again.",
      });
    }

    const secret = process.env.JWT_SECRET || "smartnshine-super-admin-secret-2026";
    const token = jwt.sign(
      {
        role: "super-admin",
        authenticatedAt: Date.now(),
      },
      secret,
      {expiresIn: "24h"}
    );

    res.json({
      success: true,
      message: "Super Admin authentication successful",
      token,
      expiresIn: "24 hours",
      isDefaultPassword: isDefault,
    });
  } catch (error) {
    console.error("Super Admin login error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed due to server error",
    });
  }
};

/**
 * Verify current Super Admin token
 */
export const verifySuperAdminSession = async (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      role: "super-admin",
      authenticatedAt: req.superAdmin?.authenticatedAt,
    },
    isDefaultPassword: !process.env.SUPER_ADMIN_PASSWORD,
  });
};

/**
 * Update Super Admin Master Password
 */
export const changeSuperAdminPassword = async (req, res) => {
  try {
    const {newPassword, currentPassword} = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters long",
      });
    }

    const activePassword =
      process.env.SUPER_ADMIN_PASSWORD || "SmartNShine@SuperAdmin2026!";

    if (currentPassword && currentPassword !== activePassword) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Backup .env
    const backup = backupCurrentEnv();

    // Read and update .env
    const envPath = getEnvPath();
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

    if (/^SUPER_ADMIN_PASSWORD=/m.test(content)) {
      content = content.replace(
        /^SUPER_ADMIN_PASSWORD=.*$/m,
        `SUPER_ADMIN_PASSWORD=${newPassword}`
      );
    } else {
      content += `\n# Super Admin Password\nSUPER_ADMIN_PASSWORD=${newPassword}\n`;
    }

    fs.writeFileSync(envPath, content, "utf-8");
    process.env.SUPER_ADMIN_PASSWORD = newPassword;

    res.json({
      success: true,
      message: "Super Admin password updated successfully",
      backupFile: backup?.filename,
    });
  } catch (error) {
    console.error("Change super admin password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update Super Admin password",
    });
  }
};

/**
 * Parse .env file and return structured variables + metadata
 */
export const getEnvVariables = async (req, res) => {
  try {
    const envPath = getEnvPath();
    const backupDir = getBackupDir();

    let rawContent = "";
    let lastModified = null;

    if (fs.existsSync(envPath)) {
      rawContent = fs.readFileSync(envPath, "utf-8");
      const stat = fs.statSync(envPath);
      lastModified = stat.mtime;
    }

    // Count available backups
    let backupCount = 0;
    if (fs.existsSync(backupDir)) {
      backupCount = fs.readdirSync(backupDir).filter((f) => f.endsWith(".env")).length;
    }

    // Parse lines into key-value map and categories
    const lines = rawContent.split("\n");
    const parsedMap = {};
    const categoriesMap = {
      "AI & Intelligence": [],
      "Media & Cloud Storage": [],
      "Payments & Billing": [],
      "Database & Security": [],
      "Email & SMTP": [],
      "OAuth & Social Login": [],
      "Server & Network": [],
      "Custom & Additional": [],
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const equalIdx = trimmed.indexOf("=");
      if (equalIdx > 0) {
        const key = trimmed.slice(0, equalIdx).trim();
        let value = trimmed.slice(equalIdx + 1).trim();

        // Strip inline comments if not quoted
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        } else {
          const commentIdx = value.indexOf(" #");
          if (commentIdx >= 0) {
            value = value.slice(0, commentIdx).trim();
          }
        }

        parsedMap[key] = value;
      }
    });

    // Also include any process.env keys present in VARIABLE_METADATA if not in .env
    Object.keys(VARIABLE_METADATA).forEach((key) => {
      if (!(key in parsedMap) && process.env[key]) {
        parsedMap[key] = process.env[key];
      }
    });

    // Structure each variable with metadata
    const allVariables = Object.keys(parsedMap).map((key) => {
      const meta = VARIABLE_METADATA[key] || {
        category: "Custom & Additional",
        label: key.replace(/_/g, " "),
        description: "Custom environment variable",
        isSensitive: /SECRET|KEY|PASSWORD|TOKEN|AUTH/i.test(key),
        icon: "sliders",
      };

      const item = {
        key,
        value: parsedMap[key] || "",
        category: meta.category,
        label: meta.label,
        description: meta.description,
        isSensitive: meta.isSensitive,
        testable: meta.testable || null,
        icon: meta.icon || "sliders",
        isSet: Boolean(parsedMap[key]),
      };

      if (categoriesMap[meta.category]) {
        categoriesMap[meta.category].push(item);
      } else {
        categoriesMap["Custom & Additional"].push(item);
      }

      return item;
    });

    res.json({
      success: true,
      envPath,
      lastModified,
      backupCount,
      totalVariables: allVariables.length,
      categories: categoriesMap,
      variables: allVariables,
      rawContent,
    });
  } catch (error) {
    console.error("Get env variables error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read environment configuration",
    });
  }
};

/**
 * Update environment variables from key-value map
 */
export const updateEnvVariables = async (req, res) => {
  try {
    const {variables} = req.body;

    if (!variables || typeof variables !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid request payload. Expected 'variables' object.",
      });
    }

    // Safety checks: do not allow clearing critical variables
    const criticalKeys = ["MONGODB_URI", "JWT_SECRET"];
    for (const key of criticalKeys) {
      if (key in variables && !variables[key]?.trim()) {
        return res.status(400).json({
          success: false,
          error: `Critical variable '${key}' cannot be empty as it would crash the server.`,
        });
      }
    }

    // 1. Create backup
    const backup = backupCurrentEnv();

    // 2. Read existing .env to preserve structure & comments where possible
    const envPath = getEnvPath();
    let existingContent = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, "utf-8")
      : "";

    const lines = existingContent.split("\n");
    const handledKeys = new Set();
    const updatedLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        updatedLines.push(line);
        continue;
      }

      const equalIdx = trimmed.indexOf("=");
      if (equalIdx > 0) {
        const key = trimmed.slice(0, equalIdx).trim();
        if (key in variables) {
          const val = variables[key];
          // Preserve quotes if value has spaces or special chars
          const formattedVal =
            typeof val === "string" && (val.includes(" ") || val.includes("#"))
              ? `"${val}"`
              : val;
          updatedLines.push(`${key}=${formattedVal}`);
          handledKeys.add(key);
        } else {
          // Keep existing line
          updatedLines.push(line);
          handledKeys.add(key);
        }
      } else {
        updatedLines.push(line);
      }
    }

    // Append any brand new keys at the end
    const newKeys = Object.keys(variables).filter((k) => !handledKeys.has(k));
    if (newKeys.length > 0) {
      updatedLines.push("\n# Added via Super Admin Panel");
      newKeys.forEach((k) => {
        const val = variables[k];
        const formattedVal =
          typeof val === "string" && (val.includes(" ") || val.includes("#"))
            ? `"${val}"`
            : val;
        updatedLines.push(`${k}=${formattedVal}`);
      });
    }

    const newContent = updatedLines.join("\n");
    fs.writeFileSync(envPath, newContent, "utf-8");

    // 3. Hot-update in-memory process.env immediately!
    Object.keys(variables).forEach((key) => {
      process.env[key] = variables[key];
    });

    // 4. Synchronize critical AI API keys into shared MongoDB Settings so all dev/prod environments share them
    try {
      const settings = await Settings.getSettings();
      let changed = false;
      if (variables.OPENAI_API_KEY && variables.OPENAI_API_KEY.trim().startsWith("sk-")) {
        if (!settings.aiApiKeys) settings.aiApiKeys = {};
        settings.aiApiKeys.openaiApiKey = variables.OPENAI_API_KEY.trim();
        changed = true;
      }
      if (variables.OPENAI_ADMIN_KEY && variables.OPENAI_ADMIN_KEY.trim().startsWith("sk-")) {
        if (!settings.aiApiKeys) settings.aiApiKeys = {};
        settings.aiApiKeys.openaiAdminKey = variables.OPENAI_ADMIN_KEY.trim();
        changed = true;
      }
      if (changed) {
        await settings.save();
        console.log("✅ [SUPER ADMIN] Synchronized AI API Keys to shared MongoDB Settings");
      }
    } catch (dbErr) {
      console.warn("⚠️ [SUPER ADMIN] Could not sync keys to MongoDB Settings:", dbErr.message);
    }

    console.log(
      `✅ [SUPER ADMIN] Successfully updated ${
        Object.keys(variables).length
      } environment variables in ${envPath} and in-memory process.env`
    );

    res.json({
      success: true,
      message: "Environment variables successfully saved and applied in runtime!",
      backupFile: backup?.filename,
      updatedKeysCount: Object.keys(variables).length,
    });
  } catch (error) {
    console.error("Update env variables error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save environment variables: " + error.message,
    });
  }
};

/**
 * Save raw .env string
 */
export const updateRawEnv = async (req, res) => {
  try {
    const {rawContent} = req.body;

    if (typeof rawContent !== "string") {
      return res.status(400).json({
        success: false,
        error: "rawContent must be a string",
      });
    }

    // 1. Create backup
    const backup = backupCurrentEnv();

    // 2. Write to disk
    const envPath = getEnvPath();
    fs.writeFileSync(envPath, rawContent, "utf-8");

    // 3. Hot-reload parsed variables into process.env
    const lines = rawContent.split("\n");
    let count = 0;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalIdx = trimmed.indexOf("=");
      if (equalIdx > 0) {
        const key = trimmed.slice(0, equalIdx).trim();
        let value = trimmed.slice(equalIdx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
        count++;
      }
    });

    res.json({
      success: true,
      message: `Raw .env saved and ${count} variables synced to runtime!`,
      backupFile: backup?.filename,
    });
  } catch (error) {
    console.error("Update raw env error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update raw .env: " + error.message,
    });
  }
};

/**
 * Test specific API key / service
 */
export const testApiKey = async (req, res) => {
  const {service, apiKey, secondaryKey} = req.body;
  const startTime = Date.now();

  try {
    if (!service) {
      return res.status(400).json({
        success: false,
        error: "Service name is required (e.g. openai, sarvam, razorpay, mongodb, smtp)",
      });
    }

    switch (service) {
      case "openai": {
        const keyToTest = apiKey || process.env.OPENAI_API_KEY;
        if (!keyToTest) {
          return res.status(400).json({
            success: false,
            error: "No OpenAI API key provided to test",
          });
        }
        const openai = new OpenAI({apiKey: keyToTest.trim()});
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{role: "user", content: "Ping. Reply with 'OK'."}],
          max_tokens: 5,
        });
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          service: "OpenAI",
          model: "gpt-4o-mini",
          latencyMs: latency,
          message: "OpenAI API key is ACTIVE and responded successfully!",
          sampleOutput: completion.choices[0]?.message?.content?.trim() || "OK",
        });
      }

      case "sarvam": {
        const keyToTest = apiKey || process.env.SARVAM_API_KEY;
        if (!keyToTest) {
          return res.status(400).json({
            success: false,
            error: "No Sarvam API key provided to test",
          });
        }
        // Sarvam subscription check or lightweight ping
        const response = await fetch("https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers: {
            "api-subscription-key": keyToTest.trim(),
          },
        });
        const latency = Date.now() - startTime;

        // 400 Bad Request means Auth succeeded (payload missing), 401/403 means auth failed
        if (response.status === 401 || response.status === 403) {
          return res.status(401).json({
            success: false,
            service: "Sarvam AI",
            latencyMs: latency,
            error: "Sarvam API Key authentication failed (Invalid subscription key).",
          });
        }

        return res.json({
          success: true,
          service: "Sarvam AI",
          latencyMs: latency,
          message: "Sarvam AI API key is VALID and authenticated successfully!",
        });
      }

      case "razorpay": {
        const keyId = apiKey || process.env.RAZORPAY_KEY_ID;
        const keySecret = secondaryKey || process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
          return res.status(400).json({
            success: false,
            error: "Both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required to test.",
          });
        }

        const rzp = new Razorpay({
          key_id: keyId.trim(),
          key_secret: keySecret.trim(),
        });

        // Test fetching 1 customer or order to verify credentials
        const orders = await rzp.orders.all({count: 1});
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          service: "Razorpay Payment Gateway",
          latencyMs: latency,
          message: "Razorpay Key ID and Secret are VALID and connected to your Razorpay account!",
          accountStatus: "Connected",
          totalOrdersCount: orders.count || 0,
        });
      }

      case "mongodb": {
        const uriToTest = apiKey || process.env.MONGODB_URI;
        if (!uriToTest) {
          return res.status(400).json({
            success: false,
            error: "No MongoDB URI provided to test",
          });
        }

        // If it's the active connection, do a ping
        if (mongoose.connection.readyState === 1) {
          const adminDb = mongoose.connection.db.admin();
          const pingResult = await adminDb.ping();
          const latency = Date.now() - startTime;

          return res.json({
            success: true,
            service: "MongoDB",
            latencyMs: latency,
            message: `MongoDB is CONNECTED! Database: ${mongoose.connection.name}`,
            ping: pingResult,
          });
        } else {
          return res.status(503).json({
            success: false,
            service: "MongoDB",
            error: "MongoDB connection is currently disconnected or connecting.",
          });
        }
      }

      case "smtp": {
        const user = apiKey || process.env.EMAIL_USER;
        const pass = secondaryKey || process.env.EMAIL_PASSWORD;
        const serviceProvider = process.env.EMAIL_SERVICE || "gmail";

        if (!user || !pass) {
          return res.status(400).json({
            success: false,
            error: "EMAIL_USER and EMAIL_PASSWORD are required to test SMTP.",
          });
        }

        const transporter = nodemailer.createTransport({
          service: serviceProvider,
          auth: {
            user: user.trim(),
            pass: pass.trim(),
          },
        });

        await transporter.verify();
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          service: "Email SMTP",
          latencyMs: latency,
          message: `SMTP connection established successfully for ${user}!`,
        });
      }

      case "whisper": {
        const urlToTest = apiKey || process.env.VOICE_SERVICE_URL || "http://localhost:5001";
        const cleanUrl = urlToTest.trim().replace(/\/$/, "");
        const response = await axios.get(`${cleanUrl}/health`, { timeout: 4000 });
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          service: "Local Whisper STT",
          latencyMs: latency,
          message: `Whisper microservice is ONLINE and responding at ${cleanUrl}!`,
          data: response.data,
        });
      }

      case "chatterbox": {
        const urlToTest = apiKey || process.env.CHATTERBOX_SERVICE_URL || "http://localhost:5002";
        const cleanUrl = urlToTest.trim().replace(/\/$/, "");
        const response = await axios.get(`${cleanUrl}/health`, { timeout: 4000 });
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          service: "Local Chatterbox TTS",
          latencyMs: latency,
          message: `Chatterbox microservice is ONLINE and responding at ${cleanUrl}!`,
          data: response.data,
        });
      }

      case "cloudinary": {
        const cloudName = (apiKey || process.env.CLOUDINARY_CLOUD_NAME || "").trim();
        const apiSecret = (secondaryKey || process.env.CLOUDINARY_API_SECRET || "").trim();
        const keyId = (req.body.extraKey || process.env.CLOUDINARY_API_KEY || "").trim();

        if (!cloudName) {
          return res.status(400).json({
            success: false,
            error: "Cloudinary Cloud Name is required to test.",
          });
        }

        const headers = {};
        if (keyId && apiSecret) {
          const authString = Buffer.from(`${keyId}:${apiSecret}`).toString("base64");
          headers["Authorization"] = `Basic ${authString}`;
        }

        const response = await axios.get(
          `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
          { headers, timeout: 6000 }
        );
        const latency = Date.now() - startTime;

        return res.json({
          success: true,
          service: "Cloudinary Media CDN",
          latencyMs: latency,
          message: `Cloudinary account '${cloudName}' is ACTIVE and connected with fast CDN delivery!`,
          cloudName,
          status: response.data?.status || "ok",
        });
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported test service: ${service}`,
        });
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`API test failed for ${service}:`, error.message);
    return res.status(500).json({
      success: false,
      service,
      latencyMs: latency,
      error: error.message || "Failed to connect to provider service",
      details: error.response?.data || error.stack,
    });
  }
};

/**
 * List all historical .env backups
 */
export const getEnvBackups = async (req, res) => {
  try {
    const backupDir = getBackupDir();
    if (!fs.existsSync(backupDir)) {
      return res.json({success: true, backups: []});
    }

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".env"));
    const backups = files
      .map((filename) => {
        const filePath = path.join(backupDir, filename);
        const stat = fs.statSync(filePath);
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      backups,
    });
  } catch (error) {
    console.error("Get backups error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve backup list",
    });
  }
};

/**
 * Restore .env from a specific backup
 */
export const restoreEnvBackup = async (req, res) => {
  try {
    const {filename} = req.body;

    if (!filename || !filename.endsWith(".env")) {
      return res.status(400).json({
        success: false,
        error: "Valid backup filename required",
      });
    }

    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, path.basename(filename));

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: "Backup file not found",
      });
    }

    // Create a safety backup before restoring
    backupCurrentEnv();

    const envPath = getEnvPath();
    const restoredContent = fs.readFileSync(backupPath, "utf-8");
    fs.writeFileSync(envPath, restoredContent, "utf-8");

    // Hot-reload into process.env
    const lines = restoredContent.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalIdx = trimmed.indexOf("=");
      if (equalIdx > 0) {
        const key = trimmed.slice(0, equalIdx).trim();
        let value = trimmed.slice(equalIdx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });

    res.json({
      success: true,
      message: `Environment successfully restored from backup ${filename}!`,
    });
  } catch (error) {
    console.error("Restore backup error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore backup: " + error.message,
    });
  }
};

/**
 * System and server runtime status
 */
export const getSystemStatus = async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const uptimeSec = process.uptime();

    res.json({
      success: true,
      status: "online",
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        nodeEnv: process.env.NODE_ENV || "development",
        port: process.env.PORT || 5000,
        uptimeSeconds: Math.floor(uptimeSec),
        uptimeFormatted: formatUptime(uptimeSec),
      },
      memory: {
        rssMb: (mem.rss / 1024 / 1024).toFixed(1),
        heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(1),
        heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
        heapUsagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name || "N/A",
      },
      configuredProviders: {
        openai: Boolean(process.env.OPENAI_API_KEY),
        sarvam: Boolean(process.env.SARVAM_API_KEY),
        cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        emailSmtp: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
        googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        githubOAuth: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      },
    });
  } catch (error) {
    console.error("Get system status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system status",
    });
  }
};

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(" ");
}

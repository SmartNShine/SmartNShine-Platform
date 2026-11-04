import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // General Settings
    siteName: {
      type: String,
      default: "ATS Resume Generator",
    },
    siteDescription: {
      type: String,
      default: "Professional Resume Builder with ATS Optimization",
    },
    contactEmail: {
      type: String,
      default: "contact@smartnshine.in",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    // Festive & Promotional Sale Settings
    promotion: {
      enabled: {
        type: Boolean,
        default: true,
      },
      title: {
        type: String,
        default: "Raksha Bandhan Special Sale 🎁✨",
      },
      tagline: {
        type: String,
        default: "Celebrate Raksha Bandhan with an ATS-crushing resume at flat 82% OFF!",
      },
      badgeText: {
        type: String,
        default: "RAKHI FESTIVE SPECIAL",
      },
      theme: {
        type: String,
        default: "rakhi-festive", // "rakhi-festive", "gold-luxury", "crimson-festive", "vibrant-indigo"
      },
      oneTimePrice: {
        type: Number,
        default: 9,
      },
      originalOneTimePrice: {
        type: Number,
        default: 49,
      },
      proMonthlyPrice: {
        type: Number,
        default: 199,
      },
      originalProMonthlyPrice: {
        type: Number,
        default: 199,
      },
      proYearlyPrice: {
        type: Number,
        default: 1990,
      },
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days default countdown
      },
      ctaText: {
        type: String,
        default: "Claim ₹9 Resume Deal",
      },
      highlights: {
        type: [String],
        default: [
          "1 Dedicated 21-day single resume boost",
          "GPT-4o Enhanced AI bullet rewriting",
          "All 11 ATS-Certified templates",
          "Deep ATS compatibility scan",
          "1-Click live public portfolio website",
        ],
      },
    },

    // AI Quota Settings
    aiQuota: {
      free: {
        daily: {type: Number, default: 10},
        monthly: {type: Number, default: 200},
      },
      "one-time": {
        daily: {type: Number, default: 150},
        monthly: {type: Number, default: 150},
      },
      pro: {
        daily: {type: Number, default: 1000},
        monthly: {type: Number, default: 10000},
      },
    },

    // Feature Toggles
    features: {
      registration: {type: Boolean, default: true},
      githubImport: {type: Boolean, default: true},
      atsAnalyzer: {type: Boolean, default: true},
      aiEnhancement: {type: Boolean, default: true},
      feedback: {type: Boolean, default: true},
      templateUpload: {type: Boolean, default: true},
    },

    // Rate Limiting Settings
    rateLimits: {
      general: {
        windowMs: {type: Number, default: 900000}, // 15 minutes
        max: {type: Number, default: 100},
      },
      auth: {
        windowMs: {type: Number, default: 900000}, // 15 minutes
        max: {type: Number, default: 5},
      },
      ai: {
        windowMs: {type: Number, default: 60000}, // 1 minute
        max: {type: Number, default: 10},
      },
      upload: {
        windowMs: {type: Number, default: 900000}, // 15 minutes
        max: {type: Number, default: 20},
      },
    },

    // Email Settings
    email: {
      enabled: {type: Boolean, default: false},
      provider: {type: String, default: "smtp"},
      notifications: {
        welcome: {type: Boolean, default: true},
        quotaWarning: {type: Boolean, default: true},
        quotaExceeded: {type: Boolean, default: true},
      },
    },

    // Storage Settings
    storage: {
      maxFileSize: {type: Number, default: 5242880}, // 5MB in bytes
      allowedFileTypes: {
        type: [String],
        default: ["pdf", "doc", "docx"],
      },
      maxResumesPerUser: {type: Number, default: 10},
    },

    // Security Settings
    security: {
      passwordMinLength: {type: Number, default: 8},
      sessionTimeout: {type: Number, default: 86400000}, // 24 hours in ms
      enableTwoFactor: {type: Boolean, default: false},
      requireEmailVerification: {type: Boolean, default: false},
    },

    // Analytics Settings
    analytics: {
      enabled: {type: Boolean, default: true},
      trackPageViews: {type: Boolean, default: true},
      trackUserActions: {type: Boolean, default: true},
    },

    // AI Interview Unit Cost & Pricing Settings (Aligned with Official API Docs)
    interviewPricing: {
      sarvamSttRatePerMinuteInr: {
        type: Number,
        default: 0.50, // Official Sarvam Saaras rate: ₹30/hour = ₹0.50/min
      },
      sarvamTtsRatePerThousandCharsInr: {
        type: Number,
        default: 3.00, // Official Sarvam Bulbul v3 rate: ₹30 per 10,000 chars = ₹3.00/1k chars
      },
      llmInputTokenRatePerMillionInr: {
        type: Number,
        default: 13.00, // Official GPT-4o-mini: $0.15 / 1M tokens ≈ ₹13.00
      },
      llmOutputTokenRatePerMillionInr: {
        type: Number,
        default: 52.00, // Official GPT-4o-mini: $0.60 / 1M tokens ≈ ₹52.00
      },
      usdToInrExchangeRate: {
        type: Number,
        default: 86.50,
      },
      creditsPerLiveInterview: {
        type: Number,
        default: 5,
      },
      creditsPerTextInterview: {
        type: Number,
        default: 2,
      },
    },

    // AI API Keys stored in MongoDB for seamless synchronization across all environments
    aiApiKeys: {
      openaiApiKey: {
        type: String,
        default: "",
      },
      openaiAdminKey: {
        type: String,
        default: "",
      },
    },

    // OpenAI Credit & Account Balance Tracking Settings
    openaiCredits: {
      allocatedBudgetUsd: {
        type: Number,
        default: 10.00, // Default configured OpenAI credit pool ($10.00)
      },
      alertThresholdUsd: {
        type: Number,
        default: 2.00, // Trigger low balance alert when < $2.00
      },
      lastRefillDate: {
        type: Date,
        default: Date.now,
      },
      totalRefilledHistoricalUsd: {
        type: Number,
        default: 10.00,
      },
      autoAlertEnabled: {
        type: Boolean,
        default: true,
      },
      notes: {
        type: String,
        default: "Initial OpenAI credit allocation",
      },
    },

    // Last Updated By
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;

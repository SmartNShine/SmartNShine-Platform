import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Password not required for OAuth users
        return !this.googleId && !this.githubId;
      },
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "tpo"],
      default: "user",
    },
    // Institution link for TPO users
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
    },
    // TPO-specific profile fields
    tpoProfile: {
      designation: { type: String, trim: true },
      phone: { type: String, trim: true },
      isPrimary: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    // OAuth fields
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    githubId: {
      type: String,
      sparse: true,
      unique: true,
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    profilePicture: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },

    // Subscription fields
    subscription: {
      tier: {
        type: String,
        enum: ["free", "one-time", "pro"],
        default: "free",
        index: true,
      },
      plan: {
        type: String,
        enum: ["free", "monthly", "yearly", "one-time"],
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "expired", "trial", "pending"],
        default: "active",
        index: true,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
        index: true,
      },
      receiptId: {
        type: String,
      },
      paymentId: {
        type: String,
      },
      orderId: {
        type: String,
      },
      autoRenew: {
        type: Boolean,
        default: false,
      },
      cancelledAt: {
        type: Date,
      },
      cancelReason: {
        type: String,
      },
    },

    // Usage tracking
    usage: {
      resumesCreated: {
        type: Number,
        default: 0,
      },
      resumesThisMonth: {
        type: Number,
        default: 0,
      },
      resumesDownloaded: {
        type: Number,
        default: 0,
      },
      resumesDownloadedThisMonth: {
        type: Number,
        default: 0,
      },
      atsScans: {
        type: Number,
        default: 0,
      },
      atsScansThisMonth: {
        type: Number,
        default: 0,
      },
      jobMatches: {
        type: Number,
        default: 0,
      },
      jobMatchesToday: {
        type: Number,
        default: 0,
      },
      coverLetters: {
        type: Number,
        default: 0,
      },
      coverLettersThisMonth: {
        type: Number,
        default: 0,
      },
      aiResumeExtractions: {
        type: Number,
        default: 0,
      },
      aiResumeExtractionsToday: {
        type: Number,
        default: 0,
      },
      aiGenerationsUsed: {
        type: Number,
        default: 0,
      },
      aiGenerationsThisMonth: {
        type: Number,
        default: 0,
      },
      tokensUsed: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
      lastDailyReset: {
        type: Date,
        default: Date.now,
      },
    },

    // User Preferences
    preferences: {
      currency: {
        type: String,
        enum: ["INR", "USD"],
        default: "INR",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        usageAlerts: {
          type: Boolean,
          default: true,
        },
        renewalReminders: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Skip hashing if password not modified or OAuth user
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // OAuth users don't have passwords
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Subscription helper methods
userSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscription?.status === "active" &&
    (!this.subscription.endDate || this.subscription.endDate > new Date())
  );
};

userSchema.methods.isPremiumUser = function () {
  return (
    this.role === "admin" ||
    (this.hasActiveSubscription() &&
      ["one-time", "pro"].includes(this.subscription.tier))
  );
};

userSchema.methods.canAccessFeature = function (feature) {
  if (this.role === "admin") return true;

  const tier = this.subscription.tier;

  const featureAccess = {
    free: ["basic-resume", "one-template"],
    "one-time": [
      "basic-resume",
      "all-templates",
      "ats-score",
    ],
    pro: [
      "unlimited-resumes",
      "all-templates",
      "ats-score",
      "cover-letter",
      "job-match",
      "portfolio",
      "analytics",
      "ai-resume-extraction",
    ],
  };

  return featureAccess[tier]?.includes(feature) || false;
};

userSchema.methods.getUsageLimit = function (limitType) {
  // Admin users have unlimited access to all features
  if (this.role === "admin") {
    return Infinity;
  }

  const tier = this.subscription.tier;

  const limits = {
    free: {
      resumesPerMonth: 1,
      resumeDownloadsPerMonth: 1,
      atsScansPerMonth: 0,
      jobMatchesPerDay: 0,
      coverLettersPerMonth: 0,
      aiGenerationsPerMonth: 10, // 10 AI feature usage for free users
      aiResumeExtractionsPerDay: 1, // 1 AI resume extraction per day for free users
    },
    "one-time": {
      resumesPerMonth: 1, // One-time purchase allows creating only 1 NEW resume
      resumeDownloadsPerMonth: Infinity, // Unlimited downloads
      atsScansPerMonth: 1,
      jobMatchesPerDay: 0,
      coverLettersPerMonth: 0,
      aiGenerationsPerMonth: 150, // 150 AI requests for 21-day period (not monthly!)
      aiResumeExtractionsPerDay: 0,
    },
    pro: {
      resumesPerMonth: Infinity,
      resumeDownloadsPerMonth: Infinity,
      atsScansPerMonth: Infinity,
      jobMatchesPerDay: 0,
      coverLettersPerMonth: Infinity,
      aiResumeExtractionsPerDay: 2,
      aiGenerationsPerMonth: Infinity,
    },
  };

  return limits[tier]?.[limitType] || 0;
};

userSchema.methods.hasReachedLimit = function (limitType) {
  // Admin users never reach any limits
  if (this.role === "admin") {
    return false;
  }

  const limit = this.getUsageLimit(limitType);
  if (limit === Infinity) return false;

  const usageMap = {
    resumesPerMonth: this.usage.resumesThisMonth,
    resumeDownloadsPerMonth: this.usage.resumesDownloadedThisMonth,
    atsScansPerMonth: this.usage.atsScansThisMonth,
    jobMatchesPerDay: this.usage.jobMatchesToday,
    coverLettersPerMonth: this.usage.coverLettersThisMonth,
    aiGenerationsPerMonth: this.usage.aiGenerationsThisMonth,
    aiResumeExtractionsPerDay: this.usage.aiResumeExtractionsToday,
  };

  return (usageMap[limitType] || 0) >= limit;
};

userSchema.methods.incrementUsage = async function (usageType) {
  // Admin users' usage is not tracked
  if (this.role === "admin") {
    return;
  }

  const usageMap = {
    resume: {total: "resumesCreated", monthly: "resumesThisMonth"},
    download: {
      total: "resumesDownloaded",
      monthly: "resumesDownloadedThisMonth",
    },
    ats: {total: "atsScans", monthly: "atsScansThisMonth"},
    jobMatch: {total: "jobMatches", daily: "jobMatchesToday"},
    coverLetter: {total: "coverLetters", monthly: "coverLettersThisMonth"},
    aiGeneration: {
      total: "aiGenerationsUsed",
      monthly: "aiGenerationsThisMonth",
    },
  };

  const fields = usageMap[usageType];
  if (fields) {
    this.usage[fields.total]++;
    if (fields.monthly) this.usage[fields.monthly]++;
    if (fields.daily) this.usage[fields.daily]++;
    await this.save();
  }
};

userSchema.methods.resetMonthlyUsage = async function () {
  this.usage.resumesThisMonth = 0;
  this.usage.resumesDownloadedThisMonth = 0;
  this.usage.atsScansThisMonth = 0;
  this.usage.coverLettersThisMonth = 0;
  this.usage.aiGenerationsThisMonth = 0;
  this.usage.lastResetDate = new Date();
  await this.save();
};

userSchema.methods.resetDailyUsage = async function () {
  this.usage.jobMatchesToday = 0;
  this.usage.aiResumeExtractionsToday = 0;
  this.usage.lastDailyReset = new Date();
  await this.save();
};

// Check if subscription has expired
userSchema.methods.checkSubscriptionExpiry = async function () {
  if (this.subscription.endDate && this.subscription.endDate < new Date()) {
    if (this.subscription.status === "active") {
      this.subscription.tier = "free";
      this.subscription.plan = "free";
      this.subscription.status = "active";
      this.subscription.endDate = undefined;
      this.subscription.autoRenew = false;

      await this.save();
      return true; // Subscription expired
    }
  }
  return false; // Still active
};

const User = mongoose.model("User", userSchema);

export default User;

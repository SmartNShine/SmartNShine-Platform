import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeTitle: {
      type: String,
      default: "Untitled Resume",
    },
    description: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "Untitled Resume",
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      socialLinks: [{ type: String, trim: true, maxlength: 500 }],
      portfolio: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    summary: {
      type: String,
      default: "",
    },
    skills: [
      {
        category: String,
        items: [String],
      },
    ],
    experience: [
      {
        company: String,
        title: String,
        position: String,
        role: String,
        location: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        description: String,
        summary: String,
        bullets: [String],
      },
    ],
    education: [
      {
        institution: String,
        school: String,
        degree: String,
        field: String,
        major: String,
        location: String,
        startDate: String,
        endDate: String,
        year: String,
        gpa: String,
        grade: String,
        description: String,
        bullets: [String],
      },
    ],
    projects: [
      {
        name: String,
        title: String,
        description: String,
        summary: String,
        technologies: [String],
        link: String,
        projectUrl: String,
        liveUrl: String,
        github: String,
        githubUrl: String,
        repoUrl: String,
        websiteUrl: String,
        highlights: [String],
        bullets: [String],
      },
    ],
    certifications: [
      {
        name: String,
        title: String,
        issuer: String,
        date: String,
        credentialId: String,
        link: String,
      },
    ],
    achievements: {
      type: [String],
      default: [],
    },
    customSections: [
      {
        id: String,
        title: String,
        content: String,
        items: [mongoose.Schema.Types.Mixed],
      },
    ],
    sectionOrder: {
      type: [String],
      default: undefined,
    },
    sectionTitles: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    targetJobRole: {
      type: String,
      default: "",
    },
    rawText: {
      type: String,
      default: "",
    },
    templateId: {
      type: String,
      default: "classic",
    },
    colorTheme: {
      type: String,
      default: null, // Will use template's default if not specified
    },
    selectedTheme: {
      type: String,
      default: null,
    },
    // Subscription tracking for access control
    subscriptionInfo: {
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
      },
      createdWithTier: {
        type: String,
        enum: ["free", "one-time", "pro"],
        default: "free",
      },
      createdWithSubscription: {
        type: Boolean,
        default: false,
      },
      linkedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;

import mongoose from "mongoose";

const socialLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "linkedin",
        "github",
        "twitter",
        "website",
        "leetcode",
        "behance",
        "dribbble",
        "other",
      ],
      default: "other",
    },
  },
  {_id: false}
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    tagline: {
      type: String,
      trim: true,
      default: "",
    },
    professionalTitle: {
      type: String,
      trim: true,
      default: "",
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    heroImage: {
      type: String,
      trim: true,
      default: "",
    },
    themeId: {
      type: String,
      trim: true,
      default: "minimalDeveloper",
    },
    themeAccent: {
      type: String,
      trim: true,
      default: "",
    },
    colorPreset: {
      type: String,
      trim: true,
      default: "default",
    },
    fontPreset: {
      type: String,
      trim: true,
      default: "inter",
    },
    status: {
      type: String,
      enum: ["draft", "published", "unpublished"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      showEmail: {
        type: Boolean,
        default: true,
      },
      showPhone: {
        type: Boolean,
        default: false,
      },
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: [],
    },
    skills: {
      type: [
        {
          category: String,
          items: [String],
        },
      ],
      default: [],
    },
    experience: {
      type: [
        {
          company: String,
          title: String,
          location: String,
          startDate: String,
          endDate: String,
          current: Boolean,
          bullets: [String],
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          institution: String,
          degree: String,
          field: String,
          location: String,
          startDate: String,
          endDate: String,
          gpa: String,
          bullets: [String],
        },
      ],
      default: [],
    },
    certifications: {
      type: [
        {
          name: String,
          issuer: String,
          date: String,
          credentialId: String,
          link: String,
        },
      ],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    customSections: {
      type: [
        {
          id: String,
          title: String,
          content: {
            type: String,
            default: "",
          },
          // Resume editor stores rich entries (title, date, bullets); legacy rows may be plain strings
          items: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
          },
        },
      ],
      default: [],
    },
    sections: {
      showAbout: {
        type: Boolean,
        default: true,
      },
      showSkills: {
        type: Boolean,
        default: true,
      },
      showProjects: {
        type: Boolean,
        default: true,
      },
      showExperience: {
        type: Boolean,
        default: true,
      },
      showEducation: {
        type: Boolean,
        default: true,
      },
      showCertifications: {
        type: Boolean,
        default: true,
      },
      showAchievements: {
        type: Boolean,
        default: true,
      },
      showCustomSections: {
        type: Boolean,
        default: true,
      },
      showContact: {
        type: Boolean,
        default: true,
      },
    },
    sectionOrder: {
      type: [String],
      default: [
        "about",
        "skills",
        "projects",
        "experience",
        "education",
        "certifications",
        "achievements",
        "customSections",
        "contact",
      ],
    },
    seo: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
      keywords: {
        type: [String],
        default: [],
      },
      ogImage: {
        type: String,
        trim: true,
        default: "",
      },
      favicon: {
        type: String,
        trim: true,
        default: "",
      },
    },
    settings: {
      showResumeDownload: {
        type: Boolean,
        default: true,
      },
      showSmartNShineBranding: {
        type: Boolean,
        default: true,
      },
      allowIndexing: {
        type: Boolean,
        default: true,
      },
    },
    analytics: {
      totalViews: {
        type: Number,
        default: 0,
      },
      resumeDownloads: {
        type: Number,
        default: 0,
      },
      contactClicks: {
        type: Number,
        default: 0,
      },
      projectClicks: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

portfolioSchema.index({userId: 1, resumeId: 1});
portfolioSchema.index({status: 1, publishedAt: -1});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;

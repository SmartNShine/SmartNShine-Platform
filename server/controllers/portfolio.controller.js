import mongoose from "mongoose";
import Portfolio from "../models/Portfolio.model.js";
import PortfolioProject from "../models/PortfolioProject.model.js";
import Resume from "../models/Resume.model.js";
import User from "../models/User.model.js";
import {chatCompletion} from "../services/openai.service.js";
import {trackAIUsage} from "../middleware/aiUsageTracker.middleware.js";
import {
  createPdfExportSession,
  deletePdfExportSession,
} from "../services/pdfExportSession.service.js";
import {renderResumePdf} from "../services/pdfExport.service.js";
import {cloudinaryService} from "../services/cloudinary.service.js";
import {normalizePortfolioCustomSections} from "../utils/portfolioCustomSections.js";

const DEFAULT_SECTION_ORDER = [
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certifications",
  "achievements",
  "customSections",
  "contact",
];

const VALID_SOCIAL_TYPES = new Set([
  "linkedin",
  "github",
  "twitter",
  "website",
  "leetcode",
  "behance",
  "dribbble",
  "other",
]);

const getUserId = (req) => req.user?._id || req.user?.userId;

const normalizeSlug = (value) => {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "portfolio";
};

const isValidUrl = (value) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const getFirstProfessionalTitle = (resume) => {
  return (
    resume?.experience?.find((item) => item?.title)?.title ||
    resume?.resumeTitle ||
    ""
  );
};

const getSocialLinksFromResume = (resume) => {
  const links = [];
  const contact = resume?.contact || {};

  if (contact.linkedin) {
    links.push({
      label: "LinkedIn",
      url: contact.linkedin,
      type: "linkedin",
    });
  }

  if (contact.github) {
    links.push({
      label: "GitHub",
      url: contact.github,
      type: "github",
    });
  }

  if (contact.portfolio) {
    links.push({
      label: "Website",
      url: contact.portfolio,
      type: "website",
    });
  }

  return links.filter((link) => isValidUrl(link.url));
};

const createUniqueSlug = async (baseValue, ignoredPortfolioId = null) => {
  const baseSlug = normalizeSlug(baseValue);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await Portfolio.exists({
      slug: candidate,
      ...(ignoredPortfolioId && {_id: {$ne: ignoredPortfolioId}}),
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const validateUrlFields = (fields) => {
  const invalidField = Object.entries(fields).find(([, value]) => {
    if (Array.isArray(value)) {
      return value.some((item) => item && !isValidUrl(item));
    }

    return value && !isValidUrl(value);
  });

  return invalidField?.[0] || null;
};

const validateSocialLinks = (links = []) => {
  if (!Array.isArray(links)) {
    return "Social links must be an array";
  }

  for (const link of links) {
    if (!isValidUrl(link?.url)) {
      return "Social links must use valid http or https URLs";
    }

    if (link?.type && !VALID_SOCIAL_TYPES.has(link.type)) {
      return `Unsupported social link type: ${link.type}`;
    }
  }

  return null;
};

const getOwnedPortfolio = async (portfolioId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(portfolioId)) {
    return null;
  }

  return Portfolio.findOne({_id: portfolioId, userId});
};

const mapResumeProjectsToPortfolioProjects = (
  resumeProjects = [],
  userId,
  portfolioId
) => {
  return (resumeProjects || []).map((project, index) => {
    const liveCandidate =
      project.liveUrl ||
      project.link ||
      project.projectUrl ||
      project.websiteUrl ||
      project.demoUrl ||
      project.url ||
      "";
    const githubCandidate =
      project.githubUrl ||
      project.github ||
      project.repoUrl ||
      project.repo ||
      project.sourceCode ||
      "";
    const caseStudyCandidate =
      project.caseStudyUrl ||
      project.caseStudy ||
      project.links?.caseStudy ||
      "";

    const live = isValidUrl(liveCandidate) ? liveCandidate : "";
    const github = isValidUrl(githubCandidate) ? githubCandidate : "";
    const caseStudy = isValidUrl(caseStudyCandidate) ? caseStudyCandidate : "";

    const rawBullets =
      Array.isArray(project.bullets) && project.bullets.length > 0
        ? project.bullets
        : Array.isArray(project.highlights) && project.highlights.length > 0
        ? project.highlights
        : typeof project.description === "string" &&
          project.description.includes("\n")
        ? project.description
            .split("\n")
            .map((s) => s.replace(/^[-•*]\s*/, "").trim())
            .filter(Boolean)
        : [];

    const rawTech = Array.isArray(project.technologies)
      ? project.technologies
      : typeof project.technologies === "string"
      ? project.technologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return {
      userId,
      portfolioId,
      resumeProjectId: project._id?.toString() || `proj-${index}`,
      title: project.title || project.name || `Project ${index + 1}`,
      shortDescription:
        project.shortDescription ||
        project.description ||
        rawBullets[0] ||
        "",
      longDescription:
        project.longDescription ||
        (rawBullets.length > 0 ? rawBullets.join("\n") : project.description || ""),
      problem: project.problem || "",
      solution: project.solution || "",
      impact: project.impact || "",
      technologies: rawTech,
      links: {
        live,
        github,
        caseStudy,
      },
      highlights: rawBullets,
      featured: index < 3,
      order: index,
      visible: true,
    };
  });
};

const getPortfolioWithProjects = async (portfolio) => {
  const [resume, existingProjects] = await Promise.all([
    portfolio.resumeId
      ? Resume.findOne({
          _id: portfolio.resumeId,
          userId: portfolio.userId,
        })
      : null,
    PortfolioProject.find({
      portfolioId: portfolio._id,
    }).sort({order: 1, createdAt: 1}),
  ]);

  let projects = existingProjects;

  // If no PortfolioProject records exist yet, but resume has projects, auto-populate them
  if (
    (!projects || projects.length === 0) &&
    resume?.projects &&
    resume.projects.length > 0
  ) {
    try {
      const projectPayloads = mapResumeProjectsToPortfolioProjects(
        resume.projects,
        portfolio.userId,
        portfolio._id
      );
      projects = await PortfolioProject.insertMany(projectPayloads, {
        ordered: true,
      });
    } catch (err) {
      console.warn("Auto-populating PortfolioProjects failed:", err);
      projects = mapResumeProjectsToPortfolioProjects(
        resume.projects,
        portfolio.userId,
        portfolio._id
      );
    }
  }

  return {
    portfolio,
    resume: buildPortfolioResumeSnapshot(portfolio, resume),
    projects,
  };
};

const handleDuplicateSlug = (error, res) => {
  if (error?.code === 11000 && error?.keyPattern?.slug) {
    res.status(409).json({
      error: "Portfolio slug is already taken",
    });
    return true;
  }

  return false;
};

const buildPublicPayload = (portfolio, resume, projects) => {
  const portfolioObject = portfolio.toObject();
  const resumeObject = resume?.toObject ? resume.toObject() : resume;
  const portfolioResume = buildPortfolioResumeSnapshot(
    portfolioObject,
    resumeObject
  );

  let finalProjects = projects;
  if (
    (!finalProjects || finalProjects.length === 0) &&
    resumeObject?.projects?.length > 0
  ) {
    finalProjects = mapResumeProjectsToPortfolioProjects(
      resumeObject.projects,
      portfolioObject.userId,
      portfolioObject._id
    );
  }

  return {
    portfolio: {
      id: portfolioObject._id,
      slug: portfolioObject.slug,
      title: portfolioObject.title,
      tagline: portfolioObject.tagline,
      professionalTitle: portfolioObject.professionalTitle,
      about: portfolioObject.about,
      location: portfolioObject.location,
      profileImage: portfolioObject.profileImage,
      heroImage: portfolioObject.heroImage,
      themeId: portfolioObject.themeId,
      themeAccent: portfolioObject.themeAccent,
      colorPreset: portfolioObject.colorPreset,
      fontPreset: portfolioObject.fontPreset,
      socialLinks: portfolioObject.socialLinks,
      sections: portfolioObject.sections,
      sectionOrder: portfolioObject.sectionOrder,
      seo: portfolioObject.seo,
      settings: portfolioObject.settings,
      publishedAt: portfolioObject.publishedAt,
      contact: {
        email: portfolioObject.contact?.showEmail
          ? portfolioObject.contact?.email
          : "",
        phone: portfolioObject.contact?.showPhone
          ? portfolioObject.contact?.phone
          : "",
        showEmail: portfolioObject.contact?.showEmail,
        showPhone: portfolioObject.contact?.showPhone,
      },
    },
    resume: portfolioResume,
    projects: finalProjects,
  };
};

const usePortfolioArrayOrResume = (portfolioValue, resumeValue) => {
  if (Array.isArray(portfolioValue) && portfolioValue.length > 0) {
    return portfolioValue;
  }
  if (Array.isArray(resumeValue) && resumeValue.length > 0) {
    return resumeValue;
  }
  return portfolioValue || resumeValue || [];
};

const buildPortfolioResumeSnapshot = (portfolio, resume) => {
  const portfolioObject = portfolio?.toObject
    ? portfolio.toObject()
    : portfolio;
  const resumeObject = resume?.toObject ? resume.toObject() : resume;

  return {
    name: resumeObject?.name || portfolioObject?.title || "",
    summary: portfolioObject?.about || resumeObject?.summary || "",
    skills: usePortfolioArrayOrResume(
      portfolioObject?.skills,
      resumeObject?.skills
    ),
    experience: usePortfolioArrayOrResume(
      portfolioObject?.experience,
      resumeObject?.experience
    ),
    education: usePortfolioArrayOrResume(
      portfolioObject?.education,
      resumeObject?.education
    ),
    projects: (resumeObject?.projects || []).map((p) => ({
      name: p.name || p.title || "Project",
      description: p.description || p.shortDescription || "",
      technologies: p.technologies || [],
      link: p.link || p.liveUrl || p.githubUrl || p.github || "",
      bullets: p.bullets || p.highlights || [],
    })),
    certifications: usePortfolioArrayOrResume(
      portfolioObject?.certifications,
      resumeObject?.certifications
    ),
    achievements: usePortfolioArrayOrResume(
      portfolioObject?.achievements,
      resumeObject?.achievements
    ),
    customSections: usePortfolioArrayOrResume(
      portfolioObject?.customSections,
      resumeObject?.customSections
    ),
  };
};

const getSocialUrl = (links = [], type) => {
  return links.find((link) => link?.type === type && link?.url)?.url || "";
};

const buildPublicResumePdfData = ({portfolio, resume, projects}) => {
  const portfolioObject = portfolio?.toObject
    ? portfolio.toObject()
    : portfolio;
  const resumeObject = resume?.toObject ? resume.toObject() : resume;
  const socialLinks = portfolioObject?.socialLinks || [];

  return {
    ...(resumeObject || {}),
    name: resumeObject?.name || portfolioObject?.title || "Resume",
    resumeTitle:
      resumeObject?.resumeTitle ||
      portfolioObject?.professionalTitle ||
      portfolioObject?.title ||
      "Portfolio Resume",
    contact: {
      ...(resumeObject?.contact || {}),
      email:
        portfolioObject?.contact?.showEmail !== false
          ? portfolioObject?.contact?.email ||
            resumeObject?.contact?.email ||
            ""
          : "",
      phone: portfolioObject?.contact?.showPhone
        ? portfolioObject?.contact?.phone || resumeObject?.contact?.phone || ""
        : "",
      location:
        portfolioObject?.location || resumeObject?.contact?.location || "",
      linkedin:
        getSocialUrl(socialLinks, "linkedin") ||
        resumeObject?.contact?.linkedin ||
        "",
      github:
        getSocialUrl(socialLinks, "github") ||
        resumeObject?.contact?.github ||
        "",
      portfolio:
        getSocialUrl(socialLinks, "website") ||
        resumeObject?.contact?.portfolio ||
        "",
    },
    summary: portfolioObject?.about || resumeObject?.summary || "",
    skills: usePortfolioArrayOrResume(
      portfolioObject?.skills,
      resumeObject?.skills
    ),
    experience: usePortfolioArrayOrResume(
      portfolioObject?.experience,
      resumeObject?.experience
    ),
    education: usePortfolioArrayOrResume(
      portfolioObject?.education,
      resumeObject?.education
    ),
    projects: (projects || []).map((project) => ({
      name: project.title || "Project",
      description:
        project.shortDescription ||
        project.description ||
        project.longDescription ||
        "",
      technologies: project.technologies || [],
      link: project.links?.live || project.links?.github || "",
      bullets:
        project.highlights?.length > 0
          ? project.highlights
          : [project.problem, project.solution, project.impact].filter(Boolean),
    })),
    certifications: usePortfolioArrayOrResume(
      portfolioObject?.certifications,
      resumeObject?.certifications
    ),
    achievements: usePortfolioArrayOrResume(
      portfolioObject?.achievements,
      resumeObject?.achievements
    ),
    customSections: usePortfolioArrayOrResume(
      portfolioObject?.customSections,
      resumeObject?.customSections
    ),
    templateId: resumeObject?.templateId || "classic",
    colorTheme: resumeObject?.colorTheme || null,
  };
};

const parseJsonResponse = (text) => {
  const trimmed = String(text || "").trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const jsonMatch = withoutFence.match(/\{[\s\S]*\}/);

  return JSON.parse(jsonMatch ? jsonMatch[0] : withoutFence);
};

const getPortfolioAIContext = async (portfolio) => {
  const [resume, projects] = await Promise.all([
    portfolio.resumeId
      ? Resume.findOne({
          _id: portfolio.resumeId,
          userId: portfolio.userId,
        })
      : null,
    PortfolioProject.find({
      portfolioId: portfolio._id,
      userId: portfolio.userId,
    }).sort({order: 1, createdAt: 1}),
  ]);

  return {resume, projects};
};

const trackPortfolioAIUsage = async ({
  req,
  startTime,
  tokenUsage,
  status = "success",
  errorMessage = null,
}) => {
  const userId = getUserId(req);

  await trackAIUsage(
    userId,
    "ai_suggestions",
    tokenUsage?.totalTokens || 0,
    Date.now() - startTime,
    status,
    errorMessage,
    "openai",
    "gpt4o"
  );

  if (status === "success") {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "usage.aiGenerationsUsed": 1,
        "usage.aiGenerationsThisMonth": 1,
      },
    });
  }
};

const resolveThemeSelection = (body = {}) => {
  const themeId =
    typeof body.themeId === "string" && body.themeId.trim()
      ? body.themeId.trim()
      : "smartnshine";
  const themeAccent =
    typeof body.themeAccent === "string" ? body.themeAccent.trim() : "";

  return {themeId, themeAccent};
};

export const createBlankPortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {themeId, themeAccent} = resolveThemeSelection(req.body);
    const user = await User.findById(userId).select("name email");
    const displayName = user?.name?.trim() || "My";
    const title =
      typeof req.body?.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : `${displayName}'s Portfolio`;
    const slug = await createUniqueSlug(title);

    const portfolio = await Portfolio.create({
      userId,
      resumeId: null,
      slug,
      title,
      tagline: "",
      professionalTitle: "",
      about: "",
      location: "",
      themeId,
      themeAccent,
      contact: {
        email: user?.email || "",
        phone: "",
        showEmail: Boolean(user?.email),
        showPhone: false,
      },
      socialLinks: [],
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      achievements: [],
      customSections: [],
      seo: {
        title,
        description: "",
        keywords: [displayName].filter(Boolean),
      },
      sectionOrder: DEFAULT_SECTION_ORDER,
    });

    res.status(201).json({
      message: "Blank portfolio draft created successfully",
      portfolio,
      projects: [],
    });
  } catch (error) {
    if (handleDuplicateSlug(error, res)) return;

    console.error("Create blank portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to create portfolio",
    });
  }
};

export const createPortfolioFromResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {resumeId} = req.params;
    const {themeId, themeAccent} = resolveThemeSelection(req.body);

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({error: "Invalid resume ID"});
    }

    const resume = await Resume.findOne({_id: resumeId, userId});

    if (!resume) {
      return res.status(404).json({error: "Resume not found"});
    }

    const professionalTitle = getFirstProfessionalTitle(resume);
    const slug = await createUniqueSlug(
      `${resume.name || "portfolio"} ${professionalTitle}`
    );

    const portfolio = await Portfolio.create({
      userId,
      resumeId: resume._id,
      slug,
      title: `${resume.name}'s Portfolio`,
      tagline: resume.summary || "",
      professionalTitle,
      about: resume.summary || "",
      location: resume.contact?.location || "",
      themeId,
      themeAccent,
      contact: {
        email: resume.contact?.email || "",
        phone: resume.contact?.phone || "",
        showEmail: Boolean(resume.contact?.email),
        showPhone: false,
      },
      socialLinks: getSocialLinksFromResume(resume),
      skills: resume.skills || [],
      experience: resume.experience || [],
      education: resume.education || [],
      certifications: resume.certifications || [],
      achievements: resume.achievements || [],
      customSections: normalizePortfolioCustomSections(resume.customSections || []),
      seo: {
        title: `${resume.name} | ${professionalTitle || "Portfolio"}`,
        description: resume.summary || "",
        keywords: [
          resume.name,
          professionalTitle,
          ...(resume.skills || []).flatMap((group) => group.items || []),
        ].filter(Boolean),
      },
      sectionOrder: DEFAULT_SECTION_ORDER,
    });

    const copiedProjects = await PortfolioProject.insertMany(
      mapResumeProjectsToPortfolioProjects(
        resume.projects || [],
        userId,
        portfolio._id
      ),
      {ordered: true}
    );

    res.status(201).json({
      message: "Portfolio created from resume successfully",
      portfolio,
      projects: copiedProjects,
    });
  } catch (error) {
    if (handleDuplicateSlug(error, res)) return;

    console.error("Create portfolio from resume error:", error);
    res.status(500).json({
      error: error.message || "Failed to create portfolio",
    });
  }
};

export const getPortfolios = async (req, res) => {
  try {
    const userId = getUserId(req);

    const portfolios = await Portfolio.find({userId})
      .select(
        "resumeId slug title professionalTitle themeId status publishedAt analytics updatedAt createdAt"
      )
      .sort({updatedAt: -1});

    res.json({
      message: "Portfolios retrieved successfully",
      portfolios,
    });
  } catch (error) {
    console.error("Get portfolios error:", error);
    res.status(500).json({
      error: error.message || "Failed to retrieve portfolios",
    });
  }
};

export const getPortfolioById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const payload = await getPortfolioWithProjects(portfolio);
    res.json(payload);
  } catch (error) {
    console.error("Get portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to retrieve portfolio",
    });
  }
};

export const updatePortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const {
      slug,
      title,
      tagline,
      professionalTitle,
      about,
      location,
      profileImage,
      heroImage,
      themeId,
      themeAccent,
      colorPreset,
      fontPreset,
      contact,
      socialLinks,
      skills,
      experience,
      education,
      certifications,
      achievements,
      customSections,
      sections,
      sectionOrder,
      seo,
      settings,
    } = req.body;

    const urlError = validateUrlFields({
      profileImage,
      heroImage,
      ogImage: seo?.ogImage,
      favicon: seo?.favicon,
    });

    if (urlError) {
      return res.status(400).json({
        error: `${urlError} must be a valid http or https URL`,
      });
    }

    const socialError = validateSocialLinks(socialLinks);
    if (socialError) {
      return res.status(400).json({error: socialError});
    }

    if (slug !== undefined) {
      portfolio.slug = await createUniqueSlug(slug, portfolio._id);
    }

    // Clean up old Cloudinary images if replaced or removed
    if (profileImage !== undefined && portfolio.profileImage && portfolio.profileImage !== profileImage) {
      if (portfolio.profileImage.includes("cloudinary.com")) {
        cloudinaryService.deleteImage(portfolio.profileImage).catch((err) =>
          console.warn("Could not delete old profileImage:", err.message)
        );
      }
    }

    if (heroImage !== undefined && portfolio.heroImage && portfolio.heroImage !== heroImage) {
      if (portfolio.heroImage.includes("cloudinary.com")) {
        cloudinaryService.deleteImage(portfolio.heroImage).catch((err) =>
          console.warn("Could not delete old heroImage:", err.message)
        );
      }
    }

    // Keep saved custom-section assets intact until the database write succeeds.
    const previousCustomImages = (portfolio.customSections || [])
      .flatMap((section) => (section.items || []).map((item) => item?.image))
      .filter(Boolean);

    const scalarUpdates = {
      title,
      tagline,
      professionalTitle,
      about,
      location,
      profileImage,
      heroImage,
      themeId,
      themeAccent,
      colorPreset,
      fontPreset,
    };

    Object.entries(scalarUpdates).forEach(([key, value]) => {
      if (value !== undefined) {
        portfolio[key] = value;
      }
    });

    if (contact !== undefined) {
      portfolio.contact = {
        ...portfolio.contact.toObject?.(),
        ...contact,
      };
      portfolio.markModified("contact");
    }

    if (socialLinks !== undefined) {
      portfolio.socialLinks = socialLinks;
    }

    const portfolioSectionUpdates = {
      skills,
      experience,
      education,
      certifications,
      achievements,
      customSections,
    };

    Object.entries(portfolioSectionUpdates).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === "customSections") {
        portfolio.customSections = normalizePortfolioCustomSections(value);
        portfolio.markModified("customSections");
        return;
      }
      portfolio[key] = value;
    });

    if (sections !== undefined) {
      portfolio.sections = {
        ...portfolio.sections.toObject?.(),
        ...sections,
      };
      portfolio.markModified("sections");
    }

    if (sectionOrder !== undefined) {
      portfolio.sectionOrder = Array.isArray(sectionOrder)
        ? sectionOrder
        : portfolio.sectionOrder;
    }

    if (seo !== undefined) {
      portfolio.seo = {
        ...portfolio.seo.toObject?.(),
        ...seo,
      };
      portfolio.markModified("seo");
    }

    if (settings !== undefined) {
      portfolio.settings = {
        ...portfolio.settings.toObject?.(),
        ...settings,
      };
      portfolio.markModified("settings");
    }

    await portfolio.save();

    const retainedImages = JSON.stringify(portfolio.toObject());
    for (const url of new Set(previousCustomImages)) {
      if (url.includes("cloudinary.com") && !retainedImages.includes(JSON.stringify(url))) {
        cloudinaryService.deleteImage(url).catch((err) =>
          console.warn("Could not delete old custom-section image:", err.message)
        );
      }
    }

    res.json({
      message: "Portfolio updated successfully",
      portfolio,
    });
  } catch (error) {
    if (handleDuplicateSlug(error, res)) return;

    console.error("Update portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to update portfolio",
    });
  }
};

export const deletePortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    // Delete any associated Cloudinary images
    if (portfolio.profileImage && portfolio.profileImage.includes("cloudinary.com")) {
      cloudinaryService.deleteImage(portfolio.profileImage).catch(() => {});
    }
    if (portfolio.heroImage && portfolio.heroImage.includes("cloudinary.com")) {
      cloudinaryService.deleteImage(portfolio.heroImage).catch(() => {});
    }

    await PortfolioProject.deleteMany({portfolioId: portfolio._id, userId});
    await portfolio.deleteOne();

    res.json({
      message: "Portfolio deleted successfully",
    });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to delete portfolio",
    });
  }
};

export const createPortfolioProject = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    if (!req.body.title) {
      return res.status(400).json({error: "Project title is required"});
    }

    const urlError = validateUrlFields({
      live: req.body.links?.live,
      github: req.body.links?.github,
      caseStudy: req.body.links?.caseStudy,
      video: req.body.links?.video,
      images: (req.body.images || []).map((image) => image.url),
    });

    if (urlError) {
      return res.status(400).json({
        error: `${urlError} must be a valid http or https URL`,
      });
    }

    const projectCount = await PortfolioProject.countDocuments({
      portfolioId: portfolio._id,
    });

    const project = await PortfolioProject.create({
      ...req.body,
      userId,
      portfolioId: portfolio._id,
      order: req.body.order ?? projectCount,
    });

    res.status(201).json({
      message: "Portfolio project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create portfolio project error:", error);
    res.status(500).json({
      error: error.message || "Failed to create portfolio project",
    });
  }
};

export const updatePortfolioProject = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const project = await PortfolioProject.findOne({
      _id: req.params.projectId,
      portfolioId: portfolio._id,
      userId,
    });

    if (!project) {
      return res.status(404).json({error: "Portfolio project not found"});
    }

    const urlError = validateUrlFields({
      live: req.body.links?.live,
      github: req.body.links?.github,
      caseStudy: req.body.links?.caseStudy,
      video: req.body.links?.video,
      images: (req.body.images || []).map((image) => image.url),
    });

    if (urlError) {
      return res.status(400).json({
        error: `${urlError} must be a valid http or https URL`,
      });
    }

    const allowedFields = [
      "title",
      "shortDescription",
      "longDescription",
      "problem",
      "solution",
      "impact",
      "technologies",
      "role",
      "duration",
      "links",
      "images",
      "highlights",
      "featured",
      "order",
      "visible",
    ];

    const previousImageUrls = (project.images || []).map((image) => image.url).filter(Boolean);

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    const retainedImages = JSON.stringify(project.toObject());
    for (const url of new Set(previousImageUrls)) {
      if (url.includes("cloudinary.com") && !retainedImages.includes(JSON.stringify(url))) {
        cloudinaryService.deleteImage(url).catch((err) =>
          console.warn("Could not delete old project image:", err.message)
        );
      }
    }

    res.json({
      message: "Portfolio project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update portfolio project error:", error);
    res.status(500).json({
      error: error.message || "Failed to update portfolio project",
    });
  }
};

export const deletePortfolioProject = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const project = await PortfolioProject.findOneAndDelete({
      _id: req.params.projectId,
      portfolioId: portfolio._id,
      userId,
    });

    if (!project) {
      return res.status(404).json({error: "Portfolio project not found"});
    }

    res.json({
      message: "Portfolio project deleted successfully",
    });
  } catch (error) {
    console.error("Delete portfolio project error:", error);
    res.status(500).json({
      error: error.message || "Failed to delete portfolio project",
    });
  }
};

export const publishPortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const visibleSectionCount = Object.values(
      portfolio.sections?.toObject?.() || portfolio.sections || {}
    ).filter(Boolean).length;
    const hasContact =
      portfolio.contact?.email ||
      portfolio.contact?.phone ||
      portfolio.socialLinks?.some((link) => link.url);

    if (!portfolio.title && !portfolio.professionalTitle) {
      return res.status(400).json({
        error: "Add a title or professional title before publishing",
      });
    }

    if (!hasContact) {
      return res.status(400).json({
        error: "Add at least one contact or social link before publishing",
      });
    }

    if (visibleSectionCount === 0) {
      return res.status(400).json({
        error: "Enable at least one portfolio section before publishing",
      });
    }

    portfolio.status = "published";
    portfolio.publishedAt = portfolio.publishedAt || new Date();
    await portfolio.save();

    res.json({
      message: "Portfolio published successfully",
      portfolio,
    });
  } catch (error) {
    console.error("Publish portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to publish portfolio",
    });
  }
};

export const unpublishPortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    portfolio.status = "unpublished";
    await portfolio.save();

    res.json({
      message: "Portfolio unpublished successfully",
      portfolio,
    });
  } catch (error) {
    console.error("Unpublish portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to unpublish portfolio",
    });
  }
};

export const getPublicPortfolio = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    const portfolio = await Portfolio.findOne({
      slug,
      status: "published",
    });

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const [resume, projects] = await Promise.all([
      portfolio.resumeId
        ? Resume.findOne({
            _id: portfolio.resumeId,
            userId: portfolio.userId,
          })
        : null,
      PortfolioProject.find({
        portfolioId: portfolio._id,
        visible: true,
      }).sort({featured: -1, order: 1, createdAt: 1}),
    ]);

    res.json(buildPublicPayload(portfolio, resume, projects));
  } catch (error) {
    console.error("Get public portfolio error:", error);
    res.status(500).json({
      error: error.message || "Failed to retrieve public portfolio",
    });
  }
};

export const trackPublicView = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      {slug: normalizeSlug(req.params.slug), status: "published"},
      {$inc: {"analytics.totalViews": 1}},
      {new: true}
    ).select("analytics");

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    res.json({message: "View tracked", analytics: portfolio.analytics});
  } catch (error) {
    console.error("Track portfolio view error:", error);
    res.status(500).json({
      error: error.message || "Failed to track portfolio view",
    });
  }
};

export const trackResumeDownload = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      {slug: normalizeSlug(req.params.slug), status: "published"},
      {$inc: {"analytics.resumeDownloads": 1}},
      {new: true}
    ).select("analytics");

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    res.json({
      message: "Resume download tracked",
      analytics: portfolio.analytics,
    });
  } catch (error) {
    console.error("Track resume download error:", error);
    res.status(500).json({
      error: error.message || "Failed to track resume download",
    });
  }
};

export const downloadPublicResume = async (req, res) => {
  let token = null;

  try {
    const slug = normalizeSlug(req.params.slug);
    console.info("[portfolio:resume-download] request received", {
      slug,
      ip: req.ip,
      origin: req.get("origin") || null,
      userAgent: req.get("user-agent") || null,
    });

    const portfolio = await Portfolio.findOne({
      slug,
      status: "published",
    });

    if (!portfolio) {
      console.warn("[portfolio:resume-download] portfolio not found", {slug});
      return res.status(404).json({error: "Portfolio not found"});
    }

    if (portfolio.settings?.showResumeDownload === false) {
      console.warn("[portfolio:resume-download] disabled by settings", {
        slug,
        portfolioId: portfolio._id.toString(),
      });
      return res.status(404).json({error: "Resume download is not available"});
    }

    console.info("[portfolio:resume-download] loading source data", {
      slug,
      portfolioId: portfolio._id.toString(),
      resumeId: portfolio.resumeId?.toString() || null,
      userId: portfolio.userId?.toString() || null,
    });

    const [resume, projects] = await Promise.all([
      portfolio.resumeId
        ? Resume.findOne({
            _id: portfolio.resumeId,
            userId: portfolio.userId,
          })
        : null,
      PortfolioProject.find({
        portfolioId: portfolio._id,
        visible: true,
      }).sort({featured: -1, order: 1, createdAt: 1}),
    ]);
    const resumeData = buildPublicResumePdfData({
      portfolio,
      resume,
      projects,
    });
    const template = resumeData.templateId || "classic";

    console.info("[portfolio:resume-download] rendering pdf", {
      slug,
      template,
      hasResume: Boolean(resume),
      projectCount: projects.length,
      baseUrl: req.get("origin") || null,
    });

    token = createPdfExportSession({resumeData, template});
    const pdfBuffer = await renderResumePdf(token, req.get("origin"));

    await Portfolio.findByIdAndUpdate(portfolio._id, {
      $inc: {"analytics.resumeDownloads": 1},
    });

    const safeName = (resumeData.name || portfolio.title || "Resume")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName || "Resume"}_Resume.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    console.info("[portfolio:resume-download] response ready", {
      slug,
      bytes: pdfBuffer.length,
      filename: `${safeName || "Resume"}_Resume.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("[portfolio:resume-download] failed", {
      slug: req.params.slug,
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: error.message || "Failed to download resume",
    });
  } finally {
    if (token) {
      deletePdfExportSession(token);
    }
  }
};

export const trackContactClick = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      {slug: normalizeSlug(req.params.slug), status: "published"},
      {$inc: {"analytics.contactClicks": 1}},
      {new: true}
    ).select("analytics");

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    res.json({
      message: "Contact click tracked",
      analytics: portfolio.analytics,
    });
  } catch (error) {
    console.error("Track contact click error:", error);
    res.status(500).json({
      error: error.message || "Failed to track contact click",
    });
  }
};

export const trackProjectClick = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      {slug: normalizeSlug(req.params.slug), status: "published"},
      {$inc: {"analytics.projectClicks": 1}},
      {new: true}
    ).select("analytics");

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    res.json({
      message: "Project click tracked",
      analytics: portfolio.analytics,
    });
  } catch (error) {
    console.error("Track project click error:", error);
    res.status(500).json({
      error: error.message || "Failed to track project click",
    });
  }
};

export const generatePortfolioAbout = async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const {resume, projects} = await getPortfolioAIContext(portfolio);
    const targetRole =
      req.body?.targetRole || portfolio.professionalTitle || "";
    const systemPrompt =
      "You are an expert career branding writer. Write concise, honest portfolio copy using only the supplied facts. Do not invent employers, metrics, or experience.";
    const userPrompt = `Create a polished portfolio About section.

Target role: ${targetRole || "Not specified"}
Portfolio title: ${portfolio.title}
Professional title: ${portfolio.professionalTitle}
Existing about: ${portfolio.about}

Resume:
${JSON.stringify(resume || {}, null, 2)}

Portfolio projects:
${JSON.stringify(projects || [], null, 2)}

Rules:
- 90 to 140 words.
- Professional but human.
- Mention strongest skills/projects if supported by data.
- No markdown.
- Return only the final about text.`;

    const result = await chatCompletion(systemPrompt, userPrompt, {
      temperature: 0.65,
      maxTokens: 500,
    });

    await trackPortfolioAIUsage({
      req,
      startTime,
      tokenUsage: result.tokenUsage,
    });

    res.json({
      message: "Portfolio about generated successfully",
      about: result.text.trim(),
    });
  } catch (error) {
    console.error("Generate portfolio about error:", error);
    await trackPortfolioAIUsage({
      req,
      startTime,
      status: "error",
      errorMessage: error.message,
    });
    res.status(500).json({
      error: error.message || "Failed to generate portfolio about section",
    });
  }
};

export const improvePortfolioProjectDescription = async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const project =
      req.body?.projectId && mongoose.Types.ObjectId.isValid(req.body.projectId)
        ? await PortfolioProject.findOne({
            _id: req.body.projectId,
            portfolioId: portfolio._id,
            userId,
          })
        : req.body?.project;

    if (!project) {
      return res.status(400).json({
        error: "Project data or projectId is required",
      });
    }

    const systemPrompt =
      "You are an expert portfolio writer. Improve project descriptions using only supplied facts. Return strict JSON.";
    const userPrompt = `Improve this portfolio project for recruiter readability.

Project:
${JSON.stringify(project, null, 2)}

Return ONLY valid JSON:
{
  "shortDescription": "35-55 words",
  "longDescription": "80-120 words",
  "highlights": ["specific highlight 1", "specific highlight 2", "specific highlight 3"]
}

Rules:
- Do not invent metrics, users, companies, or features.
- Keep language concrete and professional.
- Use the existing tech stack when available.`;

    const result = await chatCompletion(systemPrompt, userPrompt, {
      temperature: 0.55,
      maxTokens: 700,
    });
    const improved = parseJsonResponse(result.text);

    await trackPortfolioAIUsage({
      req,
      startTime,
      tokenUsage: result.tokenUsage,
    });

    res.json({
      message: "Project description improved successfully",
      project: improved,
    });
  } catch (error) {
    console.error("Improve portfolio project error:", error);
    await trackPortfolioAIUsage({
      req,
      startTime,
      status: "error",
      errorMessage: error.message,
    });
    res.status(500).json({
      error: error.message || "Failed to improve project description",
    });
  }
};

export const generatePortfolioSeo = async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({error: "Portfolio not found"});
    }

    const {resume, projects} = await getPortfolioAIContext(portfolio);
    const systemPrompt =
      "You are an SEO assistant for personal portfolio pages. Return strict JSON with concise metadata.";
    const userPrompt = `Generate SEO metadata for this portfolio.

Portfolio:
${JSON.stringify(portfolio, null, 2)}

Resume:
${JSON.stringify(resume || {}, null, 2)}

Projects:
${JSON.stringify(projects || [], null, 2)}

Return ONLY valid JSON:
{
  "title": "maximum 60 characters",
  "description": "maximum 155 characters",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}

Rules:
- Include the person's name when available.
- Avoid keyword stuffing.
- Keep it recruiter/search friendly.`;

    const result = await chatCompletion(systemPrompt, userPrompt, {
      temperature: 0.35,
      maxTokens: 450,
    });
    const seo = parseJsonResponse(result.text);

    await trackPortfolioAIUsage({
      req,
      startTime,
      tokenUsage: result.tokenUsage,
    });

    res.json({
      message: "Portfolio SEO generated successfully",
      seo,
    });
  } catch (error) {
    console.error("Generate portfolio SEO error:", error);
    await trackPortfolioAIUsage({
      req,
      startTime,
      status: "error",
      errorMessage: error.message,
    });
    res.status(500).json({
      error: error.message || "Failed to generate portfolio SEO",
    });
  }
};

export const uploadPortfolioImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const userId = getUserId(req);
    const { oldImageUrl } = req.body || {};

    const result = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
      folder: "smartnshine/portfolios",
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      publicId: `user_${userId || "anon"}_${Date.now()}`,
    });

    // If an old Cloudinary image was replaced, remove it from storage
    if (oldImageUrl && oldImageUrl.includes("cloudinary.com")) {
      cloudinaryService.deleteImage(oldImageUrl).catch((err) => {
        console.warn("Could not delete replaced Cloudinary image:", err.message);
      });
    }

    res.json({
      success: true,
      message: "Image uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error("Upload portfolio image error:", error);
    res.status(500).json({
      error: error.message || "Failed to upload image to cloud storage",
    });
  }
};

export const deletePortfolioImage = async (req, res) => {
  try {
    const { imageUrl } = req.body || {};
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    const result = await cloudinaryService.deleteImage(imageUrl);
    res.json({
      success: result.success,
      message: result.success ? "Image deleted from Cloud CDN" : (result.message || "Could not delete image"),
    });
  } catch (error) {
    console.error("Delete portfolio image error:", error);
    res.status(500).json({
      error: error.message || "Failed to delete image",
    });
  }
};

export const syncPortfolioWithResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolio = await getOwnedPortfolio(req.params.id, userId);

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    if (!portfolio.resumeId) {
      return res
        .status(400)
        .json({ error: "No source resume linked to this portfolio" });
    }

    const resume = await Resume.findOne({ _id: portfolio.resumeId, userId });
    if (!resume) {
      return res.status(404).json({ error: "Linked resume not found" });
    }

    const professionalTitle = getFirstProfessionalTitle(resume);

    portfolio.title = portfolio.title || `${resume.name}'s Portfolio`;
    portfolio.tagline = resume.summary || portfolio.tagline || "";
    portfolio.professionalTitle =
      portfolio.professionalTitle || professionalTitle;
    portfolio.about = resume.summary || portfolio.about || "";
    portfolio.location = resume.contact?.location || portfolio.location || "";
    if (!portfolio.contact?.email && resume.contact?.email) {
      portfolio.contact.email = resume.contact.email;
    }
    if (!portfolio.contact?.phone && resume.contact?.phone) {
      portfolio.contact.phone = resume.contact.phone;
    }

    if (!portfolio.socialLinks || portfolio.socialLinks.length === 0) {
      portfolio.socialLinks = getSocialLinksFromResume(resume);
    }

    portfolio.skills = resume.skills || [];
    portfolio.experience = resume.experience || [];
    portfolio.education = resume.education || [];
    portfolio.certifications = resume.certifications || [];
    portfolio.achievements = resume.achievements || [];
    portfolio.customSections = normalizePortfolioCustomSections(
      resume.customSections || []
    );

    await portfolio.save();

    // Re-sync PortfolioProjects if existing are empty or if we want to add any missing
    if (resume.projects && resume.projects.length > 0) {
      const existingProjects = await PortfolioProject.find({
        portfolioId: portfolio._id,
        userId,
      });

      if (existingProjects.length === 0) {
        const projectPayloads = mapResumeProjectsToPortfolioProjects(
          resume.projects,
          userId,
          portfolio._id
        );
        await PortfolioProject.insertMany(projectPayloads, { ordered: true });
      }
    }

    const payload = await getPortfolioWithProjects(portfolio);
    res.json({
      message: "Portfolio successfully synced with source resume",
      ...payload,
    });
  } catch (error) {
    console.error("Sync portfolio with resume error:", error);
    res.status(500).json({
      error: error.message || "Failed to sync portfolio with resume",
    });
  }
};


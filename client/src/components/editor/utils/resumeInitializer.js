import { normalizeQrCode } from "./qrCode";

/**
 * Normalizes resume data from API or navigation state to ensure all expected
 * fields, defaults, contacts, and section arrays are safely defined.
 *
 * @param {Object} rawData - Incoming resume object
 * @returns {Object} Cleaned, standardized resume object
 */
export function normalizeResumeData(rawData) {
  const data = { ...(rawData || {}) };
  data.qrCode = normalizeQrCode(data.qrCode);

  if (!data.targetJobRole) {
    data.targetJobRole = "software-engineer";
  }

  if (!data.colorTheme) {
    const savedColorTheme = localStorage.getItem("selectedColorTheme");
    if (savedColorTheme) {
      data.colorTheme = savedColorTheme;
      localStorage.removeItem("selectedColorTheme");
    }
  }

  if (!data.contact || typeof data.contact !== "object") {
    data.contact = {
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    };
  } else {
    data.contact = {
      email: data.contact.email || "",
      phone: data.contact.phone || "",
      location: data.contact.location || "",
      linkedin: data.contact.linkedin || "",
      github: data.contact.github || "",
      portfolio: data.contact.portfolio || "",
    };
  }

  if (!data.sectionTitles) {
    data.sectionTitles = {
      summary: "Professional Summary",
      skills: "Skills",
      experience: "Experience",
      education: "Education",
      projects: "Projects",
      certifications: "Certifications",
      achievements: "Achievements",
    };
  }

  if (!Array.isArray(data.skills)) {
    data.skills = [];
  } else {
    data.skills = data.skills
      .map((group) => {
        if (typeof group === "string") {
          return { category: "Technical Skills", items: [group.trim()].filter(Boolean) };
        }
        if (group && typeof group === "object") {
          const category = (group.category || group.name || group.title || "Technical Skills").trim();
          let items = group.items || group.skills || [];
          if (typeof items === "string") {
            items = items
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          } else if (Array.isArray(items)) {
            items = items
              .flatMap((it) => (typeof it === "string" ? it.split(",") : [it?.name || it?.title || String(it)]))
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            items = [];
          }
          return { category, items };
        }
        return null;
      })
      .filter((g) => g && (g.items.length > 0 || g.category));
  }
  if (!Array.isArray(data.experience)) {
    data.experience = [];
  } else {
    data.experience = data.experience.map((exp) => {
      if (!exp || typeof exp !== "object") return exp;
      const hasBullets =
        Array.isArray(exp.bullets) &&
        exp.bullets.some((b) => Boolean(typeof b === "string" ? b.trim() : b));
      if (hasBullets && exp.description) {
        return { ...exp, description: "" };
      }
      return exp;
    });
  }

  if (!Array.isArray(data.education)) data.education = [];

  if (!Array.isArray(data.projects)) {
    data.projects = [];
  } else {
    data.projects = data.projects.map((proj) => {
      if (!proj || typeof proj !== "object") return proj;
      const hasBullets =
        Array.isArray(proj.bullets) &&
        proj.bullets.some((b) => Boolean(typeof b === "string" ? b.trim() : b));
      if (hasBullets && proj.description) {
        return { ...proj, description: "" };
      }
      return proj;
    });
  }

  if (!Array.isArray(data.certifications)) data.certifications = [];

  if (!Array.isArray(data.achievements)) {
    data.achievements = [];
  } else {
    data.achievements = data.achievements
      .map((a) => {
        if (typeof a === "string") return a;
        if (a && typeof a === "object") {
          return a.title
            ? a.description
              ? `${a.title}: ${a.description}`
              : a.title
            : a.description || "";
        }
        return "";
      })
      .filter(Boolean);
  }

  if (!Array.isArray(data.customSections)) data.customSections = [];
  if (!data.summary) data.summary = "";

  if (Array.isArray(data.sectionOrder)) {
    if (!data.sectionOrder.includes("customSections")) {
      data.sectionOrder = [...data.sectionOrder, "customSections"];
    }
  } else {
    data.sectionOrder = [
      "layout",
      "personal",
      "summary",
      "skills",
      "experience",
      "education",
      "projects",
      "certifications",
      "achievements",
      "customSections",
    ];
  }

  return data;
}

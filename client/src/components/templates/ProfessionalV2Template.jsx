import {forwardRef, useRef, useEffect, useMemo} from "react";
import { getResumeSocialLinks } from "@/utils/resumeSocialLinks";
import {isDescriptionDuplicatedInBullets, formatEducationDegreeAndField} from "./templateUtils";
import {Mail, Phone, MapPin, Linkedin, Github, Globe} from "lucide-react";

const COLOR_THEMES = {
  royalSapphire: {
    primary: "#1d4ed8",
    secondary: "#2563eb",
    accent: "#3b82f6",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  emeraldPrestige: {
    primary: "#047857",
    secondary: "#059669",
    accent: "#10b981",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  cabernetBurgundy: {
    primary: "#831843",
    secondary: "#9f1239",
    accent: "#be185d",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  nordicTeal: {
    primary: "#0f766e",
    secondary: "#14b8a6",
    accent: "#2dd4bf",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  imperialPlum: {
    primary: "#6b21a8",
    secondary: "#7e22ce",
    accent: "#9333ea",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  warmTerracotta: {
    primary: "#c2410c",
    secondary: "#ea580c",
    accent: "#f97316",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  deepOcean: {
    primary: "#0369a1",
    secondary: "#0284c7",
    accent: "#38bdf8",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  titaniumSlate: {
    primary: "#1e293b",
    secondary: "#334155",
    accent: "#475569",
    text: "#0f172a",
    textLight: "#334155",
    textMuted: "#64748b",
  },
  // Legacy aliases
  blue: {
    primary: "#1d4ed8",
    secondary: "#2563eb",
    accent: "#3b82f6",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  purple: {
    primary: "#7e22ce",
    secondary: "#9333ea",
    accent: "#a855f7",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  teal: {
    primary: "#0f766e",
    secondary: "#14b8a6",
    accent: "#2dd4bf",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  burgundy: {
    primary: "#9f1239",
    secondary: "#be123c",
    accent: "#e11d48",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  stripeIndigo: {
    primary: "#1d4ed8",
    secondary: "#2563eb",
    accent: "#3b82f6",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  cyberEmerald: {
    primary: "#0f766e",
    secondary: "#14b8a6",
    accent: "#2dd4bf",
    text: "#111827",
    textLight: "#4b5563",
    textMuted: "#6b7280",
  },
  midnightSlate: {
    primary: "#1e293b",
    secondary: "#334155",
    accent: "#475569",
    text: "#0f172a",
    textLight: "#334155",
    textMuted: "#64748b",
  },
  monochromePro: {
    primary: "#111827",
    secondary: "#1f2937",
    accent: "#374151",
    text: "#000000",
    textLight: "#1f2937",
    textMuted: "#4b5563",
  },
};

const DEFAULT_SECTION_ORDER = [
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
  "achievements",
  "customSections",
];

const DEFAULT_SECTION_TITLES = {
  experience: "Professional Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  customSections: "Additional Information",
};

/**
 * ProfessionalV2Template - Enhanced version of ProfessionalTemplate with improved spacing
 *
 * Features:
 * - Refined professional layout with optimized whitespace
 * - Lucide React icons for contact information
 * - Multiple color themes (blue, teal, purple, green, orange, gray)
 * - Improved section spacing for better readability
 * - Automatic page overflow detection
 * - ATS-compatible structure with enhanced visual hierarchy
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.resumeData - Complete resume data object (same structure as ClassicTemplate)
 * @param {string} [props.resumeData.selectedTheme] - Color theme (blue, teal, purple, green, orange, gray)
 * @param {Function} [props.onPageUsageChange] - Callback for page overflow detection
 * @param {React.Ref} ref - Forwarded ref for PDF generation
 *
 * @example
 * <ProfessionalV2Template
 *   ref={templateRef}
 *   resumeData={{ name: "Riley Kim", contact: { email: "riley@example.com" }, selectedTheme: "teal" }}
 * />
 */
const ProfessionalV2Template = forwardRef(
  ({resumeData, onPageUsageChange, printMode = false}, ref) => {
    const containerRef = useRef(null);
    const lastHeightRef = useRef(0);
    const onPageUsageChangeRef = useRef(onPageUsageChange);
    onPageUsageChangeRef.current = onPageUsageChange;

    // Detect page overflow whenever resumeData changes
    useEffect(() => {
      if (containerRef.current && onPageUsageChangeRef.current) {
        const currentHeight = containerRef.current.scrollHeight;
        if (Math.abs(lastHeightRef.current - currentHeight) < 2) return;
        lastHeightRef.current = currentHeight;

        const maxHeight = 1123; // A4 standard 297mm @ 96dpi (matches template minHeight)
        const isOverflowing = currentHeight > maxHeight;
        const overflowPercentage = isOverflowing
          ? Math.round(((currentHeight - maxHeight) / maxHeight) * 100)
          : 0;

        const usageInfo = {
          isOverflowing,
          currentHeight,
          maxHeight,
          overflowPercentage,
          percentage: Math.round((currentHeight / maxHeight) * 100), // Allow > 100% for overflow
          templateName: "ProfessionalV2Template",
        };

        onPageUsageChangeRef.current(usageInfo);
      }
    }, [resumeData]);

    const data = useMemo(() => resumeData || {}, [resumeData]);
    const isPrintMode = Boolean(printMode);
    const contactInfo = useMemo(
      () => data.personalInfo || data.contact || {},
      [data]
    );
    const hasValue = (value) =>
      typeof value === "string" ? value.trim().length > 0 : Boolean(value);

    const fullName = contactInfo.fullName || data.name || "Your Name";
    const professionalTitle =
      contactInfo.title || data.title || data.designation || data.headline || "";
    const profilePhoto = contactInfo.photo || data.photo || data.profileImage;

    const summaryText = data.summary || data.objective || "";
    const skillsList = Array.isArray(data.skills) ? data.skills : [];
    const experienceList = Array.isArray(data.experience) ? data.experience : [];
    const projectList = Array.isArray(data.projects) ? data.projects : [];
    const educationList = Array.isArray(data.education) ? data.education : [];
    const certificationList = Array.isArray(data.certifications)
      ? data.certifications
      : [];
    const achievementList = Array.isArray(data.achievements)
      ? data.achievements
      : [];
    const customSectionList = Array.isArray(data.customSections)
      ? data.customSections
      : [];
    const languageList = Array.isArray(data.languages) ? data.languages : [];

    const selectedTheme = useMemo(
      () =>
        COLOR_THEMES[data?.selectedTheme] ||
        COLOR_THEMES[data?.colorTheme] ||
        COLOR_THEMES.royalSapphire ||
        COLOR_THEMES.blue,
      [data?.selectedTheme, data?.colorTheme]
    );

    // Helper function to safely format skills (returns array)
    const formatSkills = (items) => {
      if (!items) return [];

      if (Array.isArray(items)) {
        return items
          .flatMap((item) => {
            if (typeof item === "string") return [item];
            if (Array.isArray(item?.items)) {
              return item.items
                .map((entry) => (typeof entry === "string" ? entry : ""))
                .filter(Boolean);
            }
            if (item.items && Array.isArray(item.items))
              return formatSkills(item.items);
            if (item.category || item.name) return [item.category || item.name];
            return [];
          })
          .filter(Boolean);
      }

      if (typeof items === "string") {
        return [items];
      }

      return [];
    };

    const sectionOrder = useMemo(() => {
      const baseOrder =
        data.sectionOrder && data.sectionOrder.length > 0
          ? data.sectionOrder.filter(
              (id) => !["score", "personal", "recommendations"].includes(id)
            )
          : DEFAULT_SECTION_ORDER;

      if (customSectionList.length > 0 && !baseOrder.includes("customSections")) {
        return [...baseOrder, "customSections"];
      }
      return baseOrder;
    }, [data.sectionOrder, customSectionList]);

    // Helper: Get section title
    const getSectionTitle = (sectionId) => {
      const customTitles = data.sectionTitles || {};
      return (
        customTitles[sectionId] || DEFAULT_SECTION_TITLES[sectionId] || sectionId
      );
    };

    // Helper: Check if section has content
    const hasContent = (section) => {
      if (!section) return false;
      if (Array.isArray(section)) return section.length > 0;
      if (typeof section === "string") return section.trim().length > 0;
      if (typeof section === "object") return Object.keys(section).length > 0;
      return false;
    };

    // Normalize mixed experience payloads so print output never drops content.
    const normalizeToBulletArray = (value) => {
      if (!value) return [];

      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (typeof item === "object" && item !== null) {
              return (
                item.text ||
                item.description ||
                item.content ||
                item.value ||
                ""
              )
                .toString()
                .trim();
            }
            return "";
          })
          .filter(Boolean);
      }

      if (typeof value === "string") {
        return value
          .split(/\n|•|\u2022|\-|\*\s+/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [];
    };

    const getEducationDateRange = (edu) => {
      if (edu?.graduationDate) return edu.graduationDate;
      if (edu?.startDate && edu?.endDate) return `${edu.startDate} - ${edu.endDate}`;
      return edu?.startDate || edu?.endDate || "";
    };

    const getCertificationTitle = (cert) => cert?.title || cert?.name || "";

    const formatDateRange = (startDate, endDate, current) => {
      if (!startDate && !endDate && !current) return "";
      const from = startDate || "";
      const to = current ? "Present" : endDate || "";

      if (from && to) return `${from} - ${to}`;
      return from || to;
    };

    const formattedSkills = useMemo(
      () => formatSkills(skillsList),
      [skillsList]
    );

    const normalizedExperience = useMemo(
      () =>
        experienceList.map((exp) => ({
          ...exp,
          role: exp.position || exp.title || "",
          companyName: exp.company || "",
          dateRange: formatDateRange(exp.startDate, exp.endDate, exp.current),
          descriptionText:
            exp?.description || exp?.summary || exp?.overview || "",
          bulletItems: normalizeToBulletArray(
            exp?.bullets || exp?.highlights || exp?.responsibilities || []
          ),
        })),
      [experienceList]
    );

    const normalizedProjects = useMemo(
      () =>
        projectList.map((project) => ({
          ...project,
          title: project.name || project.title || "",
          descriptionText: project?.description || project?.summary || "",
          bulletItems: normalizeToBulletArray(
            project?.bullets ||
              project?.highlights ||
              project?.responsibilities ||
              []
          ),
        })),
      [projectList]
    );

    const normalizedCustomSections = useMemo(
      () =>
        customSectionList
          .map((section) => {
            const rawItems = Array.isArray(section?.items)
              ? section.items
              : typeof section?.content === "string"
                ? section.content
                    .split(/\n|•|\u2022|\-|\*\s+/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [];

            return {
              ...section,
              title: section?.title || "Additional Information",
              content: section?.content || "",
              items: rawItems,
            };
          })
          .filter((section) => (section.items && section.items.length > 0) || (section.content && section.content.trim().length > 0)),
      [customSectionList]
    );

    // Section styling with page break prevention
    const sectionStyle = {
      marginBottom: "24px",
      pageBreakInside: "avoid",
      breakInside: "avoid",
    };

    // Render sections dynamically
    const renderSection = (sectionId) => {
      const sections = {
        summary: summaryText && (
          <section
            key="summary"
            className="resume-section"
            style={sectionStyle}
          >
            <h2 className="pv2-section-title">Professional Summary</h2>
            <div className="section-content">
              <p className="summary-text">{summaryText}</p>
            </div>
          </section>
        ),

        skills: hasContent(skillsList) && (
          <section key="skills" className="resume-section" style={sectionStyle}>
            <h2 className="pv2-section-title">{getSectionTitle("skills")}</h2>
            <div className="section-content">
              <div className="skills-container">
                {formattedSkills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ),

        experience: hasContent(experienceList) && (
          <section
            key="experience"
            className="resume-section"
            style={sectionStyle}
          >
            <h2 className="pv2-section-title">{getSectionTitle("experience")}</h2>
            <div className="section-content">
              {normalizedExperience.map((exp, index) => {

                  return (
                <div
                  key={index}
                  className="experience-item"
                  style={{
                    ...sectionStyle,
                    animation: isPrintMode
                      ? "none"
                      : `fadeInHighlight 0.5s ease ${index * 0.1}s`,
                  }}
                >
                  <div className="experience-header">
                    <div className="experience-left">
                      <h3 className="experience-role">
                        {exp.role}
                      </h3>
                      <p className="experience-company">{exp.companyName}</p>
                    </div>
                    <div className="experience-right">
                      {exp.dateRange && (
                        <p className="experience-duration">
                          {exp.dateRange}
                        </p>
                      )}
                      {exp.location && (
                        <p className="experience-location">{exp.location}</p>
                      )}
                    </div>
                  </div>
                  {exp.descriptionText &&
                    (!exp.bulletItems?.length ||
                      !isDescriptionDuplicatedInBullets(exp.descriptionText, exp.bulletItems)) && (
                    <p className="experience-description">
                      {exp.descriptionText}
                    </p>
                  )}
                  {exp.bulletItems.length > 0 && (
                    <ul className="experience-bullets">
                      {exp.bulletItems.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
                  );
                })}
            </div>
          </section>
        ),

        projects: hasContent(projectList) && (
          <section
            key="projects"
            className="resume-section"
            style={sectionStyle}
          >
            <h2 className="pv2-section-title">{getSectionTitle("projects")}</h2>
            <div className="section-content">
              {normalizedProjects.map((project, index) => {

                  return (
                <div
                  key={index}
                  className="project-item"
                  style={{
                    ...sectionStyle,
                    animation: isPrintMode
                      ? "none"
                      : `fadeInHighlight 0.5s ease ${index * 0.1}s`,
                  }}
                >
                  <div className="project-header">
                    <h3 className="project-name">
                      {project.title}
                      {project.source === "github" && (
                        <span className="github-tag">
                          <Github size={12} /> GitHub
                        </span>
                      )}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {(project.link || project.liveUrl) && (
                        <a
                          href={(project.link || project.liveUrl).startsWith("http") ? (project.link || project.liveUrl) : `https://${project.link || project.liveUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          Live Demo →
                        </a>
                      )}
                      {(project.github || project.githubUrl) && (
                        <a
                          href={(project.github || project.githubUrl).startsWith("http") ? (project.github || project.githubUrl) : `https://${project.github || project.githubUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          GitHub →
                        </a>
                      )}
                    </div>
                  </div>
                  {project.descriptionText &&
                    (!project.bulletItems?.length ||
                      !isDescriptionDuplicatedInBullets(project.descriptionText, project.bulletItems)) && (
                    <p className="project-description">
                      {project.descriptionText}
                    </p>
                  )}
                  {hasContent(project.technologies || project.techStack) && (
                    <div className="project-tech">
                      <strong>Tech Stack:</strong>{" "}
                      {Array.isArray(project.technologies || project.techStack)
                        ? (project.technologies || project.techStack).join(", ")
                        : project.technologies || project.techStack}
                    </div>
                  )}
                  {project.bulletItems.length > 0 && (
                    <ul className="project-bullets">
                      {project.bulletItems.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
                  );
                })}
            </div>
          </section>
        ),

        education: hasContent(educationList) && (
          <section
            key="education"
            className="resume-section"
            style={sectionStyle}
          >
            <h2 className="pv2-section-title">{getSectionTitle("education")}</h2>
            <div className="section-content">
              {educationList.map((edu, index) => (
                <div
                  key={index}
                  className="education-item"
                  style={sectionStyle}
                >
                  <div className="education-header">
                    <div className="education-left">
                      <h3 className="education-degree">{formatEducationDegreeAndField(edu)}</h3>
                      <p className="education-institution">{edu.institution}</p>
                    </div>
                    <div className="education-right">
                      {getEducationDateRange(edu) && (
                        <p className="education-duration">
                          {getEducationDateRange(edu)}
                        </p>
                      )}
                      {edu.gpa && (
                        <p className="education-gpa">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  </div>
                  {hasContent(edu.achievements) && (
                    <ul className="education-achievements">
                      {edu.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ),

        certifications: hasContent(certificationList) && (
          <section
            key="certifications"
            className="resume-section"
            style={sectionStyle}
          >
            <h2 className="pv2-section-title">
              {getSectionTitle("certifications")}
            </h2>
            <div className="section-content">
              {certificationList.map((cert, index) => (
                <div
                  key={index}
                  className="certification-item"
                  style={sectionStyle}
                >
                  <div className="certification-header">
                    <h3 className="certification-title">
                      {getCertificationTitle(cert)}
                    </h3>
                    {cert.date && (
                      <span className="certification-date">{cert.date}</span>
                    )}
                  </div>
                  <p className="certification-issuer">{cert.issuer}</p>
                  {cert.description && (
                    <p className="certification-description">
                      {cert.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ),

        achievements: hasContent(achievementList) && (
          <section
            key="achievements"
            className="resume-section"
            style={sectionStyle}
          >
            <h2 className="pv2-section-title">{getSectionTitle("achievements")}</h2>
            <div className="section-content">
              <ul className="achievements-list">
                {achievementList.map((achievement, index) => (
                  <li key={index}>{achievement}</li>
                ))}
              </ul>
            </div>
          </section>
        ),

        customSections:
          hasContent(normalizedCustomSections) &&
          normalizedCustomSections.map((section, index) => {
            return (
              <section
                key={`custom-${index}`}
                className="resume-section"
                style={sectionStyle}
              >
                <h2 className="pv2-section-title">{section.title}</h2>
                <div className="section-content">
                  {section.content && (
                    <p style={{ whiteSpace: "pre-wrap", marginBottom: section.items?.length > 0 ? "8px" : 0 }}>
                      {section.content}
                    </p>
                  )}
                  {section.items && section.items.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {section.items.map((rawItem, itemIndex) => {
                        const isStructured = rawItem && typeof rawItem === "object";
                        const itemTitle = isStructured ? (rawItem.title || rawItem.name || "") : rawItem;
                        const subtitle = isStructured ? (rawItem.subtitle || rawItem.organization || rawItem.issuer || rawItem.publisher || "") : "";
                        const date = isStructured ? (rawItem.date || "") : "";
                        const link = isStructured ? (rawItem.link || rawItem.url || "") : "";
                        const description = isStructured ? (rawItem.description || "") : "";
                        const bullets = isStructured && Array.isArray(rawItem.bullets) ? rawItem.bullets.filter(Boolean) : [];

                        if (!isStructured || (!subtitle && !date && !link && bullets.length === 0 && !description)) {
                          return (
                            <ul key={itemIndex} className="achievements-list" style={{ margin: 0 }}>
                              <li>{typeof itemTitle === "string" ? itemTitle : ""}</li>
                            </ul>
                          );
                        }

                        return (
                          <div key={itemIndex} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                flexWrap: "wrap",
                                gap: "6px",
                                marginBottom: "2px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                {itemTitle && (
                                  <span style={{ fontWeight: 700, color: selectedTheme.text }}>
                                    {itemTitle}
                                  </span>
                                )}
                                {subtitle && (
                                  <span style={{ color: selectedTheme.textMuted || "#666", fontStyle: "italic", fontSize: "0.95em" }}>
                                    · {subtitle}
                                  </span>
                                )}
                                {link && (
                                  <a
                                    href={link.startsWith("http") ? link : `https://${link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: selectedTheme.primary, textDecoration: "underline", fontSize: "0.9em" }}
                                  >
                                    [link]
                                  </a>
                                )}
                              </div>
                              {date && (
                                <span style={{ color: selectedTheme.textMuted || "#666", fontWeight: 500, fontSize: "0.9em", whiteSpace: "nowrap" }}>
                                  {date}
                                </span>
                              )}
                            </div>
                            {description && (
                              <p style={{ margin: "2px 0 4px 0", color: selectedTheme.textLight || "#444" }}>
                                {description}
                              </p>
                            )}
                            {bullets.length > 0 && (
                              <ul className="achievements-list" style={{ marginTop: "2px", marginBottom: 0 }}>
                                {bullets.map((b, bIdx) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          }),
      };

      return sections[sectionId];
    };

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        className="professional-v2-template"
        style={{
          minHeight: "auto",
          "--pv2-primary": selectedTheme.primary,
          "--pv2-secondary": selectedTheme.secondary,
          "--pv2-accent": selectedTheme.accent,
          "--pv2-text": selectedTheme.text,
          "--pv2-text-light": selectedTheme.textLight,
          "--pv2-text-muted": selectedTheme.textMuted,
        }}
      >
        <div className={`template-container${isPrintMode ? " pv2-print-source" : ""}`}>
          {/* Unique Header Design */}
          <header className="resume-header" style={sectionStyle}>
            <div className="header-top">
              <div className="header-left">
                <h1 className="header-name">
                  {fullName}
                </h1>
                {professionalTitle && (
                  <p className="header-title">{professionalTitle}</p>
                )}
              </div>
              {profilePhoto && (
                <div className="header-photo">
                  <img
                    src={profilePhoto}
                    alt={fullName}
                  />
                </div>
              )}
            </div>

            {/* Contact Info Bar */}
            <div className="contact-bar">
              {hasValue(contactInfo?.email) && (
                <div className="contact-item">
                  <Mail size={12} className="contact-icon" />
                  <span>{contactInfo.email}</span>
                </div>
              )}
              {hasValue(contactInfo?.phone) && (
                <div className="contact-item">
                  <Phone size={12} className="contact-icon" />
                  <span>{contactInfo.phone}</span>
                </div>
              )}
              {hasValue(contactInfo?.location) && (
                <div className="contact-item">
                  <MapPin size={12} className="contact-icon" />
                  <span>{contactInfo.location}</span>
                </div>
              )}
              {hasValue(contactInfo?.linkedin) && (
                <div className="contact-item">
                  <Linkedin size={12} className="contact-icon" />
                  <a
                    href={contactInfo.linkedin.startsWith("http") ? contactInfo.linkedin : `https://${contactInfo.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
              {hasValue(contactInfo?.github) && (
                <div className="contact-item">
                  <Github size={12} className="contact-icon" />
                  <a
                    href={contactInfo.github.startsWith("http") ? contactInfo.github : `https://${contactInfo.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </div>
              )}
              {hasValue(contactInfo?.portfolio || contactInfo?.website) && (
                <div className="contact-item">
                  <Globe size={12} className="contact-icon" />
                  <a
                    href={
                      (contactInfo.portfolio || contactInfo.website).startsWith("http")
                        ? contactInfo.portfolio || contactInfo.website
                        : `https://${contactInfo.portfolio || contactInfo.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Portfolio
                  </a>
                </div>
              )}
              {getResumeSocialLinks(data.contact || contactInfo).map(({ href, label, icon: Icon }) => (
                <div key={href} className="contact-item">
                  <Icon size={12} className="contact-icon" aria-hidden="true" />
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                </div>
              ))}
            </div>

            {/* Languages inline if available */}
            {hasContent(languageList) && (
              <div className="languages-bar">
                <strong>Languages:</strong>
                {languageList.map((lang, index) => (
                  <span key={index} className="language-tag">
                    {typeof lang === "string"
                      ? lang
                      : `${lang.name}${
                          lang.proficiency ? ` (${lang.proficiency})` : ""
                        }`}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="main-content">
            {/* Dynamic Sections */}
            {sectionOrder.map((sectionId) => renderSection(sectionId))}
          </main>
        </div>

        {/* Styles */}
        <style>{`
          .professional-v2-template {
            --pv2-primary: #1d4ed8;
            --pv2-secondary: #2563eb;
            --pv2-accent: #3b82f6;
            --pv2-text: #111827;
            --pv2-text-light: #4b5563;
            --pv2-text-muted: #6b7280;
            font-family:
              "Inter",
              "Roboto",
              "Source Sans Pro",
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
            background: white;
            color: var(--pv2-text);
            line-height: 1.5;
          }

          .template-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
          }

          .template-container.pv2-print-source {
            max-width: none;
          }

          .pv2-print-source .resume-header {
            padding: 7px 10px 6px 10px;
            margin-bottom: 6px;
            border-radius: 0;
          }

          .pv2-print-source .header-top {
            margin-bottom: 4px;
            gap: 8px;
          }

          .pv2-print-source .header-name {
            font-size: 17px;
            margin-bottom: 1px;
          }

          .pv2-print-source .header-title {
            font-size: 10.5px;
          }

          .pv2-print-source .header-photo {
            width: 44px;
            height: 44px;
          }

          .pv2-print-source .contact-bar {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            padding: 4px 6px;
            margin-bottom: 4px;
            gap: 3px 10px;
            backdrop-filter: none;
          }

          .pv2-print-source .contact-item {
            font-size: 9px;
            gap: 4px;
            white-space: nowrap;
          }

          .pv2-print-source .languages-bar {
            padding: 5px 8px;
            gap: 6px;
            font-size: 9.5px;
          }

          .pv2-print-source .language-tag {
            font-size: 9px;
            padding: 2px 6px;
          }

          .pv2-print-source .main-content {
            padding: 0 10px 8px 10px;
          }

          .pv2-print-source .section-content {
            display: block;
          }

          .pv2-print-source .resume-section {
            margin-bottom: 10px;
            break-inside: avoid;
          }

          .pv2-print-source .experience-item,
          .pv2-print-source .project-item,
          .pv2-print-source .education-item,
          .pv2-print-source .certification-item {
            padding: 8px 10px;
            margin-bottom: 8px;
            min-height: auto;
            height: auto;
            background: #ffffff;
            break-inside: avoid;
          }

          .pv2-print-source .experience-bullets,
          .pv2-print-source .project-bullets,
          .pv2-print-source .achievements-list,
          .pv2-print-source .education-achievements {
            display: block;
            margin: 4px 0 0 0;
            padding: 0;
          }

          .pv2-print-source .experience-bullets li,
          .pv2-print-source .project-bullets li,
          .pv2-print-source .achievements-list li,
          .pv2-print-source .education-achievements li {
            display: list-item;
            list-style: disc outside;
            margin: 0 0 3px 18px;
            padding-left: 0;
            line-height: 1.35;
          }

          .pv2-print-source .experience-bullets li::before,
          .pv2-print-source .project-bullets li::before,
          .pv2-print-source .achievements-list li::before,
          .pv2-print-source .education-achievements li::before {
            content: none;
          }

          /* UNIQUE HEADER DESIGN */
          .resume-header {
            background: linear-gradient(
              135deg,
              var(--pv2-primary) 0%,
              var(--pv2-secondary) 100%
            );
            color: white;
            padding: 20px 24px 16px 24px;
            margin-bottom: 18px;
            border-radius: 0 0 8px 8px;
          }

          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 14px;
            gap: 16px;
          }

          .header-left {
            flex: 1;
          }

          .header-name {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px 0;
            letter-spacing: -0.5px;
          }

          .header-title {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.95);
            margin: 0;
            font-weight: 500;
          }

          .header-photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            flex-shrink: 0;
          }

          .header-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* CONTACT BAR */
          .contact-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 12px 16px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 6px;
            margin-bottom: 10px;
          }

          .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: white;
          }

          .contact-icon {
            flex-shrink: 0;
            color: white;
            opacity: 0.9;
          }

          .contact-item span {
            color: white;
          }

          .contact-item a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            border-bottom: 1px solid rgba(255, 255, 255, 0.5);
          }

          .contact-item a:hover {
            border-bottom-color: white;
          }

          /* LANGUAGES BAR */
          .languages-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: white;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }

          .languages-bar strong {
            color: white;
            font-weight: 600;
          }

          .language-tag {
            background: rgba(255, 255, 255, 0.2);
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
            color: white;
          }

          /* MAIN CONTENT */
          .main-content {
            padding: 0 24px 20px 24px;
          }

          /* SECTIONS */
          .resume-section {
            margin-bottom: 16px;
          }

          .professional-v2-template .pv2-section-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--pv2-primary) !important;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid var(--pv2-primary);
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .professional-v2-template .pv2-section-title::before {
            content: "";
            width: 4px;
            height: 14px;
            background: linear-gradient(
              135deg,
              var(--pv2-primary) 0%,
              var(--pv2-secondary) 100%
            );
            border-radius: 2px;
          }

          .section-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          /* SUMMARY */
          .summary-text {
            font-size: 12px;
            color: var(--pv2-text);
            line-height: 1.6;
            margin: 0;
            text-align: justify;
          }

          /* SKILLS CONTAINER */
          .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .skill-badge {
            background: linear-gradient(
              135deg,
              var(--pv2-primary) 0%,
              var(--pv2-secondary) 100%
            );
            color: white;
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s;
          }

          .skill-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(37, 99, 235, 0.25);
          }

          /* EXPERIENCE */
          .experience-item {
            padding: 10px 12px;
            border-left: 3px solid var(--pv2-secondary);
            background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
            border-radius: 4px;
            transition: all 0.2s;
          }

          .experience-item:hover {
            background: #f1f5f9;
            border-left-color: var(--pv2-primary);
          }

          .experience-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            flex-wrap: wrap;
            gap: 6px;
          }

          .experience-left {
            flex: 1;
          }

          .experience-right {
            text-align: right;
          }

          .experience-role {
            font-size: 13px;
            font-weight: 700;
            color: var(--pv2-text);
            margin: 0 0 2px 0;
          }

          .experience-company {
            font-size: 12px;
            color: var(--pv2-primary);
            font-weight: 600;
            margin: 0;
          }

          .experience-duration {
            font-size: 11px;
            color: var(--pv2-text);
            font-weight: 500;
            margin: 0 0 2px 0;
          }

          .experience-location {
            font-size: 10px;
            color: var(--pv2-text-muted);
            margin: 0;
          }

          .experience-description {
            font-size: 12px;
            color: var(--pv2-text);
            margin: 0 0 6px 0;
            line-height: 1.5;
          }

          .experience-bullets {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .experience-bullets li {
            font-size: 11px;
            color: var(--pv2-text);
            padding-left: 14px;
            position: relative;
            margin-bottom: 3px;
            line-height: 1.5;
          }

          .experience-bullets li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: var(--pv2-secondary);
            font-weight: bold;
          }

          /* PROJECTS */
          .project-item {
            padding: 10px 12px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            transition: all 0.2s;
            background: #fafafa;
          }

          .project-item:hover {
            border-color: var(--pv2-secondary);
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
            background: white;
          }

          .project-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            flex-wrap: wrap;
            gap: 6px;
          }

          .project-name {
            font-size: 13px;
            font-weight: 700;
            color: var(--pv2-text);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .github-tag {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: linear-gradient(
              135deg,
              var(--pv2-primary) 0%,
              var(--pv2-secondary) 100%
            );
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
          }

          .project-link {
            font-size: 11px;
            color: var(--pv2-secondary);
            text-decoration: none;
            font-weight: 600;
          }

          .project-link:hover {
            text-decoration: underline;
          }

          .project-description {
            font-size: 12px;
            color: var(--pv2-text);
            margin: 0 0 6px 0;
            line-height: 1.5;
          }

          .project-tech {
            font-size: 11px;
            color: var(--pv2-text);
            margin-bottom: 6px;
          }

          .project-tech strong {
            color: var(--pv2-primary);
            font-weight: 600;
          }

          .project-bullets {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .project-bullets li {
            font-size: 11px;
            color: var(--pv2-text);
            padding-left: 14px;
            position: relative;
            margin-bottom: 3px;
            line-height: 1.5;
          }

          .project-bullets li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: var(--pv2-secondary);
            font-weight: bold;
          }

          /* EDUCATION */
          .education-item {
            padding: 10px;
            background: #ffffff;
            border-radius: 3px;
            border-left: 3px solid var(--pv2-secondary);
            transition: all 0.2s;
          }

          .education-item:hover {
            border-left-color: var(--pv2-primary);
            box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1);
          }

          .education-header {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 6px;
          }

          .education-degree {
            font-size: 13px;
            font-weight: 700;
            color: var(--pv2-text);
            margin: 0 0 2px 0;
          }

          .education-institution {
            font-size: 12px;
            color: var(--pv2-secondary);
            font-weight: 600;
            margin: 0 0 2px 0;
          }

          .education-field {
            font-size: 11px;
            color: var(--pv2-text);
            margin: 0;
          }

          .education-duration {
            font-size: 11px;
            color: var(--pv2-text);
            font-weight: 500;
            margin: 0 0 2px 0;
          }

          .education-gpa {
            font-size: 11px;
            color: var(--pv2-secondary);
            font-weight: 600;
            margin: 0;
          }

          .education-achievements {
            list-style: none;
            padding: 0;
            margin: 6px 0 0 0;
          }

          .education-achievements li {
            font-size: 11px;
            color: var(--pv2-text);
            padding-left: 14px;
            position: relative;
            margin-bottom: 2px;
            line-height: 1.5;
          }

          .education-achievements li::before {
            content: "▸";
            position: absolute;
            left: 0;
            color: var(--pv2-secondary);
            font-weight: bold;
          }

          /* CERTIFICATIONS */
          .certification-item {
            padding: 10px;
            border-left: 3px solid var(--pv2-secondary);
            background: #ffffff;
            border-radius: 3px;
            transition: all 0.2s;
          }

          .certification-item:hover {
            border-left-color: var(--pv2-primary);
            box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1);
          }

          .certification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
            flex-wrap: wrap;
            gap: 4px;
          }

          .certification-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--pv2-text);
            margin: 0;
          }

          .certification-date {
            font-size: 10px;
            color: var(--pv2-text);
            font-weight: 500;
          }

          .certification-issuer {
            font-size: 11px;
            color: var(--pv2-secondary);
            font-weight: 600;
            margin: 0 0 3px 0;
          }

          .certification-description {
            font-size: 11px;
            color: var(--pv2-text);
            line-height: 1.5;
            margin: 0;
          }

          /* ACHIEVEMENTS */
          .achievements-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .achievements-list li {
            font-size: 11px;
            color: var(--pv2-text);
            padding-left: 14px;
            position: relative;
            margin-bottom: 3px;
            line-height: 1.5;
          }

          .achievements-list li::before {
            content: "★";
            position: absolute;
            left: 0;
            color: var(--pv2-secondary);
            font-weight: bold;
          }

          /* ANIMATIONS */
          @keyframes fadeInHighlight {
            0% {
              opacity: 0;
              transform: translateY(10px);
              background: #fff8e1;
            }
            50% {
              background: #fff8e1;
            }
            100% {
              opacity: 1;
              transform: translateY(0);
              background: transparent;
            }
          }

          .animate-fade-in {
            animation: fadeIn 0.5s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* PRINT STYLES */
          @media print {
            .professional-v2-template {
              background: white;
              min-height: auto !important;
              color: #111827 !important;
            }

            .professional-v2-template,
            .professional-v2-template * {
              animation: none !important;
              transition: none !important;
            }

            .template-container {
              max-width: none;
            }

            .main-content,
            .main-content * {
              color: #111827 !important;
              -webkit-text-fill-color: #111827 !important;
            }

            .skill-badge,
            .skill-badge * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
            }

            .resume-header {
              background: linear-gradient(
                135deg,
                var(--pv2-primary) 0%,
                var(--pv2-secondary) 100%
              );
              padding: 10px 14px 8px 14px;
              margin-bottom: 8px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .header-top {
              margin-bottom: 6px;
              gap: 10px;
            }

            .header-name {
              font-size: 20px;
              margin-bottom: 2px;
            }

            .header-title {
              font-size: 12px;
            }

            .header-photo {
              width: 56px;
              height: 56px;
            }

            .contact-bar {
              padding: 6px 8px;
              margin-bottom: 6px;
              gap: 6px 10px;
            }

            .contact-item {
              font-size: 9.5px;
              gap: 4px;
            }

            .languages-bar {
              padding: 5px 8px;
              gap: 6px;
              font-size: 9.5px;
            }

            .language-tag {
              font-size: 9px;
              padding: 2px 6px;
            }

            .resume-header,
            .resume-header * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
            }

            .main-content {
              padding: 0 12px 8px 12px;
            }

            .section-content {
              display: block !important;
              gap: 7px;
            }

            .resume-section {
              margin-bottom: 10px !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .experience-item,
            .project-item,
            .education-item,
            .certification-item {
              padding: 8px 10px;
              margin-bottom: 8px !important;
              min-height: auto !important;
              height: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background: #ffffff !important;
            }

            .experience-bullets,
            .project-bullets,
            .achievements-list,
            .education-achievements {
              display: block !important;
              margin: 4px 0 0 0 !important;
              padding: 0 !important;
            }

            .experience-bullets li,
            .project-bullets li,
            .achievements-list li,
            .education-achievements li {
              display: list-item !important;
              list-style: disc outside !important;
              margin: 0 0 3px 18px !important;
              padding-left: 0 !important;
              line-height: 1.35 !important;
            }

            .experience-bullets li::before,
            .project-bullets li::before,
            .achievements-list li::before,
            .education-achievements li::before {
              content: none !important;
            }

            .experience-header,
            .project-header,
            .education-header,
            .certification-header {
              margin-bottom: 4px !important;
              gap: 4px !important;
            }

            .experience-description,
            .project-description,
            .summary-text,
            .experience-bullets li,
            .project-bullets li,
            .achievements-list li {
              color: #111827 !important;
              -webkit-text-fill-color: #111827 !important;
            }

            .expand-skills-btn,
            .read-more-btn {
              display: none;
            }
          }

          /* RESPONSIVE */
          @media (max-width: 768px) {
            .resume-header {
              padding: 16px;
            }

            .header-top {
              flex-direction: column;
              align-items: center;
              text-align: center;
            }

            .header-photo {
              margin-top: 12px;
            }

            .contact-bar {
              flex-direction: column;
              gap: 8px;
              align-items: center;
            }

            .main-content {
              padding: 16px;
            }

            .experience-header,
            .education-header {
              flex-direction: column;
            }

            .experience-right,
            .education-right {
              text-align: left;
            }
          }
        `}</style>
      </div>
    );
  }
);

ProfessionalV2Template.displayName = "ProfessionalV2Template";

export default ProfessionalV2Template;

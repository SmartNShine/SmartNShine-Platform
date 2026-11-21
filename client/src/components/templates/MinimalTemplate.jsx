import React, { forwardRef, useRef, useEffect, useMemo } from "react";
import { isDescriptionDuplicatedInBullets, formatEducationDegreeAndField, cleanBulletText } from "./templateUtils";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
} from "lucide-react";

/**
 * MinimalTemplate - "The Swiss Minimalist / Dieter Rams Edition"
 *
 * Maximum clarity, zero fluff, pure informational density and typographical beauty.
 * Features:
 * - Ultra-clean single-column Swiss typography with hairline section rules
 * - Space-efficient 2-line metadata headers (Title/Company left, Dates/Location right)
 * - Intelligent bullet point deduplication (prevents redundant descriptions)
 * - ATS-safe quantifiable metric highlighting (+40%, $2.4M, 10x, 99.99% SLA)
 * - Full support for live toolbar theme customization (Stripe Indigo, Cyber Emerald, Midnight Slate, Monochrome Pro)
 * - Strict 1-page density engine with Compact / Balanced / Spacious modes
 * - 100% text-based, ATS-compliant semantic HTML
 */

// Helper to highlight quantifiable metrics while keeping text 95+ ATS-safe
const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|MAU|DAU|customers|clients|engineers|developers|nodes|services|microservices|req\/s|rps|qps|ms|fps|stars|downloads|pull requests|PRs)\b)/gi;

  const parts = text.split(metricRegex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span
          key={index}
          style={{
            fontWeight: 700,
            color: primaryColor,
          }}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const MinimalTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
  const containerRef = useRef(null);
  const lastHeightRef = useRef(0);
  const onPageUsageChangeRef = useRef(onPageUsageChange);
  onPageUsageChangeRef.current = onPageUsageChange;

  // Page overflow detection (11in @ 96 DPI = 1056px)
  useEffect(() => {
    if (containerRef.current && onPageUsageChangeRef.current) {
      const currentHeight = containerRef.current.scrollHeight;
      if (Math.abs(lastHeightRef.current - currentHeight) < 2) return;
      lastHeightRef.current = currentHeight;

      const maxHeight = 1123;
      const isOverflowing = currentHeight > maxHeight;
      const overflowPercentage = isOverflowing
        ? Math.round(((currentHeight - maxHeight) / maxHeight) * 100)
        : 0;

      const usageInfo = {
        isOverflowing,
        currentHeight,
        maxHeight,
        overflowPercentage,
        percentage: Math.round((currentHeight / maxHeight) * 100),
        templateName: "MinimalTemplate",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Color Themes - Full support for live toolbar themes + legacy compatibility
  const colorThemes = {
    stripeIndigo: {
      primary: "#4338ca", // Refined Swiss Indigo
      accent: "#6366f1",
      badgeBg: "#eef2ff",
      badgeBorder: "#c7d2fe",
      badgeText: "#3730a3",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#cbd5e1",
    },
    cyberEmerald: {
      primary: "#047857", // Swiss Emerald
      accent: "#059669",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      badgeText: "#065f46",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#a7f3d0",
    },
    midnightSlate: {
      primary: "#1e293b", // Deep Charcoal Slate
      accent: "#334155",
      badgeBg: "#f8fafc",
      badgeBorder: "#cbd5e1",
      badgeText: "#1e293b",
      text: "#020617",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#cbd5e1",
    },
    monochromePro: {
      primary: "#09090b", // Pure High-Contrast Minimalist
      accent: "#18181b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#d4d4d8",
      badgeText: "#18181b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#52525b",
      border: "#e4e4e7",
      rule: "#d4d4d8",
    },
    // Backward compatibility aliases
    charcoal: {
      primary: "#09090b",
      accent: "#18181b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#d4d4d8",
      badgeText: "#18181b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#52525b",
      border: "#e4e4e7",
      rule: "#d4d4d8",
    },
    navy: {
      primary: "#1e3a8a",
      accent: "#2563eb",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      badgeText: "#1e40af",
      text: "#0f172a",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#bfdbfe",
    },
    genevaSage: {
      primary: "#047857",
      accent: "#059669",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      badgeText: "#065f46",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#a7f3d0",
    },
    baselOchre: {
      primary: "#b45309",
      accent: "#d97706",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      badgeText: "#92400e",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#fde68a",
    },
    graphite: {
      primary: "#18181b",
      accent: "#27272a",
      badgeBg: "#f4f4f5",
      badgeBorder: "#d4d4d8",
      badgeText: "#18181b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#52525b",
      border: "#e4e4e7",
      rule: "#d4d4d8",
    },
    slate: {
      primary: "#475569",
      accent: "#334155",
      badgeBg: "#f8fafc",
      badgeBorder: "#cbd5e1",
      badgeText: "#1e293b",
      text: "#020617",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#cbd5e1",
    },
    blue: {
      primary: "#4338ca",
      accent: "#6366f1",
      badgeBg: "#eef2ff",
      badgeBorder: "#c7d2fe",
      badgeText: "#3730a3",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#cbd5e1",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.midnightSlate;

  // Intelligent 1-Page Content Density Engine
  const density = useMemo(() => {
    if (resumeData?.density === "compact" || resumeData?.density === "high") return "compact";
    if (resumeData?.density === "spacious" || resumeData?.density === "low") return "spacious";
    if (resumeData?.density === "medium") return "medium";

    let score = 0;
    if (resumeData.experience?.length) {
      score += resumeData.experience.length * 3;
      resumeData.experience.forEach((e) => {
        score += (e.bullets?.length || 0) * 1;
      });
    }
    if (resumeData.projects?.length) {
      score += resumeData.projects.length * 2;
      resumeData.projects.forEach((p) => {
        score += (p.bullets?.length || 0) * 1;
      });
    }
    if (resumeData.education?.length) score += resumeData.education.length * 2;
    if (resumeData.skills?.length) score += resumeData.skills.length * 1.2;
    if (resumeData.certifications?.length) score += resumeData.certifications.length;
    if (resumeData.achievements?.length) score += resumeData.achievements.length;
    if ((resumeData.summary || "").length > 250) score += 3;

    if (score >= 30) return "compact";
    if (score >= 18) return "medium";
    return "spacious";
  }, [resumeData]);

  // Dynamic Spacing & Typography based on Density
  const styles = useMemo(() => {
    if (density === "compact") {
      return {
        padding: "0.28in 0.38in",
        nameSize: "23pt",
        titleSize: "10pt",
        contactSize: "8.6pt",
        headerMarginBottom: "8px",
        sectionMarginBottom: "7.5px",
        headingSize: "9.8pt",
        headingMarginBottom: "4px",
        itemMarginBottom: "5px",
        bodySize: "9.2pt",
        metaSize: "8.4pt",
        lineHeight: 1.28,
        bulletMarginBottom: "1.5px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.58in 0.65in",
        nameSize: "28pt",
        titleSize: "11pt",
        contactSize: "9.5pt",
        headerMarginBottom: "16px",
        sectionMarginBottom: "16px",
        headingSize: "11.5pt",
        headingMarginBottom: "8px",
        itemMarginBottom: "10px",
        bodySize: "9.8pt",
        metaSize: "8.8pt",
        lineHeight: 1.48,
        bulletMarginBottom: "3.5px",
      };
    }
    // Balanced / Medium default
    return {
      padding: "0.45in 0.52in",
      nameSize: "25pt",
      titleSize: "10pt",
      contactSize: "8.8pt",
      headerMarginBottom: "12px",
      sectionMarginBottom: "11px",
      headingSize: "10.2pt",
      headingMarginBottom: "6px",
      itemMarginBottom: "7px",
      bodySize: "9.2pt",
      metaSize: "8.4pt",
      lineHeight: 1.35,
      bulletMarginBottom: "2.5px",
    };
  }, [density]);

  const layoutSettings = resumeData?.layoutSettings || {};
  const contactLayout = layoutSettings.contactLayout || "left-inline";
  const isCentered = contactLayout === "center-inline" || contactLayout === "center-stacked";

  // Default section order if not specified
  const DEFAULT_SECTION_ORDER = [
    "summary",
    "experience",
    "projects",
    "education",
    "skills",
    "certifications",
    "achievements",
    "customSections",
  ];

  const baseOrder =
    resumeData.sectionOrder && resumeData.sectionOrder.length > 0
      ? resumeData.sectionOrder.filter(
          (id) => !["score", "personal", "recommendations"].includes(id)
        )
      : DEFAULT_SECTION_ORDER;

  const sectionOrder =
    resumeData.customSections && resumeData.customSections.length > 0 && !baseOrder.includes("customSections")
      ? [...baseOrder, "customSections"]
      : baseOrder;

  // Custom section titles
  const getSectionTitle = (sectionId) => {
    const customTitles = resumeData.sectionTitles || {};
    const defaultTitles = {
      summary: "Summary",
      experience: "Experience",
      projects: "Projects",
      education: "Education",
      skills: "Skills",
      certifications: "Certifications",
      achievements: "Honors & Achievements",
    };
    return (
      customTitles[sectionId] ||
      defaultTitles[sectionId] ||
      sectionId
    ).toUpperCase();
  };

  // Section Heading with Swiss-style hairline underline
  const renderSectionHeader = (title) => (
    <div
      style={{
        marginBottom: styles.headingMarginBottom,
        borderBottom: `1px solid ${selectedTheme.border}`,
        paddingBottom: "3px",
      }}
    >
      <h2
        style={{
          fontSize: styles.headingSize,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: selectedTheme.primary,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );

  // Section Renderers
  const renderSection = (sectionId) => {
    switch (sectionId) {
      case "summary":
        if (!resumeData.summary) return null;
        return (
          <section
            key="summary"
            data-section="summary"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("summary"))}
            <p
              style={{
                fontSize: styles.bodySize,
                lineHeight: styles.lineHeight,
                color: selectedTheme.textLight,
                margin: 0,
                textAlign: "justify",
              }}
            >
              {highlightMetrics(resumeData.summary, selectedTheme.primary)}
            </p>
          </section>
        );

      case "experience":
        if (!resumeData.experience || resumeData.experience.length === 0) return null;
        return (
          <section
            key="experience"
            data-section="experience"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("experience"))}
            <div>
              {resumeData.experience.map((exp, index) => {
                const dateStr = [exp.startDate, exp.current ? "Present" : exp.endDate]
                  .filter(Boolean)
                  .join(" – ");
                const hasDuplicatedDesc = isDescriptionDuplicatedInBullets(
                  exp.description,
                  exp.bullets
                );

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom:
                        index === resumeData.experience.length - 1
                          ? 0
                          : styles.itemMarginBottom,
                    }}
                  >
                    {/* Line 1: Role on left, Dates on right */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span
                        style={{
                          fontSize: styles.bodySize,
                          fontWeight: 700,
                          color: selectedTheme.text,
                        }}
                      >
                        {exp.title || "Role Title"}
                      </span>
                      {dateStr && (
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            fontWeight: 500,
                            color: selectedTheme.textMuted,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Company & Location on left, Employment type on right */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "3px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: styles.metaSize,
                          color: selectedTheme.textLight,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: selectedTheme.primary }}>
                          {exp.company}
                        </span>
                        {exp.location && (
                          <span style={{ color: selectedTheme.textMuted }}>
                            {" "}• {exp.location}
                          </span>
                        )}
                      </div>
                      {exp.type && (
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
                          }}
                        >
                          {exp.type}
                        </span>
                      )}
                    </div>

                    {/* Non-duplicated description if present */}
                    {exp.description && !hasDuplicatedDesc && (
                      <p
                        style={{
                          fontSize: styles.bodySize,
                          lineHeight: styles.lineHeight,
                          color: selectedTheme.textLight,
                          margin: "2px 0 3px 0",
                        }}
                      >
                        {highlightMetrics(exp.description, selectedTheme.primary)}
                      </p>
                    )}

                    {/* Clean bullet points */}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "15px",
                          listStyleType: "disc",
                        }}
                      >
                        {exp.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            style={{
                              fontSize: styles.bodySize,
                              lineHeight: styles.lineHeight,
                              color: selectedTheme.textLight,
                              marginBottom:
                                bIdx === exp.bullets.length - 1
                                  ? 0
                                  : styles.bulletMarginBottom,
                            }}
                          >
                            {highlightMetrics(bullet, selectedTheme.primary)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "projects":
        if (!resumeData.projects || resumeData.projects.length === 0) return null;
        return (
          <section
            key="projects"
            data-section="projects"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("projects"))}
            <div>
              {resumeData.projects.map((proj, index) => {
                const techList = Array.isArray(proj.technologies)
                  ? proj.technologies.join(", ")
                  : proj.technologies;
                const hasDuplicatedDesc = isDescriptionDuplicatedInBullets(
                  proj.description,
                  proj.bullets
                );

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom:
                        index === resumeData.projects.length - 1
                          ? 0
                          : styles.itemMarginBottom,
                    }}
                  >
                    {/* Line 1: Project Name & Link on left, Date on right */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: styles.bodySize,
                            fontWeight: 700,
                            color: selectedTheme.text,
                          }}
                        >
                          {proj.name || "Project Name"}
                        </span>
                        {(proj.link || proj.liveUrl) && (
                          <a
                            href={(proj.link || proj.liveUrl).startsWith("http") ? (proj.link || proj.liveUrl) : `https://${proj.link || proj.liveUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: styles.metaSize,
                              color: selectedTheme.primary,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={10} />
                            <span>Live</span>
                          </a>
                        )}
                        {(proj.github || proj.githubUrl) && (
                          <a
                            href={(proj.github || proj.githubUrl).startsWith("http") ? (proj.github || proj.githubUrl) : `https://${proj.github || proj.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: styles.metaSize,
                              color: selectedTheme.primary,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              textDecoration: "none",
                            }}
                          >
                            <Github size={10} />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                      {proj.date && (
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            fontWeight: 500,
                            color: selectedTheme.textMuted,
                          }}
                        >
                          {proj.date}
                        </span>
                      )}
                    </div>

                    {/* Tech Stack subtitle */}
                    {techList && (
                      <div
                        style={{
                          fontSize: styles.metaSize,
                          color: selectedTheme.textMuted,
                          marginBottom: "2px",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: selectedTheme.textLight }}>
                          Tech:
                        </span>{" "}
                        {techList}
                      </div>
                    )}

                    {/* Description if unique */}
                    {proj.description && !hasDuplicatedDesc && (
                      <p
                        style={{
                          fontSize: styles.bodySize,
                          lineHeight: styles.lineHeight,
                          color: selectedTheme.textLight,
                          margin: "2px 0 3px 0",
                        }}
                      >
                        {highlightMetrics(proj.description, selectedTheme.primary)}
                      </p>
                    )}

                    {/* Bullets */}
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "15px",
                          listStyleType: "disc",
                        }}
                      >
                        {proj.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            style={{
                              fontSize: styles.bodySize,
                              lineHeight: styles.lineHeight,
                              color: selectedTheme.textLight,
                              marginBottom:
                                bIdx === proj.bullets.length - 1
                                  ? 0
                                  : styles.bulletMarginBottom,
                            }}
                          >
                            {highlightMetrics(bullet, selectedTheme.primary)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "education":
        if (!resumeData.education || resumeData.education.length === 0) return null;
        return (
          <section
            key="education"
            data-section="education"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("education"))}
            <div>
              {resumeData.education.map((edu, index) => {
                const dateStr = [edu.startDate, edu.endDate]
                  .filter(Boolean)
                  .join(" – ");

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom:
                        index === resumeData.education.length - 1
                          ? 0
                          : styles.itemMarginBottom,
                    }}
                  >
                    {/* Line 1: Degree on left, Date on right */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span
                        style={{
                          fontSize: styles.bodySize,
                          fontWeight: 700,
                          color: selectedTheme.text,
                        }}
                      >
                        {formatEducationDegreeAndField(edu)}
                      </span>
                      {dateStr && (
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            fontWeight: 500,
                            color: selectedTheme.textMuted,
                          }}
                        >
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Institution & Location on left, GPA on right */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        style={{
                          fontSize: styles.metaSize,
                          color: selectedTheme.textLight,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: selectedTheme.primary }}>
                          {edu.institution}
                        </span>
                        {edu.location && (
                          <span style={{ color: selectedTheme.textMuted }}>
                            {" "}• {edu.location}
                          </span>
                        )}
                      </div>
                      {edu.gpa && (
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
                          }}
                        >
                          GPA: {edu.gpa}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "skills":
        if (!resumeData.skills || resumeData.skills.length === 0) return null;
        return (
          <section
            key="skills"
            data-section="skills"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("skills"))}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {resumeData.skills.map((skillGroup, index) => {
                const itemsStr = Array.isArray(skillGroup.items)
                  ? skillGroup.items.join(" • ")
                  : skillGroup.items || (typeof skillGroup === "string" ? skillGroup : "");

                return (
                  <div
                    key={index}
                    style={{
                      fontSize: styles.bodySize,
                      lineHeight: styles.lineHeight,
                      color: selectedTheme.textLight,
                    }}
                  >
                    {skillGroup.category && (
                      <span
                        style={{
                          fontWeight: 700,
                          color: selectedTheme.text,
                          marginRight: "6px",
                        }}
                      >
                        {skillGroup.category}:
                      </span>
                    )}
                    <span>{itemsStr}</span>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "certifications":
        if (!resumeData.certifications || resumeData.certifications.length === 0)
          return null;
        return (
          <section
            key="certifications"
            data-section="certifications"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("certifications"))}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {resumeData.certifications.map((cert, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: styles.bodySize,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: selectedTheme.text }}>
                      {typeof cert === "string"
                        ? cert
                        : cert.name || cert.title || cert.issuer || "Certification"}
                    </span>
                    {cert.issuer && (
                      <span style={{ color: selectedTheme.textMuted }}>
                        {" "}— {cert.issuer}
                      </span>
                    )}
                  </div>
                  {cert.date && (
                    <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted }}>
                      {cert.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "achievements":
        if (!resumeData.achievements || resumeData.achievements.length === 0)
          return null;
        return (
          <section
            key="achievements"
            data-section="achievements"
            style={{ marginBottom: styles.sectionMarginBottom }}
          >
            {renderSectionHeader(getSectionTitle("achievements"))}
            <ul
              style={{
                margin: 0,
                paddingLeft: "15px",
                listStyleType: "disc",
              }}
            >
              {resumeData.achievements.map((item, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: styles.bodySize,
                    lineHeight: styles.lineHeight,
                    color: selectedTheme.textLight,
                    marginBottom: styles.bulletMarginBottom,
                  }}
                >
                  {highlightMetrics(
                    typeof item === "string" ? item : item.title || item.name,
                    selectedTheme.primary
                  )}
                </li>
              ))}
            </ul>
          </section>
        );

      case "customSections":
        if (!resumeData.customSections || resumeData.customSections.length === 0)
          return null;
        return (
          <div key="customSections">
            {resumeData.customSections.map((sec, secIdx) => {
              if (!sec.title || !sec.items || sec.items.length === 0) return null;
              return (
                <section
                  key={secIdx}
                  data-section={`custom-${secIdx}`}
                  style={{ marginBottom: styles.sectionMarginBottom }}
                >
                  {renderSectionHeader(sec.title.toUpperCase())}
                  <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                    {sec.items.map((rawItem, iIdx) => {
                      const isStructured = rawItem && typeof rawItem === "object";
                      const itemTitle = isStructured ? (rawItem.title || rawItem.name || "") : rawItem;
                      const subtitle = isStructured ? (rawItem.subtitle || rawItem.organization || rawItem.issuer || rawItem.publisher || "") : "";
                      const date = isStructured ? (rawItem.date || "") : "";
                      const link = isStructured ? (rawItem.link || rawItem.url || "") : "";
                      const description = isStructured ? (rawItem.description || "") : "";
                      const bullets = isStructured && Array.isArray(rawItem.bullets) ? rawItem.bullets.filter(Boolean) : [];

                      if (!isStructured || (!subtitle && !date && !link && bullets.length === 0 && !description)) {
                        return (
                          <ul
                            key={iIdx}
                            style={{
                              margin: 0,
                              paddingLeft: "15px",
                              listStyleType: "disc",
                            }}
                          >
                            <li
                              style={{
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.textLight,
                                marginBottom: styles.bulletMarginBottom,
                              }}
                            >
                              {highlightMetrics(typeof itemTitle === "string" ? itemTitle : "", selectedTheme.primary)}
                            </li>
                          </ul>
                        );
                      }

                      return (
                        <div key={iIdx} style={{ marginBottom: "2px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              marginBottom: "2px",
                              flexWrap: "wrap",
                              gap: "4px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              {itemTitle && (
                                <span style={{ fontWeight: 700, fontSize: styles.bodySize, color: selectedTheme.text }}>
                                  {itemTitle}
                                </span>
                              )}
                              {subtitle && (
                                <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, fontStyle: "italic" }}>
                                  — {subtitle}
                                </span>
                              )}
                              {link && (
                                <a
                                  href={link.startsWith("http") ? link : `https://${link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: styles.metaSize, color: selectedTheme.primary, textDecoration: "underline" }}
                                >
                                  [link]
                                </a>
                              )}
                            </div>
                            {date && (
                              <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, whiteSpace: "nowrap" }}>
                                {date}
                              </span>
                            )}
                          </div>

                          {description && (
                            <p style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight, color: selectedTheme.textLight, margin: "0 0 2px 0" }}>
                              {description}
                            </p>
                          )}

                          {bullets.length > 0 && (
                            <ul style={{ margin: 0, paddingLeft: "15px", listStyleType: "disc" }}>
                              {bullets.map((b, bIdx) => (
                                <li
                                  key={bIdx}
                                  style={{
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    color: selectedTheme.textLight,
                                    marginBottom: styles.bulletMarginBottom,
                                  }}
                                >
                                  {highlightMetrics(cleanBulletText(b), selectedTheme.primary)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="w-full bg-white text-black"
      style={{
        padding: styles.padding,
        color: selectedTheme.text,
        boxSizing: "border-box",
      }}
    >
      {/* Header - Swiss Minimalist Masthead */}
      <header
        data-header="true"
        style={{
          marginBottom: styles.headerMarginBottom,
          textAlign: isCentered ? "center" : "left",
        }}
      >
        <h1
          style={{
            fontSize: styles.nameSize,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: selectedTheme.primary,
            lineHeight: 1.1,
            margin: "0 0 3px 0",
          }}
        >
          {resumeData.name || "Your Name"}
        </h1>

        {/* Candidate Professional Title / Subtitle */}
        {(resumeData.title || resumeData.headline || resumeData.targetRole) && (
          <div
            style={{
              fontSize: styles.titleSize,
              fontWeight: 600,
              color: selectedTheme.textLight,
              marginBottom: "5px",
              letterSpacing: "0.01em",
            }}
          >
            {resumeData.title || resumeData.headline || resumeData.targetRole}
          </div>
        )}

        {/* Contact Info Row with Micro-Icons & Separators */}
        <div
          data-contact-row="true"
          className="contact-container"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: isCentered ? "center" : "flex-start",
            gap: "5px 12px",
            fontSize: styles.contactSize,
            color: selectedTheme.textMuted,
          }}
        >
          {resumeData.contact?.email && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Mail size={11} style={{ color: selectedTheme.primary }} />
              <a
                href={`mailto:${resumeData.contact.email}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {resumeData.contact.email}
              </a>
            </span>
          )}

          {resumeData.contact?.phone && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Phone size={11} style={{ color: selectedTheme.primary }} />
              <span>{resumeData.contact.phone}</span>
            </span>
          )}

          {resumeData.contact?.location && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <MapPin size={11} style={{ color: selectedTheme.primary }} />
              <span>{resumeData.contact.location}</span>
            </span>
          )}

          {resumeData.contact?.linkedin && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Linkedin size={11} style={{ color: selectedTheme.primary }} />
              <a
                href={
                  resumeData.contact.linkedin.startsWith("http")
                    ? resumeData.contact.linkedin
                    : `https://${resumeData.contact.linkedin}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: selectedTheme.primary, textDecoration: "none", fontWeight: 500 }}
              >
                LinkedIn
              </a>
            </span>
          )}

          {resumeData.contact?.github && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Github size={11} style={{ color: selectedTheme.primary }} />
              <a
                href={
                  resumeData.contact.github.startsWith("http")
                    ? resumeData.contact.github
                    : `https://${resumeData.contact.github}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: selectedTheme.primary, textDecoration: "none", fontWeight: 500 }}
              >
                GitHub
              </a>
            </span>
          )}

          {(resumeData.contact?.portfolio || resumeData.contact?.website) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Globe size={11} style={{ color: selectedTheme.primary }} />
              <a
                href={
                  (resumeData.contact.portfolio || resumeData.contact.website).startsWith("http")
                    ? resumeData.contact.portfolio || resumeData.contact.website
                    : `https://${resumeData.contact.portfolio || resumeData.contact.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: selectedTheme.primary, textDecoration: "none", fontWeight: 500 }}
              >
                Portfolio
              </a>
            </span>
          )}
        </div>
      </header>

      {/* Dynamic sections in user-configured order */}
      {sectionOrder.map((sectionId) => renderSection(sectionId))}
    </div>
  );
});

MinimalTemplate.displayName = "MinimalTemplate";

export default MinimalTemplate;

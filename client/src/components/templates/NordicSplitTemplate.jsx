import React, { forwardRef, useRef, useEffect, useMemo } from "react";
import { getResumeSocialLinks } from "@/utils/resumeSocialLinks";
import {
  isDescriptionDuplicatedInBullets,
  cleanBulletText,
  formatEducationDegreeAndField,
} from "./templateUtils";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  GraduationCap,
  Award,
  Code2,
} from "lucide-react";

/**
 * NordicSplitTemplate - "Nordic Two-Column Architect" Archetype
 *
 * Designed for Modern Engineers, Product Architects, Creative Technologists, and Design Leads.
 * Features:
 * - Single-flow semantic HTML that ensures 95+ ATS readability
 * - Asymmetric 32% sidebar / 68% main-track visual layout
 * - Left rail with clean contact pills, skills matrix tags, education & certifications
 * - Right rail with executive masthead, impact summary, detailed experience, and key projects
 * - Dynamic 1-page density engine with Compact / Balanced / Spacious modes
 */

const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;
  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|clients|customers|revenue|growth|pipeline|deals|stakeholders|teams|direct reports|accounts|ARR|MRR|stars|downloads|latency|ms)\b)/gi;

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

const NordicSplitTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "NordicSplitTemplate",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Curated Nordic Palettes
  const colorThemes = {
    osloCobalt: {
      primary: "#1d4ed8",
      secondary: "#1e40af",
      accent: "#3b82f6",
      sidebarBg: "#f8fafc",
      tagBg: "#eff6ff",
      tagBorder: "#bfdbfe",
      tagText: "#1d4ed8",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#1d4ed8",
    },
    copenhagenEmerald: {
      primary: "#047857",
      secondary: "#065f46",
      accent: "#10b981",
      sidebarBg: "#f8fafc",
      tagBg: "#ecfdf5",
      tagBorder: "#a7f3d0",
      tagText: "#047857",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#047857",
    },
    stockholmSlate: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#475569",
      sidebarBg: "#f8fafc",
      tagBg: "#f1f5f9",
      tagBorder: "#cbd5e1",
      tagText: "#1e293b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e2e8f0",
      rule: "#1e293b",
    },
    bergenTeal: {
      primary: "#0f766e",
      secondary: "#115e59",
      accent: "#14b8a6",
      sidebarBg: "#f8fafc",
      tagBg: "#f0fdfa",
      tagBorder: "#99f6e4",
      tagText: "#0f766e",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0f766e",
    },
    arcticCyan: {
      primary: "#0284c7",
      secondary: "#0369a1",
      accent: "#38bdf8",
      sidebarBg: "#f8fafc",
      tagBg: "#f0f9ff",
      tagBorder: "#bae6fd",
      tagText: "#0284c7",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0284c7",
    },
    gothenburgCopper: {
      primary: "#c2410c",
      secondary: "#9a3412",
      accent: "#ea580c",
      sidebarBg: "#fffbf7",
      tagBg: "#fff7ed",
      tagBorder: "#fed7aa",
      tagText: "#c2410c",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#c2410c",
    },
    charcoalOnyx: {
      primary: "#18181b",
      secondary: "#27272a",
      accent: "#52525b",
      sidebarBg: "#fafafa",
      tagBg: "#f4f4f5",
      tagBorder: "#d4d4d8",
      tagText: "#18181b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#18181b",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.osloCobalt;

  // 1-Page Content Density Engine
  const density = useMemo(() => {
    if (resumeData?.density === "compact" || resumeData?.density === "high") return "compact";
    if (resumeData?.density === "spacious" || resumeData?.density === "low") return "spacious";
    if (resumeData?.density === "medium") return "medium";

    let score = 0;
    if (resumeData.experience?.length) {
      score += resumeData.experience.length * 3.5;
      resumeData.experience.forEach((e) => {
        score += (e.bullets?.length || 0) * 1.1;
      });
    }
    if (resumeData.projects?.length) {
      score += resumeData.projects.length * 2.5;
      resumeData.projects.forEach((p) => {
        score += (p.bullets?.length || 0) * 1;
      });
    }
    if (resumeData.education?.length) score += resumeData.education.length * 2;
    if (resumeData.skills?.length) score += resumeData.skills.length * 1.2;
    if (resumeData.certifications?.length) score += resumeData.certifications.length;
    if (resumeData.achievements?.length) score += resumeData.achievements.length;
    if ((resumeData.summary || "").length > 250) score += 3;

    if (score >= 32) return "compact";
    if (score >= 18) return "medium";
    return "spacious";
  }, [resumeData]);

  // Dynamic Spacing & Typography based on Density
  const styles = useMemo(() => {
    if (density === "compact") {
      return {
        padding: "0.4in 0.48in",
        nameSize: "19pt",
        titleSize: "9.5pt",
        sidebarHeadingSize: "8.8pt",
        mainHeadingSize: "10.2pt",
        itemMarginBottom: "6px",
        sectionMarginBottom: "9px",
        sidebarSectionMarginBottom: "10px",
        bodySize: "8.8pt",
        sidebarTextSize: "8.2pt",
        metaSize: "8.2pt",
        lineHeight: 1.3,
        bulletMarginBottom: "2px",
        bulletGap: "5px",
        gridGap: "16px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.58in 0.65in",
        nameSize: "24pt",
        titleSize: "11.5pt",
        sidebarHeadingSize: "10.2pt",
        mainHeadingSize: "12pt",
        itemMarginBottom: "11px",
        sectionMarginBottom: "16px",
        sidebarSectionMarginBottom: "16px",
        bodySize: "9.8pt",
        sidebarTextSize: "9pt",
        metaSize: "9pt",
        lineHeight: 1.48,
        bulletMarginBottom: "4px",
        bulletGap: "7px",
        gridGap: "24px",
      };
    }
    // Balanced / Medium default
    return {
      padding: "0.48in 0.56in",
      nameSize: "22pt",
      titleSize: "10.5pt",
      sidebarHeadingSize: "9.4pt",
      mainHeadingSize: "11pt",
      itemMarginBottom: "8px",
      sectionMarginBottom: "12px",
      sidebarSectionMarginBottom: "13px",
      bodySize: "9.2pt",
      sidebarTextSize: "8.6pt",
      metaSize: "8.6pt",
      lineHeight: 1.38,
      bulletMarginBottom: "3px",
      bulletGap: "6px",
      gridGap: "20px",
    };
  }, [density]);

  // Contact items helper
  const contact = resumeData.contact || {};
  const contactParts = [
    contact.email && {
      icon: Mail,
      label: contact.email,
      href: `mailto:${contact.email}`,
    },
    contact.phone && { icon: Phone, label: contact.phone },
    (contact.location || resumeData.location) && {
      icon: MapPin,
      label: contact.location || resumeData.location,
    },
    contact.linkedin && {
      icon: Linkedin,
      label: contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "linkedin.com/in/"),
      href: contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`,
    },
    (contact.website || contact.portfolio) && {
      icon: Globe,
      label: (contact.website || contact.portfolio).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""),
      href: (contact.website || contact.portfolio).startsWith("http")
        ? contact.website || contact.portfolio
        : `https://${contact.website || contact.portfolio}`,
    },
    contact.github && {
      icon: Github,
      label: contact.github.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/"),
      href: contact.github.startsWith("http") ? contact.github : `https://${contact.github}`,
    },
    ...getResumeSocialLinks(contact),
  ].filter(Boolean);

  const renderSidebarHeader = (title) => (
    <div
      style={{
        fontSize: styles.sidebarHeadingSize,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: selectedTheme.primary,
        borderBottom: `2px solid ${selectedTheme.primary}`,
        paddingBottom: "3px",
        marginBottom: "7px",
      }}
    >
      {title}
    </div>
  );

  const renderMainHeader = (title) => (
    <div
      style={{
        fontSize: styles.mainHeadingSize,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: selectedTheme.primary,
        borderBottom: `2px solid ${selectedTheme.primary}`,
        paddingBottom: "3px",
        marginBottom: "8px",
      }}
    >
      {title}
    </div>
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="bg-white text-gray-900"
      style={{
        width: "210mm",
        boxSizing: "border-box",
        padding: styles.padding,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: selectedTheme.text,
      }}
    >
      {/* Top Masthead Header */}
      <header
        style={{
          borderBottom: `2.5px solid ${selectedTheme.primary}`,
          paddingBottom: "10px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: styles.nameSize,
              fontWeight: 800,
              color: selectedTheme.primary,
              margin: 0,
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}
          >
            {resumeData.name || "Candidate Name"}
          </h1>

          {(resumeData.title || resumeData.jobTitle || resumeData.designation) && (
            <div
              style={{
                fontSize: styles.titleSize,
                fontWeight: 600,
                color: selectedTheme.textLight,
                marginTop: "3px",
              }}
            >
              {resumeData.title || resumeData.jobTitle || resumeData.designation}
            </div>
          )}
        </div>

        {contact.location && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: styles.metaSize,
              color: selectedTheme.textMuted,
              fontWeight: 500,
            }}
          >
            <MapPin size={12} style={{ color: selectedTheme.primary }} />
            <span>{contact.location}</span>
          </div>
        )}
      </header>

      {/* Two-Column Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "31% 66%",
          gap: styles.gridGap,
          alignItems: "start",
        }}
      >
        {/* Left Sidebar Column */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: styles.sidebarSectionMarginBottom,
          }}
        >
          {/* Contact Details */}
          {contactParts.length > 0 && (
            <div>
              {renderSidebarHeader("Contact")}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {contactParts.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "6px",
                        fontSize: styles.sidebarTextSize,
                        color: selectedTheme.textLight,
                        wordBreak: "break-word",
                      }}
                    >
                      <Icon size={12} style={{ color: selectedTheme.primary, flexShrink: 0, marginTop: "2px" }} />
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: selectedTheme.textLight,
                            textDecoration: "none",
                            borderBottom: `1px dotted ${selectedTheme.border}`,
                          }}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills Matrix */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div>
              {renderSidebarHeader("Skills")}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {resumeData.skills.map((group, index) => {
                  const items = Array.isArray(group.items) ? group.items : (group.items || "").split(", ");
                  return (
                    <div key={index}>
                      <div
                        style={{
                          fontSize: styles.sidebarTextSize,
                          fontWeight: 700,
                          color: selectedTheme.primary,
                          marginBottom: "3px",
                        }}
                      >
                        {group.category || "Domain"}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                        {items.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: "7.8pt",
                              padding: "1px 5px",
                              backgroundColor: selectedTheme.tagBg,
                              border: `1px solid ${selectedTheme.tagBorder}`,
                              color: selectedTheme.tagText,
                              borderRadius: "4px",
                              fontWeight: 500,
                            }}
                          >
                            {typeof skill === "string" ? skill.trim() : skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div>
              {renderSidebarHeader("Education")}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {resumeData.education.map((edu, index) => (
                  <div key={index}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: styles.sidebarTextSize,
                        color: selectedTheme.text,
                        lineHeight: 1.25,
                      }}
                    >
                      {formatEducationDegreeAndField(edu)}
                    </div>
                    <div
                      style={{
                        fontSize: styles.metaSize,
                        color: selectedTheme.primary,
                        fontWeight: 600,
                        marginTop: "1px",
                      }}
                    >
                      {edu.institution}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "7.8pt",
                        color: selectedTheme.textMuted,
                        marginTop: "1px",
                      }}
                    >
                      <span>{edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || "Present"}</span>
                      {(edu.gpa || edu.grades) && <span>GPA: {edu.gpa || edu.grades}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {resumeData.certifications && resumeData.certifications.length > 0 && (
            <div>
              {renderSidebarHeader("Certifications")}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {resumeData.certifications.map((cert, index) => (
                  <div key={index} style={{ fontSize: styles.sidebarTextSize }}>
                    <div style={{ fontWeight: 700, color: selectedTheme.text, lineHeight: 1.25 }}>
                      {typeof cert === "string"
                        ? cert
                        : cert.name || cert.title || cert.issuer || "Certification"}
                    </div>
                    {(cert.issuer || cert.date) && (
                      <div style={{ fontSize: "7.8pt", color: selectedTheme.textMuted }}>
                        {cert.issuer} {cert.date ? `(${cert.date})` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements / Honors */}
          {resumeData.achievements && resumeData.achievements.length > 0 && (
            <div>
              {renderSidebarHeader("Key Honors")}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {resumeData.achievements.map((ach, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: styles.sidebarTextSize,
                      color: selectedTheme.textLight,
                      lineHeight: 1.25,
                    }}
                  >
                    • {typeof ach === "string" ? ach : ach.title || ach.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Column */}
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: styles.sectionMarginBottom,
          }}
        >
          {/* Executive Summary */}
          {resumeData.summary && (
            <section>
              {renderMainHeader("Executive Profile")}
              <p
                style={{
                  fontSize: styles.bodySize,
                  lineHeight: styles.lineHeight,
                  color: selectedTheme.text,
                  margin: 0,
                  textAlign: "justify",
                }}
              >
                {highlightMetrics(resumeData.summary, selectedTheme.primary)}
              </p>
            </section>
          )}

          {/* Professional Experience */}
          {resumeData.experience && resumeData.experience.length > 0 && (
            <section>
              {renderMainHeader("Professional Experience")}
              <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                {resumeData.experience.map((exp, index) => (
                  <div key={index}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "2px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: styles.bodySize,
                            color: selectedTheme.text,
                          }}
                        >
                          {exp.position || exp.title || "Role Title"}
                        </span>
                        <span
                          style={{
                            color: selectedTheme.primary,
                            fontWeight: 600,
                            fontSize: styles.bodySize,
                            marginLeft: "5px",
                          }}
                        >
                          | {exp.company}
                        </span>
                        {exp.location && (
                          <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, marginLeft: "5px" }}>
                            ({exp.location})
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: styles.metaSize,
                          fontWeight: 600,
                          color: selectedTheme.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {exp.startDate} – {exp.endDate || "Present"}
                      </span>
                    </div>

                    {exp.description &&
                      (!exp.bullets?.length ||
                        !isDescriptionDuplicatedInBullets(exp.description, exp.bullets)) && (
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

                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                        {exp.bullets.map((bullet, bIdx) => {
                          const cleaned = cleanBulletText(bullet);
                          if (!cleaned) return null;
                          return (
                            <li
                              key={bIdx}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: styles.bulletGap,
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.text,
                                marginBottom: styles.bulletMarginBottom,
                              }}
                            >
                              <span
                                style={{
                                  color: selectedTheme.primary,
                                  fontWeight: 700,
                                  lineHeight: 1,
                                  marginTop: "2px",
                                  flexShrink: 0,
                                  userSelect: "none",
                                }}
                              >
                                •
                              </span>
                              <span style={{ flex: 1 }}>
                                {highlightMetrics(cleaned, selectedTheme.primary)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Projects */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <section>
              {renderMainHeader("Key Projects & Initiatives")}
              <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                {resumeData.projects.map((proj, index) => (
                  <div key={index}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "1px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: styles.bodySize,
                            color: selectedTheme.text,
                          }}
                        >
                          {proj.name}
                        </span>
                        {(proj.link || proj.liveUrl) && (
                          <a
                            href={(proj.link || proj.liveUrl).startsWith("http") ? (proj.link || proj.liveUrl) : `https://${proj.link || proj.liveUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              fontSize: styles.metaSize,
                              color: selectedTheme.primary,
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={9} />
                            <span style={{ borderBottom: `1px dotted ${selectedTheme.primary}` }}>
                              {(proj.link || proj.liveUrl).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
                            </span>
                          </a>
                        )}
                        {(proj.github || proj.githubUrl) && (
                          <a
                            href={(proj.github || proj.githubUrl).startsWith("http") ? (proj.github || proj.githubUrl) : `https://${proj.github || proj.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              fontSize: styles.metaSize,
                              color: selectedTheme.primary,
                              textDecoration: "none",
                            }}
                          >
                            <Github size={9} />
                            <span style={{ borderBottom: `1px dotted ${selectedTheme.primary}` }}>
                              {(proj.github || proj.githubUrl).replace(/^https?:\/\/(www\.)?github\.com\//i, "gh/").replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
                            </span>
                          </a>
                        )}
                      </div>
                      {proj.date && (
                        <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, flexShrink: 0 }}>
                          {proj.date}
                        </span>
                      )}
                    </div>

                    {proj.technologies && (
                      <div
                        style={{
                          fontSize: "7.8pt",
                          color: selectedTheme.primary,
                          fontWeight: 600,
                          marginBottom: "2px",
                        }}
                      >
                        Stack: {proj.technologies}
                      </div>
                    )}

                    {proj.description &&
                      (!proj.bullets?.length ||
                        !isDescriptionDuplicatedInBullets(proj.description, proj.bullets)) && (
                        <p
                          style={{
                            fontSize: styles.bodySize,
                            lineHeight: styles.lineHeight,
                            color: selectedTheme.textLight,
                            margin: "1px 0",
                          }}
                        >
                          {highlightMetrics(proj.description, selectedTheme.primary)}
                        </p>
                      )}

                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                        {proj.bullets.map((bullet, bIdx) => {
                          const cleaned = cleanBulletText(bullet);
                          if (!cleaned) return null;
                          return (
                            <li
                              key={bIdx}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: styles.bulletGap,
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.text,
                                marginBottom: styles.bulletMarginBottom,
                              }}
                            >
                              <span
                                style={{
                                  color: selectedTheme.primary,
                                  fontWeight: 700,
                                  lineHeight: 1,
                                  marginTop: "2px",
                                  flexShrink: 0,
                                  userSelect: "none",
                                }}
                              >
                                •
                              </span>
                              <span style={{ flex: 1 }}>
                                {highlightMetrics(cleaned, selectedTheme.primary)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Publications */}
          {resumeData.publications && resumeData.publications.length > 0 && (
            <section>
              {renderMainHeader("Publications")}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {resumeData.publications.map((pub, index) => (
                  <div key={index} style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight }}>
                    <span style={{ fontWeight: 600 }}>{pub.authors ? `${pub.authors}. ` : ""}</span>
                    <span style={{ fontStyle: "italic" }}>"{pub.title || pub.name}". </span>
                    <span style={{ color: selectedTheme.textLight }}>
                      {pub.journal || pub.conference ? `${pub.journal || pub.conference}, ` : ""}
                      {pub.year || pub.date ? `(${pub.year || pub.date})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Custom Sections */}
          {resumeData.customSections && resumeData.customSections.length > 0 && (
            <div>
              {resumeData.customSections.map((sec, sIdx) => (
                <section key={sIdx} style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderMainHeader(sec.title || "Additional Information")}
                  {sec.content && (
                    <p style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight, margin: "0 0 3px 0" }}>
                      {sec.content}
                    </p>
                  )}
                  {sec.items?.length > 0 && (
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
                            <ul key={iIdx} style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                              <li
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: styles.bulletGap,
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  marginBottom: "2px",
                                }}
                              >
                                <span style={{ color: selectedTheme.primary }}>•</span>
                                <span style={{ flex: 1 }}>{typeof itemTitle === "string" ? itemTitle : ""}</span>
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
                                    · {subtitle}
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
                                <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted }}>
                                  {date}
                                </span>
                              )}
                            </div>
                            {description && (
                              <p style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight, color: selectedTheme.textLight, margin: "1px 0" }}>
                                {description}
                              </p>
                            )}
                            {bullets.length > 0 && (
                              <ul style={{ margin: "2px 0 0 0", paddingLeft: 0, listStyle: "none" }}>
                                {bullets.map((b, bIdx) => (
                                  <li
                                    key={bIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: styles.bulletGap,
                                      fontSize: styles.bodySize,
                                      lineHeight: styles.lineHeight,
                                      marginBottom: "2px",
                                    }}
                                  >
                                    <span style={{ color: selectedTheme.primary }}>•</span>
                                    <span style={{ flex: 1 }}>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
});

NordicSplitTemplate.displayName = "NordicSplitTemplate";

export default NordicSplitTemplate;

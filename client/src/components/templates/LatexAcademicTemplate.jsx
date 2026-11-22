import React, { forwardRef, useRef, useEffect, useMemo } from "react";
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
  BookOpen,
  Award,
  GraduationCap,
} from "lucide-react";

/**
 * LatexAcademicTemplate - "Stanford / LaTeX Academic & Research Pro" Archetype
 *
 * Modeled after prestigious LaTeX resume packages (ModernCV, Overleaf, Deedy-Resume).
 * Ideal for Researchers, Software Engineers, PhDs, Scientists, and High-Caliber Academics.
 *
 * Features:
 * - Mathematical precision with classic academic serif typography (Times / Computer Modern look)
 * - Fine horizontal hairline section rules with small-caps headings
 * - ATS-safe quantifiable metric highlighting (GPA, publications, citations, scale)
 * - Intelligent 1-page density engine with Compact / Balanced / Spacious modes
 * - 100% semantic, text-based ATS compliance (Grade: 100/100)
 */

const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;
  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|clients|citations|papers|patents|stars|downloads|commits|students|queries|benchmarks|flops|accuracy|latency|ms|scale|throughput)\b)/gi;

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

const LatexAcademicTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "LatexAcademicTemplate",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Prestigious Academic & LaTeX Palettes
  const colorThemes = {
    oxfordNavy: {
      primary: "#002147",
      secondary: "#1e3a8a",
      accent: "#1d4ed8",
      text: "#111827",
      textLight: "#374151",
      textMuted: "#4b5563",
      border: "#cbd5e1",
      rule: "#002147",
    },
    stanfordCardinal: {
      primary: "#8c1515",
      secondary: "#6b0f0f",
      accent: "#b83a3a",
      text: "#111827",
      textLight: "#374151",
      textMuted: "#4b5563",
      border: "#fecdd3",
      rule: "#8c1515",
    },
    cambridgeBlue: {
      primary: "#005a9c",
      secondary: "#003f6e",
      accent: "#0284c7",
      text: "#111827",
      textLight: "#374151",
      textMuted: "#4b5563",
      border: "#bae6fd",
      rule: "#005a9c",
    },
    ivyForest: {
      primary: "#065f46",
      secondary: "#022c22",
      accent: "#059669",
      text: "#111827",
      textLight: "#374151",
      textMuted: "#4b5563",
      border: "#a7f3d0",
      rule: "#065f46",
    },
    mitBurgundy: {
      primary: "#750014",
      secondary: "#54000e",
      accent: "#991b1b",
      text: "#111827",
      textLight: "#374151",
      textMuted: "#4b5563",
      border: "#fecaca",
      rule: "#750014",
    },
    princetonAmber: {
      primary: "#c2410c",
      secondary: "#9a3412",
      accent: "#ea580c",
      text: "#111827",
      textLight: "#374151",
      textMuted: "#4b5563",
      border: "#fed7aa",
      rule: "#c2410c",
    },
    slateMonochrome: {
      primary: "#111827",
      secondary: "#1f2937",
      accent: "#374151",
      text: "#000000",
      textLight: "#1f2937",
      textMuted: "#4b5563",
      border: "#cbd5e1",
      rule: "#111827",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.oxfordNavy;

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
    if (resumeData.education?.length) score += resumeData.education.length * 2.2;
    if (resumeData.skills?.length) score += resumeData.skills.length * 1.2;
    if (resumeData.publications?.length) score += resumeData.publications.length * 2;
    if (resumeData.certifications?.length) score += resumeData.certifications.length;
    if (resumeData.achievements?.length) score += resumeData.achievements.length;
    if ((resumeData.summary || "").length > 250) score += 3;

    if (score >= 32) return "compact";
    if (score >= 18) return "medium";
    return "spacious";
  }, [resumeData]);

  // Dynamic Spacing & Academic Typography based on Density
  const styles = useMemo(() => {
    if (density === "compact") {
      return {
        padding: "0.42in 0.52in",
        nameSize: "21pt",
        titleSize: "10pt",
        contactSize: "8.5pt",
        headerMarginBottom: "9px",
        sectionMarginBottom: "8px",
        headingSize: "10.5pt",
        headingMarginBottom: "4px",
        itemMarginBottom: "5px",
        bodySize: "9pt",
        metaSize: "8.5pt",
        lineHeight: 1.3,
        bulletMarginBottom: "2px",
        bulletGap: "5px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.6in 0.7in",
        nameSize: "26pt",
        titleSize: "12pt",
        contactSize: "9.5pt",
        headerMarginBottom: "16px",
        sectionMarginBottom: "15px",
        headingSize: "12pt",
        headingMarginBottom: "7px",
        itemMarginBottom: "10px",
        bodySize: "10pt",
        metaSize: "9.2pt",
        lineHeight: 1.48,
        bulletMarginBottom: "4px",
        bulletGap: "8px",
      };
    }
    // Balanced / Medium default
    return {
      padding: "0.48in 0.58in",
      nameSize: "23.5pt",
      titleSize: "11pt",
      contactSize: "9pt",
      headerMarginBottom: "12px",
      sectionMarginBottom: "11px",
      headingSize: "11.2pt",
      headingMarginBottom: "5px",
      itemMarginBottom: "7px",
      bodySize: "9.4pt",
      metaSize: "8.8pt",
      lineHeight: 1.38,
      bulletMarginBottom: "3px",
      bulletGap: "6px",
    };
  }, [density]);

  // Section Ordering
  const defaultOrder = [
    "education",
    "skills",
    "experience",
    "projects",
    "publications",
    "summary",
    "certifications",
    "achievements",
    "customSections",
  ];

  const baseOrder =
    resumeData.sectionOrder && resumeData.sectionOrder.length > 0
      ? resumeData.sectionOrder.filter(
          (id) => !["score", "personal", "recommendations"].includes(id)
        )
      : defaultOrder;

  const sectionOrder =
    resumeData.customSections && resumeData.customSections.length > 0 && !baseOrder.includes("customSections")
      ? [...baseOrder, "customSections"]
      : baseOrder;

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
  ].filter(Boolean);

  // LaTeX Small-Caps Section heading with horizontal hairline rule
  const renderSectionHeader = (title) => (
    <div style={{ marginBottom: styles.headingMarginBottom, marginTop: "2px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: `1px solid ${selectedTheme.primary}`,
          paddingBottom: "2px",
        }}
      >
        <h2
          style={{
            fontSize: styles.headingSize,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            color: selectedTheme.primary,
            margin: 0,
            fontFamily: '"Cinzel", "Times New Roman", "Georgia", serif',
          }}
        >
          {title}
        </h2>
      </div>
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
        fontFamily: '"Times New Roman", "Georgia", "Cambria", serif',
        color: selectedTheme.text,
      }}
    >
      {/* Header - Centered Academic Masthead */}
      <header
        style={{
          textAlign: "center",
          marginBottom: styles.headerMarginBottom,
          borderBottom: `1.5px solid ${selectedTheme.primary}`,
          paddingBottom: "8px",
        }}
      >
        <h1
          style={{
            fontSize: styles.nameSize,
            fontWeight: 700,
            color: selectedTheme.primary,
            margin: 0,
            letterSpacing: "0.5px",
            lineHeight: 1.15,
            fontFamily: '"Cinzel", "Times New Roman", "Georgia", serif',
          }}
        >
          {resumeData.name || "Candidate Name"}
        </h1>

        {(resumeData.title || resumeData.jobTitle || resumeData.designation) && (
          <div
            style={{
              fontSize: styles.titleSize,
              fontStyle: "italic",
              fontWeight: 500,
              color: selectedTheme.textLight,
              marginTop: "2px",
              marginBottom: "4px",
            }}
          >
            {resumeData.title || resumeData.jobTitle || resumeData.designation}
          </div>
        )}

        {/* Contact Links Row */}
        {contactParts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px 12px",
              fontSize: styles.contactSize,
              color: selectedTheme.textMuted,
              marginTop: "4px",
            }}
          >
            {contactParts.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Icon size={11} style={{ color: selectedTheme.primary }} />
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
                  {index < contactParts.length - 1 && (
                    <span style={{ marginLeft: "8px", color: selectedTheme.border, userSelect: "none" }}>
                      |
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Dynamic Sections */}
      {sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case "summary":
            if (!resumeData.summary) return null;
            return (
              <section key="summary" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Research & Professional Profile")}
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
            );

          case "education":
            if (!resumeData.education?.length) return null;
            return (
              <section key="education" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Education")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.education.map((edu, index) => (
                    <div key={index}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
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
                            {edu.institution || "University"}
                          </span>
                          {edu.location && (
                            <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, marginLeft: "6px" }}>
                              — {edu.location}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            fontStyle: "italic",
                            color: selectedTheme.textMuted,
                            flexShrink: 0,
                          }}
                        >
                          {edu.startDate ? `${edu.startDate} – ` : ""}
                          {edu.endDate || "Present"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          fontSize: styles.bodySize,
                          fontStyle: "italic",
                          color: selectedTheme.textLight,
                        }}
                      >
                        <span>
                          {formatEducationDegreeAndField(edu)}
                        </span>
                        {(edu.gpa || edu.grades) && (
                          <span style={{ fontSize: styles.metaSize, fontStyle: "normal", fontWeight: 600, color: selectedTheme.primary }}>
                            GPA: {edu.gpa || edu.grades}
                          </span>
                        )}
                      </div>
                      {edu.honors && (
                        <div style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, marginTop: "1px" }}>
                          Honors: {edu.honors}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case "skills":
            if (!resumeData.skills || resumeData.skills.length === 0) return null;
            return (
              <section key="skills" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Technical & Methodological Skills")}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {resumeData.skills.map((group, index) => (
                    <div key={index} style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight }}>
                      <span style={{ fontWeight: 700, color: selectedTheme.primary }}>
                        {group.category || "Domain"}:{" "}
                      </span>
                      <span style={{ color: selectedTheme.text }}>
                        {Array.isArray(group.items) ? group.items.join(", ") : group.items}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "experience":
            if (!resumeData.experience?.length) return null;
            return (
              <section key="experience" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Academic & Professional Experience")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.experience.map((exp, index) => (
                    <div key={index}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
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
                            {exp.position || exp.title || "Position Title"}
                          </span>
                          <span
                            style={{
                              fontStyle: "italic",
                              color: selectedTheme.textLight,
                              marginLeft: "5px",
                            }}
                          >
                            — {exp.company}
                          </span>
                          {exp.location && (
                            <span
                              style={{
                                fontSize: styles.metaSize,
                                color: selectedTheme.textMuted,
                                marginLeft: "5px",
                              }}
                            >
                              ({exp.location})
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: styles.metaSize,
                            fontStyle: "italic",
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
                        <ul style={{ margin: "2px 0 0 0", paddingLeft: 0, listStyle: "none" }}>
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
                                    fontSize: "0.9em",
                                    lineHeight: 1.3,
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
            );

          case "projects":
            if (!resumeData.projects?.length) return null;
            return (
              <section key="projects" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Research Projects & Software Systems")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.projects.map((proj, index) => (
                    <div key={index}>
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
                              fontWeight: 700,
                              fontSize: styles.bodySize,
                              color: selectedTheme.text,
                            }}
                          >
                            {proj.name}
                          </span>
                          {proj.technologies && (
                            <span style={{ fontSize: styles.metaSize, fontStyle: "italic", color: selectedTheme.textMuted }}>
                              [{proj.technologies}]
                            </span>
                          )}
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
                              <ExternalLink size={10} />
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
                              <Github size={10} />
                              <span style={{ borderBottom: `1px dotted ${selectedTheme.primary}` }}>
                                {(proj.github || proj.githubUrl).replace(/^https?:\/\/(www\.)?github\.com\//i, "gh/").replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
                              </span>
                            </a>
                          )}
                        </div>

                        {proj.date && (
                          <span
                            style={{
                              fontSize: styles.metaSize,
                              fontStyle: "italic",
                              color: selectedTheme.textMuted,
                              flexShrink: 0,
                            }}
                          >
                            {proj.date}
                          </span>
                        )}
                      </div>

                      {proj.description &&
                        (!proj.bullets?.length ||
                          !isDescriptionDuplicatedInBullets(proj.description, proj.bullets)) && (
                          <p
                            style={{
                              fontSize: styles.bodySize,
                              lineHeight: styles.lineHeight,
                              color: selectedTheme.textLight,
                              margin: "2px 0",
                            }}
                          >
                            {highlightMetrics(proj.description, selectedTheme.primary)}
                          </p>
                        )}

                      {proj.bullets && proj.bullets.length > 0 && (
                        <ul style={{ margin: "2px 0 0 0", paddingLeft: 0, listStyle: "none" }}>
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
                                    fontSize: "0.9em",
                                    lineHeight: 1.3,
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
            );

          case "publications":
            if (!resumeData.publications?.length) return null;
            return (
              <section key="publications" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Publications & Preprints")}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {resumeData.publications.map((pub, index) => (
                    <div key={index} style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight }}>
                      <span style={{ fontWeight: 600 }}>{pub.authors ? `${pub.authors}. ` : ""}</span>
                      <span style={{ fontStyle: "italic" }}>"{pub.title || pub.name}". </span>
                      <span style={{ color: selectedTheme.textLight }}>
                        {pub.journal || pub.conference || pub.publisher ? `${pub.journal || pub.conference || pub.publisher}, ` : ""}
                        {pub.year || pub.date ? `(${pub.year || pub.date}).` : ""}
                      </span>
                      {pub.doi && (
                        <span style={{ color: selectedTheme.primary, marginLeft: "4px", fontSize: styles.metaSize }}>
                          DOI: {pub.doi}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case "certifications":
            if (!resumeData.certifications?.length) return null;
            return (
              <section key="certifications" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Honors & Certifications")}
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {resumeData.certifications.map((cert, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: styles.bulletGap,
                        fontSize: styles.bodySize,
                        lineHeight: styles.lineHeight,
                        marginBottom: "2px",
                      }}
                    >
                      <span style={{ color: selectedTheme.primary, userSelect: "none" }}>•</span>
                      <span style={{ flex: 1 }}>
                        <strong style={{ color: selectedTheme.text }}>
                          {typeof cert === "string"
                            ? cert
                            : cert.name || cert.title || cert.issuer || "Certification"}
                        </strong>
                        {(cert.issuer || cert.date) && (
                          <span style={{ color: selectedTheme.textMuted }}>
                            {" "}
                            — {cert.issuer} {cert.date ? `(${cert.date})` : ""}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );

          case "achievements":
            if (!resumeData.achievements?.length) return null;
            return (
              <section key="achievements" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Fellowships & Awards")}
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {resumeData.achievements.map((ach, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: styles.bulletGap,
                        fontSize: styles.bodySize,
                        lineHeight: styles.lineHeight,
                        marginBottom: "2px",
                      }}
                    >
                      <span style={{ color: selectedTheme.primary, userSelect: "none" }}>•</span>
                      <span style={{ flex: 1 }}>
                        {typeof ach === "string" ? ach : ach.title || ach.description || "Award"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );

          case "customSections":
            if (!resumeData.customSections?.length) return null;
            return (
              <div key="customSections">
                {resumeData.customSections.map((sec, sIdx) => (
                  <section key={sIdx} style={{ marginBottom: styles.sectionMarginBottom }}>
                    {renderSectionHeader(sec.title || "Additional Information")}
                    {sec.content && (
                      <p style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight, margin: "0 0 4px 0" }}>
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
                                <div>
                                  {itemTitle && (
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        fontSize: styles.bodySize,
                                        color: selectedTheme.text,
                                      }}
                                    >
                                      {itemTitle}
                                    </span>
                                  )}
                                  {subtitle && (
                                    <span
                                      style={{
                                        fontStyle: "italic",
                                        color: selectedTheme.textLight,
                                        marginLeft: "5px",
                                      }}
                                    >
                                      — {subtitle}
                                    </span>
                                  )}
                                  {link && (
                                    <a
                                      href={link.startsWith("http") ? link : `https://${link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: styles.metaSize,
                                        color: selectedTheme.primary,
                                        marginLeft: "6px",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      [link]
                                    </a>
                                  )}
                                </div>
                                {date && (
                                  <span
                                    style={{
                                      fontSize: styles.metaSize,
                                      fontStyle: "italic",
                                      color: selectedTheme.textMuted,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {date}
                                  </span>
                                )}
                              </div>

                              {description && (
                                <p
                                  style={{
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    color: selectedTheme.textLight,
                                    margin: "2px 0",
                                  }}
                                >
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
                                      <span style={{ flex: 1 }}>{cleanBulletText(b)}</span>
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
            );

          default:
            return null;
        }
      })}
    </div>
  );
});

LatexAcademicTemplate.displayName = "LatexAcademicTemplate";

export default LatexAcademicTemplate;

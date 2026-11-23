import React, { forwardRef, useRef, useEffect, useMemo } from "react";
import { getResumeSocialLinks } from "@/utils/resumeSocialLinks";
import {
  isDescriptionDuplicatedInBullets,
  cleanBulletText,
  formatEducationDegreeAndField,
} from "./templateUtils";

/**
 * ExecutiveTemplate — "The Wall Street / Ivy League" Flagship Archetype (v2)
 *
 * Designed for Finance, Investment Banking, Management Consulting, Big Law, and C-Suite.
 * Visual Identity: Harvard Business Review broadsheet editorial, engraved stationery quality.
 *
 * Features:
 * - Full-bleed primary top rule (edge-to-edge, 3px broadsheet bar)
 * - Name in ALL-SMALL-CAPS with generous letter-spacing — engraved stationery aesthetic
 * - Title flanked by spaced em-dashes between two hairline rules
 * - Centered contact row with elegant interpunct · separators
 * - Oxford double-rule section headers (thick primary + hairline accent)
 * - Experience: italic serif company name, bold small-caps role title, tabular dates
 * - Skills: two-column inline layout with small-caps bold category labels
 * - Footer broadsheet closing rule
 * - 95+ ATS-compliant semantic structure
 * - Intelligent 1-page auto-density engine
 */

// ATS-safe metric highlighter for financial deals, percentages, and leadership scale
const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:clients|deals|acquisitions|stakeholders|engineers|teams|direct reports|accounts|funds|AUM|revenue|EBITDA|portfolio|bp|bps|M&A)(?:\b))/gi;

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

const ExecutiveTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
  const containerRef = useRef(null);
  const lastHeightRef = useRef(0);
  const onPageUsageChangeRef = useRef(onPageUsageChange);
  onPageUsageChangeRef.current = onPageUsageChange;

  // Page overflow detection
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

      onPageUsageChangeRef.current({
        isOverflowing,
        currentHeight,
        maxHeight,
        overflowPercentage,
        percentage: Math.round((currentHeight / maxHeight) * 100),
        templateName: "ExecutiveTemplate",
      });
    }
  }, [resumeData]);

  // ── Color Palettes ──────────────────────────────────────────────────────────
  const colorThemes = {
    // Primary flagship themes
    stripeIndigo: {
      primary: "#1e3a8a",
      secondary: "#172554",
      accent: "#2563eb",
      text: "#0f172a",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#cbd5e1",
      ruleHairline: "#bfdbfe",
      topBar: "#1e3a8a",
      categoryLabel: "#1e3a8a",
    },
    burgundyCrimson: {
      primary: "#7f1d1d",
      secondary: "#450a0a",
      accent: "#b91c1c",
      text: "#0f172a",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#fecaca",
      ruleHairline: "#fca5a5",
      topBar: "#7f1d1d",
      categoryLabel: "#7f1d1d",
    },
    oxfordGreen: {
      primary: "#14532d",
      secondary: "#052e16",
      accent: "#16a34a",
      text: "#0f172a",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#bbf7d0",
      ruleHairline: "#86efac",
      topBar: "#14532d",
      categoryLabel: "#14532d",
    },
    midnightSlate: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#334155",
      text: "#09090b",
      textLight: "#18181b",
      textMuted: "#71717a",
      border: "#cbd5e1",
      ruleHairline: "#94a3b8",
      topBar: "#1e293b",
      categoryLabel: "#1e293b",
    },
    monochromePro: {
      primary: "#111827",
      secondary: "#030712",
      accent: "#374151",
      text: "#000000",
      textLight: "#1f2937",
      textMuted: "#4b5563",
      border: "#d1d5db",
      ruleHairline: "#9ca3af",
      topBar: "#111827",
      categoryLabel: "#374151",
    },
    cyberEmerald: {
      primary: "#065f46",
      secondary: "#022c22",
      accent: "#059669",
      text: "#0f172a",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#a7f3d0",
      ruleHairline: "#6ee7b7",
      topBar: "#065f46",
      categoryLabel: "#065f46",
    },
    // Legacy compat keys
    navy: {
      primary: "#1e3a8a", secondary: "#172554", accent: "#2563eb",
      text: "#0f172a", textLight: "#1e293b", textMuted: "#64748b",
      border: "#cbd5e1", ruleHairline: "#bfdbfe", topBar: "#1e3a8a", categoryLabel: "#1e3a8a",
    },
    burgundy: {
      primary: "#7f1d1d", secondary: "#450a0a", accent: "#b91c1c",
      text: "#0f172a", textLight: "#1e293b", textMuted: "#64748b",
      border: "#fecaca", ruleHairline: "#fca5a5", topBar: "#7f1d1d", categoryLabel: "#7f1d1d",
    },
    forest: {
      primary: "#14532d", secondary: "#052e16", accent: "#16a34a",
      text: "#0f172a", textLight: "#1e293b", textMuted: "#64748b",
      border: "#bbf7d0", ruleHairline: "#86efac", topBar: "#14532d", categoryLabel: "#14532d",
    },
    royalSapphire: {
      primary: "#1d4ed8", secondary: "#1e40af", accent: "#3b82f6",
      text: "#0f172a", textLight: "#1e293b", textMuted: "#64748b",
      border: "#bfdbfe", ruleHairline: "#93c5fd", topBar: "#1d4ed8", categoryLabel: "#1d4ed8",
    },
    warmBronze: {
      primary: "#9a3412", secondary: "#7c2d12", accent: "#c2410c",
      text: "#0f172a", textLight: "#1e293b", textMuted: "#64748b",
      border: "#fed7aa", ruleHairline: "#fdba74", topBar: "#9a3412", categoryLabel: "#9a3412",
    },
    charcoal: {
      primary: "#1f2937", secondary: "#111827", accent: "#374151",
      text: "#000000", textLight: "#1f2937", textMuted: "#4b5563",
      border: "#d1d5db", ruleHairline: "#9ca3af", topBar: "#1f2937", categoryLabel: "#374151",
    },
    slate: {
      primary: "#1e293b", secondary: "#0f172a", accent: "#334155",
      text: "#09090b", textLight: "#18181b", textMuted: "#71717a",
      border: "#cbd5e1", ruleHairline: "#94a3b8", topBar: "#1e293b", categoryLabel: "#1e293b",
    },
    teal: {
      primary: "#115e59", secondary: "#042f2e", accent: "#0f766e",
      text: "#0f172a", textLight: "#1e293b", textMuted: "#64748b",
      border: "#99f6e4", ruleHairline: "#5eead4", topBar: "#115e59", categoryLabel: "#115e59",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.stripeIndigo;

  // ── 1-Page Content Density Engine ─────────────────────────────────────────
  const density = useMemo(() => {
    if (resumeData?.density === "compact" || resumeData?.density === "high") return "compact";
    if (resumeData?.density === "spacious" || resumeData?.density === "low") return "spacious";
    if (resumeData?.density === "medium") return "medium";

    let score = 0;
    if (resumeData.experience?.length) {
      score += resumeData.experience.length * 3.5;
      resumeData.experience.forEach((e) => { score += (e.bullets?.length || 0) * 1.1; });
    }
    if (resumeData.projects?.length) {
      score += resumeData.projects.length * 2.5;
      resumeData.projects.forEach((p) => { score += (p.bullets?.length || 0) * 1; });
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

  const styles = useMemo(() => {
    if (density === "compact") {
      return {
        padding: "0in 0.52in 0.42in 0.52in",
        nameSize: "20pt",
        nameTracking: "3px",
        titleSize: "9.5pt",
        contactSize: "8.2pt",
        headerMarginBottom: "10px",
        sectionMarginBottom: "9px",
        headingSize: "9pt",
        headingMarginBottom: "5px",
        itemMarginBottom: "5px",
        bodySize: "9pt",
        dateSize: "8.2pt",
        lineHeight: 1.28,
        bulletMarginBottom: "2px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0in 0.65in 0.55in 0.65in",
        nameSize: "26pt",
        nameTracking: "5px",
        titleSize: "11pt",
        contactSize: "9.5pt",
        headerMarginBottom: "18px",
        sectionMarginBottom: "16px",
        headingSize: "10.5pt",
        headingMarginBottom: "8px",
        itemMarginBottom: "11px",
        bodySize: "10pt",
        dateSize: "9.2pt",
        lineHeight: 1.52,
        bulletMarginBottom: "4px",
      };
    }
    // Balanced default
    return {
      padding: "0in 0.58in 0.48in 0.58in",
      nameSize: "23pt",
      nameTracking: "4px",
      titleSize: "10.5pt",
      contactSize: "8.8pt",
      headerMarginBottom: "14px",
      sectionMarginBottom: "12px",
      headingSize: "9.5pt",
      headingMarginBottom: "6px",
      itemMarginBottom: "8px",
      bodySize: "9.5pt",
      dateSize: "8.8pt",
      lineHeight: 1.38,
      bulletMarginBottom: "3px",
    };
  }, [density]);

  // ── Section Order ─────────────────────────────────────────────────────────
  const defaultOrder = ["summary", "experience", "education", "skills", "projects", "certifications", "achievements", "publications", "customSections"];
  const baseOrder =
    resumeData.sectionOrder?.length > 0
      ? resumeData.sectionOrder.filter((id) => !["score", "personal", "recommendations"].includes(id))
      : defaultOrder;
  const sectionOrder =
    resumeData.customSections && resumeData.customSections.length > 0 && !baseOrder.includes("customSections")
      ? [...baseOrder, "customSections"]
      : baseOrder;

  // ── Contact data ──────────────────────────────────────────────────────────
  const contact = resumeData.contact || {};
  const contactParts = [
    contact.phone,
    contact.email && { label: contact.email, href: `mailto:${contact.email}` },
    contact.location || resumeData.location,
    contact.linkedin && {
      label: contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "linkedin.com/in/"),
      href: contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`,
    },
    contact.website && {
      label: contact.website.replace(/^https?:\/\/(www\.)?/i, ""),
      href: contact.website.startsWith("http") ? contact.website : `https://${contact.website}`,
    },
    contact.github && {
      label: contact.github.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/"),
      href: contact.github.startsWith("http") ? contact.github : `https://${contact.github}`,
    },
    ...getResumeSocialLinks(contact),
  ].filter(Boolean);

  // ── Oxford Double-Rule Section Header ─────────────────────────────────────
  const renderSectionHeader = (title) => (
    <div style={{ marginBottom: styles.headingMarginBottom }}>
      <h2
        style={{
          fontFamily: '"Newsreader", "Playfair Display", Georgia, Cambria, serif',
          fontSize: styles.headingSize,
          fontWeight: 700,
          fontVariant: "all-small-caps",
          letterSpacing: "1.8px",
          color: selectedTheme.primary,
          margin: "0 0 3px 0",
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {/* Oxford Rule: thick primary bar + hairline accent below */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5px" }}>
        <div style={{ height: "1.5px", backgroundColor: selectedTheme.primary, width: "100%" }} />
        <div style={{ height: "0.5px", backgroundColor: selectedTheme.ruleHairline, width: "100%" }} />
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
      className="bg-white"
      style={{
        width: "210mm",
        boxSizing: "border-box",
        fontFamily: '"Newsreader", "Playfair Display", Georgia, Cambria, serif',
        color: selectedTheme.text,
        position: "relative",
      }}
    >
      {/* ── Full-Bleed Top Broadsheet Rule ────────────────────────────────── */}
      <div style={{ height: "4px", backgroundColor: selectedTheme.topBar, width: "100%" }} />
      <div style={{ height: "1px", backgroundColor: selectedTheme.ruleHairline, width: "100%" }} />

      {/* ── Page Content (padded) ─────────────────────────────────────────── */}
      <div style={{ padding: styles.padding }}>

        {/* ── Masthead / Header ─────────────────────────────────────────────── */}
        <header style={{ textAlign: "center", marginBottom: styles.headerMarginBottom, paddingTop: "14px" }}>

          {/* Name — All Small-Caps, engraved stationery style */}
          <h1
            style={{
              fontFamily: '"Newsreader", "Playfair Display", Georgia, serif',
              fontSize: styles.nameSize,
              fontWeight: 700,
              fontVariant: "all-small-caps",
              letterSpacing: styles.nameTracking,
              color: selectedTheme.primary,
              margin: "0 0 6px 0",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            {resumeData.name || "Executive Candidate"}
          </h1>

          {/* Title flanked by hairline rules — broadsheet editorial treatment */}
          {(resumeData.title || resumeData.jobTitle) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div style={{ flex: 1, height: "0.5px", backgroundColor: selectedTheme.ruleHairline }} />
              <span
                style={{
                  fontSize: styles.titleSize,
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: selectedTheme.textLight,
                  letterSpacing: "0.3px",
                  whiteSpace: "nowrap",
                  padding: "0 4px",
                }}
              >
                {resumeData.title || resumeData.jobTitle}
              </span>
              <div style={{ flex: 1, height: "0.5px", backgroundColor: selectedTheme.ruleHairline }} />
            </div>
          )}

          {/* Contact row — interpunct separated, tabular */}
          {contactParts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                fontSize: styles.contactSize,
                color: selectedTheme.textMuted,
                gap: "0",
                lineHeight: 1.6,
                fontFamily: '"Inter", -apple-system, sans-serif',
              }}
            >
              {contactParts.map((item, index) => (
                <span key={index} style={{ display: "inline-flex", alignItems: "center" }}>
                  {typeof item === "object" ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: selectedTheme.textLight,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {item.icon && <item.icon size={11} style={{ flexShrink: 0 }} aria-hidden="true" />}
                      {item.label}
                    </a>
                  ) : (
                    <span style={{ color: selectedTheme.textLight }}>{item}</span>
                  )}
                  {index < contactParts.length - 1 && (
                    <span
                      style={{
                        margin: "0 6px",
                        color: selectedTheme.ruleHairline,
                        fontSize: "10pt",
                        lineHeight: 1,
                        userSelect: "none",
                      }}
                    >
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── Dynamic Sections ────────────────────────────────────────────── */}
        {sectionOrder.map((sectionId) => {
          switch (sectionId) {

            case "summary":
              if (!resumeData.summary) return null;
              return (
                <section key="summary" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Executive Profile")}
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

            case "experience":
              if (!resumeData.experience?.length) return null;
              return (
                <section key="experience" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Professional Experience")}
                  <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                    {resumeData.experience.map((exp, index) => (
                      <div key={index}>
                        {/* Company + Date row */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: "1px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                            {/* Company — italic serif, authoritative */}
                            <span
                              style={{
                                fontStyle: "italic",
                                fontWeight: 700,
                                fontSize: styles.bodySize,
                                color: selectedTheme.text,
                                fontFamily: '"Newsreader", Georgia, serif',
                              }}
                            >
                              {exp.company}
                            </span>
                            {exp.location && (
                              <span
                                style={{
                                  fontSize: styles.dateSize,
                                  color: selectedTheme.textMuted,
                                  fontStyle: "normal",
                                  fontFamily: '"Inter", sans-serif',
                                }}
                              >
                                — {exp.location}
                              </span>
                            )}
                          </div>
                          {/* Date — tabular numerals, right-aligned */}
                          <span
                            style={{
                              fontSize: styles.dateSize,
                              fontVariantNumeric: "tabular-nums",
                              color: selectedTheme.textMuted,
                              fontStyle: "italic",
                              fontFamily: '"Inter", sans-serif',
                              whiteSpace: "nowrap",
                              marginLeft: "8px",
                            }}
                          >
                            {exp.startDate}
                            {exp.startDate && (exp.endDate || exp.current) ? " – " : ""}
                            {exp.current ? "Present" : exp.endDate}
                          </span>
                        </div>

                        {/* Title — bold small-caps */}
                        {(exp.title || exp.position) && (
                          <div
                            style={{
                              fontVariant: "all-small-caps",
                              fontWeight: 700,
                              fontSize: styles.bodySize,
                              color: selectedTheme.primary,
                              letterSpacing: "0.8px",
                              marginBottom: "3px",
                              lineHeight: 1.2,
                            }}
                          >
                            {exp.title || exp.position}
                          </div>
                        )}

                        {/* Description */}
                        {exp.description &&
                          (!exp.bullets?.length || !isDescriptionDuplicatedInBullets(exp.description, exp.bullets)) && (
                            <p
                              style={{
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.text,
                                margin: "0 0 3px 0",
                              }}
                            >
                              {highlightMetrics(exp.description, selectedTheme.primary)}
                            </p>
                          )}

                        {/* Bullet points */}
                        {exp.bullets?.length > 0 && (
                          <ul
                            style={{
                              listStyleType: "disc",
                              margin: "2px 0 0 0",
                              paddingLeft: "15px",
                            }}
                          >
                            {exp.bullets.map((bullet, bIdx) => {
                              const cleaned = cleanBulletText(bullet);
                              if (!cleaned) return null;
                              return (
                                <li
                                  key={bIdx}
                                  style={{
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    color: selectedTheme.text,
                                    marginBottom: styles.bulletMarginBottom,
                                  }}
                                >
                                  {highlightMetrics(cleaned, selectedTheme.primary)}
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

            case "education":
              if (!resumeData.education?.length) return null;
              return (
                <section key="education" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Education & Credentials")}
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
                          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                            <span
                              style={{
                                fontStyle: "italic",
                                fontWeight: 700,
                                fontSize: styles.bodySize,
                                color: selectedTheme.text,
                                fontFamily: '"Newsreader", Georgia, serif',
                              }}
                            >
                              {edu.institution || edu.school}
                            </span>
                            {edu.location && (
                              <span
                                style={{
                                  fontSize: styles.dateSize,
                                  color: selectedTheme.textMuted,
                                  fontFamily: '"Inter", sans-serif',
                                }}
                              >
                                — {edu.location}
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: styles.dateSize,
                              fontVariantNumeric: "tabular-nums",
                              color: selectedTheme.textMuted,
                              fontStyle: "italic",
                              fontFamily: '"Inter", sans-serif',
                              whiteSpace: "nowrap",
                              marginLeft: "8px",
                            }}
                          >
                            {edu.startDate} {edu.startDate && (edu.endDate || edu.year) ? "– " : ""}
                            {edu.endDate || edu.year}
                          </span>
                        </div>

                        <div
                          style={{
                            fontVariant: "all-small-caps",
                            fontWeight: 700,
                            fontSize: styles.bodySize,
                            color: selectedTheme.primary,
                            letterSpacing: "0.6px",
                            marginTop: "1px",
                            lineHeight: 1.2,
                          }}
                        >
                          {formatEducationDegreeAndField(edu)}
                          {edu.gpa && (
                            <span
                              style={{
                                fontVariant: "normal",
                                fontWeight: 400,
                                marginLeft: "8px",
                                color: selectedTheme.textMuted,
                                fontSize: styles.dateSize,
                                letterSpacing: "0",
                              }}
                            >
                              GPA: {edu.gpa}
                            </span>
                          )}
                        </div>

                        {edu.honors && (
                          <div style={{ fontSize: styles.dateSize, color: selectedTheme.textMuted, fontStyle: "italic" }}>
                            Honors: {edu.honors}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "skills":
              if (!resumeData.skills?.length) return null;
              return (
                <section key="skills" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Core Competencies")}
                  {/* Two-column grid layout for skills */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "2px 16px",
                    }}
                  >
                    {resumeData.skills.map((skillGroup, index) => {
                      const category = typeof skillGroup === "string" ? null : skillGroup.category || skillGroup.name;
                      const items = typeof skillGroup === "string" ? skillGroup : skillGroup.items || skillGroup.skills;
                      const itemsList = Array.isArray(items) ? items.join(", ") : String(items || "");

                      return (
                        <div
                          key={index}
                          style={{
                            fontSize: styles.bodySize,
                            lineHeight: styles.lineHeight,
                          }}
                        >
                          {category ? (
                            <>
                              <span
                                style={{
                                  fontVariant: "all-small-caps",
                                  fontWeight: 700,
                                  color: selectedTheme.categoryLabel,
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {category}:{" "}
                              </span>
                              <span style={{ color: selectedTheme.textLight }}>{itemsList}</span>
                            </>
                          ) : (
                            <span style={{ color: selectedTheme.textLight }}>{itemsList}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            case "projects":
              if (!resumeData.projects?.length) return null;
              return (
                <section key="projects" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Strategic Initiatives")}
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
                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                            <span
                              style={{
                                fontStyle: "italic",
                                fontWeight: 700,
                                fontSize: styles.bodySize,
                                color: selectedTheme.text,
                                fontFamily: '"Newsreader", Georgia, serif',
                              }}
                            >
                              {proj.title || proj.name}
                            </span>
                            {(proj.link || proj.liveUrl) && (
                              <a
                                href={(proj.link || proj.liveUrl).startsWith("http") ? (proj.link || proj.liveUrl) : `https://${proj.link || proj.liveUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: styles.dateSize,
                                  color: selectedTheme.primary,
                                  textDecoration: "none",
                                  fontStyle: "normal",
                                  fontFamily: '"Inter", sans-serif',
                                  marginRight: "6px",
                                }}
                              >
                                ↗ Live
                              </a>
                            )}
                            {(proj.github || proj.githubUrl) && (
                              <a
                                href={(proj.github || proj.githubUrl).startsWith("http") ? (proj.github || proj.githubUrl) : `https://${proj.github || proj.githubUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: styles.dateSize,
                                  color: selectedTheme.primary,
                                  textDecoration: "none",
                                  fontStyle: "normal",
                                  fontFamily: '"Inter", sans-serif',
                                }}
                              >
                                ↗ GitHub
                              </a>
                            )}
                          </div>
                          {(proj.startDate || proj.endDate || proj.year) && (
                            <span
                              style={{
                                fontSize: styles.dateSize,
                                color: selectedTheme.textMuted,
                                fontStyle: "italic",
                                fontFamily: '"Inter", sans-serif',
                                whiteSpace: "nowrap",
                                marginLeft: "8px",
                              }}
                            >
                              {proj.startDate} {proj.startDate && proj.endDate ? "– " : ""}{proj.endDate || proj.year}
                            </span>
                          )}
                        </div>

                        {proj.technologies && (
                          <div
                            style={{
                              fontSize: styles.dateSize,
                              fontStyle: "italic",
                              color: selectedTheme.textMuted,
                              marginBottom: "2px",
                              fontFamily: '"Inter", sans-serif',
                            }}
                          >
                            {Array.isArray(proj.technologies) ? proj.technologies.join(" · ") : proj.technologies}
                          </div>
                        )}

                        {proj.description &&
                          (!proj.bullets?.length || !isDescriptionDuplicatedInBullets(proj.description, proj.bullets)) && (
                            <p
                              style={{
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.text,
                                margin: "0 0 3px 0",
                              }}
                            >
                              {highlightMetrics(proj.description, selectedTheme.primary)}
                            </p>
                          )}

                        {proj.bullets?.length > 0 && (
                          <ul style={{ listStyleType: "disc", margin: "2px 0 0 0", paddingLeft: "15px" }}>
                            {proj.bullets.map((bullet, bIdx) => {
                              const cleaned = cleanBulletText(bullet);
                              if (!cleaned) return null;
                              return (
                                <li
                                  key={bIdx}
                                  style={{
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    color: selectedTheme.text,
                                    marginBottom: styles.bulletMarginBottom,
                                  }}
                                >
                                  {highlightMetrics(cleaned, selectedTheme.primary)}
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

            case "certifications":
              if (!resumeData.certifications?.length) return null;
              return (
                <section key="certifications" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Certifications & Governance")}
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
                            <span style={{ color: selectedTheme.textMuted, fontStyle: "italic" }}>
                              {" "}— {cert.issuer}
                            </span>
                          )}
                        </div>
                        {(cert.date || cert.year) && (
                          <span
                            style={{
                              fontSize: styles.dateSize,
                              color: selectedTheme.textMuted,
                              fontStyle: "italic",
                              fontFamily: '"Inter", sans-serif',
                              whiteSpace: "nowrap",
                              marginLeft: "8px",
                            }}
                          >
                            {cert.date || cert.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "achievements":
              if (!resumeData.achievements?.length) return null;
              return (
                <section key="achievements" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Honours & Distinctions")}
                  <ul style={{ listStyleType: "disc", margin: "2px 0 0 0", paddingLeft: "15px" }}>
                    {resumeData.achievements.map((ach, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: styles.bodySize,
                          lineHeight: styles.lineHeight,
                          color: selectedTheme.text,
                          marginBottom: styles.bulletMarginBottom,
                        }}
                      >
                        {typeof ach === "string" ? (
                          highlightMetrics(ach, selectedTheme.primary)
                        ) : (
                          <>
                            <strong style={{ color: selectedTheme.text }}>{ach.title}</strong>
                            {ach.description && `: ${ach.description}`}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );

            case "publications":
              if (!resumeData.publications?.length) return null;
              return (
                <section key="publications" style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader("Publications & Thought Leadership")}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {resumeData.publications.map((pub, index) => (
                      <div key={index} style={{ fontSize: styles.bodySize }}>
                        <span style={{ fontStyle: "italic", fontWeight: 600, color: selectedTheme.text }}>
                          {pub.title}
                        </span>
                        {pub.publisher && (
                          <span style={{ color: selectedTheme.textLight }}>, {pub.publisher}</span>
                        )}
                        {pub.date && <span style={{ color: selectedTheme.textMuted }}> ({pub.date})</span>}
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "customSections":
              if (!resumeData.customSections?.length) return null;
              return resumeData.customSections.map((custom, cIdx) => (
                <section key={`custom-${cIdx}`} style={{ marginBottom: styles.sectionMarginBottom }}>
                  {renderSectionHeader(custom.title || "Additional Information")}
                  {custom.items?.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                      {custom.items.map((rawItem, iIdx) => {
                        const isStructured = rawItem && typeof rawItem === "object";
                        const itemTitle = isStructured ? (rawItem.title || rawItem.name || "") : rawItem;
                        const subtitle = isStructured ? (rawItem.subtitle || rawItem.organization || rawItem.issuer || rawItem.publisher || "") : "";
                        const date = isStructured ? (rawItem.date || "") : "";
                        const link = isStructured ? (rawItem.link || rawItem.url || "") : "";
                        const description = isStructured ? (rawItem.description || "") : "";
                        const bullets = isStructured && Array.isArray(rawItem.bullets) ? rawItem.bullets.filter(Boolean) : [];

                        if (!isStructured || (!subtitle && !date && !link && bullets.length === 0 && !description)) {
                          return (
                            <ul key={iIdx} style={{ listStyleType: "disc", margin: "2px 0 0 0", paddingLeft: "15px" }}>
                              <li
                                style={{
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  color: selectedTheme.text,
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
                                <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted, fontVariantNumeric: "tabular-nums" }}>
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
                              <ul style={{ listStyleType: "disc", margin: "2px 0 0 0", paddingLeft: "15px" }}>
                                {bullets.map((b, bIdx) => (
                                  <li
                                    key={bIdx}
                                    style={{
                                      fontSize: styles.bodySize,
                                      lineHeight: styles.lineHeight,
                                      color: selectedTheme.text,
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
                  ) : (
                    <p style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight, margin: 0 }}>
                      {custom.content}
                    </p>
                  )}
                </section>
              ));

            default:
              return null;
          }
        })}

        {/* ── Footer Closing Broadsheet Rule ───────────────────────────────── */}
        <div style={{ marginTop: "auto", paddingTop: "14px" }}>
          <div style={{ height: "0.5px", backgroundColor: selectedTheme.ruleHairline, width: "100%" }} />
          <div style={{ height: "1.5px", backgroundColor: selectedTheme.topBar, width: "100%", marginTop: "1.5px" }} />
        </div>

      </div>
    </div>
  );
});

ExecutiveTemplate.displayName = "ExecutiveTemplate";

export default ExecutiveTemplate;

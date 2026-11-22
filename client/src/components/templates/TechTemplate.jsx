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
  Terminal,
} from "lucide-react";

/**
 * TechTemplate - "Cloud & Systems Developer" Archetype
 *
 * Designed for Full-Stack Developers, Cloud Architects, Backend Engineers, and DevOps.
 * Features:
 * - Ultra-clean open developer canvas with JetBrains Mono + Inter
 * - Syntax-accented section headers (<TechnicalSkills />, <EngineeringExperience />)
 * - Developer prompt accent styling (>_ name and const role =)
 * - Quantifiable system & performance metric highlighter (req/s, ms, 99.99% SLA, $, %, scale)
 * - Intelligent 1-page auto-density engine with Compact / Balanced / Spacious modes
 * - 100% text-based, ATS-compliant semantic structure
 */

// ATS-safe metric highlighter for technical and performance metrics
const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|MAU|DAU|customers|clients|engineers|developers|nodes|services|microservices|req\/s|rps|qps|ms|fps|stars|downloads|pull requests|PRs|tps|commits)\b)/gi;

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

const TechTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "TechTemplate",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Refined modern developer palettes (Clean, high-contrast, professional)
  const colorThemes = {
    githubBlue: {
      primary: "#0969da",
      secondary: "#0550ae",
      accent: "#218bff",
      badgeBg: "#f6f8fa",
      badgeBorder: "#d0d7de",
      badgeText: "#0969da",
      tagBg: "#ddf4ff",
      tagBorder: "#b6e3ff",
      tagText: "#0969da",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      rule: "#0969da",
    },
    supabaseEmerald: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#10b981",
      badgeBg: "#f0fdf4",
      badgeBorder: "#bbf7d0",
      badgeText: "#047857",
      tagBg: "#dcfce7",
      tagBorder: "#86efac",
      tagText: "#15803d",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#059669",
    },
    raycastIndigo: {
      primary: "#4f46e5",
      secondary: "#4338ca",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      tagBg: "#eef2ff",
      tagBorder: "#c7d2fe",
      tagText: "#3730a3",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#4f46e5",
    },
    rustAmber: {
      primary: "#d97706",
      secondary: "#b45309",
      accent: "#f59e0b",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      badgeText: "#b45309",
      tagBg: "#fef3c7",
      tagBorder: "#fde68a",
      tagText: "#92400e",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#e2e8f0",
      rule: "#d97706",
    },
    cyberCyan: {
      primary: "#0891b2",
      secondary: "#0e7490",
      accent: "#06b6d4",
      badgeBg: "#ecfeff",
      badgeBorder: "#a5f3fc",
      badgeText: "#0891b2",
      tagBg: "#cffafe",
      tagBorder: "#67e8f9",
      tagText: "#0e7490",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0891b2",
    },
    pythonGold: {
      primary: "#ca8a04",
      secondary: "#a16207",
      accent: "#eab308",
      badgeBg: "#fefce8",
      badgeBorder: "#fef08a",
      badgeText: "#a16207",
      tagBg: "#fef9c3",
      tagBorder: "#fde047",
      tagText: "#854d0e",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#e2e8f0",
      rule: "#ca8a04",
    },
    vercelStealth: {
      primary: "#18181b",
      secondary: "#27272a",
      accent: "#52525b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#e4e4e7",
      badgeText: "#18181b",
      tagBg: "#f4f4f5",
      tagBorder: "#d4d4d8",
      tagText: "#27272a",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#18181b",
    },
    // Aliases for legacy & toolbar compatibility
    terminalCyan: {
      primary: "#0969da",
      secondary: "#0550ae",
      accent: "#218bff",
      badgeBg: "#f6f8fa",
      badgeBorder: "#d0d7de",
      badgeText: "#0969da",
      tagBg: "#ddf4ff",
      tagBorder: "#b6e3ff",
      tagText: "#0969da",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      rule: "#0969da",
    },
    matrixEmerald: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#10b981",
      badgeBg: "#f0fdf4",
      badgeBorder: "#bbf7d0",
      badgeText: "#047857",
      tagBg: "#dcfce7",
      tagBorder: "#86efac",
      tagText: "#15803d",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#059669",
    },
    deepViolet: {
      primary: "#4f46e5",
      secondary: "#4338ca",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      tagBg: "#eef2ff",
      tagBorder: "#c7d2fe",
      tagText: "#3730a3",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#4f46e5",
    },
    darkSlate: {
      primary: "#18181b",
      secondary: "#27272a",
      accent: "#52525b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#e4e4e7",
      badgeText: "#18181b",
      tagBg: "#f4f4f5",
      tagBorder: "#d4d4d8",
      tagText: "#27272a",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#18181b",
    },
    black: {
      primary: "#18181b",
      secondary: "#27272a",
      accent: "#52525b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#e4e4e7",
      badgeText: "#18181b",
      tagBg: "#f4f4f5",
      tagBorder: "#d4d4d8",
      tagText: "#27272a",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#18181b",
    },
    blue: {
      primary: "#0969da",
      secondary: "#0550ae",
      accent: "#218bff",
      badgeBg: "#f6f8fa",
      badgeBorder: "#d0d7de",
      badgeText: "#0969da",
      tagBg: "#ddf4ff",
      tagBorder: "#b6e3ff",
      tagText: "#0969da",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      rule: "#0969da",
    },
    purple: {
      primary: "#4f46e5",
      secondary: "#4338ca",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      tagBg: "#eef2ff",
      tagBorder: "#c7d2fe",
      tagText: "#3730a3",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#4f46e5",
    },
    teal: {
      primary: "#0d9488",
      secondary: "#0f766e",
      accent: "#14b8a6",
      badgeBg: "#f0fdfa",
      badgeBorder: "#99f6e4",
      badgeText: "#0f766e",
      tagBg: "#ccfbf1",
      tagBorder: "#5eead4",
      tagText: "#115e59",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0d9488",
    },
    stripeIndigo: {
      primary: "#4f46e5",
      secondary: "#4338ca",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      tagBg: "#eef2ff",
      tagBorder: "#c7d2fe",
      tagText: "#3730a3",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#4f46e5",
    },
    cyberEmerald: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#10b981",
      badgeBg: "#f0fdf4",
      badgeBorder: "#bbf7d0",
      badgeText: "#047857",
      tagBg: "#dcfce7",
      tagBorder: "#86efac",
      tagText: "#15803d",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#059669",
    },
    midnightSlate: {
      primary: "#18181b",
      secondary: "#27272a",
      accent: "#52525b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#e4e4e7",
      badgeText: "#18181b",
      tagBg: "#f4f4f5",
      tagBorder: "#d4d4d8",
      tagText: "#27272a",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#18181b",
    },
    monochromePro: {
      primary: "#18181b",
      secondary: "#27272a",
      accent: "#52525b",
      badgeBg: "#f4f4f5",
      badgeBorder: "#e4e4e7",
      badgeText: "#18181b",
      tagBg: "#f4f4f5",
      tagBorder: "#d4d4d8",
      tagText: "#27272a",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#18181b",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.githubBlue ||
    colorThemes.terminalCyan;

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
        padding: "0.38in 0.48in",
        nameSize: "20pt",
        titleSize: "9.5pt",
        contactSize: "8.2pt",
        headerMarginBottom: "9px",
        sectionMarginBottom: "8px",
        headingSize: "10pt",
        headingPaddingBottom: "2px",
        headingMarginBottom: "4px",
        itemMarginBottom: "5px",
        bodySize: "8.8pt",
        metaSize: "8.2pt",
        lineHeight: 1.3,
        bulletMarginBottom: "2px",
        bulletMarginLeft: "1.1rem",
        skillPadding: "4px 8px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.58in 0.65in",
        nameSize: "25pt",
        titleSize: "11pt",
        contactSize: "9.2pt",
        headerMarginBottom: "16px",
        sectionMarginBottom: "15px",
        headingSize: "11.8pt",
        headingPaddingBottom: "4px",
        headingMarginBottom: "8px",
        itemMarginBottom: "10px",
        bodySize: "9.8pt",
        metaSize: "9pt",
        lineHeight: 1.5,
        bulletMarginBottom: "4px",
        bulletMarginLeft: "1.3rem",
        skillPadding: "7px 12px",
      };
    }
    // Balanced / Medium default
    return {
      padding: "0.46in 0.55in",
      nameSize: "22pt",
      titleSize: "10.2pt",
      contactSize: "8.6pt",
      headerMarginBottom: "12px",
      sectionMarginBottom: "11px",
      headingSize: "10.8pt",
      headingPaddingBottom: "3px",
      headingMarginBottom: "6px",
      itemMarginBottom: "7px",
      bodySize: "9.2pt",
      metaSize: "8.6pt",
      lineHeight: 1.38,
      bulletMarginBottom: "2.5px",
      bulletMarginLeft: "1.2rem",
      skillPadding: "5px 10px",
    };
  }, [density]);

  // Section Ordering
  const defaultOrder = [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
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
    contact.github && {
      icon: Github,
      label: contact.github.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/"),
      href: contact.github.startsWith("http") ? contact.github : `https://${contact.github}`,
    },
    contact.linkedin && {
      icon: Linkedin,
      label: contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "linkedin.com/in/"),
      href: contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`,
    },
    (contact.website || contact.portfolio) && {
      icon: Globe,
      label: (contact.website || contact.portfolio).replace(/^https?:\/\/(www\.)?/i, ""),
      href: (contact.website || contact.portfolio).startsWith("http")
        ? contact.website || contact.portfolio
        : `https://${contact.website || contact.portfolio}`,
    },
  ].filter(Boolean);

  // Section Header Renderer
  const renderSectionHeader = (tag, title) => (
    <div style={{ marginBottom: styles.headingMarginBottom }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: styles.headingPaddingBottom,
          borderBottom: `1.5px solid ${selectedTheme.primary}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: styles.headingSize,
              fontWeight: 700,
              color: selectedTheme.primary,
              letterSpacing: "-0.2px",
            }}
          >
            {`<${tag} />`}
          </span>
          <span
            style={{
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontSize: styles.metaSize,
              fontWeight: 600,
              color: selectedTheme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            // {title}
          </span>
        </div>
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
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: selectedTheme.text,
      }}
    >
      {/* Header: Clean Modern Developer Masthead */}
      <header
        style={{
          marginBottom: styles.headerMarginBottom,
          paddingBottom: "10px",
          borderBottom: `1px solid ${selectedTheme.border}`,
        }}
      >
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: "12pt",
                  fontWeight: 700,
                  color: selectedTheme.primary,
                }}
              >
                &gt;_
              </span>
              <h1
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: styles.nameSize,
                  fontWeight: 800,
                  color: selectedTheme.text,
                  margin: 0,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.15,
                }}
              >
                {resumeData.name || "Developer Candidate"}
              </h1>
            </div>

            {(resumeData.title || resumeData.jobTitle) && (
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: styles.titleSize,
                  color: selectedTheme.primary,
                  fontWeight: 600,
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ color: selectedTheme.textMuted }}>const role =</span>
                <span>"{resumeData.title || resumeData.jobTitle}";</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Links Bar */}
        {contactParts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 14px",
              marginTop: "8px",
              fontSize: styles.contactSize,
              fontFamily: '"JetBrains Mono", monospace',
              color: selectedTheme.textMuted,
            }}
          >
            {contactParts.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Icon size={12} style={{ color: selectedTheme.primary }} />
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
        )}
      </header>

      {/* Dynamic Sections */}
      {sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case "summary":
            if (!resumeData.summary) return null;
            return (
              <section key="summary" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Overview", "Summary & Core Focus")}
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

          case "skills":
            if (!resumeData.skills || resumeData.skills.length === 0) return null;
            return (
              <section key="skills" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("TechnicalSkills", "Stack & Tooling")}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px 12px",
                  }}
                >
                  {resumeData.skills.map((group, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: selectedTheme.badgeBg,
                        border: `1px solid ${selectedTheme.badgeBorder}`,
                        borderRadius: "5px",
                        padding: styles.skillPadding,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: styles.metaSize,
                          fontWeight: 700,
                          color: selectedTheme.primary,
                          marginBottom: "2px",
                        }}
                      >
                        {group.category || "Skill Domain"}:
                      </div>
                      <div
                        style={{
                          fontSize: styles.bodySize,
                          color: selectedTheme.text,
                          lineHeight: 1.35,
                        }}
                      >
                        {Array.isArray(group.items) ? group.items.join(" • ") : group.items}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "experience":
            if (!resumeData.experience?.length) return null;
            return (
              <section key="experience" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Experience", "Professional Engineering")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.experience.map((exp, index) => (
                    <div
                      key={index}
                      style={{
                        borderLeft: `2px solid ${selectedTheme.primary}40`,
                        paddingLeft: "10px",
                      }}
                    >
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
                            {exp.position || "Software Engineer"}
                          </span>
                          <span
                            style={{
                              color: selectedTheme.primary,
                              fontWeight: 600,
                              fontSize: styles.bodySize,
                              marginLeft: "5px",
                            }}
                          >
                            @ {exp.company}
                          </span>
                          {exp.location && (
                            <span
                              style={{
                                fontSize: styles.metaSize,
                                color: selectedTheme.textMuted,
                                marginLeft: "6px",
                              }}
                            >
                              ({exp.location})
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
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
                              margin: "2px 0 4px 0",
                            }}
                          >
                            {highlightMetrics(exp.description, selectedTheme.primary)}
                          </p>
                        )}

                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 0,
                            listStyle: "none",
                          }}
                        >
                          {exp.bullets.map((bullet, bIdx) => {
                            const cleaned = cleanBulletText(bullet);
                            if (!cleaned) return null;
                            return (
                              <li
                                key={bIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "6px",
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  color: selectedTheme.text,
                                  marginBottom: styles.bulletMarginBottom,
                                }}
                              >
                                <span
                                  style={{
                                    color: selectedTheme.primary,
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontWeight: 700,
                                    fontSize: "1.05em",
                                    lineHeight: 1,
                                    marginTop: "2px",
                                    flexShrink: 0,
                                    userSelect: "none",
                                  }}
                                >
                                  ▹
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
                {renderSectionHeader("Projects", "Systems & Architecture")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.projects.map((proj, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: selectedTheme.badgeBg,
                        border: `1px solid ${selectedTheme.badgeBorder}`,
                        borderRadius: "5px",
                        padding: "8px 10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: "2px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
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
                              <ExternalLink size={10} />
                              <span style={{ borderBottom: `1px dotted ${selectedTheme.primary}` }}>
                                {(proj.link || proj.liveUrl).replace(/^https?:\/\/(www\.)?/i, "")}
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
                                {(proj.github || proj.githubUrl).replace(/^https?:\/\/(www\.)?github\.com\//i, "gh/").replace(/^https?:\/\/(www\.)?/i, "")}
                              </span>
                            </a>
                          )}
                        </div>

                        {proj.date && (
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: styles.metaSize,
                              color: selectedTheme.textMuted,
                              flexShrink: 0,
                            }}
                          >
                            {proj.date}
                          </span>
                        )}
                      </div>

                      {proj.technologies && (
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "7.8pt",
                            color: selectedTheme.tagText,
                            backgroundColor: selectedTheme.tagBg,
                            border: `1px solid ${selectedTheme.tagBorder}`,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            display: "inline-block",
                            marginBottom: "4px",
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
                              margin: "2px 0",
                            }}
                          >
                            {highlightMetrics(proj.description, selectedTheme.primary)}
                          </p>
                        )}

                      {proj.bullets && proj.bullets.length > 0 && (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 0,
                            listStyle: "none",
                          }}
                        >
                          {proj.bullets.map((bullet, bIdx) => {
                            const cleaned = cleanBulletText(bullet);
                            if (!cleaned) return null;
                            return (
                              <li
                                key={bIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "6px",
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  color: selectedTheme.text,
                                  marginBottom: styles.bulletMarginBottom,
                                }}
                              >
                                <span
                                  style={{
                                    color: selectedTheme.primary,
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontWeight: 700,
                                    fontSize: "1.05em",
                                    lineHeight: 1,
                                    marginTop: "2px",
                                    flexShrink: 0,
                                    userSelect: "none",
                                  }}
                                >
                                  ▹
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

          case "education":
            if (!resumeData.education?.length) return null;
            return (
              <section key="education" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Education", "Academic Foundations")}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {resumeData.education.map((edu, index) => (
                    <div
                      key={index}
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
                          {formatEducationDegreeAndField(edu)}
                        </span>
                        <span
                          style={{
                            color: selectedTheme.textLight,
                            fontSize: styles.bodySize,
                            marginLeft: "6px",
                          }}
                        >
                          — {edu.institution}
                          {edu.location ? `, ${edu.location}` : ""}
                        </span>
                        {edu.gpa && (
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: styles.metaSize,
                              color: selectedTheme.primary,
                              marginLeft: "6px",
                            }}
                          >
                            [GPA: {edu.gpa}]
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: styles.metaSize,
                          color: selectedTheme.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {edu.graduationDate || edu.endDate || edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "certifications":
            if (!resumeData.certifications?.length) return null;
            return (
              <section key="certifications" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Certifications", "Verified Credentials")}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "4px 10px",
                  }}
                >
                  {resumeData.certifications.map((cert, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: styles.bodySize,
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: selectedTheme.text }}>
                          {typeof cert === "string"
                            ? cert
                            : cert.name || cert.title || cert.issuer || "Certification"}
                        </span>
                        {cert.issuer && (
                          <span style={{ color: selectedTheme.textMuted, fontSize: styles.metaSize, marginLeft: "4px" }}>
                            ({cert.issuer})
                          </span>
                        )}
                      </div>
                      {cert.date && (
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
                          }}
                        >
                          {cert.date}
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
                {renderSectionHeader("Achievements", "Key Milestones & Awards")}
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {resumeData.achievements.map((ach, index) => {
                    const cleaned = cleanBulletText(ach);
                    if (!cleaned) return null;
                    return (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "6px",
                          fontSize: styles.bodySize,
                          lineHeight: styles.lineHeight,
                          color: selectedTheme.text,
                          marginBottom: styles.bulletMarginBottom,
                        }}
                      >
                        <span
                          style={{
                            color: selectedTheme.primary,
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 700,
                            fontSize: "1.05em",
                            lineHeight: 1,
                            marginTop: "2px",
                            flexShrink: 0,
                            userSelect: "none",
                          }}
                        >
                          ⚡
                        </span>
                        <span style={{ flex: 1 }}>
                          {highlightMetrics(cleaned, selectedTheme.primary)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );

          case "customSections":
            if (!resumeData.customSections?.length) return null;
            return (
              <>
                {resumeData.customSections.map((section, index) => {
                  if (!section.title || !section.items?.length) return null;
                  return (
                    <section key={`custom-${index}`} style={{ marginBottom: styles.sectionMarginBottom }}>
                      {renderSectionHeader(
                        section.title.replace(/\s+/g, ""),
                        section.title
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                        {section.items.map((rawItem, itemIdx) => {
                          const isStructured = rawItem && typeof rawItem === "object";
                          const itemTitle = isStructured ? (rawItem.title || rawItem.name || "") : rawItem;
                          const subtitle = isStructured ? (rawItem.subtitle || rawItem.organization || rawItem.issuer || rawItem.publisher || "") : "";
                          const date = isStructured ? (rawItem.date || "") : "";
                          const link = isStructured ? (rawItem.link || rawItem.url || "") : "";
                          const description = isStructured ? (rawItem.description || "") : "";
                          const bullets = isStructured && Array.isArray(rawItem.bullets) ? rawItem.bullets.filter(Boolean) : [];

                          if (!isStructured || (!subtitle && !date && !link && bullets.length === 0 && !description)) {
                            const cleaned = cleanBulletText(typeof itemTitle === "string" ? itemTitle : "");
                            if (!cleaned) return null;
                            return (
                              <div
                                key={itemIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "6px",
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  color: selectedTheme.text,
                                  marginBottom: styles.bulletMarginBottom,
                                }}
                              >
                                <span
                                  style={{
                                    color: selectedTheme.primary,
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontWeight: 700,
                                    fontSize: "1.05em",
                                    lineHeight: 1,
                                    marginTop: "2px",
                                    flexShrink: 0,
                                    userSelect: "none",
                                  }}
                                >
                                  ▹
                                </span>
                                <span style={{ flex: 1 }}>
                                  {highlightMetrics(cleaned, selectedTheme.primary)}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div key={itemIdx} style={{ marginBottom: "2px" }}>
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
                                      // {subtitle}
                                    </span>
                                  )}
                                  {link && (
                                    <a
                                      href={link.startsWith("http") ? link : `https://${link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: styles.metaSize,
                                        color: selectedTheme.primary,
                                        textDecoration: "underline",
                                      }}
                                    >
                                      [url]
                                    </a>
                                  )}
                                </div>
                                {date && (
                                  <span
                                    style={{
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontSize: styles.metaSize,
                                      color: selectedTheme.textMuted,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {date}
                                  </span>
                                )}
                              </div>

                              {description && (
                                <p style={{ fontSize: styles.bodySize, lineHeight: styles.lineHeight, color: selectedTheme.textMuted, margin: "0 0 2px 0" }}>
                                  {description}
                                </p>
                              )}

                              {bullets.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: styles.bulletMarginBottom }}>
                                  {bullets.map((b, bIdx) => (
                                    <div
                                      key={bIdx}
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "6px",
                                        fontSize: styles.bodySize,
                                        lineHeight: styles.lineHeight,
                                        color: selectedTheme.text,
                                        marginBottom: styles.bulletMarginBottom,
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: selectedTheme.primary,
                                          fontFamily: '"JetBrains Mono", monospace',
                                          fontWeight: 700,
                                          fontSize: "1.05em",
                                          lineHeight: 1,
                                          marginTop: "2px",
                                          flexShrink: 0,
                                          userSelect: "none",
                                        }}
                                      >
                                        ▹
                                      </span>
                                      <span style={{ flex: 1 }}>
                                        {highlightMetrics(cleanBulletText(b), selectedTheme.primary)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </>
            );

          default:
            return null;
        }
      })}
    </div>
  );
});

TechTemplate.displayName = "TechTemplate";

export default TechTemplate;

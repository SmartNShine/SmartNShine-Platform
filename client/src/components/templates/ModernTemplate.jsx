import React, { forwardRef, useRef, useEffect, useMemo } from "react";
import { getResumeSocialLinks } from "@/utils/resumeSocialLinks";
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
 * ModernTemplate - "Linear / Vercel Minimalist" Archetype
 *
 * Inspired by Linear, Vercel, Raycast, and modern design-engineering resumes.
 * Features:
 * - Ultra-clean whitespace, high-contrast typography, and precision engineering aesthetic
 * - Neo-grotesque sans paired with crisp monospaced metadata (JetBrains Mono / monospace)
 * - Subtle vertical timeline rail for career progression
 * - Monospaced inline tech pills with hairline borders
 * - ATS-safe quantifiable metric highlighter (+40%, $2.4M, 10x, 99.99% SLA)
 * - Intelligent 1-page auto-density engine with explicit Compact / Balanced / Spacious modes
 * - 100% text-based, ATS-compliant semantic structure
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

const ModernTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "ModernTemplate",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Linear & Vercel Minimalist Color Palettes
  const colorThemes = {
    // Toolbar mapping themes
    linearIndigo: {
      primary: "#5e6ad2", // Linear Violet
      primaryDark: "#4c55ba",
      primaryLight: "#eef0fb",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#c7d2fe",
    },
    raycastEmerald: {
      primary: "#059669", // Terminal Emerald
      primaryDark: "#047857",
      primaryLight: "#ecfdf5",
      accent: "#10b981",
      badgeBg: "#f0fdf4",
      badgeBorder: "#a7f3d0",
      badgeText: "#065f46",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#a7f3d0",
    },
    vercelSlate: {
      primary: "#000000", // Vercel Obsidian
      primaryDark: "#000000",
      primaryLight: "#f4f4f5",
      accent: "#18181b",
      badgeBg: "#fafafa",
      badgeBorder: "#d4d4d8",
      badgeText: "#18181b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#d4d4d8",
    },
    arcElectric: {
      primary: "#2563eb",
      primaryDark: "#1d4ed8",
      primaryLight: "#eff6ff",
      accent: "#3b82f6",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      badgeText: "#1d4ed8",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#93c5fd",
    },
    neonMagenta: {
      primary: "#c026d3",
      primaryDark: "#a21caf",
      primaryLight: "#fdf4ff",
      accent: "#d946ef",
      badgeBg: "#fdf4ff",
      badgeBorder: "#f5d0fe",
      badgeText: "#a21caf",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#f0abfc",
    },
    cyberAmber: {
      primary: "#d97706",
      primaryDark: "#b45309",
      primaryLight: "#fffbeb",
      accent: "#f59e0b",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      badgeText: "#b45309",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#fde68a",
    },
    stripeIndigo: {
      primary: "#5e6ad2",
      primaryDark: "#4c55ba",
      primaryLight: "#eef0fb",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#c7d2fe",
    },
    cyberEmerald: {
      primary: "#059669",
      primaryDark: "#047857",
      primaryLight: "#ecfdf5",
      accent: "#10b981",
      badgeBg: "#f0fdf4",
      badgeBorder: "#a7f3d0",
      badgeText: "#065f46",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#a7f3d0",
    },
    midnightSlate: {
      primary: "#334155",
      primaryDark: "#1e293b",
      primaryLight: "#f1f5f9",
      accent: "#2563eb",
      badgeBg: "#f8fafc",
      badgeBorder: "#cbd5e1",
      badgeText: "#1e293b",
      text: "#020617",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rail: "#cbd5e1",
    },
    monochromePro: {
      primary: "#000000",
      primaryDark: "#000000",
      primaryLight: "#f4f4f5",
      accent: "#18181b",
      badgeBg: "#fafafa",
      badgeBorder: "#d4d4d8",
      badgeText: "#18181b",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#d4d4d8",
    },
    // Backward compatibility keys
    blue: {
      primary: "#5e6ad2",
      primaryDark: "#4c55ba",
      primaryLight: "#eef0fb",
      accent: "#6366f1",
      badgeBg: "#f8f9fe",
      badgeBorder: "#dbe0f8",
      badgeText: "#434ca8",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#c7d2fe",
    },
    teal: {
      primary: "#0d9488",
      primaryDark: "#0f766e",
      primaryLight: "#f0fdfa",
      accent: "#14b8a6",
      badgeBg: "#f0fdfa",
      badgeBorder: "#99f6e4",
      badgeText: "#0f766e",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#99f6e4",
    },
    purple: {
      primary: "#7c3aed",
      primaryDark: "#6d28d9",
      primaryLight: "#f5f3ff",
      accent: "#8b5cf6",
      badgeBg: "#f5f3ff",
      badgeBorder: "#ddd6fe",
      badgeText: "#6d28d9",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#ddd6fe",
    },
    orange: {
      primary: "#ea580c",
      primaryDark: "#c2410c",
      primaryLight: "#fff7ed",
      accent: "#f97316",
      badgeBg: "#fff7ed",
      badgeBorder: "#ffedd5",
      badgeText: "#c2410c",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rail: "#fed7aa",
    },
    slate: {
      primary: "#334155",
      primaryDark: "#1e293b",
      primaryLight: "#f1f5f9",
      accent: "#2563eb",
      badgeBg: "#f8fafc",
      badgeBorder: "#cbd5e1",
      badgeText: "#1e293b",
      text: "#020617",
      textLight: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rail: "#cbd5e1",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.linearIndigo ||
    colorThemes.stripeIndigo;

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
        padding: "0.42in 0.52in",
        nameSize: "23pt",
        titleSize: "10pt",
        contactSize: "8.5pt",
        headerMarginBottom: "10px",
        sectionMarginBottom: "9px",
        headingSize: "10.5pt",
        headingMarginBottom: "5px",
        itemMarginBottom: "6px",
        bodySize: "9pt",
        metaSize: "8.2pt",
        lineHeight: 1.28,
        bulletMarginBottom: "2px",
        railLeft: "6px",
        contentPaddingLeft: "16px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.62in 0.68in",
        nameSize: "29pt",
        titleSize: "11.5pt",
        contactSize: "9.5pt",
        headerMarginBottom: "18px",
        sectionMarginBottom: "17px",
        headingSize: "12pt",
        headingMarginBottom: "8px",
        itemMarginBottom: "12px",
        bodySize: "10pt",
        metaSize: "9pt",
        lineHeight: 1.5,
        bulletMarginBottom: "4px",
        railLeft: "7px",
        contentPaddingLeft: "20px",
      };
    }
    // Balanced / Medium default
    return {
      padding: "0.5in 0.6in",
      nameSize: "26pt",
      titleSize: "10.5pt",
      contactSize: "9pt",
      headerMarginBottom: "14px",
      sectionMarginBottom: "13px",
      headingSize: "11pt",
      headingMarginBottom: "6px",
      itemMarginBottom: "8px",
      bodySize: "9.4pt",
      metaSize: "8.6pt",
      lineHeight: 1.38,
      bulletMarginBottom: "3px",
      railLeft: "6.5px",
      contentPaddingLeft: "18px",
    };
  }, [density]);

  // Section Ordering
  const defaultOrder = [
    "summary",
    "experience",
    "projects",
    "skills",
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
  const contactItems = [
    contact.email && {
      icon: Mail,
      label: contact.email,
      href: `mailto:${contact.email}`,
    },
    contact.phone && {
      icon: Phone,
      label: contact.phone,
      href: null,
    },
    (contact.location || resumeData.location) && {
      icon: MapPin,
      label: contact.location || resumeData.location,
      href: null,
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
    contact.website && {
      icon: Globe,
      label: contact.website.replace(/^https?:\/\/(www\.)?/i, ""),
      href: contact.website.startsWith("http") ? contact.website : `https://${contact.website}`,
    },
    ...getResumeSocialLinks(contact),
  ].filter(Boolean);

  // Section heading: Minimalist line with mono index tag
  const renderSectionHeader = (title) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: styles.headingMarginBottom,
        paddingBottom: "3px",
        borderBottom: `1px solid ${selectedTheme.border}`,
      }}
    >
      <h2
        style={{
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: styles.headingSize,
          fontWeight: 700,
          color: selectedTheme.text,
          letterSpacing: "-0.01em",
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: selectedTheme.border }} />
    </div>
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="bg-white text-zinc-900"
      style={{
        width: "210mm",
        boxSizing: "border-box",
        padding: styles.padding,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: selectedTheme.text,
      }}
    >
      {/* Header: Linear/Vercel Precision Header */}
      <header style={{ marginBottom: styles.headerMarginBottom }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "6px" }}>
          <div>
            <h1
              style={{
                fontSize: styles.nameSize,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: selectedTheme.text,
                margin: "0 0 2px 0",
                lineHeight: 1.1,
              }}
            >
              {resumeData.name || "Developer Candidate"}
            </h1>
            {(resumeData.title || resumeData.jobTitle) && (
              <div
                style={{
                  fontSize: styles.titleSize,
                  fontWeight: 600,
                  color: selectedTheme.primary,
                  letterSpacing: "-0.01em",
                }}
              >
                {resumeData.title || resumeData.jobTitle}
              </div>
            )}
          </div>

          {/* Monospaced contact strip */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 12px",
              fontSize: styles.contactSize,
              fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
              color: selectedTheme.textMuted,
            }}
          >
            {contactItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Icon size={12} style={{ color: selectedTheme.primary, opacity: 0.85 }} />
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: selectedTheme.textLight,
                        textDecoration: "none",
                        borderBottom: `1px solid ${selectedTheme.border}`,
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* Dynamic Sections */}
      {sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case "summary":
            if (!resumeData.summary) return null;
            return (
              <section key="summary" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("About")}
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
            if (!resumeData.experience?.length) return null;
            return (
              <section key="experience" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Experience")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.experience.map((exp, index) => {
                    const skipDescription = isDescriptionDuplicatedInBullets(exp.description, exp.bullets);
                    return (
                      <div
                        key={index}
                        style={{
                          position: "relative",
                          paddingLeft: styles.contentPaddingLeft,
                        }}
                      >
                        {/* Subtle timeline rail */}
                        <div
                          style={{
                            position: "absolute",
                            left: styles.railLeft,
                            top: "4px",
                            bottom: "-4px",
                            width: "1.5px",
                            backgroundColor: selectedTheme.rail,
                            opacity: 0.7,
                          }}
                        />
                        {/* Timeline dot */}
                        <div
                          style={{
                            position: "absolute",
                            left: `calc(${styles.railLeft} - 2.5px)`,
                            top: "5px",
                            width: "6.5px",
                            height: "6.5px",
                            borderRadius: "9999px",
                            backgroundColor: selectedTheme.primary,
                          }}
                        />

                        {/* Item header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            flexWrap: "wrap",
                            gap: "4px",
                            marginBottom: "2px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: styles.bodySize,
                                color: selectedTheme.text,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {exp.company}
                            </span>
                            {exp.title && (
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: styles.bodySize,
                                  color: selectedTheme.primary,
                                  marginLeft: "6px",
                                }}
                              >
                                — {exp.title}
                              </span>
                            )}
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
                              fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
                              fontSize: styles.metaSize,
                              color: selectedTheme.textMuted,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? "–" : ""}{" "}
                            {exp.current ? "Present" : exp.endDate}
                          </span>
                        </div>

                        {!skipDescription && exp.description && (
                          <p
                            style={{
                              fontSize: styles.bodySize,
                              lineHeight: styles.lineHeight,
                              color: selectedTheme.textLight,
                              margin: "0 0 3px 0",
                            }}
                          >
                            {highlightMetrics(exp.description, selectedTheme.primary)}
                          </p>
                        )}

                        {exp.bullets?.length > 0 && (
                          <ul
                            style={{
                              listStyleType: "disc",
                              margin: 0,
                              paddingLeft: "15px",
                            }}
                          >
                            {exp.bullets.map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                style={{
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  color: selectedTheme.textLight,
                                  marginBottom: styles.bulletMarginBottom,
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
            if (!resumeData.projects?.length) return null;
            return (
              <section key="projects" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Projects")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.projects.map((proj, index) => {
                    const techList = Array.isArray(proj.technologies)
                      ? proj.technologies
                      : typeof proj.technologies === "string"
                      ? proj.technologies.split(",").map((t) => t.trim())
                      : [];

                    return (
                      <div key={index}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            flexWrap: "wrap",
                            gap: "4px",
                            marginBottom: "2px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: styles.bodySize,
                                color: selectedTheme.text,
                                letterSpacing: "-0.01em",
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
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "2px",
                                  fontSize: styles.metaSize,
                                  fontFamily: '"JetBrains Mono", monospace',
                                  color: selectedTheme.primary,
                                  textDecoration: "none",
                                }}
                              >
                                <ExternalLink size={10} />
                                <span>live</span>
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
                                  fontFamily: '"JetBrains Mono", monospace',
                                  color: selectedTheme.primary,
                                  textDecoration: "none",
                                }}
                              >
                                <Github size={10} />
                                <span>github</span>
                              </a>
                            )}
                            {techList.length > 0 && (
                              <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginLeft: "4px" }}>
                                {techList.map((tech, tIdx) => (
                                  <span
                                    key={tIdx}
                                    style={{
                                      fontFamily: '"JetBrains Mono", "SF Mono", monospace',
                                      fontSize: "7.5pt",
                                      padding: "1px 5px",
                                      borderRadius: "4px",
                                      backgroundColor: selectedTheme.badgeBg,
                                      border: `1px solid ${selectedTheme.badgeBorder}`,
                                      color: selectedTheme.badgeText,
                                    }}
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {(proj.startDate || proj.endDate || proj.year) && (
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
                                fontSize: styles.metaSize,
                                color: selectedTheme.textMuted,
                              }}
                            >
                              {proj.startDate} {proj.startDate && proj.endDate ? "–" : ""} {proj.endDate || proj.year}
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
                              margin: "0 0 3px 0",
                            }}
                          >
                            {highlightMetrics(proj.description, selectedTheme.primary)}
                          </p>
                        )}

                        {proj.bullets?.length > 0 && (
                          <ul
                            style={{
                              listStyleType: "disc",
                              margin: 0,
                              paddingLeft: "15px",
                            }}
                          >
                            {proj.bullets.map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                style={{
                                  fontSize: styles.bodySize,
                                  lineHeight: styles.lineHeight,
                                  color: selectedTheme.textLight,
                                  marginBottom: styles.bulletMarginBottom,
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

          case "skills":
            if (!resumeData.skills?.length) return null;
            return (
              <section key="skills" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Skills")}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {resumeData.skills.map((skillGroup, index) => {
                    const category = typeof skillGroup === "string" ? null : skillGroup.category || skillGroup.name;
                    const items = typeof skillGroup === "string" ? skillGroup : skillGroup.items || skillGroup.skills;
                    const itemsList = Array.isArray(items)
                      ? items
                      : String(items || "")
                          .split(",")
                          .map((s) => s.trim());

                    return (
                      <div key={index} style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                        {category && (
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: styles.metaSize,
                              fontWeight: 700,
                              color: selectedTheme.text,
                              minWidth: "90px",
                            }}
                          >
                            {category}:
                          </span>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {itemsList.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: styles.bodySize,
                                color: selectedTheme.textLight,
                              }}
                            >
                              {skill}
                              {sIdx < itemsList.length - 1 && <span style={{ color: selectedTheme.textMuted }}>,</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                            {edu.institution || edu.school}
                          </span>
                          {edu.location && (
                            <span
                              style={{
                                fontSize: styles.metaSize,
                                color: selectedTheme.textMuted,
                                marginLeft: "6px",
                              }}
                            >
                              ({edu.location})
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", "SF Mono", Consolas, monospace',
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
                          }}
                        >
                          {edu.startDate} {edu.startDate && (edu.endDate || edu.year) ? "–" : ""}{" "}
                          {edu.endDate || edu.year}
                        </span>
                      </div>

                      <div style={{ fontSize: styles.bodySize, color: selectedTheme.textLight }}>
                        <span style={{ fontWeight: 600 }}>{formatEducationDegreeAndField(edu)}</span>
                        {edu.gpa && (
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: styles.metaSize,
                              marginLeft: "6px",
                              color: selectedTheme.textMuted,
                            }}
                          >
                            (GPA: {edu.gpa})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "certifications":
            if (!resumeData.certifications?.length) return null;
            return (
              <section key="certifications" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Certifications")}
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
                          <span style={{ color: selectedTheme.textMuted }}> — {cert.issuer}</span>
                        )}
                      </div>
                      {(cert.date || cert.year) && (
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
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
                {renderSectionHeader("Achievements")}
                <ul
                  style={{
                    listStyleType: "disc",
                    margin: 0,
                    paddingLeft: "15px",
                  }}
                >
                  {resumeData.achievements.map((ach, index) => (
                    <li
                      key={index}
                      style={{
                        fontSize: styles.bodySize,
                        lineHeight: styles.lineHeight,
                        color: selectedTheme.textLight,
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
                          <ul
                            key={iIdx}
                            style={{
                              listStyleType: "disc",
                              margin: 0,
                              paddingLeft: "15px",
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
                            <ul style={{ listStyleType: "disc", margin: 0, paddingLeft: "15px" }}>
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
    </div>
  );
});

ModernTemplate.displayName = "ModernTemplate";

export default ModernTemplate;

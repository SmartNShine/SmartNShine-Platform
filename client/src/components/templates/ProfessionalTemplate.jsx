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
} from "lucide-react";

/**
 * ProfessionalTemplate - "Corporate Fortune 500 & Enterprise Leader" Archetype
 *
 * Designed for Product Managers, Operations Directors, Business Leaders, and Senior Consultants.
 * Features:
 * - Clean corporate typography with high visual hierarchy
 * - Left accent bar section headings with subtle dividers
 * - ATS-safe quantifiable business impact highlighter (revenue, $, %, headcount, scale)
 * - Intelligent 1-page auto-density engine with Compact / Balanced / Spacious modes
 * - 100% text-based, ATS-compliant semantic structure
 */

// ATS-safe metric highlighter for business, sales, and management achievements
const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|clients|customers|revenue|growth|pipeline|deals|stakeholders|teams|direct reports|accounts|ARR|MRR|EBITDA)\b)/gi;

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

const ProfessionalTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "ProfessionalTemplate",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Color Themes
  const colorThemes = {
    royalSapphire: {
      primary: "#1d4ed8",
      secondary: "#1e40af",
      accent: "#3b82f6",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#1d4ed8",
    },
    emeraldPrestige: {
      primary: "#047857",
      secondary: "#065f46",
      accent: "#10b981",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#047857",
    },
    cabernetBurgundy: {
      primary: "#831843",
      secondary: "#701a75",
      accent: "#be185d",
      badgeBg: "#fdf2f8",
      badgeBorder: "#fbcfe8",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#831843",
    },
    nordicTeal: {
      primary: "#0f766e",
      secondary: "#115e59",
      accent: "#14b8a6",
      badgeBg: "#f0fdfa",
      badgeBorder: "#99f6e4",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0f766e",
    },
    titaniumSlate: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#475569",
      badgeBg: "#f8fafc",
      badgeBorder: "#cbd5e1",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e2e8f0",
      rule: "#1e293b",
    },
    imperialPlum: {
      primary: "#6b21a8",
      secondary: "#581c87",
      accent: "#9333ea",
      badgeBg: "#faf5ff",
      badgeBorder: "#e9d5ff",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#6b21a8",
    },
    deepOcean: {
      primary: "#0369a1",
      secondary: "#075985",
      accent: "#0284c7",
      badgeBg: "#f0f9ff",
      badgeBorder: "#bae6fd",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0369a1",
    },
    warmTerracotta: {
      primary: "#c2410c",
      secondary: "#9a3412",
      accent: "#ea580c",
      badgeBg: "#fff7ed",
      badgeBorder: "#fed7aa",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#c2410c",
    },
    // Legacy & Toolbar compatibility mappings
    navy: {
      primary: "#1d4ed8",
      secondary: "#1e40af",
      accent: "#3b82f6",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#1d4ed8",
    },
    burgundy: {
      primary: "#831843",
      secondary: "#701a75",
      accent: "#be185d",
      badgeBg: "#fdf2f8",
      badgeBorder: "#fbcfe8",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#831843",
    },
    forest: {
      primary: "#047857",
      secondary: "#065f46",
      accent: "#10b981",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#047857",
    },
    gray: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#475569",
      badgeBg: "#f8fafc",
      badgeBorder: "#cbd5e1",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e2e8f0",
      rule: "#1e293b",
    },
    teal: {
      primary: "#0f766e",
      secondary: "#115e59",
      accent: "#14b8a6",
      badgeBg: "#f0fdfa",
      badgeBorder: "#99f6e4",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#0f766e",
    },
    stripeIndigo: {
      primary: "#1d4ed8",
      secondary: "#1e40af",
      accent: "#3b82f6",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#1d4ed8",
    },
    cyberEmerald: {
      primary: "#047857",
      secondary: "#065f46",
      accent: "#10b981",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      text: "#0f172a",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#e2e8f0",
      rule: "#047857",
    },
    midnightSlate: {
      primary: "#1e293b",
      secondary: "#334155",
      accent: "#475569",
      badgeBg: "#f8fafc",
      badgeBorder: "#e2e8f0",
      text: "#09090b",
      textLight: "#27272a",
      textMuted: "#71717a",
      border: "#e4e4e7",
      rule: "#1e293b",
    },
    monochromePro: {
      primary: "#111827",
      secondary: "#1f2937",
      accent: "#374151",
      badgeBg: "#f9fafb",
      badgeBorder: "#e5e7eb",
      text: "#000000",
      textLight: "#1f2937",
      textMuted: "#4b5563",
      border: "#e5e7eb",
      rule: "#111827",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.royalSapphire ||
    colorThemes.navy;

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
        padding: "0.4in 0.5in",
        nameSize: "20pt",
        titleSize: "10pt",
        contactSize: "8.5pt",
        headerMarginBottom: "10px",
        sectionMarginBottom: "9px",
        headingSize: "10.5pt",
        headingPaddingBottom: "2px",
        headingMarginBottom: "5px",
        itemMarginBottom: "6px",
        bodySize: "9pt",
        metaSize: "8.5pt",
        lineHeight: 1.3,
        bulletMarginBottom: "2px",
        bulletGap: "6px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.6in 0.68in",
        nameSize: "26pt",
        titleSize: "11.5pt",
        contactSize: "9.5pt",
        headerMarginBottom: "18px",
        sectionMarginBottom: "16px",
        headingSize: "12.5pt",
        headingPaddingBottom: "4px",
        headingMarginBottom: "8px",
        itemMarginBottom: "11px",
        bodySize: "10pt",
        metaSize: "9.2pt",
        lineHeight: 1.5,
        bulletMarginBottom: "4px",
        bulletGap: "8px",
      };
    }
    // Balanced / Medium default
    return {
      padding: "0.48in 0.58in",
      nameSize: "23pt",
      titleSize: "10.8pt",
      contactSize: "9pt",
      headerMarginBottom: "13px",
      sectionMarginBottom: "12px",
      headingSize: "11.2pt",
      headingPaddingBottom: "3px",
      headingMarginBottom: "6px",
      itemMarginBottom: "8px",
      bodySize: "9.4pt",
      metaSize: "8.8pt",
      lineHeight: 1.38,
      bulletMarginBottom: "3px",
      bulletGap: "7px",
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
    contact.github && {
      icon: Github,
      label: contact.github.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/"),
      href: contact.github.startsWith("http") ? contact.github : `https://${contact.github}`,
    },
    ...getResumeSocialLinks(contact),
  ].filter(Boolean);

  // Section heading renderer
  const renderSectionHeader = (title) => (
    <div style={{ marginBottom: styles.headingMarginBottom }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${selectedTheme.primary}`,
          paddingBottom: styles.headingPaddingBottom,
        }}
      >
        <h2
          style={{
            fontSize: styles.headingSize,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: selectedTheme.primary,
            margin: 0,
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
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: selectedTheme.text,
      }}
    >
      {/* Header */}
      <header
        style={{
          marginBottom: styles.headerMarginBottom,
          borderBottom: `1px solid ${selectedTheme.border}`,
          paddingBottom: "10px",
        }}
      >
        <h1
          style={{
            fontSize: styles.nameSize,
            fontWeight: 800,
            color: selectedTheme.primary,
            margin: 0,
            letterSpacing: "-0.4px",
            lineHeight: 1.15,
          }}
        >
          {resumeData.name || "Candidate Name"}
        </h1>

        {(resumeData.title || resumeData.jobTitle) && (
          <div
            style={{
              fontSize: styles.titleSize,
              fontWeight: 600,
              color: selectedTheme.textLight,
              marginTop: "2px",
              marginBottom: "6px",
            }}
          >
            {resumeData.title || resumeData.jobTitle}
          </div>
        )}

        {/* Contact Links Row */}
        {contactParts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 14px",
              fontSize: styles.contactSize,
              color: selectedTheme.textMuted,
              marginTop: "4px",
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
                {renderSectionHeader("Executive Summary")}
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

          case "skills":
            if (!resumeData.skills || resumeData.skills.length === 0) return null;
            return (
              <section key="skills" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Core Competencies")}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px 14px",
                  }}
                >
                  {resumeData.skills.map((group, index) => (
                    <div key={index} style={{ fontSize: styles.bodySize }}>
                      <span style={{ fontWeight: 700, color: selectedTheme.primary }}>
                        {group.category || "Specialization"}:{" "}
                      </span>
                      <span style={{ color: selectedTheme.textLight }}>
                        {Array.isArray(group.items) ? group.items.join(" • ") : group.items}
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
                {renderSectionHeader("Professional Experience")}
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
                            {exp.position || "Position Title"}
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
                                    fontSize: "1.1em",
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
            );

          case "projects":
            if (!resumeData.projects?.length) return null;
            return (
              <section key="projects" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Key Initiatives & Projects")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.projects.map((proj, index) => (
                    <div key={index}>
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
                            fontSize: "8pt",
                            color: selectedTheme.primary,
                            fontWeight: 600,
                            marginBottom: "2px",
                          }}
                        >
                          Focus: {proj.technologies}
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
                                    fontSize: "1.1em",
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
            );

          case "education":
            if (!resumeData.education?.length) return null;
            return (
              <section key="education" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Education")}
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
                              fontSize: styles.metaSize,
                              color: selectedTheme.primary,
                              fontWeight: 600,
                              marginLeft: "6px",
                            }}
                          >
                            [GPA: {edu.gpa}]
                          </span>
                        )}
                      </div>
                      <span
                        style={{
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
                {renderSectionHeader("Certifications & Credentials")}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "4px 12px",
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
                {renderSectionHeader("Key Achievements & Honors")}
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
                            fontSize: "1.05em",
                            lineHeight: 1,
                            marginTop: "2px",
                            flexShrink: 0,
                            userSelect: "none",
                          }}
                        >
                          ◆
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
                      {renderSectionHeader(section.title)}
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
                                    fontSize: "1.1em",
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
                                      | {subtitle}
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
                                        textDecoration: "underline",
                                      }}
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
                                <div style={{ display: "flex", flexDirection: "column", gap: styles.bulletMarginBottom }}>
                                  {bullets.map((b, bIdx) => (
                                    <div
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
                                          fontSize: "1.1em",
                                          lineHeight: 1,
                                          marginTop: "2px",
                                          flexShrink: 0,
                                          userSelect: "none",
                                        }}
                                      >
                                        •
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

ProfessionalTemplate.displayName = "ProfessionalTemplate";

export default ProfessionalTemplate;

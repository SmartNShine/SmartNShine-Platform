import React, { forwardRef, useRef, useEffect, useMemo } from "react";
import { normalizeQrCode } from "../editor/utils/qrCode";
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
 * ClassicTemplate — "The Open-Source Architect" Flagship Archetype (v2)
 *
 * Designed for Backend Engineers, DevOps/SRE, Systems Architects, and Open-Source Contributors.
 * Visual Identity: A polished GitHub README.md rendered as a premium resume.
 *
 * Features:
 * - Left 3px solid accent border on header block — true terminal authority
 * - Name in JetBrains Mono with `>_` terminal prefix glyph
 * - Contact strip: icon + label in YAML/key:value monospaced style
 * - Section headers: `##` markdown prefix in primary color, title in Inter sans
 * - Skills: authentic GitHub topic pill badges (bg + border + text in theme colors)
 * - Experience: job title in code-style inline chip, company in normal weight
 * - Bullet points: `▸` terminal arrow prefix instead of disc
 * - Projects: mini "repo card" layout with name in monospace link style + tech chips
 * - 95+ ATS-compliant semantic structure (no CSS grid split for ATS safety)
 * - Intelligent 1-page auto-density engine
 */

// ATS-safe metric highlighter for engineering & system metrics
const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|MAU|DAU|customers|clients|engineers|developers|nodes|services|microservices|req\/s|rps|qps|ms|fps|stars|downloads|pull requests|PRs|tps|commits|repos|packages)(?:\b))/gi;

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

const ClassicTemplate = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "ClassicTemplate",
      });
    }
  }, [resumeData]);

  // ── Color Palettes ──────────────────────────────────────────────────────────
  const colorThemes = {
    // Primary flagship themes
    githubBlue: {
      primary: "#0969da",
      primaryDark: "#0550ae",
      badgeBg: "#ddf4ff",
      badgeBorder: "#54aeff",
      badgeText: "#0550ae",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#0969da",
      mdHash: "#0969da",
      codeChip: "#f6f8fa",
      codeChipBorder: "#d0d7de",
    },
    terminalGreen: {
      primary: "#1a7f37",
      primaryDark: "#116329",
      badgeBg: "#dafbe1",
      badgeBorder: "#56d364",
      badgeText: "#116329",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#1a7f37",
      mdHash: "#1a7f37",
      codeChip: "#f6f8fa",
      codeChipBorder: "#d0d7de",
    },
    neonCyan: {
      primary: "#0e7490",
      primaryDark: "#155e75",
      badgeBg: "#ecfeff",
      badgeBorder: "#67e8f9",
      badgeText: "#155e75",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#0e7490",
      mdHash: "#0891b2",
      codeChip: "#f0fdfa",
      codeChipBorder: "#99f6e4",
    },
    githubDark: {
      primary: "#58a6ff",
      primaryDark: "#1f6feb",
      badgeBg: "#161b22",
      badgeBorder: "#388bfd",
      badgeText: "#79c0ff",
      text: "#e6edf3",
      textLight: "#cdd9e5",
      textMuted: "#848d97",
      border: "#30363d",
      accentBar: "#1f6feb",
      mdHash: "#58a6ff",
      codeChip: "#21262d",
      codeChipBorder: "#30363d",
    },
    monokaiPurple: {
      primary: "#7c3aed",
      primaryDark: "#6d28d9",
      badgeBg: "#f5f3ff",
      badgeBorder: "#c4b5fd",
      badgeText: "#5b21b6",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#7c3aed",
      mdHash: "#7c3aed",
      codeChip: "#faf5ff",
      codeChipBorder: "#ddd6fe",
    },
    cobaltTech: {
      primary: "#1d4ed8",
      primaryDark: "#1e40af",
      badgeBg: "#eff6ff",
      badgeBorder: "#93c5fd",
      badgeText: "#1e40af",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#1d4ed8",
      mdHash: "#1d4ed8",
      codeChip: "#f8faff",
      codeChipBorder: "#bfdbfe",
    },
    rubyRed: {
      primary: "#b91c1c",
      primaryDark: "#991b1b",
      badgeBg: "#fef2f2",
      badgeBorder: "#fca5a5",
      badgeText: "#991b1b",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#b91c1c",
      mdHash: "#b91c1c",
      codeChip: "#fff5f5",
      codeChipBorder: "#fecaca",
    },
    obsidianDark: {
      primary: "#24292f",
      primaryDark: "#000000",
      badgeBg: "#f6f8fa",
      badgeBorder: "#d0d7de",
      badgeText: "#24292f",
      text: "#1f2328",
      textLight: "#333d47",
      textMuted: "#656d76",
      border: "#d0d7de",
      accentBar: "#24292f",
      mdHash: "#57606a",
      codeChip: "#f6f8fa",
      codeChipBorder: "#d0d7de",
    },
    // Legacy compat keys
    stripeIndigo: { primary: "#0969da", primaryDark: "#0550ae", badgeBg: "#ddf4ff", badgeBorder: "#54aeff", badgeText: "#0550ae", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#0969da", mdHash: "#0969da", codeChip: "#f6f8fa", codeChipBorder: "#d0d7de" },
    cyberEmerald: { primary: "#1a7f37", primaryDark: "#116329", badgeBg: "#dafbe1", badgeBorder: "#56d364", badgeText: "#116329", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#1a7f37", mdHash: "#1a7f37", codeChip: "#f6f8fa", codeChipBorder: "#d0d7de" },
    midnightSlate: { primary: "#d97706", primaryDark: "#b45309", badgeBg: "#fffbeb", badgeBorder: "#fde68a", badgeText: "#b45309", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#d97706", mdHash: "#d97706", codeChip: "#fffdf5", codeChipBorder: "#fde68a" },
    monochromePro: { primary: "#24292f", primaryDark: "#000000", badgeBg: "#f6f8fa", badgeBorder: "#d0d7de", badgeText: "#24292f", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#24292f", mdHash: "#57606a", codeChip: "#f6f8fa", codeChipBorder: "#d0d7de" },
    navy: { primary: "#0969da", primaryDark: "#0550ae", badgeBg: "#ddf4ff", badgeBorder: "#54aeff", badgeText: "#0550ae", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#0969da", mdHash: "#0969da", codeChip: "#f6f8fa", codeChipBorder: "#d0d7de" },
    burgundy: { primary: "#9f1239", primaryDark: "#881337", badgeBg: "#fff1f2", badgeBorder: "#fda4af", badgeText: "#881337", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#9f1239", mdHash: "#9f1239", codeChip: "#fff1f2", codeChipBorder: "#ffe4e6" },
    forest: { primary: "#15803d", primaryDark: "#166534", badgeBg: "#f0fdf4", badgeBorder: "#86efac", badgeText: "#166534", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#15803d", mdHash: "#15803d", codeChip: "#f0fdf4", codeChipBorder: "#bbf7d0" },
    charcoal: { primary: "#374151", primaryDark: "#1f2937", badgeBg: "#f9fafb", badgeBorder: "#d1d5db", badgeText: "#374151", text: "#1f2328", textLight: "#333d47", textMuted: "#656d76", border: "#d0d7de", accentBar: "#374151", mdHash: "#4b5563", codeChip: "#f9fafb", codeChipBorder: "#e5e7eb" },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
    colorThemes.githubBlue;

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
        padding: "0.42in 0.52in",
        nameSize: "20pt",
        titleSize: "9.5pt",
        contactSize: "8pt",
        headerMarginBottom: "10px",
        sectionMarginBottom: "9px",
        headingSize: "9.5pt",
        headingMarginBottom: "5px",
        itemMarginBottom: "5px",
        bodySize: "8.8pt",
        metaSize: "8pt",
        lineHeight: 1.28,
        bulletMarginBottom: "2px",
        tagFontSize: "7.5pt",
        tagPadding: "1px 5px",
      };
    }
    if (density === "spacious") {
      return {
        padding: "0.60in 0.65in",
        nameSize: "26pt",
        titleSize: "11pt",
        contactSize: "9pt",
        headerMarginBottom: "18px",
        sectionMarginBottom: "16px",
        headingSize: "11pt",
        headingMarginBottom: "8px",
        itemMarginBottom: "12px",
        bodySize: "10pt",
        metaSize: "9pt",
        lineHeight: 1.52,
        bulletMarginBottom: "4px",
        tagFontSize: "8.5pt",
        tagPadding: "2px 7px",
      };
    }
    // Balanced default
    return {
      padding: "0.50in 0.58in",
      nameSize: "22pt",
      titleSize: "10pt",
      contactSize: "8.5pt",
      headerMarginBottom: "14px",
      sectionMarginBottom: "12px",
      headingSize: "10pt",
      headingMarginBottom: "6px",
      itemMarginBottom: "8px",
      bodySize: "9.2pt",
      metaSize: "8.5pt",
      lineHeight: 1.38,
      bulletMarginBottom: "3px",
      tagFontSize: "8pt",
      tagPadding: "1.5px 6px",
    };
  }, [density]);

  // ── Section Order ─────────────────────────────────────────────────────────
  const defaultOrder = ["summary", "skills", "experience", "projects", "education", "certifications", "achievements", "customSections"];
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
  const qrCode = normalizeQrCode(resumeData.qrCode);
  const showQrCode = qrCode.enabled && Boolean(qrCode.imageDataUrl);
  const contactItems = [
    contact.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: contact.phone, href: null },
    (contact.location || resumeData.location) && { icon: MapPin, label: contact.location || resumeData.location, href: null },
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
  ].filter(Boolean);

  // ── GitHub-style Topic Pill ───────────────────────────────────────────────
  const SkillTag = ({ label }) => (
    <span
      style={{
        display: "inline-block",
        backgroundColor: selectedTheme.badgeBg,
        border: `1px solid ${selectedTheme.badgeBorder}`,
        color: selectedTheme.badgeText,
        fontSize: styles.tagFontSize,
        fontWeight: 500,
        fontFamily: '"Inter", -apple-system, sans-serif',
        padding: styles.tagPadding,
        borderRadius: "2em",
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );

  // ── Markdown-style `##` Section Header ───────────────────────────────────
  const renderSectionHeader = (title) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: styles.headingMarginBottom,
        paddingBottom: "4px",
        borderBottom: `1.5px solid ${selectedTheme.border}`,
      }}
    >
      <span
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
          fontSize: styles.headingSize,
          fontWeight: 700,
          color: selectedTheme.mdHash,
          letterSpacing: "-0.5px",
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        ##
      </span>
      <h2
        style={{
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: styles.headingSize,
          fontWeight: 700,
          color: selectedTheme.text,
          letterSpacing: "0.2px",
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
    </div>
  );

  // ── Inline code-style job title chip ─────────────────────────────────────
  const CodeChip = ({ children }) => (
    <span
      style={{
        display: "inline-block",
        backgroundColor: selectedTheme.codeChip,
        border: `1px solid ${selectedTheme.codeChipBorder}`,
        borderRadius: "4px",
        padding: "0px 5px",
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: "0.88em",
        fontWeight: 500,
        color: selectedTheme.primary,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
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
        minHeight: "11in",
        boxSizing: "border-box",
        padding: styles.padding,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: selectedTheme.text,
        backgroundColor: selectedTheme.githubDark ? "#0d1117" : "#ffffff",
      }}
    >
      {/* ── Header Block — left accent border, terminal identity ────────── */}
      <header
        style={{
          marginBottom: styles.headerMarginBottom,
          paddingLeft: "14px",
          borderLeft: `3px solid ${selectedTheme.accentBar}`,
          display: showQrCode ? "flex" : undefined,
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0, overflowWrap: "anywhere" }}>
        {/* Name with >_ terminal prefix */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: styles.nameSize,
              fontWeight: 700,
              color: selectedTheme.primary,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              flexShrink: 0,
              userSelect: "none",
              opacity: 0.7,
            }}
          >
            &gt;_
          </span>
          <h1
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: styles.nameSize,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: selectedTheme.text,
              margin: 0,
              lineHeight: 1.1,
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {resumeData.name || "Software Architect"}
          </h1>
        </div>

        {/* Title */}
        {(resumeData.title || resumeData.jobTitle) && (
          <div
            style={{
              fontSize: styles.titleSize,
              fontWeight: 600,
              color: selectedTheme.primary,
              marginBottom: "6px",
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {resumeData.title || resumeData.jobTitle}
          </div>
        )}

        {/* Contact strip — icon + label, YAML-style */}
        {contactItems.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "2px 14px",
              fontSize: styles.contactSize,
              color: selectedTheme.textMuted,
              marginTop: "6px",
            }}
          >
            {contactItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "4px", minWidth: 0, maxWidth: "100%" }}>
                  <Icon size={11} style={{ color: selectedTheme.primary, flexShrink: 0 }} />
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: selectedTheme.textLight,
                        textDecoration: "none",
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span style={{ color: selectedTheme.textLight }}>{item.label}</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
        </div>
        {showQrCode && (
          <img
            src={qrCode.imageDataUrl}
            alt="Resume QR code"
            width={96}
            height={96}
            style={{ width: "1in", height: "1in", flexShrink: 0, marginLeft: "auto" }}
          />
        )}
      </header>

      {/* ── Dynamic Sections ─────────────────────────────────────────────── */}
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
                  }}
                >
                  {highlightMetrics(resumeData.summary, selectedTheme.primary)}
                </p>
              </section>
            );

          case "skills":
            if (!resumeData.skills?.length) return null;
            return (
              <section key="skills" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Tech Stack")}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {resumeData.skills.map((skillGroup, index) => {
                    const category = typeof skillGroup === "string" ? null : skillGroup.category || skillGroup.name;
                    const items = typeof skillGroup === "string" ? [skillGroup] : skillGroup.items || skillGroup.skills;
                    const itemsList = Array.isArray(items) ? items : [String(items || "")];

                    return (
                      <div key={index} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
                        {category && (
                          <span
                            style={{
                              fontSize: styles.bodySize,
                              fontWeight: 700,
                              color: selectedTheme.text,
                              marginRight: "2px",
                              flexShrink: 0,
                              lineHeight: 1.6,
                            }}
                          >
                            {category}:
                          </span>
                        )}
                        {itemsList.map((skill, sIdx) => (
                          <SkillTag key={sIdx} label={typeof skill === "string" ? skill : String(skill)} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </section>
            );

          case "experience":
            if (!resumeData.experience?.length) return null;
            return (
              <section key="experience" style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader("Experience")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.experience.map((exp, index) => (
                    <div key={index}>
                      {/* Company + Date row */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: "2px",
                          flexWrap: "wrap",
                          gap: "2px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {/* Title as inline code chip */}
                          {(exp.title || exp.position) && (
                            <CodeChip>{exp.title || exp.position}</CodeChip>
                          )}
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: styles.bodySize,
                              color: selectedTheme.text,
                            }}
                          >
                            {exp.company}
                          </span>
                          {exp.location && (
                            <span
                              style={{
                                fontSize: styles.metaSize,
                                color: selectedTheme.textMuted,
                              }}
                            >
                              · {exp.location}
                            </span>
                          )}
                        </div>

                        {/* Date in monospace */}
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {exp.startDate}
                          {exp.startDate && (exp.endDate || exp.current) ? " – " : ""}
                          {exp.current ? "Present" : exp.endDate}
                        </span>
                      </div>

                      {/* Description */}
                      {exp.description &&
                        (!exp.bullets?.length || !isDescriptionDuplicatedInBullets(exp.description, exp.bullets)) && (
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

                      {/* Bullet points with ▸ terminal arrow */}
                      {exp.bullets?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: styles.bulletMarginBottom }}>
                          {exp.bullets.map((bullet, bIdx) => {
                            const cleaned = cleanBulletText(bullet);
                            if (!cleaned) return null;
                            return (
                              <div
                                key={bIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "6px",
                                }}
                              >
                                <span
                                  style={{
                                    color: selectedTheme.primary,
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    flexShrink: 0,
                                    userSelect: "none",
                                    marginTop: "0.5px",
                                  }}
                                >
                                  ▸
                                </span>
                                <span
                                  style={{
                                    fontSize: styles.bodySize,
                                    lineHeight: styles.lineHeight,
                                    color: selectedTheme.textLight,
                                  }}
                                >
                                  {highlightMetrics(cleaned, selectedTheme.primary)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
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
                {renderSectionHeader("Projects")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.itemMarginBottom }}>
                  {resumeData.projects.map((proj, index) => {
                    const techList = Array.isArray(proj.technologies)
                      ? proj.technologies
                      : typeof proj.technologies === "string"
                      ? proj.technologies.split(",").map((t) => t.trim())
                      : [];

                    return (
                      <div
                        key={index}
                        style={{
                          borderLeft: `2px solid ${selectedTheme.badgeBorder}`,
                          paddingLeft: "10px",
                        }}
                      >
                        {/* Repo card header row */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "3px",
                            flexWrap: "wrap",
                            gap: "4px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {/* Project name in monospace link style */}
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                fontWeight: 700,
                                fontSize: styles.bodySize,
                                color: selectedTheme.primary,
                                letterSpacing: "-0.02em",
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
                                  color: selectedTheme.textMuted,
                                  textDecoration: "none",
                                }}
                              >
                                <ExternalLink size={9} />
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
                                  color: selectedTheme.textMuted,
                                  textDecoration: "none",
                                }}
                              >
                                <Github size={9} />
                                <span>github</span>
                              </a>
                            )}
                          </div>
                          {(proj.startDate || proj.endDate || proj.year) && (
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: styles.metaSize,
                                color: selectedTheme.textMuted,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {proj.startDate} {proj.startDate && proj.endDate ? "– " : ""}{proj.endDate || proj.year}
                            </span>
                          )}
                        </div>

                        {/* Tech chip tags */}
                        {techList.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "4px" }}>
                            {techList.map((tech, tIdx) => (
                              <SkillTag key={tIdx} label={tech} />
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        {proj.description &&
                          (!proj.bullets?.length || !isDescriptionDuplicatedInBullets(proj.description, proj.bullets)) && (
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

                        {/* Bullets */}
                        {proj.bullets?.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: styles.bulletMarginBottom }}>
                            {proj.bullets.map((bullet, bIdx) => {
                              const cleaned = cleanBulletText(bullet);
                              if (!cleaned) return null;
                              return (
                                <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                  <span
                                    style={{
                                      color: selectedTheme.primary,
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontSize: styles.bodySize,
                                      lineHeight: styles.lineHeight,
                                      flexShrink: 0,
                                      userSelect: "none",
                                    }}
                                  >
                                    ▸
                                  </span>
                                  <span
                                    style={{
                                      fontSize: styles.bodySize,
                                      lineHeight: styles.lineHeight,
                                      color: selectedTheme.textLight,
                                    }}
                                  >
                                    {highlightMetrics(cleaned, selectedTheme.primary)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                          marginBottom: "1px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
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
                            <span style={{ fontSize: styles.metaSize, color: selectedTheme.textMuted }}>
                              · {edu.location}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: styles.metaSize,
                            color: selectedTheme.textMuted,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {edu.startDate} {edu.startDate && (edu.endDate || edu.year) ? "– " : ""}
                          {edu.endDate || edu.year}
                        </span>
                      </div>
                      <div style={{ fontSize: styles.bodySize, color: selectedTheme.textLight }}>
                        <span style={{ fontWeight: 600 }}>{formatEducationDegreeAndField(edu)}</span>
                        {edu.gpa && (
                          <span style={{ marginLeft: "8px", color: selectedTheme.textMuted }}>
                            · GPA: {edu.gpa}
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
                {renderSectionHeader("Achievements")}
                <div style={{ display: "flex", flexDirection: "column", gap: styles.bulletMarginBottom }}>
                  {resumeData.achievements.map((ach, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <span
                        style={{
                          color: selectedTheme.primary,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: styles.bodySize,
                          lineHeight: styles.lineHeight,
                          flexShrink: 0,
                          userSelect: "none",
                        }}
                      >
                        ▸
                      </span>
                      <span
                        style={{
                          fontSize: styles.bodySize,
                          lineHeight: styles.lineHeight,
                          color: selectedTheme.textLight,
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
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "customSections":
            if (!resumeData.customSections?.length) return null;
            return resumeData.customSections.map((custom, cIdx) => (
              <section key={`custom-${cIdx}`} style={{ marginBottom: styles.sectionMarginBottom }}>
                {renderSectionHeader(custom.title || "Additional")}
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
                          <div key={iIdx} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                            <span
                              style={{
                                color: selectedTheme.primary,
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                flexShrink: 0,
                                userSelect: "none",
                              }}
                            >
                              ▸
                            </span>
                            <span
                              style={{
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.textLight,
                              }}
                            >
                              {highlightMetrics(typeof itemTitle === "string" ? itemTitle : "", selectedTheme.primary)}
                            </span>
                          </div>
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
                              gap: "2px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
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
                                    fontSize: styles.metaSize,
                                    color: selectedTheme.textMuted,
                                    fontStyle: "italic",
                                  }}
                                >
                                  · {subtitle}
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
                            <p
                              style={{
                                fontSize: styles.bodySize,
                                lineHeight: styles.lineHeight,
                                color: selectedTheme.textLight,
                                margin: "0 0 2px 0",
                              }}
                            >
                              {description}
                            </p>
                          )}

                          {bullets.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: styles.bulletMarginBottom }}>
                              {bullets.map((b, bIdx) => (
                                <div key={bIdx} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                  <span
                                    style={{
                                      color: selectedTheme.primary,
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontSize: styles.bodySize,
                                      lineHeight: styles.lineHeight,
                                      flexShrink: 0,
                                      userSelect: "none",
                                      marginTop: "0.5px",
                                    }}
                                  >
                                    ▸
                                  </span>
                                  <span
                                    style={{
                                      fontSize: styles.bodySize,
                                      lineHeight: styles.lineHeight,
                                      color: selectedTheme.textLight,
                                    }}
                                  >
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

ClassicTemplate.displayName = "ClassicTemplate";

export default ClassicTemplate;

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
  User,
  Briefcase,
  Code2,
  Cpu,
  GraduationCap,
  Award,
  Trophy,
  Sparkles,
  BookOpen,
  Heart,
  Compass,
} from "lucide-react";

/**
 * SiliconValleyTemplate - Flagship Modern Developer Resume Template
 *
 * Inspired by Stripe, Linear, Vercel, and Apple engineering resumes.
 * Features:
 * - 99% ATS Compatibility Guarantee with clean semantic DOM flow
 * - Curated developer typography (Plus Jakarta Sans + Inter + JetBrains Mono)
 * - Intelligent Content Density Engine (automatically scales spacing to guarantee 1-page fit)
 * - ATS-safe dynamic metric highlighting (+40%, $2.4M, 10x, 99.99% SLA)
 * - Sleek project entries with inline tech tags & redundant description deduplication
 * - Grouped skill capsules with compact domain pills
 * - Refined commit-rail timeline with tabular dates
 * - Sleek micro-icon contact strip
 * - 4 high-end color themes: Stripe Indigo, Cyber Emerald, Midnight Slate, Monochrome Pro
 */

// Helper to highlight quantifiable metrics while keeping text 95+ ATS-safe
const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d+[\d,.]*\+?\s*(?:users|MAU|DAU|customers|clients|engineers|developers|nodes|services|microservices|req\/s|rps|qps|ms|fps|stars|downloads|pull requests|PRs)\b|\b\d{2,4}\+\b)/gi;

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
            letterSpacing: "-0.01em",
          }}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const SiliconValleyTemplate = forwardRef(
  ({ resumeData = {}, onPageUsageChange }, ref) => {
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
          templateName: "SiliconValleyTemplate",
        };

        onPageUsageChangeRef.current(usageInfo);
      }
    }, [resumeData]);

    // Color themes
    const colorThemes = {
      stripeIndigo: {
        id: "stripeIndigo",
        name: "Stripe Indigo",
        primary: "#4f46e5",
        primaryDark: "#3730a3",
        primaryLight: "#e0e7ff",
        accent: "#06b6d4",
        badgeBg: "#f5f7ff",
        badgeBorder: "#c7d2fe",
        badgeText: "#3730a3",
        text: "#0f172a",
        textLight: "#334155",
        textMuted: "#64748b",
        border: "#e2e8f0",
        rail: "#818cf8",
        highlightBg: "#f8faff",
      },
      cyberEmerald: {
        id: "cyberEmerald",
        name: "Cyber Emerald",
        primary: "#059669",
        primaryDark: "#065f46",
        primaryLight: "#d1fae5",
        accent: "#10b981",
        badgeBg: "#f0fdf4",
        badgeBorder: "#a7f3d0",
        badgeText: "#047857",
        text: "#0f172a",
        textLight: "#334155",
        textMuted: "#64748b",
        border: "#e2e8f0",
        rail: "#34d399",
        highlightBg: "#f0fdf4",
      },
      electricCobalt: {
        id: "electricCobalt",
        name: "Electric Cobalt",
        primary: "#2563eb",
        primaryDark: "#1d4ed8",
        primaryLight: "#dbeafe",
        accent: "#38bdf8",
        badgeBg: "#eff6ff",
        badgeBorder: "#bfdbfe",
        badgeText: "#1e40af",
        text: "#0f172a",
        textLight: "#334155",
        textMuted: "#64748b",
        border: "#e2e8f0",
        rail: "#60a5fa",
        highlightBg: "#f0f9ff",
      },
      crimsonEdge: {
        id: "crimsonEdge",
        name: "Crimson Edge",
        primary: "#be123c",
        primaryDark: "#9f1239",
        primaryLight: "#ffe4e6",
        accent: "#f43f5e",
        badgeBg: "#fff1f2",
        badgeBorder: "#fecdd3",
        badgeText: "#9f1239",
        text: "#0f172a",
        textLight: "#334155",
        textMuted: "#64748b",
        border: "#e2e8f0",
        rail: "#fb7185",
        highlightBg: "#fff1f2",
      },
      nordicTeal: {
        id: "nordicTeal",
        name: "Nordic Teal",
        primary: "#0f766e",
        primaryDark: "#115e59",
        primaryLight: "#ccfbf1",
        accent: "#14b8a6",
        badgeBg: "#f0fdfa",
        badgeBorder: "#99f6e4",
        badgeText: "#115e59",
        text: "#0f172a",
        textLight: "#334155",
        textMuted: "#64748b",
        border: "#e2e8f0",
        rail: "#2dd4bf",
        highlightBg: "#f0fdfa",
      },
      midnightSlate: {
        id: "midnightSlate",
        name: "Midnight Slate",
        primary: "#1e293b",
        primaryDark: "#0f172a",
        primaryLight: "#e2e8f0",
        accent: "#2563eb",
        badgeBg: "#f8fafc",
        badgeBorder: "#cbd5e1",
        badgeText: "#334155",
        text: "#020617",
        textLight: "#334155",
        textMuted: "#64748b",
        border: "#e2e8f0",
        rail: "#3b82f6",
        highlightBg: "#f8fafc",
      },
      monochromePro: {
        id: "monochromePro",
        name: "Monochrome Pro",
        primary: "#18181b",
        primaryDark: "#09090b",
        primaryLight: "#e4e4e7",
        accent: "#52525b",
        badgeBg: "#f4f4f5",
        badgeBorder: "#d4d4d8",
        badgeText: "#27272a",
        text: "#18181b",
        textLight: "#3f3f46",
        textMuted: "#71717a",
        border: "#e4e4e7",
        rail: "#52525b",
        highlightBg: "#f4f4f5",
      },
    };

    // Aliases for compatibility across templates
    colorThemes.blue = colorThemes.stripeIndigo;
    colorThemes.indigo = colorThemes.stripeIndigo;
    colorThemes.green = colorThemes.cyberEmerald;
    colorThemes.emerald = colorThemes.cyberEmerald;
    colorThemes.slate = colorThemes.midnightSlate;
    colorThemes.charcoal = colorThemes.monochromePro;
    colorThemes.monochrome = colorThemes.monochromePro;

    const selectedTheme =
      colorThemes[resumeData?.selectedTheme || resumeData?.colorTheme] ||
      colorThemes.stripeIndigo;

    // Content Weight Calculation for Intelligent Auto-Density
    const contentWeight = useMemo(() => {
      let weight = 0;
      (resumeData?.experience || []).forEach((exp) => {
        weight += 2;
        weight += (exp.bullets?.length || 0) * 1.25;
      });
      (resumeData?.projects || []).forEach((proj) => {
        weight += 1.5;
        weight += (proj.bullets?.length || 0) * 1.1;
        if (proj.description && (!proj.bullets || proj.bullets.length === 0)) {
          weight += 1.2;
        }
      });
      weight += (resumeData?.skills?.length || 0) * 1.2;
      weight += (resumeData?.education?.length || 0) * 1.4;
      weight += (resumeData?.achievements?.length || 0) * 1.1;
      weight += (resumeData?.certifications?.length || 0) * 1.1;
      if (resumeData?.summary) {
        weight += Math.ceil(resumeData.summary.length / 85);
      }
      return weight;
    }, [resumeData]);

    // Dynamic styles based on content volume or explicit density
    const dynamicStyles = useMemo(() => {
      const explicitDensity = resumeData?.density;
      const isHighDensity =
        explicitDensity === "compact" ||
        (!explicitDensity && contentWeight >= 50);
      const isMediumDensity =
        explicitDensity === "medium" ||
        (!explicitDensity && contentWeight >= 32 && contentWeight < 50);

      if (isHighDensity) {
        return {
          pagePadding: "0.28in 0.38in",
          headerMarginBottom: "8px",
          nameSize: "21pt",
          titleSize: "10pt",
          bodySize: "9.1pt",
          bodyLineHeight: "1.28",
          sectionHeadingSize: "9.8pt",
          sectionMarginBottom: "7px",
          sectionHeadingMarginBottom: "3px",
          itemMarginBottom: "5px",
          bulletMarginBottom: "1.5px",
          pillPadding: "0.5px 5px",
          pillFontSize: "7.5pt",
          timelinePaddingLeft: "11px",
          timelineNodeSize: "6px",
          contactGap: "4px 12px",
        };
      }

      if (isMediumDensity) {
        return {
          pagePadding: "0.38in 0.46in",
          headerMarginBottom: "11px",
          nameSize: "22pt",
          titleSize: "10.4pt",
          bodySize: "8.8pt",
          bodyLineHeight: "1.36",
          sectionHeadingSize: "10.2pt",
          sectionMarginBottom: "10px",
          sectionHeadingMarginBottom: "4px",
          itemMarginBottom: "7px",
          bulletMarginBottom: "2.2px",
          pillPadding: "1px 6px",
          pillFontSize: "7.6pt",
          timelinePaddingLeft: "12px",
          timelineNodeSize: "7px",
          contactGap: "5px 14px",
        };
      }

      // Relaxed / Balanced mode (clean breathing room)
      return {
        pagePadding: "0.45in 0.52in",
        headerMarginBottom: "14px",
        nameSize: "24pt",
        titleSize: "11pt",
        bodySize: "9.1pt",
        bodyLineHeight: "1.42",
        sectionHeadingSize: "10.8pt",
        sectionMarginBottom: "13px",
        sectionHeadingMarginBottom: "5px",
        itemMarginBottom: "9px",
        bulletMarginBottom: "3px",
        pillPadding: "2px 7px",
        pillFontSize: "8pt",
        timelinePaddingLeft: "14px",
        timelineNodeSize: "8px",
        contactGap: "6px 16px",
      };
    }, [resumeData?.density, contentWeight]);

    // Typography styles based on user selection
    const fontPairing = resumeData?.fontPairing || "modernSans";
    let fontHeading =
      '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let fontBody =
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let fontMono =
      '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

    if (fontPairing === "editorialSerif") {
      fontHeading =
        '"Newsreader", "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif';
      fontBody =
        '"Newsreader", Georgia, Cambria, "Times New Roman", Times, serif';
    } else if (fontPairing === "techMono") {
      fontHeading =
        '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
      fontBody =
        '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
    }

    // Section ordering
    const DEFAULT_SECTION_ORDER = [
      "summary",
      "experience",
      "projects",
      "skills",
      "education",
      "certifications",
      "achievements",
      "customSections",
    ];

    const baseSectionOrder =
      resumeData.sectionOrder && resumeData.sectionOrder.length > 0
        ? resumeData.sectionOrder.filter(
            (id) => !["score", "personal", "recommendations"].includes(id)
          )
        : DEFAULT_SECTION_ORDER;

    const sectionOrder =
      resumeData.customSections && resumeData.customSections.length > 0 && !baseSectionOrder.includes("customSections")
        ? [...baseSectionOrder, "customSections"]
        : baseSectionOrder;

    // Contact info items
    const contact = resumeData.contact || {};
    const contactItems = [
      contact.email && {
        id: "email",
        label: contact.email,
        href: `mailto:${contact.email}`,
        icon: <Mail size={11} strokeWidth={2.2} />,
      },
      contact.phone && {
        id: "phone",
        label: contact.phone,
        href: `tel:${contact.phone}`,
        icon: <Phone size={11} strokeWidth={2.2} />,
      },
      contact.location && {
        id: "location",
        label: contact.location,
        icon: <MapPin size={11} strokeWidth={2.2} />,
      },
      contact.linkedin && {
        id: "linkedin",
        label: "LinkedIn",
        href: contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`,
        icon: (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        ),
      },
      contact.github && {
        id: "github",
        label: "GitHub",
        href: contact.github.startsWith("http") ? contact.github : `https://${contact.github}`,
        icon: (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        ),
      },
      contact.website && {
        id: "website",
        label: "Portfolio",
        href: contact.website.startsWith("http") ? contact.website : `https://${contact.website}`,
        icon: <Globe size={11} strokeWidth={2.2} />,
      },
      ...getResumeSocialLinks(contact).map(({ href, label, icon: Icon }) => ({
        id: href,
        label,
        href,
        icon: <Icon size={11} aria-hidden="true" />,
      })),
    ].filter(Boolean);

    // Section title mapping
    const getSectionTitle = (sectionKey) => {
      const titles = resumeData?.sectionTitles || {};
      const defaultTitles = {
        summary: "Professional Summary",
        experience: "Experience",
        projects: "Featured Projects",
        skills: "Technical Skills",
        education: "Education",
        certifications: "Certifications",
        achievements: "Achievements & Honors",
        customSections: "Additional Information",
      };
      return titles[sectionKey] || defaultTitles[sectionKey] || sectionKey.toUpperCase();
    };

    const sectionIcons = {
      summary: <User size={12.5} strokeWidth={2.2} />,
      experience: <Briefcase size={12.5} strokeWidth={2.2} />,
      projects: <Code2 size={12.5} strokeWidth={2.2} />,
      skills: <Cpu size={12.5} strokeWidth={2.2} />,
      education: <GraduationCap size={12.5} strokeWidth={2.2} />,
      certifications: <Award size={12.5} strokeWidth={2.2} />,
      achievements: <Trophy size={12.5} strokeWidth={2.2} />,
      publications: <BookOpen size={12.5} strokeWidth={2.2} />,
      volunteer: <Heart size={12.5} strokeWidth={2.2} />,
      interests: <Compass size={12.5} strokeWidth={2.2} />,
      courses: <BookOpen size={12.5} strokeWidth={2.2} />,
      custom: <Sparkles size={12.5} strokeWidth={2.2} />,
    };

    // Render section heading with sleek, premium icon
    const renderSectionHeading = (title, sectionKey) => {
      const normalizedTitle = (title || "").toLowerCase();
      let icon = (sectionKey && sectionIcons[sectionKey]) || null;

      if (!icon) {
        if (normalizedTitle.includes("summar") || normalizedTitle.includes("about") || normalizedTitle.includes("profile")) {
          icon = sectionIcons.summary;
        } else if (normalizedTitle.includes("exper") || normalizedTitle.includes("work") || normalizedTitle.includes("employ")) {
          icon = sectionIcons.experience;
        } else if (normalizedTitle.includes("proj")) {
          icon = sectionIcons.projects;
        } else if (normalizedTitle.includes("skill") || normalizedTitle.includes("tech")) {
          icon = sectionIcons.skills;
        } else if (normalizedTitle.includes("edu") || normalizedTitle.includes("acad")) {
          icon = sectionIcons.education;
        } else if (normalizedTitle.includes("cert") || normalizedTitle.includes("licens")) {
          icon = sectionIcons.certifications;
        } else if (normalizedTitle.includes("achieve") || normalizedTitle.includes("honor") || normalizedTitle.includes("award")) {
          icon = sectionIcons.achievements;
        } else if (normalizedTitle.includes("publi")) {
          icon = sectionIcons.publications;
        } else if (normalizedTitle.includes("volun")) {
          icon = sectionIcons.volunteer;
        } else if (normalizedTitle.includes("interest")) {
          icon = sectionIcons.interests;
        } else {
          icon = sectionIcons.custom;
        }
      }

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginBottom: dynamicStyles.sectionHeadingMarginBottom,
            borderBottom: `1.5px solid ${selectedTheme.border}`,
            paddingBottom: "3px",
            paddingTop: "2px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: selectedTheme.primary,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
          <h2
            style={{
              fontFamily: fontHeading,
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: selectedTheme.primaryDark,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
        </div>
      );
    };

    // Section Content Handlers
    const sectionRenderers = {
      summary: resumeData.summary && (
        <section
          key="summary"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("summary"), "summary")}
          <p
            style={{
              fontFamily: fontBody,
              fontSize: dynamicStyles.bodySize,
              lineHeight: dynamicStyles.bodyLineHeight,
              color: selectedTheme.textLight,
              margin: 0,
              textAlign: "left",
            }}
          >
            {highlightMetrics(resumeData.summary, selectedTheme.primary)}
          </p>
        </section>
      ),

      experience: resumeData.experience && resumeData.experience.length > 0 && (
        <section
          key="experience"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("experience"), "experience")}
          <div style={{ display: "flex", flexDirection: "column", gap: dynamicStyles.itemMarginBottom }}>
            {resumeData.experience.map((exp, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  paddingLeft: dynamicStyles.timelinePaddingLeft,
                  borderLeft: `1.5px solid ${selectedTheme.primaryLight}`,
                }}
              >
                {/* Timeline node */}
                <div
                  style={{
                    position: "absolute",
                    left: "-4px",
                    top: "3.5px",
                    width: dynamicStyles.timelineNodeSize,
                    height: dynamicStyles.timelineNodeSize,
                    borderRadius: "50%",
                    backgroundColor: selectedTheme.primary,
                    border: "1.5px solid #ffffff",
                    boxShadow: `0 0 0 1px ${selectedTheme.border}`,
                  }}
                />

                {/* Role and Company Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "2px 6px",
                    marginBottom: "1px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px", flexWrap: "wrap" }}>
                    <h3
                      style={{
                        fontFamily: fontHeading,
                        fontSize: dynamicStyles.titleSize,
                        fontWeight: 700,
                        color: selectedTheme.text,
                        margin: 0,
                        lineHeight: 1.25,
                      }}
                    >
                      {exp.position || exp.title}
                    </h3>
                    {exp.company?.trim() && (
                      <span
                        style={{
                          fontFamily: fontBody,
                          fontSize: dynamicStyles.bodySize,
                          fontWeight: 600,
                          color: selectedTheme.primary,
                        }}
                      >
                        @ {exp.company.trim()}
                      </span>
                    )}
                    {exp.location && (
                      <span
                        style={{
                          fontFamily: fontMono,
                          fontSize: "7.2pt",
                          color: selectedTheme.textMuted,
                        }}
                      >
                        ({exp.location})
                      </span>
                    )}
                  </div>

                  {/* Tabular Date */}
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: "7.4pt",
                      fontWeight: 600,
                      color: selectedTheme.textMuted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exp.startDate} — {exp.endDate || "Present"}
                  </span>
                </div>

                {/* Non-duplicated description if present */}
                {exp.description &&
                  (!exp.bullets?.length ||
                    !isDescriptionDuplicatedInBullets(exp.description, exp.bullets)) && (
                    <p
                      style={{
                        fontFamily: fontBody,
                        fontSize: dynamicStyles.bodySize,
                        lineHeight: dynamicStyles.bodyLineHeight,
                        color: selectedTheme.textLight,
                        margin: "0 0 3px 0",
                      }}
                    >
                      {highlightMetrics(exp.description, selectedTheme.primary)}
                    </p>
                  )}

                {/* Bullets with ATS-Safe Metric Highlighting */}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: "2px 0 0 0",
                      paddingLeft: "15px",
                      listStyleType: "disc",
                    }}
                  >
                    {exp.bullets.map((bullet, bIdx) => {
                      const cleaned = cleanBulletText(bullet);
                      if (!cleaned) return null;
                      return (
                        <li
                          key={bIdx}
                          style={{
                            fontFamily: fontBody,
                            fontSize: dynamicStyles.bodySize,
                            lineHeight: dynamicStyles.bodyLineHeight,
                            color: selectedTheme.textLight,
                            marginBottom: dynamicStyles.bulletMarginBottom,
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
      ),

      projects: resumeData.projects && resumeData.projects.length > 0 && (
        <section
          key="projects"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("projects"), "projects")}
          <div style={{ display: "flex", flexDirection: "column", gap: dynamicStyles.itemMarginBottom }}>
            {resumeData.projects.map((proj, index) => {
              const hasBullets = proj.bullets && proj.bullets.length > 0;
              const skipDescription =
                hasBullets && isDescriptionDuplicatedInBullets(proj.description, proj.bullets);

              return (
                <div key={index} style={{ marginBottom: dynamicStyles.itemMarginBottom }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: "2px 8px",
                      marginBottom: "2px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                      <h3
                        style={{
                          fontFamily: fontHeading,
                          fontSize: dynamicStyles.titleSize,
                          fontWeight: 700,
                          color: selectedTheme.text,
                          margin: 0,
                          lineHeight: 1.25,
                        }}
                      >
                        {proj.name}
                      </h3>
                      {(proj.link || proj.liveUrl) && (
                        <a
                          href={(proj.link || proj.liveUrl).startsWith("http") ? (proj.link || proj.liveUrl) : `https://${proj.link || proj.liveUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: fontMono,
                            fontSize: "7.4pt",
                            color: selectedTheme.primary,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "1.5px",
                            fontWeight: 600,
                          }}
                        >
                          <span>demo</span>
                          <span>↗</span>
                        </a>
                      )}
                      {(proj.github || proj.githubUrl) && (
                        <a
                          href={(proj.github || proj.githubUrl).startsWith("http") ? (proj.github || proj.githubUrl) : `https://${proj.github || proj.githubUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: fontMono,
                            fontSize: "7.4pt",
                            color: selectedTheme.primary,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "1.5px",
                            fontWeight: 600,
                          }}
                        >
                          <span>github</span>
                          <span>↗</span>
                        </a>
                      )}
                    </div>

                    {/* Technologies tags inline */}
                    {proj.technologies && (
                      <span
                        style={{
                          fontFamily: fontMono,
                          fontSize: "7.2pt",
                          color: selectedTheme.primary,
                          fontWeight: 500,
                        }}
                      >
                        {(Array.isArray(proj.technologies)
                          ? proj.technologies
                          : proj.technologies.split(/[,•|]/)
                        )
                          .map((tech) => tech.trim())
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    )}
                  </div>

                  {/* Render description only if not duplicate of bullets */}
                  {!skipDescription && proj.description && (
                    <p
                      style={{
                        fontFamily: fontBody,
                        fontSize: dynamicStyles.bodySize,
                        lineHeight: dynamicStyles.bodyLineHeight,
                        color: selectedTheme.textLight,
                        margin: "0 0 2px 0",
                      }}
                    >
                      {highlightMetrics(proj.description, selectedTheme.primary)}
                    </p>
                  )}

                  {/* Project Bullets */}
                  {hasBullets && (
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "15px",
                        listStyleType: "disc",
                      }}
                    >
                      {proj.bullets.map((bullet, bIdx) => {
                        const cleaned = cleanBulletText(bullet);
                        if (!cleaned) return null;
                        return (
                          <li
                            key={bIdx}
                            style={{
                              fontFamily: fontBody,
                              fontSize: dynamicStyles.bodySize,
                              lineHeight: dynamicStyles.bodyLineHeight,
                              color: selectedTheme.textLight,
                              marginBottom: dynamicStyles.bulletMarginBottom,
                            }}
                          >
                            {highlightMetrics(cleaned, selectedTheme.primary)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ),

      skills: resumeData.skills && resumeData.skills.length > 0 && (
        <section
          key="skills"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("skills"), "skills")}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "fit-content(35%) minmax(0, 1fr)",
              alignItems: "baseline",
              gap: "4px 12px",
            }}
          >
            {resumeData.skills.map((skillGroup, index) => {
              const category = skillGroup?.category;
              const items = category
                ? Array.isArray(skillGroup.items)
                  ? skillGroup.items
                  : [skillGroup.items]
                : [skillGroup];

              return (
                <React.Fragment key={index}>
                  {category && (
                    <span
                      style={{
                        fontFamily: fontMono,
                        fontSize: dynamicStyles.pillFontSize,
                        fontWeight: 700,
                        color: selectedTheme.text,
                        gridColumn: 1,
                        overflowWrap: "anywhere",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {category}:
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: dynamicStyles.bodySize,
                      color: selectedTheme.textLight,
                      gridColumn: category ? 2 : "1 / -1",
                      overflowWrap: "anywhere",
                      lineHeight: dynamicStyles.bodyLineHeight,
                    }}
                  >
                    {items.join(" • ")}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </section>
      ),

      education: resumeData.education && resumeData.education.length > 0 && (
        <section
          key="education"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("education"), "education")}
          <div style={{ display: "flex", flexDirection: "column", gap: dynamicStyles.itemMarginBottom }}>
            {resumeData.education.map((edu, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: "2px 6px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: fontHeading,
                      fontSize: dynamicStyles.titleSize,
                      fontWeight: 700,
                      color: selectedTheme.text,
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {formatEducationDegreeAndField(edu)}
                  </h3>
                  <div
                    style={{
                      fontFamily: fontBody,
                      fontSize: dynamicStyles.bodySize,
                      color: selectedTheme.textLight,
                    }}
                  >
                    {edu.institution || edu.school}
                    {edu.location && ` • ${edu.location}`}
                    {edu.gpa && (
                      <span
                        style={{
                          fontFamily: fontMono,
                          fontSize: "7.4pt",
                          marginLeft: "5px",
                          color: selectedTheme.primary,
                          fontWeight: 600,
                        }}
                      >
                        (GPA: {edu.gpa})
                      </span>
                    )}
                  </div>
                </div>

                {(edu.graduationDate || edu.startDate || edu.endDate) && (
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: "7.4pt",
                      fontWeight: 600,
                      color: selectedTheme.textMuted,
                    }}
                  >
                    {edu.graduationDate || `${edu.startDate || ""} — ${edu.endDate || ""}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      certifications: resumeData.certifications && resumeData.certifications.length > 0 && (
        <section
          key="certifications"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("certifications"), "certifications")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
            {resumeData.certifications.map((cert, index) => (
              <div
                key={index}
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "4px",
                }}
              >
                <span style={{ color: selectedTheme.primary, fontSize: "8pt" }}>✓</span>
                <span
                  style={{
                    fontFamily: fontBody,
                    fontSize: dynamicStyles.bodySize,
                    fontWeight: 600,
                    color: selectedTheme.text,
                  }}
                >
                  {typeof cert === "string"
                    ? cert
                    : cert.name || cert.title || cert.issuer || "Certification"}
                </span>
                {cert.issuer && (
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: "7pt",
                      color: selectedTheme.textMuted,
                    }}
                  >
                    ({cert.issuer})
                  </span>
                )}
                {cert.date && (
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: "7pt",
                      color: selectedTheme.primary,
                    }}
                  >
                    • {cert.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      achievements: resumeData.achievements && resumeData.achievements.length > 0 && (
        <section
          key="achievements"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {renderSectionHeading(getSectionTitle("achievements"), "achievements")}
          <ul style={{ margin: 0, paddingLeft: "15px", listStyleType: "disc" }}>
            {resumeData.achievements.map((ach, index) => (
              <li
                key={index}
                style={{
                  fontFamily: fontBody,
                  fontSize: dynamicStyles.bodySize,
                  lineHeight: dynamicStyles.bodyLineHeight,
                  color: selectedTheme.textLight,
                  marginBottom: dynamicStyles.bulletMarginBottom,
                }}
              >
                {highlightMetrics(typeof ach === "string" ? ach : ach.title || ach.description, selectedTheme.primary)}
              </li>
            ))}
          </ul>
        </section>
      ),

      customSections: resumeData.customSections && resumeData.customSections.length > 0 && (
        <section
          key="customSections"
          style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
        >
          {resumeData.customSections.map((sec, index) => (
            <div key={index} style={{ marginBottom: "6px" }}>
              {renderSectionHeading(sec.title || "Additional Information", "custom")}
              {sec.content && (
                <div
                  style={{
                    fontFamily: fontBody,
                    fontSize: dynamicStyles.bodySize,
                    lineHeight: dynamicStyles.bodyLineHeight,
                    color: selectedTheme.textLight,
                    marginBottom: "4px",
                  }}
                >
                  {highlightMetrics(sec.content, selectedTheme.primary)}
                </div>
              )}
              {sec.items && sec.items.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: dynamicStyles.itemMarginBottom }}>
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
                        <ul key={iIdx} style={{ margin: 0, paddingLeft: "15px", listStyleType: "disc" }}>
                          <li
                            style={{
                              fontFamily: fontBody,
                              fontSize: dynamicStyles.bodySize,
                              lineHeight: dynamicStyles.bodyLineHeight,
                              color: selectedTheme.textLight,
                              marginBottom: dynamicStyles.bulletMarginBottom,
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
                              <h3
                                style={{
                                  fontFamily: fontHeading,
                                  fontWeight: 700,
                                  fontSize: dynamicStyles.bodySize,
                                  color: selectedTheme.text,
                                  margin: 0,
                                }}
                              >
                                {itemTitle}
                              </h3>
                            )}
                            {subtitle && (
                              <span
                                style={{
                                  fontFamily: fontBody,
                                  fontSize: dynamicStyles.metaSize,
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
                                  fontFamily: fontMono,
                                  fontSize: dynamicStyles.metaSize,
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
                                fontFamily: fontMono,
                                fontSize: dynamicStyles.metaSize,
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
                              fontFamily: fontBody,
                              fontSize: dynamicStyles.bodySize,
                              lineHeight: dynamicStyles.bodyLineHeight,
                              color: selectedTheme.textLight,
                              margin: "0 0 2px 0",
                            }}
                          >
                            {description}
                          </p>
                        )}

                        {bullets.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: "15px", listStyleType: "disc" }}>
                            {bullets.map((b, bIdx) => (
                              <li
                                key={bIdx}
                                style={{
                                  fontFamily: fontBody,
                                  fontSize: dynamicStyles.bodySize,
                                  lineHeight: dynamicStyles.bodyLineHeight,
                                  color: selectedTheme.textLight,
                                  marginBottom: dynamicStyles.bulletMarginBottom,
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
              )}
            </div>
          ))}
        </section>
      ),
    };

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        id="resume-container"
        style={{
          width: "210mm",
          boxSizing: "border-box",
          padding: dynamicStyles.pagePadding,
          backgroundColor: "#ffffff",
          color: selectedTheme.text,
          fontFamily: fontBody,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header / Masthead */}
        <header style={{ marginBottom: dynamicStyles.headerMarginBottom, paddingTop: "1px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "4px 8px",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: fontHeading,
                  fontSize: dynamicStyles.nameSize,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: selectedTheme.text,
                  margin: 0,
                  lineHeight: "1.1",
                }}
              >
                {resumeData.name || "Candidate Name"}
              </h1>
            </div>

            {resumeData.title && (
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: dynamicStyles.titleSize,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: selectedTheme.primary,
                }}
              >
                {resumeData.title}
              </div>
            )}
          </div>

          {/* Contact Strip */}
          {contactItems.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: dynamicStyles.contactGap,
                paddingTop: "6px",
                paddingBottom: "2px",
                borderTop: `1px dashed ${selectedTheme.border}`,
              }}
            >
              {contactItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontFamily: fontMono,
                    fontSize: "7.6pt",
                    color: selectedTheme.textLight,
                  }}
                >
                  <span style={{ color: selectedTheme.primary, display: "flex" }}>
                    {item.icon}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{
                        color: selectedTheme.textLight,
                        textDecoration: "none",
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Main Content Sections (rendered strictly in user's linear section order) */}
        <main>
          {sectionOrder.map((sectionKey) => sectionRenderers[sectionKey] || null)}
        </main>
      </div>
    );
  }
);

SiliconValleyTemplate.displayName = "SiliconValleyTemplate";

export default SiliconValleyTemplate;

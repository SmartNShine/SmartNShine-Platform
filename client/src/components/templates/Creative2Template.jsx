import React, { forwardRef, useRef, useEffect, useMemo } from "react";
import { isDescriptionDuplicatedInBullets, formatEducationDegreeAndField } from "./templateUtils";
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  Award,
  GraduationCap,
  Briefcase,
  Layers,
  Code2,
  FolderGit2,
  Star,
  Github,
  Linkedin,
} from "lucide-react";

/**
 * Creative2Template — "The Studio & Portfolio Designer" Archetype
 *
 * Designed for Graphic Designers, UI/UX Designers, Creative Developers, and Visual Artists.
 * Features:
 * - Asymmetric 2-column studio layout with textured archival background
 * - Graphic studio monogram stamp [ INITIALS • STUDIO ]
 * - Visual project showcase cards with live link pills and tech badges
 * - Connected timeline rail for studio practice / experience
 * - Authentic, high-end editorial palettes (Terracotta & Sand, Klein Cobalt, Nordic Forest, Darkroom Noir)
 * - Corner crop/registration marks and geometric dividers
 * - Responsive 1-page density & multi-page pagination support
 */

// Procedural SVG woodgrain texture for tactile natural timber & handcrafted wood pulp
const WOOD_TEXTURE_DATA_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='woodGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015 0.32' numOctaves='4' result='noise'/%3E%3CfeColorMatrix type='matrix' values='0.4 0 0 0 0.4 0.3 0 0 0 0.28 0.18 0 0 0 0.16 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23woodGrain)'/%3E%3C/svg%3E";

const highlightMetrics = (text, primaryColor) => {
  if (!text || typeof text !== "string") return text;

  const metricRegex =
    /(\b(?:\+|-)?\$\d+[\d,.]*[kKmMbB]?(?:\+)?|\b(?:\+|-)?\d+[\d,.]*\%|\b\d+(?:\.\d+)?x\b|\b\d{2,4}\+\b|\b\d+[\d,.]*\+?\s*(?:users|MAU|DAU|downloads|clients|readers|exhibitions|awards|stars|projects|visitors|views|followers|tokens|components)\b)/gi;

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

const Creative2Template = forwardRef(({ resumeData = {}, onPageUsageChange }, ref) => {
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
        templateName: "Studio & Portfolio Designer",
      };

      onPageUsageChangeRef.current(usageInfo);
    }
  }, [resumeData]);

  // Authentic Handcrafted Wooden Themes (Single Unified Shade, No Split Tones)
  const colorThemes = {
    // 1. Honey Teak & Oak (Default Wood Theme)
    teakWood: {
      id: "teakWood",
      name: "Honey Teak & Oak",
      canvasBg: "#faf6ee", // Warm natural wood paper
      sidebarBg: "#faf6ee", // Single uniform shade across whole page
      cardBg: "rgba(255, 255, 255, 0.52)",
      cardBorder: "rgba(154, 52, 18, 0.16)",
      textPrimary: "#23170f", // Deep espresso bark
      textSecondary: "#4a3828", // Warm timber shadow
      textMuted: "#7c6655", // Aged wood grain
      primary: "#9a3412", // Rich Warm Teak / Cedar Wood
      primaryLight: "#ffedd5",
      accent: "#b45309", // Golden Oak / Honey Amber
      divider: "rgba(154, 52, 18, 0.16)",
      badgeBg: "#fef3c7",
      badgeText: "#78350f",
      tagBg: "rgba(154, 52, 18, 0.08)",
      tagBorder: "rgba(154, 52, 18, 0.22)",
      tagText: "#9a3412",
      monogramBg: "#9a3412",
      monogramText: "#ffffff",
      isDark: false,
    },
    // Backward-compat alias for archivalPaper -> teakWood
    archivalPaper: {
      id: "archivalPaper",
      name: "Honey Teak & Oak",
      canvasBg: "#faf6ee",
      sidebarBg: "#faf6ee",
      cardBg: "rgba(255, 255, 255, 0.52)",
      cardBorder: "rgba(154, 52, 18, 0.16)",
      textPrimary: "#23170f",
      textSecondary: "#4a3828",
      textMuted: "#7c6655",
      primary: "#9a3412",
      primaryLight: "#ffedd5",
      accent: "#b45309",
      divider: "rgba(154, 52, 18, 0.16)",
      badgeBg: "#fef3c7",
      badgeText: "#78350f",
      tagBg: "rgba(154, 52, 18, 0.08)",
      tagBorder: "rgba(154, 52, 18, 0.22)",
      tagText: "#9a3412",
      monogramBg: "#9a3412",
      monogramText: "#ffffff",
      isDark: false,
    },

    // 2. Smoked Walnut & Brass Timber (Dark Wood Theme)
    smokedWalnut: {
      id: "smokedWalnut",
      name: "Smoked Walnut & Brass",
      canvasBg: "#1b140f", // Deep roasted walnut wood
      sidebarBg: "#1b140f", // Single uniform shade across whole page
      cardBg: "rgba(42, 31, 23, 0.55)",
      cardBorder: "rgba(245, 158, 11, 0.2)",
      textPrimary: "#fdfaf6", // Bone maple
      textSecondary: "#d6c5b4", // Warm birch
      textMuted: "#9e8b7c",
      primary: "#d97706", // Amber Brass / Roasted Timber
      primaryLight: "rgba(217, 119, 6, 0.2)",
      accent: "#ea580c", // Cinnamon wood
      divider: "rgba(245, 158, 11, 0.18)",
      badgeBg: "rgba(217, 119, 6, 0.22)",
      badgeText: "#fbbf24",
      tagBg: "rgba(217, 119, 6, 0.1)",
      tagBorder: "rgba(217, 119, 6, 0.28)",
      tagText: "#fde68a",
      monogramBg: "#d97706",
      monogramText: "#18181b",
      isDark: true,
    },
    galleryNoir: {
      id: "galleryNoir",
      name: "Smoked Walnut & Brass",
      canvasBg: "#1b140f",
      sidebarBg: "#1b140f",
      cardBg: "rgba(42, 31, 23, 0.55)",
      cardBorder: "rgba(245, 158, 11, 0.2)",
      textPrimary: "#fdfaf6",
      textSecondary: "#d6c5b4",
      textMuted: "#9e8b7c",
      primary: "#d97706",
      primaryLight: "rgba(217, 119, 6, 0.2)",
      accent: "#ea580c",
      divider: "rgba(245, 158, 11, 0.18)",
      badgeBg: "rgba(217, 119, 6, 0.22)",
      badgeText: "#fbbf24",
      tagBg: "rgba(217, 119, 6, 0.1)",
      tagBorder: "rgba(217, 119, 6, 0.28)",
      tagText: "#fde68a",
      monogramBg: "#d97706",
      monogramText: "#18181b",
      isDark: true,
    },
    midnightSlate: {
      id: "midnightSlate",
      name: "Smoked Walnut & Brass",
      canvasBg: "#1b140f",
      sidebarBg: "#1b140f",
      cardBg: "rgba(42, 31, 23, 0.55)",
      cardBorder: "rgba(245, 158, 11, 0.2)",
      textPrimary: "#fdfaf6",
      textSecondary: "#d6c5b4",
      textMuted: "#9e8b7c",
      primary: "#d97706",
      primaryLight: "rgba(217, 119, 6, 0.2)",
      accent: "#ea580c",
      divider: "rgba(245, 158, 11, 0.18)",
      badgeBg: "rgba(217, 119, 6, 0.22)",
      badgeText: "#fbbf24",
      tagBg: "rgba(217, 119, 6, 0.1)",
      tagBorder: "rgba(217, 119, 6, 0.28)",
      tagText: "#fde68a",
      monogramBg: "#d97706",
      monogramText: "#18181b",
      isDark: true,
    },

    // 3. Nordic Birch & Pine
    nordicBirch: {
      id: "nordicBirch",
      name: "Nordic Birch & Pine",
      canvasBg: "#f7f6f0", // Clean pale birchwood
      sidebarBg: "#f7f6f0", // Single uniform shade across whole page
      cardBg: "rgba(255, 255, 255, 0.55)",
      cardBorder: "rgba(45, 106, 79, 0.18)",
      textPrimary: "#19241b",
      textSecondary: "#38493d",
      textMuted: "#627568",
      primary: "#2d6a4f", // Evergreen spruce
      primaryLight: "#d8f3dc",
      accent: "#a0522d", // Warm sienna wood
      divider: "rgba(45, 106, 79, 0.16)",
      badgeBg: "#e8f5e9",
      badgeText: "#1b4332",
      tagBg: "rgba(45, 106, 79, 0.08)",
      tagBorder: "rgba(45, 106, 79, 0.24)",
      tagText: "#2d6a4f",
      monogramBg: "#2d6a4f",
      monogramText: "#ffffff",
      isDark: false,
    },
    nordicSage: {
      id: "nordicSage",
      name: "Nordic Birch & Pine",
      canvasBg: "#f7f6f0",
      sidebarBg: "#f7f6f0",
      cardBg: "rgba(255, 255, 255, 0.55)",
      cardBorder: "rgba(45, 106, 79, 0.18)",
      textPrimary: "#19241b",
      textSecondary: "#38493d",
      textMuted: "#627568",
      primary: "#2d6a4f",
      primaryLight: "#d8f3dc",
      accent: "#a0522d",
      divider: "rgba(45, 106, 79, 0.16)",
      badgeBg: "#e8f5e9",
      badgeText: "#1b4332",
      tagBg: "rgba(45, 106, 79, 0.08)",
      tagBorder: "rgba(45, 106, 79, 0.24)",
      tagText: "#2d6a4f",
      monogramBg: "#2d6a4f",
      monogramText: "#ffffff",
      isDark: false,
    },
    cyberEmerald: {
      id: "cyberEmerald",
      name: "Nordic Birch & Pine",
      canvasBg: "#f7f6f0",
      sidebarBg: "#f7f6f0",
      cardBg: "rgba(255, 255, 255, 0.55)",
      cardBorder: "rgba(45, 106, 79, 0.18)",
      textPrimary: "#19241b",
      textSecondary: "#38493d",
      textMuted: "#627568",
      primary: "#2d6a4f",
      primaryLight: "#d8f3dc",
      accent: "#a0522d",
      divider: "rgba(45, 106, 79, 0.16)",
      badgeBg: "#e8f5e9",
      badgeText: "#1b4332",
      tagBg: "rgba(45, 106, 79, 0.08)",
      tagBorder: "rgba(45, 106, 79, 0.24)",
      tagText: "#2d6a4f",
      monogramBg: "#2d6a4f",
      monogramText: "#ffffff",
      isDark: false,
    },

    // 4. Mahogany & Rosewood
    rosewoodMahogany: {
      id: "rosewoodMahogany",
      name: "Rosewood & Mahogany",
      canvasBg: "#fbf5f2", // Warm rosewood grain
      sidebarBg: "#fbf5f2", // Single uniform shade across whole page
      cardBg: "rgba(255, 255, 255, 0.55)",
      cardBorder: "rgba(136, 19, 55, 0.18)",
      textPrimary: "#231218",
      textSecondary: "#4b2b36",
      textMuted: "#7c5563",
      primary: "#881337", // Deep Mahogany
      primaryLight: "#ffe4e6",
      accent: "#9a3412", // Burnished Teak
      divider: "rgba(136, 19, 55, 0.16)",
      badgeBg: "#ffe4e6",
      badgeText: "#881337",
      tagBg: "rgba(136, 19, 55, 0.08)",
      tagBorder: "rgba(136, 19, 55, 0.24)",
      tagText: "#881337",
      monogramBg: "#881337",
      monogramText: "#ffffff",
      isDark: false,
    },
    studioKlein: {
      id: "studioKlein",
      name: "Rosewood & Mahogany",
      canvasBg: "#fbf5f2",
      sidebarBg: "#fbf5f2",
      cardBg: "rgba(255, 255, 255, 0.55)",
      cardBorder: "rgba(136, 19, 55, 0.18)",
      textPrimary: "#231218",
      textSecondary: "#4b2b36",
      textMuted: "#7c5563",
      primary: "#881337",
      primaryLight: "#ffe4e6",
      accent: "#9a3412",
      divider: "rgba(136, 19, 55, 0.16)",
      badgeBg: "#ffe4e6",
      badgeText: "#881337",
      tagBg: "rgba(136, 19, 55, 0.08)",
      tagBorder: "rgba(136, 19, 55, 0.24)",
      tagText: "#881337",
      monogramBg: "#881337",
      monogramText: "#ffffff",
      isDark: false,
    },
    stripeIndigo: {
      id: "stripeIndigo",
      name: "Rosewood & Mahogany",
      canvasBg: "#fbf5f2",
      sidebarBg: "#fbf5f2",
      cardBg: "rgba(255, 255, 255, 0.55)",
      cardBorder: "rgba(136, 19, 55, 0.18)",
      textPrimary: "#231218",
      textSecondary: "#4b2b36",
      textMuted: "#7c5563",
      primary: "#881337",
      primaryLight: "#ffe4e6",
      accent: "#9a3412",
      divider: "rgba(136, 19, 55, 0.16)",
      badgeBg: "#ffe4e6",
      badgeText: "#881337",
      tagBg: "rgba(136, 19, 55, 0.08)",
      tagBorder: "rgba(136, 19, 55, 0.24)",
      tagText: "#881337",
      monogramBg: "#881337",
      monogramText: "#ffffff",
      isDark: false,
    },

    // 5. Charred Ebony & Ash
    charredEbony: {
      id: "charredEbony",
      name: "Charred Ebony & Ash",
      canvasBg: "#f9f9f9",
      sidebarBg: "#f9f9f9",
      cardBg: "rgba(255, 255, 255, 0.6)",
      cardBorder: "rgba(38, 38, 38, 0.16)",
      textPrimary: "#171717", // Shou sugi ban
      textSecondary: "#404040",
      textMuted: "#737373",
      primary: "#262626", // Charred timber
      primaryLight: "#f5f5f5",
      accent: "#525252",
      divider: "rgba(0, 0, 0, 0.14)",
      badgeBg: "#f5f5f5",
      badgeText: "#262626",
      tagBg: "rgba(0, 0, 0, 0.05)",
      tagBorder: "rgba(0, 0, 0, 0.2)",
      tagText: "#171717",
      monogramBg: "#262626",
      monogramText: "#ffffff",
      isDark: false,
    },
    monochromePro: {
      id: "monochromePro",
      name: "Charred Ebony & Ash",
      canvasBg: "#f9f9f9",
      sidebarBg: "#f9f9f9",
      cardBg: "rgba(255, 255, 255, 0.6)",
      cardBorder: "rgba(38, 38, 38, 0.16)",
      textPrimary: "#171717",
      textSecondary: "#404040",
      textMuted: "#737373",
      primary: "#262626",
      primaryLight: "#f5f5f5",
      accent: "#525252",
      divider: "rgba(0, 0, 0, 0.14)",
      badgeBg: "#f5f5f5",
      badgeText: "#262626",
      tagBg: "rgba(0, 0, 0, 0.05)",
      tagBorder: "rgba(0, 0, 0, 0.2)",
      tagText: "#171717",
      monogramBg: "#262626",
      monogramText: "#ffffff",
      isDark: false,
    },
  };

  const rawTheme = resumeData?.selectedTheme || resumeData?.colorTheme || "teakWood";
  const theme = colorThemes[rawTheme] || colorThemes.teakWood;

  // Density settings
  const density = resumeData?.density || "medium";
  const isCompact = density === "compact";
  const isSpacious = density === "spacious";

  const spacing = useMemo(() => {
    if (isCompact) {
      return {
        padding: "0.26in 0.34in",
        gap: "14px",
        sectionGap: "11px",
        itemGap: "7px",
        bodySize: "8.6pt",
        metaSize: "8pt",
        nameSize: "22pt",
        titleSize: "9.8pt",
        lineHeight: 1.3,
        cardPadding: "7px 9px",
      };
    }
    if (isSpacious) {
      return {
        padding: "0.48in 0.55in",
        gap: "22px",
        sectionGap: "18px",
        itemGap: "12px",
        bodySize: "9.6pt",
        metaSize: "8.8pt",
        nameSize: "28pt",
        titleSize: "11.5pt",
        lineHeight: 1.5,
        cardPadding: "11px 14px",
      };
    }
    // Balanced
    return {
      padding: "0.38in 0.44in",
      gap: "18px",
      sectionGap: "14px",
      itemGap: "9px",
      bodySize: "9pt",
      metaSize: "8.4pt",
      nameSize: "25pt",
      titleSize: "10.5pt",
      lineHeight: 1.38,
      cardPadding: "9px 12px",
    };
  }, [isCompact, isSpacious]);

  const name = resumeData.name || "Creative Designer";

  const contact = resumeData.contact || {};
  const portfolioUrl =
    contact.portfolio ||
    contact.website ||
    resumeData.portfolioUrl ||
    resumeData.website;

  const contactList = [
    portfolioUrl && {
      icon: Globe,
      label: portfolioUrl.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""),
      href: portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`,
      isHighlight: true,
      tag: "PORTFOLIO",
    },
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
    contact.linkedin && {
      icon: Linkedin,
      label: "LinkedIn",
      href: contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`,
    },
    contact.github && {
      icon: Github,
      label: "GitHub",
      href: contact.github.startsWith("http") ? contact.github : `https://${contact.github}`,
    },
  ].filter(Boolean);

  // Section Header with graphic glyph
  const GraphicSectionHeader = ({ title, icon: Icon, tag }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1.5px solid ${theme.primary}`,
        paddingBottom: "4px",
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {Icon && <Icon size={12} style={{ color: theme.primary }} />}
        <h3
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "10pt",
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: theme.textPrimary,
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {tag && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "6.5pt",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.primary,
            backgroundColor: theme.tagBg,
            padding: "1px 5px",
            borderRadius: "3px",
            border: `1px solid ${theme.tagBorder}`,
          }}
        >
          {tag}
        </span>
      )}
    </div>
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="creative-studio-template"
      style={{
        width: "210mm",
        height: "100%",
        boxSizing: "border-box",
        padding: spacing.padding,
        backgroundColor: theme.canvasBg,
        backgroundImage: `url("${WOOD_TEXTURE_DATA_URI}")`,
        backgroundRepeat: "repeat",
        color: theme.textPrimary,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
      }}
    >
      {/* ─── ARCHITECTURAL CORNER CROP MARKS (Classic Graphic Studio Aesthetic) ─── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "10px",
          color: theme.textMuted,
          opacity: 0.45,
          userSelect: "none",
        }}
      >
        +
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "10px",
          color: theme.textMuted,
          opacity: 0.45,
          userSelect: "none",
        }}
      >
        +
      </div>

      {/* ─── BOLD GRAPHIC MASTHEAD BANNER ─── */}
      <header
        style={{
          marginBottom: spacing.sectionGap,
          borderBottom: `2px solid ${theme.textPrimary}`,
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Left: Identity */}
          <div>
            <h1
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: spacing.nameSize,
                  fontWeight: 900,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                  color: theme.textPrimary,
                  margin: "0 0 2px 0",
                }}
              >
                {name}
              </h1>
              {(resumeData.title || resumeData.jobTitle) && (
                <div
                  style={{
                    fontSize: spacing.titleSize,
                    fontFamily: '"Newsreader", "Playfair Display", Georgia, serif',
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: theme.primary,
                    letterSpacing: "0.01em",
                  }}
                >
                  {resumeData.title || resumeData.jobTitle}
                </div>
              )}
            </div>

          {/* Right: Portfolio Spotlight Badge */}
          {portfolioUrl && (
            <a
              href={portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: theme.primary,
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "8.5pt",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }}
            >
              <Globe size={13} strokeWidth={2.5} />
              <span>{portfolioUrl.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}</span>
              <ExternalLink size={11} strokeWidth={2.5} />
            </a>
          )}
        </div>
      </header>

      {/* ─── 2-COLUMN ASYMMETRIC STUDIO GRID ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "33% 67%",
          gap: spacing.gap,
          alignItems: "start",
        }}
      >
        {/* ════════════ LEFT COLUMN: STUDIO SIDEBAR (33%) ════════════ */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing.sectionGap,
          }}
        >
          {/* 1. CONTACT & SOCIALS */}
          <section
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: "8px",
              padding: spacing.cardPadding,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <GraphicSectionHeader title="Contact" icon={Mail} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                fontSize: spacing.metaSize,
              }}
            >
              {contactList.map((cItem, cIdx) => {
                const Icon = cItem.icon;
                return (
                  <div
                    key={cIdx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      wordBreak: "break-word",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        backgroundColor: cItem.isHighlight ? theme.primary : theme.canvasBg,
                        color: cItem.isHighlight ? "#ffffff" : theme.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={10} strokeWidth={2.2} />
                    </div>
                    {cItem.href ? (
                      <a
                        href={cItem.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: cItem.isHighlight ? theme.primary : theme.textPrimary,
                          fontWeight: cItem.isHighlight ? 700 : 500,
                          textDecoration: "none",
                        }}
                      >
                        {cItem.label}
                      </a>
                    ) : (
                      <span style={{ color: theme.textSecondary }}>{cItem.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. CREATIVE TOOLKIT & DISCIPLINES (Skills) */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <section
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: "8px",
                padding: spacing.cardPadding,
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              <GraphicSectionHeader title="Toolkit" icon={Layers} tag="SKILLS" />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {resumeData.skills.map((skillGroup, sIdx) => {
                  const items = Array.isArray(skillGroup.items)
                    ? skillGroup.items
                    : [skillGroup.items];

                  return (
                    <div key={sIdx} style={{ breakInside: "avoid" }}>
                      <div
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: "7pt",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: theme.primary,
                          marginBottom: "3px",
                        }}
                      >
                        {skillGroup.category}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3.5px" }}>
                        {items.map((item, iIdx) => (
                          <span
                            key={iIdx}
                            style={{
                              fontSize: "7.5pt",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: theme.cardBg,
                              color: theme.textPrimary,
                              border: `1px solid ${theme.divider}`,
                              lineHeight: 1.25,
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. EDUCATION */}
          {resumeData.education && resumeData.education.length > 0 && (
            <section
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: "8px",
                padding: spacing.cardPadding,
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              <GraphicSectionHeader title="Education" icon={GraduationCap} />
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {resumeData.education.map((edu, eIdx) => (
                  <div key={eIdx} style={{ breakInside: "avoid" }}>
                    <div
                      style={{
                        fontSize: spacing.bodySize,
                        fontWeight: 700,
                        color: theme.textPrimary,
                        lineHeight: 1.2,
                      }}
                    >
                      {formatEducationDegreeAndField(edu)}
                    </div>
                    <div
                      style={{
                        fontSize: "8pt",
                        color: theme.textSecondary,
                        marginTop: "1px",
                      }}
                    >
                      {edu.institution}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "7pt",
                        fontFamily: '"JetBrains Mono", monospace',
                        color: theme.textMuted,
                        marginTop: "2px",
                      }}
                    >
                      <span>{edu.graduationDate || edu.endDate}</span>
                      {edu.gpa && (
                        <span style={{ color: theme.primary, fontWeight: 700 }}>
                          GPA: {edu.gpa}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. RECOGNITION & HONORS */}
          {resumeData.achievements && resumeData.achievements.length > 0 && (
            <section
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: "8px",
                padding: spacing.cardPadding,
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              <GraphicSectionHeader title="Honors" icon={Award} tag="AWARDS" />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {resumeData.achievements.map((ach, aIdx) => {
                  const text = typeof ach === "string" ? ach : ach.title || ach.description;
                  return (
                    <div
                      key={aIdx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "5px",
                        fontSize: spacing.metaSize,
                        lineHeight: 1.3,
                        color: theme.textSecondary,
                      }}
                    >
                      <Star
                        size={10}
                        style={{ color: theme.primary, flexShrink: 0, marginTop: "2px" }}
                      />
                      <span>{highlightMetrics(text, theme.primary)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>

        {/* ════════════ RIGHT COLUMN: MAIN CANVAS (67%) ════════════ */}
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing.sectionGap,
          }}
        >
          {/* 1. CREATIVE STATEMENT / BIO */}
          {resumeData.summary && (
            <section
              data-section="summary"
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: "8px",
                padding: spacing.cardPadding,
                borderLeft: `4px solid ${theme.primary}`,
                border: `1px solid ${theme.cardBorder}`,
                borderLeftWidth: "4px",
                borderLeftColor: theme.primary,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "7pt",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: theme.primary,
                  marginBottom: "3px",
                }}
              >
                STATEMENT // PHILOSOPHY
              </div>
              <p
                style={{
                  fontFamily: '"Newsreader", "Playfair Display", Georgia, serif',
                  fontSize: "9.5pt",
                  fontStyle: "italic",
                  lineHeight: 1.45,
                  color: theme.textPrimary,
                  margin: 0,
                }}
              >
                “{resumeData.summary}”
              </p>
            </section>
          )}

          {/* 2. SELECTED WORKS / FEATURED CASE STUDIES (Visual Feature Cards) */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <section data-section="projects">
              <GraphicSectionHeader
                title="Featured Works"
                icon={Sparkles}
                tag="CASE STUDIES"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.itemGap }}>
                {resumeData.projects.map((proj, pIdx) => {
                  const hasBullets = proj.bullets && proj.bullets.length > 0;
                  const showDesc =
                    proj.description &&
                    (!hasBullets ||
                      !isDescriptionDuplicatedInBullets(proj.description, proj.bullets));

                  return (
                    <div
                      key={proj.id || pIdx}
                      style={{
                        backgroundColor: theme.cardBg,
                        borderRadius: "8px",
                        padding: spacing.cardPadding,
                        border: `1px solid ${theme.cardBorder}`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        breakInside: "avoid",
                      }}
                    >
                      {/* Project Header Strip */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: spacing.bodySize,
                              fontWeight: 800,
                              color: theme.textPrimary,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {proj.name}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          {(proj.url || proj.link || proj.liveUrl) && (
                            <a
                              href={(proj.url || proj.link || proj.liveUrl).startsWith("http") ? (proj.url || proj.link || proj.liveUrl) : `https://${proj.url || proj.link || proj.liveUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "7.5pt",
                                fontWeight: 700,
                                padding: "1.5px 7px",
                                borderRadius: "4px",
                                backgroundColor: theme.tagBg,
                                color: theme.primary,
                                border: `1px solid ${theme.tagBorder}`,
                                textDecoration: "none",
                              }}
                            >
                              <span>Live Demo</span>
                              <ExternalLink size={9} strokeWidth={2.5} />
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
                                gap: "3px",
                                fontSize: "7.5pt",
                                fontWeight: 700,
                                padding: "1.5px 7px",
                                borderRadius: "4px",
                                backgroundColor: theme.tagBg,
                                color: theme.primary,
                                border: `1px solid ${theme.tagBorder}`,
                                textDecoration: "none",
                              }}
                            >
                              <span>GitHub</span>
                              <Github size={9} strokeWidth={2.5} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Technology / Discipline Tags */}
                      {(() => {
                        const techList = Array.isArray(proj.technologies)
                          ? proj.technologies
                          : typeof proj.technologies === "string"
                          ? proj.technologies
                              .split(/[,•|]/)
                              .map((t) => t.trim())
                              .filter(Boolean)
                          : [];
                        if (techList.length === 0) return null;
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "3.5px",
                              marginBottom: "5px",
                            }}
                          >
                            {techList.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  fontSize: "6.8pt",
                                  fontWeight: 600,
                                  fontFamily: '"JetBrains Mono", monospace',
                                  padding: "1px 5px",
                                  borderRadius: "3px",
                                  backgroundColor: theme.sidebarBg,
                                  color: theme.textSecondary,
                                  border: `1px solid ${theme.divider}`,
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {showDesc && (
                        <p
                          style={{
                            fontSize: spacing.bodySize,
                            lineHeight: spacing.lineHeight,
                            color: theme.textSecondary,
                            margin: "2px 0 4px 0",
                          }}
                        >
                          {highlightMetrics(proj.description, theme.primary)}
                        </p>
                      )}

                      {hasBullets && (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "1.05rem",
                          }}
                        >
                          {proj.bullets
                            .filter((b) => Boolean(b && b.trim()))
                            .map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                style={{
                                  fontSize: spacing.bodySize,
                                  lineHeight: spacing.lineHeight,
                                  color: theme.textSecondary,
                                  marginBottom: "2px",
                                }}
                              >
                                {highlightMetrics(bullet, theme.primary)}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. EXPERIENCE / STUDIO PRACTICE (Timeline Layout) */}
          {resumeData.experience && resumeData.experience.length > 0 && (
            <section data-section="experience">
              <GraphicSectionHeader
                title="Practice"
                icon={Briefcase}
                tag="EXPERIENCE"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.itemGap }}>
                {resumeData.experience.map((exp, eIdx) => {
                  const hasBullets = exp.bullets && exp.bullets.length > 0;
                  const showDesc =
                    exp.description &&
                    (!hasBullets ||
                      !isDescriptionDuplicatedInBullets(exp.description, exp.bullets));

                  return (
                    <div
                      key={exp.id || eIdx}
                      style={{
                        position: "relative",
                        paddingLeft: "14px",
                        borderLeft: `2px solid ${theme.tagBorder}`,
                        breakInside: "avoid",
                      }}
                    >
                      {/* Timeline graphic bullet dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: "-5px",
                          top: "3px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: theme.primary,
                          border: `2px solid ${theme.canvasBg}`,
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: "2px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: spacing.bodySize,
                              fontWeight: 800,
                              color: theme.textPrimary,
                            }}
                          >
                            {exp.position || exp.title}
                          </span>
                          <span style={{ color: theme.textMuted, margin: "0 5px" }}>@</span>
                          <span
                            style={{
                              fontSize: spacing.bodySize,
                              fontStyle: "italic",
                              fontFamily: '"Newsreader", Georgia, serif',
                              color: theme.primary,
                              fontWeight: 700,
                            }}
                          >
                            {exp.company}
                          </span>
                          {exp.location && (
                            <span style={{ fontSize: "7pt", color: theme.textMuted, marginLeft: "5px" }}>
                              ({exp.location})
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "7pt",
                            color: theme.textSecondary,
                            backgroundColor: theme.tagBg,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            border: `1px solid ${theme.tagBorder}`,
                          }}
                        >
                          {exp.startDate} – {exp.endDate || "Present"}
                        </span>
                      </div>

                      {showDesc && (
                        <p
                          style={{
                            fontSize: spacing.bodySize,
                            lineHeight: spacing.lineHeight,
                            color: theme.textSecondary,
                            margin: "2px 0 3px 0",
                          }}
                        >
                          {highlightMetrics(exp.description, theme.primary)}
                        </p>
                      )}

                      {hasBullets && (
                        <ul
                          style={{
                            margin: "2px 0 0 0",
                            paddingLeft: "1.05rem",
                          }}
                        >
                          {exp.bullets
                            .filter((b) => Boolean(b && b.trim()))
                            .map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                style={{
                                  fontSize: spacing.bodySize,
                                  lineHeight: spacing.lineHeight,
                                  color: theme.textSecondary,
                                  marginBottom: "2px",
                                }}
                              >
                                {highlightMetrics(bullet, theme.primary)}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. CERTIFICATIONS & SPECIALIZATIONS */}
          {resumeData.certifications && resumeData.certifications.length > 0 && (
            <section data-section="certifications">
              <GraphicSectionHeader title="Credentials" tag="CERTIFICATIONS" />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {resumeData.certifications.map((cert, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: spacing.bodySize,
                    }}
                  >
                    <span>
                      <strong style={{ color: theme.textPrimary }}>
                        {typeof cert === "string"
                          ? cert
                          : cert.name || cert.title || cert.issuer || "Certification"}
                      </strong>
                      {cert.issuer && (
                        <span style={{ color: theme.textMuted }}> — {cert.issuer}</span>
                      )}
                    </span>
                    {cert.date && (
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: "7pt",
                          color: theme.textMuted,
                        }}
                      >
                        {cert.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. CUSTOM SECTIONS */}
          {resumeData.customSections && resumeData.customSections.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sectionGap }}>
              {resumeData.customSections.map((sec, sIdx) => {
                const items = Array.isArray(sec.items) ? sec.items : [];
                return (
                  <section key={sIdx} data-section={`custom-${sIdx}`}>
                    <GraphicSectionHeader title={sec.title || "Additional Information"} icon={Sparkles} tag="SECTION" />
                    {sec.content && (
                      <p
                        style={{
                          fontSize: spacing.bodySize,
                          lineHeight: spacing.lineHeight,
                          color: theme.textSecondary,
                          margin: "0 0 6px 0",
                        }}
                      >
                        {sec.content}
                      </p>
                    )}
                    {items.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: spacing.itemGap }}>
                        {items.map((rawItem, iIdx) => {
                          const isStructured = rawItem && typeof rawItem === "object";
                          const itemTitle = isStructured ? (rawItem.title || rawItem.name || "") : rawItem;
                          const subtitle = isStructured ? (rawItem.subtitle || rawItem.organization || rawItem.issuer || rawItem.publisher || "") : "";
                          const date = isStructured ? (rawItem.date || "") : "";
                          const link = isStructured ? (rawItem.link || rawItem.url || "") : "";
                          const description = isStructured ? (rawItem.description || "") : "";
                          const bullets = isStructured && Array.isArray(rawItem.bullets) ? rawItem.bullets.filter(Boolean) : [];

                          if (!isStructured || (!subtitle && !date && !link && bullets.length === 0 && !description)) {
                            return (
                              <ul key={iIdx} style={{ margin: 0, paddingLeft: "1.05rem" }}>
                                <li
                                  style={{
                                    fontSize: spacing.bodySize,
                                    lineHeight: spacing.lineHeight,
                                    color: theme.textSecondary,
                                    marginBottom: "2px",
                                  }}
                                >
                                  {typeof itemTitle === "string" ? itemTitle : ""}
                                </li>
                              </ul>
                            );
                          }

                          return (
                            <div key={iIdx} style={{ breakInside: "avoid" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "baseline",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                  marginBottom: "2px",
                                }}
                              >
                                <div>
                                  {itemTitle && (
                                    <span style={{ fontSize: spacing.bodySize, fontWeight: 800, color: theme.textPrimary }}>
                                      {itemTitle}
                                    </span>
                                  )}
                                  {subtitle && (
                                    <span style={{ fontSize: spacing.metaSize, color: theme.primary, fontStyle: "italic", marginLeft: "6px" }}>
                                      · {subtitle}
                                    </span>
                                  )}
                                  {link && (
                                    <a
                                      href={link.startsWith("http") ? link : `https://${link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: "7pt",
                                        color: theme.primary,
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
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontSize: "7pt",
                                      color: theme.textMuted,
                                      backgroundColor: theme.tagBg,
                                      padding: "1px 6px",
                                      borderRadius: "3px",
                                      border: `1px solid ${theme.tagBorder}`,
                                    }}
                                  >
                                    {date}
                                  </span>
                                )}
                              </div>
                              {description && (
                                <p
                                  style={{
                                    fontSize: spacing.bodySize,
                                    lineHeight: spacing.lineHeight,
                                    color: theme.textSecondary,
                                    margin: "2px 0 3px 0",
                                  }}
                                >
                                  {description}
                                </p>
                              )}
                              {bullets.length > 0 && (
                                <ul style={{ margin: "2px 0 0 0", paddingLeft: "1.05rem" }}>
                                  {bullets.map((b, bIdx) => (
                                    <li
                                      key={bIdx}
                                      style={{
                                        fontSize: spacing.bodySize,
                                        lineHeight: spacing.lineHeight,
                                        color: theme.textSecondary,
                                        marginBottom: "2px",
                                      }}
                                    >
                                      {b}
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
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
});

Creative2Template.displayName = "Creative2Template";

export default Creative2Template;

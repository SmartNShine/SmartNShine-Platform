import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useReactToPrint } from "react-to-print";
import { Palette, Type, Check, Maximize2, ZoomIn, ZoomOut, Sparkles } from "lucide-react";
import { useToggle, useMediaQuery } from "@/hooks";
import ClassicTemplate from "@/components/templates/ClassicTemplate";
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalTemplate from "@/components/templates/MinimalTemplate";
import ProfessionalTemplate from "@/components/templates/ProfessionalTemplate";
import ProfessionalV2Template from "@/components/templates/ProfessionalV2Template";
import ExecutiveTemplate from "@/components/templates/ExecutiveTemplate";
import TechTemplate from "@/components/templates/TechTemplate";
import Creative2Template from "@/components/templates/Creative2Template";
import StrategicLeadershipTemplate from "@/components/templates/StrategicLeadershipTemplate";
import ImpactProTemplate from "@/components/templates/ImpactProTemplate";
import GitHubStyleTemplate from "@/components/templates/GitHubStyleTemplate";
import StructuredPhotoTemplate from "@/components/templates/StructuredPhotoTemplate";
import SiliconValleyTemplate from "@/components/templates/SiliconValleyTemplate";
import LatexAcademicTemplate from "@/components/templates/LatexAcademicTemplate";
import NordicSplitTemplate from "@/components/templates/NordicSplitTemplate";
import Professional2Template from "@/components/templates/Professional2Template";
import FullPreviewModal from "./FullPreviewModal";
import ResumeWatermark from "./ResumeWatermark";
import { TEMPLATE_COLOR_THEMES } from "../templateConfig";
import { normalizeQrCode } from "../utils/qrCode";

const PREVIEW_DENSITIES = [
  { id: "compact", label: "Smart 1-Page" },
  { id: "medium", label: "Balanced" },
  { id: "spacious", label: "Spacious" },
];

const PREVIEW_FONTS = [
  { id: "modernSans", label: "Modern Sans" },
  { id: "editorialSerif", label: "Editorial Serif" },
  { id: "techMono", label: "Tech Mono" },
];

// Template page height in px (A4 standard: 297mm @ 96 dpi = 1122.52px -> 1123px)
const PAGE_HEIGHT_PX = 1123;
// Minimum px of content before allowing a page break (avoids near-empty pages)
const MIN_CONTENT_PX = 100;
// Subpixel variance tolerance (avoids false 2nd pages on microscopic rounding differences)
const PAGE_TOLERANCE_PX = 8;
const NOOP = () => {};

const WOOD_TEXTURE_DATA_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='woodGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015 0.32' numOctaves='4' result='noise'/%3E%3CfeColorMatrix type='matrix' values='0.4 0 0 0 0.4 0.3 0 0 0 0.28 0.18 0 0 0 0.16 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23woodGrain)'/%3E%3C/svg%3E";

const CREATIVE2_CANVAS_MAP = {
  teakWood: "#faf6ee",
  archivalPaper: "#faf6ee",
  smokedWalnut: "#1b140f",
  galleryNoir: "#1b140f",
  midnightSlate: "#1b140f",
  nordicBirch: "#f7f6f0",
  nordicSage: "#f7f6f0",
  cyberEmerald: "#f7f6f0",
  rosewoodMahogany: "#fbf5f2",
  studioKlein: "#fbf5f2",
  stripeIndigo: "#fbf5f2",
  charredEbony: "#f9f9f9",
  monochromePro: "#f9f9f9",
};

const FONT_MAP = {
  modernSans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  editorialSerif: '"Newsreader", "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif',
  techMono: '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
};

const ResumePreview = forwardRef(
  (
    {
      resumeData,
      template = "classic",
      onPageUsageChange,
      onDownload,
      onUpdateField,
    },
    ref
  ) => {
    const layoutSettings = resumeData?.layoutSettings || {};
    const printTemplateRef = useRef();
    const templateRef = useRef(); // page-0 template wrapper — used for DOM section measurement
    const [showFullPreview, , setShowFullPreviewTrue, setShowFullPreviewFalse] =
      useToggle(false);
    const isMobile = useMediaQuery("(max-width: 1023px)");
    const [numberOfPages, setNumberOfPages] = useState(1);
    const [measuredHeight, setMeasuredHeight] = useState(1123);
    // pageBreaks[i] = template-coordinate y where page i starts (template px, pre-scale)
    const [pageBreaks, setPageBreaks] = useState([0]);
    const [zoomFactor, setZoomFactor] = useState(0.75);

    const templateThemes = useMemo(() => {
      const list = TEMPLATE_COLOR_THEMES[template] || [];
      if (list.length > 0) {
        return list.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.primary,
          emoji: t.emoji,
        }));
      }
      return [
        { id: "navy", name: "Navy Blue", color: "#1e3a8a" },
        { id: "burgundy", name: "Burgundy", color: "#881337" },
        { id: "forest", name: "Forest Green", color: "#065f46" },
        { id: "charcoal", name: "Charcoal", color: "#374151" },
      ];
    }, [template]);

    const defaultThemeId = templateThemes[0]?.id || "teakWood";
    const [localTheme, setLocalTheme] = useState(
      resumeData?.selectedTheme || resumeData?.colorTheme || defaultThemeId
    );
    const [localDensity, setLocalDensity] = useState(
      resumeData?.density || "medium"
    );
    const [localFont, setLocalFont] = useState(
      resumeData?.fontPairing || "modernSans"
    );

    const activeTheme =
      resumeData?.selectedTheme || resumeData?.colorTheme || localTheme || defaultThemeId;
    const activeDensity = resumeData?.density || localDensity;
    const activeFont = resumeData?.fontPairing || localFont;

    const isCompact = activeDensity === "compact";

    // Intelligent Multi-Stage Micro-Scale:
    // Guarded floor of 0.85 strictly prevents text from becoming tiny or illegible.
    // Margins (0.22in) and section spacing (52%) handle 90% of the vertical space reduction.
    const autoFitScale = useMemo(() => {
      if (!isCompact) return 1.0;
      if (measuredHeight <= PAGE_HEIGHT_PX + PAGE_TOLERANCE_PX) return 1.0;
      return Math.max(0.85, Math.min(1.0, (PAGE_HEIGHT_PX - 8) / measuredHeight));
    }, [isCompact, measuredHeight]);

    const mergedResumeData = useMemo(() => ({
      ...(resumeData || {}),
      qrCode: normalizeQrCode(resumeData?.qrCode),
      selectedTheme: activeTheme,
      colorTheme: activeTheme,
      density: activeDensity,
      fontPairing: activeFont,
    }), [resumeData, activeTheme, activeDensity, activeFont]);

    const handleThemeChange = (themeId) => {
      setLocalTheme(themeId);
      if (resumeData) {
        resumeData.selectedTheme = themeId;
        resumeData.colorTheme = themeId;
      }
      if (onUpdateField) {
        onUpdateField("selectedTheme", themeId);
        onUpdateField("colorTheme", themeId);
      }
    };

    const DENSITY_SPACING_MAP = {
      compact: 52,
      medium: 100,
      spacious: 140,
    };

    const handleDensityChange = (densityId) => {
      setLocalDensity(densityId);
      const spacingVal = DENSITY_SPACING_MAP[densityId] || 100;
      if (resumeData) {
        resumeData.density = densityId;
        if (!resumeData.layoutSettings) resumeData.layoutSettings = {};
        resumeData.layoutSettings.sectionSpacing = spacingVal;
        if (densityId === "compact") {
          resumeData.layoutSettings.fontScale = 100;
          resumeData.layoutSettings.pagePaddingTop = "0.22in";
          resumeData.layoutSettings.pagePaddingBottom = "0.22in";
          resumeData.layoutSettings.pagePadding = "0.35in";
        }
      }
      if (onUpdateField) {
        onUpdateField("density", densityId);
        onUpdateField("layoutSettings", {
          ...(resumeData?.layoutSettings || {}),
          sectionSpacing: spacingVal,
          ...(densityId === "compact"
            ? {
                fontScale: 100,
                pagePaddingTop: "0.22in",
                pagePaddingBottom: "0.22in",
                pagePadding: "0.35in",
              }
            : {}),
        });
      }
    };

    const handleFontChange = (fontId) => {
      setLocalFont(fontId);
      const fontFam = FONT_MAP[fontId] || fontId;
      if (resumeData) {
        resumeData.fontPairing = fontId;
        if (!resumeData.layoutSettings) resumeData.layoutSettings = {};
        resumeData.layoutSettings.fontFamily = fontFam;
      }
      if (onUpdateField) {
        onUpdateField("fontPairing", fontId);
        onUpdateField("layoutSettings", {
          ...(resumeData?.layoutSettings || {}),
          fontFamily: fontFam,
        });
      }
    };

    const handlePageUsageChange = useCallback((usageInfo) => {
      if (!usageInfo || !usageInfo.currentHeight) return;

      setMeasuredHeight((prevHeight) => {
        if (Math.abs(prevHeight - usageInfo.currentHeight) < 2) {
          return prevHeight;
        }
        return usageInfo.currentHeight;
      });

      // When in Smart 1-Page mode with auto micro-scaling, the rendered height is compressed by autoFitScale
      const effectiveScale = isCompact && autoFitScale < 1.0 && (!layoutSettings.fontScale || layoutSettings.fontScale === 100)
        ? autoFitScale
        : Number(layoutSettings.fontScale || 100) / 100;

      const effectiveHeight = usageInfo.currentHeight * effectiveScale;
      const pageLimit = PAGE_HEIGHT_PX;

      const fitsOnOnePage =
        effectiveHeight <= pageLimit + PAGE_TOLERANCE_PX;

      if (fitsOnOnePage) {
        setNumberOfPages((prev) => (prev === 1 ? prev : 1));
        setPageBreaks((prev) => (prev.length === 1 && prev[0] === 0 ? prev : [0]));
      } else {
        const pages = Math.max(
          2,
          Math.ceil(
            (effectiveHeight - PAGE_TOLERANCE_PX) / pageLimit
          )
        );
        setNumberOfPages((prev) => (prev === pages ? prev : pages));
        setPageBreaks((prev) => {
          if (prev.length === pages) return prev;
          return Array.from({ length: pages }, (_, i) => i * pageLimit);
        });
      }
      if (onPageUsageChange) onPageUsageChange(usageInfo);
    }, [isCompact, autoFitScale, layoutSettings.fontScale, onPageUsageChange]);

    // After the template renders, find <section> elements that straddle a page
    // boundary and compute smart break points so no section is split mid-content.
    useEffect(() => {
      if (numberOfPages <= 1) {
        setPageBreaks([0]);
        return;
      }

      // Wait for paint so getBoundingClientRect values are stable
      const tid = setTimeout(() => {
        const el = templateRef.current;
        if (!el) return;

        const scale = isMobile ? 0.38 : 0.65;
        const wrapperTop = el.getBoundingClientRect().top;

        // Collect every <section> in template coords (divide visual offset by scale)
        const sections = Array.from(el.querySelectorAll("section"));
        const sectionRects = sections
          .map((s) => {
            const r = s.getBoundingClientRect();
            // Direct child elements inside section (job/project/education items)
            const itemRects = Array.from(s.querySelectorAll(":scope > div"))
              .map((c) => {
                const cr = c.getBoundingClientRect();
                return {
                  top: (cr.top - wrapperTop) / scale,
                  bottom: (cr.bottom - wrapperTop) / scale,
                };
              })
              .filter((cr) => cr.bottom > cr.top + 5);

            return {
              top: (r.top - wrapperTop) / scale,
              bottom: (r.bottom - wrapperTop) / scale,
              items: itemRects,
            };
          })
          .filter((r) => r.top >= 0 && r.bottom > r.top + 10);

        const breaks = [0];
        let pageStart = 0;

        for (let p = 0; p < numberOfPages - 1; p++) {
          const nominalEnd = pageStart + PAGE_HEIGHT_PX;

          // Any section whose body spans the page boundary?
          const straddling = sectionRects.find(
            (r) => r.top < nominalEnd && r.bottom > nominalEnd
          );

          let chosenBreak = nominalEnd;

          if (straddling) {
            // Case 1: If the section header is near the boundary (within 300px), break cleanly before this section
            if (
              straddling.top >= nominalEnd - 300 &&
              straddling.top > pageStart + MIN_CONTENT_PX
            ) {
              chosenBreak = straddling.top;
            } else if (straddling.items && straddling.items.length > 1) {
              // Case 2: Section spans a large area, look for child items crossing boundary
              const straddlingItem = straddling.items.find(
                (item) => item.top < nominalEnd && item.bottom > nominalEnd
              );
              if (
                straddlingItem &&
                straddlingItem.top > pageStart + MIN_CONTENT_PX
              ) {
                chosenBreak = straddlingItem.top;
              } else {
                // Pick the last item that completely fits before nominalEnd
                const fittingItems = straddling.items.filter(
                  (item) => item.bottom <= nominalEnd && item.top > pageStart
                );
                if (fittingItems.length > 0) {
                  const lastFitting = fittingItems[fittingItems.length - 1];
                  chosenBreak = lastFitting.bottom;
                } else if (straddling.top > pageStart + MIN_CONTENT_PX) {
                  chosenBreak = straddling.top;
                }
              }
            } else if (straddling.top > pageStart + MIN_CONTENT_PX) {
              chosenBreak = straddling.top;
            }
          }

          breaks.push(chosenBreak);
          pageStart = chosenBreak;
        }

        // Guarantee breaks has exactly numberOfPages elements
        while (breaks.length < numberOfPages) {
          breaks.push(pageStart + PAGE_HEIGHT_PX);
          pageStart += PAGE_HEIGHT_PX;
        }

        setPageBreaks(breaks);
      }, 150);

      return () => clearTimeout(tid);
    }, [
      numberOfPages,
      activeTheme,
      activeDensity,
      activeFont,
      resumeData,
      template,
      isMobile,
      measuredHeight,
    ]);

    const templates = {
      classic: ClassicTemplate,
      modern: ModernTemplate,
      minimal: MinimalTemplate,
      professional: ProfessionalTemplate,
      "professional-v2": ProfessionalV2Template,
      "professional-2": Professional2Template,
      professional2: Professional2Template,
      executive: ExecutiveTemplate,
      tech: TechTemplate,
      GitHubStyle: GitHubStyleTemplate,
      "github-style": GitHubStyleTemplate,
      creative2: Creative2Template,
      "creative-2": Creative2Template,
      "strategic-leader": StrategicLeadershipTemplate,
      "strategic-leadership": StrategicLeadershipTemplate,
      "stratergic-leader": StrategicLeadershipTemplate,
      "impact-pro": ImpactProTemplate,
      "structured-photo": StructuredPhotoTemplate,
      "silicon-valley": SiliconValleyTemplate,
      siliconValley: SiliconValleyTemplate,
      "latex-academic": LatexAcademicTemplate,
      latexAcademic: LatexAcademicTemplate,
      "nordic-split": NordicSplitTemplate,
      nordicSplit: NordicSplitTemplate,
    };

    const SelectedTemplate = templates[template] || ClassicTemplate;
    const twoPageMode = numberOfPages > 1;

    const activeFontFamily =
      FONT_MAP[activeFont] ||
      layoutSettings.fontFamily ||
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const userFontScale = Number(layoutSettings.fontScale || 100) / 100;
    // If user has set an explicit custom fontScale (not 100), honor user's explicit preference!
    // Otherwise in 1-Page Fit, gently micro-scale with autoFitScale (capped at 0.92 floor)
    const finalScale = isCompact && autoFitScale < 1.0 && (!layoutSettings.fontScale || layoutSettings.fontScale === 100)
      ? autoFitScale.toFixed(3)
      : String(userFontScale);

    // Margins adapt to density: ultra-efficient in 1-Page Fit (0.22in top/bottom, 0.35in side)
    const defaultTopPad = isCompact
      ? "0.22in"
      : activeDensity === "spacious"
        ? "0.50in"
        : "0.35in";
    const defaultSidePad = isCompact
      ? "0.35in"
      : activeDensity === "spacious"
        ? "0.50in"
        : "0.44in";
    const defaultBottomPad = isCompact
      ? "0.22in"
      : activeDensity === "spacious"
        ? "0.50in"
        : "0.35in";

    const densityMultiplier =
      isCompact ? 0.52 : activeDensity === "spacious" ? 1.4 : 1.0;
    const effectiveSpacing = String(
      layoutSettings.sectionSpacing != null && layoutSettings.sectionSpacing !== ""
        ? Number(layoutSettings.sectionSpacing) / 100
        : densityMultiplier
    );

    const activeThemeColor =
      templateThemes.find((t) => t.id === activeTheme)?.color ||
      templateThemes[0]?.color ||
      "#4f46e5";

    const layoutStyle = {
      "--resume-layout-top": layoutSettings.pagePaddingTop || defaultTopPad,
      "--resume-layout-side": layoutSettings.pagePadding || defaultSidePad,
      "--resume-layout-bottom": layoutSettings.pagePaddingBottom || defaultBottomPad,
      "--resume-layout-scale": finalScale,
      "--resume-layout-spacing": effectiveSpacing,
      "--resume-layout-font-family": activeFontFamily,
      "--resume-layout-bullet-color": activeThemeColor,
    };

    const handlePrint = useReactToPrint({
      contentRef: printTemplateRef,
      documentTitle: `${resumeData?.name || "Resume"}_Resume`,
      pageStyle: `
        @page { size: A4 portrait; margin: 0; }
        @media print {
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          .resume-layout-shell {
            width: 210mm !important;
            min-height: auto !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .resume-layout-shell > * {
            min-height: auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `,
    });

    const handleMobilePrint = useCallback(async ({ targetWindow } = {}) => {
      const printNode = printTemplateRef.current;
      if (!printNode) {
        handlePrint();
        return;
      }

      const printWindow = targetWindow || window.open("", "_blank");
      if (printWindow) {
        const documentTitle = `${resumeData?.name || "Resume"}_Resume`;
        const styleMarkup = Array.from(
          document.querySelectorAll('style, link[rel="stylesheet"]')
        )
          .map((node) => node.outerHTML)
          .join("\n");

        printWindow.document.open();
        printWindow.document.write(`
          <!doctype html>
          <html>
            <head>
              <title>${documentTitle}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              ${styleMarkup}
              <style>
                @page { size: A4 portrait; margin: 0; }
                *, *::before, *::after {
                  box-sizing: border-box !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 210mm !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                  overflow: visible !important;
                }
                body {
                  display: block;
                }
                .resume-preview,
                .resume-layout-shell {
                  width: 210mm !important;
                  min-height: auto !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  box-shadow: none !important;
                  border: none !important;
                  margin: 0 auto !important;
                }
                .resume-layout-shell > * {
                  min-height: auto !important;
                }
                .no-print {
                  display: none !important;
                }
              </style>
            </head>
            <body>
              ${printNode.cloneNode(true).outerHTML}
              <script>
                window.addEventListener("load", function () {
                  setTimeout(function () {
                    window.focus();
                    window.print();
                  }, 250);
                });
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }

      const existingPrintRoot = document.getElementById(
        "mobile-resume-print-root"
      );
      if (existingPrintRoot) existingPrintRoot.remove();

      const printRoot = document.createElement("div");
      printRoot.id = "mobile-resume-print-root";
      printRoot.appendChild(printNode.cloneNode(true));

      document.body.appendChild(printRoot);
      document.body.classList.add("printing-resume-template");

      const cleanup = () => {
        document.body.classList.remove("printing-resume-template");
        printRoot.remove();
        window.removeEventListener("afterprint", cleanup);
      };

      window.addEventListener("afterprint", cleanup);

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      window.print();
      window.setTimeout(cleanup, 10000);
    }, [handlePrint, resumeData?.name]);

    const downloadPDF = useCallback((options) => {
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobileDevice) {
        handleMobilePrint(options);
        return;
      }

      handlePrint();
    }, [handleMobilePrint, handlePrint]);

    useImperativeHandle(ref, () => ({
      downloadPDF,
    }), [downloadPDF]);

    if (!resumeData) return null;

    const scaleFactor = isMobile ? 0.38 : zoomFactor;
    const scaledPageHeightPx = Math.ceil(PAGE_HEIGHT_PX * scaleFactor);
    const scaledWidthMm = `${(210 * scaleFactor).toFixed(2)}mm`;

    return (
      <>
        <div className="flex min-w-0 max-w-full flex-col resume-preview items-center w-full min-h-0">
          {/* Sleek Professional Studio Toolbar */}
          <div
            className="mb-2.5 flex flex-wrap items-center justify-between gap-2 no-print w-full sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md py-1.5 px-2 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-xs"
            style={{ width: "100%", maxWidth: "100%" }}
          >
            {/* Left: Styling Controls (Palette, Density, Font) */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {/* Color Themes */}
              <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200 dark:border-zinc-800 shrink-0">
                <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-gray-400" />
                  <span className="hidden md:inline">Theme</span>
                </span>
                <div className="flex items-center gap-1">
                  {templateThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      title={`Theme: ${t.name}`}
                      type="button"
                      className={`relative flex h-4.5 w-4.5 items-center justify-center rounded-full transition-all duration-150 cursor-pointer ${
                        activeTheme === t.id
                          ? "ring-2 ring-blue-500 ring-offset-1 scale-110 shadow-xs"
                          : "opacity-75 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: t.color }}
                    >
                      {activeTheme === t.id && (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density / Spacing Toggle (Segmented Mini Pills) */}
              <div className="flex items-center bg-gray-100/90 dark:bg-zinc-900 p-0.5 rounded-lg border border-gray-200/60 dark:border-zinc-800/80 shrink-0">
                {PREVIEW_DENSITIES.map((d) => {
                  const isSelected = activeDensity === d.id;
                  const isOnePage = d.id === "compact";
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDensityChange(d.id)}
                      type="button"
                      title={
                        isOnePage
                          ? "Smart 1-Page: Automatically fit resume cleanly onto 1 page"
                          : d.id === "spacious"
                          ? "Spacious: Relaxed spacing for shorter resumes"
                          : "Balanced: Standard ATS-friendly spacing"
                      }
                      className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? isOnePage
                            ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-600 dark:text-white"
                            : "bg-white text-gray-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      {isOnePage && <Sparkles className="w-2.5 h-2.5" />}
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Font Dropdown */}
              <div className="flex items-center gap-1 shrink-0">
                <Type className="w-3 h-3 text-gray-400" />
                <select
                  value={activeFont}
                  onChange={(e) => handleFontChange(e.target.value)}
                  title="Font typography style"
                  className="rounded-lg border border-gray-200/80 bg-gray-50/80 px-2 py-0.5 text-[10.5px] font-medium text-gray-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {PREVIEW_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Page Count, Zoom, Fullscreen */}
            <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto">
              {/* Page Status Indicator */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-100/70 dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800 text-[10.5px] font-medium"
                title={
                  numberOfPages === 1
                    ? "Ideal 1-Page ATS length"
                    : `${numberOfPages} pages. Click 'Fit 1P' to auto-fit to 1 page.`
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    numberOfPages === 1 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="text-gray-600 dark:text-gray-300 font-semibold">
                  {numberOfPages} {numberOfPages === 1 ? "Page" : "Pages"}
                </span>
                {numberOfPages > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDensityChange("compact")}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] font-bold ml-0.5 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded"
                    title="Automatically fit into 1 page"
                  >
                    Fit 1P
                  </button>
                )}
              </div>

              {/* Zoom Controls (Desktop) */}
              {!isMobile && (
                <div className="hidden sm:inline-flex items-center rounded-lg border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-1 py-0.5 text-xs shadow-xs gap-0.5">
                  <button
                    onClick={() =>
                      setZoomFactor((z) =>
                        Math.max(0.4, Number((z - 0.05).toFixed(2)))
                      )
                    }
                    type="button"
                    title="Zoom out"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-gray-300 cursor-pointer transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomFactor(0.75)}
                    type="button"
                    title="Reset zoom (75%)"
                    className="px-1.5 py-0.5 font-semibold text-[11px] text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {Math.round(zoomFactor * 100)}%
                  </button>
                  <button
                    onClick={() =>
                      setZoomFactor((z) =>
                        Math.min(1.1, Number((z + 0.05).toFixed(2)))
                      )
                    }
                    type="button"
                    title="Zoom in"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-gray-300 cursor-pointer transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Fullscreen Button */}
              <button
                onClick={setShowFullPreviewTrue}
                title="Fullscreen Preview Modal"
                type="button"
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-gray-300 dark:hover:bg-zinc-900 cursor-pointer shadow-xs transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Full document view (Entire screen scrollable) */}
          <div
            className="min-w-0 max-w-full rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 overflow-x-auto overflow-y-visible w-full flex flex-col items-center"
            style={{
              padding: isMobile ? "0.75rem 0.5rem 3rem" : "1rem 1rem 5rem",
            }}
          >
            {/* Pages stack */}
            <div
              className="flex flex-col items-center relative z-10"
              style={{ gap: isMobile ? "10px" : "18px" }}
              onClick={isMobile ? setShowFullPreviewTrue : undefined}
            >
              {pageBreaks.map((pageStart, pageIndex) => {
                const nextBreak = pageBreaks[pageIndex + 1];

                // How many template-px of content this page card should show.
                // For non-last pages: exactly up to the next break point (section boundary).
                // For the last page: a full page height (template's own background fills rest).
                const visibleTemplatePx =
                  nextBreak !== undefined
                    ? nextBreak - pageStart // precise clip at section boundary
                    : PAGE_HEIGHT_PX; // last page — show full page height

                const isCreative2 = template === "creative2";
                const creative2CanvasBg = isCreative2
                  ? (CREATIVE2_CANVAS_MAP[activeTheme] || "#faf6ee")
                  : null;

                return (
                  <div
                    key={pageIndex}
                    style={{
                      width: scaledWidthMm,
                      height: `${scaledPageHeightPx}px`,
                      position: "relative",
                      flexShrink: 0,
                      backgroundColor: creative2CanvasBg || undefined,
                      backgroundImage: isCreative2 ? `url("${WOOD_TEXTURE_DATA_URI}")` : undefined,
                      backgroundRepeat: "repeat",
                    }}
                    className={`${isCreative2 ? "" : "bg-white dark:bg-gray-50"} shadow-[0_12px_36px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/10 dark:ring-white/10 rounded-sm overflow-hidden ${isMobile ? "cursor-pointer" : ""
                      }`}
                  >
                    {/* Anti-AI 3-tier SmartNShine security watermark overlay */}
                    <ResumeWatermark isMobile={isMobile} />

                    {/*
                      Inner clip div: height = visibleTemplatePx * scale.
                      overflow:hidden provides a hard pixel-perfect cut at the
                      section boundary — no floating-point overlay tricks needed.
                      The outer page card fills the remaining space with seamless template background.
                    */}
                    <div
                      style={{
                        height: `${visibleTemplatePx * scaleFactor}px`,
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: creative2CanvasBg || undefined,
                      }}
                    >
                      <div
                        ref={pageIndex === 0 ? templateRef : undefined}
                        className={isCreative2 ? "" : "bg-white dark:bg-gray-50"}
                        style={{
                          width: "210mm",
                          minHeight: "297mm",
                          height: "auto",
                          backgroundColor: creative2CanvasBg || undefined,
                          transform: `scale(${scaleFactor})`,
                          transformOrigin: "top left",
                          position: "absolute",
                          top: `-${pageStart * scaleFactor}px`,
                          left: 0,
                        }}
                      >
                        <div
                          style={{
                            pageBreakAfter: twoPageMode ? "auto" : "avoid",
                            pageBreakInside: twoPageMode ? "auto" : "avoid",
                          }}
                        >
                          <div className="resume-layout-shell" style={layoutStyle} data-contact={layoutSettings.contactLayout || "center-inline"} data-density={activeDensity}>
                            <SelectedTemplate
                              resumeData={mergedResumeData}
                              twoPageMode={twoPageMode}
                              onPageUsageChange={
                                pageIndex === 0
                                  ? handlePageUsageChange
                                  : NOOP
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Page number badge */}
                    {numberOfPages > 1 && (
                      <div className="absolute bottom-2 right-2 no-print pointer-events-none z-10">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/70 dark:bg-gray-100/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-300">
                          {pageIndex + 1} / {numberOfPages}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full Preview Modal — renders at natural A4 size with SmartNShine watermark */}
        <FullPreviewModal
          isOpen={showFullPreview}
          onClose={setShowFullPreviewFalse}
          title={resumeData?.name ? `${resumeData.name} — Resume Preview` : "Resume Full Preview"}
          onDownload={handlePrint}
        >
          <div
            className="bg-white dark:bg-gray-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)] rounded-sm border border-black/10 dark:border-white/10 relative overflow-hidden"
            style={{ width: "210mm", minHeight: "297mm", height: "auto" }}
          >
            {/* Anti-AI 3-tier SmartNShine security watermark overlay */}
            <ResumeWatermark isMobile={isMobile} />

            <div className="resume-layout-shell relative z-10" style={layoutStyle} data-contact={layoutSettings.contactLayout || "center-inline"} data-density={activeDensity}>
              <SelectedTemplate
                resumeData={mergedResumeData}
                twoPageMode={twoPageMode}
                onPageUsageChange={handlePageUsageChange}
              />
            </div>
          </div>
        </FullPreviewModal>

        {/* Dedicated print source: natural-size template without preview scaling/pagination wrappers */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-200vw",
            top: 0,
            width: "210mm",
            background: "#ffffff",
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <div ref={printTemplateRef} className="resume-layout-shell" style={layoutStyle} data-contact={layoutSettings.contactLayout || "center-inline"} data-density={activeDensity}>
            <SelectedTemplate
              resumeData={mergedResumeData}
              twoPageMode={false}
              printMode={template === "professional-v2"}
              onPageUsageChange={NOOP}
            />
          </div>
        </div>
      </>
    );
  }
);

export default ResumePreview;

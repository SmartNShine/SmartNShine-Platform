/** A4 page height at 96dpi (297mm). */
export const RESUME_PAGE_HEIGHT_PX = 1123;

export const LAYOUT_FONT_MAP = {
  modernSans:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  editorialSerif:
    '"Newsreader", "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif',
  techMono:
    '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
};

export const DENSITY_LAYOUT_PRESETS = {
  compact: {
    sectionSpacing: 52,
    pagePaddingTop: "0.22in",
    pagePaddingBottom: "0.22in",
    pagePadding: "0.35in",
    fontScale: 100,
  },
  medium: {
    sectionSpacing: 100,
    pagePaddingTop: "0.35in",
    pagePaddingBottom: "0.35in",
    pagePadding: "0.44in",
  },
  spacious: {
    sectionSpacing: 140,
    pagePaddingTop: "0.50in",
    pagePaddingBottom: "0.50in",
    pagePadding: "0.50in",
  },
};

export function normalizeFontScale(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(150, Math.max(50, parsed));
}

export function isDefaultFontScale(value) {
  return normalizeFontScale(value) === 100;
}

export function normalizeSectionSpacing(value, density = "medium") {
  if (value !== null && value !== undefined && value !== "") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.min(200, Math.max(0, parsed));
    }
  }
  return DENSITY_LAYOUT_PRESETS[density]?.sectionSpacing ?? 100;
}

export function parseInchesToPx(value) {
  if (value === undefined || value === null || value === "") return 0;
  const match = String(value).trim().match(/^([\d.]+)\s*in$/i);
  if (match) return Number.parseFloat(match[1]) * 96;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed * 96 : 0;
}

export function resolveLayoutMargins(layoutSettings = {}, density = "medium") {
  const preset = DENSITY_LAYOUT_PRESETS[density] || DENSITY_LAYOUT_PRESETS.medium;
  const settings = layoutSettings || {};
  return {
    top: settings.pagePaddingTop || preset.pagePaddingTop,
    side: settings.pagePadding || preset.pagePadding,
    bottom: settings.pagePaddingBottom || preset.pagePaddingBottom,
  };
}

export function getContentAreaHeightPx(layoutSettings = {}, density = "medium") {
  const { top, bottom } = resolveLayoutMargins(layoutSettings, density);
  const verticalMargins = parseInchesToPx(top) + parseInchesToPx(bottom);
  return Math.max(RESUME_PAGE_HEIGHT_PX - verticalMargins, RESUME_PAGE_HEIGHT_PX * 0.5);
}

export function mergeDensityLayoutSettings(densityId, currentSettings = {}) {
  const preset = DENSITY_LAYOUT_PRESETS[densityId] || DENSITY_LAYOUT_PRESETS.medium;
  return {
    ...currentSettings,
    sectionSpacing: preset.sectionSpacing,
    pagePaddingTop: preset.pagePaddingTop,
    pagePaddingBottom: preset.pagePaddingBottom,
    pagePadding: preset.pagePadding,
    ...(preset.fontScale != null ? { fontScale: preset.fontScale } : {}),
  };
}

export function getLayoutMeasureKey(layoutSettings = {}, density = "medium") {
  const settings = layoutSettings || {};
  return [
    density,
    normalizeFontScale(settings.fontScale),
    normalizeSectionSpacing(settings.sectionSpacing, density),
    settings.pagePadding ?? "",
    settings.pagePaddingTop ?? "",
    settings.pagePaddingBottom ?? "",
    settings.contactLayout ?? "",
  ].join("|");
}

/**
 * Reads content metrics from the live preview DOM (unscaled scrollHeight + CSS zoom).
 */
export function getResumeContentMetrics(templateWrapperEl) {
  if (!templateWrapperEl) return null;
  const shell = templateWrapperEl.querySelector(".resume-layout-shell");
  const inner = shell?.firstElementChild;
  if (!inner) return null;

  const zoomParsed = Number.parseFloat(getComputedStyle(inner).zoom || "1");
  const zoom = Number.isFinite(zoomParsed) && zoomParsed > 0 ? zoomParsed : 1;
  const scrollHeight = inner.scrollHeight;
  return {
    scrollHeight,
    zoom,
    visualHeight: scrollHeight * zoom,
  };
}

export function resolveEffectiveLayoutScale({
  scrollHeight,
  contentAreaHeightPx,
  density = "medium",
  fontScale,
  pageTolerancePx = 8,
}) {
  const normalizedScale = normalizeFontScale(fontScale) / 100;
  const isCompact = density === "compact";

  if (!isCompact || !isDefaultFontScale(fontScale)) {
    return {
      effectiveScale: normalizedScale,
      autoFitScale: 1,
      useAutoFit: false,
    };
  }

  if (!scrollHeight || scrollHeight <= contentAreaHeightPx + pageTolerancePx) {
    return {
      effectiveScale: 1,
      autoFitScale: 1,
      useAutoFit: false,
    };
  }

  const autoFitScale = Math.max(
    0.85,
    Math.min(1, (contentAreaHeightPx - pageTolerancePx) / scrollHeight)
  );

  return {
    effectiveScale: autoFitScale,
    autoFitScale,
    useAutoFit: autoFitScale < 1,
  };
}

export function buildResumeLayoutCssVars({
  layoutSettings = {},
  density = "medium",
  fontPairing = "modernSans",
  fontMap = LAYOUT_FONT_MAP,
  themeColor = "#4f46e5",
}) {
  const margins = resolveLayoutMargins(layoutSettings, density);
  const fontScale = normalizeFontScale(layoutSettings.fontScale);
  const sectionSpacing = normalizeSectionSpacing(
    layoutSettings.sectionSpacing,
    density
  );
  const activeFontFamily =
    fontMap[fontPairing] ||
    layoutSettings.fontFamily ||
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return {
    "--resume-layout-top": margins.top,
    "--resume-layout-side": margins.side,
    "--resume-layout-bottom": margins.bottom,
    "--resume-layout-scale": String(fontScale / 100),
    "--resume-layout-spacing": String(sectionSpacing / 100),
    "--resume-layout-font-family": activeFontFamily,
    "--resume-layout-bullet-color": themeColor,
    fontScaleRatio: fontScale / 100,
    isDefaultFontScale: fontScale === 100,
  };
}
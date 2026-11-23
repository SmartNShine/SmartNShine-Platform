import { useId, useState } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  Sliders,
  Type,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LAYOUT_DEFAULTS } from "../constants/editorConstants";
import { TEMPLATE_COLOR_THEMES } from "../templateConfig";
import { mergeDensityLayoutSettings } from "../utils/resumeLayoutUtils";
import "./ResumeLayoutControls.css";

const PREVIEW_DENSITIES = [
  { id: "compact", label: "Smart 1-Page" },
  { id: "medium", label: "Balanced" },
  { id: "spacious", label: "Spacious" },
];

const PREVIEW_FONTS = [
  {
    id: "modernSans",
    label: "Modern Sans (Inter)",
    font: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: "editorialSerif",
    label: "Editorial Serif (Newsreader)",
    font: '"Newsreader", "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif',
  },
  {
    id: "techMono",
    label: "Tech Mono (JetBrains Mono)",
    font: '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
];

const FONT_MAP = {
  modernSans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  editorialSerif: '"Newsreader", "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif',
  techMono: '"JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
};

const controlCardClass = "min-w-0 rounded-lg border border-slate-200/90 bg-slate-50/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60";

function LayoutSlider({ label, min, max, step, unit, value, onChange }) {
  const id = useId();
  const [numberDraft, setNumberDraft] = useState(null);
  const unitName = unit === "%" ? "percent" : "inches";
  const progress = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={controlCardClass}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
          {label}
        </label>
        <div className="flex h-6 shrink-0 items-center rounded-md border border-slate-200 bg-white pl-1 pr-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-blue-400">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={numberDraft ?? value}
            aria-label={`${label} (${unitName})`}
            className="resume-layout-slider-value w-9 bg-transparent text-center text-xs font-semibold tabular-nums text-slate-900 outline-none dark:text-zinc-100"
            onChange={(event) => {
              const { value: nextValue, valueAsNumber } = event.currentTarget;
              setNumberDraft(nextValue);
              if (valueAsNumber >= min && valueAsNumber <= max) onChange(nextValue);
            }}
            onBlur={(event) => {
              const { value: nextValue, valueAsNumber } = event.currentTarget;
              if (valueAsNumber < min || valueAsNumber > max) onChange(nextValue);
              setNumberDraft(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
          <span className="min-w-3 text-center text-[10px] font-medium text-slate-500 dark:text-zinc-400" aria-hidden="true">
            {unit}
          </span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value} ${unitName}`}
        className="resume-layout-slider"
        style={{ "--slider-progress": `${progress}%` }}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

const ResumeLayoutControls = ({ resumeData = {}, template = "classic", updateField, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advancedId = useId();
  const settings = { ...LAYOUT_DEFAULTS, ...(resumeData.layoutSettings || {}) };

  const activeDensity = resumeData.density || "medium";
  const activeFont = resumeData.fontPairing || "modernSans";

  const availableThemes = TEMPLATE_COLOR_THEMES[template] || [];
  const activeColorThemeId = resumeData?.colorTheme || resumeData?.selectedTheme || availableThemes[0]?.id;
  const activeColorThemeObj = availableThemes.find((t) => t.id === activeColorThemeId) || availableThemes[0];

  const handleColorThemeChange = (themeId) => {
    if (updateField) {
      updateField("colorTheme", themeId);
      updateField("selectedTheme", themeId);
    }
  };

  const update = (field, value) => {
    const updated = { ...settings, [field]: value };
    if (onChange) onChange(updated);
    if (updateField) updateField("layoutSettings", updated);
  };

  const resetLayout = () => {
    if (onChange) onChange({ ...LAYOUT_DEFAULTS });
    if (updateField) {
      updateField("layoutSettings", { ...LAYOUT_DEFAULTS });
      updateField("density", "medium");
      updateField("fontPairing", "modernSans");
    }
  };

  const handleDensityChange = (densityId) => {
    const merged = mergeDensityLayoutSettings(densityId, settings);
    if (onChange) onChange(merged);
    if (updateField) {
      updateField("density", densityId);
      updateField("layoutSettings", merged);
    }
  };

  const handleFontChange = (fontId) => {
    const fontFam = FONT_MAP[fontId] || fontId;
    if (updateField) {
      updateField("fontPairing", fontId);
    }
    update("fontFamily", fontFam);
  };

  const marginValue = (value) => {
    if (value === undefined || value === null || value === "") return 0.35;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0.35;
  };

  const updateMargin = (field, value) => {
    const num = Number.parseFloat(value);
    const clamped = Number.isFinite(num)
      ? Math.min(1.2, Math.max(0, num))
      : 0.35;
    update(field, `${clamped.toFixed(2)}in`);
  };

  const updateTextSize = (value) => {
    const num = Number.parseInt(value, 10);
    const clamped = Number.isFinite(num)
      ? Math.min(150, Math.max(50, num))
      : 100;
    update("fontScale", clamped);
  };

  const updateSectionSpacing = (value) => {
    const num = Number.parseInt(value, 10);
    const clamped = Number.isFinite(num)
      ? Math.min(200, Math.max(0, num))
      : 100;
    update("sectionSpacing", clamped);
  };

  const contactOptions = [
    ["left-inline", "Left aligned"],
    ["center-inline", "Centered inline"],
    ["center-stacked", "Centered stacked"],
  ];

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white p-3 sm:p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-1.5 text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              Resume Styling & Layout
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              Fine-tune colors, margins, spacing & density
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetLayout}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200 dark:border-zinc-700 px-2 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* 0. Color Theme & Palette */}
      {availableThemes.length > 0 && (
        <div className="mt-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-gray-400" />
              Color Theme &amp; Palette
            </label>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {activeColorThemeObj?.name || ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100/90 dark:bg-zinc-900 rounded-lg border border-gray-200/60 dark:border-zinc-800/80">
            {availableThemes.map((t) => {
              const isSelected = activeColorThemeId === t.id;
              const themeBg = t.primary || t.color;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleColorThemeChange(t.id)}
                  title={`${t.name} (${themeBg})`}
                  className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-xs"
                      : "opacity-75 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{ backgroundColor: themeBg }}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-white drop-shadow-xs" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Page Density & 1-Page Fit */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            Page Density & Fit
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-gray-100/90 dark:bg-zinc-900 p-1 rounded-lg border border-gray-200/60 dark:border-zinc-800/80">
          {PREVIEW_DENSITIES.map((d) => {
            const isSelected = activeDensity === d.id;
            const isOnePage = d.id === "compact";
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDensityChange(d.id)}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? isOnePage
                      ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-600 dark:text-white"
                      : "bg-white text-gray-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Font Pairing - Matched 1:1 with Preview Toolbar */}
      <div className="mt-3.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
          <Type className="w-3.5 h-3.5 text-gray-400" />
          Font Pairing
        </label>
        <select
          value={activeFont}
          onChange={(e) => handleFontChange(e.target.value)}
          className="h-8 w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white px-2.5 text-xs font-medium text-gray-900 outline-none transition focus:border-blue-500 dark:bg-zinc-900 dark:text-gray-100 cursor-pointer"
        >
          {PREVIEW_FONTS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Advanced Fine-Tuning Toggle */}
      <div className="mt-3.5 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls={showAdvanced ? advancedId : undefined}
          className="flex w-full cursor-pointer items-center justify-between rounded-md py-1 text-xs font-semibold text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span>Fine-tune margins & spacing</span>
          {showAdvanced ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>

        {showAdvanced && (
          <div id={advancedId} className="resume-layout-slider-grid mt-2 grid gap-2">
            <LayoutSlider
              label="Text size"
              min={50}
              max={150}
              step={1}
              unit="%"
              value={settings.fontScale ?? 100}
              onChange={updateTextSize}
            />
            <LayoutSlider
              label="Section spacing"
              min={0}
              max={200}
              step={1}
              unit="%"
              value={settings.sectionSpacing ?? 100}
              onChange={updateSectionSpacing}
            />

            {[
              ["pagePadding", "Side margins"],
              ["pagePaddingTop", "Top margin"],
              ["pagePaddingBottom", "Bottom margin"],
            ].map(([field, label]) => (
              <LayoutSlider
                key={field}
                label={label}
                min={0}
                max={1.2}
                step={0.01}
                unit="in"
                value={marginValue(settings[field])}
                onChange={(value) => updateMargin(field, value)}
              />
            ))}

            <label className={`${controlCardClass} block text-xs font-semibold text-slate-700 dark:text-zinc-200`}>
              Contact alignment
              <select
                value={settings.contactLayout || "left-inline"}
                onChange={(e) => update("contactLayout", e.target.value)}
                className="mt-1 h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-blue-400"
              >
                {contactOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeLayoutControls;

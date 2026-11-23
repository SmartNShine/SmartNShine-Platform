import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  LayoutTemplate,
  Palette,
  Save,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  Check,
} from "lucide-react";
import { DarkModeToggle } from "@/components/common";
import Logo from "@/components/common/Logo";

export default function EditorHeader({
  onGoBack,
  hasUnsavedChanges,
  saving,
  autoSaving,
  onResetOrder,
  onShowTemplateSelector,
  availableColorThemes = [],
  activeColorTheme,
  onSelectColorTheme,
  onSave,
  onExport,
  isExportLocked,
  showPreview,
  onTogglePreview,
}) {
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const colorDropdownRef = useRef(null);

  // Close color dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-40 w-full max-w-full shrink-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.08] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 transition-all no-print">
      {/* Left branding & back */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="h-4 sm:h-5 w-[1px] bg-gray-200 dark:bg-white/10 hidden xs:block" />

        <Link to="/dashboard" className="flex items-center gap-2 group">
          <Logo
            className="h-7 w-7 object-contain group-hover:scale-105 transition-transform duration-200 shrink-0"
            alt="SmartNShine Logo"
          />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950 dark:text-white hidden md:inline">
            SmartNShine
          </span>
          <span className="text-gray-300 dark:text-zinc-700 text-xs hidden md:inline">/</span>
          <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2 sm:px-2.5 py-0.5 rounded-lg whitespace-nowrap">
            Resume Studio
          </span>
        </Link>

        {/* Unsaved / Auto-saving badge (Desktop only) */}
        {hasUnsavedChanges && !saving && !autoSaving && (
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            ● Unsaved Changes
          </span>
        )}
        {(saving || autoSaving) && (
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </span>
        )}
      </div>

      {/* Right controls toolbar */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2 shrink-0">
        <DarkModeToggle />

        {/* Reset Order Button (Desktop only) */}
        <button
          onClick={onResetOrder}
          className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-xs font-semibold hover:border-orange-500 hover:text-orange-600 transition-all cursor-pointer"
          title="Reset section order to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Order</span>
        </button>

        {/* Template Selector Button */}
        <button
          onClick={onShowTemplateSelector}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
          title="Change template design"
          aria-label="Change resume template"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Templates</span>
        </button>

        {/* Color Theme Selector Dropdown */}
        {availableColorThemes.length > 0 && (
          <div ref={colorDropdownRef} className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
              title="Change resume color palette"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-2xs"
                style={{ backgroundColor: activeColorTheme?.primary || activeColorTheme?.color || "#2563eb" }}
              />
              <span className="hidden md:inline max-w-[100px] truncate">
                {activeColorTheme?.name || "Color"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 dark:text-zinc-400" />
            </button>

            {showColorDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                  Color Themes
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                  {availableColorThemes.map((theme) => {
                    const themeColor = theme.primary || theme.color;
                    const isSelected = activeColorTheme?.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          if (onSelectColorTheme) onSelectColorTheme(theme.id);
                          setShowColorDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold"
                            : "text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-2xs"
                            style={{ backgroundColor: themeColor }}
                          />
                          <span className="truncate">{theme.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Preview Toggle (Desktop only — mobile has MobileActionBar) */}
        <button
          onClick={onTogglePreview}
          className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
            showPreview
              ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300"
          }`}
          title={showPreview ? "Hide Live Preview" : "Show Live Preview"}
        >
          {showPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showPreview ? "Preview On" : "Preview Off"}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving || autoSaving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-900 bg-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:focus:ring-offset-zinc-950 sm:text-sm"
        >
          {saving || autoSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
        </button>

        {/* Export PDF Button (Desktop only — mobile has MobileActionBar) */}
        <button
          onClick={onExport}
          disabled={isExportLocked}
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-700 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus:ring-offset-zinc-950 sm:text-sm"
          title="Download PDF resume"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </div>
    </header>
  );
}

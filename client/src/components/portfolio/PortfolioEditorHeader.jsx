import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Save,
  Globe2,
  Send,
  RefreshCw,
  LayoutTemplate,
} from "lucide-react";
import { DarkModeToggle } from "@/components/common";
import Logo from "@/components/common/Logo";

export default function PortfolioEditorHeader({
  onGoBack,
  hasUnsavedChanges,
  saving,
  onSave,
  onPreview,
  onShowTemplateSelector,
  onSyncResume,
  syncingResume,
  onPublishToggle,
  isPublished,
  canPublish = true,
  publicUrl,
  slug,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.08] px-2.5 xs:px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between transition-all">
      {/* Left branding & back */}
      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0 min-w-0">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-1.5 p-1.5 xs:p-2 sm:px-3 sm:py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
          title="Back to portfolios"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Portfolios</span>
        </button>

        <div className="h-4 sm:h-5 w-[1px] bg-gray-200 dark:bg-white/10 hidden sm:block" />

        <Link to="/dashboard" className="flex items-center gap-1.5 sm:gap-2 group min-w-0">
          <Logo
            className="h-6 w-6 sm:h-7 sm:w-7 object-contain group-hover:scale-105 transition-transform duration-200 shrink-0"
            alt="SmartNShine Logo"
          />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950 dark:text-white hidden md:inline">
            SmartNShine
          </span>
          <span className="text-gray-300 dark:text-zinc-700 text-xs hidden md:inline">/</span>
          <span className="text-[10px] xs:text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 xs:px-2 sm:px-2.5 py-0.5 rounded-lg truncate max-w-[90px] xs:max-w-none">
            Editor
          </span>
        </Link>

        {hasUnsavedChanges && (
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
            ● Unsaved
          </span>
        )}
      </div>

      {/* Right action controls */}
      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
        <DarkModeToggle />

        {/* Sync from Resume Button */}
        {onSyncResume && (
          <button
            type="button"
            onClick={onSyncResume}
            disabled={syncingResume}
            className="inline-flex items-center gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Import/sync all data & projects from linked resume"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingResume ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline">{syncingResume ? "Syncing..." : "Sync Resume"}</span>
          </button>
        )}

        {/* Template Selector Button */}
        <button
          type="button"
          onClick={onShowTemplateSelector}
          className="inline-flex items-center gap-1.5 px-2 xs:px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="Change portfolio template design"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline">Templates</span>
        </button>

        {/* Live Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 px-2 xs:px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="Open preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`relative inline-flex items-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
            hasUnsavedChanges ? "ring-2 ring-amber-500/50" : ""
          }`}
          title="Save changes (Ctrl+S)"
        >
          {saving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
          {hasUnsavedChanges && (
            <span className="sm:hidden absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
          )}
        </button>

        {/* Publish / Unpublish Button */}
        <button
          type="button"
          onClick={onPublishToggle}
          disabled={!isPublished && !canPublish}
          className={`inline-flex items-center gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPublished
              ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/20"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20"
          }`}
          title={
            isPublished
              ? "Unpublish portfolio"
              : canPublish
                ? "Save and publish portfolio"
                : "Complete the publish checklist first"
          }
        >
          {isPublished ? (
            <>
              <Globe2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unpublish</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Publish</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

import { memo } from "react";
import {
  X,
  List,
  Eye,
  Download,
  Loader2,
  Check,
  Lock,
  CheckCircle2,
} from "lucide-react";
import SectionOutlineList from "./SectionOutlineList";

// Memoized to avoid re-rendering this large mobile-only tree when unrelated editor state changes.
const MobileActionBar = memo(
  ({
    showFloatingNav,
    onToggleSections,
    showPreview,
    onTogglePreview,
    onSave,
    saving,
    autoSaving,
    hasUnsavedChanges,
    onExport,
    isExportLocked,
    completedSectionsCount,
    totalTrackableSections,
    completionPercentage,
    onJumpToFirstIncomplete,
    onExpandAll,
    onCollapseAll,
    trackableSectionIds,
    activeSectionId,
    sectionCompletionMap,
    onSelectSection,
    onMoveSection,
  }) => (
    <div
      className="lg:hidden fixed bottom-3 left-3 right-3 z-[60] rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-2 shadow-xl no-print"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={onToggleSections}
          className={`h-11 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            showFloatingNav
              ? "bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300"
              : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          {showFloatingNav ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
          <span className="text-[10px] font-semibold">Sections</span>
        </button>

        <button
          onClick={onTogglePreview}
          className="h-11 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-zinc-800 active:scale-95 shadow-2xs"
          title="Jump to live preview"
        >
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] font-semibold">Preview</span>
        </button>

        <button
          onClick={onSave}
          disabled={saving || autoSaving}
          className={`h-11 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            saving || autoSaving
              ? "bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : hasUnsavedChanges
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          {saving || autoSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasUnsavedChanges ? (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          ) : (
            <Check className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-[10px] font-semibold">
            {saving || autoSaving ? "Saving…" : hasUnsavedChanges ? "Save*" : "Saved"}
          </span>
        </button>

        <button
          onClick={onExport}
          disabled={isExportLocked}
          className={`h-11 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            isExportLocked
              ? "bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300"
          }`}
        >
          {isExportLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span className="text-[10px] font-semibold">Export</span>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {completedSectionsCount}/{totalTrackableSections} complete
          </span>
          <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {completionPercentage}%
          </span>
        </div>
        <button
          onClick={onJumpToFirstIncomplete}
          className="h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>

      {showFloatingNav && (
        <div className="mt-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1 pb-1">
            <span>Section Outline</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {completionPercentage}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <button
              onClick={onExpandAll}
              className="px-2 py-1 rounded-md border border-gray-200 dark:border-zinc-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Expand all
            </button>
            <button
              onClick={onCollapseAll}
              className="px-2 py-1 rounded-md border border-gray-200 dark:border-zinc-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Collapse all
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-auto">
            <SectionOutlineList
              sectionIds={trackableSectionIds}
              activeSectionId={activeSectionId}
              sectionCompletionMap={sectionCompletionMap}
              onSelectSection={onSelectSection}
              onMoveSection={onMoveSection}
            />
          </div>
        </div>
      )}
    </div>
  )
);

export default MobileActionBar;

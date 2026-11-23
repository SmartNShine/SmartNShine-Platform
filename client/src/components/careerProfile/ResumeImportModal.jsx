import { Upload, X, RefreshCw } from "lucide-react";
import { useBodyScrollLock } from "@/hooks";

export default function ResumeImportModal({
  isOpen,
  onClose,
  userResumes,
  selectedResumeId,
  setSelectedResumeId,
  importSections,
  setImportSections,
  importing,
  onExecuteImport,
}) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg flex flex-col bg-white dark:bg-zinc-950 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Import from Existing Resume
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Extract details from your saved resumes into your master profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
              Choose Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userResumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.resumeTitle || "Untitled Resume"} — {r.name || "Unnamed"} (
                  {new Date(r.updatedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2 block">
              Select Sections to Merge
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(importSections).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-white/[0.08] text-xs font-semibold text-gray-800 dark:text-zinc-200 cursor-pointer capitalize hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={importSections[key]}
                    onChange={(e) =>
                      setImportSections({ ...importSections, [key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onExecuteImport}
            disabled={importing || !selectedResumeId}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {importing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{importing ? "Importing..." : "Import Selected"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

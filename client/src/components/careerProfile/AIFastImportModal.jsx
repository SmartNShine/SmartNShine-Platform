import { Sparkles, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { useBodyScrollLock } from "@/hooks";

export default function AIFastImportModal({
  isOpen,
  onClose,
  sections,
  aiSection,
  setAiSection,
  aiInputText,
  setAiInputText,
  aiStructuring,
  onRunAIStructure,
  aiResultPreview,
  onApplyAIResult,
}) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-zinc-950 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Fast AI Paste & Structure
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste raw notes and SmartNShine AI will parse them into structured fields.
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
        <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
              Target Section
            </label>
            <select
              value={aiSection}
              onChange={(e) => setAiSection(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
              Raw Text / Notes
            </label>
            <textarea
              rows={6}
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder={`Paste unformatted text, notes, or portfolio descriptions here...\nExample: "KnockNFix is a local marketplace built with React, Node.js, and MongoDB. Decreased response times by 30%..."`}
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-xs leading-relaxed text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
            />
          </div>

          {/* Preview of Extracted Data */}
          {aiResultPreview && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-3">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>AI Extracted Structure (Review before merging)</span>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-900/80 rounded-2xl max-h-56 overflow-y-auto text-xs font-mono text-gray-800 dark:text-zinc-200 border border-gray-200/80 dark:border-white/[0.08] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800">
                <pre className="whitespace-pre-wrap">{JSON.stringify(aiResultPreview, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {aiResultPreview ? (
            <button
              onClick={onApplyAIResult}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              Confirm & Merge to Profile
            </button>
          ) : (
            <button
              onClick={onRunAIStructure}
              disabled={aiStructuring || !aiInputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {aiStructuring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{aiStructuring ? "Structuring..." : "Structure with AI"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

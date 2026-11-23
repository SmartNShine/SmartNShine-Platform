import { X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks";

export default function AddCustomQuestionModal({
  isOpen,
  onClose,
  categories,
  customQuestionCategory,
  setCustomQuestionCategory,
  customQuestionText,
  setCustomQuestionText,
  onAddCustomQuestion,
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Add Custom Question
          </h3>
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
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2 block">
              Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories
                .filter((c) => c.id !== "all" && c.id !== "saved")
                .map((c) => {
                  const isSelected = customQuestionCategory === c.id;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomQuestionCategory(c.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500"
                          : "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2 block">
              Question Text
            </label>
            <textarea
              rows={4}
              value={customQuestionText}
              onChange={(e) => setCustomQuestionText(e.target.value)}
              placeholder="e.g. How do you approach code reviews and architectural discussions in a fast-paced team?"
              className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed font-sans"
            />
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
            onClick={onAddCustomQuestion}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Add Question
          </button>
        </div>
      </div>
    </div>
  );
}

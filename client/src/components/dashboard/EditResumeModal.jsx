import { X, CheckCircle2, NotepadText } from "lucide-react";
import { useBodyScrollLock } from "@/hooks";

export default function EditResumeModal({
  editForm,
  setEditForm,
  onClose,
  onSave,
}) {
  useBodyScrollLock(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-200/90 dark:border-white/[0.1] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Edit Resume Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
              Customize title and private notes for this resume.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-2">
              Resume Title *
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="e.g. Senior Full Stack Engineer - Google Target"
              className="w-full px-4 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base font-medium"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1.5">
              Used in your dashboard for organizing versions.
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-2">
              Description / Notes (Optional)
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              placeholder="e.g. Tailored for leadership and system architecture roles..."
              rows={3}
              className="w-full p-4 border border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm sm:text-base leading-relaxed"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-3 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-xs sm:text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-1 px-5 py-3 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold rounded-2xl transition-all duration-200 shadow-xs text-xs sm:text-sm active:scale-95 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

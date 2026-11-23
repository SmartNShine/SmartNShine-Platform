import { Sparkles, Star, Flame, Briefcase, Plus } from "lucide-react";

export default function QABanner({
  totalSaved,
  onOpenJobModal,
  onOpenProjectModal,
  onOpenCustomModal,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs mb-6">
      {/* Subtle Ambient Glow */}

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Grounded Studio</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 shadow-xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{totalSaved} Saved Answers</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Personalized Career Q&A Bank
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Tailored interview responses automatically crafted from your verified projects, skills, and background. Zero hallucination.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenJobModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Prepare for a Job</span>
          </button>

          <button
            onClick={onOpenProjectModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span>Project Architecture Q&A</span>
          </button>

          <button
            onClick={onOpenCustomModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>Add Question</span>
          </button>
        </div>
      </div>
    </div>
  );
}

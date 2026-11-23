import { ScanSearch, Zap, Brain, Award } from "lucide-react";

export function ATSEmptyState() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-950 rounded-3xl p-8 sm:p-12 text-center min-h-[420px] flex flex-col justify-center border border-zinc-200/90 dark:border-white/10 shadow-xs">

      <div className="relative z-10 space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/25 text-blue-600 dark:text-blue-400">
          <ScanSearch className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Ready to analyze
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            Add a job description and choose a resume to see your ATS match score.
          </p>
        </div>

        <div className="space-y-3 pt-2 text-left p-4 rounded-2xl border border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Instant keyword match percentage</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300">
            <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Semantic skills & qualifications scoring</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300">
            <Award className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Actionable ATS pass/fail recommendation list</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ATSLoadingState() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-950 rounded-3xl p-10 sm:p-14 text-center min-h-[420px] flex flex-col justify-center border border-zinc-200/90 dark:border-white/10 shadow-xs">

      <div role="status" aria-live="polite" className="relative z-10 space-y-5 max-w-sm mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 animate-pulse">
          <ScanSearch className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Scanning your resume
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            Comparing keywords and skills against the job description.
          </p>
        </div>
      </div>
    </div>
  );
}

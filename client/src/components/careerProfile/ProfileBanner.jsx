import { Sparkles, Upload, TrendingUp, MessageSquare } from "lucide-react";

export default function ProfileBanner({
  completeness,
  sections,
  onOpenAIModal,
  onOpenImportModal,
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs">
        {/* Subtle Ambient Glow */}

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Single Source of Truth</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{completeness?.totalScore || 0}% Complete</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Master Career Profile
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Your unified professional repository. Enter your career information once and reuse everywhere across resumes, ATS analysis, and interview prep.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAIModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
              title="Paste raw notes and let AI structure it"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>AI Fast Import</span>
            </button>

            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Import from Resume</span>
            </button>

            <a
              href="/career-qa"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>Application Q&A</span>
            </a>
          </div>
        </div>
      </div>

      {/* Completeness & Metrics Grid */}
      <div className="bg-white dark:bg-zinc-950/90 rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Profile Completeness
          </p>
          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
            {completeness?.totalScore || 0}%
          </span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${completeness?.totalScore || 0}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {sections
            .filter((s) => s.id !== "additional")
            .map((s) => {
              const score = completeness?.sections?.[s.id] || 0;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-white/[0.06] text-xs"
                >
                  <span className="text-gray-600 dark:text-zinc-400 truncate font-medium">
                    {s.label}
                  </span>
                  <span
                    className={`font-bold ml-1.5 text-xs ${
                      score >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : score > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-gray-400"
                    }`}
                  >
                    {score >= 80 ? "✓" : `${score}%`}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

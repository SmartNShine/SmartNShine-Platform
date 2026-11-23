import {
  Lightbulb,
  SearchX,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PencilLine,
} from "lucide-react";

export default function ATSResultsBreakdown({
  analysisResult,
  expandedSections,
  toggleSection,
  showAllImprovements,
  setShowAllImprovements,
  onEditResume,
  showRecommendations = true,
  showKeywords = true,
  showStrengths = true,
}) {
  const improvements = analysisResult.improvements || [];
  const strengths = analysisResult.strengths || [];
  const missingKeywords = analysisResult.missing_keywords || [];
  const visibleImprovements = showAllImprovements
    ? improvements
    : improvements.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* 1. Top Recommendations */}
      {showRecommendations && <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 sm:p-6 border border-zinc-200/90 dark:border-white/10 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("recommendations")}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Lightbulb className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Recommendations
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                {improvements.length} high-impact improvements detected
              </p>
            </div>
          </div>
          {expandedSections.recommendations ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.recommendations && (
          <div className="mt-4 space-y-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
            {visibleImprovements.length > 0 ? (
              visibleImprovements.map((tip, index) => (
                <div
                  key={index}
                  className="flex flex-col items-stretch gap-3 rounded-2xl border border-zinc-200 p-3.5 dark:border-white/10 sm:flex-row sm:items-start"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0 tabular-nums">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-zinc-200 leading-relaxed">
                    {tip}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditResume?.(tip)}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-2.5 py-2 text-[11px] font-bold text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-500/20 sm:ml-auto"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Edit this improvement
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 py-2">
                No critical improvements needed for this section.
              </p>
            )}

            {improvements.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllImprovements((prev) => !prev)}
                className="w-full py-2.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
              >
                {showAllImprovements
                  ? "Show Less Recommendations"
                  : `Show All ${improvements.length} Recommendations (+${
                      improvements.length - 5
                    })`}
              </button>
            )}
          </div>
        )}
      </div>}

      {/* 2. Missing Keywords */}
      {showKeywords && <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 sm:p-6 border border-zinc-200/90 dark:border-white/10 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("keywords")}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <SearchX className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Missing Keywords
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                {missingKeywords.length} essential job terms absent from your resume
              </p>
            </div>
          </div>
          {expandedSections.keywords ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.keywords && (
          <div className="mt-4 pt-2 border-t border-gray-100 dark:border-white/5">
            {missingKeywords.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold"
                    >
                      <span>+</span>
                      <span>{keyword}</span>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onEditResume?.(`Add these missing keywords: ${missingKeywords.join(", ")}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-rose-500/20 transition-colors hover:bg-rose-700"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit Resume to Add Missing Keywords
                </button>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 py-2">
                No missing keywords! Your resume matches the job requirements closely.
              </p>
            )}
          </div>
        )}
      </div>}

      {/* 3. Strengths & Verified Signals */}
      {showStrengths && <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 sm:p-6 border border-zinc-200/90 dark:border-white/10 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("strengths")}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <BadgeCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Strengths
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                {strengths.length} verified matching qualifications
              </p>
            </div>
          </div>
          {expandedSections.strengths ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.strengths && (
          <div className="mt-4 space-y-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    {strength}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 py-2">
                No matching strengths calculated.
              </p>
            )}
          </div>
        )}
      </div>}
    </div>
  );
}

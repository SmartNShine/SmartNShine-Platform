import { CheckCircle2, AlertCircle } from "lucide-react";
import { getScoreTierMeta } from "@/utils/scorePresentation";

export default function ATSScoreHero({ analysisResult }) {
  const matchScore = analysisResult.match_score || 0;
  const scoreMeta = getScoreTierMeta(matchScore);
  const improvements = analysisResult.improvements || [];
  const strengths = analysisResult.strengths || [];
  const missingKeywords = analysisResult.missing_keywords || [];

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-6">

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            ATS Compatibility Score
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Automated applicant tracking system parsing rating
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs ${scoreMeta.badgeClass}`}
        >
          {analysisResult.eligible ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {analysisResult.eligible ? "Eligible for Interview" : "Optimization Needed"}
        </span>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Radial Meter */}
        <div className="relative w-36 h-36 shrink-0 mx-auto sm:mx-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="58"
              stroke="currentColor"
              strokeWidth="11"
              fill="none"
              className="text-zinc-100 dark:text-white/10"
            />
            <circle
              cx="72"
              cy="72"
              r="58"
              stroke="url(#atsGradientCompactNew)"
              strokeWidth="11"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${
                2 * Math.PI * 58 * (1 - matchScore / 100)
              }`}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            <defs>
              <linearGradient
                id="atsGradientCompactNew"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={scoreMeta.ringStart || "#3b82f6"} />
                <stop offset="100%" stopColor={scoreMeta.ringEnd || "#8b5cf6"} />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black tracking-tight ${scoreMeta.textClass}`}>
              {matchScore}%
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Match
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="flex-1 space-y-3">
          <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 leading-relaxed">
            {scoreMeta.level}. Follow the recommendations below to increase your resume ranking.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500">
                Fixes
              </p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {improvements.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500">
                Missing
              </p>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {missingKeywords.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500">
                Strengths
              </p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {strengths.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

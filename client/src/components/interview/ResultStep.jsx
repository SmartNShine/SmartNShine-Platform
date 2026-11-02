import React from "react";
import {
  Award,
  BarChart3,
  CheckCircle,
  XCircle,
  BookOpen,
  RefreshCw,
  Calendar,
  FileText,
  Sparkles,
} from "lucide-react";
import { IntegrityTimeline } from "./proctoring/IntegrityTimeline";

const defaultFormatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Result Step Component
export const ResultStep = ({
  result,
  elapsedTime,
  formatTime,
  onNewInterview,
  onRetry,
  onViewHistory,
}) => {
  if (!result) return null;

  const safeFormatTime = typeof formatTime === "function" ? formatTime : defaultFormatTime;

  const scoreColor =
    result.overallScore >= 70
      ? "text-green-500"
      : result.overallScore >= 50
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-blue-500/10 dark:to-cyan-500/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full text-sm font-medium text-slate-700 dark:text-blue-300 shadow-lg mb-6">
          <Award className="w-4 h-4" />
          Interview Complete
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Your Performance Report
        </h2>
        <div className="relative w-36 h-36 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="64"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-gray-200 dark:text-white/10"
            />
            <circle
              cx="72"
              cy="72"
              r="64"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="10"
              strokeDasharray={`${(result.overallScore / 100) * 402} 402`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="scoreGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  className={`${result.overallScore >= 70 ? "stop-color-green-500" : result.overallScore >= 50 ? "stop-color-yellow-500" : "stop-color-red-500"}`}
                  style={{
                    stopColor:
                      result.overallScore >= 70
                        ? "#22c55e"
                        : result.overallScore >= 50
                          ? "#eab308"
                          : "#ef4444",
                  }}
                />
                <stop
                  offset="100%"
                  className={`${result.overallScore >= 70 ? "stop-color-emerald-500" : result.overallScore >= 50 ? "stop-color-orange-500" : "stop-color-pink-500"}`}
                  style={{
                    stopColor:
                      result.overallScore >= 70
                        ? "#10b981"
                        : result.overallScore >= 50
                          ? "#f97316"
                          : "#ec4899",
                  }}
                />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${scoreColor}`}>
              {result.overallScore}
            </span>
          </div>
        </div>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          {result.grade} - {result.performanceLevel}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Duration: {safeFormatTime(elapsedTime || result?.duration || 0)} |{" "}
          {result.metrics?.answeredQuestions || 0}/{result.metrics?.totalQuestions || 0}{" "}
          questions answered
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Summary
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* 5D Executive Radar Competencies */}
      {result.radarCompetencies && Object.keys(result.radarCompetencies).length > 0 && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-indigo-200 dark:border-indigo-500/20 shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Staff-Level Competency Radar
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30">
              Bloom Cognitive Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(result.radarCompetencies).map(([key, item]) => {
              const labelMap = {
                technicalDepth: "Technical Depth & Correctness",
                architecturalTradeoffs: "Architectural Trade-offs & Scale",
                evidenceAndGrounding: "Evidence & Concrete Grounding",
                starProblemSolving: "STAR & Practical Ownership",
                communicationSignal: "Communication Signal-to-Noise",
              };
              const score = item?.score || 0;
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-gray-200">
                        {labelMap[key] || key}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          score >= 80
                            ? "text-emerald-600 dark:text-emerald-400"
                            : score >= 60
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          score >= 80
                            ? "bg-emerald-500"
                            : score >= 60
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                  {item?.summary && (
                    <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed mt-1">
                      {item.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill Breakdown */}
      {result.skillBreakdown && Object.keys(result.skillBreakdown).length > 0 && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Skill Breakdown
          </h3>
          <div className="space-y-5">
            {Object.entries(result.skillBreakdown).map(([skill, data]) => (
              <div key={skill}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 dark:text-gray-300 capitalize font-medium">
                    {skill.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span
                    className={`font-bold ${data.score >= 70 ? "text-green-500" : data.score >= 50 ? "text-yellow-500" : "text-red-500"}`}
                  >
                    {data.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      data.score >= 70
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : data.score >= 50
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                          : "bg-gradient-to-r from-red-500 to-pink-500"
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Proctoring & Integrity Audit Timeline */}
      {result.proctoringAudit && (
        <IntegrityTimeline
          proctoringAudit={result.proctoringAudit}
          videoRecordingUrl={result.videoRecordingUrl}
        />
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-green-200 dark:border-green-500/20 shadow-xl p-6">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Demonstrated Strengths
          </h3>
          <ul className="space-y-3">
            {result.strengths?.map((s, i) => (
              <li
                key={i}
                className="text-gray-600 dark:text-gray-400 flex items-start gap-3 text-sm leading-relaxed"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-red-200 dark:border-red-500/20 shadow-xl p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Areas for Technical Growth
          </h3>
          <ul className="space-y-3">
            {result.weaknesses?.map((w, i) => (
              <li
                key={i}
                className="text-gray-600 dark:text-gray-400 flex items-start gap-3 text-sm leading-relaxed"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 14-Day Growth Roadmap */}
      {result.studyRoadmap?.length > 0 && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-blue-200 dark:border-blue-500/20 shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Personalized 14-Day Growth Roadmap
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.studyRoadmap.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10"
              >
                <span className="text-[11px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
                  {item.day}
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-gray-200 mt-1 mb-2">
                  {item.focus}
                </h4>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  <span className="font-semibold text-slate-700 dark:text-gray-300">Resource:</span>{" "}
                  {item.recommendedResource}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume Optimization Recommendations */}
      {result.resumeImprovements?.length > 0 && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-indigo-200 dark:border-indigo-500/20 shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Resume Bullet Optimization Suggestions
          </h3>
          <ul className="space-y-2.5">
            {result.resumeImprovements.map((tip, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300 flex items-start gap-2.5"
              >
                <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice Areas */}
      {result.practiceAreas?.length > 0 && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Recommended Practice Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.practiceAreas.map((area, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-500/20"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onNewInterview || onRetry}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
        >
          <RefreshCw className="w-5 h-5" />
          Practice Again
        </button>
        <button
          onClick={onViewHistory || (() => { window.location.href = "/interview/history"; })}
          className="flex-1 py-4 bg-gray-100/80 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:border-blue-500/50 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <BarChart3 className="w-5 h-5" />
          View History
        </button>
      </div>
    </div>
  );
};

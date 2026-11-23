import { useMemo, useState } from "react";
import {
  Sparkles,
  Zap,
  ArrowRight,
  Save,
  CheckCircle2,
  X,
  Bot,
  ExternalLink,
  Target,
  FileCheck,
} from "lucide-react";
import { SECTION_META } from "./constants/editorConstants";

export const parseRecommendationDetails = (recommendation) => {
  if (!recommendation || typeof recommendation !== "string") {
    return {
      text: "",
      keywords: [],
      targetSection: "experience",
      sectionName: "Experience",
    };
  }

  const text = recommendation.trim();
  let keywords = [];

  // Extract missing keywords if formatted like "Add these missing keywords: a, b, c"
  const kwMatch = text.match(/(?:missing keywords|keywords):\s*([^.]+)/i);
  if (kwMatch && kwMatch[1]) {
    keywords = kwMatch[1]
      .split(/[,;\n]/)
      .map((k) => k.replace(/^[•\-+*\s]+/, "").trim())
      .filter((k) => k.length > 0 && k.length < 60);
  }

  // Detect target section based on keywords in text
  const lower = text.toLowerCase();
  let targetSection = "skills";

  if (keywords.length > 0 || /skill|technology|tech stack|language|tool|framework|library/i.test(lower)) {
    targetSection = "skills";
  } else if (/experience|job|work|bullet|metric|quantif|action verb|accomplish|impact|role|duty/i.test(lower)) {
    targetSection = "experience";
  } else if (/summary|objective|headline|bio|overview|profile/i.test(lower)) {
    targetSection = "summary";
  } else if (/education|degree|university|gpa|college|major|coursework/i.test(lower)) {
    targetSection = "education";
  } else if (/certif|license|credential|badge|accredit/i.test(lower)) {
    targetSection = "certifications";
  } else if (/project|portfolio|github|repo/i.test(lower)) {
    targetSection = "projects";
  } else if (/award|achievement|honor|competition/i.test(lower)) {
    targetSection = "achievements";
  } else if (/contact|email|phone|linkedin|location|address/i.test(lower)) {
    targetSection = "contact";
  }

  const sectionName = SECTION_META[targetSection]?.label || "Resume Content";

  return {
    text,
    keywords,
    targetSection,
    sectionName,
  };
};

export default function ATSRecommendationBanner({
  recommendation,
  onDismiss,
  onJumpToSection,
  onAutoAddKeywords,
  onSave,
  onOpenAIAnalysis,
  onBackToATS,
  saving = false,
}) {
  const [applied, setApplied] = useState(false);
  const [applyingKeywords, setApplyingKeywords] = useState(false);

  const parsed = useMemo(() => {
    return parseRecommendationDetails(recommendation);
  }, [recommendation]);

  if (!recommendation) return null;

  const handleApplyKeywords = async () => {
    if (!parsed.keywords.length || applyingKeywords) return;
    setApplyingKeywords(true);
    try {
      await onAutoAddKeywords?.(parsed.keywords);
      setApplied(true);
    } finally {
      setApplyingKeywords(false);
    }
  };

  return (
    <div className="mb-4 sm:mb-6 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white p-4 sm:p-5 shadow-xl border border-blue-400/30 relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Top bar: Badge, target section info, dismiss button */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/30 border border-blue-300/40 text-[11px] font-extrabold uppercase tracking-wider text-blue-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
              ATS Recommended Action
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-semibold text-zinc-200 border border-white/10">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Target Section: <strong className="text-white ml-0.5">{parsed.sectionName}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss banner"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Middle: Recommendation content */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 rounded-xl p-3 sm:p-3.5 border border-white/10">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-relaxed">
              &ldquo;{parsed.text}&rdquo;
            </p>

            {/* If missing keywords are parsed, display tags */}
            {parsed.keywords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-blue-200">
                  Detected Keywords ({parsed.keywords.length}):
                </span>
                {parsed.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/25 border border-blue-400/30 text-[11px] font-semibold text-blue-100"
                  >
                    +{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick-add keywords if available */}
            {parsed.keywords.length > 0 && (
              <button
                type="button"
                onClick={handleApplyKeywords}
                disabled={applyingKeywords || applied}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  applied
                    ? "bg-emerald-600 text-white border border-emerald-400/40"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border border-blue-300/30 active:scale-95"
                }`}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    Keywords Added &amp; Saved
                  </>
                ) : applyingKeywords ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin text-amber-300" />
                    Adding &amp; Saving...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    Auto-Add Keywords &amp; Save
                  </>
                )}
              </button>
            )}

            {/* Jump & Edit Section Button */}
            <button
              type="button"
              onClick={() => onJumpToSection?.(parsed.targetSection)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <ArrowRight className="w-4 h-4 text-blue-300" />
              Jump to {parsed.sectionName} Section
            </button>

            {/* Save Resume Button */}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-400/30 transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Resume"}
            </button>

            {/* Open AI Suggestions */}
            {onOpenAIAnalysis && (
              <button
                type="button"
                onClick={onOpenAIAnalysis}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/60 hover:bg-purple-600/80 text-white text-xs font-semibold border border-purple-400/30 transition-all cursor-pointer active:scale-95"
              >
                <Bot className="w-4 h-4 text-purple-200" />
                AI Enhancer
              </button>
            )}
          </div>

          {/* Back to ATS Scanner link */}
          {onBackToATS && (
            <button
              type="button"
              onClick={onBackToATS}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white underline underline-offset-4 transition-colors cursor-pointer ml-auto"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Re-run ATS Score
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

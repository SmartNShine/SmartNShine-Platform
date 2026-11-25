import React from "react";
import { Check, ArrowRight, Sparkles } from "lucide-react";

export default function PricingTierCard({
  tierKey,
  tierData,
  isPopular,
  elevated = false,
  isActivePlan,
  onSelectPlan,
}) {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isFree = tierKey === "free";
  const isOneTime = tierKey === "one-time";
  const isPro = tierKey === "pro";

  const getTitle = () => {
    if (isFree) return "Starter Free";
    if (isOneTime) return "One-Time Pass";
    return "Pro Unlimited";
  };

  const getSubtitle = () => {
    if (isFree) return "For casual updates and baseline ATS resume generation.";
    if (isOneTime) return "Complete 21-day single tailored boost for active job apps.";
    return "For job seekers seeking maximum interview callbacks and full AI power.";
  };

  const getFeatureLeadIn = () => {
    if (isFree) return "What's included:";
    if (isOneTime) return "Everything in Free, plus:";
    return "Everything in One-Time, plus:";
  };

  const defaultFeaturesByTier = {
    free: [
      "1 Active resume per month",
      "OpenAI GPT-4o AI model",
      "3 Core ATS templates",
      "Master Career Profile Hub",
      "5 Career Q&A interview questions",
      "30-Minute AI Interview Simulation",
      "Basic ATS keyword check",
      "Standard PDF export",
    ],
    "one-time": [
      "1 Dedicated resume (21-day pass)",
      "OpenAI GPT-4o AI rewriting",
      "All 11 ATS-Certified templates",
      "1 Deep ATS diagnostic scan",
      "1 Live Portfolio website",
      "Full Career Q&A Studio access",
      "AI PDF/DOCX resume parser",
      "21-day full access",
    ],
    pro: [
      "Unlimited resumes & exports",
      "OpenAI GPT-4o Premium AI model",
      "All 11 ATS-Certified templates",
      "Unlimited ATS diagnostic scans",
      "Unlimited Public Portfolio websites",
      "Unlimited Career Q&A mock interviews",
      "10 AI interviews per month",
      "Unlimited AI resume file parsers",
      "Master Career Profile Hub 2-way sync",
      "Priority PDF rendering & 24/7 support",
    ],
  };

  const features =
    tierData?.features && tierData.features.length > 0
      ? tierData.features
      : defaultFeaturesByTier[tierKey] || [];

  const proAmount = tierData?.monthly?.amount || 199;
  const proOriginalAmount = tierData?.monthly?.originalAmount || 299;
  const isProDiscounted = isPro && proAmount < proOriginalAmount;

  return (
    <div
      className={`flex flex-col justify-between p-6 sm:p-8 h-full transition-all duration-300 ${
        elevated
          ? "relative z-20 bg-white dark:bg-[#0c0c0c] md:-translate-y-6 md:scale-[1.04] md:rounded-2xl md:border-2 md:border-neutral-900 dark:md:border-white md:shadow-2xl dark:md:shadow-[0_24px_60px_rgba(0,0,0,0.55)] md:ring-1 md:ring-neutral-900/10 dark:md:ring-white/15 md:mx-[-2px]"
          : "bg-white dark:bg-[#0c0c0c] md:translate-y-1 md:opacity-[0.98]"
      }`}
    >
      <div className="space-y-6">
        {/* Header: Title and discount / active pill */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {getTitle()}
            </h3>

            {isActivePlan ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <Check className="w-3 h-3 stroke-[2.5]" /> Active
              </span>
            ) : isPro && isProDiscounted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Save 33%
              </span>
            ) : null}
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed min-h-[38px]">
            {getSubtitle()}
          </p>
        </div>

        {/* Pricing Block */}
        <div className="pb-4 border-b border-neutral-100 dark:border-[#1F1F1F]">
          {isFree && (
            <div className="space-y-1">
              <div className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                ₹0
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                No credit card required
              </p>
            </div>
          )}

          {isOneTime && (
            <div className="space-y-1">
              <div className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                ₹49
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                / 21-day single pass
              </p>
            </div>
          )}

          {isPro && (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  {formatPrice(proAmount)}
                </span>
                {isProDiscounted && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatPrice(proOriginalAmount)}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                per month billed monthly
              </p>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {getFeatureLeadIn()}
          </p>
          <ul className="space-y-3">
            {features.map((feat, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-snug"
              >
                <Check
                  className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button at bottom */}
      <div className="pt-8">
        {isPro ? (
          <button
            onClick={() => onSelectPlan("pro", "monthly")}
            disabled={isActivePlan}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              isActivePlan
                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                : "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm"
            }`}
          >
            <span>
              {isActivePlan ? "Current Active Plan ✓" : "Upgrade to Pro"}
            </span>
            {!isActivePlan && <ArrowRight className="w-4 h-4" />}
          </button>
        ) : isOneTime ? (
          <button
            onClick={() =>
              onSelectPlan("one-time", tierData?.plan || "one-time")
            }
            disabled={isActivePlan}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              isActivePlan
                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-zinc-950 dark:hover:bg-[#28282c] dark:text-neutral-200 dark:border-neutral-700/60"
            }`}
          >
            <span>
              {isActivePlan ? "Current Active Plan ✓" : "Get 21-Day Pass (₹49)"}
            </span>
            {!isActivePlan && <ArrowRight className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={() => onSelectPlan("free")}
            disabled={isActivePlan}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              isActivePlan
                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-zinc-950 dark:hover:bg-[#28282c] dark:text-neutral-200 dark:border-neutral-700/60"
            }`}
          >
            <span>
              {isActivePlan ? "Current Active Plan ✓" : "Get started for free"}
            </span>
            {!isActivePlan && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

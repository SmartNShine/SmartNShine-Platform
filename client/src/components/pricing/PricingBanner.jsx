import React from "react";
import { ShieldCheck, Zap, Building2 } from "lucide-react";

export default function PricingBanner() {
  return (
    <div className="text-center max-w-3xl mx-auto pt-6 pb-4 sm:pt-10 sm:pb-8 space-y-3">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Pricing
      </h1>

      <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
        SmartNShine powers end-to-end career readiness, ATS optimization, and AI interview prep for students and institutions.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-[#141417] dark:text-neutral-300 dark:border-neutral-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          7-Day Money Back Guarantee
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-[#141417] dark:text-neutral-300 dark:border-neutral-800">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Instant Activation
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-[#141417] dark:text-neutral-300 dark:border-neutral-800">
          <Building2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          Campus TPO Support
        </span>
      </div>
    </div>
  );
}

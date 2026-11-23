import { FileUp, Zap, ShieldCheck, ListChecks } from "lucide-react";

export default function UploadBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs mb-6">

      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold w-fit">
          <FileUp className="w-3.5 h-3.5" aria-hidden="true" />
          <span>AI resume import</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Upload your resume
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
          Upload a PDF or DOCX and our AI pulls out your contact details, experience, skills and projects into the builder.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>Instant extraction</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
            <ListChecks className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
            <span>Auto-sorted sections</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span>Private and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

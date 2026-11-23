import { ListOrdered, BadgeCheck, CheckCircle2, ShieldCheck, LayoutList, FileDown, ScanText, WandSparkles } from "lucide-react";

export function UploadWorkflowGuide() {
  const steps = [
    {
      title: "Text extraction",
      desc: "We read dates, job titles, companies and contact details.",
      icon: ScanText,
      tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Sections and skills",
      desc: "Experience bullets and skills are organised into editable sections.",
      icon: LayoutList,
      tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Enhance and tailor",
      desc: "Tighten phrasing, fix weak verbs and tailor to a job.",
      icon: WandSparkles,
      tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Export PDF",
      desc: "Download a clean, recruiter-ready PDF.",
      icon: FileDown,
      tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  const features = [
    "Accurate AI text extraction",
    "Sections and dates sorted automatically",
    "Clean, ATS-friendly formatting",
    "Your data is never shared with third parties",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      {/* Step by Step Flow */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ListOrdered className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              What happens next
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
              From upload to editor
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-2xl border border-zinc-200 dark:border-white/10"
              >
                <div className={`w-8 h-8 rounded-xl ${step.tint} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why Upload Here */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BadgeCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Why SmartNShine
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
              Built to pass applicant tracking systems
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm font-medium text-emerald-950 dark:text-emerald-200">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UploadSecurityNotice() {
  return (
    <div className="rounded-3xl p-4 sm:p-5 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 text-center shadow-xs">
      <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-blue-500" aria-hidden="true" /> Privacy and security:
        </span>
        <span>
          Uploads are encrypted and processed securely. We never sell or share your data.
        </span>
      </p>
    </div>
  );
}

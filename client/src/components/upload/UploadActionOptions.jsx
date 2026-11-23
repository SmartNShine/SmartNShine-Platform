import { FilePlus2, ArrowRight } from "lucide-react";

export default function UploadActionOptions({
  onCreateBlank,
  uploading,
}) {
  return (
    <div className="space-y-6">
      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-[#f8fafc] dark:bg-[#09090b] text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Or start another way
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <button
          onClick={onCreateBlank}
          disabled={uploading}
          className="group text-left p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500/60 transition-colors duration-200 shadow-xs cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FilePlus2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-[color,transform]" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Start from scratch
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Begin with a blank, ATS-friendly resume.
            </p>
          </div>
        </button>

      </div>
    </div>
  );
}

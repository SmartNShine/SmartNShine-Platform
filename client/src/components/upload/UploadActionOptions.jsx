import { Link } from "react-router-dom";
import { FilePlus2, ArrowRight, BriefcaseBusiness } from "lucide-react";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Start from scratch */}
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

        {/* Option 2: Build with Career Profile */}
        <Link
          to="/career-profile"
          className="group text-left p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 hover:border-cyan-500 dark:hover:border-cyan-500/60 transition-colors duration-200 shadow-xs cursor-pointer flex flex-col justify-between gap-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <BriefcaseBusiness className="w-6 h-6" aria-hidden="true" />
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-[color,transform]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Use Career Profile
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                Hub
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Fill your resume from the experience, skills and projects you've already saved.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

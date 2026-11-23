import { Link } from "react-router-dom";
import { FileText, Plus, Sparkles, Upload } from "lucide-react";

export default function EmptyResumeState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 p-12 sm:p-16 text-center bg-white/50 dark:bg-zinc-950/50 space-y-5">
      <div className="w-20 h-20 mx-auto bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-3xl flex items-center justify-center shadow-xs">
        <FileText className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          No Resumes Found
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
          Create or upload your first resume to get started with instant AI enhancement, ATS score audits, and portfolio generation.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold rounded-2xl transition-all duration-200 shadow-xs text-xs sm:text-sm active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF / Word</span>
        </Link>
        <Link
          to="/editor"
          state={{ resumeData: { name: "" } }}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-200 font-bold rounded-2xl transition-all duration-200 text-xs sm:text-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Build from Scratch</span>
        </Link>
      </div>
    </div>
  );
}

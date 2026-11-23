import { Link } from "react-router-dom";
import { Sparkles, Plus, Globe2 } from "lucide-react";

export default function DashboardBanner({ userName, totalResumes }) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs mb-6">

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>AI Resume Management Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Resumes
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
            Welcome back, <span className="font-bold text-gray-900 dark:text-white">{userName || "User"}</span>! Manage, tailor, and generate ATS-optimized resumes and developer portfolio websites.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold rounded-xl transition-all duration-200 shadow-xs active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Resume</span>
          </Link>

          <Link
            to="/portfolio"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-200 font-bold rounded-xl border border-gray-200 dark:border-white/10 transition-all duration-200 shadow-xs active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Globe2 className="w-4 h-4 text-emerald-500" />
            <span>Portfolios Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

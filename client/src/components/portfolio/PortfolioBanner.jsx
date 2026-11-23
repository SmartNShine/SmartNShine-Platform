import { Link } from "react-router-dom";
import { Globe2, Plus, Eye, Download, MousePointerClick, Sparkles } from "lucide-react";

export default function PortfolioBanner({
  portfoliosCount = 0,
  totalViews = 0,
  totalResumeDownloads = 0,
  totalProjectClicks = 0,
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner Hero Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs">
        {/* Subtle Ambient Glow */}

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Globe2 className="w-3.5 h-3.5" />
                <span>Live Personal Websites</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{portfoliosCount} Active {portfoliosCount === 1 ? "Site" : "Sites"}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Developer Portfolios Hub
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Create from a resume or start blank, pick a theme, refine in the live editor, then publish your public site.
            </p>
          </div>

          <div>
            <Link
              to="/portfolio/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create portfolio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950/90 border border-gray-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-semibold">
            <span>Total Portfolios</span>
            <Globe2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {portfoliosCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950/90 border border-gray-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-semibold">
            <span>Total Views</span>
            <Eye className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalViews}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950/90 border border-gray-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-semibold">
            <span>Resume Downloads</span>
            <Download className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {totalResumeDownloads}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950/90 border border-gray-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-semibold">
            <span>Project Clicks</span>
            <MousePointerClick className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalProjectClicks}
          </div>
        </div>
      </div>
    </div>
  );
}

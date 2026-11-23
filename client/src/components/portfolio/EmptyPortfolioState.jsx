import { Link } from "react-router-dom";
import { Globe2, Plus, Sparkles, Rocket } from "lucide-react";

export default function EmptyPortfolioState() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 p-12 text-center shadow-xs">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-5">
        <Globe2 className="h-8 w-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Theme → Source → Publish</span>
      </div>

      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
        No Portfolios Created Yet
      </h2>
      <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
        Pick a theme, import a resume or start blank, then refine and publish your live portfolio site.
      </p>

      <Link
        to="/portfolio/new"
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold text-sm shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <Rocket className="w-4 h-4" />
        <span>Create Your First Portfolio</span>
      </Link>
    </div>
  );
}

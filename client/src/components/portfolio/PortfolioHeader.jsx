import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { DarkModeToggle } from "@/components/common";
import Logo from "@/components/common/Logo";

export default function PortfolioHeader({
  onGoBack,
  actionButton = null,
  badgeText = "Portfolios",
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.08] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3 sm:gap-4">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Back</span>
          </button>
        )}

        <div className="h-5 w-[1px] bg-gray-200 dark:bg-white/10" />

        <Link to="/dashboard" className="flex items-center gap-2 group">
          <Logo
            className="h-8 w-8 object-contain group-hover:scale-105 transition-transform duration-200"
            alt="SmartNShine Logo"
          />
          <span className="font-extrabold text-base tracking-tight text-zinc-950 dark:text-white hidden sm:inline">
            SmartNShine
          </span>
          <span className="text-gray-300 dark:text-zinc-700 text-xs hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg">
            {badgeText}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <DarkModeToggle />
        {actionButton}
      </div>
    </header>
  );
}

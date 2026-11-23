import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DarkModeToggle } from "@/components/common";
import Logo from "@/components/common/Logo";

export default function QAHeader({ onGoBack }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.08] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="h-4 sm:h-5 w-[1px] bg-gray-200 dark:bg-white/10 hidden xs:block" />

        <Link to="/dashboard" className="flex items-center gap-2 group">
          <Logo
            className="h-7 w-7 object-contain group-hover:scale-105 transition-transform duration-200 shrink-0"
            alt="SmartNShine Logo"
          />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950 dark:text-white hidden md:inline">
            SmartNShine
          </span>
          <span className="text-gray-300 dark:text-zinc-700 text-xs hidden md:inline">/</span>
          <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2 sm:px-2.5 py-0.5 rounded-lg whitespace-nowrap">
            Career Q&A Bank
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <DarkModeToggle />
      </div>
    </header>
  );
}

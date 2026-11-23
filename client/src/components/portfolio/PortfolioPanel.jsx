import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function PortfolioPanel({
  id = null,
  title,
  description,
  icon: Icon = null,
  badge = null,
  defaultOpen = false,
  forceState,
  forceVersion,
  actions = null,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof forceVersion === "number" && forceState !== null && forceState !== undefined) {
      setIsOpen(Boolean(forceState));
    }
  }, [forceState, forceVersion]);

  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/[0.1] bg-white dark:bg-zinc-950/90 shadow-sm dark:shadow-xl transition-all duration-200 hover:border-gray-300 dark:hover:border-white/20"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((current) => !current);
          }
        }}
        className="flex w-full items-center justify-between gap-2.5 xs:gap-3.5 sm:gap-4 px-3.5 xs:px-5 sm:px-7 py-3.5 xs:py-4 sm:py-5 text-left hover:bg-gray-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 xs:gap-3.5 sm:gap-4 min-w-0">
          {Icon && (
            <div className="flex h-9 w-9 xs:h-10 xs:w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-2.5">
              <h2 className="text-sm xs:text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border border-gray-200/60 dark:border-white/[0.06]">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-0.5 text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-zinc-400 line-clamp-1 sm:line-clamp-none">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
          <ChevronDown
            className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 dark:border-white/[0.08] p-3.5 xs:p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6 bg-gray-50/40 dark:bg-zinc-900/30">
          {children}
        </div>
      )}
    </section>
  );
}

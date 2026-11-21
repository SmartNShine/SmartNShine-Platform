import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const TINTS = {
  sky: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50",
  emerald:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
  indigo:
    "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50",
  amber:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
  purple:
    "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50",
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  tint = "indigo",
}) {
  const iconTint = TINTS[tint] || TINTS.indigo;

  return (
    <div className="relative overflow-hidden p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 opacity-80" />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          {title}
        </p>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${iconTint}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
          {value}
        </span>
        {trendValue && (
          <span
            className={`inline-flex items-center text-[11px] font-mono font-medium px-1.5 py-0.5 rounded border ${
              trend === "up"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                : trend === "down"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {trend === "down" && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend === "neutral" && <Minus className="w-3 h-3 mr-0.5" />}
            {trendValue}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}

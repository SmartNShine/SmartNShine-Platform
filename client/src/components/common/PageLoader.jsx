// Shared skeleton for full-page loading states. Mirrors the real page layout
// (header card, stat row, list rows) so content doesn't jump when data arrives.
const bone = "animate-pulse rounded-xl bg-zinc-200/80 dark:bg-white/[0.06]";
const shell = "rounded-3xl border border-zinc-200/90 bg-white dark:border-white/10 dark:bg-zinc-950";

export default function PageLoader({ label = "Loading", stats = 4, rows = 3 }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="workspace-container py-6 sm:py-8 space-y-6">
      <div className={`${shell} p-6 sm:p-8 flex items-center justify-between gap-6`}>
        <div className="space-y-3 flex-1">
          <div className={`${bone} h-7 w-56`} />
          <div className={`${bone} h-4 w-full max-w-md`} />
        </div>
        <div className={`${bone} h-11 w-40 hidden sm:block`} />
      </div>
      {stats > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className={`${shell} p-5 space-y-4`}>
              <div className={`${bone} h-3 w-24`} />
              <div className={`${bone} h-8 w-20`} />
            </div>
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${shell} p-5 flex items-center gap-4`}>
          <div className={`${bone} h-12 w-12 shrink-0`} />
          <div className="flex-1 space-y-2.5">
            <div className={`${bone} h-4 w-48`} />
            <div className={`${bone} h-3 w-72 max-w-full`} />
          </div>
          <div className={`${bone} h-10 w-28 hidden sm:block`} />
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

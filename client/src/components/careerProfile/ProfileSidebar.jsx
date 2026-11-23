export default function ProfileSidebar({
  sections,
  activeTab,
  onSelectTab,
  completeness,
}) {
  return (
    <div className="bg-white dark:bg-zinc-950/90 rounded-3xl p-3 sm:p-4 border border-gray-200/80 dark:border-white/[0.08] shadow-xs sticky top-20 space-y-1.5">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
        Profile Sections
      </div>
      {sections.map((sec) => {
        const Icon = sec.icon;
        const isActive = activeTab === sec.id;
        const score = completeness?.sections?.[sec.id] || 0;

        return (
          <button
            key={sec.id}
            onClick={() => onSelectTab(sec.id)}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
              isActive
                ? "bg-blue-600 text-white shadow-xs dark:bg-blue-600"
                : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100/80 dark:hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400 dark:text-zinc-400"}`} />
              <span>{sec.label}</span>
            </div>
            {score >= 80 ? (
              <span className={`text-xs font-bold ${isActive ? "text-white" : "text-emerald-500"}`}>
                ✓
              </span>
            ) : (
              <span className={`text-[11px] font-medium opacity-70 ${isActive ? "text-white" : "text-gray-400"}`}>
                {sec.weight}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

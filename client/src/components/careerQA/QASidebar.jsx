import { useState } from "react";
import {
  Search,
  Star,
  Check,
  Layers,
  Sparkles,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";

export default function QASidebar({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  items,
  loading,
  selectedItem,
  onSelectQuestion,
  onToggleStar,
  categoryBadgeStyles,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const copyCardAnswer = (item, e) => {
    e.stopPropagation();
    const ans = item.savedAnswer || item.aiDraft;
    if (!ans) {
      toast.error("Generate or save an answer first!");
      return;
    }
    navigator.clipboard.writeText(ans);
    setCopiedId(item._id || item.question);
    toast.success(`Copied answer for "${item.question.slice(0, 30)}..."`, {
      duration: 1500,
    });
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="bg-white dark:bg-zinc-950/90 rounded-3xl p-5 sm:p-6 border border-gray-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
      {/* Category Pills Grid / Wrap (No horizontal scroll) */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs"
                  : "bg-gray-100 dark:bg-zinc-900/90 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-zinc-800/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search questions or keywords..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-zinc-900/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
        />
      </div>

      {/* Questions Scrollable List */}
      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-16 text-xs text-gray-400 font-semibold uppercase tracking-wider animate-pulse">
            Loading Questions...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-zinc-500 space-y-2">
            <Layers className="w-9 h-9 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No questions found</p>
            <p className="text-xs text-gray-400">Try changing your search query or category filter.</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const isSelected = selectedItem?.question === item.question;
            const hasSaved = Boolean(item.savedAnswer?.trim());
            const hasDraft = Boolean(item.aiDraft?.trim());
            const hasAnyAnswer = hasSaved || hasDraft;
            const categoryStyle =
              categoryBadgeStyles[item.category] ||
              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
            const itemKey = item._id || item.question;

            return (
              <div
                key={item._id || `${item.category}-${item.question}-${idx}`}
                onClick={() => onSelectQuestion(item)}
                className={`p-4 sm:p-4.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3.5 text-left relative overflow-hidden group ${
                  isSelected
                    ? "bg-blue-50/90 dark:bg-blue-950/35 border-blue-400 dark:border-blue-600/70 shadow-sm"
                    : "bg-gray-50/70 dark:bg-zinc-900/40 border-gray-200/70 dark:border-white/[0.05] hover:bg-gray-100/90 dark:hover:bg-zinc-900/90"
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
                )}

                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${categoryStyle}`}>
                      {item.category}
                    </span>
                    {hasSaved ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    ) : hasDraft ? (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                        Draft Ready
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[13.5px] sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-relaxed">
                    {item.question}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {hasAnyAnswer && (
                    <button
                      type="button"
                      onClick={(e) => copyCardAnswer(item, e)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        copiedId === itemKey
                          ? "bg-emerald-500 text-white"
                          : "hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                      title="1-Click Copy Answer"
                    >
                      {copiedId === itemKey ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={(e) => onToggleStar(item, e)}
                    className={`p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                      item.isStarred ? "text-amber-400" : "text-gray-300 dark:text-zinc-700 hover:text-amber-400"
                    }`}
                    title="Star favorite"
                  >
                    <Star className={`w-4 h-4 ${item.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

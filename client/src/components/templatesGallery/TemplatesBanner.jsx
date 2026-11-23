import { Layout, Palette, Sparkles, Filter } from "lucide-react";

export default function TemplatesBanner({
  categories,
  selectedCategory,
  setSelectedCategory,
  totalTemplates,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs mb-6">

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{totalTemplates} ATS-Certified Templates</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Resume Templates
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Recruiter-approved, ATS-optimized layouts tailored for technical, corporate, leadership, academic, and creative careers.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-zinc-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                selectedCategory === category
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md shadow-black/10 dark:shadow-white/10"
                  : "bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200/60 dark:border-white/5"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

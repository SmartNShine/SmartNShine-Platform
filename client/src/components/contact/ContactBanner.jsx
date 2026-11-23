import { Mail, MessageSquare, Sparkles, Clock, ShieldCheck } from "lucide-react";

export default function ContactBanner({ activeTab, setActiveTab }) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5 sm:p-6 lg:py-6 lg:px-8 shadow-xs mb-6">

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>We're Here to Help</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Get in Touch
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Have questions regarding AI resume optimization, subscription billing, or bug reports? Our specialized engineering and career support teams are standing by.
            </p>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap md:flex-col items-start gap-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200/80 dark:border-white/5 text-xs font-bold text-gray-700 dark:text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Average Response: &lt; 2 Hours</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200/80 dark:border-white/5 text-xs font-bold text-gray-700 dark:text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Direct Support & Encryption</span>
            </div>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={() => setActiveTab("contact")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeTab === "contact"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md shadow-black/10 dark:shadow-white/10"
                : "bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Direct Contact</span>
          </button>

          <button
            onClick={() => setActiveTab("feedback")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              activeTab === "feedback"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md shadow-black/10 dark:shadow-white/10"
                : "bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Product Feedback & Bugs</span>
          </button>
        </div>
      </div>
    </div>
  );
}

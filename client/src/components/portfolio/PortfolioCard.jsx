import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Check,
  Edit3,
  ExternalLink,
  Eye,
  Trash2,
  Globe2,
  MousePointerClick,
  Download,
  PhoneCall,
  Sparkles,
} from "lucide-react";

export default function PortfolioCard({ portfolio, onCopy, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy(portfolio.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPublished = portfolio.status === "published";

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950/90 p-6 shadow-sm dark:shadow-xl hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isPublished
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span>{portfolio.status}</span>
            </span>

            {portfolio.themeId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-white/[0.06] capitalize">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>{portfolio.themeId}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(portfolio._id)}
            aria-label="Delete portfolio"
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete portfolio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight line-clamp-1">
            {portfolio.title || "Untitled Portfolio"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium line-clamp-1">
            {portfolio.professionalTitle || "Personal Portfolio Site"}
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-3 border border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[11px] font-medium">
              <span>Views</span>
              <Eye className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
              {portfolio.analytics?.totalViews || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-3 border border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[11px] font-medium">
              <span>Resume DLs</span>
              <Download className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
              {portfolio.analytics?.resumeDownloads || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-3 border border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[11px] font-medium">
              <span>Project Clicks</span>
              <MousePointerClick className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
              {portfolio.analytics?.projectClicks || 0}
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-3 border border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[11px] font-medium">
              <span>Contacts</span>
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
              {portfolio.analytics?.contactClicks || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.08]">
        <Link
          to={`/portfolio/${portfolio._id}/edit`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Link>

        <Link
          to={`/portfolio/${portfolio._id}/preview`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          title="Preview portfolio"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Preview</span>
        </Link>

        {isPublished && (
          <>
            <button
              type="button"
              onClick={handleCopyClick}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
              title="Copy public link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={`/u/${portfolio.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95 cursor-pointer"
              title="Open public portfolio in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </>
        )}
      </div>
    </article>
  );
}

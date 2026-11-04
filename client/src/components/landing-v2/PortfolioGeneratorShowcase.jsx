import React from "react";
import { Link } from "react-router-dom";
import { Globe, ExternalLink, Github, Code2, ArrowRight, Sparkles, Layers } from "lucide-react";

export default function PortfolioGeneratorShowcase() {
  return (
    <section id="portfolio" className="scroll-mt-12 space-y-6 pt-10">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              [ 04 // 1-CLICK WEB PORTFOLIO ]
            </span>
            <span className="text-xs text-zinc-400">• Developer Showcase</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            Instant Personal Website from Your Resume
          </h2>
        </div>
      </div>

      {/* Live Portfolio Mockup Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#11141a] p-6 shadow-sm space-y-6">
        {/* Mock Browser Header */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              https://smartnshine.in/u/alex-morgan
            </span>
          </div>
          <Link
            to="/tech-portfolio"
            target="_blank"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Live Demo</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Portfolio Mini Preview Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
              <Github className="w-4 h-4" />
              <span>GitHub Projects Sync</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Auto-imports your starred repositories, languages, and commit stats.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Glassmorphism Themes</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Switch between Dark Obsidian, Minimalist Light, and Cyberpunk styles.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>SEO & Social Cards</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Pre-configured OpenGraph tags for rich Twitter & LinkedIn link previews.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-xs text-zinc-500">Deploy your custom portfolio website in 30 seconds</span>
          <Link
            to="/portfolio/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Create Free Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

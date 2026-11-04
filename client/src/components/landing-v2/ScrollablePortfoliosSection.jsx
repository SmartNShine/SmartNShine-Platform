import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Layers,
  Code2,
  Compass,
  Laptop,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDarkMode } from "../../context/DarkModeContext";

const PORTFOLIOS = [
  {
    id: "magazine",
    num: "01",
    title: "Magazine Editorial",
    role: "Staff Product Designer & Art Director",
    candidate: "Elena Rostova",
    subdomain: "smartnshine.in/p/elena.design",
    image: "/img/portfolios/1.png",
    category: "Editorial Monograph",
    badge: "Signature",
    bgAccent: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    description: "12-column editorial grid inspired by high-fashion architectural print publications.",
    tags: ["Asymmetric Grid", "Serif Monograph", "Case Studies", "Custom Subdomain"],
  },
  {
    id: "cyberdev",
    num: "02",
    title: "CyberDev Terminal",
    role: "Senior Distributed Systems Engineer",
    candidate: "David Chen",
    subdomain: "smartnshine.in/p/david.systems",
    image: "/img/portfolios/2.png",
    category: "Developer Matrix",
    badge: "Popular Dark",
    bgAccent: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    description: "High-contrast developer terminal with live GitHub star sync and repo metrics.",
    tags: ["Terminal HUD", "GitHub Stars Sync", "System Logs", "Architecture"],
  },
  {
    id: "swiss",
    num: "03",
    title: "Swiss Architectural",
    role: "Principal Frontend Architect",
    candidate: "Marcus Vance",
    subdomain: "smartnshine.in/p/marcus.arch",
    image: "/img/portfolios/3.png",
    category: "Minimalist II",
    badge: "Minimalist",
    bgAccent: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    description: "Monochrome paper-and-ink grid with rigid typographic index and cobalt highlights.",
    tags: ["Condensed Swiss", "Cobalt Accent", "Blueprint Rows", "High Signal"],
  },
  {
    id: "liquidglass",
    num: "04",
    title: "Liquid Glass Spatial",
    role: "Full-Stack AI Engineer",
    candidate: "Sophia Lin",
    subdomain: "smartnshine.in/p/sophia.ai",
    image: "/img/portfolios/4.png",
    category: "Spatial 3D",
    badge: "Spatial 3D",
    bgAccent: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
    description: "Layered translucent glass surfaces floating over ambient aurora fluid lights.",
    tags: ["Translucent Glass", "Ambient Aurora", "Spatial UI", "Refraction"],
  },
];

export default function ScrollablePortfoliosSection() {
  const { isDarkMode } = useDarkMode();

  return (
    <section
      id="portfolios-showcase"
      className={`relative py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8 overflow-visible transition-colors duration-300 ${
        isDarkMode ? "bg-[#06070a] text-zinc-100" : "bg-[#fafbfe] text-slate-900"
      }`}
    >
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[160px] bg-blue-500/10 dark:bg-blue-500/15 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[500px] rounded-full blur-[160px] bg-purple-500/10 dark:bg-purple-500/15 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* ================= LEFT COLUMN: STICKY OVERVIEW & CONTROLS ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                From ATS resume <span className="font-light text-slate-400 dark:text-zinc-500">to live web portfolio.</span>
              </h2>

              <p className={`text-sm sm:text-base lg:text-lg font-light leading-relaxed tracking-normal ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                Don't stop at flat PDFs. Transform your verified resume data into a responsive personal website
                hosted on your custom subdomain with automatic GitHub project sync.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 sm:space-y-3 font-light text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant public subdomain (<span className="font-mono text-xs text-blue-500">smartnshine.in/p/you</span>)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>One-click GitHub repository and star synchronization</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% mobile, tablet, and ultra-wide responsive</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Search engine (SEO) and OpenGraph social card ready</span>
              </div>
            </div>

            {/* CTA Box */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border space-y-3 sm:space-y-4 ${
                isDarkMode ? "bg-[#11121d] border-zinc-800" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Ready in 60 Seconds
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Free Tier Included
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                Choose any template below to deploy your developer portfolio with zero coding or hosting fees.
              </p>

              <Link
                to="/portfolio/new"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-5 rounded-xl font-medium text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch Your Web Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: VERTICAL SCROLLABLE PORTFOLIO CARDS ================= */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-10">
            {PORTFOLIOS.map((portfolio, idx) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`group rounded-2xl sm:rounded-[32px] border overflow-hidden transition-colors duration-300 shadow-xl hover:shadow-2xl text-left ${
                  isDarkMode
                    ? "bg-[#11121d] border-zinc-800 shadow-black/80 hover:border-blue-500/40"
                    : "bg-white border-slate-200 shadow-slate-200/90 hover:border-blue-300"
                }`}
              >
                {/* Browser Mockup Chrome Bar */}
                <div
                  className={`px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-2 sm:gap-4 ${
                    isDarkMode ? "bg-[#161827] border-zinc-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400/90" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400/90" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400/90" />
                    <span className="ml-1 sm:ml-2 font-mono text-[11px] sm:text-xs font-medium text-slate-400 dark:text-zinc-500">
                      /{portfolio.num}
                    </span>
                  </div>

                  {/* Browser URL Box */}
                  <div
                    className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-mono flex items-center gap-1.5 sm:gap-2 max-w-[160px] sm:max-w-[280px] truncate ${
                      isDarkMode
                        ? "bg-[#0c0e14] text-zinc-300 border border-zinc-800"
                        : "bg-white text-slate-700 border border-slate-200 shadow-xs"
                    }`}
                  >
                    <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">{portfolio.subdomain}</span>
                  </div>

                  <span className="text-[11px] sm:text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Vertical Scrollable Canvas Viewport */}
                <div className="relative h-[260px] sm:h-[380px] md:h-[460px] w-full overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-zinc-950 scroll-smooth">
                  <picture>
                    <source srcSet={portfolio.image.replace(/\.png$/, ".webp")} type="image/webp" />
                    <img
                      src={portfolio.image}
                      alt={`${portfolio.title} Deployed Preview`}
                      width="720"
                      height="460"
                      className="w-full object-cover object-top transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>

                  {/* Top floating badge */}
                  <div className="sticky top-2.5 left-2.5 z-10 p-2 sm:p-3 pointer-events-none">
                    <span
                      className={`inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-mono font-medium shadow-md border backdrop-blur-md ${portfolio.bgAccent}`}
                    >
                      {portfolio.badge}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Footer Info */}
                <div
                  className={`p-4 sm:p-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                    isDarkMode ? "bg-[#131522] border-zinc-800/80" : "bg-white border-slate-100"
                  }`}
                >
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">
                        {portfolio.title}
                      </h3>
                      <span className="text-[11px] sm:text-xs font-mono text-slate-400 dark:text-zinc-500">• {portfolio.category}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs font-light text-slate-500 dark:text-zinc-400">
                      {portfolio.candidate} — {portfolio.role}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex gap-1.5">
                      {portfolio.tags.slice(0, 2).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className={`text-[9px] sm:text-[10px] font-mono px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border ${
                            isDarkMode
                              ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      to="/portfolio/new"
                      aria-label={`Deploy ${portfolio.title} portfolio theme`}
                      className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] sm:text-xs font-medium shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Deploy</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

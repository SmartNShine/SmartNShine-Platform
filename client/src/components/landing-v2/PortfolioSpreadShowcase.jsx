import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Github, ExternalLink, ArrowRight, Sparkles, Layers, Code2, Terminal } from "lucide-react";

export default function PortfolioSpreadShowcase() {
  const [hoveredPortfolio, setHoveredPortfolio] = useState(null);

  const portfolios = [
    {
      id: "cyberdev",
      name: "CyberDev Terminal Theme",
      developer: "Alex Morgan",
      title: "Senior Full Stack Engineer",
      slug: "smartnshine.in/u/alex-dev",
      githubStats: "2.4k stars • 48 repositories",
      featuredProject: "Distributed Raft Consensus Engine (Go)",
      tag: "Terminal Aesthetic",
      rotate: "rotate-2",
      top: "top-4",
      left: "left-2 sm:left-4",
    },
    {
      id: "glassmorphism",
      name: "Glassmorphism Studio Theme",
      developer: "Sarah Chen",
      title: "Lead Technical PM & Founder",
      slug: "smartnshine.in/u/sarah-chen",
      githubStats: "B2B SaaS Case Studies • Live Demos",
      featuredProject: "AI Enterprise Analytics Platform",
      tag: "Ultra Modern",
      rotate: "-rotate-3",
      top: "top-10 sm:top-14",
      left: "left-36 sm:left-52",
    },
    {
      id: "minimal-dev",
      name: "Minimal Obsidian Theme",
      developer: "David Kumar",
      title: "AI & ML Systems Engineer",
      slug: "smartnshine.in/u/david-ai",
      githubStats: "1.2k commits • PyTorch Contributor",
      featuredProject: "High-Throughput Vector Indexing Engine",
      tag: "Monochrome Dark",
      rotate: "rotate-3",
      top: "top-64 sm:top-56",
      left: "left-4 sm:left-12",
    },
    {
      id: "executive",
      name: "Executive Leadership Theme",
      developer: "Elena Rostova",
      title: "VP of Engineering",
      slug: "smartnshine.in/u/elena-eng",
      githubStats: "Advisory Roles • Keynote Speaker",
      featuredProject: "CloudScale Infrastructure Scale-Up",
      tag: "Executive Polish",
      rotate: "-rotate-2",
      top: "top-72 sm:top-64",
      left: "left-44 sm:left-64",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden font-scoutie border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* LEFT COLUMN: Clean, Concise Text & Actions */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>1-Click Developer Portfolios</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
            Turn your resume into a <br />
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              live portfolio website.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Instantly publish a responsive personal developer website with GitHub repo sync, interactive project demos, and a custom shareable link.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              to="/portfolio/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-base transition-colors shadow-sm active:scale-98"
            >
              <span>Launch Free Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/tech-portfolio"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-base transition-colors active:scale-98"
            >
              <ExternalLink className="w-4 h-4 text-zinc-500" />
              <span>View Live Demo</span>
            </Link>
          </div>

          <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium pt-1">
            <div className="flex items-center gap-2">
              <Github className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Auto-syncs pinned GitHub repositories & languages</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>7+ Designer themes (Terminal, Glassmorphism, Minimal)</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Faded Floating Spread Portfolios Canvas (Pop-Out on Hover) */}
        <div className="lg:col-span-7 relative h-[520px] sm:h-[580px] w-full select-none">
          <div className="relative w-full h-full">
            {portfolios.map((item) => {
              const isHovered = hoveredPortfolio === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredPortfolio(item.id)}
                  onMouseLeave={() => setHoveredPortfolio(null)}
                  className={`absolute ${item.top} ${item.left} w-[280px] sm:w-[330px] rounded-xl border transition-all duration-300 cursor-pointer ${
                    item.rotate
                  } ${
                    isHovered
                      ? "scale-108 -rotate-0 z-40 bg-white dark:bg-[#11141a] border-blue-500 dark:border-blue-400 shadow-2xl opacity-100 ring-2 ring-blue-500/20"
                      : "bg-white/85 dark:bg-[#11141a]/85 border-zinc-200 dark:border-zinc-800/90 shadow-md opacity-65 dark:opacity-50 hover:opacity-100 z-10"
                  }`}
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Mock Browser Header */}
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium truncate max-w-[170px]">
                        {item.slug}
                      </span>
                    </div>

                    {/* Developer Name & Title */}
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white">
                        {item.developer}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        {item.title}
                      </div>
                    </div>

                    {/* Featured Project Showcase */}
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                      <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                        FEATURED PROJECT
                      </div>
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {item.featuredProject}
                      </div>
                    </div>

                    {/* GitHub Info */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                      <Github className="w-3 h-3" />
                      <span>{item.githubStats}</span>
                    </div>

                    {/* Hover Link */}
                    {isHovered && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold animate-fade-in">
                        <span>Preview {item.name}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Upload, Target, Globe2 } from "lucide-react";

const defaultCards = [
  {
    title: "1-Click AI Resume Parsing",
    desc: "Drop any existing PDF or DOCX file. Our AI instantly extracts work history, skills, and education into ATS-compliant templates.",
    gradientFrom: "#03a9f4",
    gradientTo: "#ff0058",
    icon: Upload,
    link: "/upload",
    linkText: "Upload & Parse Resume",
    badge: "Auto-Ingest",
  },
  {
    title: "Deep ATS Diagnostics & GPT-4o",
    desc: "Scan against Greenhouse, Workday, and Lever filters. Re-engineer bullet points into metric-rich achievements with 98%+ keyword density.",
    gradientFrom: "#ffbc00",
    gradientTo: "#ff0058",
    icon: Target,
    link: "/ats-analyzer",
    linkText: "Run ATS Scan",
    badge: "AI Optimization",
  },
  {
    title: "Live Hosted Portfolios & Mock QA",
    desc: "Turn your career profile into a live website (smartnshine.in/p/you) and practice AI mock interviews with real-time feedback.",
    gradientFrom: "#4dff03",
    gradientTo: "#00d0ff",
    icon: Globe2,
    link: "/portfolio",
    linkText: "Launch Portfolio",
    badge: "Deploy & Hired",
  },
];

export default function SkewCards({ cards = defaultCards }) {
  return (
    <>
      <div className="flex justify-center items-center flex-wrap gap-8 sm:gap-12 py-10">
        {cards.map(
          (
            {
              title,
              desc,
              gradientFrom = "#ffbc00",
              gradientTo = "#ff0058",
              link = "/upload",
              linkText = "Get Started",
              badge,
              icon: Icon,
            },
            idx
          ) => (
            <div
              key={idx}
              className="group relative w-[320px] sm:w-[350px] min-h-[420px] transition-all duration-500 my-6"
            >
              {/* Skewed gradient panels */}
              <span
                className="absolute top-0 left-[30px] w-[calc(100%-60px)] h-full rounded-2xl transform skew-x-[12deg] transition-all duration-500 group-hover:skew-x-0 group-hover:left-[10px] group-hover:w-[calc(100%-20px)]"
                style={{
                  background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
                }}
              />
              <span
                className="absolute top-0 left-[30px] w-[calc(100%-60px)] h-full rounded-2xl transform skew-x-[12deg] blur-[28px] opacity-60 dark:opacity-70 transition-all duration-500 group-hover:skew-x-0 group-hover:left-[10px] group-hover:w-[calc(100%-20px)] group-hover:opacity-90"
                style={{
                  background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
                }}
              />

              {/* Animated floating glass reflection blobs */}
              <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
                <span className="absolute top-0 left-0 w-0 h-0 rounded-full opacity-0 bg-black/5 dark:bg-white/20 backdrop-blur-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-all duration-300 animate-blob group-hover:top-[-30px] group-hover:left-[30px] group-hover:w-[80px] group-hover:h-[80px] group-hover:opacity-100" />
                <span className="absolute bottom-0 right-0 w-0 h-0 rounded-full opacity-0 bg-black/5 dark:bg-white/20 backdrop-blur-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-all duration-500 animate-blob animation-delay-1000 group-hover:bottom-[-30px] group-hover:right-[30px] group-hover:w-[80px] group-hover:h-[80px] group-hover:opacity-100" />
              </span>

              {/* Card Body Content with light & dark mode support */}
              <div className="relative z-20 h-full p-7 sm:p-8 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-xl border border-gray-200/90 dark:border-white/10 shadow-xl dark:shadow-2xl rounded-2xl text-gray-900 dark:text-white transition-all duration-500 group-hover:translate-x-[-10px] group-hover:translate-y-[-10px] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between">
                    {badge && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-800 dark:text-white/90 backdrop-blur-md">
                        <Sparkles className="w-3 h-3 text-amber-500 dark:text-yellow-300" />
                        {badge}
                      </span>
                    )}
                    {Icon && (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white border border-gray-200/80 dark:border-white/15 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-snug">
                    {title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {desc}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={link}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-white dark:text-black bg-gray-900 dark:bg-white hover:bg-blue-600 dark:hover:bg-yellow-300 px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{linkText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Tailwind custom animations for floating reflection */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translateY(8px); }
          50% { transform: translate(-8px); }
        }
        .animate-blob { animation: blob 2.5s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: -1.25s; }
      `}</style>
    </>
  );
}

export { SkewCards };

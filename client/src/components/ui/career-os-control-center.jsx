import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  Globe,
  Wand2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Code2,
} from "lucide-react";

export const CareerOSControlCenter = () => {
  // Clockwise orbiting focus state (0: Top-Left -> 1: Top-Right -> 3: Bottom-Right -> 2: Bottom-Left -> 0)
  const [activeCycle, setActiveCycle] = useState(0);

  useEffect(() => {
    const cycleOrder = [0, 1, 3, 2]; // Clockwise circular order
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % cycleOrder.length;
      setActiveCycle(cycleOrder[currentIndex]);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl sm:rounded-3xl bg-zinc-950/90 dark:bg-black/90 border border-blue-500/30 dark:border-white/15 shadow-[0_0_50px_rgba(59,130,246,0.18)] backdrop-blur-2xl overflow-hidden transition-all duration-300">
      {/* Ambient Moving Shimmer Light */}
      <motion.div
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 7,
          ease: "linear",
        }}
        className="absolute top-0 left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none z-30"
      />

      {/* Window Header Bar with macOS Window Controls */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-gray-200/10 dark:border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80 shrink-0" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 shrink-0" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 shrink-0" />
          <span className="text-[10px] sm:text-xs font-mono font-medium text-zinc-400 pl-1 sm:pl-2 truncate">
            Career OS Control Center
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] sm:text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>ACTIVE</span>
        </div>
      </div>

      {/* 2x2 Interactive Modular Widgets Grid (Responsive 2 columns across all screens) */}
      <div className="p-2.5 sm:p-5 grid grid-cols-2 gap-2 sm:gap-4 relative z-10">
        
        {/* WIDGET 0: ATS RESUME SCORE GAUGE (Top-Left) */}
        <motion.div
          animate={{
            y: [-2, 2, -2],
          }}
          transition={{
            repeat: Infinity,
            duration: 5.5,
            ease: "easeInOut",
          }}
        >
          <Link
            to="/ats-analyzer"
            className={`group relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 flex flex-col justify-between space-y-2 sm:space-y-3 h-full block ${
              activeCycle === 0
                ? "bg-white/[0.06] dark:bg-zinc-900/90 border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                : "bg-white/[0.02] dark:bg-zinc-900/60 border border-white/[0.08] hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-wider text-zinc-400 group-hover:text-cyan-400 transition-colors uppercase truncate">
                ATS Score
              </span>
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors shrink-0" />
            </div>

            {/* Circular SVG Gauge Score */}
            <div className="flex flex-col items-center justify-center py-0.5 sm:py-1">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-zinc-800"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#atsGaugeGrad)"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.97) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <defs>
                    <linearGradient id="atsGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base sm:text-xl font-black text-white font-outfit tracking-tight">
                    97<span className="text-[9px] sm:text-xs text-zinc-400 font-normal">/100</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[7px] sm:text-[9px] font-black tracking-wider uppercase border border-emerald-500/30">
                    EXCELLENT
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8.5px] sm:text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
              <span className="truncate">Workday Ready</span>
              <span className="text-cyan-400 font-bold flex items-center gap-0.5 shrink-0">
                Check <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* WIDGET 1: LIVE PORTFOLIO CARD PREVIEW (Top-Right) */}
        <motion.div
          animate={{
            y: [2, -2, 2],
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut",
          }}
        >
          <Link
            to="/portfolio"
            className={`group relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 flex flex-col justify-between space-y-2 sm:space-y-3 h-full block ${
              activeCycle === 1
                ? "bg-white/[0.06] dark:bg-zinc-900/90 border border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                : "bg-white/[0.02] dark:bg-zinc-900/60 border border-white/[0.08] hover:border-blue-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-wider text-zinc-400 group-hover:text-blue-400 transition-colors uppercase truncate">
                Live Portfolio
              </span>
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0" />
            </div>

            {/* High-Tech Developer Terminal Portfolio Card */}
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-black/60 border border-blue-500/20 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-xs shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-[6px] bg-black/80 flex items-center justify-center">
                    <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-[10px] sm:text-xs font-bold text-white font-outfit truncate">Alex Rivera</h5>
                  <p className="text-[8px] sm:text-[9.5px] text-zinc-400 truncate font-mono">alex.smartnshine.in</p>
                </div>
              </div>

              {/* Reactive Tech Stack Tags */}
              <div className="flex gap-1 overflow-hidden">
                <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-[8px] sm:text-[9px] font-mono font-bold text-blue-300">
                  React
                </span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300">
                  TS
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8.5px] sm:text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
              <span className="text-emerald-400 font-bold truncate">● Live</span>
              <span className="text-blue-400 font-bold flex items-center gap-0.5 shrink-0">
                Deploy <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* WIDGET 2: AI ACHIEVEMENT ENHANCER (Bottom-Left) */}
        <motion.div
          animate={{
            y: [1.5, -1.5, 1.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 5.8,
            ease: "easeInOut",
          }}
        >
          <Link
            to="/upload"
            className={`group relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 flex flex-col justify-between space-y-2 sm:space-y-3 h-full block ${
              activeCycle === 2
                ? "bg-white/[0.06] dark:bg-zinc-900/90 border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                : "bg-white/[0.02] dark:bg-zinc-900/60 border border-white/[0.08] hover:border-indigo-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-wider text-zinc-400 group-hover:text-indigo-400 transition-colors uppercase truncate">
                AI Enhancer
              </span>
              <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors shrink-0" />
            </div>

            {/* Live Metric Impact Preview Box */}
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/60 border border-indigo-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] sm:text-[9px] font-mono text-indigo-400 uppercase font-bold">
                  Impact
                </span>
                <span className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 text-[7.5px] sm:text-[8.5px] font-black font-mono">
                  +48%
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-zinc-300 font-medium leading-tight line-clamp-2">
                "Optimized API caching, reducing latency by 38%."
              </p>
            </div>

            <div className="flex items-center justify-between text-[8.5px] sm:text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
              <span className="text-indigo-400 font-bold truncate">Metrics</span>
              <span className="text-indigo-400 font-bold flex items-center gap-0.5 shrink-0">
                Enhance <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* WIDGET 3: MASTER CAREER PROFILE SYNC (Bottom-Right) */}
        <motion.div
          animate={{
            y: [-1.5, 1.5, -1.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 6.2,
            ease: "easeInOut",
          }}
        >
          <Link
            to="/career-profile"
            className={`group relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 flex flex-col justify-between space-y-2 sm:space-y-3 h-full block ${
              activeCycle === 3
                ? "bg-white/[0.06] dark:bg-zinc-900/90 border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                : "bg-white/[0.02] dark:bg-zinc-900/60 border border-white/[0.08] hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-wider text-zinc-400 group-hover:text-cyan-400 transition-colors uppercase truncate">
                Profile Sync
              </span>
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400 group-hover:text-cyan-400 group-hover:rotate-180 transition-all duration-500 shrink-0" />
            </div>

            {/* Concentric Circular Sync Telemetry */}
            <div className="flex items-center justify-center py-1 sm:py-2">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-cyan-400/50"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute inset-1.5 rounded-full border border-dotted border-blue-400/60"
                />
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8.5px] sm:text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
              <span className="text-emerald-400 font-bold truncate">● Synced</span>
              <span className="text-cyan-400 font-bold flex items-center gap-0.5 shrink-0">
                Sync <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CareerOSControlCenter;

import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileWarning,
  CreditCard,
  Globe2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../../context/DarkModeContext";

// Magnetic Card with cursor physics, 3D tilt, and smooth return spring
function MagneticCard({ children, className = "", style = {} }) {
  const cardRef = useRef(null);
  const rectRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      if (!rectRef.current) {
        rectRef.current = cardRef.current.getBoundingClientRect();
      }
      const rect = rectRef.current;
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = (-y / (rect.height / 2)) * 3;
      const rotateY = (x / (rect.width / 2)) * 3;
      const translateX = (x / (rect.width / 2)) * 4;
      const translateY = (y / (rect.height / 2)) * 4;

      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0) scale3d(1.008, 1.008, 1.008)`;
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rectRef.current = null;
    if (cardRef.current) {
      cardRef.current.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale3d(1, 1, 1)";
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale3d(1, 1, 1)",
        transition: "transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease",
        willChange: "transform",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export default function PainPointsBentoSection() {
  const { isDarkMode } = useDarkMode();

  // Interactive Live States
  const [atsView, setAtsView] = useState("smartnshine"); // "canva" | "smartnshine"
  const [billingPlan, setBillingPlan] = useState("smartnshine"); // "legacy" | "smartnshine"
  const [portfolioTheme, setPortfolioTheme] = useState("magazine"); // "magazine" | "tech" | "minimal"
  const [isRewriting, setIsRewriting] = useState(false);
  const [showRewritten, setShowRewritten] = useState(true);

  const handleTriggerRewrite = () => {
    setIsRewriting(true);
    setShowRewritten(false);
    setTimeout(() => {
      setIsRewriting(false);
      setShowRewritten(true);
    }, 450);
  };

  return (
    <section
      id="roadblocks-solved"
      className={`relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-visible transition-colors duration-300 ${
        isDarkMode ? "bg-[#08090e] text-zinc-100" : "bg-[#f7f8fc] text-slate-900"
      }`}
    >
      {/* Scoped CSS Keyframe Line & Laser Animations */}
      <style>{`
        @keyframes bentoScanLaser {
          0%, 100% { transform: translateY(0px); opacity: 0.35; }
          50% { transform: translateY(48px); opacity: 1; }
        }
        @keyframes bentoDashFlow {
          to { stroke-dashoffset: -24; }
        }
        @keyframes bentoFloatGentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
        .anim-scan-laser {
          animation: bentoScanLaser 2.2s ease-in-out infinite;
        }
        .anim-dash-flow {
          stroke-dasharray: 5 5;
          animation: bentoDashFlow 1.4s linear infinite;
        }
        .anim-float {
          animation: bentoFloatGentle 3s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[500px] rounded-full blur-[160px] bg-rose-500/5 dark:bg-rose-500/10 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Why standard resumes <span className="font-light text-slate-400 dark:text-zinc-500">get silently rejected.</span>
          </h2>

          <p
            className={`text-base sm:text-lg font-light leading-relaxed tracking-normal max-w-2xl mx-auto ${
              isDarkMode ? "text-zinc-400" : "text-slate-600"
            }`}
          >
            Click and test the live interactive simulators below to see why graphic tools fail and how SmartNShine
            guarantees clean parsing.
          </p>
        </motion.div>

        {/* ================= STICKY SOLID PLAYFUL PLAYGROUND DECK ================= */}
        <div className="relative pb-16 space-y-8">
          {/* ================= CARD 1: ATS PARSER TRAP (SOLID CORAL / ROSE THEME) ================= */}
          <div style={{ top: "100px", zIndex: 10 }} className="sticky">
            <MagneticCard
              className={`rounded-[32px] border p-8 sm:p-9 shadow-2xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#1c0e14] border-rose-900/50 shadow-black/80"
                  : "bg-[#fff1f2] border-rose-200/80 shadow-rose-200/40"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Side */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-medium text-rose-500 dark:text-rose-400">/01</span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium tracking-wider uppercase bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          PARSER BOTTLENECK
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500 text-white shadow-md shadow-rose-500/20 anim-float">
                        <FileWarning className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-normal tracking-tight leading-snug">
                        <span className="text-rose-600 dark:text-rose-400 block">The ATS Parser Trap,</span>
                        <span className={isDarkMode ? "text-white" : "text-slate-900"}>
                          why Canva graphic templates get silently dropped.
                        </span>
                      </h3>
                      <p className={`text-sm sm:text-[15px] font-light leading-relaxed tracking-normal ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                        Canva flattens text into complex graphical vector layers. Enterprise ATS scanners (Workday,
                        Taleo, Greenhouse) cannot parse multi-column bounding boxes, causing your resume to be read
                        as corrupted symbols or dropped completely.
                      </p>
                    </div>
                  </div>

                  {/* Solid Solution Callout */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDarkMode
                        ? "bg-[#12090d] border-rose-900/60 text-zinc-100"
                        : "bg-white border-rose-200/80 text-slate-900 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>SmartNShine Fix: Machine-Verified Single-Column Format</span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                      SmartNShine compiles pure semantic single-column templates that pass enterprise ATS scans with a
                      clean 98%+ extraction rate.
                    </p>
                  </div>
                </div>

                {/* Right Side: Solid Simulator Box */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl border ${
                    isDarkMode
                      ? "bg-[#12090d] border-rose-900/50 text-zinc-100"
                      : "bg-white border-rose-200/80 text-slate-900 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40">
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                      Live ATS Simulator:
                    </span>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-rose-50/60 dark:bg-[#1a0c13] border border-rose-200/70 dark:border-rose-900/60">
                      <button
                        onClick={() => setAtsView("canva")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          atsView === "canva"
                            ? "bg-rose-500 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        Canva View
                      </button>
                      <button
                        onClick={() => setAtsView("smartnshine")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          atsView === "smartnshine"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        SmartNShine
                      </button>
                    </div>
                  </div>

                  <div
                    className={`my-4 p-4 rounded-xl border relative overflow-hidden min-h-[160px] flex flex-col justify-center ${
                      isDarkMode
                        ? "bg-[#1a0c13] border-rose-900/50 text-zinc-100"
                        : "bg-rose-50/40 border-rose-200/60 text-slate-900"
                    }`}
                  >
                    <div className="absolute inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent anim-scan-laser shadow-[0_0_12px_rgba(244,63,94,1)] z-20 pointer-events-none" />

                    <AnimatePresence mode="wait">
                      {atsView === "canva" ? (
                        <motion.div
                          key="canva-view"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="space-y-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
                            <span className="flex items-center gap-1.5">
                              <XCircle className="w-4 h-4" /> Workday Scanner Output
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-medium">
                              23% (FAILED)
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-zinc-400 text-xs font-sans font-light">
                            [ERROR]: Vector text overlapping in Layer 4. Header "Work Experience" converted to
                            unparsed glyphs. 4 skills dropped.
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="smartnshine-view"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="space-y-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Workday Scanner Output
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-medium">
                              98% (CLEAN MATCH)
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-zinc-300 text-xs font-sans font-light">
                            ✓ All key candidate details, employment dates, quantified bullets, and skills extracted
                            without parsing errors.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-light">
                    <span>Click toggle to test simulator</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono text-[11px]">
                      {atsView === "smartnshine" ? "✓ 98.4% PASS RATE" : "❌ 23% PARSING FAIL"}
                    </span>
                  </div>
                </div>
              </div>
            </MagneticCard>
          </div>

          {/* ================= CARD 2: SNEAKY AUTO-BILL (SOLID HONEY / AMBER THEME) ================= */}
          <div style={{ top: "125px", zIndex: 11 }} className="sticky">
            <MagneticCard
              className={`rounded-[32px] border p-8 sm:p-9 shadow-2xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#1f1508] border-amber-900/50 shadow-black/80"
                  : "bg-[#fffbeb] border-amber-200/80 shadow-amber-200/40"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Side */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-medium text-amber-500 dark:text-amber-400">/02</span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          BILLING DECEPTION
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500 text-white shadow-md shadow-amber-500/20 anim-float">
                        <CreditCard className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-normal tracking-tight leading-snug">
                        <span className="text-amber-600 dark:text-amber-400 block">The Sneaky $30/Mo Auto-Bill,</span>
                        <span className={isDarkMode ? "text-white" : "text-slate-900"}>
                          zero hidden credit card renewals or trial traps.
                        </span>
                      </h3>
                      <p className={`text-sm sm:text-[15px] font-light leading-relaxed tracking-normal ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                        Traditional resume builders lure job seekers with an innocent '$2.95 trial', only to quietly
                        lock your credit card into recurring $29.95+ monthly rebilling that requires filing support
                        tickets to stop.
                      </p>
                    </div>
                  </div>

                  {/* Solid Solution Callout */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDarkMode
                        ? "bg-[#140d05] border-amber-900/60 text-zinc-100"
                        : "bg-white border-amber-200/80 text-slate-900 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>SmartNShine Fix: Transparent Pricing & Generous Free Tier</span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                      We believe in honest pricing. Use our Free Tier with zero card required, or choose transparent
                      One-Time passes (₹9) and simple Pro plans with zero hidden auto-renewal traps.
                    </p>
                  </div>
                </div>

                {/* Right Side: Solid Pricing Simulator */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl border ${
                    isDarkMode
                      ? "bg-[#140d05] border-amber-900/50 text-zinc-100"
                      : "bg-white border-amber-200/80 text-slate-900 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-amber-900/40">
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                      Pricing Comparison:
                    </span>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-amber-50/60 dark:bg-[#1f1406] border border-amber-200/70 dark:border-amber-900/60">
                      <button
                        onClick={() => setBillingPlan("legacy")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          billingPlan === "legacy"
                            ? "bg-rose-500 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        Legacy Builder
                      </button>
                      <button
                        onClick={() => setBillingPlan("smartnshine")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          billingPlan === "smartnshine"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        SmartNShine
                      </button>
                    </div>
                  </div>

                  <div
                    className={`my-4 p-4 rounded-xl border min-h-[160px] flex flex-col justify-center ${
                      isDarkMode
                        ? "bg-[#1f1406] border-amber-900/50 text-zinc-100"
                        : "bg-amber-50/40 border-amber-200/60 text-slate-900"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {billingPlan === "legacy" ? (
                        <motion.div
                          key="legacy-pricing"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                              Zety / Resume.io Auto-Bill:
                            </span>
                            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-rose-500 text-white">
                              $359.40 / year
                            </span>
                          </div>
                          <p className="text-xs font-light text-slate-600 dark:text-zinc-400 leading-relaxed">
                            • Advertised as "$2.95 trial"<br />
                            • Auto-bills $29.95 every 4 weeks silently<br />
                            • Requires support tickets to stop charges
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="smartnshine-pricing"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4" /> SmartNShine Model:
                            </span>
                            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-600 text-white">
                              100% Transparent
                            </span>
                          </div>
                          <p className="text-xs font-light text-slate-700 dark:text-zinc-300 leading-relaxed">
                            • <strong className="font-medium">Free Forever Tier:</strong> ₹0 (No card required)<br />
                            • <strong className="font-medium">Tailored Pass:</strong> ₹9 one-time flash access<br />
                            • <strong className="font-medium">Zero Sneaky Traps:</strong> Cancel anytime in 1 click
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-light">
                    <span>Hidden credit card rebilling?</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono text-[11px]">
                      {billingPlan === "smartnshine" ? "ZERO HIDDEN FEES" : "❌ $29.95/MO SNEAKY REBILL"}
                    </span>
                  </div>
                </div>
              </div>
            </MagneticCard>
          </div>

          {/* ================= CARD 3: LIVE PORTFOLIO THEME SWITCHER (SOLID SKY / CYAN THEME) ================= */}
          <div style={{ top: "150px", zIndex: 12 }} className="sticky">
            <MagneticCard
              className={`rounded-[32px] border p-8 sm:p-9 shadow-2xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#091a27] border-sky-900/50 shadow-black/80"
                  : "bg-[#f0f9ff] border-sky-200/80 shadow-sky-200/40"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Side */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-medium text-sky-500 dark:text-sky-400">/03</span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium tracking-wider uppercase bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                          PORTFOLIO GAP
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-sky-500 text-white shadow-md shadow-sky-500/20 anim-float">
                        <Globe2 className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-normal tracking-tight leading-snug">
                        <span className="text-sky-600 dark:text-sky-400 block">The Dead-End Static PDF,</span>
                        <span className={isDarkMode ? "text-white" : "text-slate-900"}>
                          stand out with 1-click responsive live web portfolios.
                        </span>
                      </h3>
                      <p className={`text-sm sm:text-[15px] font-light leading-relaxed tracking-normal ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                        A static PDF file cannot showcase your deployed applications, GitHub code, or interactive
                        work to tech leads and hiring managers looking for verified proof of engineering talent.
                      </p>
                    </div>
                  </div>

                  {/* Solid Solution Callout */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDarkMode
                        ? "bg-[#06111a] border-sky-900/60 text-zinc-100"
                        : "bg-white border-sky-200/80 text-slate-900 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>SmartNShine Fix: 1-Click Hosted Developer Portfolio</span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                      SmartNShine automatically transforms your resume data into a responsive live web portfolio with
                      GitHub repository sync and a shareable public URL.
                    </p>
                  </div>
                </div>

                {/* Right Side: Solid Theme Playground */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl border ${
                    isDarkMode
                      ? "bg-[#06111a] border-sky-900/50 text-zinc-100"
                      : "bg-white border-sky-200/80 text-slate-900 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-sky-900/40">
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                      Switch Theme Live:
                    </span>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-sky-50/60 dark:bg-[#0c2233] border border-sky-200/70 dark:border-sky-900/60">
                      {["magazine", "tech", "minimal"].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setPortfolioTheme(theme)}
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider transition-all cursor-pointer ${
                            portfolioTheme === theme
                              ? "bg-sky-500 text-white shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`my-4 p-3.5 rounded-xl border min-h-[160px] flex flex-col justify-between ${
                      isDarkMode
                        ? "bg-[#0c2233] border-sky-900/50 text-zinc-100"
                        : "bg-sky-50/40 border-sky-200/60 text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-sky-100 dark:border-sky-900/40">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-sky-600 dark:text-sky-300 font-medium">
                        <Globe2 className="w-3 h-3 text-sky-500" />
                        <span>smartnshine.in/p/alex-dev</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded font-mono font-medium bg-sky-500 text-white">
                        {portfolioTheme.toUpperCase()} THEME
                      </span>
                    </div>

                    <div className="py-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-900 dark:text-white">Alex Mercer</span>
                        <span className="text-[10px] font-mono text-amber-500 font-medium">14 Repos • 420 ⭐</span>
                      </div>
                      <p className="text-[11px] font-light text-slate-600 dark:text-zinc-400 line-clamp-1">
                        Full-Stack Engineer building distributed systems & high-throughput apps.
                      </p>
                      <div className="flex gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          React 19
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          TypeScript
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Node.js
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-[10px] text-zinc-400 font-light">
                      <span>Click theme buttons to preview</span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium">1-Click Live Deploy</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-light">
                    <span>Mobile & Desktop Responsive</span>
                    <span className="text-sky-600 dark:text-sky-400 font-medium">Subdomain Included</span>
                  </div>
                </div>
              </div>
            </MagneticCard>
          </div>

          {/* ================= CARD 4: LIVE AI STAR BULLET REWRITER (SOLID ROYAL PURPLE THEME) ================= */}
          <div style={{ top: "175px", zIndex: 13 }} className="sticky">
            <MagneticCard
              className={`rounded-[32px] border p-8 sm:p-9 shadow-2xl transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#170e24] border-purple-900/50 shadow-black/80"
                  : "bg-[#f8f4ff] border-purple-200/80 shadow-purple-200/40"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Side */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-medium text-purple-500 dark:text-purple-400">/04</span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium tracking-wider uppercase bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          IMPACT REWRITING
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-500 text-white shadow-md shadow-purple-500/20 anim-float">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-normal tracking-tight leading-snug">
                        <span className="text-purple-600 dark:text-purple-400 block">The Passive Duty List Trap,</span>
                        <span className={isDarkMode ? "text-white" : "text-slate-900"}>
                          turn raw notes into quantified STAR achievement metrics.
                        </span>
                      </h3>
                      <p className={`text-sm sm:text-[15px] font-light leading-relaxed tracking-normal ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                        Listing generic daily tasks without measurable business ROI causes recruiters to skim and
                        pass. Hiring managers look for quantified STAR achievement statements.
                      </p>
                    </div>
                  </div>

                  {/* Solid Solution Callout */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDarkMode
                        ? "bg-[#0e0717] border-purple-900/60 text-zinc-100"
                        : "bg-white border-purple-200/80 text-slate-900 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>SmartNShine Fix: AI Quantified STAR Metric Rewriter</span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                      Our AI re-engineers passive duties into quantified STAR bullets (Action + Context + Quantified
                      Outcome) that clearly prove your technical impact.
                    </p>
                  </div>
                </div>

                {/* Right Side: Solid AI Bullet Rewriter */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl border ${
                    isDarkMode
                      ? "bg-[#0e0717] border-purple-900/50 text-zinc-100"
                      : "bg-white border-purple-200/80 text-slate-900 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-900/40">
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                      Live AI STAR Engine:
                    </span>
                    <button
                      onClick={handleTriggerRewrite}
                      disabled={isRewriting}
                      className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3 h-3 ${isRewriting ? "animate-spin" : ""}`} />
                      <span>{isRewriting ? "Optimizing..." : "✨ AI Enhance"}</span>
                    </button>
                  </div>

                  <div
                    className={`my-4 p-4 rounded-xl border min-h-[160px] flex flex-col justify-center space-y-2.5 ${
                      isDarkMode
                        ? "bg-[#1f1230] border-purple-900/50 text-zinc-100"
                        : "bg-purple-50/40 border-purple-200/60 text-slate-900"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-medium text-rose-500 block">
                        ❌ RAW CANDIDATE DRAFT:
                      </span>
                      <p className="text-xs font-light text-slate-600 dark:text-zinc-400 italic">
                        "Worked on improving database queries and made backend API faster."
                      </p>
                    </div>

                    <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40">
                      <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 block mb-1">
                        ⚡ QUANTIFIED STAR REWRITE:
                      </span>
                      {isRewriting ? (
                        <div className="flex items-center gap-2 text-xs font-mono text-purple-600 dark:text-purple-400 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>AI analyzing STAR impact metrics...</span>
                        </div>
                      ) : showRewritten ? (
                        <motion.p
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-slate-900 dark:text-zinc-100 font-medium leading-relaxed"
                        >
                          "Architected async Redis caching layer across 8 microservices, cutting API response
                          latency by 43% for 150K daily active users."
                        </motion.p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-light">
                    <span>Recruiter Callback Multiplier</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium font-mono text-[11px]">
                      +68% HIGHER RESPONSE
                    </span>
                  </div>
                </div>
              </div>
            </MagneticCard>
          </div>
        </div>

        {/* Bottom Fast-Track Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${
            isDarkMode
              ? "bg-[#141520] border-zinc-800 shadow-xl"
              : "bg-white border-slate-200 shadow-lg"
          }`}
        >
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">
              Avoid the traps. Build your ATS resume with confidence.
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-500 dark:text-zinc-400">
              No credit card required to start. Free tier includes live ATS diagnostic score and clean PDF export.
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Start Building for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}


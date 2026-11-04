import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Cpu,
  Trophy,
  CheckCircle2,
  ArrowRight,
  FileText,
  Github,
  Sparkles,
  ShieldCheck,
  Bot,
  ExternalLink,
  Code2,
  BarChart3,
  Layers
} from "lucide-react";

export default function CareerJourneyTimeline() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const steps = [
    {
      id: "ingest",
      stepNumber: "01",
      title: "Ingest & Parse Experience",
      subtitle: "Instant extraction with zero formatting loss",
      tag: "STEP 1: INGESTION",
      description:
        "Upload any PDF, paste raw career notes, or connect your GitHub profile. Our intelligent parser extracts skills, projects, and roles without table corruption or broken formatting.",
      icon: UploadCloud,
      color: "blue",
      metrics: ["PDF / DOCX Ingestion", "GitHub Repo Auto-Import", "Clean JSON Schema"],
    },
    {
      id: "optimize",
      stepNumber: "02",
      title: "AI ATS Optimization & Scoring",
      subtitle: "Engineered for Taleo, Workday & Greenhouse",
      tag: "STEP 2: ENHANCEMENT",
      description:
        "Our engine checks your resume against real job descriptions, highlights missing keywords, upgrades weak bullet points using the STAR method, and brings your ATS match score above 95%.",
      icon: Cpu,
      color: "emerald",
      metrics: ["STAR Method Rewriter", "Taleo / Workday Audit", "Missing Keyword Injector"],
    },
    {
      id: "deploy",
      stepNumber: "03",
      title: "Mock Interview & Portfolio Launch",
      subtitle: "From polished resume to accepted offer",
      tag: "STEP 3: VICTORY",
      description:
        "Export pixel-perfect vector PDFs, practice role-tailored AI voice mock interviews with instant feedback, and publish a responsive developer portfolio in one click.",
      icon: Trophy,
      color: "blue",
      metrics: ["Pixel-Perfect Vector PDF", "AI Voice Interview Coach", "Live Portfolio URL"],
    },
  ];

  // Auto cycle every 6 seconds unless user manually interacts
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, steps.length]);

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-scoutie">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold tracking-wide shadow-xs mb-4">
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>END-TO-END CAREER PIPELINE</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
          From Raw Experience to Offer Letter. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-400 dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-500">
            A seamless 3-step engine.
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
          Everything you need to bypass recruitment algorithms and ace your technical & behavioral rounds.
        </p>
      </div>

      {/* Interactive Timeline Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => {
                setActiveStep(index);
                setIsAutoPlaying(false);
              }}
              className={`group text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? "bg-white dark:bg-[#0f141e] border-zinc-900 dark:border-zinc-100 shadow-xl"
                  : "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 hover:bg-white dark:hover:bg-[#0f141e] hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              {/* Active Step Progress Indicator Line */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute top-0 left-0 right-0 h-1 bg-zinc-900 dark:bg-white"
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500">
                  {step.stepNumber}
                </span>
                <span
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {step.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Step Interactive Showcase Stage */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f141e] p-6 sm:p-10 shadow-2xl overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Left: Explanatory Content */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {steps[activeStep].tag}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-snug">
                {steps[activeStep].title}
              </h3>

              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                {steps[activeStep].description}
              </p>

              {/* Bullet Highlights */}
              <div className="space-y-2.5 pt-2">
                {steps[activeStep].metrics.map((metric, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                >
                  <span>Explore next phase ({steps[(activeStep + 1) % steps.length].stepNumber})</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right: Live Mockup / Visual Demonstration */}
            <div className="lg:col-span-7 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-5 sm:p-7">
              {/* STAGE 1: INGESTION MOCKUP */}
              {activeStep === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      PARSER PIPELINE: ACTIVE
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      OCR & STRUCTURE CLEAN
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">resume_v3_draft.pdf</div>
                        <div className="text-[10px] text-zinc-500">Parsed in 420ms • Full text fidelity</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                      <Github className="w-6 h-6 text-zinc-900 dark:text-zinc-100 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">github.com/alex-dev</div>
                        <div className="text-[10px] text-zinc-500">4 Top repos & tech stack synced</div>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Data Visual Cards */}
                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                    <div className="text-zinc-500 font-semibold text-[11px]">EXTRACTED EXPERIENCE DATA</div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
                        TypeScript / React (4+ yrs)
                      </span>
                      <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
                        Node.js Microservices
                      </span>
                      <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
                        Distributed PostgreSQL
                      </span>
                      <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">
                        AWS ECS / Docker
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: AI OPTIMIZATION MOCKUP */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      ATS MATCH SCORE ENGINE
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      98% WORKDAY MATCH
                    </span>
                  </div>

                  {/* Score Progression Meter */}
                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-500 font-semibold">ATS Readiness Score</div>
                      <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono mt-0.5">
                        68% <span className="text-emerald-500 font-bold">→ 98%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Guaranteed ATS Pass
                      </span>
                    </div>
                  </div>

                  {/* Real-time Bullet Improvement Visual */}
                  <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        AI STAR Method Bullet Generator
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">GPT-4o Optimized</span>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                      "Engineered zero-downtime database migration for 3.2M records, improving write throughput by 42% and eliminating query timeouts."
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 3: LAUNCH, INTERVIEW & PORTFOLIO MOCKUP */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      DELIVERABLES: READY FOR APPLICATIONS
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      ALL ASSETS GENERATED
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Live Portfolio Card */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Web Portfolio</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate">
                        smartnshine.in/u/alex-dev
                      </div>
                      <div className="text-[10px] text-zinc-500">Live responsive portfolio with interactive project showcases.</div>
                    </div>

                    {/* AI Mock Interview Card */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">AI Mock Studio</span>
                        <Bot className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Top 5% Behavioral Score
                      </div>
                      <div className="text-[10px] text-zinc-500">Real-time STAR evaluation & audio response coaching.</div>
                    </div>
                  </div>

                  {/* Pixel-Perfect PDF Export Badge */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400 dark:text-blue-600" />
                      <span>Pixel-Perfect Vector PDF (ATS Certified)</span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">Instant Download</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

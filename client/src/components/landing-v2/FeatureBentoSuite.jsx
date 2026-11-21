import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Mic,
  Volume2,
  Github,
  Globe,
  Briefcase,
  Layers,
  Cpu,
  Zap,
  BarChart3,
  Bot
} from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";

export default function FeatureBentoSuite() {
  const { isDarkMode } = useDarkMode();
  const [activeJobRole, setActiveJobRole] = useState("fullstack");
  const [isAiSpeaking, setIsAiSpeaking] = useState(true);

  const roleScenarios = {
    fullstack: {
      role: "Senior Full Stack Engineer",
      company: "Stripe / CloudScale",
      score: 98,
      matched: ["TypeScript", "React 19", "Node.js", "PostgreSQL", "Distributed Systems", "Kubernetes", "AWS ECS", "GraphQL"],
      missing: ["Kafka Event Bus"],
      advice: "Add 1 quantifiable bullet on event streaming or queue architecture to reach a top 98%+ Workday match.",
    },
    devops: {
      role: "Lead Cloud Systems Architect",
      company: "Enterprise Cloud Platforms",
      score: 99,
      matched: ["Kubernetes", "Terraform IaC", "AWS Multi-Region", "Prometheus", "Grafana", "Linux Kernel", "Docker", "GitOps"],
      missing: [],
      advice: "98%+ ATS match across Taleo and Greenhouse. Ready for direct hiring manager pipeline.",
    },
    ai: {
      role: "AI / Machine Learning Engineer",
      company: "Anthropic / OpenAI",
      score: 96,
      matched: ["Python", "PyTorch", "LLM Fine-Tuning", "Vector DBs", "FastAPI", "CUDA Optimization", "LangChain"],
      missing: ["Triton Inference Server"],
      advice: "Highlight production model latency metrics (e.g. <25ms p99 inference) for top-percentile ranking.",
    },
  };

  const currentRole = roleScenarios[activeJobRole];

  return (
    <section className={`relative py-24 px-6 sm:px-10 lg:px-16 overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-[#07080c] text-zinc-100" : "bg-[#fbfbfa] text-slate-900"
    }`}>
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[150px] bg-blue-600/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wide shadow-xs transition-colors bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Everything you need to <br />
            <span className="text-blue-600 dark:text-blue-400">command high-tier engineering offers.</span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${
            isDarkMode ? "text-zinc-400" : "text-slate-600"
          }`}>
            An integrated operating system for your career. Build verified ATS resumes, publish live portfolio websites, diagnose keyword gaps, and ace AI mock interview rooms.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BENTO GRID MATRIX (4 Powerful Interactive Cards)                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* CARD 1 (7 Columns): Real-Time ATS Scanner & Keyword Engine */}
          <div className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl text-left ${
            isDarkMode
              ? "bg-[#0b0e17] border-zinc-800 hover:border-blue-500/50 shadow-blue-500/5"
              : "bg-white border-zinc-200 hover:border-blue-500 shadow-xl shadow-slate-200/50"
          }`}>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">ATS Diagnostic Engine</h3>
                    <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                      Live ATS simulation against Workday, Taleo & Greenhouse
                    </p>
                  </div>
                </div>

                {/* Role Switcher */}
                <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
                  isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-slate-100 border-zinc-200"
                }`}>
                  <button
                    onClick={() => setActiveJobRole("fullstack")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeJobRole === "fullstack"
                        ? "bg-blue-600 text-white shadow-xs"
                        : isDarkMode ? "text-zinc-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Full Stack
                  </button>
                  <button
                    onClick={() => setActiveJobRole("devops")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeJobRole === "devops"
                        ? "bg-blue-600 text-white shadow-xs"
                        : isDarkMode ? "text-zinc-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Cloud / SRE
                  </button>
                  <button
                    onClick={() => setActiveJobRole("ai")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeJobRole === "ai"
                        ? "bg-blue-600 text-white shadow-xs"
                        : isDarkMode ? "text-zinc-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    AI / ML
                  </button>
                </div>
              </div>

              {/* Interactive Score Meter */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-5 ${
                isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-slate-50 border-zinc-200"
              }`}>
                <div className="space-y-1 text-left w-full sm:w-auto">
                  <div className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>TARGET ROLE: {currentRole.role}</span>
                  </div>
                  <div className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
                    Benchmarked across 4,800+ verified recruiter screenings
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-500">
                      {currentRole.score}%
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">ATS PASS SCORE</div>
                  </div>
                </div>
              </div>

              {/* Matched Keywords Grid */}
              <div className="space-y-2.5">
                <div className={`text-xs font-bold ${isDarkMode ? "text-zinc-400" : "text-slate-700"}`}>
                  MATCHED HARD SKILLS ({currentRole.matched.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentRole.matched.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {skill}
                    </span>
                  ))}
                  {currentRole.missing.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      Missing: {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actionable Recruiter Advice */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                isDarkMode ? "bg-blue-950/20 border-blue-900/40 text-blue-300" : "bg-blue-50/80 border-blue-200 text-blue-900 font-medium"
              }`}>
                💡 <span className="font-bold">Recruiter Insight:</span> {currentRole.advice}
              </div>
            </div>

            <div className="pt-6 border-t mt-6 flex items-center justify-between">
              <span className={`text-xs font-mono ${isDarkMode ? "text-zinc-500" : "text-slate-500"}`}>
                Zero keyword stuffing • 95+ semantic NLP match
              </span>
              <Link
                to="/ats-analyzer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Audit My Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 2 (5 Columns): Real-Time AI Mock Interview Studio */}
          <div className={`lg:col-span-5 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl text-left ${
            isDarkMode
              ? "bg-[#0b0e17] border-zinc-800 hover:border-indigo-500/50 shadow-indigo-500/5"
              : "bg-white border-zinc-200 hover:border-indigo-500 shadow-xl shadow-slate-200/50"
          }`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">AI Interview Studio</h3>
                    <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                      Live speech & technical mock rounds
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE SIM
                </span>
              </div>

              {/* AI Question Room Mockup */}
              <div className={`p-4 rounded-2xl border space-y-3 font-mono ${
                isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-slate-50 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-indigo-500" /> System Design Round
                  </span>
                  <span>03:42 elapsed</span>
                </div>

                <div className={`text-xs font-semibold leading-relaxed ${
                  isDarkMode ? "text-zinc-200" : "text-slate-800"
                }`}>
                  "How would you design a fault-tolerant rate limiter handling 100,000 requests per second across a global CDN?"
                </div>

                {/* Animated Speech Waveform */}
                <div className="h-10 flex items-center justify-center gap-1 bg-indigo-500/10 rounded-xl px-4">
                  {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 65, 35, 80, 50, 95, 40].map((height, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-indigo-500 transition-all duration-300 animate-pulse"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 75}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* AI Feedback Rubric Score */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className={`p-2.5 rounded-xl border ${
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-zinc-200"
                }`}>
                  <div className="text-sm font-extrabold text-emerald-500">97%</div>
                  <div className="text-[9px] text-zinc-500">TECHNICAL DEPTH</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-zinc-200"
                }`}>
                  <div className="text-sm font-extrabold text-blue-500">95%</div>
                  <div className="text-[9px] text-zinc-500">STAR STRUCTURE</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-slate-50 border-zinc-200"
                }`}>
                  <div className="text-sm font-extrabold text-indigo-500">99%</div>
                  <div className="text-[9px] text-zinc-500">CLARITY</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-6 flex items-center justify-between">
              <span className={`text-xs font-mono ${isDarkMode ? "text-zinc-500" : "text-slate-500"}`}>
                Real-time audio + code evaluations
              </span>
              <Link
                to="/interview/preview"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>Start Mock Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 3 (6 Columns): 1-Click Web Portfolio Cloud Engine */}
          <div className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl text-left ${
            isDarkMode
              ? "bg-[#0b0e17] border-zinc-800 hover:border-cyan-500/50 shadow-cyan-500/5"
              : "bg-white border-zinc-200 hover:border-cyan-500 shadow-xl shadow-slate-200/50"
          }`}>
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">1-Click Live Web Portfolios</h3>
                  <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                    Instantly turn your resume & GitHub into a live showcase
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-3 font-mono ${
                isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-slate-50 border-zinc-200"
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-500 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Live Subdomain
                  </span>
                  <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                    SSL SECURED • FAST CDN
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border text-xs truncate ${
                  isDarkMode ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-slate-800 font-bold"
                }`}>
                  https://smartnshine.in/p/alexmorgan
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>GitHub Repos Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>Interactive 3D Themes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>Live Visitor Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>Custom CV Download</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-6 flex items-center justify-between">
              <span className={`text-xs font-mono ${isDarkMode ? "text-zinc-500" : "text-slate-500"}`}>
                Zero hosting configuration needed
              </span>
              <Link
                to="/portfolio/new"
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                <span>Launch Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 4 (6 Columns): Smart Job Matching & Application Tracker */}
          <div className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl text-left ${
            isDarkMode
              ? "bg-[#0b0e17] border-zinc-800 hover:border-purple-500/50 shadow-purple-500/5"
              : "bg-white border-zinc-200 hover:border-purple-500 shadow-xl shadow-slate-200/50"
          }`}>
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Smart Job Matching & Copilot</h3>
                  <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                    AI-matched openings based on your verified skill stack
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border space-y-1 ${
                  isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-slate-50 border-zinc-200"
                }`}>
                  <div className="text-xs font-bold text-purple-500">SALARY RADAR</div>
                  <div className="text-lg font-extrabold font-mono">$165K – $210K</div>
                  <div className="text-[10px] text-zinc-500">Market benchmark for your stack</div>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${
                  isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-slate-50 border-zinc-200"
                }`}>
                  <div className="text-xs font-bold text-emerald-500">ACTIVE MATCHES</div>
                  <div className="text-lg font-extrabold font-mono">14 Roles</div>
                  <div className="text-[10px] text-zinc-500">95%+ ATS alignment score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span>Automated Cover Letters</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span>Recruiter Outreach Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span>Application Status Tracker</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span>Interview Schedule Sync</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-6 flex items-center justify-between">
              <span className={`text-xs font-mono ${isDarkMode ? "text-zinc-500" : "text-slate-500"}`}>
                Find high-match opportunities faster
              </span>
              <Link
                to="/job-search"
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>Explore Smart Match</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

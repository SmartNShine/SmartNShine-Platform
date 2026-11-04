import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  ScanSearch,
  Globe,
  GitPullRequest,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Terminal,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../../context/DarkModeContext";

const INSPECTOR_FEATURES = [
  {
    id: "ats-parser",
    title: "Single-Column ATS Syntax Validator",
    badge: "Workday & Lever Tested",
    icon: FileCheck2,
    shortDesc: "Compiles clean semantic LaTeX/HTML that machine parsers can read without missing a single word.",
    drawerData: {
      type: "ats",
      headline: "Live ATS Parse Simulation",
      subline: "Tested across Workday, Greenhouse, Taleo & Lever engines",
      score: "99.4%",
      scoreLabel: "Parsing Fidelity Score",
      metrics: [
        { label: "Layout Structure", val: "Single-Column Semantic", status: "pass" },
        { label: "Header Extraction", val: "99% Recognized", status: "pass" },
        { label: "Fonts & Bounding Boxes", val: "Zero Hidden Frames", status: "pass" },
        { label: "Canva / Graphic Output", val: "Failed (Layer Collision)", status: "fail" },
      ],
      codeSnippet: `// Workday ATS Parser Stream
✓ Candidate Name: Alex Mercer
✓ Primary Stack: TypeScript, React, Node.js
✓ Work Experience: 5.2 Years Extracted
✓ Total Parsing Errors: 0`,
    },
  },
  {
    id: "jd-scanner",
    title: "Real-Time Job Description Gap Matcher",
    badge: "AI Semantic Scan",
    icon: ScanSearch,
    shortDesc: "Pastes any target job description to pinpoint missing high-frequency keywords and skills.",
    drawerData: {
      type: "jd",
      headline: "Target JD Semantic Matcher",
      subline: "Role: Senior Full-Stack Engineer @ Stripe",
      score: "94%",
      scoreLabel: "Recruiter Keyword Match",
      matchedKeywords: ["React 19", "TypeScript", "Distributed Systems", "PostgreSQL", "REST APIs"],
      missingKeywords: ["Redis Caching", "Docker Containerization", "CI/CD Workflows"],
      quickFix: "1-Click inject missing high-frequency keywords into matching work experience bullets.",
    },
  },
  {
    id: "live-portfolio",
    title: "1-Click Hosted Developer Portfolio",
    badge: "Custom Vanity Link",
    icon: Globe,
    shortDesc: "Turns structured resume data into a fast, responsive public website with live project showcases.",
    drawerData: {
      type: "portfolio",
      headline: "Live Deployed Web Profile",
      subline: "URL: https://smartnshine.in/p/alex-mercer",
      score: "100/100",
      scoreLabel: "Google Lighthouse Speed",
      features: [
        "Live Magazine, Tech & Minimalist Themes",
        "Responsive Mobile, Tablet & Desktop View",
        "Direct Contact Form & PDF Download Buttons",
        "Zero Web Hosting or Domain Setup Fees",
      ],
      competitorNote: "Canva / Zety / Word only provide static downloadable files.",
    },
  },
  {
    id: "github-sync",
    title: "One-Click GitHub Repository Sync",
    badge: "Automated Import",
    icon: GitPullRequest,
    shortDesc: "Imports verified public repositories, language statistics, and contribution activity automatically.",
    drawerData: {
      type: "github",
      headline: "GitHub Developer Sync",
      subline: "Connected Account: @alex-mercer (Verified)",
      score: "18 Repos",
      scoreLabel: "Repositories & Commits Synced",
      stats: [
        { lang: "TypeScript", pct: "64%" },
        { lang: "Go", pct: "22%" },
        { lang: "Python", pct: "14%" },
      ],
      pinnedRepos: [
        { name: "distributed-cache-engine", stars: "420 ⭐", desc: "High-throughput in-memory key-value store" },
        { name: "react-flow-dashboard", stars: "185 ⭐", desc: "Real-time analytics UI dashboard" },
      ],
    },
  },
  {
    id: "star-bullets",
    title: "AI STAR Metric Quantified Bullet Rewriter",
    badge: "Quantified Impact",
    icon: Sparkles,
    shortDesc: "Converts weak task lists into high-impact, outcome-focused accomplishment statements.",
    drawerData: {
      type: "star",
      headline: "STAR Metric Bullet Transformer",
      subline: "Transforms vague duties into quantified ROI statements",
      score: "+68%",
      scoreLabel: "Higher Recruiter Callback Rate",
      before: "Helped maintain the backend microservices and improved system speed.",
      after:
        "Architected async Redis caching layer across 8 microservices, reducing API response latency by 43% for 150K daily active users.",
      breakdown: [
        { tag: "Action", text: "Architected async Redis caching" },
        { tag: "Context", text: "Across 8 microservices" },
        { tag: "Metric", text: "43% latency reduction • 150K DAU" },
      ],
    },
  },
];

export default function FeatureInspectorSection() {
  const { isDarkMode } = useDarkMode();
  const [activeTabId, setActiveTabId] = useState("ats-parser");
  const activeFeature = INSPECTOR_FEATURES.find((f) => f.id === activeTabId) || INSPECTOR_FEATURES[0];
  const data = activeFeature.drawerData;

  return (
    <section
      id="feature-inspector"
      className={`relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300 border-t ${
        isDarkMode
          ? "bg-[#06070a] border-zinc-800/80 text-zinc-100"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[700px] h-[450px] rounded-full blur-[160px] bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-indigo-500/10 dark:from-blue-600/15 dark:via-cyan-500/15 dark:to-indigo-500/15" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium uppercase tracking-wider ${
              isDarkMode
                ? "bg-zinc-900 border-zinc-800 text-cyan-400"
                : "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Feature Inspector</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            See the Technology{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500">
              Under the Hood.
            </span>
          </h2>

          <p
            className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
              isDarkMode ? "text-zinc-400" : "text-slate-600"
            }`}
          >
            Explore each core capability to see how SmartNShine gives candidates an unfair hiring advantage.
          </p>
        </motion.div>

        {/* Split Screen Grid (Left Checklist, Right Live Inspector Drawer) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Feature List (5 cols) */}
          <div className="lg:col-span-5 space-y-3 flex flex-col justify-center">
            {INSPECTOR_FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isSelected = activeTabId === feature.id;

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTabId(feature.id)}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 cursor-pointer relative ${
                    isSelected
                      ? isDarkMode
                        ? "bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-500/10 text-white"
                        : "bg-blue-50/80 border-blue-400 shadow-md shadow-blue-500/5 text-slate-900"
                      : isDarkMode
                      ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {/* Left Icon Pill */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-blue-400/40 shadow-sm"
                        : isDarkMode
                        ? "bg-zinc-900 border-zinc-800 text-zinc-400"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold leading-tight">{feature.title}</h3>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {feature.badge}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 pt-0.5">
                      {feature.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Live Preview Drawer (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              className={`flex-1 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden backdrop-blur-md shadow-2xl transition-all ${
                isDarkMode
                  ? "bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800/90 shadow-black/60"
                  : "bg-gradient-to-b from-slate-50 to-white border-slate-200/90 shadow-slate-200/70"
              }`}
            >
              {/* Drawer Content Switcher */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  {/* Drawer Header */}
                  <div className="flex items-start justify-between border-b pb-4 border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {data.headline}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{data.subline}</p>
                    </div>

                    {/* Live Score Callout Badge */}
                    <div className="text-right">
                      <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400">
                        {data.score}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {data.scoreLabel}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Body Content based on feature type */}
                  {data.type === "ats" && (
                    <div className="space-y-4">
                      {/* Metric Checkpoints */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {data.metrics.map((m, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                              m.status === "pass"
                                ? isDarkMode
                                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                                  : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                : isDarkMode
                                ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                                : "bg-rose-50/70 border-rose-200 text-rose-900"
                            }`}
                          >
                            <span className="font-medium text-slate-700 dark:text-zinc-300">{m.label}</span>
                            <span className="font-bold">{m.val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Code Output Visualizer */}
                      <div
                        className={`p-4 rounded-xl border font-mono text-xs overflow-x-auto ${
                          isDarkMode ? "bg-black/80 border-zinc-800 text-emerald-400" : "bg-slate-900 text-emerald-300"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap">{data.codeSnippet}</pre>
                      </div>
                    </div>
                  )}

                  {data.type === "jd" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Matched Recruiter Keywords (5/5):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {data.matchedKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            >
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          ⚠️ Missing Keywords Detected (Click to Inject):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {data.missingKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            >
                              + {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isDarkMode ? "bg-blue-950/30 border-blue-500/30 text-blue-200" : "bg-blue-50 border-blue-200 text-blue-950"
                        }`}
                      >
                        💡 {data.quickFix}
                      </div>
                    </div>
                  )}

                  {data.type === "portfolio" && (
                    <div className="space-y-4">
                      <div
                        className={`p-4 rounded-xl border space-y-2.5 ${
                          isDarkMode ? "bg-zinc-950/60 border-zinc-800" : "bg-white border-slate-200 shadow-sm"
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-cyan-500">Live Website Features:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {data.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-300 font-medium">
                        ✨ {data.competitorNote}
                      </div>
                    </div>
                  )}

                  {data.type === "github" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">Language Breakdown:</span>
                        <div className="flex gap-2">
                          {data.stats.map((s, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 p-2.5 rounded-xl border text-center ${
                                isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200 shadow-sm"
                              }`}
                            >
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{s.lang}</div>
                              <div className="text-[11px] font-mono text-blue-500">{s.pct}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">Pinned Repositories Synced:</span>
                        <div className="space-y-1.5">
                          {data.pinnedRepos.map((repo, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200"
                              }`}
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">{repo.name}</span>
                                <p className="text-[11px] text-zinc-400">{repo.desc}</p>
                              </div>
                              <span className="text-xs font-mono font-bold text-amber-400">{repo.stars}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {data.type === "star" && (
                    <div className="space-y-4">
                      <div
                        className={`p-3 rounded-xl border space-y-1 text-xs ${
                          isDarkMode ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50 border-rose-200"
                        }`}
                      >
                        <span className="font-mono font-bold text-rose-500">❌ Original Task List:</span>
                        <p className="text-zinc-500 dark:text-zinc-400 italic">"{data.before}"</p>
                      </div>

                      <div
                        className={`p-3 rounded-xl border space-y-1 text-xs ${
                          isDarkMode ? "bg-emerald-950/20 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        <span className="font-mono font-bold text-emerald-500">⚡ Quantified STAR Rewrite:</span>
                        <p className="text-slate-900 dark:text-zinc-100 font-medium">"{data.after}"</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {data.breakdown.map((b, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-center text-[10px] ${
                              isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200"
                            }`}
                          >
                            <span className="font-mono font-bold text-blue-500 block uppercase">{b.tag}</span>
                            <span className="text-zinc-600 dark:text-zinc-400 line-clamp-1">{b.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drawer Footer Action */}
                  <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Included across all resume templates
                    </span>

                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-md shadow-blue-500/20 transition-all hover:scale-105"
                    >
                      <span>Try This Feature Free</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

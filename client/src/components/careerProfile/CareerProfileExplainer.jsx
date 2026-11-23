import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  MessageSquareQuote,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    id: "copy-paste",
    title: "1-Click Copy & Paste for Job Applications",
    subtitle: "Workday • Greenhouse • Lever • Taleo • LinkedIn",
    badge: "Fast Application Copilot",
    icon: Copy,
    accentColor: "from-blue-600 to-cyan-600",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-500/10 text-blue-600 dark:text-cyan-400",
    description:
      "Keep this Master Profile tab open while applying for jobs. Instead of re-typing your experience, bio, dates, and skill bullets for every company portal, copy your verified data directly into application form textboxes in seconds.",
    actionText: "Keep Profile Updated",
    highlights: [
      "Instant copy for Work History & Achievements",
      "One-click Bio & Professional Headline copying",
      "Categorized Technical Skills & Tech Stacks",
    ],
  },
  {
    id: "career-qa",
    title: "Application Questions & Answers (Career Q&A)",
    subtitle: "Custom Portal Behavioral & Project Questions",
    badge: "Verified Answers",
    icon: MessageSquareQuote,
    accentColor: "from-blue-600 to-indigo-600",
    borderClass: "border-indigo-500/30",
    bgClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    description:
      "When job application forms ask open-ended questions like 'Describe a complex project you built' or 'Why are you a fit for this role?', open Career Q&A to copy tailored, AI-crafted answers based on your actual verified achievements.",
    actionText: "Open Career Q&A Hub",
    actionLink: "/career-qa",
    highlights: [
      "Copy STAR-method answers for application textboxes",
      "Role-specific project & technical explanations",
      "Tailored responses ready to paste directly",
    ],
  },
];

export default function CareerProfileExplainer() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStep, setSelectedStep] = useState("copy-paste");

  const activeStep = WORKFLOW_STEPS.find((s) => s.id === selectedStep) || WORKFLOW_STEPS[0];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl shadow-xs transition-all">
      {/* Decorative ambient gradients */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/10 dark:bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-cyan-600/10 dark:bg-cyan-500/15 blur-3xl" />

      {/* Header Banner & Collapse Toggle */}
      <div className="p-5 sm:p-7 border-b border-gray-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider border border-blue-500/20">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Job Application Copilot
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 hidden sm:inline">
              • Central Copy & Paste Vault
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            How to Use Your Career Profile While Applying for Jobs
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 font-medium max-w-3xl leading-relaxed">
            Keep this vault open whenever you are filling out job portals (Workday, Greenhouse, Lever, LinkedIn). Copy your verified experience, bio, and skills directly from here, and copy application questions from <strong className="text-gray-900 dark:text-white font-black">Career Q&A</strong>!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Link
            to="/career-qa"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-black transition-all"
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Go to Career Q&A</span>
          </Link>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/10 transition-all cursor-pointer"
          >
            <span>{isExpanded ? "Hide Guide" : "How It Works"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Showcase */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="p-5 sm:p-7 space-y-6"
          >
            {/* 2 Clickable Workflow Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WORKFLOW_STEPS.map((step) => {
                const Icon = step.icon;
                const isSelected = selectedStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStep(step.id)}
                    className={`relative p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-zinc-800/90 shadow-lg border-blue-500/40 ring-2 ring-blue-500/20 scale-[1.01]"
                        : "bg-gray-50/70 dark:bg-zinc-900/40 border-gray-200/60 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className={`w-9 h-9 rounded-xl ${step.bgClass} flex items-center justify-center`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                        {step.badge}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-blue-600 dark:text-cyan-400 font-bold mt-0.5 truncate">
                      {step.subtitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
                      {step.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Workflow Detailed Sandbox */}
            <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-cyan-500/5 dark:from-zinc-900/80 dark:to-zinc-950/80 border border-blue-500/20 grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${activeStep.bgClass} flex items-center justify-center`}>
                    <ActiveIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                    Step Workflow: {activeStep.title}
                  </span>
                </div>
                <h4 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  {activeStep.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {activeStep.description}
                </p>

                {/* Key Checklist */}
                <div className="grid sm:grid-cols-3 gap-2 pt-2">
                  {activeStep.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-800/70 p-2.5 rounded-xl border border-gray-200/60 dark:border-white/5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Trigger Box */}
              <div className="lg:col-span-4 flex flex-col justify-center space-y-3 bg-white dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 text-center shadow-md">
                <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Quick Action
                </span>

                {activeStep.id === "career-qa" ? (
                  <Link
                    to="/career-qa"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <MessageSquareQuote className="w-4 h-4" />
                    <span>Open Career Q&A Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Fill your profile below and copy directly into job portals anytime!</span>
                  </div>
                )}

                <span className="text-[10px] text-gray-500 dark:text-zinc-500">
                  Ready to copy whenever you apply for jobs
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

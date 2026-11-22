import React from "react";
import { Upload, Cpu, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDarkMode } from "../../context/DarkModeContext";
import Dashboard3DButton from "@/components/dashboard/Dashboard3DButton";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Paste your experience",
    description: "Drop in rough draft bullets, your LinkedIn bio, or GitHub project notes. Zero complex formatting required.",
    details: ["Raw text or PDF upload", "GitHub repository import", "LinkedIn bio auto-detect"],
    iconBg: "bg-purple-100 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60",
    iconColor: "text-purple-600 dark:text-purple-400",
    glow: "hover:shadow-purple-500/15 hover:border-purple-500/30",
    numberColor: "text-purple-300/40 dark:text-purple-900/40",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI builds your resume",
    description: "SmartNShine rewrites every bullet into quantified STAR format, injects verified ATS keywords, and scores your target match.",
    details: ["Quantified STAR bullet rewrites", "ATS keyword gap injection", "15+ multi-template rendering"],
    iconBg: "bg-blue-100 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60",
    iconColor: "text-blue-600 dark:text-blue-400",
    glow: "hover:shadow-blue-500/15 hover:border-blue-500/30",
    numberColor: "text-blue-300/40 dark:text-blue-900/40",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Apply & win interviews",
    description: "Export clean vector PDFs, deploy your live developer portfolio, and walk into interviews prepared with calibrated AI mock prep.",
    details: ["High-DPI vector PDF export", "1-click live web portfolio deploy", "AI career Q&A interview studio"],
    iconBg: "bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    glow: "hover:shadow-emerald-500/15 hover:border-emerald-500/30",
    numberColor: "text-emerald-300/40 dark:text-emerald-900/40",
  },
];

export default function HowItWorksSection() {
  const { isDarkMode } = useDarkMode();
  return (
    <section className={"relative py-28 px-6 sm:px-10 lg:px-16 overflow-hidden transition-colors duration-300 " + (isDarkMode ? "bg-[#09090f] text-zinc-100" : "bg-white text-slate-900")}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full blur-[140px] bg-blue-500/5 dark:bg-blue-500/10" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className={"text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight leading-tight " + (isDarkMode ? "text-white" : "text-slate-900")}>
            From rough draft to offer letter, <span className="font-light text-slate-400 dark:text-zinc-500">in minutes.</span>
          </h2>
          <p className={"text-base sm:text-lg font-light leading-relaxed tracking-normal " + (isDarkMode ? "text-zinc-400" : "text-slate-600")}>
            Three streamlined steps. Zero resume-writing experience required.
          </p>
        </motion.div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8 relative">
          <div className="hidden md:block absolute top-[64px] left-[calc(33.33%+20px)] right-[calc(33.33%+20px)] h-px border-t-2 border-dashed border-zinc-200 dark:border-zinc-800/80 z-0 pointer-events-none" />
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                transition={{ duration: 0.65, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className={"relative rounded-[32px] border p-8 sm:p-9 flex flex-col justify-between gap-8 shadow-xl transition-colors duration-300 hover:shadow-2xl " + step.glow + " " + (isDarkMode ? "bg-[#0f0f1a]/90 border-zinc-800/80 backdrop-blur-xl" : "bg-slate-50/70 border-slate-200/80 backdrop-blur-xl")}
              >
                {/* Number Watermark */}
                <span className={"absolute top-4 right-6 text-8xl font-thin select-none pointer-events-none leading-none tracking-tighter " + step.numberColor}>{step.number}</span>

                {/* Top: Icon + Title + Description */}
                <div className="space-y-5 relative z-10">
                  <div className={"w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm " + step.iconBg}>
                    <Icon className={"w-7 h-7 " + step.iconColor} />
                  </div>
                  <div className="space-y-2">
                    <h3 className={"text-xl sm:text-2xl font-normal tracking-tight " + (isDarkMode ? "text-white" : "text-slate-900")}>{step.title}</h3>
                    <p className={"text-sm sm:text-[15px] font-light leading-relaxed tracking-normal " + (isDarkMode ? "text-zinc-400" : "text-slate-600")}>{step.description}</p>
                  </div>
                </div>

                {/* Bottom: Feature Checklist */}
                <ul className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-zinc-800/60 relative z-10">
                  {step.details.map((d, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm font-light">
                      <CheckCircle2 className={"w-4 h-4 shrink-0 " + step.iconColor} />
                      <span className={isDarkMode ? "text-zinc-300" : "text-slate-700"}>{d}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-center pt-4"
        >
          <Dashboard3DButton
            to="/templates"
            variant="landing"
            size="lg"
            className="!rounded-2xl tracking-wide font-medium px-8"
          >
            <span>Start Building Free</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </Dashboard3DButton>
        </motion.div>
      </div>
    </section>
  );
}

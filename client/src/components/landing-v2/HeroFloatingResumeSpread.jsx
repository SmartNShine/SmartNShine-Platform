import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, UploadCloud, ShieldCheck, Sparkles, CheckCircle2, Eye, ExternalLink } from "lucide-react";

export default function HeroFloatingResumeSpread() {
  const [hoveredResume, setHoveredResume] = useState(null);

  const resumes = [
    {
      id: "classic",
      name: "Classic ATS",
      score: 98,
      candidate: "Alex Morgan",
      role: "Senior Full Stack Engineer",
      company: "CloudScale Tech",
      metric: "4.2M daily requests • 47% query latency reduction",
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
      rotate: "-rotate-3",
      top: "top-4",
      left: "left-2",
      tag: "Top Choice",
    },
    {
      id: "tech",
      name: "Tech Stack Developer",
      score: 99,
      candidate: "David Kumar",
      role: "AI / ML Systems Architect",
      company: "NeuralFlow Labs",
      metric: "Fine-tuned custom LLM retrieval cutting latency by 62%",
      skills: ["PyTorch", "Python", "Kubernetes", "Vector DB", "Docker"],
      rotate: "rotate-3",
      top: "top-12",
      left: "left-36 sm:left-48",
      tag: "99% ATS Pass",
    },
    {
      id: "minimal",
      name: "Minimalist Executive",
      score: 97,
      candidate: "Sarah Chen",
      role: "Lead Technical Product Manager",
      company: "VentureScale Inc",
      metric: "Scaled B2B platform from $0 to $3.2M ARR in 14 months",
      skills: ["Product Strategy", "B2B SaaS", "Roadmapping", "SQL"],
      rotate: "-rotate-2",
      top: "top-64 sm:top-56",
      left: "left-6 sm:left-12",
      tag: "Leadership",
    },
    {
      id: "impact",
      name: "Impact Pro Metrics",
      score: 98,
      candidate: "James Wilson",
      role: "DevOps & Infrastructure Lead",
      company: "ScaleGrid Cloud",
      metric: "Maintained 99.999% SLA across 400+ microservices",
      skills: ["Terraform", "Go", "CI/CD", "Prometheus", "Linux"],
      rotate: "rotate-4",
      top: "top-72 sm:top-64",
      left: "left-44 sm:left-60",
      tag: "Metrics-First",
    },
  ];

  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden font-scoutie">
      {/* Background Dot Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 dark:opacity-20">
        <svg className="w-full h-full text-zinc-300 dark:text-zinc-700" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-spread-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-spread-dots)" />
        </svg>
      </div>

      <div className="relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* LEFT COLUMN: Clean, Concise Text & Actions */}
        <div className="lg:col-span-5 space-y-6 text-left">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ATS Resume Standard 2026</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.08]">
            Resumes engineered for ATS. <br />
            <span className="text-zinc-500 dark:text-zinc-400 font-bold">
              Polished for humans.
            </span>
          </h1>

          {/* Concise Subtitle */}
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Build recruiter-approved resumes with real-time keyword scoring, STAR-method bullet enhancement, and high-density ATS templates.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              to="/templates"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-base transition-colors shadow-sm active:scale-98 w-full sm:w-auto"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/ats-analyzer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-base transition-colors active:scale-98 w-full sm:w-auto"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Check ATS Score</span>
            </Link>
          </div>

          
        </div>

        {/* RIGHT COLUMN: Faded Floating Spread Resumes Canvas (Pop-Out on Hover) */}
        <div className="lg:col-span-7 relative h-[520px] sm:h-[580px] w-full select-none">
          {/* Subtle Canvas Border Mask */}
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-white dark:to-[#090d14] pointer-events-none z-20" />

          {/* Spread Resume Cards Container */}
          <div className="relative w-full h-full">
            {resumes.map((item, index) => {
              const isHovered = hoveredResume === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredResume(item.id)}
                  onMouseLeave={() => setHoveredResume(null)}
                  className={`absolute ${item.top} ${item.left} w-[280px] sm:w-[330px] rounded-xl border transition-all duration-300 cursor-pointer ${
                    item.rotate
                  } ${
                    isHovered
                      ? "scale-108 -rotate-0 z-40 bg-white dark:bg-[#11141a] border-blue-500 dark:border-blue-400 shadow-2xl opacity-100 ring-2 ring-blue-500/20"
                      : "bg-white/80 dark:bg-[#11141a]/80 border-zinc-200 dark:border-zinc-800/90 shadow-md opacity-65 dark:opacity-50 hover:opacity-100 z-10"
                  }`}
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Resume Header */}
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                      <div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white">
                          {item.candidate}
                        </div>
                        <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          {item.role}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.score}% ATS
                      </span>
                    </div>

                    {/* Experience Snippet */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                        EXPERIENCE • {item.company}
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        "{item.metric}"
                      </p>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Hover Link */}
                    {isHovered && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold animate-fade-in">
                        <span>Use {item.name} Template</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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

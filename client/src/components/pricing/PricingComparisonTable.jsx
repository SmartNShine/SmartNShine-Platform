import React from "react";
import {
  Check,
  X,
  HelpCircle,
  FileText,
  Lock,
  X as CloseIcon,
  Sparkles,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { useBodyScrollLock } from "@/hooks";

export function PricingComparisonTable() {
  const featureCategories = [
    {
      category: "AI Engines & Ingestion",
      items: [
        {
          name: "Monthly AI Resume Rewrites",
          free: "10 / month",
          oneTime: "150 / 21 days",
          pro: "Unlimited ∞",
          campus: "Unlimited Campus-Wide",
        },
        {
          name: "AI Model Quality",
          free: "OpenAI Standard",
          oneTime: "OpenAI GPT-4o",
          pro: "OpenAI GPT-4o Priority",
          campus: "Enterprise GPT-4o Priority",
        },
        {
          name: "Resume PDF/DOCX Parser",
          free: "1 / month",
          oneTime: "Full Access",
          pro: "Unlimited / day",
          campus: "Unlimited Bulk Ingestion",
        },
      ],
    },
    {
      category: "ATS Diagnostic Engine",
      items: [
        {
          name: "ATS Compatibility Match Score",
          free: "Basic Check",
          oneTime: "Full Scan (1)",
          pro: "Unlimited Scans ∞",
          campus: "Cohort-Wide Diagnostics",
        },
        {
          name: "Missing Keyword Gap Detection",
          free: "Partial",
          oneTime: "Full Report",
          pro: "Full Deep Diagnostic",
          campus: "Branch & Batch Skill Gaps",
        },
        {
          name: "Actionable Recommendation Engine",
          free: "Top 2 Tips",
          oneTime: "All Fixes",
          pro: "All High-Impact Fixes",
          campus: "Automated Feedback Engine",
        },
      ],
    },
    {
      category: "Builder & Templates Studio",
      items: [
        {
          name: "Resumes per Account",
          free: "1 Active",
          oneTime: "1 Dedicated (21d)",
          pro: "Unlimited Resumes ∞",
          campus: "Unlimited All Students",
        },
        {
          name: "All 11 ATS-Certified Templates",
          free: "3 Core Templates",
          oneTime: "All 11 Unlocked",
          pro: "All 11 Unlocked",
          campus: "All 11 + Institutional Layouts",
        },
        {
          name: "Dynamic Color Themes & Custom Fonts",
          free: "Standard Palette",
          oneTime: "All Themes",
          pro: "All Themes + Custom",
          campus: "Custom College Branding",
        },
        {
          name: "Live Multi-Page PDF Exports",
          free: "Watermark-Free",
          oneTime: "Priority HD PDF",
          pro: "Instant Priority HD",
          campus: "Batch Export & ZIP Archive",
        },
      ],
    },
    {
      category: "Career Hub & Web Portfolios",
      items: [
        {
          name: "Master Career Profile Hub",
          free: "Active",
          oneTime: "Full Access",
          pro: "2-Way Live Sync",
          campus: "College Student Directory",
        },
        {
          name: "Live Public Portfolio Website",
          free: "Preview Only",
          oneTime: "1 Live Website",
          pro: "Unlimited Portfolios ∞",
          campus: "Verified Student Portfolios",
        },
        {
          name: "Custom Portfolio Themes & Slugs",
          free: "Standard",
          oneTime: "All Themes",
          pro: "All Themes + Custom Slugs",
          campus: "College Domain Routing",
        },
        {
          name: "Career Q&A Studio (Question Bank)",
          free: "5 Questions",
          oneTime: "Full Access",
          pro: "Unlimited Practice ∞",
          campus: "Voice & Tech Mock Simulator",
        },
      ],
    },
    {
      category: "Institutional & TPO Ecosystem",
      items: [
        {
          name: "Dedicated Institutional TPO Dashboard",
          free: "—",
          oneTime: "—",
          pro: "—",
          campus: "Full Command Suite ✓",
        },
        {
          name: "Student Bulk Import (CSV & Excel)",
          free: "—",
          oneTime: "—",
          pro: "—",
          campus: "Unlimited Bulk Upload",
        },
        {
          name: "Placement Readiness Index & Leaderboards",
          free: "—",
          oneTime: "—",
          pro: "—",
          campus: "Branch & Batch Analytics",
        },
        {
          name: "Campus Assignments & Resume Deadlines",
          free: "—",
          oneTime: "—",
          pro: "—",
          campus: "Integrated Review Hub",
        },
        {
          name: "Accreditation Reports (NAAC / NBA)",
          free: "—",
          oneTime: "—",
          pro: "—",
          campus: "1-Click PDF / Excel Export",
        },
        {
          name: "Dedicated Institutional Contact Desk",
          free: "Community",
          oneTime: "Email",
          pro: "Priority 24/7",
          campus: "Direct Founders Desk",
        },
      ],
    },
  ];

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Comprehensive Feature Comparison
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Compare capabilities across personal, professional, and campus institutional tiers
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-[#1F1F1F] text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[11px]">
              <th className="py-3 px-3.5 w-1/3">Capability</th>
              <th className="py-3 px-3.5 text-center">Starter Free</th>
              <th className="py-3 px-3.5 text-center text-neutral-900 dark:text-white font-semibold">
                One-Time Pass
              </th>
              <th className="py-3 px-3.5 text-center text-neutral-900 dark:text-white font-bold">
                Pro Unlimited
              </th>
              <th className="py-3 px-3.5 text-center text-neutral-900 dark:text-white font-bold">
                Campus Plan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-[#1a1a1e]">
            {featureCategories.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                <tr className="bg-neutral-50/80 dark:bg-zinc-950">
                  <td
                    colSpan={5}
                    className="py-2.5 px-3.5 font-bold uppercase text-[10px] tracking-wider text-neutral-600 dark:text-neutral-400"
                  >
                    {group.category}
                  </td>
                </tr>
                {group.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-neutral-50/50 dark:hover:bg-[#151518] transition-colors"
                  >
                    <td className="py-3 px-3.5 font-medium text-neutral-800 dark:text-neutral-200">
                      {item.name}
                    </td>
                    <td className="py-3 px-3.5 text-center text-neutral-500 dark:text-neutral-400">
                      {item.free}
                    </td>
                    <td className="py-3 px-3.5 text-center font-semibold text-neutral-800 dark:text-neutral-200">
                      {item.oneTime}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold text-neutral-900 dark:text-white">
                      {item.pro}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold text-neutral-900 dark:text-white">
                      {item.campus}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PricingFAQ() {
  const faqs = [
    {
      q: "What is the SmartNShine Campus Plan for colleges?",
      a: "The Campus Plan provides full institutional infrastructure for training & placement cells (TPOs). It includes a dedicated TPO command center, student bulk onboarding (CSV/Excel), AI placement readiness index, mock interview simulators, batch/branch analytics, and one-click NAAC/NBA accreditation reports. Reach out to Atharva Joshi (+91 91569 06881) or Rameshwar Sarkale (+91 8080652957 / rameshwarsarkale21@gmail.com) for campus proposals.",
    },
    {
      q: "What is included with the Pro Unlimited plan?",
      a: "Pro unlocks unrestricted access to our OpenAI GPT-4o rewrite engine, unlimited ATS diagnostic scans, all 11 executive resume templates, unlimited public portfolio websites with live URLs, full Career Q&A Studio answer bank, and priority PDF rendering.",
    },
    {
      q: "How does the One-Time Pass work?",
      a: "The One-Time Pass (₹49) gives you full access to all 11 templates, 150 AI requests, deep ATS diagnostics, and 1 portfolio website for a specific resume for 21 days without recurring monthly charges.",
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes! You can cancel recurring subscriptions with 1 click directly from your profile settings. You will retain full Pro benefits until the end of your billing cycle.",
    },
    {
      q: "What payment methods are supported for individual plans?",
      a: "We support UPI, Net Banking, Credit/Debit cards (Visa, MasterCard, RuPay), and digital wallets via our secure Razorpay gateway.",
    },
  ];

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Everything you need to know about individual and campus plans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-[#222222] space-y-2"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 pl-6 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PricingResumeChooserModal({
  isOpen,
  onClose,
  selectableResumes,
  loadingResumes,
  onChooseResume,
}) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0c0c0c] rounded-2xl border border-neutral-200 dark:border-[#222222] shadow-2xl overflow-hidden z-10 transition-colors">
        <div className="p-5 border-b border-neutral-100 dark:border-[#1F1F1F] flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
              Select Resume to Unlock
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              One-Time pass applies full AI access to your chosen resume for 21 days
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-2.5">
          {loadingResumes ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-6">
              Loading your saved resumes...
            </p>
          ) : selectableResumes.length === 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-6">
              No resumes found. Please create or upload a resume first.
            </p>
          ) : (
            selectableResumes.map((resume) => {
              const isLocked = resume.access?.upgradeRequired;
              return (
                <button
                  key={resume._id}
                  onClick={() => onChooseResume(resume)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-[#222222] bg-neutral-50 dark:bg-zinc-950 hover:border-neutral-400 dark:hover:border-neutral-600 text-left transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
                    {isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {resume.resumeTitle || resume.name || "Untitled Resume"}
                      </p>
                      {isLocked && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Last edited{" "}
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

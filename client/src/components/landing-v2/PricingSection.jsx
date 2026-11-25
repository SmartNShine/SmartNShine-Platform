import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Mail,
  Phone,
  Copy,
  Users,
  Sparkles,
  Mic2,
  Globe,
  ScanSearch,
  Target,
  MessageSquareQuote,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { getPricing, getSubscriptionStatus } from "@/api/subscription.api";
import { resumeAPI } from "@/api/api";
import PaymentModal from "@/components/common/PaymentModal";
import { PricingResumeChooserModal } from "@/components/pricing";
import toast from "react-hot-toast";
import { useToggle } from "@/hooks";
import { useDarkMode } from "../../context/DarkModeContext";

const FALLBACK_PRICING = {
  free: {
    tier: "free",
    amount: 0,
    features: [
      "1 Active resume per month",
      "OpenAI GPT-4o AI model",
      "3 Core ATS templates",
      "Master Career Profile Hub",
      "5 Career Q&A interview questions",
      "30-Minute AI Interview Simulation",
      "Basic ATS keyword check",
      "Standard PDF export",
    ],
  },
  "one-time": {
    tier: "one-time",
    amount: 49,
    originalAmount: 49,
    features: [
      "1 Dedicated resume (21-day pass)",
      "OpenAI GPT-4o AI rewriting",
      "All 11 ATS-Certified templates",
      "1 Deep ATS diagnostic scan",
      "1 Live Portfolio website",
      "Full Career Q&A Studio access",
      "AI PDF/DOCX resume parser",
      "21-day full access",
    ],
  },
  pro: {
    tier: "pro",
    monthly: {
      amount: 199,
      originalAmount: 299,
    },
    features: [
      "Unlimited resumes & exports",
      "OpenAI GPT-4o Premium AI model",
      "All 11 ATS-Certified templates",
      "Unlimited ATS diagnostic scans",
      "Unlimited Public Portfolio websites",
      "Unlimited Career Q&A mock interviews",
      "10 AI interviews per month",
      "Unlimited AI resume file parsers",
      "Master Career Profile Hub 2-way sync",
      "Priority PDF rendering & 24/7 support",
    ],
  },
};

const CAMPUS_PLAN_DATA = {
  name: "SmartNShine Campus Plan",
  badge: "COLLEGES, UNIVERSITIES & TPO CELLS",
  subtitle:
    "Comprehensive institutional career ecosystem powering campus placements, AI mock interviews, and student readiness tracking.",
  pricingNote: "Custom pricing tailored to campus requirements",
  pricingDesc:
    "Pricing is tailored based on your institution's campus requirements & placement batch size. Contact our team for customized quotes, institutional onboarding, and full rollout.",
  features: [
    {
      title: "AI Resume Builder",
      desc: "11 ATS-certified templates & instant PDF export",
      icon: Sparkles,
      tint:
        "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
    },
    {
      title: "AI Mock Interview Simulator",
      desc: "Voice & tech mock interview practice with AI feedback",
      icon: Mic2,
      tint:
        "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50",
    },
    {
      title: "Live Web Portfolio Builder",
      desc: "Public student portfolio websites with custom slugs",
      icon: Globe,
      tint:
        "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50",
    },
    {
      title: "Deep ATS Diagnostic Analyzer",
      desc: "Comprehensive ATS compatibility scan & scoring engine",
      icon: ScanSearch,
      tint:
        "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
    },
    {
      title: "Job Description (JD) Analysis",
      desc: "Role-matching, missing keywords & skill gap detection",
      icon: Target,
      tint:
        "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50",
    },
    {
      title: "Career Q&A Studio Bank",
      desc: "Targeted interview question bank & verified answers",
      icon: MessageSquareQuote,
      tint:
        "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50",
    },
    {
      title: "Institutional TPO Dashboard",
      desc: "Batch & branch analytics, placement tracking & bulk student import",
      icon: LayoutDashboard,
      tint:
        "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/50",
    },
  ],
  contacts: [
    {
      name: "Atharva Joshi",
      role: "Co-Founder",
      email: "atharvasjoshi2005@gmail.com",
      phone: "+91 91569 06881",
    },
    {
      name: "Rameshwar Sarkale",
      role: "Co-Founder",
      email: "rameshwarsarkale21@gmail.com",
      phone: "+91 8080652957",
    },
  ],
};

export default function PricingSection() {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, , setShowPaymentModalTrue, setShowPaymentModalFalse] =
    useToggle(false);
  const [paymentData, setPaymentData] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const [resumeChooserOpen, setResumeChooserOpen] = useState(false);
  const [selectableResumes, setSelectableResumes] = useState([]);
  const [pendingOneTimePlan, setPendingOneTimePlan] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    fetchPricing();
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await getSubscriptionStatus();
      setCurrentSubscription(response.subscription || null);
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    }
  };

  const fetchPricing = async () => {
    try {
      const data = await getPricing();
      setPricing(data.pricing || data);
    } catch (error) {
      console.warn("Pricing fetch warning (using fallback):", error.message || error);
      setPricing(FALLBACK_PRICING);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSelectPlan = async (tier, plan = "monthly") => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to subscribe");
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    if (tier === "free") {
      toast.success("You are active on the Free Starter plan");
      return;
    }

    const isCurrentActivePlan =
      currentSubscription?.tier === tier &&
      tier === "pro" &&
      currentSubscription?.status === "active";

    if (isCurrentActivePlan) {
      toast.error(
        `You already have an active ${tier.replace("-", " ")} subscription!`
      );
      return;
    }

    if (tier === "one-time") {
      try {
        setLoadingResumes(true);
        const response = await resumeAPI.list();
        const resumes = response.data.resumes || [];

        if (resumes.length === 0) {
          toast.error("Create or upload a resume before buying one-time access");
          navigate("/upload");
          return;
        }

        setSelectableResumes(resumes);
        setPendingOneTimePlan({ tier, plan });
        setResumeChooserOpen(true);
      } catch (error) {
        toast.error("Failed to load your resumes");
        console.error(error);
      } finally {
        setLoadingResumes(false);
      }
      return;
    }

    setPaymentData({ tier, plan });
    setShowPaymentModalTrue();
  };

  const handleChooseResumeForOneTime = (resume) => {
    setResumeChooserOpen(false);
    setPaymentData({
      ...pendingOneTimePlan,
      resumeId: resume._id,
      resumeTitle: resume.resumeTitle || resume.name || "Untitled Resume",
    });
    setShowPaymentModalTrue();
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}: ${text}`);
  };

  const handleContactCampus = () => {
    navigate(
      "/contact?category=business&subject=SmartNShine%20Campus%20Pricing%20%26%20Requirement%20Inquiry"
    );
  };

  const activePricing = pricing || FALLBACK_PRICING;

  const threeTiersConfig = [
    {
      key: "free",
      name: "Starter Free",
      subtitle: "For casual updates and baseline ATS resume generation.",
      featureLeadIn: "What's included:",
      data: activePricing.free || FALLBACK_PRICING.free,
    },
    {
      key: "pro",
      name: "Pro Unlimited",
      subtitle: "For job seekers seeking maximum interview callbacks and full AI power.",
      featureLeadIn: "Everything in One-Time, plus:",
      data: activePricing.pro || FALLBACK_PRICING.pro,
      isPopular: true,
    },
    {
      key: "one-time",
      name: "One-Time Pass",
      subtitle: "Complete 21-day single tailored boost for active job apps.",
      featureLeadIn: "Everything in Free, plus:",
      data: {
        ...(activePricing["one-time"] || FALLBACK_PRICING["one-time"]),
        amount: 49,
        originalAmount: 49,
      },
    },
  ];

  return (
    <section
      id="pricing"
      className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 transition-colors duration-200 [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased]"
    >
      <div className="max-w-6xl mx-auto relative z-10 space-y-10 sm:space-y-12">
        {/* Section Header (Liveblocks Clean Style) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Pricing
          </h2>

          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            SmartNShine powers end-to-end career readiness, ATS optimization, and AI interview prep for students and institutions.
          </p>
        </motion.div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-neutral-400 animate-spin mx-auto" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Loading rates...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {/* THREE PLANS — Pro (₹199) centered & elevated on desktop */}
            <div className="pt-2 md:pt-8 pb-1">
              <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] shadow-sm dark:shadow-2xl overflow-hidden md:overflow-visible transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 md:items-end divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-[#1F1F1F]">
                {threeTiersConfig.map((tier) => {
                  const { key, name, subtitle, featureLeadIn, data } = tier;
                  const elevated = key === "pro";
                  const isCurrentPlan = currentSubscription?.tier === key;
                  const isActivePlan =
                    isCurrentPlan &&
                    (key === "free" ||
                      (key === "pro" && currentSubscription?.status === "active"));

                  const isPro = key === "pro";
                  const isOneTime = key === "one-time";
                  const isFree = key === "free";

                  const proAmount = data?.monthly?.amount ?? 199;
                  const proOriginalAmount = data?.monthly?.originalAmount ?? 299;
                  const isProDiscounted = proAmount < proOriginalAmount;

                  return (
                    <div
                      key={key}
                      className={`flex flex-col justify-between p-6 sm:p-8 h-full transition-all duration-300 ${
                        elevated
                          ? "relative z-20 bg-white dark:bg-[#0c0c0c] md:-translate-y-6 md:scale-[1.04] md:rounded-2xl md:border-2 md:border-neutral-900 dark:md:border-white md:shadow-2xl dark:md:shadow-[0_24px_60px_rgba(0,0,0,0.55)] md:ring-1 md:ring-neutral-900/10 dark:md:ring-white/15 md:mx-[-2px]"
                          : "bg-white dark:bg-[#0c0c0c] md:translate-y-1 md:opacity-[0.98]"
                      }`}
                    >
                      <div className="space-y-6">
                        {/* Header: Title and discount / active pill */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                              {name}
                            </h3>

                            {isActivePlan ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                <Check className="w-3 h-3 stroke-[2.5]" /> Active
                              </span>
                            ) : isPro && isProDiscounted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                Save 33%
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed min-h-[38px]">
                            {subtitle}
                          </p>
                        </div>

                        {/* Pricing Block */}
                        <div className="pb-4 border-b border-neutral-100 dark:border-[#1F1F1F]">
                          {isFree && (
                            <div className="space-y-1">
                              <div className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                ₹0
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                No credit card required
                              </p>
                            </div>
                          )}

                          {isOneTime && (
                            <div className="space-y-1">
                              <div className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                ₹49
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                / 21-day single pass
                              </p>
                            </div>
                          )}

                          {isPro && (
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                  {formatPrice(proAmount)}
                                </span>
                                {isProDiscounted && (
                                  <span className="text-sm text-neutral-400 line-through">
                                    {formatPrice(proOriginalAmount)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                per month billed monthly
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Features List */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            {featureLeadIn}
                          </p>
                          <ul className="space-y-3">
                            {data?.features?.map((feat, fIdx) => (
                              <li
                                key={fIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-snug"
                              >
                                <Check
                                  className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5"
                                  strokeWidth={2}
                                />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-8">
                        {isPro ? (
                          <button
                            onClick={() => handleSelectPlan("pro", "monthly")}
                            disabled={isActivePlan}
                            className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                              isActivePlan
                                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                                : "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm"
                            }`}
                          >
                            <span>
                              {isActivePlan ? "Current Active Plan ✓" : "Upgrade to Pro"}
                            </span>
                            {!isActivePlan && <ArrowRight className="w-4 h-4" />}
                          </button>
                        ) : isOneTime ? (
                          <button
                            onClick={() =>
                              handleSelectPlan("one-time", data.plan || "one-time")
                            }
                            disabled={isActivePlan}
                            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                              isActivePlan
                                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-[#1c1c1f] dark:hover:bg-[#28282c] dark:text-neutral-200 dark:border-neutral-700/60"
                            }`}
                          >
                            <span>
                              {isActivePlan
                                ? "Current Active Plan ✓"
                                : "Get 21-Day Pass (₹49)"}
                            </span>
                            {!isActivePlan && <ArrowRight className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectPlan("free")}
                            disabled={isActivePlan}
                            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                              isActivePlan
                                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed"
                                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-[#1c1c1f] dark:hover:bg-[#28282c] dark:text-neutral-200 dark:border-neutral-700/60"
                            }`}
                          >
                            <span>
                              {isActivePlan ? "Current Active Plan ✓" : "Get started for free"}
                            </span>
                            {!isActivePlan && <ArrowRight className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>

            {/* DEDICATED CAMPUS PLAN BELOW (Two Sections: Left Plan & Pricing, Right What We Provide | Contact Cards Below) */}
            <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] shadow-sm dark:shadow-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-[#1F1F1F] transition-colors">
              {/* Upper Section: Divided into Left (Plan Details & Pricing) and Right (What We Provide) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-[#1F1F1F]">
                {/* Left Section (col-span-5): Overview, Custom Pricing & Action CTAs */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-[#18181b] dark:text-neutral-300 dark:border-neutral-800 text-[11px] font-semibold tracking-wide">
                      <GraduationCap className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      <span>{CAMPUS_PLAN_DATA.badge}</span>
                    </div>

                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        {CAMPUS_PLAN_DATA.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                        {CAMPUS_PLAN_DATA.subtitle}
                      </p>
                    </div>

                    {/* Highlighted Custom Campus Pricing Box */}
                    <div className="p-4 rounded-xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/30 dark:border-emerald-500/25 space-y-2.5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                          Custom Campus Pricing
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Based on Campus Requirement
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {CAMPUS_PLAN_DATA.pricingDesc}
                      </p>
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-[#1F1F1F]">
                    <button
                      type="button"
                      onClick={handleContactCampus}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Contact for More Info & Pricing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/tpo/login")}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-[#1c1c1f] dark:hover:bg-[#28282c] dark:text-neutral-200 dark:border-neutral-700/60 cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      <span>Campus TPO Sign In</span>
                    </button>
                  </div>
                </div>

                {/* Right Section (col-span-7): What We Provide (Enlarged Cards) */}
                <div className="lg:col-span-7 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-[#1F1F1F]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        What We Provide (Full Platform Ecosystem)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {CAMPUS_PLAN_DATA.features.length} Modules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {CAMPUS_PLAN_DATA.features.map((feat, fIdx) => {
                      const Icon = feat.icon;
                      return (
                        <div
                          key={fIdx}
                          className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 dark:border-[#222222] bg-neutral-50/70 dark:bg-[#141417] hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${feat.tint || "text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-[#1e1e24] border-neutral-200 dark:border-neutral-800"}`}
                          >
                            <Icon className="w-[18px] h-[18px] stroke-[2]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                              {feat.title}
                            </div>
                            <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed mt-1">
                              {feat.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lower Section: Direct Contact to Team Below */}
              <div className="p-6 sm:p-8 bg-neutral-50/40 dark:bg-[#0e0e11] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80 dark:border-[#1F1F1F]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Direct Contact to Team
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Founders Desk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {CAMPUS_PLAN_DATA.contacts.map((contact, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-4 sm:p-5 rounded-xl border border-neutral-200/80 dark:border-[#222222] bg-white dark:bg-[#141417] space-y-3 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                            {contact.name}
                          </div>
                          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            {contact.role}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2 text-xs">
                        {contact.email && (
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors truncate"
                            >
                              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyText(contact.email, "Email")}
                              className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1f1f24] dark:hover:bg-[#282830] border border-neutral-200 dark:border-neutral-800 shrink-0 cursor-pointer transition-colors"
                              title="Copy email"
                              aria-label="Copy email"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                            className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors font-mono"
                          >
                            <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span>{contact.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyText(contact.phone, "Phone")}
                            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1f1f24] dark:hover:bg-[#282830] border border-neutral-200 dark:border-neutral-800 shrink-0 cursor-pointer transition-colors"
                            title="Copy phone"
                            aria-label="Copy phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resume Chooser Modal for One-Time Pass */}
      <PricingResumeChooserModal
        isOpen={resumeChooserOpen}
        onClose={() => setResumeChooserOpen(false)}
        selectableResumes={selectableResumes}
        loadingResumes={loadingResumes}
        onChooseResume={handleChooseResumeForOneTime}
      />

      {/* Payment Processing Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          tier={paymentData.tier}
          plan={paymentData.plan}
          resumeId={paymentData.resumeId}
          resumeTitle={paymentData.resumeTitle}
          onClose={() => {
            setShowPaymentModalFalse();
            setPaymentData(null);
          }}
        />
      )}
    </section>
  );
}

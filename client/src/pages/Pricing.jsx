import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/common/SEO";
import { getPricing, getSubscriptionStatus } from "@/api/subscription.api";
import { resumeAPI } from "@/api/api";
import PaymentModal from "@/components/common/PaymentModal";
import toast from "react-hot-toast";
import { useToggle } from "@/hooks";
import {
  PricingBanner,
  PricingTierCard,
  PricingComparisonTable,
  PricingFAQ,
  PricingResumeChooserModal,
} from "@/components/pricing";
import {
  RefreshCw,
  GraduationCap,
  ShieldCheck,
  Check,
  ArrowRight,
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
} from "lucide-react";

// Robust default plan definitions
const DEFAULT_PLANS = {
  free: {
    amount: 0,
    plan: "free",
    features: [
      "1 Active resume per month",
      "OpenAI GPT-4o AI model",
      "3 Core ATS templates",
      "Master Career Profile Hub",
      "5 Career Q&A interview questions",
      "Basic ATS keyword check",
      "Standard PDF export",
    ],
  },
  "one-time": {
    amount: 49,
    originalAmount: 49,
    plan: "one-time",
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
    monthly: {
      amount: 199,
      originalAmount: 299,
    },
    plan: "monthly",
    features: [
      "Unlimited resumes & exports",
      "OpenAI GPT-4o Premium AI model",
      "All 11 ATS-Certified templates",
      "Unlimited ATS diagnostic scans",
      "Unlimited Public Portfolio websites",
      "Unlimited Career Q&A mock interviews",
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

export default function Pricing() {
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
      console.warn("Pricing fetch warning (using defaults):", error.message || error);
      setPricing(DEFAULT_PLANS);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-7 h-7 text-neutral-400 animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Loading pricing tiers...
          </p>
        </div>
      </div>
    );
  }

  // The 3 primary consumer plans
  const threePlanEntries = [
    ["free", { ...DEFAULT_PLANS.free, ...(pricing?.free || {}) }],
    ["pro", { ...DEFAULT_PLANS.pro, ...(pricing?.pro || {}) }],
    [
      "one-time",
      {
        ...DEFAULT_PLANS["one-time"],
        ...(pricing?.["one-time"] || {}),
        amount: 49,
        originalAmount: 49,
      },
    ],
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 transition-colors duration-200 [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased]">
      <SEO
        title="Pricing & Plans - Upgrade Your Resume | SmartNShine"
        description="Choose from Starter Free, One-Time Pass (₹49), Pro Unlimited (₹199), or SmartNShine Campus Plan. Build ATS-optimized resumes with AI rewriting or empower your university placement cell."
        keywords="resume builder pricing, ATS resume cost, subscription plans, resume builder plans, professional resume pricing, campus placement software, college TPO dashboard"
        url="https://smartnshine.in/pricing"
      />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        <PricingBanner />

        {/* 1. THREE PLANS — Pro (₹199) centered & elevated on desktop */}
        <div className="pt-2 md:pt-8 pb-1">
          <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] shadow-sm dark:shadow-2xl overflow-hidden md:overflow-visible transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-3 md:items-end divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-[#1F1F1F]">
              {threePlanEntries.map(([tierKey, tierData]) => {
                const isPopular = tierKey === "pro";
                const isCurrentPlan = currentSubscription?.tier === tierKey;
                const isActivePlan =
                  isCurrentPlan &&
                  (tierKey === "free" ||
                    (tierKey === "pro" &&
                      currentSubscription?.status === "active"));

                return (
                  <PricingTierCard
                    key={tierKey}
                    tierKey={tierKey}
                    tierData={tierData}
                    isPopular={isPopular}
                    elevated={isPopular}
                    isActivePlan={isActivePlan}
                    onSelectPlan={handleSelectPlan}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. DEDICATED CAMPUS PLAN BELOW (Two Sections: Left Plan & Pricing, Right What We Provide | Contact Cards Below) */}
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

        {/* Feature Comparison Matrix */}
        <PricingComparisonTable />

        {/* FAQ Accordion */}
        <PricingFAQ />
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
    </div>
  );
}

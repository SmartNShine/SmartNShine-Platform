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
import { FestiveSaleBanner } from "@/components/common";
import { RefreshCw } from "lucide-react";

export default function Pricing() {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [
    showPaymentModal,
    ,
    setShowPaymentModalTrue,
    setShowPaymentModalFalse,
  ] = useToggle(false);
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
      setPromotion(data?.promotion || null);
    } catch (error) {
      toast.error("Failed to load pricing information");
      console.error("Pricing fetch error:", error);
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
      toast.success("You are already active on the Free Starter plan");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            Loading pricing tiers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <SEO
        title="Pricing & Plans - Upgrade Your Resume | SmartNShine"
        description="Choose from Starter Free, One-Time Pass, or Pro Unlimited plans. Build ATS-optimized resumes with AI-powered rewriting starting at ₹49."
        keywords="resume builder pricing, ATS resume cost, subscription plans, resume builder plans, professional resume pricing"
        url="https://www.smartnshine.in/pricing"
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Top Hero Banner */}
        <PricingBanner />

        {/* 3-Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {pricing &&
            Object.entries(pricing).map(([tierKey, tierData]) => {
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
                  isActivePlan={isActivePlan}
                  onSelectPlan={handleSelectPlan}
                />
              );
            })}
        </div>

        {/* Comprehensive Feature Comparison Matrix */}
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

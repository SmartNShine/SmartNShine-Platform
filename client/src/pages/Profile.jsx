import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/common/SEO";
import { User, CreditCard, Shield, ArrowLeft } from "lucide-react";
import SubscriptionDashboard from "./SubscriptionDashboard";
import {
  ProfileBanner,
  ProfileSettingsTab,
  SecuritySettingsTab,
} from "@/components/profile";
import { getSubscriptionStatus } from "@/api/subscription.api";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("subscription");
  const [currentTier, setCurrentTier] = useState("free");

  useEffect(() => {
    const checkTier = async () => {
      try {
        const response = await getSubscriptionStatus();
        if (response?.subscription?.tier) {
          setCurrentTier(response.subscription.tier);
        }
      } catch (err) {
        console.error("Failed to load subscription tier:", err);
      }
    };
    checkTier();
  }, []);

  const tabs = [
    { id: "subscription", label: "Subscription & Limits", icon: CreditCard },
    { id: "profile", label: "Profile Details", icon: User },
    { id: "security", label: "Security & Auth", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <SEO
        title="My Profile - Account & Subscription | SmartNShine"
        description="Manage your SmartNShine profile, subscription plan, AI quota usage, and security credentials."
        keywords="profile, account settings, subscription management, AI quota, security settings"
        url="https://www.smartnshine.app/profile"
        noindex={true}
      />

      <div className="workspace-container py-6 sm:py-8 space-y-6">
        {/* Back to Dashboard Breadcrumb */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Top Hero Banner */}
        <ProfileBanner user={user} currentTier={currentTier} />

        {/* Tab Navigation & Card Body */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-gray-200/90 dark:border-white/[0.08] shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 py-3 bg-gray-50/50 dark:bg-zinc-950/40">
            <nav className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
                      isActive
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md shadow-black/10 dark:shadow-white/10"
                        : "bg-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content Panel */}
          <div className="p-6 sm:p-8">
            {activeTab === "subscription" && (
              <SubscriptionDashboard embedded={true} />
            )}

            {activeTab === "profile" && <ProfileSettingsTab user={user} />}

            {activeTab === "security" && <SecuritySettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

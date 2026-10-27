import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  KeyRound,
  Server,
  Shield,
  Zap,
  Mail,
  Database,
  Users,
  TrendingUp,
  Clock,
  HardDrive,
  ToggleLeft,
  ToggleRight,
  Gift,
  Sparkles,
  Flame,
  Tag,
  ArrowRight,
  Eye,
  Calendar,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSettings,
  updateSettings,
  resetSettings,
  getSystemStats,
  updatePromotionSettings,
  togglePromotion,
} from "@/api/admin.api";
import { useToggle } from "@/hooks";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, , setLoadingTrue, setLoadingFalse] = useToggle(true);
  const [saving, , setSavingTrue, setSavingFalse] = useToggle(false);
  const [togglingPromo, setTogglingPromo] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("promotions");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingTrue();
      const [settingsRes, statsRes] = await Promise.all([
        getSettings(),
        getSystemStats().catch(() => ({ data: { stats: null } })),
      ]);
      setSettings(settingsRes.data.settings);
      setSystemStats(statsRes?.data?.stats || null);
      setError(null);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err.response?.data?.error || "Failed to load settings");
    } finally {
      setLoadingFalse();
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingTrue();
      await updateSettings(settings);
      setSuccess("All settings & promotional pricing saved successfully!");
      setTimeout(() => setSuccess(null), 3500);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save settings");
    } finally {
      setSavingFalse();
    }
  };

  const handleResetSettings = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all settings to defaults?"
      )
    ) {
      return;
    }

    try {
      setSavingTrue();
      await resetSettings();
      setSuccess("Settings reset to defaults successfully!");
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset settings");
    } finally {
      setSavingFalse();
    }
  };

  const handleTogglePromotion = async () => {
    const newStatus = !settings?.promotion?.enabled;
    // Optimistically update local UI state
    setSettings((prev) => ({
      ...prev,
      promotion: {
        ...(prev?.promotion || {}),
        enabled: newStatus,
      },
    }));

    try {
      setTogglingPromo(true);
      await togglePromotion(newStatus);
      toast.success(
        newStatus
          ? "🎉 Festive Sale Campaign enabled! Home banner & ₹9 pricing active."
          : "⏸️ Festive Sale Campaign disabled! Standard pricing restored."
      );
      setSuccess(
        newStatus
          ? "Festive Sale Campaign is now ACTIVE on Home & Pricing pages."
          : "Festive Sale Campaign is now OFF. Standard ₹49 pricing restored."
      );
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error("Failed to toggle promotion:", err);
      // Revert optimistic update on failure
      setSettings((prev) => ({
        ...prev,
        promotion: {
          ...(prev?.promotion || {}),
          enabled: !newStatus,
        },
      }));
      toast.error(
        err.response?.data?.error || "Failed to update campaign status"
      );
      setError("Failed to toggle promotional status. Please try again.");
    } finally {
      setTogglingPromo(false);
    }
  };

  const updateSettingValue = (path, value) => {
    const keys = path.split(".");
    const newSettings = { ...settings };
    let current = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  // Quick Presets for Festive Deals
  const applyPreset = (presetType) => {
    const promo = { ...settings.promotion };

    if (presetType === "raksha-bandhan-9") {
      promo.enabled = true;
      promo.title = "Raksha Bandhan Special Sale 🎁✨";
      promo.tagline =
        "Celebrate Raksha Bandhan with an ATS-crushing resume at flat 82% OFF!";
      promo.badgeText = "RAKHI FESTIVE SPECIAL";
      promo.theme = "rakhi-festive";
      promo.oneTimePrice = 9;
      promo.originalOneTimePrice = 49;
      promo.ctaText = "Claim ₹9 Resume Deal";
      promo.endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
    } else if (presetType === "flash-19") {
      promo.enabled = true;
      promo.title = "24-Hour Flash Sale ⚡";
      promo.tagline =
        "Limited-time flash discount on ATS Resume Generator & AI Rewriting!";
      promo.badgeText = "FLASH DEAL";
      promo.theme = "crimson-festive";
      promo.oneTimePrice = 19;
      promo.originalOneTimePrice = 49;
      promo.ctaText = "Get Deal for ₹19";
      promo.endDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
    } else if (presetType === "independence-29") {
      promo.enabled = true;
      promo.title = "Freedom Career Special 🇮🇳✨";
      promo.tagline =
        "Unlock career freedom with ATS-certified templates and AI scan!";
      promo.badgeText = "FREEDOM OFFER";
      promo.theme = "gold-luxury";
      promo.oneTimePrice = 29;
      promo.originalOneTimePrice = 49;
      promo.ctaText = "Claim ₹29 Deal";
      promo.endDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
    } else if (presetType === "regular-49") {
      promo.enabled = false;
      promo.oneTimePrice = 49;
      promo.originalOneTimePrice = 49;
    }

    setSettings({ ...settings, promotion: promo });
    setSuccess(`Applied preset: ${presetType}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const tabs = [
    { id: "promotions", label: "🎁 Festive Sales & Pricing", icon: Gift },
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "ai", label: "AI Quotas", icon: Zap },
    { id: "features", label: "Features", icon: ToggleRight },
    { id: "security", label: "Security & Limits", icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 animate-pulse flex items-center justify-center shadow-xl shadow-orange-500/20">
            <Gift className="w-8 h-8 text-white animate-bounce" />
          </div>
          <p className="text-gray-600 dark:text-zinc-400 font-semibold text-sm">
            Loading System & Sale Configuration...
          </p>
        </div>
      </div>
    );
  }

  const promo = settings?.promotion || {
    enabled: true,
    title: "Raksha Bandhan Special Sale 🎁✨",
    tagline:
      "Celebrate Raksha Bandhan with an ATS-crushing resume at flat 82% OFF!",
    badgeText: "RAKHI FESTIVE SPECIAL",
    theme: "rakhi-festive",
    oneTimePrice: 9,
    originalOneTimePrice: 49,
    proMonthlyPrice: 199,
    proYearlyPrice: 1990,
    ctaText: "Claim ₹9 Resume Deal",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md mb-2">
            <Gift className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
              System & Campaign Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            System & Campaign Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Configure promotional pricing, countdown banners, AI quotas, and system parameters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/super-admin"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono rounded-md transition-colors shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            <span>Super Admin (.env)</span>
          </Link>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleResetSettings}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs font-mono rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-medium rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3 flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg p-3 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs font-mono text-rose-700 dark:text-rose-300">
            {error}
          </p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: FESTIVE SALES & PROMOTIONS */}
      {activeTab === "promotions" && settings && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Presets Bar */}
          <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  1-Click Campaign Presets
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Instantly configure pre-built promotional themes and pricing
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyPreset("raksha-bandhan-9")}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                >
                  🎁 Raksha Bandhan (₹9)
                </button>
                <button
                  onClick={() => applyPreset("flash-19")}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                >
                  ⚡ Flash Sale (₹19)
                </button>
                <button
                  onClick={() => applyPreset("independence-29")}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                >
                  🇮🇳 Special Deal (₹29)
                </button>
                <button
                  onClick={() => applyPreset("regular-49")}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                >
                  🔄 Normal (₹49)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configuration Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Master Sale Toggle Card */}
              <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-orange-500" />
                      Festive Sale Campaign Status
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      When enabled, home page festive ads and discounted ₹9
                      pricing are active.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTogglePromotion}
                    disabled={togglingPromo}
                    aria-label="Toggle Festive Sale Campaign"
                    className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                      settings.promotion?.enabled
                        ? "bg-gradient-to-r from-orange-500 to-amber-500"
                        : "bg-gray-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-flex items-center justify-center h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        settings.promotion?.enabled
                          ? "translate-x-8"
                          : "translate-x-0"
                      }`}
                    >
                      {togglingPromo && (
                        <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic Pricing Overrides */}
              <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xs">
                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  Dynamic Promotional Pricing (INR ₹)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* One-Time Pass Pricing */}
                  <div className="p-3.5 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      ⚡ One-Time 21-Day Pass Pricing
                    </span>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Sale / Discounted Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.promotion?.oneTimePrice ?? 9}
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.oneTimePrice",
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
                      />
                      <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold mt-1 block">
                        Active Sale Price: ₹{settings.promotion?.oneTimePrice ?? 9}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Original Strikethrough Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.promotion?.originalOneTimePrice ?? 49}
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.originalOneTimePrice",
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
                      />
                      <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium mt-1 block">
                        Original Strikethrough Price: ₹{settings.promotion?.originalOneTimePrice ?? 49}
                      </span>
                    </div>
                  </div>

                  {/* Pro Monthly Pricing */}
                  <div className="p-3.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      💎 Pro Monthly Subscription Pricing
                    </span>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Sale / Discounted Price (₹/mo)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.promotion?.proMonthlyPrice ?? 199}
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.proMonthlyPrice",
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
                        Active Pro Price: ₹{settings.promotion?.proMonthlyPrice ?? 199}/mo
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Original Strikethrough Price (₹/mo)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.promotion?.originalProMonthlyPrice ?? 199}
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.originalProMonthlyPrice",
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                      <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium mt-1 block">
                        Original Strikethrough Price: ₹{settings.promotion?.originalProMonthlyPrice ?? 199}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Copy & Badge */}
              <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xs">
                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Banner Copy & Visual Theme
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Campaign Title
                    </label>
                    <input
                      type="text"
                      value={
                        settings.promotion?.title ||
                        "Raksha Bandhan Special Sale 🎁✨"
                      }
                      onChange={(e) =>
                        updateSettingValue("promotion.title", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 outline-hidden font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Pill / Badge Label
                      </label>
                      <input
                        type="text"
                        value={
                          settings.promotion?.badgeText || "RAKHI FESTIVE SPECIAL"
                        }
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.badgeText",
                            e.target.value
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm font-bold uppercase focus:ring-2 focus:ring-orange-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={
                          settings.promotion?.ctaText || "Claim ₹9 Resume Deal"
                        }
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.ctaText",
                            e.target.value
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Tagline / Promotional Description
                    </label>
                    <textarea
                      rows="2"
                      value={
                        settings.promotion?.tagline ||
                        "Celebrate Raksha Bandhan with an ATS-crushing resume at flat 82% OFF!"
                      }
                      onChange={(e) =>
                        updateSettingValue("promotion.tagline", e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Festive Visual Theme
                      </label>
                      <select
                        value={settings.promotion?.theme || "rakhi-festive"}
                        onChange={(e) =>
                          updateSettingValue("promotion.theme", e.target.value)
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-hidden"
                      >
                        <option value="rakhi-festive">
                          🪢 Rakhi Festive (Orange & Amber Glow)
                        </option>
                        <option value="gold-luxury">
                          ✨ Gold Luxury (Amber & Golden)
                        </option>
                        <option value="crimson-festive">
                          🌹 Crimson Festive (Rose & Pink)
                        </option>
                        <option value="vibrant-indigo">
                          🚀 Vibrant Indigo (Indigo & Violet)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Sale End Date / Timer
                      </label>
                      <input
                        type="datetime-local"
                        value={
                          settings.promotion?.endDate
                            ? new Date(settings.promotion.endDate)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          updateSettingValue(
                            "promotion.endDate",
                            new Date(e.target.value)
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Real-Time Preview with dynamic theme styling & larger text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="sticky top-20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Real-Time Live Banner Preview
                  </h4>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live Simulator
                  </span>
                </div>

                {/* Simulated Top Announcement Bar */}
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10">
                  <div className="bg-gray-800 px-3 py-1.5 text-[10px] text-gray-300 font-mono">
                    Top Announcement Strip (Theme: {settings.promotion?.theme || "rakhi-festive"}):
                  </div>
                  <div
                    className={`p-3.5 transition-all duration-300 ${
                      settings.promotion?.theme === "gold-luxury"
                        ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-amber-950"
                        : settings.promotion?.theme === "crimson-festive"
                        ? "bg-gradient-to-r from-rose-700 via-red-600 to-pink-600 text-white"
                        : settings.promotion?.theme === "vibrant-indigo"
                        ? "bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 text-white"
                        : "bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            settings.promotion?.theme === "gold-luxury"
                              ? "bg-amber-950/25 text-amber-950 border border-amber-950/30"
                              : "bg-white/20 text-amber-100 border border-white/30"
                          }`}
                        >
                          {settings.promotion?.badgeText || "RAKHI SPECIAL"}
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            settings.promotion?.theme === "gold-luxury"
                              ? "text-amber-950"
                              : "text-white"
                          }`}
                        >
                          {settings.promotion?.title || "Raksha Bandhan Sale"} • Pass for ₹
                          {settings.promotion?.oneTimePrice ?? 9}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                          settings.promotion?.theme === "gold-luxury"
                            ? "bg-amber-950 text-yellow-300"
                            : "bg-white text-orange-600"
                        }`}
                      >
                        {settings.promotion?.ctaText || "Claim Deal"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Home Hero Sales Ad Card */}
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10">
                  <div className="bg-gray-800 px-3 py-1.5 text-[10px] text-gray-300 font-mono">
                    Home Hero Sales Card Preview:
                  </div>
                  <div
                    className={`p-6 border-t space-y-3.5 transition-all duration-300 ${
                      settings.promotion?.theme === "gold-luxury"
                        ? "bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-amber-600/25 dark:from-amber-950/60 dark:to-zinc-900 border-amber-500/40"
                        : settings.promotion?.theme === "crimson-festive"
                        ? "bg-gradient-to-br from-rose-500/25 via-red-500/15 to-pink-600/25 dark:from-rose-950/60 dark:to-zinc-900 border-rose-500/40"
                        : settings.promotion?.theme === "vibrant-indigo"
                        ? "bg-gradient-to-br from-indigo-500/25 via-purple-500/15 to-pink-600/25 dark:from-indigo-950/60 dark:to-zinc-900 border-indigo-500/40"
                        : "bg-gradient-to-br from-orange-500/25 via-amber-500/15 to-rose-500/25 dark:from-orange-950/60 dark:to-zinc-900 border-orange-500/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎁 🪢</span>
                      <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 border border-current">
                        {settings.promotion?.badgeText || "RAKHI FESTIVE SPECIAL"}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                        {settings.promotion?.title || "Raksha Bandhan Special Sale 🎁✨"}
                      </h5>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-200 mt-1 font-medium leading-relaxed">
                        {settings.promotion?.tagline ||
                          "Celebrate Raksha Bandhan with an ATS-crushing resume at flat 82% OFF!"}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
                      <span className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">
                        ₹{settings.promotion?.oneTimePrice ?? 9}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{settings.promotion?.originalOneTimePrice ?? 49}
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        (Flat{" "}
                        {Math.round(
                          (1 -
                            (settings.promotion?.oneTimePrice ?? 9) /
                              (settings.promotion?.originalOneTimePrice ?? 49)) *
                            100
                        )}
                        % OFF)
                      </span>
                    </div>

                    <button
                      className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                        settings.promotion?.theme === "gold-luxury"
                          ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-amber-950"
                          : settings.promotion?.theme === "crimson-festive"
                          ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white"
                          : settings.promotion?.theme === "vibrant-indigo"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                          : "bg-gradient-to-r from-orange-600 to-amber-600 text-white"
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{settings.promotion?.ctaText || "Claim ₹9 Resume Deal"}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Instant Synchronization:
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">
                    Saving settings immediately updates the public pricing
                    endpoint, Home page ad banner, Pricing table, and Razorpay
                    checkout backend.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GENERAL SETTINGS */}
      {activeTab === "general" && settings && (
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-5 animate-fadeIn shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            General System Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName || ""}
                onChange={(e) =>
                  updateSettingValue("siteName", e.target.value)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Support Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail || ""}
                onChange={(e) =>
                  updateSettingValue("contactEmail", e.target.value)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Site Meta Description
              </label>
              <textarea
                rows="2"
                value={settings.siteDescription || ""}
                onChange={(e) =>
                  updateSettingValue("siteDescription", e.target.value)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI QUOTAS */}
      {activeTab === "ai" && settings && (
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-6 animate-fadeIn shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            AI Quota Limits per Subscription Tier
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 space-y-3">
              <span className="text-xs font-black uppercase text-gray-600 dark:text-zinc-400">
                Starter Free
              </span>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1">
                  Daily Limit
                </label>
                <input
                  type="number"
                  value={settings.aiQuota?.free?.daily ?? 10}
                  onChange={(e) =>
                    updateSettingValue(
                      "aiQuota.free.daily",
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1">
                  Monthly Limit
                </label>
                <input
                  type="number"
                  value={settings.aiQuota?.free?.monthly ?? 200}
                  onChange={(e) =>
                    updateSettingValue(
                      "aiQuota.free.monthly",
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-bold"
                />
              </div>
            </div>

            {/* One-Time */}
            <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
              <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">
                One-Time Pass (21 Days)
              </span>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1">
                  Daily Limit
                </label>
                <input
                  type="number"
                  value={settings.aiQuota?.["one-time"]?.daily ?? 150}
                  onChange={(e) =>
                    updateSettingValue(
                      "aiQuota.one-time.daily",
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1">
                  Monthly Limit
                </label>
                <input
                  type="number"
                  value={settings.aiQuota?.["one-time"]?.monthly ?? 150}
                  onChange={(e) =>
                    updateSettingValue(
                      "aiQuota.one-time.monthly",
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-bold"
                />
              </div>
            </div>

            {/* Pro */}
            <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
              <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">
                Pro Unlimited
              </span>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1">
                  Daily Limit
                </label>
                <input
                  type="number"
                  value={settings.aiQuota?.pro?.daily ?? 1000}
                  onChange={(e) =>
                    updateSettingValue(
                      "aiQuota.pro.daily",
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 mb-1">
                  Monthly Limit
                </label>
                <input
                  type="number"
                  value={settings.aiQuota?.pro?.monthly ?? 10000}
                  onChange={(e) =>
                    updateSettingValue(
                      "aiQuota.pro.monthly",
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FEATURES */}
      {activeTab === "features" && settings && (
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-5 animate-fadeIn shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            System Feature Flags
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(settings.features || {}).map(([feature, enabled]) => (
              <div
                key={feature}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5"
              >
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 capitalize">
                  {feature.replace(/([A-Z])/g, " $1")}
                </span>
                <button
                  onClick={() =>
                    updateSettingValue(`features.${feature}`, !enabled)
                  }
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    enabled
                      ? "bg-emerald-500"
                      : "bg-gray-300 dark:bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SECURITY & RATE LIMITS */}
      {activeTab === "security" && settings && (
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-5 animate-fadeIn shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Security & Rate Limiting
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Password Minimum Length
              </label>
              <input
                type="number"
                value={settings.security?.passwordMinLength ?? 8}
                onChange={(e) =>
                  updateSettingValue(
                    "security.passwordMinLength",
                    Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Max Resumes Per User
              </label>
              <input
                type="number"
                value={settings.storage?.maxResumesPerUser ?? 10}
                onChange={(e) =>
                  updateSettingValue(
                    "storage.maxResumesPerUser",
                    Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-sm font-bold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

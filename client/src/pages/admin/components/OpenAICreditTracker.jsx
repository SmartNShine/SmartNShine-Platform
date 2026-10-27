import {useState, useEffect} from "react";
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Zap,
  Activity,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Server,
  FileText,
  MessageSquare,
  HelpCircle,
  Sliders,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getOpenAICreditStatus,
  refillOpenAICredits,
  setExactOpenAIBalance,
  updateOpenAICreditSettings,
  checkOpenAIQuotaHealth,
} from "@/api/admin.api";

export default function OpenAICreditTracker({onRefreshNeeded}) {
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState(null);
  const [isCurrencyInr, setIsCurrencyInr] = useState(false);

  // Modal states
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [modalMode, setModalMode] = useState("set_exact"); // 'set_exact' | 'add_pool' | 'reset'
  const [balanceAmount, setBalanceAmount] = useState("10");
  const [refillNotes, setRefillNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("2.00");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const res = await getOpenAICreditStatus();
      if (res.data?.success) {
        setCreditData(res.data.data);
        if (res.data.data.budget?.alertThresholdUsd) {
          setAlertThreshold(String(res.data.data.budget.alertThresholdUsd));
        }
      }
    } catch (err) {
      console.error("Failed to load OpenAI credits:", err);
      toast.error(err.response?.data?.message || "Failed to load OpenAI credits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleTestHealth = async () => {
    try {
      setTestingHealth(true);
      const res = await checkOpenAIQuotaHealth();
      setHealthResult(res.data.data);
      if (res.data.data?.healthy) {
        toast.success(`OpenAI API Active • ${res.data.data.responseTimeMs}ms latency`);
      } else {
        toast.error(res.data.data?.message || "OpenAI Quota/Connection Issue Detected");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Health test failed");
    } finally {
      setTestingHealth(false);
    }
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid dollar amount");
      return;
    }

    try {
      setIsSubmitting(true);
      let res;
      if (modalMode === "set_exact") {
        res = await setExactOpenAIBalance({
          exactBalanceUsd: amount,
          notes: refillNotes,
        });
      } else {
        res = await refillOpenAICredits({
          amountUsd: amount,
          isReset: modalMode === "reset",
          notes: refillNotes,
        });
      }

      if (res.data?.success) {
        setCreditData(res.data.data);
        toast.success(res.data.message || `Balance updated to $${amount.toFixed(2)}`);
        setShowRefillModal(false);
        setRefillNotes("");
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update credits");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    const threshold = parseFloat(alertThreshold);
    if (isNaN(threshold) || threshold < 0) {
      toast.error("Please enter a valid alert threshold");
      return;
    }

    try {
      setIsSavingSettings(true);
      const res = await updateOpenAICreditSettings({
        alertThresholdUsd: threshold,
      });

      if (res.data?.success) {
        setCreditData(res.data.data);
        toast.success("Credit alert threshold saved");
        setShowSettingsModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading && !creditData) {
    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[220px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Checking OpenAI Account Credit Balance...
          </span>
        </div>
      </div>
    );
  }

  const budget = creditData?.budget || {
    allocatedUsd: 10,
    remainingUsd: 10,
    spentPeriodUsd: 0,
    percentRemaining: 100,
    allocatedInr: 865,
    remainingInr: 865,
    spentPeriodInr: 0,
  };

  const stats = creditData?.usageStats || {};
  const remainingOps = creditData?.estimatedRemaining || {};
  const status = creditData?.status || "healthy";
  const exchangeRate = creditData?.exchangeRate || 86.5;

  const formatCurrency = (usdVal, inrVal) => {
    if (isCurrencyInr) {
      const val = inrVal !== undefined ? inrVal : (usdVal || 0) * exchangeRate;
      return `₹${val.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    return `$${(usdVal || 0).toFixed(2)}`;
  };

  const getStatusBadge = () => {
    if (status === "depleted" || (healthResult && !healthResult.healthy)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" /> Quota Depleted
        </span>
      );
    }
    if (status === "low") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" /> Low Credit Alert (&lt; {formatCurrency(budget.alertThresholdUsd, budget.alertThresholdInr)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" /> OpenAI Balance Active
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-2xl p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                OpenAI Account Credits & Balance Tracker
              </h2>
              {getStatusBadge()}
              {creditData?.syncMode === "live_openai_synced" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 rounded-full text-[11px] font-semibold">
                  <Server className="w-3 h-3 text-sky-500" />
                  Live OpenAI Org: {creditData.liveOrgData?.orgName || "Connected"}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Accurate live credit monitoring, token burn-rate analytics, and quota exhaustion safeguards.
            </p>
          </div>
        </div>

        {/* Currency & Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Refresh Sync Button */}
          <button
            onClick={fetchCredits}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Fetch latest metrics from OpenAI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            <span>Sync Live</span>
          </button>

          {/* Currency Switcher */}
          <button
            onClick={() => setIsCurrencyInr(!isCurrencyInr)}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Toggle USD / INR view"
          >
            <span className="text-zinc-500 dark:text-zinc-400">Currency:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {isCurrencyInr ? "INR (₹)" : "USD ($)"}
            </span>
          </button>

          {/* Test Health / Quota Button */}
          <button
            onClick={handleTestHealth}
            disabled={testingHealth}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Ping OpenAI API to verify quota & key authorization"
          >
            <Activity className={`w-3.5 h-3.5 ${testingHealth ? "animate-spin" : ""}`} />
            <span>{testingHealth ? "Pinging..." : "Check Quota"}</span>
          </button>

          {/* Set Exact / Top Up Button */}
          <button
            onClick={() => {
              setModalMode("set_exact");
              setBalanceAmount(String(budget.remainingUsd || "10"));
              setShowRefillModal(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Set / Top Up Balance</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors"
            title="Configure Low Credit Alert Threshold"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* 1. Available Credits */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Available Balance</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(budget.remainingUsd, budget.remainingInr)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              <span>Allocated: {formatCurrency(budget.allocatedUsd, budget.allocatedInr)}</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {budget.percentRemaining}% Left
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.percentRemaining > 30
                    ? "bg-emerald-500"
                    : budget.percentRemaining > 15
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{width: `${Math.max(3, budget.percentRemaining)}%`}}
              />
            </div>
          </div>
        </div>

        {/* 2. Total OpenAI Spent (Current Period) */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Tracked OpenAI Usage</span>
            <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
              {formatCurrency(budget.spentPeriodUsd, budget.spentPeriodInr)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              <span>{stats.periodCalls || 0} API requests</span>
              <span>{(stats.periodTokens || 0).toLocaleString()} tokens</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 truncate">
              Since {budget.lastRefillDate ? new Date(budget.lastRefillDate).toLocaleDateString() : "inception"}
            </div>
          </div>
        </div>

        {/* 3. Average Burn Rate per Call */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Avg. Cost per Request</span>
            <div className="w-6 h-6 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
              {isCurrencyInr
                ? `₹${(stats.avgCallCostInr || 0).toFixed(3)}`
                : `$${(stats.avgCallCostUsd || 0).toFixed(4)}`}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              All-time spend: {formatCurrency(stats.allTimeSpentUsd, stats.allTimeSpentInr)}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Across {(stats.allTimeCalls || 0).toLocaleString()} operations
            </div>
          </div>
        </div>

        {/* 4. Live Health & Model Status */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>API Engine & Status</span>
            <div className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              GPT-4o Omnimodel
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Token Tracking: Active</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 truncate">
              {healthResult
                ? `Latency: ${healthResult.responseTimeMs}ms • Status: ${healthResult.status}`
                : "API Key Authorized"}
            </div>
          </div>
        </div>
      </div>

      {/* Burn-rate & Capacity Forecasting Cards */}
      <div className="mt-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Remaining Operations Capacity Forecast
            </h3>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Calculated with current balance ({formatCurrency(budget.remainingUsd, budget.remainingInr)})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>ATS Scans</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              ~{(remainingOps.atsScans || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-400">
              @ ~{formatCurrency(creditData?.burnRate?.avgAtsCostUsd || 0.0075)} / scan
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Bullet Enhancer</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              ~{(remainingOps.resumeEnhancements || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-400">
              @ ~{formatCurrency(creditData?.burnRate?.avgEnhanceCostUsd || 0.004)} / rewrite
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Interviews</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              ~{(remainingOps.interviews || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-400">
              @ ~{formatCurrency(creditData?.burnRate?.avgInterviewCostUsd || 0.0025)} / eval
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Total API Requests</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              ~{(remainingOps.totalCalls || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-400">
              @ current avg request size
            </span>
          </div>
        </div>
      </div>

      {/* Set Balance / Top Up Modal */}
      {showRefillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Update OpenAI Account Credits
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Sync your exact live OpenAI dashboard balance or add credits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRefillModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBalanceSubmit} className="mt-5 space-y-4">
              {/* Mode Tabs */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => setModalMode("set_exact")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    modalMode === "set_exact"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  }`}
                >
                  Set Exact Balance
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("add_pool")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    modalMode === "add_pool"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  }`}
                >
                  + Add Top-up
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("reset")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    modalMode === "reset"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  }`}
                >
                  Reset Budget
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {modalMode === "set_exact"
                    ? "Enter Exact Current OpenAI Balance (USD $)"
                    : modalMode === "add_pool"
                    ? "Amount to Add to Balance (USD $)"
                    : "New Total Budget Pool (USD $)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    placeholder="25.00"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                    ≈ ₹{(parseFloat(balanceAmount || 0) * exchangeRate).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {["5", "10", "20", "50", "100"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBalanceAmount(amt)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${
                      balanceAmount === amt
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Notes / Billing Reference (Optional)
                </label>
                <input
                  type="text"
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g., Synced from platform.openai.com/billing"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Updating..."
                    : modalMode === "set_exact"
                    ? "Set Exact Balance"
                    : modalMode === "reset"
                    ? "Reset Budget"
                    : "Add Credits"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Credit Alert Settings
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Set low-balance warning triggers & notification limits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettingsSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Low Balance Alert Threshold (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                    required
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                  When remaining balance falls below this amount, the system will trigger an admin warning alert.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

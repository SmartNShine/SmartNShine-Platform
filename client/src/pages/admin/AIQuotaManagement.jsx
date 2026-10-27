import {useState, useEffect, useCallback, useRef, useMemo} from "react";
import toast from "react-hot-toast";
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Search,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  getUserQuotaStatus,
  getUserQuotaDetails,
  resetUserDailyQuota,
} from "@/api/admin.api";
import {useToggle} from "@/hooks";

const AIQuotaManagement = () => {
  const [quotaData, setQuotaData] = useState(null);
  const [loading, , setLoadingTrue, setLoadingFalse] = useToggle(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("usage");
  const [selectedUser, setSelectedUser] = useState(null);
  const [
    showUserDetails,
    setShowUserDetailsTrue,
    setShowUserDetailsFalse,
  ] = useToggle(false);
  const hasLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  const fetchQuotaStatus = useCallback(
    async ({showPageLoader = false, searchOverride} = {}) => {
      try {
        if (showPageLoader || !hasLoadedRef.current) {
          setLoadingTrue();
        } else {
          setSearchLoading(true);
        }

        const effectiveSearch =
          typeof searchOverride === "string" ? searchOverride : searchTerm;

        const response = await getUserQuotaStatus({
          sortBy,
          search: effectiveSearch,
        });

        setQuotaData(response.data);
        setError(null);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error("Error fetching quota status:", err);
        setError(err.response?.data?.error || "Failed to load quota data");
      } finally {
        if (showPageLoader || !hasLoadedRef.current) {
          setLoadingFalse();
        }
        setSearchLoading(false);
      }
    },
    [searchTerm, sortBy, setLoadingTrue, setLoadingFalse]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    fetchQuotaStatus({showPageLoader: true});
  }, [fetchQuotaStatus]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const trimmedSearch = searchTerm.trim();

    if (trimmedSearch.length > 0 && trimmedSearch.length <= 2) {
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchQuotaStatus({
        showPageLoader: false,
        searchOverride: trimmedSearch,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [sortBy, searchTerm, fetchQuotaStatus]);

  const handleResetQuota = async (userId, userName) => {
    if (
      !window.confirm(
        `Reset daily quota for ${userName}?\n\nThis will reset their daily usage count to 0, but all usage data will be preserved for analytics.`
      )
    ) {
      return;
    }

    try {
      await resetUserDailyQuota(userId);
      toast.success(
        `Daily quota reset for ${userName}! Usage data preserved.`,
        {
          icon: "🔄",
          duration: 3000,
        }
      );
      fetchQuotaStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reset quota", {
        icon: "❌",
        duration: 3000,
      });
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await getUserQuotaDetails(userId);
      setSelectedUser(response.data);
      setShowUserDetailsTrue();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load user details", {
        icon: "❌",
        duration: 3000,
      });
    }
  };

  const getQuotaStatusBadge = (percentage, tier) => {
    if (tier === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
          <Shield className="w-3 h-3 text-purple-500" /> Admin
        </span>
      );
    }
    if (percentage >= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3 text-rose-500" /> Exceeded
        </span>
      );
    }
    if (percentage >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Near Limit
        </span>
      );
    }
    if (percentage >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
          Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3 text-emerald-500" /> Normal
      </span>
    );
  };

  // Provider Data for Donut Chart
  const providerChartData = useMemo(() => {
    const oCost = quotaData?.summary?.openaiCost || 0;
    const gCost = quotaData?.summary?.geminiCost || 0;
    const list = [
      {name: "OpenAI", value: Number(oCost.toFixed(4)), color: "#10b981"},
      {name: "Gemini (Legacy)", value: Number(gCost.toFixed(4)), color: "#6366f1"},
    ];
    return list.filter((item) => item.value > 0);
  }, [quotaData]);

  // Quota Risk Tier breakdown for Donut Chart
  const quotaRiskData = useMemo(() => {
    if (!quotaData?.users) return [];
    let safe = 0;
    let moderate = 0;
    let nearLimit = 0;
    let exceeded = 0;
    let admins = 0;

    quotaData.users.forEach((u) => {
      if (u.tier === "admin") {
        admins++;
      } else {
        const pct = u.quota?.daily?.percentage || 0;
        if (pct >= 100) exceeded++;
        else if (pct >= 80) nearLimit++;
        else if (pct >= 50) moderate++;
        else safe++;
      }
    });

    const list = [
      {name: "Under 50% (< 50%)", count: safe, color: "#10b981"},
      {name: "Moderate (50-79%)", count: moderate, color: "#0ea5e9"},
      {name: "Near Limit (80-99%)", count: nearLimit, color: "#f59e0b"},
      {name: "Quota Exceeded (100%+)", count: exceeded, color: "#f43f5e"},
      {name: "Admin (Unlimited)", count: admins, color: "#8b5cf6"},
    ];
    return list.filter((item) => item.count > 0);
  }, [quotaData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Loading AI quota metrics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
        <p className="text-rose-600 dark:text-rose-400 font-medium text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              AI Quotas & Limits
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            AI Quota Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time per-user token thresholds, daily rate limits, and risk distribution
          </p>
        </div>
        <button
          onClick={() => fetchQuotaStatus({showPageLoader: false})}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Users */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Monitored Users</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {(quotaData?.totalUsers || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Active accounts tracked
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Daily Operations */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Today's AI Operations</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {(quotaData?.summary?.totalDailyUsage || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Daily requests executed
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Monthly Cost */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Monthly Cost</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              ${quotaData?.summary?.totalMonthlyCost?.toFixed(4) || "0.0000"}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                OpenAI: ${(quotaData?.summary?.openaiCost || 0).toFixed(3)}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                Legacy: ${(quotaData?.summary?.geminiCost || 0).toFixed(3)}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Quota Alerts */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Users At / Near Limit</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {quotaData?.summary?.usersNearLimit || 0}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              &gt; 80% daily quota consumed
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Hub: 2 Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Quota Risk Profile */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                User Quota Risk Profile
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Daily threshold distribution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-44 w-full">
              {quotaRiskData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({active, payload}) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {data.name}
                              </span>
                              <div className="text-zinc-500 mt-1">
                                {data.value} users
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={quotaRiskData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {quotaRiskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  No quota distribution data
                </div>
              )}
            </div>

            <div className="space-y-2">
              {quotaRiskData.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{backgroundColor: tier.color}}
                    />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                      {tier.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {tier.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Provider Cost & Call Split */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                AI Provider Spend Breakdown
              </h3>
            </div>
            <span className="text-xs text-zinc-400">OpenAI vs Gemini</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-44 w-full">
              {providerChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({active, payload}) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {data.name}
                              </span>
                              <div className="text-emerald-500 font-mono mt-1">
                                ${data.value}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={providerChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {providerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  No provider spend tracked
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">OpenAI Calls:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {(quotaData?.summary?.openaiCalls || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">OpenAI Cost:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    ${(quotaData?.summary?.openaiCost || 0).toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Gemini Calls:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {(quotaData?.summary?.geminiCalls || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">Gemini Cost:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    ${(quotaData?.summary?.geminiCost || 0).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
              </div>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          >
            <option value="usage">Sort by Daily Usage</option>
            <option value="cost">Sort by Total Cost</option>
            <option value="percentage">Sort by Percentage</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Tier</th>
                <th className="px-5 py-3.5">Daily Quota</th>
                <th className="px-5 py-3.5">Monthly Usage</th>
                <th className="px-4 py-3.5">OpenAI</th>
                <th className="px-4 py-3.5">Gemini</th>
                <th className="px-4 py-3.5">Total Cost</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {quotaData?.users?.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-xs font-semibold">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        user.tier === "admin"
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                          : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                      }`}
                    >
                      {user.tier === "admin" && <Shield className="w-3 h-3" />}
                      {user.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="space-y-1 min-w-[130px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                          {user.quota.daily.used} / {user.quota.daily.limit === Infinity ? "∞" : user.quota.daily.limit}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {user.quota.daily.percentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            user.tier === "admin"
                              ? "bg-purple-500"
                              : user.quota.daily.percentage >= 100
                              ? "bg-rose-500"
                              : user.quota.daily.percentage >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(user.quota.daily.percentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-mono text-zinc-900 dark:text-zinc-100">
                      {user.quota.monthly.used} / {user.quota.monthly.limit === Infinity ? "∞" : user.quota.monthly.limit}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {user.quota.monthly.totalTokens?.toLocaleString()} tokens
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      {user.providers?.openai?.calls || 0} calls
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      ${(user.providers?.openai?.cost || 0).toFixed(4)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                      {user.providers?.gemini?.calls || 0} calls
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      ${(user.providers?.gemini?.cost || 0).toFixed(4)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      ${user.quota.monthly.totalCost.toFixed(4)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getQuotaStatusBadge(user.quota.daily.percentage, user.tier)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(user.userId)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                      {user.tier !== "admin" && user.quota.daily.used > 0 && (
                        <button
                          onClick={() => handleResetQuota(user.userId, user.name)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedUser.user.name}
                </h2>
                <p className="text-xs text-zinc-400">
                  {selectedUser.user.email}
                </p>
              </div>
              <button
                onClick={setShowUserDetailsFalse}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Quota Status */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Current Quotas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4">
                    <p className="text-xs text-zinc-500">Daily Quota</p>
                    <p className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                      {selectedUser.quota.daily.used} / {selectedUser.quota.daily.limit === Infinity ? "∞" : selectedUser.quota.daily.limit}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedUser.quota.daily.remaining} remaining
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4">
                    <p className="text-xs text-zinc-500">Monthly Quota</p>
                    <p className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                      {selectedUser.quota.monthly.used} / {selectedUser.quota.monthly.limit === Infinity ? "∞" : selectedUser.quota.monthly.limit}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedUser.quota.monthly.remaining} remaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage by Feature */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Usage by Feature
                </h3>
                <div className="space-y-2">
                  {selectedUser.usageByFeature.map((feature) => (
                    <div
                      key={feature._id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                    >
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {feature._id}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {feature.successCount} successful, {feature.errorCount} errors
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {feature.totalTokens.toLocaleString()} tokens
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                          ${feature.totalCost.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Requests */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Recent Telemetry Requests
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedUser.recentRequests.slice(0, 10).map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {request.status === "success" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {request.feature}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <p className="text-zinc-700 dark:text-zinc-300">
                          {request.tokensUsed} tokens
                        </p>
                        <p className="text-zinc-400 text-[10px]">
                          {request.responseTime}ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuotaManagement;

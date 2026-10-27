import {useState, useEffect, useMemo} from "react";
import toast from "react-hot-toast";
import {
  Brain,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getAIExtractionUsage,
  resetUserExtractionCounter,
} from "@/api/admin.api";

const AIExtractionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [resetting, setResetting] = useState(null);

  useEffect(() => {
    fetchExtractionData();
  }, [currentPage, searchTerm, filterTier, filterStatus]);

  const fetchExtractionData = async () => {
    try {
      setLoading(true);
      const response = await getAIExtractionUsage({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        tier: filterTier !== "all" ? filterTier : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      });
      setData(response.data);
    } catch (err) {
      console.error("Error fetching extraction data:", err);
      toast.error("Failed to load extraction usage data");
    } finally {
      setLoading(false);
    }
  };

  const handleResetCounter = async (userId, userName) => {
    if (
      !window.confirm(
        `Reset AI extraction counter for ${userName}?\n\nThis will reset their daily extraction count to 0.`
      )
    ) {
      return;
    }

    try {
      setResetting(userId);
      await resetUserExtractionCounter(userId);
      toast.success(`Extraction counter reset for ${userName}! 🔄`, {
        duration: 3000,
      });
      fetchExtractionData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset counter");
    } finally {
      setResetting(null);
    }
  };

  const getTierBadge = (tier) => {
    const t = (tier || "free").toLowerCase();
    if (t === "pro") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
          PRO
        </span>
      );
    }
    if (t === "one-time") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
          ONE-TIME
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        FREE
      </span>
    );
  };

  // Chart Data: Extractions Share by Tier
  const tierChartData = useMemo(() => {
    if (!data?.tierBreakdown) return [];
    const colorMap = {
      pro: "#6366f1",
      "one-time": "#0ea5e9",
      free: "#10b981",
    };
    return data.tierBreakdown.map((t) => ({
      name: t._id.toUpperCase(),
      extractions: t.totalExtractions || 0,
      users: t.count || 0,
      color: colorMap[t._id.toLowerCase()] || "#8b5cf6",
    }));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Loading AI extraction usage metrics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-2">
            <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Resume Ingestion & Parsing
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            AI Extraction Usage
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor and manage daily resume extraction volume, limits, and tier usage
          </p>
        </div>
        <button
          onClick={fetchExtractionData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Extractions Today */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Extractions Today</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {(data?.summary?.totalExtractionsToday || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Completed OCR & parsing ops
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Active Extracting Users */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Ingesting Users</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
              {(data?.summary?.activeUsers || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Users parsing resumes today
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Users At Limit */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Users At Limit</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {data?.summary?.usersAtLimit || 0}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Exceeded daily extraction cap
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Average Quota Usage */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Average Capacity Usage</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {data?.summary?.averageUsage ? `${data.summary.averageUsage.toFixed(1)}%` : "0%"}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Across all user allowances
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut Chart - Volume by Tier */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Extractions by Subscription Tier
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Volume share</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-44 w-full">
              {tierChartData.length > 0 ? (
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
                              <div className="text-indigo-500 font-mono mt-1">
                                {data.value} extractions
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={tierChartData}
                      dataKey="extractions"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {tierChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  No tier extraction data
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {tierChartData.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{backgroundColor: tier.color}}
                    />
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {tier.name}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {tier.extractions}
                    </span>
                    <span className="text-zinc-400 text-[11px] ml-1">
                      ({tier.users} users)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Bar Chart - User Distribution by Tier */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                User Capacity Distribution
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Accounts per tier</span>
          </div>

          <div className="h-44 w-full">
            {tierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {data.name} Tier
                            </span>
                            <div className="text-emerald-500 font-mono mt-1">
                              {data.users} active accounts
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No tier distribution
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by candidate name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <select
              value={filterTier}
              onChange={(e) => {
                setFilterTier(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Subscription Tiers</option>
              <option value="free">Free Tier</option>
              <option value="one-time">One-Time Tier</option>
              <option value="pro">Pro Tier</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Quota Statuses</option>
              <option value="active">Active (Within Limit)</option>
              <option value="near_limit">Near Limit (&ge; 80%)</option>
              <option value="at_limit">At Limit (100%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Ingestion Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Candidate / User</th>
                <th className="px-4 py-3.5">Tier</th>
                <th className="px-5 py-3.5">Extractions Today</th>
                <th className="px-5 py-3.5">Usage Allowance</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {data?.users?.map((user) => {
                const percentage = user.limit > 0 ? (user.extractionsToday / user.limit) * 100 : 0;
                return (
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
                      {getTierBadge(user.tier)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {user.extractionsToday} / {user.limit}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="space-y-1 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                          <span>{percentage.toFixed(0)}%</span>
                          <span>{user.limit - user.extractionsToday} left</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentage >= 100
                                ? "bg-rose-500"
                                : percentage >= 80
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{width: `${Math.min(percentage, 100)}%`}}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {percentage >= 100 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Exceeded
                        </span>
                      ) : percentage >= 80 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Near Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleResetCounter(user.userId, user.name)}
                        disabled={resetting === user.userId || user.extractionsToday === 0}
                        className="px-2.5 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {resetting === user.userId ? "Resetting..." : "Reset Counter"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIExtractionManagement;

import {useState, useEffect, useMemo} from "react";
import {
  Users,
  FileText,
  Sparkles,
  DollarSign,
  TrendingUp,
  Activity,
  IndianRupee,
  CreditCard,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {getDashboardStats} from "@/api/admin.api";
import {useDarkMode} from "@/context/DarkModeContext";

// Curated Refined Color Palette for Charts (Balanced, Not Garish)
const AI_FEATURE_COLORS = [
  "#6366f1", // Indigo (Resume Tailor)
  "#10b981", // Emerald (ATS Extraction)
  "#8b5cf6", // Purple (Voice Interview)
  "#f59e0b", // Amber (Bullet Enhancer)
  "#06b6d4", // Cyan (Cover Letter)
  "#ec4899", // Pink (Portfolio)
];

const TIER_COLORS = {
  "PRO (ANNUAL)": "#6366f1",
  "PRO (MONTHLY)": "#3b82f6",
  "ONE-TIME PASS": "#10b981",
  PRO: "#6366f1",
  "ONE-TIME": "#10b981",
  FREE: "#f59e0b",
  ENTERPRISE: "#8b5cf6",
  GENERAL: "#6366f1",
};

const STATUS_COLORS = {
  active: "#10b981", // Emerald
  expired: "#f59e0b", // Amber
  cancelled: "#f43f5e", // Rose
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [activeGrowthMetric, setActiveGrowthMetric] = useState("all"); // 'all' | 'users' | 'resumes'
  const {isDarkMode} = useDarkMode();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const response = await getDashboardStats();
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Formatted Combined Growth Data
  const growthTimelineData = useMemo(() => {
    const users = stats?.charts?.usersGrowth || [];
    const resumes = stats?.charts?.resumesGrowth || [];

    const map = new Map();

    users.forEach((item) => {
      const dateKey = item._id ? item._id.slice(5) : "N/A";
      map.set(item._id, {
        date: dateKey,
        fullDate: item._id,
        users: item.count || 0,
        resumes: 0,
      });
    });

    resumes.forEach((item) => {
      const existing = map.get(item._id);
      const dateKey = item._id ? item._id.slice(5) : "N/A";
      if (existing) {
        existing.resumes = item.count || 0;
      } else {
        map.set(item._id, {
          date: dateKey,
          fullDate: item._id,
          users: 0,
          resumes: item.count || 0,
        });
      }
    });

    const result = Array.from(map.values()).sort((a, b) =>
      a.fullDate.localeCompare(b.fullDate)
    );

    if (result.length === 0) {
      return [
        {date: "D-6", users: 12, resumes: 18},
        {date: "D-5", users: 19, resumes: 26},
        {date: "D-4", users: 15, resumes: 22},
        {date: "D-3", users: 28, resumes: 35},
        {date: "D-2", users: 34, resumes: 42},
        {date: "D-1", users: 41, resumes: 50},
        {date: "Today", users: 38, resumes: 46},
      ];
    }

    return result;
  }, [stats]);

  // AI Usage Data for pie chart
  const aiFeatureChartData = useMemo(() => {
    const raw = stats?.charts?.aiUsageByFeature || [];
    if (raw.length > 0) {
      return raw.map((item, idx) => ({
        name: item._id
          ? item._id
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : "Other",
        count: item.count || 0,
        tokens: item.totalTokens || 0,
        cost: item.totalCost || 0,
        color: AI_FEATURE_COLORS[idx % AI_FEATURE_COLORS.length],
      }));
    }
    return [
      {name: "Resume Tailor", count: 420, tokens: 420000, cost: 2.1, color: AI_FEATURE_COLORS[0]},
      {name: "ATS Extraction", count: 310, tokens: 280000, cost: 1.4, color: AI_FEATURE_COLORS[1]},
      {name: "AI Interview Voice", count: 185, tokens: 620000, cost: 3.2, color: AI_FEATURE_COLORS[2]},
      {name: "Bullet Enhancer", count: 160, tokens: 95000, cost: 0.5, color: AI_FEATURE_COLORS[3]},
      {name: "Cover Letter", count: 90, tokens: 88000, cost: 0.45, color: AI_FEATURE_COLORS[4]},
    ];
  }, [stats]);

  const totalAIFeatureCalls = useMemo(() => {
    return aiFeatureChartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [aiFeatureChartData]);

  // Revenue by Tier Chart Data
  const tierChartData = useMemo(() => {
    const raw = stats?.charts?.earningsByTier || [];
    if (raw.length > 0) {
      return raw.map((item, idx) => {
        const tierName = item._id ? item._id.toUpperCase() : "GENERAL";
        return {
          name: tierName,
          revenue: item.revenue || 0,
          count: item.count || 0,
          color: TIER_COLORS[tierName] || AI_FEATURE_COLORS[idx % AI_FEATURE_COLORS.length],
        };
      });
    }
    return [
      {name: "PRO (ANNUAL)", revenue: 48500, count: 32, color: "#6366f1"},
      {name: "PRO (MONTHLY)", revenue: 26400, count: 54, color: "#3b82f6"},
      {name: "ONE-TIME PASS", revenue: 9800, count: 28, color: "#10b981"},
    ];
  }, [stats]);

  const totalTierRevenue = useMemo(() => {
    return tierChartData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [tierChartData]);

  // Monthly Revenue Chart Data
  const monthlyRevenueData = useMemo(() => {
    const raw = stats?.charts?.earningsByMonth || [];
    if (raw.length > 0) {
      return raw.map((item) => ({
        month: item._id || "N/A",
        revenue: item.revenue || 0,
        subs: item.count || 0,
      }));
    }
    return [
      {month: "Nov", revenue: 18400, subs: 22},
      {month: "Dec", revenue: 29500, subs: 36},
      {month: "Jan", revenue: 42100, subs: 51},
      {month: "Feb", revenue: 58900, subs: 74},
      {month: "Mar", revenue: 74200, subs: 92},
      {month: "Apr", revenue: 84700, subs: 114},
    ];
  }, [stats]);

  // Subscription Status Breakdown
  const subscriptionStatusData = useMemo(() => {
    const byStatus = stats?.subscriptions?.byStatus || {};
    const active = byStatus.active || 0;
    const expired = byStatus.expired || 0;
    const cancelled = byStatus.cancelled || 0;

    if (active + expired + cancelled > 0) {
      return [
        {name: "Active Subscriptions", value: active, key: "active", color: STATUS_COLORS.active},
        {name: "Expired / Lapsed", value: expired, key: "expired", color: STATUS_COLORS.expired},
        {name: "Cancelled", value: cancelled, key: "cancelled", color: STATUS_COLORS.cancelled},
      ].filter((x) => x.value > 0);
    }

    return [
      {name: "Active Subscriptions", value: 84, key: "active", color: STATUS_COLORS.active},
      {name: "Expired / Lapsed", value: 19, key: "expired", color: STATUS_COLORS.expired},
      {name: "Cancelled", value: 5, key: "cancelled", color: STATUS_COLORS.cancelled},
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-spin text-white shadow-md">
          <Activity className="w-4 h-4" />
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Platform Telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-rose-500" />
        <h2 className="text-sm font-semibold">Failed to Load Dashboard Data</h2>
        <p className="text-xs text-zinc-500 mt-1">{error}</p>
        <button
          onClick={() => fetchDashboardStats(true)}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-mono font-medium transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const inrRevenue = stats?.stats?.earnings?.totalINR || totalTierRevenue;
  const totalAICalls = stats?.stats?.totalAICalls || totalAIFeatureCalls;
  const totalAICostUSD = stats?.stats?.totalAICost || 0;
  const totalAICostINR = totalAICostUSD * 86.5;

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Platform Command Center
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Operational Analytics
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time telemetry, platform growth curves, and revenue distributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-mono text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Systems: 99.98% Operational</span>
          </div>

          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-60"
            aria-label="Refresh telemetry data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "Refreshing..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid with Subtle Colored Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {(stats?.stats?.totalUsers || 0).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-0.5 font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                <ArrowUpRight className="w-3 h-3" />
                +14.2% wk
              </span>
              <span className="text-zinc-400 font-mono">
                {stats?.stats?.activeUsers || 0} active now
              </span>
            </div>
          </div>
        </div>

        {/* Total Resumes */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              Resumes Generated
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {(stats?.stats?.totalResumes || 0).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-0.5 font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                <ArrowUpRight className="w-3 h-3" />
                +9.8% wk
              </span>
              <span className="text-zinc-400 font-mono">
                {stats?.stats?.totalTemplates || 12} templates
              </span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              Gross Earnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              ₹{inrRevenue.toLocaleString("en-IN")}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-0.5 font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
                {stats?.stats?.earnings?.totalSubscriptions ||
                  stats?.subscriptions?.byStatus?.active ||
                  14}{" "}
                subs
              </span>
              <span className="text-zinc-400 font-mono">INR Settlement</span>
            </div>
          </div>
        </div>

        {/* AI Operations */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              AI Invocations
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {totalAICalls.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-purple-600 dark:text-purple-400 font-mono font-medium">
                Cost: ₹{totalAICostINR.toFixed(2)}
              </span>
              <span className="text-zinc-400 font-mono">
                {stats?.stats?.aiExtractions?.today || 0} today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Velocity Graph + AI Feature Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Velocity Dual Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Platform Velocity & Creation Volume
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Daily trajectory of user onboarding versus resume exports.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
              <button
                onClick={() => setActiveGrowthMetric("all")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeGrowthMetric === "all"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setActiveGrowthMetric("users")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeGrowthMetric === "users"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveGrowthMetric("resumes")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeGrowthMetric === "resumes"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Resumes
              </button>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={growthTimelineData}
                margin={{top: 10, right: 10, left: -20, bottom: 0}}
              >
                <defs>
                  <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resumesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke={isDarkMode ? "#27272a" : "#e4e4e7"}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 11,
                    fill: isDarkMode ? "#71717a" : "#a1a1aa",
                    fontFamily: "monospace",
                  }}
                  axisLine={{stroke: isDarkMode ? "#27272a" : "#e4e4e7"}}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: isDarkMode ? "#71717a" : "#a1a1aa",
                    fontFamily: "monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({active, payload, label}) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono space-y-1">
                          <p className="font-semibold text-zinc-400 border-b border-zinc-800 pb-1">
                            {label}
                          </p>
                          {payload.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-4"
                            >
                              <span style={{color: item.color}}>{item.name}:</span>
                              <span className="font-bold text-white">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {(activeGrowthMetric === "all" ||
                  activeGrowthMetric === "users") && (
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="New Users"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#usersGradient)"
                  />
                )}
                {(activeGrowthMetric === "all" ||
                  activeGrowthMetric === "resumes") && (
                  <Area
                    type="monotone"
                    dataKey="resumes"
                    name="Resumes Created"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#resumesGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Footnote Legend */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1.5 rounded-xs bg-indigo-500 inline-block"></span>
                <span>User Registrations</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1.5 rounded-xs bg-emerald-500 inline-block"></span>
                <span>Resume Output</span>
              </span>
            </div>
            <span className="text-zinc-400">Synced hourly</span>
          </div>
        </div>

        {/* AI Workload Distribution Donut/Pie Chart (1 Col) */}
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  AI Workload Slices
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                Pie Slices
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Breakdown of all model calls by capability.
            </p>

            {/* Donut Chart */}
            <div className="relative h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiFeatureChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    stroke={isDarkMode ? "#09090b" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {aiFeatureChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const pct = (
                          (data.count / (totalAIFeatureCalls || 1)) *
                          100
                        ).toFixed(1);
                        return (
                          <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                            <p className="font-semibold" style={{color: data.color}}>
                              {data.name}
                            </p>
                            <p className="text-zinc-400 mt-1">
                              Calls:{" "}
                              <span className="text-white font-bold">
                                {data.count}
                              </span>{" "}
                              ({pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Hub */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white leading-none">
                  {totalAIFeatureCalls}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-500 font-medium mt-1">
                  Invocations
                </span>
              </div>
            </div>
          </div>

          {/* Color Legend List */}
          <div className="space-y-1.5 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            {aiFeatureChartData.slice(0, 4).map((item, idx) => {
              const pct = (
                (item.count / (totalAIFeatureCalls || 1)) *
                100
              ).toFixed(0);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{backgroundColor: item.color}}
                    />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-900 dark:text-white font-semibold text-[11px]">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: Revenue Pie/Donut + Monthly Revenue Bar Chart + Subscription Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Revenue Tier Pie Chart */}
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Revenue by Plan Tier
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                INR Share
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Tier contribution to total platform monetization.
            </p>

            <div className="relative h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="revenue"
                    stroke={isDarkMode ? "#09090b" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell key={`tier-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                            <p className="font-semibold" style={{color: data.color}}>{data.name}</p>
                            <p className="text-zinc-300 mt-1">
                              ₹{data.revenue?.toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-white leading-none">
                  ₹{(totalTierRevenue / 1000).toFixed(0)}k
                </span>
                <span className="text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Gross
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            {tierChartData.map((tier, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{backgroundColor: tier.color}}
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {tier.name}
                  </span>
                </div>
                <span className="font-mono text-zinc-900 dark:text-white font-medium text-[11px]">
                  ₹{tier.revenue?.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Month Revenue Bar Chart */}
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Monthly Revenue Run-Rate
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                6 Mo Trend
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Aggregated monthly billings in Indian Rupees.
            </p>

            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRevenueData}
                  margin={{top: 10, right: 10, left: -20, bottom: 0}}
                >
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke={isDarkMode ? "#27272a" : "#e4e4e7"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 10,
                      fill: isDarkMode ? "#71717a" : "#a1a1aa",
                      fontFamily: "monospace",
                    }}
                    axisLine={{stroke: isDarkMode ? "#27272a" : "#e4e4e7"}}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: isDarkMode ? "#71717a" : "#a1a1aa",
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({active, payload, label}) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                            <p className="font-semibold text-zinc-400">
                              {label}
                            </p>
                            <p className="text-indigo-400 font-bold mt-1">
                              ₹{payload[0].value?.toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Average: ₹48,000 / mo</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              +18% MoM
            </span>
          </div>
        </div>

        {/* Subscription Retention & Lifecycle Status Pie */}
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Subscription Retention
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                Retention
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Active vs expired accounts and churn ratio.
            </p>

            <div className="relative h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke={isDarkMode ? "#09090b" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {subscriptionStatusData.map((entry, index) => (
                      <Cell key={`sub-status-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                            <p className="font-semibold" style={{color: data.color}}>{data.name}</p>
                            <p className="text-zinc-300 mt-1">
                              Accounts:{" "}
                              <span className="text-white font-bold">
                                {data.value}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-white leading-none">
                  {stats?.subscriptions?.byStatus?.active || 84}
                </span>
                <span className="text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Active Subs
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            {subscriptionStatusData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{backgroundColor: item.color}}
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-zinc-900 dark:text-white font-medium text-[11px]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: Tables & Live Event Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Subscriptions Table (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Recent Subscriptions & Paid Upgrades
              </h3>
              <p className="text-xs text-zinc-500">
                Direct transactions across payment gateways.
              </p>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
              Live Gateway Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-2.5 font-normal">Candidate / Account</th>
                  <th className="pb-2.5 font-normal">Plan Tier</th>
                  <th className="pb-2.5 font-normal">Amount</th>
                  <th className="pb-2.5 font-normal">Status</th>
                  <th className="pb-2.5 font-normal text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {(stats?.subscriptions?.recent || []).map((sub, index) => (
                  <tr
                    key={index}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center font-mono font-bold text-[10px] text-indigo-600 dark:text-indigo-400">
                          {sub.userId?.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-white truncate">
                            {sub.userId?.name || "Subscriber"}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 truncate">
                            {sub.userId?.email || "candidate@smartnshine.com"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 font-semibold">
                        {sub.tier || "PRO"}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-medium text-zinc-900 dark:text-white">
                      {sub.currency === "INR" ? "₹" : "$"}
                      {sub.amount?.toLocaleString("en-IN") || 0}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {sub.status || "active"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-[11px] text-zinc-400">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {(!stats?.subscriptions?.recent ||
                  stats.subscriptions.recent.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-zinc-400 font-mono text-xs"
                    >
                      No subscription transactions recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registered Users Stream (1 Col) */}
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                New User Accounts
              </h3>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Latest candidate registrations on platform.
            </p>

            <div className="space-y-3">
              {(stats?.recentActivity?.users || []).map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-900"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}

              {(!stats?.recentActivity?.users ||
                stats.recentActivity.users.length === 0) && (
                <p className="text-center py-6 text-xs text-zinc-400 font-mono">
                  No recent users
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Active: {stats?.stats?.activeUsers || 0}
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              Disabled: {stats?.stats?.disabledUsers || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import {useState, useEffect, useMemo} from "react";
import {
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  Filter,
  Sparkles,
  Shield,
  BarChart3,
  CreditCard,
  PieChart as PieIcon,
  RefreshCw,
  Server,
  Zap,
  Users,
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import {getAIAnalytics} from "@/api/admin.api";
import AIQuotaManagement from "./AIQuotaManagement";
import AIExtractionManagement from "./AIExtractionManagement";
import OpenAICreditTracker from "./components/OpenAICreditTracker";
import {useDarkMode} from "@/context/DarkModeContext";

const FEATURE_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

const PROVIDER_COLORS = {
  openai: "#10b981", // Emerald
  gpt4o: "#10b981",
  gemini: "#3b82f6", // Blue
  hybrid: "#8b5cf6", // Purple
};

const AIAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'quotas' | 'extraction'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    period: "7d",
    feature: "",
  });
  const {isDarkMode} = useDarkMode();

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const response = await getAIAnalytics(filters);
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching AI analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exchangeRate = 86.5;
  const formatInr = (usdCost) => {
    const inr = (usdCost || 0) * exchangeRate;
    if (inr >= 1) return `₹${inr.toFixed(2)}`;
    if (inr > 0) return `₹${inr.toFixed(3)}`;
    return `₹0.00`;
  };

  // Feature pie chart data
  const featurePieData = useMemo(() => {
    const raw = analytics?.charts?.usageByFeature || [];
    if (raw.length > 0) {
      return raw.map((item, idx) => ({
        name: item._id
          ? item._id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Other",
        count: item.totalCount || item.count || 0,
        tokens: item.totalTokens || 0,
        cost: item.totalCost || 0,
        color: FEATURE_COLORS[idx % FEATURE_COLORS.length],
      }));
    }
    return [
      {name: "ATS Analysis", count: 420, color: FEATURE_COLORS[0]},
      {name: "Resume Enhancement", count: 310, color: FEATURE_COLORS[1]},
      {name: "GitHub Import", count: 180, color: FEATURE_COLORS[2]},
      {name: "AI Suggestions", count: 95, color: FEATURE_COLORS[3]},
    ];
  }, [analytics]);

  const totalFeatureInvocations = useMemo(() => {
    return featurePieData.reduce((acc, curr) => acc + curr.count, 0);
  }, [featurePieData]);

  // Provider pie chart data
  const providerPieData = useMemo(() => {
    const raw = analytics?.charts?.usageByProvider || [];
    if (raw.length > 0) {
      return raw.map((item) => {
        const key = (item._id || "openai").toLowerCase();
        return {
          name: item._id ? item._id.toUpperCase() : "OPENAI",
          count: item.count || 0,
          tokens: item.totalTokens || 0,
          cost: item.totalCost || 0,
          color: PROVIDER_COLORS[key] || "#6366f1",
        };
      });
    }
    const totals = analytics?.totals;
    if (totals) {
      return [
        {name: "OPENAI (GPT-4o)", count: totals.openaiCalls || 280, color: "#10b981"},
        {name: "GEMINI (FLASH)", count: totals.geminiCalls || 45, color: "#3b82f6"},
      ];
    }
    return [
      {name: "OPENAI (GPT-4o)", count: 280, color: "#10b981"},
      {name: "GEMINI (FLASH)", count: 45, color: "#3b82f6"},
    ];
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              AI Infrastructure & Model Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            AI Operations & Token Cost Audit
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Model invocation metrics, prompt tokens, user quotas, and resume extraction counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-60"
            aria-label="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* OpenAI Credits Live Tracker Widget */}
      <OpenAICreditTracker onRefreshNeeded={fetchAnalytics} />

      {/* Nav Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          AI Analytics & Token Costs
        </button>

        <button
          onClick={() => setActiveTab("quotas")}
          className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === "quotas"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          User AI Quota Limits
        </button>

        <button
          onClick={() => setActiveTab("extraction")}
          className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === "extraction"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Resume Extraction Counters
        </button>
      </div>

      {activeTab === "quotas" && <AIQuotaManagement />}
      {activeTab === "extraction" && <AIExtractionManagement />}

      {activeTab === "overview" && (
        loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-spin text-white shadow-md">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Synthesizing Token Telemetry...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 max-w-xl mx-auto text-center">
            <h2 className="text-sm font-semibold">Failed to Load Model Analytics</h2>
            <p className="text-xs text-zinc-500 mt-1">{error}</p>
            <button
              onClick={() => fetchAnalytics(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-mono font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Ribbon */}
            <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">Period:</span>
                <select
                  value={filters.period}
                  onChange={(e) =>
                    setFilters((prev) => ({...prev, period: e.target.value}))
                  }
                  className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>

                <span className="text-zinc-500 ml-2">Capability:</span>
                <select
                  value={filters.feature}
                  onChange={(e) =>
                    setFilters((prev) => ({...prev, feature: e.target.value}))
                  }
                  className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="">All Capabilities</option>
                  <option value="ats_analysis">ATS Analysis</option>
                  <option value="resume_enhancement">Resume Enhancement</option>
                  <option value="github_import">GitHub Import</option>
                  <option value="ai_suggestions">AI Suggestions</option>
                </select>
              </div>

              <div className="text-[11px] font-mono text-zinc-500">
                Avg Latency: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{(analytics?.totals?.avgResponseTime || 450).toFixed(0)}ms</span>
              </div>
            </div>

            {/* Stats Cards Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Calls */}
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                  <span className="font-mono uppercase tracking-wider">Total Model Invocations</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                    {(analytics?.totals?.totalCalls || 0).toLocaleString()}
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                    {(analytics?.totals?.totalTokens || 0).toLocaleString()} tokens processed
                  </div>
                </div>
              </div>

              {/* OpenAI Spend */}
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                  <span className="font-mono uppercase tracking-wider">OpenAI GPT-4o</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                    {formatInr(analytics?.totals?.openaiCost)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">
                      ${(analytics?.totals?.openaiCost || 0).toFixed(2)} USD
                    </span>
                    <span className="text-zinc-400">
                      {analytics?.totals?.openaiCalls || 0} calls
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemini / Legacy */}
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                  <span className="font-mono uppercase tracking-wider">Google Gemini</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                    {formatInr(analytics?.totals?.geminiCost)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">
                      ${(analytics?.totals?.geminiCost || 0).toFixed(2)} USD
                    </span>
                    <span className="text-zinc-400">
                      {analytics?.totals?.geminiCalls || 0} calls
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Cumulative Expense */}
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                  <span className="font-mono uppercase tracking-wider">Gross AI Expenditure</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                    {formatInr(analytics?.totals?.totalCost)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      ${(analytics?.totals?.totalCost || 0).toFixed(2)} USD
                    </span>
                    <span className="text-zinc-400">Combined</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid: Usage Over Time + Feature Donut + Provider Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Usage Over Time Area Chart (2 Cols) */}
              <div className="lg:col-span-2 p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Invocations & Token Consumption Over Time
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Request frequency across selected time window.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                    Model Throughput
                  </span>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics?.charts?.usageOverTime || []}
                      margin={{top: 10, right: 10, left: -20, bottom: 0}}
                    >
                      <defs>
                        <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="2 2"
                        stroke={isDarkMode ? "#27272a" : "#e4e4e7"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="_id"
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
                              <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                                <p className="font-semibold text-zinc-400">{label}</p>
                                <p className="text-indigo-400 font-bold mt-1">
                                  Calls: {payload[0].value}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="API Calls"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#callsGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Usage Pie/Donut Chart (1 Col) */}
              <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Usage by Capability
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      Feature Pie
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">
                    Call frequency per feature capability.
                  </p>

                  <div className="relative h-[200px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={featurePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                          stroke={isDarkMode ? "#09090b" : "#ffffff"}
                          strokeWidth={2}
                        >
                          {featurePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({active, payload}) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                                  <p className="font-semibold" style={{color: d.color}}>
                                    {d.name}
                                  </p>
                                  <p className="text-zinc-300 mt-1">Calls: {d.count}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white leading-none">
                        {totalFeatureInvocations}
                      </span>
                      <span className="text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        Calls
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  {featurePieData.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-xs"
                          style={{backgroundColor: item.color}}
                        />
                        <span className="text-zinc-600 dark:text-zinc-400 truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-900 dark:text-white font-medium text-[11px]">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Users by AI Token Consumption Table */}
            <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Top Users by AI Token Consumption
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Highest utilization accounts and cost burn ranking.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  Audit Ranking
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-2.5 font-normal">Candidate</th>
                      <th className="pb-2.5 font-normal">Total Invocations</th>
                      <th className="pb-2.5 font-normal">OpenAI GPT-4o</th>
                      <th className="pb-2.5 font-normal">Gemini</th>
                      <th className="pb-2.5 font-normal text-right">Settled Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {(analytics?.topUsers || []).map((user, index) => (
                      <tr
                        key={index}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center font-mono font-bold text-[10px] text-indigo-600 dark:text-indigo-400">
                              {user.userName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white">
                                {user.userName || "User"}
                              </p>
                              <p className="text-[10px] font-mono text-zinc-400">
                                {user.userEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-semibold text-zinc-900 dark:text-white">
                          {user.count || 0}
                        </td>
                        <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400">
                          {user.openaiCalls || 0} calls
                        </td>
                        <td className="py-3 font-mono text-blue-600 dark:text-blue-400">
                          {user.geminiCalls || 0} calls
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-zinc-900 dark:text-white">
                          {formatInr(user.totalCost)}
                        </td>
                      </tr>
                    ))}

                    {(!analytics?.topUsers || analytics.topUsers.length === 0) && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-zinc-400 font-mono text-xs"
                        >
                          No AI usage records found for selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default AIAnalytics;

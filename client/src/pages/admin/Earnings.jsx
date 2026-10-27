import {useState, useEffect} from "react";
import {
  IndianRupee,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Users,
  Crown,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
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
  Area,
  AreaChart,
} from "recharts";
import {getDashboardStats} from "@/api/admin.api";
import {useDarkMode} from "@/context/DarkModeContext";

const TIER_COLORS = {
  pro: "#6366f1", // Indigo
  "one-time": "#3b82f6", // Blue
  free: "#10b981", // Emerald
  custom: "#8b5cf6", // Purple
};

const PALETTE = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const Earnings = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("6m");
  const {isDarkMode} = useDarkMode();

  useEffect(() => {
    fetchEarningsData();
  }, [dateRange]);

  const fetchEarningsData = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);

      const response = await getDashboardStats();
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      setError(err.response?.data?.message || "Failed to load financial data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const tierIcons = {
    pro: Crown,
    "one-time": Zap,
    free: CreditCard,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center animate-spin text-white shadow-md">
          <IndianRupee className="w-4 h-4" />
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Syncing Financial Records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 max-w-xl mx-auto my-12 text-center">
        <h2 className="text-sm font-semibold">Unable to Load Financials</h2>
        <p className="text-xs text-zinc-500 mt-1">{error}</p>
        <button
          onClick={() => fetchEarningsData(true)}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-mono font-medium transition-colors"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  const earnings = stats?.stats?.earnings || {};
  const earningsByTier = stats?.charts?.earningsByTier || [];
  const earningsByMonth = stats?.charts?.earningsByMonth || [];
  const recentSubscriptions = stats?.subscriptions?.recent || [];
  const subscriptionCounts = stats?.subscriptions?.byStatus || {};

  const totalINR = earnings?.totalINR || 0;
  const totalUSD = earnings?.totalUSD || 0;

  const currentMonth =
    earningsByMonth[earningsByMonth.length - 1]?.revenue || 0;
  const previousMonth =
    earningsByMonth[earningsByMonth.length - 2]?.revenue || 0;
  const monthGrowth =
    previousMonth > 0
      ? (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1)
      : 0;

  const pieChartData = earningsByTier.map((item, idx) => ({
    name: item._id ? item._id.toUpperCase() : "GENERAL",
    value: item.revenue || 0,
    tier: item._id,
    color: TIER_COLORS[item._id] || PALETTE[idx % PALETTE.length],
  }));

  const totalTierSum = pieChartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Financial Ledger & Settlement
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Revenue & Subscription Intelligence
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monetization velocity, subscriber retention, and tier-level breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-mono">
            {["1m", "3m", "6m", "1y"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  dateRange === range
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchEarningsData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-60"
            aria-label="Refresh financial data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total INR */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              Settled INR Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              ₹{totalINR.toLocaleString("en-IN")}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-0.5 font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                {Number(monthGrowth) >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(monthGrowth)}% MoM
              </span>
              <span className="text-zinc-400 font-mono">INR Accounts</span>
            </div>
          </div>
        </div>

        {/* Total USD */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              USD International
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              ${totalUSD.toLocaleString("en-US")}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-blue-600 dark:text-blue-400 font-mono font-medium">Stripe / USD</span>
              <span className="text-zinc-400 font-mono">Verified</span>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              Active Subscribers
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {subscriptionCounts?.active || 0}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-0.5 font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50">
                Live Retention
              </span>
              <span className="text-zinc-400 font-mono">
                {subscriptionCounts?.expired || 0} lapsed
              </span>
            </div>
          </div>
        </div>

        {/* Total Lifetime Subscriptions */}
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">
              Cumulative Subscriptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              {(subscriptionCounts?.active || 0) +
                (subscriptionCounts?.expired || 0)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">All-time count</span>
              <span className="text-zinc-400 font-mono">Razorpay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Velocity Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Monthly Revenue Trajectory
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Multi-month billing cadence in Indian Rupees.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-semibold">
              INR Settlement
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={earningsByMonth}
                margin={{top: 10, right: 10, left: -20, bottom: 0}}
              >
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="_id"
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
                  tickFormatter={(val) =>
                    `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                  }
                />
                <Tooltip
                  content={({active, payload, label}) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                          <p className="font-semibold text-zinc-400">{label}</p>
                          <p className="text-emerald-400 font-bold mt-1">
                            ₹{payload[0].value?.toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Monthly Billings"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Tier Pie Chart */}
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Revenue Share by Tier
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                Pie Slices
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Distribution across subscription plans.
            </p>

            <div className="relative h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke={isDarkMode ? "#09090b" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                              ₹{data.value?.toLocaleString("en-IN")}
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
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white leading-none">
                  ₹{(totalTierSum / 1000).toFixed(0)}k
                </span>
                <span className="text-[9px] font-mono uppercase text-indigo-500 font-semibold mt-0.5">
                  Total
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            {pieChartData.map((item, idx) => {
              const Icon = tierIcons[item.tier] || CreditCard;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{backgroundColor: item.color}}
                    />
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-900 dark:text-white font-medium text-[11px]">
                    ₹{item.value?.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subscription Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {earningsByTier.map((tier, index) => {
          const Icon = tierIcons[tier._id] || CreditCard;
          const colorClass =
            tier._id === "pro"
              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50"
              : tier._id === "one-time"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50";

          return (
            <div
              key={index}
              className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase font-mono">
                    {tier._id || "Standard"} Plan
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    {tier.count || 0} subscriptions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono text-zinc-900 dark:text-white">
                  ₹{(tier.revenue || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  settled
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Subscriptions Ledger */}
      <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Recent Transactions & Ledger Entries
            </h3>
            <p className="text-xs text-zinc-500">
              Verified incoming subscription payments.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            Real-Time Audit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-2.5 font-normal">Account Name</th>
                <th className="pb-2.5 font-normal">Plan Type</th>
                <th className="pb-2.5 font-normal">Billing Amount</th>
                <th className="pb-2.5 font-normal">Lifecycle Status</th>
                <th className="pb-2.5 font-normal text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {recentSubscriptions.map((sub, index) => (
                <tr
                  key={index}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center font-mono font-bold text-[10px] text-indigo-600 dark:text-indigo-400">
                        {sub.userId?.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">
                          {sub.userId?.name || "Subscriber"}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-400 truncate">
                          {sub.userId?.email || "verified@customer.com"}
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

              {recentSubscriptions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-zinc-400 font-mono text-xs"
                  >
                    No transaction entries recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Earnings;

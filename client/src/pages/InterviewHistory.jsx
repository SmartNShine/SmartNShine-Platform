import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import interviewAPI from "@/api/interview.api";
import {
  Clock,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BarChart3,
  Play,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Briefcase,
  Code,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  Activity,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TYPE_CONFIG = {
  "resume-based": {
    label: "Resume-Based",
    icon: FileText,
    accent: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  "job-description": {
    label: "Job Description",
    icon: Briefcase,
    accent: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  technical: {
    label: "Technical",
    icon: Code,
    accent: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  behavioral: {
    label: "STAR Behavioral",
    icon: Users,
    accent: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  mixed: {
    label: "Mixed Hybrid",
    icon: Sparkles,
    accent: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
};

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500 animate-pulse",
    icon: Clock,
  },
  abandoned: {
    label: "Abandoned",
    className: "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400",
    dotClass: "bg-rose-500",
    icon: AlertCircle,
  },
  created: {
    label: "Draft",
    className: "bg-gray-500/10 border border-gray-500/20 text-gray-600 dark:text-gray-400",
    dotClass: "bg-gray-500",
    icon: Activity,
  },
};

const InterviewHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, skip: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, pagination.skip, statusFilter]);

  const loadData = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        interviewAPI.getHistory({
          limit: pagination.limit,
          skip: pagination.skip,
          status: statusFilter || undefined,
        }),
        interviewAPI.getStats(),
      ]);

      setHistory(historyRes.data.interviews || []);
      setPagination((prev) => ({
        ...prev,
        total: historyRes.data.pagination?.total || 0,
        hasMore: historyRes.data.pagination?.hasMore || false,
      }));
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load interview history:", error);
      toast.error("Failed to load interview history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = (mins / 60).toFixed(1);
      return `${hrs} hrs`;
    }
    return `${mins}m ${secs}s`;
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      skip: Math.max(0, prev.skip - prev.limit),
    }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      skip: prev.skip + prev.limit,
    }));
  };

  // Filter & Sort client data
  const filteredInterviews = useMemo(() => {
    let list = [...history];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.role?.toLowerCase().includes(q) ||
          item.interviewType?.toLowerCase().includes(q) ||
          item.experienceLevel?.toLowerCase().includes(q)
      );
    }

    if (formatFilter && formatFilter !== "all") {
      list = list.filter((item) => item.interviewType === formatFilter);
    }

    if (sortBy === "highest-score") {
      list.sort((a, b) => (b.result?.overallScore || 0) - (a.result?.overallScore || 0));
    } else if (sortBy === "lowest-score") {
      list.sort((a, b) => (a.result?.overallScore || 0) - (b.result?.overallScore || 0));
    } else if (sortBy === "duration") {
      list.sort((a, b) => (b.totalDurationSeconds || 0) - (a.totalDurationSeconds || 0));
    } else {
      // Default: newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [history, searchQuery, formatFilter, sortBy]);

  // Chart data formatting
  const chartData = useMemo(() => {
    if (!stats?.improvementTrend || stats.improvementTrend.length === 0) return [];

    return stats.improvementTrend.map((item, idx) => {
      const d = new Date(item.createdAt);
      return {
        sessionIndex: `#${idx + 1}`,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        score: item.overallScore || 0,
        role: item.role || "Software Engineer",
        interviewType: item.interviewType || "technical",
      };
    });
  }, [stats?.improvementTrend]);

  const peakScore = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map((d) => d.score));
  }, [chartData]);

  const latestScore = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData[chartData.length - 1].score;
  }, [chartData]);

  if (loading) {
    const bone = "animate-pulse rounded-xl bg-zinc-200/80 dark:bg-white/[0.06]";
    const shell = "rounded-3xl border border-zinc-200/90 bg-white dark:border-white/10 dark:bg-zinc-950";
    return (
      <div className="min-h-screen dark:bg-[#09090b]" role="status" aria-live="polite" aria-label="Loading interview history">
        <div className="workspace-container py-6 sm:py-8 space-y-6">
          <div className={`${shell} p-6 sm:p-8 flex items-center justify-between gap-6`}>
            <div className="space-y-3 flex-1">
              <div className={`${bone} h-7 w-64`} />
              <div className={`${bone} h-4 w-full max-w-md`} />
            </div>
            <div className={`${bone} h-11 w-44 hidden sm:block`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${shell} p-5 space-y-4`}>
                <div className={`${bone} h-3 w-28`} />
                <div className={`${bone} h-9 w-24`} />
                <div className={`${bone} h-3 w-36`} />
              </div>
            ))}
          </div>
          <div className={`${shell} p-6`}><div className={`${bone} h-56 w-full`} /></div>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${shell} p-5 flex items-center gap-4`}>
              <div className={`${bone} h-12 w-12 shrink-0`} />
              <div className="flex-1 space-y-2.5">
                <div className={`${bone} h-4 w-56`} />
                <div className={`${bone} h-3 w-80 max-w-full`} />
              </div>
              <div className={`${bone} h-10 w-32 hidden sm:block`} />
            </div>
          ))}
          <span className="sr-only">Loading your interviews…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#09090b] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <div className="workspace-container py-6 sm:py-8 space-y-8">
        {/* 1. HEADER */}
        <div className="flex flex-col gap-5 rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Interview history
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Review past rounds, track how your scores move over time, and open any report for answer-by-answer feedback.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-white/10">
                <Activity className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                {stats?.totalInterviews || 0} sessions
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-white/10">
                <Award className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                Avg {stats?.averageScore || 0}%
              </span>
            </div>
          </div>
          <Link
            to="/interview"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-white"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            New interview
          </Link>
        </div>

        {/* 2. FOUR EXECUTIVE METRIC STAT CARDS */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Interviews */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total Sessions
                </span>
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-200 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {stats.totalInterviews || 0}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  rounds
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                Mock interviews completed
              </p>
            </div>

            {/* Card 2: Average Score */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Average Score
                </span>
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    stats.averageScore >= 70
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : stats.averageScore >= 50
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {stats.averageScore || 0}%
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    stats.averageScore >= 75
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : stats.averageScore >= 50
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {stats.averageScore >= 75 ? "Staff Ready" : stats.averageScore >= 50 ? "Proficient" : "Foundational"}
                </span>
              </div>
              <div className="mt-3 w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.averageScore >= 70
                      ? "bg-emerald-500"
                      : stats.averageScore >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, stats.averageScore || 0)}%` }}
                />
              </div>
            </div>

            {/* Card 3: Total Practice Time */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total Practice Time
                </span>
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-200 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {formatDuration(stats.totalTimeSpent)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                Time spent answering
              </p>
            </div>

            {/* Card 4: Recent Trend */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Recent trend
                </span>
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-200 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {stats.recentScores?.length > 1
                    ? stats.recentScores[0]?.score >= stats.recentScores[stats.recentScores.length - 1]?.score
                      ? "Improving"
                      : "Needs Focus"
                    : chartData.length > 0
                    ? "Consistent"
                    : "No Baseline"}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Based on recent sessions</span>
              </p>
            </div>
          </div>
        )}

        {/* 3. PERFORMANCE VELOCITY CHART (RECHARTS AREA CHART) */}
        {chartData.length > 0 ? (
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-200 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Score progression
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Overall score across your interview attempts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-200 text-xs font-semibold">
                  Latest: {latestScore}%
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  Peak: {peakScore}%
                </span>
              </div>
            </div>

            <div className="h-[220px] sm:h-[260px] w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    className="text-gray-400 dark:text-gray-500"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="currentColor"
                    className="text-gray-400 dark:text-gray-500"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-2xl bg-gray-900/95 dark:bg-zinc-900 text-white border border-white/10 shadow-2xl text-xs space-y-1">
                            <div className="font-bold text-blue-400">{d.role}</div>
                            <div className="text-gray-400 text-[10px] capitalize">
                              {d.interviewType} • {d.fullDate}
                            </div>
                            <div className="pt-1.5 flex items-center justify-between gap-4 font-semibold">
                              <span>Overall Score:</span>
                              <span
                                className={`text-sm font-bold ${
                                  d.score >= 70 ? "text-emerald-400" : d.score >= 50 ? "text-amber-400" : "text-rose-400"
                                }`}
                              >
                                {d.score}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreAreaGradient)"
                    dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: "#2563EB", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-200 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">No trend yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Finish a few interviews to see how your scores change.</p>
              </div>
            </div>
            <Link
              to="/interview"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold"
            >
              Start first interview
            </Link>
          </div>
        )}

        {/* 4. CONSOLIDATED TOOLBAR & FILTERS */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-xs">
            {[
              { id: "", label: "All Sessions" },
              { id: "completed", label: "Completed" },
              { id: "in-progress", label: "In Progress" },
              { id: "abandoned", label: "Abandoned" },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPagination((prev) => ({ ...prev, skip: 0 }));
                  }}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Selectors */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role or type..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-white/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Format Dropdown */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-white/30"
            >
              <option value="all">All Formats</option>
              <option value="resume-based">Resume-Based</option>
              <option value="job-description">Job Description</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="mixed">Mixed Hybrid</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-white/30"
            >
              <option value="newest">Newest First</option>
              <option value="highest-score">Highest Score</option>
              <option value="lowest-score">Lowest Score</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>
        </div>

        {/* 5. INTERVIEW HISTORY LIST */}
        {filteredInterviews.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-200 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {searchQuery || formatFilter !== "all" || statusFilter
                  ? "No matching interviews found"
                  : "No interviews yet"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {searchQuery || formatFilter !== "all" || statusFilter
                  ? "Try resetting your search query or status filter to see other archived sessions."
                  : "Start a mock interview and your reports will show up here."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/interview"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold text-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start an interview</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredInterviews.map((interview) => {
              const typeCfg = TYPE_CONFIG[interview.interviewType] || TYPE_CONFIG.technical;
              const TypeIcon = typeCfg.icon;
              const statusCfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG.created;

              const answeredQuestions =
                interview.questions?.filter((q) => q.userAnswer || q.evaluation?.score)?.length || 0;
              const totalQuestions = interview.totalQuestions || interview.questions?.length || 10;
              const progressPercent = Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100));

              const hasResult = Boolean(interview.result && interview.result.overallScore > 0);
              const score = interview.result?.overallScore || 0;
              const grade = interview.result?.grade || "N/A";

              return (
                <div
                  key={interview._id}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Role Info & Badges */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${typeCfg.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
                      >
                        <TypeIcon className={`w-6 h-6 ${typeCfg.accent}`} />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {interview.role} Interview
                          </h3>

                          {/* Status Pill */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusCfg.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                            <span>{statusCfg.label}</span>
                          </span>
                        </div>

                        {/* Metadata Tag Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {typeCfg.label}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{interview.experienceLevel || "Mid"} Level</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatDate(interview.createdAt)}</span>
                          </span>
                          {interview.totalDurationSeconds > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>{formatDuration(interview.totalDurationSeconds)}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Progress Bar & Questions Completed */}
                        <div className="pt-1 flex items-center gap-3">
                          <div className="w-32 sm:w-40 bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                            {answeredQuestions}/{totalQuestions} Qs ({progressPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Metric & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-white/5">
                      {hasResult ? (
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                              {score}%
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                score >= 75
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : score >= 50
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              Grade {grade}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                            Score
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-semibold text-gray-400">
                            {interview.status === "in-progress" ? "In Progress" : "Pending Report"}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {hasResult || answeredQuestions > 0 ? (
                          <Link
                            to={`/interview/result/${interview._id}`}
                            className="px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 text-zinc-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Report</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </Link>
                        ) : null}

                        {interview.status === "in-progress" && (
                          <Link
                            to={`/interview?resume=${interview._id}`}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                          >
                            <Play className="w-4 h-4 fill-black" />
                            <span>Continue</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. PAGINATION CONTROLS */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/80 dark:border-white/10">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing <strong className="text-gray-800 dark:text-gray-200">{pagination.skip + 1}</strong> -{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                {Math.min(pagination.skip + pagination.limit, pagination.total)}
              </strong>{" "}
              of <strong className="text-gray-800 dark:text-gray-200">{pagination.total}</strong> interviews
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={pagination.skip === 0}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewHistory;

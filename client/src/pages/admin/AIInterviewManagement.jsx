import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Volume2,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowUpRight,
  Save,
  Radio,
  FileText,
  Activity,
  Zap,
  BarChart3,
  Check,
  ThumbsUp,
  ThumbsDown,
  Target,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Briefcase,
  ArrowLeft,
  Copy,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import {
  getInterviewAdminStats,
  getAllAdminInterviews,
  getAdminInterviewDetail,
  getInterviewPricingConfig,
  updateInterviewPricingConfig,
} from "@/api/admin.api";
import SessionAuditDetail from "./components/SessionAuditDetail";
import { useDarkMode } from "@/context/DarkModeContext";

const COST_COMPONENT_COLORS = [
  "#6366f1", // Indigo: STT
  "#10b981", // Emerald: TTS
  "#8b5cf6", // Purple: LLM Reasoning
];

const AIInterviewManagement = () => {
  // State
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions' | 'costs' | 'pricing'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sessions list state
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [engineFilter, setEngineFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Inspection modal state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [auditTab, setAuditTab] = useState("report");
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);

  const { isDarkMode } = useDarkMode();

  // Pricing config state
  const [pricingForm, setPricingForm] = useState({
    sarvamSttRatePerMinuteInr: 0.50,
    sarvamTtsRatePerThousandCharsInr: 3.00,
    llmInputTokenRatePerMillionInr: 13.0,
    llmOutputTokenRatePerMillionInr: 52.0,
    usdToInrExchangeRate: 86.5,
    creditsPerLiveInterview: 5,
    creditsPerTextInterview: 2,
  });
  const [savingPricing, setSavingPricing] = useState(false);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await getInterviewAdminStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load interview stats:", error);
      toast.error("Failed to load interview analytics");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load Sessions
  const loadSessions = useCallback(async (page = 1) => {
    setLoadingSessions(true);
    try {
      const res = await getAllAdminInterviews({
        page,
        limit: 12,
        search: search.trim(),
        status: statusFilter,
        mode: modeFilter,
        engine: engineFilter,
        sortBy,
      });
      if (res.data?.success) {
        setSessions(res.data.data.sessions || []);
        setPagination(res.data.data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 });
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load interview sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, [search, statusFilter, modeFilter, engineFilter, sortBy]);

  // Load Pricing Config
  const loadPricing = useCallback(async () => {
    try {
      const res = await getInterviewPricingConfig();
      if (res.data?.success && res.data.data) {
        setPricingForm(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load pricing config:", error);
    }
  }, []);

  // Load session detail
  const handleInspectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setLoadingDetail(true);
    setAuditTab("report");
    setExpandedQuestionIdx(null);
    try {
      const res = await getAdminInterviewDetail(sessionId);
      if (res.data?.success) {
        setSessionDetail(res.data.data.session);
        setSessionResult(res.data.data.result);
      }
    } catch (error) {
      console.error("Failed to load session detail:", error);
      toast.error("Failed to load session details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const res = await updateInterviewPricingConfig(pricingForm);
      if (res.data?.success) {
        toast.success("Pricing configuration updated successfully");
        loadStats();
      }
    } catch (error) {
      console.error("Failed to update pricing:", error);
      toast.error("Failed to save pricing configuration");
    } finally {
      setSavingPricing(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadSessions(1);
    loadPricing();
  }, [loadStats, loadSessions, loadPricing]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedSessionId) {
        setSelectedSessionId(null);
        setSessionDetail(null);
        setSessionResult(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSessionId]);

  const getSessionDuration = (sess) => {
    if (!sess) return 0;
    if (sess.durationSeconds && Number(sess.durationSeconds) > 0) return Number(sess.durationSeconds);
    if (sess.totalDurationSeconds && Number(sess.totalDurationSeconds) > 0) return Number(sess.totalDurationSeconds);

    if (sess.completedAt && (sess.startedAt || sess.createdAt)) {
      const diff = Math.round((new Date(sess.completedAt) - new Date(sess.startedAt || sess.createdAt)) / 1000);
      if (diff > 5 && diff < 86400) return diff;
    }

    if (sess.updatedAt && (sess.startedAt || sess.createdAt) && sess.questionsAnswered > 0) {
      const diff = Math.round((new Date(sess.updatedAt) - new Date(sess.startedAt || sess.createdAt)) / 1000);
      if (diff >= 20 && diff <= 14400) return diff;
    }

    const stt = sess.costs?.stt?.durationSeconds;
    if (stt > 0) return Math.round(stt * 1.5);

    if (sess.questionsAnswered > 0) return Math.max(45, sess.questionsAnswered * 65);
    return 0;
  };

  const formatDuration = (seconds) => {
    const val = Number(seconds);
    if (!val || val <= 0) return "--";
    const mins = Math.floor(val / 60);
    const secs = val % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatEngineName = (engine, persona, mode) => {
    if (mode === "text") return "Text (Standard LLM)";
    const personaName = persona ? persona.charAt(0).toUpperCase() + persona.slice(1) : "Shubh";
    if (engine === "sarvam") return `Sarvam AI (${personaName})`;
    if (engine === "local") return `Local Whisper/Chatterbox (${personaName})`;
    if (engine === "browser") return `Browser TTS (${personaName})`;
    return `Sarvam AI (${personaName})`;
  };

  // Cost breakdown pie data
  const costBreakdownData = useMemo(() => {
    const b = stats?.costs?.breakdown;
    if (b) {
      return [
        { name: "Speech-to-Text (STT)", value: b.stt?.costInr || 0, color: COST_COMPONENT_COLORS[0] },
        { name: "Voice Synthesis (TTS)", value: b.tts?.costInr || 0, color: COST_COMPONENT_COLORS[1] },
        { name: "LLM Reasoning & Scoring", value: b.llm?.costInr || 0, color: COST_COMPONENT_COLORS[2] },
      ].filter((x) => x.value > 0);
    }
    return [
      { name: "Speech-to-Text (STT)", value: 45.2, color: COST_COMPONENT_COLORS[0] },
      { name: "Voice Synthesis (TTS)", value: 68.4, color: COST_COMPONENT_COLORS[1] },
      { name: "LLM Reasoning & Scoring", value: 122.8, color: COST_COMPONENT_COLORS[2] },
    ];
  }, [stats]);

  const totalCostINR = costBreakdownData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      {selectedSessionId ? (
        <SessionAuditDetail
          selectedSessionId={selectedSessionId}
          sessionDetail={sessionDetail}
          sessionResult={sessionResult}
          loadingDetail={loadingDetail}
          auditTab={auditTab}
          setAuditTab={setAuditTab}
          expandedQuestionIdx={expandedQuestionIdx}
          setExpandedQuestionIdx={setExpandedQuestionIdx}
          onBack={() => {
            setSelectedSessionId(null);
            setSessionDetail(null);
            setSessionResult(null);
          }}
          onRefresh={() => handleInspectSession(selectedSessionId)}
          formatEngineName={formatEngineName}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  AI Interview Infrastructure
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Interview Operations & Cost Audit
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Session transcripts, speech & token costs, and credit pricing controls.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadStats();
                  loadSessions(pagination.currentPage);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Sessions</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Interviews */}
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                <span className="font-mono uppercase tracking-wider">Total Interviews</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                  {loadingStats ? "..." : (stats?.overview?.totalSessions || 0).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3" />
                    {stats?.overview?.completedSessions || 0} completed
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {stats?.overview?.completionRate || 0}% rate
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Total API Expense */}
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                <span className="font-mono uppercase tracking-wider">Cumulative Spend</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                  {loadingStats ? "..." : `₹${stats?.costs?.totalSpendInr?.toFixed(2) || "0.00"}`}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    ≈ ${stats?.costs?.totalSpendUsd?.toFixed(2) || "0.00"} USD
                  </span>
                  <span className="text-zinc-400 font-mono">Sarvam + LLM</span>
                </div>
              </div>
            </div>

            {/* 3. Avg Cost / Interview */}
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                <span className="font-mono uppercase tracking-wider">Unit Cost / Session</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                  {loadingStats ? "..." : `₹${stats?.costs?.averageCostPerSessionInr?.toFixed(2) || "0.00"}`}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-purple-600 dark:text-purple-400 font-mono font-medium">
                    ≈ ${stats?.costs?.averageCostPerSessionUsd?.toFixed(3) || "0.000"}
                  </span>
                  <span className="text-zinc-400 font-mono">Per candidate</span>
                </div>
              </div>
            </div>

            {/* 4. Average Candidate Score */}
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 text-xs mb-3">
                <span className="font-mono uppercase tracking-wider">Benchmark Score</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                  {loadingStats ? "..." : `${stats?.overview?.averageScore || 0}%`}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">
                    {stats?.overview?.totalQuestionsAnswered || 0} evaluated
                  </span>
                  <span className="text-zinc-400 font-mono">Rubric avg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
                activeTab === "sessions"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Sessions & Candidate Audit
            </button>

            <button
              onClick={() => setActiveTab("costs")}
              className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
                activeTab === "costs"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              API Cost Intelligence & Charts
            </button>

            <button
              onClick={() => setActiveTab("pricing")}
              className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-2 transition-colors ${
                activeTab === "pricing"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Unit Pricing & Rates
            </button>
          </div>

          {/* TAB 1: SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter candidate or role..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs font-mono">
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="">All Modes</option>
                    <option value="live">Live Voice</option>
                    <option value="text">Text Only</option>
                  </select>

                  <select
                    value={engineFilter}
                    onChange={(e) => setEngineFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="">All Engines</option>
                    <option value="sarvam">Sarvam AI</option>
                    <option value="local">Local Whisper</option>
                    <option value="browser">Browser Web Speech</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="abandoned">Abandoned</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="duration_desc">Duration</option>
                  </select>
                </div>
              </div>

              {/* Sessions Table */}
              <div className="rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] uppercase font-mono text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 font-normal">Candidate</th>
                        <th className="px-4 py-3 font-normal">Target Role</th>
                        <th className="px-4 py-3 font-normal">Mode / Engine</th>
                        <th className="px-4 py-3 font-normal">Score</th>
                        <th className="px-4 py-3 font-normal">API Cost</th>
                        <th className="px-4 py-3 font-normal">Duration</th>
                        <th className="px-4 py-3 font-normal text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                      {loadingSessions ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-12 text-center text-zinc-400 font-mono">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                            Loading candidate records...
                          </td>
                        </tr>
                      ) : sessions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-12 text-center text-zinc-400 font-mono">
                            No interview sessions found matching filters.
                          </td>
                        </tr>
                      ) : (
                        sessions.map((sess) => (
                          <tr
                            key={sess.id}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center font-mono font-bold text-[10px] text-purple-600 dark:text-purple-400">
                                  {sess.user?.name?.charAt(0)?.toUpperCase() || "C"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-zinc-900 dark:text-white truncate max-w-[160px]">
                                    {sess.user?.name || "Candidate"}
                                  </p>
                                  <p className="text-[10px] font-mono text-zinc-400 truncate max-w-[160px]">
                                    {sess.user?.email || "candidate@smartnshine.com"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <p className="font-medium text-zinc-900 dark:text-white">{sess.role}</p>
                              <span className="text-[10px] font-mono text-zinc-400">
                                {sess.experienceLevel || "Mid"} • {sess.interviewType}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 font-semibold">
                                {sess.mode === "live" ? "Live Voice" : "Text"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  sess.averageScore >= 80
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                                    : sess.averageScore >= 60
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                                }`}
                              >
                                {sess.averageScore}%
                              </span>
                            </td>

                            <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-white">
                              ₹{sess.costs?.totalCostInr?.toFixed(2) || "0.00"}
                            </td>

                            <td className="px-4 py-3 font-mono text-zinc-500">
                              {formatDuration(getSessionDuration(sess))}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleInspectSession(sess.id)}
                                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-mono text-[11px] transition-colors inline-flex items-center gap-1 shadow-xs"
                              >
                                <Eye className="w-3 h-3" />
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500">
                    <span>
                      Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={pagination.currentPage <= 1}
                        onClick={() => loadSessions(pagination.currentPage - 1)}
                        className="p-1 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={pagination.currentPage >= pagination.totalPages}
                        onClick={() => loadSessions(pagination.currentPage + 1)}
                        className="p-1 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: API COST INTELLIGENCE */}
          {activeTab === "costs" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Distribution Donut Chart */}
                <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Speech & Token Breakdown
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                        Spend Pie
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">
                      Proportional distribution across STT, TTS, and LLMs.
                    </p>

                    <div className="relative h-[200px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            stroke={isDarkMode ? "#09090b" : "#ffffff"}
                            strokeWidth={2}
                          >
                            {costBreakdownData.map((entry, index) => (
                              <Cell key={`cost-cell-${index}`} fill={entry.color} />
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
                                      ₹{data.value?.toFixed(2)}
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
                          ₹{totalCostINR.toFixed(0)}
                        </span>
                        <span className="text-[9px] font-mono uppercase text-purple-500 font-semibold mt-0.5">
                          Spend
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                    {costBreakdownData.map((item, idx) => (
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
                          ₹{item.value?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 14-Day Timeline Bar Chart */}
                <div className="lg:col-span-2 p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                          14-Day Session Activity & Cost Trend
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Daily interview completions and associated infrastructure burn.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">14-Day Velocity</span>
                  </div>

                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats?.dailyTimeline || []}
                        margin={{top: 10, right: 10, left: -20, bottom: 0}}
                      >
                        <CartesianGrid
                          strokeDasharray="2 2"
                          stroke={isDarkMode ? "#27272a" : "#e4e4e7"}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 10,
                            fill: isDarkMode ? "#71717a" : "#a1a1aa",
                            fontFamily: "monospace",
                          }}
                          tickFormatter={(val) => (val ? val.slice(5) : "")}
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
                              const d = payload[0].payload;
                              return (
                                <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white shadow-xl text-xs font-mono">
                                  <p className="font-semibold text-zinc-400">{label}</p>
                                  <p className="text-purple-400 font-bold mt-1">Sessions: {d.sessions}</p>
                                  <p className="text-emerald-400">Cost: ₹{d.costInr}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="sessions"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Model Engine: Sarvam Saaras + OpenAI LLM</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Direct INR Cost Audit</span>
                  </div>
                </div>
              </div>

              {/* Engine Breakdown Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white font-mono">
                      Sarvam Saaras STT
                    </span>
                    <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-white">
                    ₹{stats?.costs?.breakdown?.stt?.costInr?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Rate: ₹{pricingForm.sarvamSttRatePerMinuteInr}/min
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white font-mono">
                      Sarvam Bulbul TTS
                    </span>
                    <div className="w-7 h-7 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-white">
                    ₹{stats?.costs?.breakdown?.tts?.costInr?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Rate: ₹{pricingForm.sarvamTtsRatePerThousandCharsInr}/1k chars
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white font-mono">
                      OpenAI Evaluation LLM
                    </span>
                    <div className="w-7 h-7 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-white">
                    ₹{stats?.costs?.breakdown?.llm?.costInr?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Input: ₹{pricingForm.llmInputTokenRatePerMillionInr}/M • Output: ₹{pricingForm.llmOutputTokenRatePerMillionInr}/M
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING CONFIG */}
          {activeTab === "pricing" && (
            <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 max-w-3xl space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  AI Unit Cost & User Credit Policy
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update unit rate assumptions and credit deduction rates across text and live voice simulations.
                </p>
              </div>

              <form onSubmit={handleSavePricing} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-zinc-500 mb-1">
                      Sarvam STT Rate (₹ per min)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingForm.sarvamSttRatePerMinuteInr}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, sarvamSttRatePerMinuteInr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">
                      Sarvam TTS Rate (₹ per 1,000 chars)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingForm.sarvamTtsRatePerThousandCharsInr}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, sarvamTtsRatePerThousandCharsInr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">
                      LLM Input Token Rate (₹ per 1M)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={pricingForm.llmInputTokenRatePerMillionInr}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, llmInputTokenRatePerMillionInr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">
                      LLM Output Token Rate (₹ per 1M)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={pricingForm.llmOutputTokenRatePerMillionInr}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, llmOutputTokenRatePerMillionInr: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">
                      USD to INR FX Rate
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={pricingForm.usdToInrExchangeRate}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, usdToInrExchangeRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">
                      Credits per Live Voice Simulation
                    </label>
                    <input
                      type="number"
                      value={pricingForm.creditsPerLiveInterview}
                      onChange={(e) =>
                        setPricingForm({ ...pricingForm, creditsPerLiveInterview: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="submit"
                    disabled={savingPricing}
                    className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingPricing ? "Saving..." : "Save Rates"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIInterviewManagement;

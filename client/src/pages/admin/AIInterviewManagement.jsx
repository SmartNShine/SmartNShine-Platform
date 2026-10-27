import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getInterviewAdminStats,
  getAllAdminInterviews,
  getAdminInterviewDetail,
  getInterviewPricingConfig,
  updateInterviewPricingConfig,
} from "@/api/admin.api";
import SessionAuditDetail from "./components/SessionAuditDetail";

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
  const [auditTab, setAuditTab] = useState("report"); // 'report' | 'questions' | 'costs'
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);

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

  // Save Pricing Form
  const handleSavePricing = async (e) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const res = await updateInterviewPricingConfig(pricingForm);
      if (res.data?.success) {
        toast.success("Pricing configuration updated successfully");
        loadStats();
        loadSessions(pagination.currentPage);
      }
    } catch (error) {
      console.error("Failed to update pricing:", error);
      toast.error("Failed to update pricing configuration");
    } finally {
      setSavingPricing(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadPricing();
  }, [loadStats, loadPricing]);

  useEffect(() => {
    loadSessions(1);
  }, [loadSessions]);

  // Keyboard shortcut to close detail audit view on Escape
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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

  return (
    <div className="space-y-8 pb-12">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Interview Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                User interview session audit, Sarvam & LLM cost intelligence, and credit pricing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStats();
              loadSessions(pagination.currentPage);
            }}
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Interviews */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Interviews</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {loadingStats ? "..." : stats?.overview?.totalSessions || 0}
            </span>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-emerald-500 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {stats?.overview?.completedSessions || 0} completed
              </span>
              <span className="text-gray-400">({stats?.overview?.completionRate || 0}%)</span>
            </div>
          </div>
        </div>

        {/* 2. Total Gross API Spend */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total API Expense</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {loadingStats ? "..." : `₹${stats?.costs?.totalSpendInr?.toFixed(2) || "0.00"}`}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ≈ ${stats?.costs?.totalSpendUsd?.toFixed(2) || "0.00"} USD (Sarvam + LLM)
            </p>
          </div>
        </div>

        {/* 3. Average Cost / Interview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Cost / Session</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {loadingStats ? "..." : `₹${stats?.costs?.averageCostPerSessionInr?.toFixed(2) || "0.00"}`}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ≈ ${stats?.costs?.averageCostPerSessionUsd?.toFixed(3) || "0.000"} per candidate
            </p>
          </div>
        </div>

        {/* 4. Average Candidate Score */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Candidate Score</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {loadingStats ? "..." : `${stats?.overview?.averageScore || 0}%`}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {stats?.overview?.totalQuestionsAnswered || 0} questions evaluated
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "sessions"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Sessions & Candidate Tracking
        </button>

        <button
          onClick={() => setActiveTab("costs")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "costs"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          API Cost Intelligence
        </button>

        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "pricing"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Unit Pricing & Credit Rates
        </button>
      </div>

      {/* TAB 1: SESSIONS & CANDIDATE TRACKING */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate or role..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">All Modes</option>
                <option value="live">Live Voice</option>
                <option value="text">Text</option>
              </select>

              <select
                value={engineFilter}
                onChange={(e) => setEngineFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">All Voice Engines</option>
                <option value="sarvam">Sarvam AI Cloud</option>
                <option value="local">Local (Whisper / Chatterbox)</option>
                <option value="browser">Browser Web Speech</option>
                <option value="none">No Voice (Text Mode)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="abandoned">Abandoned</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration_desc">Longest Duration</option>
              </select>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Role & Level</th>
                    <th className="px-6 py-4">Mode / Engine</th>
                    <th className="px-6 py-4">Questions</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">API Cost</th>
                    <th className="px-6 py-4">Duration & Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                  {loadingSessions ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                        Loading interview sessions...
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                        No interview sessions found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => (
                      <tr
                        key={sess.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        {/* Candidate */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                              {sess.user?.name?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">
                                {sess.user?.name || "Anonymous Candidate"}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                {sess.user?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role & Level */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{sess.role}</p>
                          <span className="text-[11px] capitalize text-gray-400">
                            {sess.experienceLevel || "Mid"} Level • {sess.interviewType}
                          </span>
                        </td>

                        {/* Mode / Engine */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                                sess.mode === "live"
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {sess.mode === "live" ? "Live Voice" : "Text"}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {formatEngineName(sess.voiceEngineUsed, sess.personaUsed, sess.mode)}
                            </span>
                          </div>
                        </td>

                        {/* Questions */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {sess.questionsAnswered} / {sess.questionsTotal}
                          </span>
                          <p className="text-xs text-gray-400">answered</p>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              sess.averageScore >= 80
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : sess.averageScore >= 60
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {sess.averageScore}%
                          </span>
                        </td>

                        {/* API Cost */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{sess.costs?.totalCostInr?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              ≈ ${sess.costs?.totalCostUsd?.toFixed(3) || "0.000"}
                            </span>
                          </div>
                        </td>

                        {/* Duration & Date */}
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-900 dark:text-white flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatDuration(sess.durationSeconds)}
                          </p>
                          <span className="text-[11px] text-gray-400">
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleInspectSession(sess.id)}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-medium text-xs transition-all flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.currentPage <= 1}
                    onClick={() => loadSessions(pagination.currentPage - 1)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => loadSessions(pagination.currentPage + 1)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sarvam STT */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sarvam Saaras STT</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600">
                  {stats?.costs?.breakdown?.stt?.percentage || 0}% of spend
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{stats?.costs?.breakdown?.stt?.costInr?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Speech-to-text audio processing for candidate answers. Unit rate: ₹{pricingForm.sarvamSttRatePerMinuteInr}/min.
              </p>
            </div>

            {/* Sarvam TTS */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sarvam Bulbul TTS</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                  {stats?.costs?.breakdown?.tts?.percentage || 0}% of spend
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{stats?.costs?.breakdown?.tts?.costInr?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Neural voice synthesis for interviewer questions & transitions. Unit rate: ₹{pricingForm.sarvamTtsRatePerThousandCharsInr}/1k chars.
              </p>
            </div>

            {/* LLM Tokens */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">OpenAI LLM</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600">
                  {stats?.costs?.breakdown?.llm?.percentage || 0}% of spend
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{stats?.costs?.breakdown?.llm?.costInr?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Context-aware question generation, answer evaluation, and final executive report generation.
              </p>
            </div>
          </div>

          {/* 14-Day Timeline Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              14-Day Session Activity & Cost Trend
            </h3>
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-4">
              {stats?.dailyTimeline?.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-t-lg h-24 flex items-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-md transition-all"
                      style={{
                        height: `${Math.max(10, Math.min(100, (d.sessions / (Math.max(1, stats?.overview?.totalSessions) * 0.2)) * 100))}%`,
                      }}
                      title={`${d.sessions} sessions, ₹${d.costInr}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{d.date.slice(5)}</span>
                  <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">₹{d.costInr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNIT PRICING & CREDIT RATES */}
      {activeTab === "pricing" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-500" />
                AI Unit Cost & User Credit Policy
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Rates aligned directly with official Sarvam AI & OpenAI API documentation.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPricingForm({
                    sarvamSttRatePerMinuteInr: 0.50,
                    sarvamTtsRatePerThousandCharsInr: 3.00,
                    llmInputTokenRatePerMillionInr: 13.0,
                    llmOutputTokenRatePerMillionInr: 52.0,
                    usdToInrExchangeRate: 86.5,
                    creditsPerLiveInterview: 5,
                    creditsPerTextInterview: 2,
                  });
                  toast.success("Loaded official Sarvam + GPT-4o Mini benchmark rates");
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-all border border-purple-500/20 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Official Doc Preset
              </button>

              <button
                type="button"
                onClick={() => {
                  setPricingForm({
                    sarvamSttRatePerMinuteInr: 0.50,
                    sarvamTtsRatePerThousandCharsInr: 3.00,
                    llmInputTokenRatePerMillionInr: 216.0,
                    llmOutputTokenRatePerMillionInr: 865.0,
                    usdToInrExchangeRate: 86.5,
                    creditsPerLiveInterview: 10,
                    creditsPerTextInterview: 4,
                  });
                  toast.success("Loaded flagship GPT-4o tier benchmark rates");
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all border border-blue-500/20 flex items-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5" />
                Flagship GPT-4o Preset
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePricing} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Sarvam STT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Sarvam Saaras STT Rate (₹ / Minute)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingForm.sarvamSttRatePerMinuteInr}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, sarvamSttRatePerMinuteInr: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-3 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                  Official Sarvam Saaras v3: ₹30/hour (₹0.50/min)
                </span>
              </div>

              {/* Sarvam TTS */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Sarvam Bulbul TTS Rate (₹ / 1,000 Chars)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={pricingForm.sarvamTtsRatePerThousandCharsInr}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      sarvamTtsRatePerThousandCharsInr: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                  Official Sarvam Bulbul v3: ₹30 / 10,000 chars (₹3.00 / 1k chars)
                </span>
              </div>

              {/* LLM Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  LLM Input Tokens (₹ / 1 Million)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pricingForm.llmInputTokenRatePerMillionInr}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      llmInputTokenRatePerMillionInr: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                  OpenAI GPT-4o-mini ($0.15/1M) ≈ ₹13.00 / 1M tokens
                </span>
              </div>

              {/* LLM Output */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  LLM Output Tokens (₹ / 1 Million)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pricingForm.llmOutputTokenRatePerMillionInr}
                  onChange={(e) =>
                    setPricingForm({
                      ...pricingForm,
                      llmOutputTokenRatePerMillionInr: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                  OpenAI GPT-4o-mini ($0.60/1M) ≈ ₹52.00 / 1M tokens
                </span>
              </div>

              {/* Credits per Live Interview */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Credits Deducted (Live Voice Interview)
                </label>
                <input
                  type="number"
                  value={pricingForm.creditsPerLiveInterview}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, creditsPerLiveInterview: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-3 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Includes full STT + TTS + LLM processing</span>
              </div>

              {/* Credits per Text Interview */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Credits Deducted (Text Interview)
                </label>
                <input
                  type="number"
                  value={pricingForm.creditsPerTextInterview}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, creditsPerTextInterview: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-3 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Includes LLM evaluation only</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                type="submit"
                disabled={savingPricing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingPricing ? "Saving Rates..." : "Save Pricing Configuration"}
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

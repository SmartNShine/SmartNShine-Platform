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
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getInterviewAdminStats,
  getAllAdminInterviews,
  getAdminInterviewDetail,
  getInterviewPricingConfig,
  updateInterviewPricingConfig,
} from "@/api/admin.api";

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

      {/* SESSION INSPECTION & DETAILED AUDIT MODAL */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#111317] w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Interview Performance Audit & Cost Report
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">ID: {selectedSessionId}</span>
                      {sessionDetail?.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          sessionDetail.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : sessionDetail.status === "in-progress"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {sessionDetail.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setSessionDetail(null);
                  setSessionResult(null);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                title="Close Audit"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            {sessionDetail && (
              <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111317]">
                <button
                  onClick={() => setAuditTab("report")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                    auditTab === "report"
                      ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Score & Evaluation Report
                  {sessionResult?.overallScore > 0 && (
                    <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300">
                      {sessionResult.overallScore}% ({sessionResult.grade || "B"})
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAuditTab("questions")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                    auditTab === "questions"
                      ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Questions & Evaluations ({sessionDetail.questions?.length || 0})
                </button>

                <button
                  onClick={() => setAuditTab("costs")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                    auditTab === "costs"
                      ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Cost & API Telemetry
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500">
                    ₹{sessionDetail.costs?.totalCostInr || "0.00"}
                  </span>
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
              {loadingDetail ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-purple-500" />
                  <p className="font-medium text-gray-700 dark:text-gray-300">Loading comprehensive session audit...</p>
                  <p className="text-xs text-gray-400 mt-1">Retrieving session telemetry, evaluation scores and AI analysis</p>
                </div>
              ) : sessionDetail ? (
                <>
                  {/* Top Candidate & Overview Header (Always visible) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Candidate</span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        {sessionDetail.userId?.name || "Candidate"}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate block">{sessionDetail.userId?.email || "N/A"}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Role & Type</span>
                      <span className="font-semibold text-gray-900 dark:text-white capitalize truncate block">
                        {sessionDetail.role || "Developer"}
                      </span>
                      <span className="text-[11px] text-gray-500 capitalize">
                        {sessionDetail.interviewType?.replace("-", " ")} • {sessionDetail.experienceLevel}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Engine / Persona</span>
                      <span className="font-semibold text-gray-900 dark:text-white capitalize block truncate">
                        {formatEngineName(sessionDetail.voiceEngineUsed, sessionDetail.personaUsed, sessionDetail.mode)}
                      </span>
                      <span className="text-[11px] text-gray-500 capitalize">Mode: {sessionDetail.mode || "voice"}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Session Duration</span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {sessionDetail.totalDurationSeconds
                          ? `${Math.floor(sessionDetail.totalDurationSeconds / 60)}m ${sessionDetail.totalDurationSeconds % 60}s`
                          : "N/A"}
                      </span>
                      <span className="text-[11px] text-emerald-500 font-bold">
                        Cost: ₹{sessionDetail.costs?.totalCostInr || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* ================= TAB 1: SCORE & EVALUATION REPORT ================= */}
                  {auditTab === "report" && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      {/* Overall Score + Hiring Recommendation Banner */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Overall Score Ring & Grade */}
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 flex items-center gap-4">
                          <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="32"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                className="text-gray-200 dark:text-white/10"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="32"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                strokeDasharray={`${2 * Math.PI * 32}`}
                                strokeDashoffset={`${
                                  2 * Math.PI * 32 * (1 - (sessionResult?.overallScore || 0) / 100)
                                }`}
                                strokeLinecap="round"
                                className={`transition-all duration-700 ${
                                  (sessionResult?.overallScore || 0) >= 80
                                    ? "text-emerald-500"
                                    : (sessionResult?.overallScore || 0) >= 60
                                    ? "text-amber-500"
                                    : "text-rose-500"
                                }`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {sessionResult?.overallScore || 0}%
                              </span>
                              <span className="text-[10px] font-semibold text-gray-400">
                                {sessionResult?.grade ? `Grade ${sessionResult.grade}` : "Score"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 block font-medium">Performance Level</span>
                            <span className="text-base font-bold text-gray-900 dark:text-white block">
                              {sessionResult?.performanceLevel || "Evaluated"}
                            </span>
                            <span className="text-[11px] text-gray-500 mt-1 block">
                              {sessionResult?.metrics?.answeredQuestions ||
                                sessionDetail.questions?.filter((q) => q.userAnswer || q.evaluation?.score > 0)?.length ||
                                0}{" "}
                              of {sessionDetail.questions?.length || 0} questions evaluated
                            </span>
                          </div>
                        </div>

                        {/* Hiring Recommendation Card */}
                        <div className="md:col-span-2 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              AI Hiring Recommendation
                            </span>
                            {sessionResult?.hiringRecommendation?.recommendation && (
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                  sessionResult.hiringRecommendation.recommendation.includes("strong-hire")
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                    : sessionResult.hiringRecommendation.recommendation.includes("hire")
                                    ? "bg-green-500/10 text-green-500 border-green-500/30"
                                    : sessionResult.hiringRecommendation.recommendation.includes("maybe")
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                }`}
                              >
                                {sessionResult.hiringRecommendation.recommendation.replace("-", " ")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                            "{sessionResult?.hiringRecommendation?.reasoning ||
                              "Preliminary recommendation generated from real-time question responses and score metrics."}"
                          </p>
                          {sessionResult?.hiringRecommendation?.confidence && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-white/10 text-[11px] text-gray-400">
                              <span>Model Confidence:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {sessionResult.hiringRecommendation.confidence}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Executive Assessment Summary */}
                      {sessionResult?.summary && (
                        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Executive AI Assessment
                          </h4>
                          <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                            {sessionResult.summary}
                          </p>
                          {sessionResult.detailedFeedback && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pt-1 border-t border-purple-500/10">
                              {sessionResult.detailedFeedback}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Skill-Wise Analytical Breakdown */}
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.01] space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-500" />
                            Skill & Competency Breakdown
                          </h4>
                          <span className="text-[11px] text-gray-400">Evaluated on 5 Dimensions</span>
                        </div>

                        <div className="space-y-3">
                          {[
                            {
                              key: "technicalKnowledge",
                              label: "Technical Knowledge",
                              score: sessionResult?.skillBreakdown?.technicalKnowledge?.score ?? 0,
                              feedback: sessionResult?.skillBreakdown?.technicalKnowledge?.feedback,
                              color: "bg-blue-500",
                            },
                            {
                              key: "communication",
                              label: "Communication & Articulation",
                              score: sessionResult?.skillBreakdown?.communication?.score ?? 0,
                              feedback: sessionResult?.skillBreakdown?.communication?.feedback,
                              color: "bg-purple-500",
                            },
                            {
                              key: "problemSolving",
                              label: "Problem Solving & Analytical Thinking",
                              score: sessionResult?.skillBreakdown?.problemSolving?.score ?? 0,
                              feedback: sessionResult?.skillBreakdown?.problemSolving?.feedback,
                              color: "bg-emerald-500",
                            },
                            {
                              key: "situationalAwareness",
                              label: "Situational & Scenario Handling",
                              score: sessionResult?.skillBreakdown?.situationalAwareness?.score ?? 0,
                              feedback: sessionResult?.skillBreakdown?.situationalAwareness?.feedback,
                              color: "bg-amber-500",
                            },
                            {
                              key: "culturalFit",
                              label: "Role Alignment & Cultural Fit",
                              score: sessionResult?.skillBreakdown?.culturalFit?.score ?? 0,
                              feedback: sessionResult?.skillBreakdown?.culturalFit?.feedback,
                              color: "bg-indigo-500",
                            },
                          ].map((skill) => (
                            <div key={skill.key} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{skill.label}</span>
                                <span className="font-bold text-gray-900 dark:text-white">{skill.score}%</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${skill.color}`}
                                  style={{ width: `${Math.min(100, Math.max(0, skill.score))}%` }}
                                />
                              </div>
                              {skill.feedback && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">{skill.feedback}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strengths & Weaknesses 2-Column Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Strengths */}
                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Key Candidate Strengths
                          </h4>
                          {sessionResult?.strengths && sessionResult.strengths.length > 0 ? (
                            <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                              {sessionResult.strengths.map((str, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No specific strengths recorded.</p>
                          )}
                        </div>

                        {/* Weaknesses / Growth Areas */}
                        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            Areas for Improvement
                          </h4>
                          {sessionResult?.weaknesses && sessionResult.weaknesses.length > 0 ? (
                            <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                              {sessionResult.weaknesses.map((w, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-rose-500 font-bold shrink-0">•</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No specific weak areas highlighted.</p>
                          )}
                        </div>
                      </div>

                      {/* Keyword Matches Analysis (if available) */}
                      {(sessionResult?.mentionedKeywords?.length > 0 || sessionResult?.missedKeywords?.length > 0) && (
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                            Technical Keyword Intelligence
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1.5">
                                Mentioned Keywords ({sessionResult.mentionedKeywords?.length || 0}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {sessionResult.mentionedKeywords?.map((kw, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px]"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 block mb-1.5">
                                Missed Key Concepts ({sessionResult.missedKeywords?.length || 0}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {sessionResult.missedKeywords?.map((kw, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[11px]"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ================= TAB 2: QUESTIONS & DETAILED EVALUATIONS ================= */}
                  {auditTab === "questions" && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                          Questions & Answers Log ({sessionDetail.questions?.length || 0})
                        </h4>
                        <span className="text-xs text-gray-400">Click any question to view model answers & metrics</span>
                      </div>

                      {sessionDetail.questions?.map((q, idx) => {
                        const isExpanded = expandedQuestionIdx === idx;
                        const score = q.evaluation?.score ?? 0;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.02] transition-all"
                          >
                            {/* Question Header Bar */}
                            <div
                              onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                              className="p-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/[0.04] flex items-start justify-between gap-3 select-none"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-purple-600 dark:text-purple-400 text-xs">
                                    Question {q.questionNumber || idx + 1}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium capitalize">
                                    {q.category || q.questionType || "Technical"}
                                  </span>
                                  {q.difficulty && (
                                    <span className="text-[10px] text-gray-400 uppercase font-semibold">
                                      {q.difficulty}
                                    </span>
                                  )}
                                  {q.timeSpentSeconds > 0 && (
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {q.timeSpentSeconds}s
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                                  {q.questionText}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {score > 0 ? (
                                  <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                                      score >= 80
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                        : score >= 60
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                        : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                    }`}
                                  >
                                    Score: {score}%
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400">
                                    Pending
                                  </span>
                                )}
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Question Details Body */}
                            <div className={`p-4 pt-0 space-y-3 text-xs border-t border-gray-100 dark:border-white/5 ${isExpanded ? "block" : "hidden sm:block"}`}>
                              {/* Candidate Answer Box */}
                              <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                    Candidate Response:
                                  </span>
                                  {q.answerMode === "voice" && (
                                    <span className="text-[10px] text-purple-400 font-medium flex items-center gap-1">
                                      <Volume2 className="w-3 h-3" /> Transcribed Audio
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic">
                                  {q.userAnswer ||
                                    q.transcribedText ||
                                    (q.skipped ? "[Question Skipped by Candidate]" : "[No Answer Recorded]")}
                                </p>
                              </div>

                              {/* Multi-Dimensional Metrics (If Evaluated) */}
                              {q.evaluation && (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/10 text-[11px]">
                                  <div>
                                    <span className="text-gray-400 block">Relevance</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {q.evaluation.relevance ?? score}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block">Tech Accuracy</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {q.evaluation.technicalAccuracy ?? score}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block">Clarity</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {q.evaluation.clarity ?? score}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block">Confidence</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {q.evaluation.confidence ?? score}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block">Role Fit</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {q.evaluation.roleFit ?? score}%
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* AI Feedback */}
                              {q.evaluation?.feedback && (
                                <div className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-3 rounded-lg border border-gray-200 dark:border-white/10 space-y-1">
                                  <span className="font-bold text-purple-600 dark:text-purple-400 block">
                                    AI Evaluator Feedback:
                                  </span>
                                  <p className="leading-relaxed">{q.evaluation.feedback}</p>
                                </div>
                              )}

                              {/* Suggested Ideal Answer */}
                              {q.evaluation?.suggestedAnswer && (
                                <div className="text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 space-y-1">
                                  <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    Model / Suggested Answer:
                                  </span>
                                  <p className="leading-relaxed text-[11px] font-sans">
                                    {q.evaluation.suggestedAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ================= TAB 3: COST & API TELEMETRY ================= */}
                  {auditTab === "costs" && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      {/* Cost Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1">
                          <span className="text-xs text-gray-400 font-semibold uppercase">Total Session Cost</span>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ₹{sessionDetail.costs?.totalCostInr || "0.00"}
                          </div>
                          <span className="text-[11px] text-gray-400 block">
                            ${sessionDetail.costs?.totalCostUsd || "0.00"} USD
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] space-y-1">
                          <span className="text-xs text-gray-400 font-semibold uppercase">Candidate Credits Used</span>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {sessionDetail.mode === "live" ? 5 : 2} Credits
                          </div>
                          <span className="text-[11px] text-emerald-500 block">
                            {sessionDetail.mode === "live" ? "5 credits per live session" : "2 credits per session"}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] space-y-1">
                          <span className="text-xs text-gray-400 font-semibold uppercase">Voice Pipeline</span>
                          <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {formatEngineName(sessionDetail.voiceEngineUsed, sessionDetail.personaUsed, sessionDetail.mode)}
                          </div>
                          <span className="text-[11px] text-gray-400 block capitalize">
                            Status: {sessionDetail.status}
                          </span>
                        </div>
                      </div>

                      {/* Detailed API Cost Itemization */}
                      <div className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.01] space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          Detailed Microservices Telemetry & Rates
                        </h4>

                        <div className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                          {/* STT Service */}
                          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                Speech-to-Text: Sarvam Saaras v3 STT
                              </span>
                              <span className="text-gray-400 text-[11px]">
                                Duration: {sessionDetail.costs?.stt?.durationSeconds || 0}s (
                                {sessionDetail.costs?.stt?.durationMinutes || 0} mins) • Official rate: ₹0.50/min
                              </span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white sm:text-right">
                              ₹{sessionDetail.costs?.stt?.costInr || "0.00"}
                            </span>
                          </div>

                          {/* TTS Service */}
                          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                Text-to-Speech: Sarvam Bulbul v3 TTS
                              </span>
                              <span className="text-gray-400 text-[11px]">
                                Synthesized: {sessionDetail.costs?.tts?.characterCount || 0} characters • Official rate:
                                ₹3.00/10k chars
                              </span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white sm:text-right">
                              ₹{sessionDetail.costs?.tts?.costInr || "0.00"}
                            </span>
                          </div>

                          {/* LLM Evaluation Service */}
                          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                LLM Evaluation: OpenAI GPT-4o-mini
                              </span>
                              <span className="text-gray-400 text-[11px]">
                                Tokens: {sessionDetail.costs?.llm?.totalTokens || 0} total (Prompt:{" "}
                                {sessionDetail.costs?.llm?.promptTokens || 0}, Completion:{" "}
                                {sessionDetail.costs?.llm?.completionTokens || 0})
                              </span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white sm:text-right">
                              ₹{sessionDetail.costs?.llm?.costInr || "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterviewManagement;

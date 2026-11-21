import {useState, useEffect, useMemo} from "react";
import {useParams, useNavigate, Link} from "react-router-dom";
import toast from "react-hot-toast";
import {useAuth} from "@/context/AuthContext";
import interviewAPI from "@/api/interview.api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";
import {
  Award,
  Clock,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Play,
  FileText,
  Briefcase,
  Code,
  Users,
  CheckCircle,
  BarChart3,
  Activity,
  Zap,
  Tag,
  ShieldCheck,
} from "lucide-react";

const typeIcons = {
  "resume-based": FileText,
  "job-description": Briefcase,
  technical: Code,
  behavioral: Users,
  mixed: Sparkles,
};

const InterviewResult = () => {
  const {sessionId} = useParams();
  const navigate = useNavigate();
  const {user} = useAuth();

  const [result, setResult] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState("progression"); // 'progression' | 'radar'

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadResult();
  }, [user, navigate, sessionId]);

  const loadResult = async () => {
    try {
      const response = await interviewAPI.getResult(sessionId);
      setResult(response.data.result);
      setSession(response.data.session);
    } catch (error) {
      console.error("Failed to load result:", error);
      toast.error("Failed to load interview result");
      navigate("/interview/history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    if (typeof score !== "number") return "text-gray-400";
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBgColor = (score) => {
    if (typeof score !== "number") return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    if (score >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  const handleDownloadReport = () => {
    const reportText = generateTextReport();
    const blob = new Blob([reportText], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${session?.role || "mock"}-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const generateTextReport = () => {
    let report = `
========================================
SMARTNSHINE AI INTERVIEW PERFORMANCE REPORT
========================================
Date: ${formatDate(result?.createdAt || session?.createdAt)}
Role: ${session?.role}
Type: ${session?.interviewType}
Experience Level: ${session?.experienceLevel}
Status: ${session?.status}

OVERALL SCORE: ${result?.overallScore || 0}% (${result?.grade || "N/A"})

========================================
QUESTIONS & CANDIDATE ANSWERS
========================================
`;
    session?.questions?.forEach((q, i) => {
      const qText = q.questionText || q.question || `Question ${i + 1}`;
      const ansText = q.userAnswer || q.transcribedText || q.answer || "Not answered";
      const score = q.evaluation?.score ?? q.score ?? "N/A";
      const feedback = q.evaluation?.feedback || q.feedback || "No feedback recorded";

      report += `
[Q${i + 1}] ${qText}
Category: ${q.category || "General"} | Difficulty: ${q.difficulty || "Medium"}
Score: ${score}%
Candidate Answer:
${ansText}

Interviewer Feedback:
${feedback}
----------------------------------------
`;
    });

    if (result?.overallFeedback) {
      report += `
========================================
OVERALL FEEDBACK
========================================
${result.overallFeedback}
`;
    }

    return report;
  };

  // Prepare chart dataset per question
  const perQuestionChartData = useMemo(() => {
    if (!session?.questions) return [];
    return session.questions.map((q, idx) => {
      const score =
        typeof q.evaluation?.score === "number"
          ? q.evaluation.score
          : typeof q.score === "number"
            ? q.score
            : 0;
      const hasAnswered = Boolean(
        q.userAnswer || q.transcribedText || q.answer
      );
      return {
        name: `Q${idx + 1}`,
        fullName: `Question ${idx + 1}`,
        score: hasAnswered ? score : 0,
        category: q.category || "General",
        difficulty: q.difficulty || "Medium",
        hasAnswered,
      };
    });
  }, [session]);

  // Prepare radar chart for core dimensions
  const competencyRadarData = useMemo(() => {
    if (!session?.questions) return [];
    const evals = session.questions
      .map((q) => q.evaluation)
      .filter((ev) => ev && typeof ev.score === "number");

    if (evals.length === 0) {
      return [
        {subject: "Relevance", score: result?.overallScore || 70, fullMark: 100},
        {subject: "Technical", score: result?.overallScore || 65, fullMark: 100},
        {subject: "Clarity", score: result?.overallScore || 75, fullMark: 100},
        {subject: "Confidence", score: result?.overallScore || 70, fullMark: 100},
        {subject: "Role Fit", score: result?.overallScore || 80, fullMark: 100},
      ];
    }

    const calcAvg = (key, fallbackKey) => {
      const vals = evals.map((ev) => ev[key] || ev[fallbackKey] || ev.score || 70);
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };

    return [
      {subject: "Relevance", score: calcAvg("relevance", "score"), fullMark: 100},
      {subject: "Technical", score: calcAvg("technicalAccuracy", "score"), fullMark: 100},
      {subject: "Clarity", score: calcAvg("clarity", "score"), fullMark: 100},
      {subject: "Confidence", score: calcAvg("confidence", "score"), fullMark: 100},
      {subject: "Role Fit", score: calcAvg("roleFit", "score"), fullMark: 100},
    ];
  }, [session, result]);

  // Calculate highest scoring question
  const bestQuestion = useMemo(() => {
    if (!session?.questions?.length) return null;
    let best = null;
    let maxScore = -1;
    session.questions.forEach((q, i) => {
      const s = q.evaluation?.score ?? q.score ?? 0;
      if (s > maxScore && (q.userAnswer || q.transcribedText)) {
        maxScore = s;
        best = {index: i + 1, score: s, category: q.category};
      }
    });
    return best;
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
          Loading interview results and analytical breakdown...
        </p>
      </div>
    );
  }

  if (!result || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0d14] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Interview Report Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            The requested session could not be found or has not generated data yet.
          </p>
          <Link
            to="/interview/history"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const Icon = typeIcons[session.interviewType] || Sparkles;
  const TrendIcon =
    result.comparisonData?.trend === "improving"
      ? TrendingUp
      : result.comparisonData?.trend === "declining"
        ? TrendingDown
        : Minus;

  const answeredCount =
    session.questions?.filter(
      (q) => q.userAnswer || q.transcribedText || q.evaluation?.score
    )?.length || 0;
  const totalCount = session.totalQuestions || session.questions?.length || 10;
  const isPartialSession = session.status !== "completed";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0d14] py-8 transition-colors">
      <div className="workspace-container space-y-8">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/interview/history"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Interview History
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Download Report
            </button>
            <Link
              to="/interview"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all shadow-lg shadow-blue-500/20"
            >
              <Play className="w-4 h-4" />
              Start New Interview
            </Link>
          </div>
        </div>

        {/* Main Overview Card */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {session.role} Interview
                  </h1>
                  {isPartialSession && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize">
                      {session.status} Report
                    </span>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 capitalize text-sm">
                  {session.interviewType?.replace("-", " ")} • {session.experienceLevel} Level
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {formatDate(result.createdAt || session.createdAt)}
                  </span>
                  {session.totalDurationSeconds > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {formatDuration(session.totalDurationSeconds)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {answeredCount} of {totalCount} Questions Answered
                  </span>
                </div>
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex items-center gap-6 justify-center md:justify-end">
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="9"
                      className="text-gray-200 dark:text-white/10"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 46 * (1 - (result.overallScore || 0) / 100)
                      }`}
                      strokeLinecap="round"
                      className={`${getScoreColor(result.overallScore)} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore || 0}%
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Grade {result.grade || "N/A"}
                    </span>
                  </div>
                </div>

                {result.comparisonData && (
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <TrendIcon
                      className={`w-3.5 h-3.5 ${
                        result.comparisonData.trend === "improving"
                          ? "text-emerald-400"
                          : result.comparisonData.trend === "declining"
                            ? "text-rose-400"
                            : "text-gray-400"
                      }`}
                    />
                    <span className="text-gray-500 dark:text-gray-400">
                      {result.comparisonData.trend === "improving"
                        ? `+${result.comparisonData.percentageChange}% improvement`
                        : result.comparisonData.trend === "declining"
                          ? `${result.comparisonData.percentageChange}% decline`
                          : "Steady"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Answer Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.round((answeredCount / totalCount) * 100)}%
                </span>
                <span className="text-xs text-gray-500">
                  ({answeredCount}/{totalCount})
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Best Question</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-emerald-400">
                  {bestQuestion ? `Q${bestQuestion.index}` : "—"}
                </span>
                {bestQuestion && (
                  <span className="text-xs text-emerald-500 font-medium">
                    ({bestQuestion.score}%)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Avg Response Depth</span>
              <span className="text-lg font-bold text-indigo-400">
                {result.overallScore >= 75 ? "Advanced" : result.overallScore >= 50 ? "Solid" : "Basic"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <span className="text-xs text-gray-400 block mb-1">Assessment Level</span>
              <span className="text-lg font-bold text-blue-400 capitalize">
                {session.experienceLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Analytics & Graphs Section */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Performance Visual Analytics
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Detailed progression chart across each interview question and core evaluation competencies
              </p>
            </div>

            <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-gray-200 dark:border-white/10 self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab("progression")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeChartTab === "progression"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Question Progression
              </button>
              <button
                onClick={() => setActiveChartTab("radar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeChartTab === "radar"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Competency Radar
              </button>
            </div>
          </div>

          {/* Tab 1: Per-Question Score Bar / Progression Chart */}
          {activeChartTab === "progression" && (
            <div>
              <div className="h-[270px] min-h-[270px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={270} minWidth={0}>
                  <BarChart
                    data={perQuestionChartData}
                    margin={{top: 15, right: 10, left: -20, bottom: 5}}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip
                      content={({active, payload}) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl text-xs text-white">
                              <p className="font-bold text-sm text-indigo-300">{data.fullName}</p>
                              <p className="text-gray-400 mt-0.5 capitalize">{data.category} • {data.difficulty}</p>
                              <div className="mt-2 flex items-center justify-between gap-4 font-semibold">
                                <span>Score:</span>
                                <span className={data.score >= 75 ? "text-emerald-400" : data.score >= 50 ? "text-amber-400" : "text-rose-400"}>
                                  {data.hasAnswered ? `${data.score}%` : "Not Answered"}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="score"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={45}
                      onClick={(entry, idx) => setExpandedQuestion(idx)}
                      cursor="pointer"
                    >
                      {perQuestionChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            !entry.hasAnswered
                              ? "#4B5563"
                              : entry.score >= 80
                                ? "#10B981"
                                : entry.score >= 60
                                  ? "#F59E0B"
                                  : "#6366F1"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pt-4 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span>High Score (80-100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500" />
                  <span>Moderate (60-79%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-indigo-500" />
                  <span>Developing (&lt;60%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-gray-600" />
                  <span>Unanswered / Skipped</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Competency Radar Chart */}
          {activeChartTab === "radar" && (
            <div className="h-[270px] min-h-[270px] w-full min-w-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={270} minWidth={0}>
                <RadarChart data={competencyRadarData} outerRadius="75%">
                  <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" fontSize={10} />
                  <Radar
                    name="Candidate Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-xl text-xs text-white">
                            <p className="font-bold text-indigo-300">{data.subject}</p>
                            <p className="mt-1 font-semibold text-emerald-400">{data.score}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Overall Feedback Box */}
        {result.overallFeedback && (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Interviewer Summary & Strategic Feedback
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              {result.overallFeedback}
            </p>
          </div>
        )}

        {/* Questions & Detailed Per-Question Metrics Section */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Per-Question Breakdown & Spoken Answers ({session.questions?.length || 0})
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Expand questions for full rubric evaluation
            </span>
          </div>

          <div className="space-y-4">
            {session.questions?.map((q, i) => {
              const qText = q.questionText || q.question || `Question ${i + 1}`;
              const ansText = q.userAnswer || q.transcribedText || q.answer;
              const hasAnswered = Boolean(ansText && ansText.trim().length > 0);
              const score =
                typeof q.evaluation?.score === "number"
                  ? q.evaluation.score
                  : typeof q.score === "number"
                    ? q.score
                    : null;
              const feedback = q.evaluation?.feedback || q.feedback;
              const strengths = q.evaluation?.strengths || q.strengths || [];
              const improvements =
                q.evaluation?.improvementTips ||
                q.evaluation?.weaknesses ||
                q.improvements ||
                [];
              const suggestedAnswer = q.evaluation?.suggestedAnswer || q.suggestedAnswer;
              const missingKeywords = q.evaluation?.missingKeywords || [];
              const expectedKeywords = q.expectedKeywords || [];

              const isExpanded = expandedQuestion === i;

              // Dimension sub-metrics
              const relevance = q.evaluation?.relevance ?? score ?? 70;
              const technicalAccuracy = q.evaluation?.technicalAccuracy ?? score ?? 70;
              const clarity = q.evaluation?.clarity ?? score ?? 70;
              const confidence = q.evaluation?.confidence ?? score ?? 70;

              return (
                <div
                  key={i}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    hasAnswered
                      ? score >= 75
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : score >= 50
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-indigo-500/20 bg-indigo-500/5"
                      : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 opacity-80"
                  }`}
                >
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : i)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 ${getScoreBgColor(
                          score
                        )}`}
                      >
                        {typeof score === "number" ? `${score}%` : hasAnswered ? "✓" : "—"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          Q{i + 1}: {qText}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 capitalize">
                          <span>{q.category || "General"}</span>
                          <span>•</span>
                          <span>{q.difficulty || "Medium"}</span>
                          {hasAnswered ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[11px]">
                              Answered
                            </span>
                          ) : (
                            <span className="text-gray-400 bg-gray-500/10 px-1.5 py-0.2 rounded text-[11px]">
                              Skipped / Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-gray-400 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 pt-2 border-t border-gray-100 dark:border-white/5 space-y-4 text-sm">
                      {/* Full Question Text */}
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl">
                        <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
                          Interview Question
                        </h4>
                        <p className="text-gray-800 dark:text-blue-100 text-sm font-medium">
                          {qText}
                        </p>
                      </div>

                      {/* Candidate Spoken/Typed Answer */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                          Your Spoken Answer
                        </h4>
                        <div className="text-gray-800 dark:text-gray-200 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-3.5 rounded-xl leading-relaxed">
                          {hasAnswered ? (
                            ansText
                          ) : (
                            <span className="italic text-gray-400">
                              No answer recorded for this question.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Per-Question Multi-Dimension Score Meters */}
                      {hasAnswered && typeof score === "number" && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-blue-400" />
                            Question Scoring Breakdown
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Relevance</span>
                                <span className="font-semibold text-gray-200">{relevance}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${relevance}%`}} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Tech Depth</span>
                                <span className="font-semibold text-gray-200">{technicalAccuracy}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width: `${technicalAccuracy}%`}} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Clarity</span>
                                <span className="font-semibold text-gray-200">{clarity}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 rounded-full" style={{width: `${clarity}%`}} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Confidence</span>
                                <span className="font-semibold text-gray-200">{confidence}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{width: `${confidence}%`}} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Keywords Breakdown */}
                      {(expectedKeywords.length > 0 || missingKeywords.length > 0) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {expectedKeywords.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-400 font-medium">Key Concepts:</span>
                              {expectedKeywords.map((kw, kIdx) => (
                                <span
                                  key={kIdx}
                                  className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                          {missingKeywords.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-rose-400 font-medium">Missing:</span>
                              {missingKeywords.map((mkw, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                >
                                  {mkw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback */}
                      {feedback && (
                        <div>
                          <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Evaluation & Feedback
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3.5 rounded-xl border border-gray-100 dark:border-white/5 leading-relaxed">
                            {feedback}
                          </p>
                        </div>
                      )}

                      {/* Strengths & Weaknesses Grid */}
                      {(strengths.length > 0 || improvements.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          {strengths.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                              <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Demonstrated Strengths
                              </h5>
                              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                                {strengths.map((st, sIdx) => (
                                  <li key={sIdx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    <span>{st}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {improvements.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                              <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                Growth & Improvement Tips
                              </h5>
                              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                                {improvements.map((tip, tIdx) => (
                                  <li key={tIdx} className="flex items-start gap-1.5">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Suggested Answer Model */}
                      {suggestedAnswer && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-3.5 rounded-xl">
                          <h5 className="text-xs font-bold text-blue-300 flex items-center gap-1.5 mb-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            Sample High-Impact Answer
                          </h5>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            {suggestedAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12">
          <Link
            to="/interview"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all text-sm"
          >
            <Play className="w-4 h-4" />
            Practice Another Interview
          </Link>
          <Link
            to="/interview/history"
            className="w-full sm:w-auto px-8 py-3.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-sm flex items-center justify-center"
          >
            View All Past Sessions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InterviewResult;

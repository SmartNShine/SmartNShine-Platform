import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  User,
  Clock,
  Bot,
  Zap,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Target,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Check,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";

const SessionAuditDetail = ({
  selectedSessionId,
  sessionDetail,
  sessionResult,
  loadingDetail,
  auditTab,
  setAuditTab,
  expandedQuestionIdx,
  setExpandedQuestionIdx,
  onBack,
  onRefresh,
  formatEngineName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (selectedSessionId) {
      navigator.clipboard?.writeText(selectedSessionId);
      setCopied(true);
      toast.success("Session ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Dynamic Score & Telemetry Calculations
  const evaluatedQuestions = (sessionDetail?.questions || []).filter(
    (q) => q.evaluation && typeof q.evaluation.score === "number" && q.evaluation.score > 0
  );

  const calculatedAverage =
    evaluatedQuestions.length > 0
      ? Math.round(
          evaluatedQuestions.reduce((acc, q) => acc + (q.evaluation.score || 0), 0) /
            evaluatedQuestions.length
        )
      : (sessionDetail?.averageScore || 0);

  const overallScore = sessionResult?.overallScore || calculatedAverage || 0;

  const readiness =
    sessionResult?.metrics?.jobReadinessScore ||
    sessionResult?.overallScore ||
    calculatedAverage ||
    overallScore;

  const confidence =
    sessionResult?.hiringRecommendation?.confidence ??
    sessionResult?.hiringRecommendation?.confidenceScore ??
    (overallScore > 0 ? 75 : 0);

  // Skill breakdown extractor
  const sb = sessionResult?.skillBreakdown;
  const cb = sessionResult?.categoryBreakdown;

  const getCompetencyScore = (keys, questionMetric) => {
    // 1. Check categoryBreakdown
    if (cb && typeof cb === "object") {
      for (const k of keys) {
        if (typeof cb[k] === "number" && cb[k] > 0) return cb[k];
      }
    }
    // 2. Check skillBreakdown as object
    if (sb && typeof sb === "object" && !Array.isArray(sb)) {
      for (const k of keys) {
        if (typeof sb[k]?.score === "number" && sb[k].score > 0) return sb[k].score;
        if (typeof sb[k] === "number" && sb[k] > 0) return sb[k];
      }
    }
    // 3. Check skillBreakdown as array
    if (Array.isArray(sb)) {
      for (const k of keys) {
        const item = sb.find(
          (s) =>
            s.skillName?.toLowerCase().includes(k.toLowerCase()) ||
            s.name?.toLowerCase().includes(k.toLowerCase())
        );
        if (typeof item?.score === "number" && item.score > 0) return item.score;
      }
    }
    // 4. Check topicBreakdown array
    if (Array.isArray(sessionResult?.topicBreakdown)) {
      for (const k of keys) {
        const item = sessionResult.topicBreakdown.find((t) =>
          t.skillName?.toLowerCase().includes(k.toLowerCase())
        );
        if (typeof item?.score === "number" && item.score > 0) return item.score;
      }
    }
    // 5. Compute from session questions if evaluated
    if (questionMetric && sessionDetail?.questions?.length > 0) {
      const qs = sessionDetail.questions.filter(
        (q) => q.evaluation && typeof q.evaluation[questionMetric] === "number" && q.evaluation[questionMetric] > 0
      );
      if (qs.length > 0) {
        return Math.round(qs.reduce((acc, q) => acc + q.evaluation[questionMetric], 0) / qs.length);
      }
    }
    // 6. Fall back to overall score
    return overallScore;
  };

  const competencyMetrics = [
    {
      label: "Technical Competence",
      score: getCompetencyScore(
        ["technicalKnowledge", "technical", "technicalAccuracy", "technicalCompetence"],
        "technicalAccuracy"
      ),
      desc: "Accuracy and depth of technical reasoning",
    },
    {
      label: "Communication Clarity",
      score: getCompetencyScore(
        ["communication", "communicationClarity", "clarity"],
        "clarity"
      ),
      desc: "Structured delivery, fluency and tone",
    },
    {
      label: "Problem Solving",
      score: getCompetencyScore(
        ["problemSolving", "analytical", "relevance", "problem_solving"],
        "relevance"
      ),
      desc: "Approach to architectural trade-offs and logic",
    },
    {
      label: "Confidence & Presence",
      score: getCompetencyScore(
        ["situationalAwareness", "confidence", "confidencePresence", "presence"],
        "confidence"
      ),
      desc: "Poise under pressure and clear articulation",
    },
    {
      label: "Domain Knowledge",
      score: getCompetencyScore(
        ["culturalFit", "domainKnowledge", "domain", "roleFit", "role_fit"],
        "roleFit"
      ),
      desc: "Familiarity with modern framework patterns",
    },
    {
      label: "Scenario Handling",
      score: getCompetencyScore(
        ["situationalAwareness", "scenarioHandling", "practical", "scenario"],
        "relevance"
      ),
      desc: "Real-world incident & edge-case intuition",
    },
  ];

  const candidateStrengths =
    sessionResult?.strengths?.length > 0
      ? sessionResult.strengths
      : [
          "Demonstrated relevant conceptual understanding of requested topics.",
          "Responded attentively to interview prompts with clear cadence.",
        ];

  const candidateWeaknesses =
    sessionResult?.weaknesses?.length > 0
      ? sessionResult.weaknesses
      : sessionResult?.improvements?.length > 0
      ? sessionResult.improvements
      : [
          "Elaborate more on production scale challenges and performance profiling.",
          "Provide concrete code or architectural examples when answering open-ended prompts.",
        ];

  const qualitativeNotes =
    sessionResult?.overallFeedback ||
    sessionResult?.detailedFeedback ||
    sessionResult?.summary ||
    sessionResult?.hiringRecommendation?.reasoning;

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            In Progress
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            Abandoned / Incomplete
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 capitalize">
            {status || "Unknown"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Breadcrumbs & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            title="Back to Sessions List (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sessions</span>
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>AI Interviews</span>
            <span>/</span>
            <span className="font-mono text-gray-900 dark:text-gray-200 font-medium">
              #{selectedSessionId?.slice(-8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            title="Copy Session ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-mono text-[11px]">
              {selectedSessionId ? `${selectedSessionId.slice(0, 8)}...` : "Copy ID"}
            </span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loadingDetail}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDetail ? "animate-spin" : ""}`} />
            <span>Refresh Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Session Context Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {sessionDetail?.role || "Software Engineer"} Interview Audit
                </h2>
                {getStatusBadge(sessionDetail?.status)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-gray-600 dark:text-gray-300">ID: {selectedSessionId}</span>
                <span>•</span>
                <span className="capitalize">{sessionDetail?.interviewType?.replace("-", " ")}</span>
                <span>•</span>
                <span className="capitalize">{sessionDetail?.experienceLevel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-right">
              <span className="text-[11px] text-gray-400 block font-medium">Session Score</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {sessionResult?.overallScore || sessionDetail?.averageScore || 0}%
                {sessionResult?.grade && (
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 ml-1">
                    ({sessionResult.grade})
                  </span>
                )}
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-right">
              <span className="text-[11px] text-gray-400 block font-medium">Infrastructure Cost</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ₹{sessionDetail?.costs?.totalCostInr?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate & Session Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Candidate</span>
            <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 truncate mt-0.5">
              <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              {sessionDetail?.userId?.name || "Anonymous Candidate"}
            </span>
            <span className="text-xs text-gray-500 truncate block mt-0.5">
              {sessionDetail?.userId?.email || "No email available"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-gray-400 block font-medium">AI Engine & Voice</span>
            <span className="font-semibold text-sm text-gray-900 dark:text-white block truncate mt-0.5">
              {formatEngineName
                ? formatEngineName(sessionDetail?.voiceEngineUsed, sessionDetail?.personaUsed, sessionDetail?.mode)
                : "Sarvam AI"}
            </span>
            <span className="text-xs text-gray-500 capitalize block mt-0.5">
              Mode: {sessionDetail?.mode || "voice"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Duration & Timing</span>
            <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {sessionDetail?.totalDurationSeconds
                ? `${Math.floor(sessionDetail.totalDurationSeconds / 60)}m ${
                    sessionDetail.totalDurationSeconds % 60
                  }s`
                : "N/A"}
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              {sessionDetail?.createdAt ? new Date(sessionDetail.createdAt).toLocaleString() : "N/A"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Questions Evaluated</span>
            <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1 mt-0.5">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              {sessionDetail?.questions?.filter((q) => q.userAnswer || q.evaluation?.score > 0)?.length || 0} /{" "}
              {sessionDetail?.questions?.length || 0} questions
            </span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Target Score: 70%+
            </span>
          </div>
        </div>
      </div>

      {/* 3. In-Page Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-white/10 gap-2">
        <button
          onClick={() => setAuditTab("report")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 focus-visible:outline-none ${
            auditTab === "report"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Score & Evaluation Report</span>
          {(sessionResult?.overallScore || sessionDetail?.averageScore) > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
              {sessionResult?.overallScore || sessionDetail?.averageScore}%
            </span>
          )}
        </button>

        <button
          onClick={() => setAuditTab("questions")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 focus-visible:outline-none ${
            auditTab === "questions"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Questions & Live Evaluations</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
            {sessionDetail?.questions?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setAuditTab("costs")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 focus-visible:outline-none ${
            auditTab === "costs"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Cost & Microservice Telemetry</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            ₹{sessionDetail?.costs?.totalCostInr?.toFixed(2) || "0.00"}
          </span>
        </button>
      </div>

      {/* 4. Tab Body Content */}
      {loadingDetail ? (
        <div className="py-20 text-center text-gray-400 p-8 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-500" />
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-base">
            Loading Comprehensive Session Audit...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Retrieving candidate response transcripts, AI scoring criteria, and microservice billing telemetry
          </p>
        </div>
      ) : sessionDetail ? (
        <>
          {/* ================= TAB 1: SCORE & EVALUATION REPORT ================= */}
          {auditTab === "report" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Overall Score + Hiring Recommendation Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Gauge Card */}
                <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm flex items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-100 dark:text-white/10"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${
                          2 *
                          Math.PI *
                          38 *
                          (1 - (sessionResult?.overallScore || sessionDetail?.averageScore || 0) / 100)
                        }`}
                        strokeLinecap="round"
                        className={`transition-all duration-700 ${
                          (sessionResult?.overallScore || sessionDetail?.averageScore || 0) >= 80
                            ? "text-emerald-500"
                            : (sessionResult?.overallScore || sessionDetail?.averageScore || 0) >= 60
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {sessionResult?.overallScore || sessionDetail?.averageScore || 0}%
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {sessionResult?.grade ? `Grade ${sessionResult.grade}` : "Evaluated"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Performance Level</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">
                      {sessionResult?.performanceLevel ||
                        (sessionDetail?.averageScore >= 80
                          ? "High Competency"
                          : sessionDetail?.averageScore >= 60
                          ? "Moderate Competency"
                          : "Needs Improvement")}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {sessionResult?.metrics?.answeredQuestions ||
                        sessionDetail.questions?.filter((q) => q.userAnswer || q.evaluation?.score > 0)?.length ||
                        0}{" "}
                      of {sessionDetail.questions?.length || 0} questions evaluated
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Card */}
                <div className="md:col-span-2 p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      AI Hiring Recommendation
                    </span>
                    {sessionResult?.hiringRecommendation?.recommendation ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          sessionResult.hiringRecommendation.recommendation.includes("strong-hire")
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : sessionResult.hiringRecommendation.recommendation.includes("hire")
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                            : sessionResult.hiringRecommendation.recommendation.includes("maybe")
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {sessionResult.hiringRecommendation.recommendation.replace("-", " ")}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                        {sessionDetail.status === "completed" ? "Evaluation Complete" : "Incomplete Session"}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{sessionResult?.hiringRecommendation?.reasoning ||
                      qualitativeNotes ||
                      "The candidate completed the session. Individual question answers were graded using real-time criteria."}"
                  </p>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500">
                    <span>
                      Confidence:{" "}
                      <strong className="text-gray-900 dark:text-white">
                        {confidence}%
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Readiness:{" "}
                      <strong className="text-gray-900 dark:text-white">
                        {readiness}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Performance Breakdown Grid */}
              <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Competency & Skill Evaluation Metrics
                  </h4>
                  {sessionResult?.grade && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      Overall Benchmark: Grade {sessionResult.grade}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {competencyMetrics.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.label}</span>
                        <span
                          className={`font-bold ${
                            cat.score >= 80
                              ? "text-emerald-500"
                              : cat.score >= 60
                              ? "text-amber-500"
                              : "text-rose-500"
                          }`}
                        >
                          {cat.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.score >= 80 ? "bg-emerald-500" : cat.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400">{cat.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Topic Breakdown if available */}
                {Array.isArray(sessionResult?.topicBreakdown) && sessionResult.topicBreakdown.length > 0 && (
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                      Topic-Specific Competency Breakdown:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sessionResult.topicBreakdown.map((t, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center gap-2 text-xs"
                        >
                          <span className="font-medium text-gray-800 dark:text-gray-200">{t.skillName}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{t.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                    Key Candidate Strengths
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    {candidateStrengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-amber-500" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    {candidateWeaknesses.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Comprehensive Qualitative Feedback */}
              {qualitativeNotes && (
                <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm space-y-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-indigo-500" />
                    Comprehensive AI Evaluator Notes
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {qualitativeNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: QUESTIONS & LIVE EVALUATIONS ================= */}
          {auditTab === "questions" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {sessionDetail.questions?.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-gray-800 dark:text-gray-200">No questions recorded in this session</p>
                  <p className="text-xs text-gray-500 mt-1">This session may have been initialized but stopped before questioning.</p>
                </div>
              ) : (
                sessionDetail.questions?.map((q, idx) => {
                  const isExpanded = expandedQuestionIdx === idx;
                  const score = q.evaluation?.score ?? 0;
                  const isAnswered = Boolean(q.userAnswer || q.transcript || score > 0);

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] shadow-sm overflow-hidden transition-all"
                    >
                      {/* Question Summary Bar */}
                      <button
                        onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                        className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors focus-visible:outline-none"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <span className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center shrink-0 border border-purple-500/20">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Question {idx + 1}
                              </span>
                              {q.category && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 capitalize">
                                  {q.category}
                                </span>
                              )}
                              {q.difficulty && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 capitalize">
                                  {q.difficulty}
                                </span>
                              )}
                              {q.audioDurationSeconds > 0 && (
                                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {q.audioDurationSeconds}s audio
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                              {q.questionText}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isAnswered ? (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                score >= 80
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : score >= 60
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {score}/100
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-500">
                              Unanswered
                            </span>
                          )}

                          <div className="p-1 rounded-lg text-gray-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>

                      {/* Question Details Accordion Body */}
                      {isExpanded && (
                        <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] space-y-5 text-xs">
                          {/* Candidate Response Transcript */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-purple-500" />
                              Candidate Response Transcript:
                            </span>
                            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap shadow-sm">
                              {q.userAnswer || q.transcript || (
                                <span className="italic text-gray-400">
                                  No transcript recorded for this question (candidate may have skipped or timed out).
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Evaluation Breakdown & Criteria */}
                          {q.evaluation && (
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                                  Evaluator Feedback & Criteria Breakdown:
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Score: {q.evaluation.score}/100
                                </span>
                              </div>

                              {q.evaluation.feedback && (
                                <p className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/20 text-purple-900 dark:text-purple-200 leading-relaxed">
                                  {q.evaluation.feedback}
                                </p>
                              )}

                              {q.evaluation.criteriaBreakdown && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {Object.entries(q.evaluation.criteriaBreakdown).map(([criterion, val]) => (
                                    <div
                                      key={criterion}
                                      className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 text-center"
                                    >
                                      <span className="text-[10px] text-gray-400 capitalize block truncate">
                                        {criterion.replace(/([A-Z])/g, " $1")}
                                      </span>
                                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {typeof val === "number" ? `${val}%` : val}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Ideal Answer Guidelines */}
                          {q.idealAnswer && (
                            <div className="space-y-1.5 pt-2">
                              <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                Ideal Response Guidelines (Benchmark):
                              </span>
                              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/20 text-amber-900 dark:text-amber-200 leading-relaxed">
                                {q.idealAnswer}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= TAB 3: COST & MICROSERVICE TELEMETRY ================= */}
          {auditTab === "costs" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Cost Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* 1. STT Speech to Text */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Speech-to-Text (STT)
                    </span>
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Zap className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      ₹{sessionDetail.costs?.stt?.costInr || "0.00"}
                    </span>
                    <span className="text-xs text-gray-400 block mt-1">
                      Sarvam Saaras STT ({sessionDetail.costs?.stt?.audioSeconds || 0}s audio processed)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-500">
                    Calculated at ₹0.30 per minute of candidate voice input
                  </div>
                </div>

                {/* 2. TTS Text to Speech */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Text-to-Speech (TTS)
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Zap className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      ₹{sessionDetail.costs?.tts?.costInr || "0.00"}
                    </span>
                    <span className="text-xs text-gray-400 block mt-1">
                      Sarvam Bulbul v3 TTS ({sessionDetail.costs?.tts?.characterCount || 0} characters)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-500">
                    Calculated at ₹3.00 per 10,000 synthesized characters
                  </div>
                </div>

                {/* 3. LLM Evaluation */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      LLM Scoring & Evaluation
                    </span>
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                      <Bot className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      ₹{sessionDetail.costs?.llm?.costInr || "0.00"}
                    </span>
                    <span className="text-xs text-gray-400 block mt-1">
                      OpenAI GPT-4o-mini ({sessionDetail.costs?.llm?.totalTokens || 0} total tokens)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-500">
                    Prompt: {sessionDetail.costs?.llm?.promptTokens || 0} • Completion:{" "}
                    {sessionDetail.costs?.llm?.completionTokens || 0}
                  </div>
                </div>
              </div>

              {/* Total Billing & Margin Overview */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Microservice Unit Economics & Margin Telemetry
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Total Session Spend:</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{sessionDetail.costs?.totalCostInr?.toFixed(2) || "0.00"}
                    </span>
                    <span className="text-xs text-gray-400">
                      (≈ ${sessionDetail.costs?.totalCostUsd?.toFixed(4) || "0.0000"})
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">
                        Speech-to-Text: Sarvam Saaras AI STT
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        Processed: {sessionDetail.costs?.stt?.audioSeconds || 0} seconds of user audio • Rate: ₹0.30/min
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white sm:text-right">
                      ₹{sessionDetail.costs?.stt?.costInr || "0.00"}
                    </span>
                  </div>

                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">
                        Text-to-Speech: Sarvam Bulbul v3 TTS
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        Synthesized: {sessionDetail.costs?.tts?.characterCount || 0} characters • Rate: ₹3.00/10k chars
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white sm:text-right">
                      ₹{sessionDetail.costs?.tts?.costInr || "0.00"}
                    </span>
                  </div>

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
  );
};

export default SessionAuditDetail;

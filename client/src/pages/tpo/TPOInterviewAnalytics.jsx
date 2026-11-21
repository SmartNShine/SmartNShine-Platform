import {useState, useEffect} from "react";
import {tpoAnalyticsAPI} from "@/api/tpo.api";
import KPICard from "@/components/tpo/KPICard";
import {
  Mic2,
  Brain,
  Sparkles,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Award,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TPOInterviewAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType) params.interviewType = selectedType;
      const res = await tpoAnalyticsAPI.getInterviewAnalytics(params);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load interview analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  const skillAvgs = data?.skillAverages || {
    communication: 0,
    technicalKnowledge: 0,
    problemSolving: 0,
    situationalAwareness: 0,
    culturalFit: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Mic2 className="w-6 h-6 text-blue-400" />
            AI Mock Interview Analytics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Student performance metrics derived from SmartNShine Voice & Text AI
            Interview Simulator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Interview Types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="resume-based">Resume-Based</option>
            <option value="job-description">Job-Description</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="Total Mock Sessions"
          value={data?.totalSessions || 0}
          subtitle="Initiated by students"
          icon={Mic2}
          color="blue"
        />
        <KPICard
          title="Completed Sessions"
          value={data?.completedSessions || 0}
          subtitle={`${data?.completionRate || 0}% completion rate`}
          icon={Award}
          color="emerald"
        />
        <KPICard
          title="Cohort Average Score"
          value={data?.avgOverallScore ? `${data.avgOverallScore}%` : "N/A"}
          subtitle="Evaluated across all roles"
          icon={Brain}
          color="indigo"
        />
        <KPICard
          title="Tech Competence"
          value={
            skillAvgs.technicalKnowledge
              ? `${skillAvgs.technicalKnowledge}%`
              : "N/A"
          }
          subtitle="Domain accuracy score"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Skill Breakdown & Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Dimensions Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Core Competency Radar
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Average scores across standard placement assessment dimensions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Technical Accuracy & Knowledge",
                score: skillAvgs.technicalKnowledge,
                color: "bg-blue-500",
              },
              {
                label: "Communication & Articulation",
                score: skillAvgs.communication,
                color: "bg-emerald-500",
              },
              {
                label: "Problem Solving & Analytical Thinking",
                score: skillAvgs.problemSolving,
                color: "bg-purple-500",
              },
              {
                label: "Situational & Scenario Awareness",
                score: skillAvgs.situationalAwareness,
                color: "bg-amber-500",
              },
              {
                label: "Cultural Fit & Professional Attitude",
                score: skillAvgs.culturalFit,
                color: "bg-rose-500",
              },
            ].map((skill, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-zinc-300">{skill.label}</span>
                  <span className="text-white font-mono">{skill.score}%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-50 dark:bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    style={{width: `${skill.score}%`}}
                    className={`h-full ${skill.color} rounded-full transition-all duration-700`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution Spectrum */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Interview Score Distribution
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Session counts clustered by performance tier
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {data?.scoreDistribution?.map((d, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    Range: {d.range}% Score
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white">
                    {d.count}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                    sessions
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interview Types Breakdown */}
      {data?.typeBreakdown?.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            Interviews by Simulation Format
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.typeBreakdown.map((t, idx) => (
              <div
                key={idx}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center space-y-1"
              >
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                  {t.type}
                </span>
                <span className="text-2xl font-black text-white">
                  {t.count}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

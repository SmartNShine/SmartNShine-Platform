import {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {tpoReadinessAPI} from "@/api/tpo.api";
import ReadinessGauge from "@/components/tpo/ReadinessGauge";
import KPICard from "@/components/tpo/KPICard";
import {
  Brain,
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileText,
  Mic2,
  Award,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import TPO3DButton from "@/components/tpo/TPO3DButton";

export default function TPOReadiness() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await tpoReadinessAPI.getInstitution({refresh});
      setData(res.data.data);
      if (refresh)
        toast.success("Readiness scores refreshed from live signals!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load readiness engine metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = data?.stats || {
    averageScore: 0,
    totalAssessed: 0,
    totalEnrolled: 0,
    distribution: {excellent: 0, good: 0, average: 0, needsWork: 0},
    componentAverages: {resume: 0, interview: 0, technical: 0, engagement: 0},
  };

  const students = data?.students || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Student Readiness Engine
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Explainable, normalized career preparedness evaluation powered by
            SmartNShine AI algorithms.
          </p>
        </div>

        <TPO3DButton
          type="button"
          variant="primary"
          size="md"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>
            {refreshing ? "Recomputing Signals..." : "Recalculate All Scores"}
          </span>
        </TPO3DButton>
      </div>

      {/* Formula Transparency Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Transparent Scoring Formulation</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-4xl">
          The AI Readiness Engine computes student scores dynamically using
          verified platform artifacts. Missing components are normalized across
          remaining signals so unassessed students are not penalized unfairly.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block">
              1. Resume Quality
            </span>
            <span className="text-xl font-black text-emerald-400">30%</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
              Sections & skills presence
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block">
              2. Mock Interviews
            </span>
            <span className="text-xl font-black text-blue-400">40%</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
              AI evaluation results
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block">
              3. Technical Skills
            </span>
            <span className="text-xl font-black text-purple-400">20%</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
              Verified domain keywords
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block">
              4. Platform Activity
            </span>
            <span className="text-xl font-black text-amber-400">10%</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
              Consistency & login recency
            </span>
          </div>
        </div>
      </div>

      {/* Cohort Readiness Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="Cohort Readiness Average"
          value={stats.averageScore ? `${stats.averageScore}%` : "N/A"}
          subtitle={`${stats.totalAssessed} of ${stats.totalEnrolled} students`}
          icon={Brain}
          color="purple"
        />
        <KPICard
          title="Avg Resume Score"
          value={`${stats.componentAverages?.resume || 0}%`}
          subtitle="Completeness benchmark"
          icon={FileText}
          color="emerald"
        />
        <KPICard
          title="Avg Interview Score"
          value={`${stats.componentAverages?.interview || 0}%`}
          subtitle="Mock session performance"
          icon={Mic2}
          color="blue"
        />
        <KPICard
          title="Placement Ready"
          value={stats.distribution?.excellent || 0}
          subtitle="Students with score 80%+"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Student Readiness Ranked List */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            Student Readiness Scorecard
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Ranked by overall preparedness
          </span>
        </div>

        {students.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 py-10 text-center">
            No student readiness data computed yet. Click "Recalculate All
            Scores" above.
          </p>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {students.map((s, idx) => (
              <div
                key={s.userId}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-100 dark:bg-zinc-900/30 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
                    #{idx + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {s.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <Link
                      to={`/tpo/students/${s.userId}`}
                      className="font-semibold text-zinc-900 dark:text-white hover:text-indigo-400 transition-colors block text-sm"
                    >
                      {s.name}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Roll: {s.rollNumber || "N/A"} • Completeness:{" "}
                      {s.dataCompleteness}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto">
                  {/* Pillar scores mini view */}
                  <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>
                      Resume:{" "}
                      <strong className="text-zinc-800 dark:text-zinc-200">
                        {s.components?.resume?.score !== null
                          ? `${s.components.resume.score}%`
                          : "—"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Interview:{" "}
                      <strong className="text-zinc-800 dark:text-zinc-200">
                        {s.components?.interview?.score !== null
                          ? `${s.components.interview.score}%`
                          : "—"}
                      </strong>
                    </span>
                  </div>

                  {/* Overall Badge */}
                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        s.readinessScore >= 80
                          ? "text-emerald-400"
                          : s.readinessScore >= 60
                            ? "text-indigo-400"
                            : s.readinessScore >= 40
                              ? "text-amber-400"
                              : "text-red-400"
                      }`}
                    >
                      {s.readinessScore !== null
                        ? `${s.readinessScore}%`
                        : "N/A"}
                    </span>
                    <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                      {s.trend}
                    </span>
                  </div>

                  <Link
                    to={`/tpo/students/${s.userId}`}
                    className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:bg-zinc-900"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

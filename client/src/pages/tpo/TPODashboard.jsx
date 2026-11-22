import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Brain,
  Building2,
  Clock,
  FileText,
  Megaphone,
  Mic2,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { tpoReportsAPI } from "@/api/tpo.api";
import { useTPO } from "@/context/TPOContext";
import { useDarkMode } from "@/context/DarkModeContext";
import ReadinessGauge from "@/components/tpo/ReadinessGauge";
import TPO3DButton from "@/components/tpo/TPO3DButton";

const BANDS = [
  { key: "excellent", name: "Ready", range: "80+", color: "#10b981" },
  { key: "good", name: "Good", range: "60–79", color: "#6366f1" },
  { key: "average", name: "Moderate", range: "40–59", color: "#f59e0b" },
  { key: "needsWork", name: "Support", range: "<40", color: "#f43f5e" },
];

const WEIGHTS = [
  { label: "AI mock interviews", value: 40, color: "bg-indigo-500" },
  { label: "Resume ATS quality", value: 30, color: "bg-emerald-500" },
  { label: "Technical skills", value: 20, color: "bg-amber-500" },
  { label: "Platform activity", value: 10, color: "bg-sky-500" },
];

const SHORTCUTS = [
  {
    to: "/tpo/students",
    title: "Invite students",
    detail: "Roster, consent, and batches",
    icon: UserPlus,
    tint: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50",
  },
  {
    to: "/tpo/announcements",
    title: "Campus notice",
    detail: "Drives, deadlines, pinning",
    icon: Megaphone,
    tint: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50",
  },
];

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-mono space-y-1">
      {label && (
        <p className="text-zinc-400 border-b border-zinc-800 pb-1">{label}</p>
      )}
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4">
          <span style={{ color: item.color || item.payload?.color }}>{item.name}</span>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, tint }) {
  return (
    <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 leading-snug">{hint}</p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${tint}`}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function TPODashboard() {
  const { institution } = useTPO();
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  const fetchOverview = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const res = await tpoReportsAPI.getOverview();
      setOverview(res.data.data);
      setError("");
    } catch (err) {
      console.error("Overview error:", err);
      setError("Failed to load campus metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpis = overview?.kpis || {
    totalEnrolled: 0,
    activeStudents: 0,
    pendingInvites: 0,
    totalResumes: 0,
    totalInterviews: 0,
    totalAssignments: 0,
    completedSubmissions: 0,
    avgReadiness: 0,
  };

  const dist = overview?.readinessDistribution || {
    excellent: 0,
    good: 0,
    average: 0,
    needsWork: 0,
  };

  const totalAssessed =
    dist.excellent + dist.good + dist.average + dist.needsWork;

  const bandData = useMemo(
    () =>
      BANDS.map((band) => ({
        ...band,
        students: dist[band.key] || 0,
        share: pct(dist[band.key] || 0, totalAssessed),
      })),
    [dist, totalAssessed]
  );

  const submissionRate = pct(
    kpis.completedSubmissions,
    Math.max(kpis.completedSubmissions, kpis.totalAssignments, 1)
  );

  const axisColor = isDarkMode ? "#71717a" : "#a1a1aa";
  const gridColor = isDarkMode ? "#27272a" : "#e4e4e7";
  const pieStroke = isDarkMode ? "#09090b" : "#ffffff";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 animate-pulse">
          <Activity className="w-4 h-4" />
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading campus telemetry
        </p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-rose-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Campus overview unavailable
        </h2>
        <p className="text-xs text-zinc-500 mt-1">{error}</p>
        <TPO3DButton
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={() => fetchOverview(true)}
        >
          Retry
        </TPO3DButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Overview
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {institution?.name || "Your campus"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TPO3DButton
            type="button"
            variant="surface"
            size="sm"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </TPO3DButton>
          <TPO3DButton to="/tpo/students" variant="primary" size="md">
            <UserPlus className="w-4 h-4" />
            Add student
          </TPO3DButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active students"
          value={kpis.activeStudents.toLocaleString()}
          hint={
            kpis.pendingInvites
              ? `${kpis.pendingInvites} invitation pending`
              : `${kpis.totalEnrolled} enrolled`
          }
          icon={Users}
          tint="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50"
        />
        <StatCard
          label="Resumes"
          value={kpis.totalResumes.toLocaleString()}
          hint="Created by students"
          icon={FileText}
          tint="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50"
        />
        <StatCard
          label="Mock interviews"
          value={kpis.totalInterviews.toLocaleString()}
          hint="Completed sessions"
          icon={Mic2}
          tint="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50"
        />
        <StatCard
          label="Avg. readiness"
          value={kpis.avgReadiness ? `${kpis.avgReadiness}%` : "—"}
          hint={`${totalAssessed} students assessed`}
          icon={Brain}
          tint="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Placement readiness distribution
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Latest score band for each assessed student.
              </p>
            </div>
            <TPO3DButton to="/tpo/readiness" variant="surface" size="sm">
              Open readiness engine
              <ArrowUpRight className="w-3.5 h-3.5" />
            </TPO3DButton>
          </div>

          <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-900 mb-5">
            {totalAssessed > 0 ? (
              bandData.map((band) => (
                <div
                  key={band.key}
                  style={{ width: `${band.share}%`, backgroundColor: band.color }}
                  title={`${band.name}: ${band.students}`}
                />
              ))
            ) : (
              <div className="w-full" />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {bandData.map((band) => (
              <div
                key={band.key}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                  {band.name}
                </div>
                <div className="mt-1 text-xl font-bold font-mono text-zinc-900 dark:text-white">
                  {band.students}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  {band.range} · {band.share}%
                </div>
              </div>
            ))}
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandData} barSize={28} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: axisColor, fontFamily: "monospace" }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: axisColor, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: isDarkMode ? "#27272a" : "#f4f4f5" }} />
                <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]}>
                  {bandData.map((band) => (
                    <Cell key={band.key} fill={band.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Cohort average
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                Weighted
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-2">
              Explainable score across four signals.
            </p>
            <div className="flex justify-center py-2">
              <ReadinessGauge score={kpis.avgReadiness} size="lg" />
            </div>
            <div className="space-y-2.5 mt-2">
              {WEIGHTS.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{item.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Band mix
            </h2>
            <span className="text-[10px] font-mono text-zinc-400">
              {totalAssessed} scored
            </span>
          </div>
          <div className="relative h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bandData.filter((band) => band.students > 0).length ? bandData : [{ name: "None", students: 1, color: "#e4e4e7" }]}
                  dataKey="students"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={3}
                  stroke={pieStroke}
                  strokeWidth={2}
                >
                  {(bandData.filter((band) => band.students > 0).length ? bandData : [{ color: "#e4e4e7" }]).map((band, index) => (
                    <Cell key={index} fill={band.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                {kpis.avgReadiness || 0}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                avg
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Tasks live</p>
              <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-white">
                {kpis.totalAssignments}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Submissions</p>
              <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-white">
                {kpis.completedSubmissions}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
              <span>Submission coverage</span>
              <span className="font-mono">{Math.min(100, submissionRate)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.min(100, submissionRate)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Institutional activity
            </h2>
          </div>

          {overview?.recentActivity?.length > 0 ? (
            <div className="space-y-1">
              {overview.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
                >
                  <div className="mt-0.5 w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-900 dark:text-white">
                      {log.description}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {log.performedBy}
                      {log.action ? ` · ${log.action}` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Building2 className="w-6 h-6 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500">
                Activity appears as officers review students, resumes, and interviews.
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <TPO3DButton
                  key={item.to}
                  to={item.to}
                  variant="surface"
                  size="md"
                  className="w-full justify-between gap-3 px-3 py-2.5 min-h-[52px] font-normal"
                >
                  <span className="flex items-center gap-3 min-w-0 text-left">
                    <span
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${item.tint}`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-inherit">
                        {item.title}
                      </span>
                      <span className="block text-[11px] font-normal opacity-70 truncate text-inherit">
                        {item.detail}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                </TPO3DButton>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-indigo-500">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              Deeper campus cuts
            </p>
            <p className="text-[11px]">Resume quality and interview benchmarks.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <TPO3DButton to="/tpo/resume-analytics" variant="surface" size="sm">
            Resume intelligence
          </TPO3DButton>
          <TPO3DButton to="/tpo/interview-analytics" variant="primary" size="sm">
            Interview analytics
          </TPO3DButton>
        </div>
      </div>
    </div>
  );
}

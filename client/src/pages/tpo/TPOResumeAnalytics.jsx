import {useState, useEffect} from "react";
import {tpoAnalyticsAPI, tpoSettingsAPI} from "@/api/tpo.api";
import KPICard from "@/components/tpo/KPICard";
import {
  FileText,
  Sparkles,
  BarChart2,
  PieChart,
  Layers,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TPOResumeAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.departmentId = selectedDept;
      const res = await tpoAnalyticsAPI.getResumeAnalytics(params);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load resume analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tpoSettingsAPI
      .get()
      .then((res) => {
        setDepartments(res.data.data?.institution?.departments || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const sec = data?.sectionCompleteness || {
    summary: 0,
    experience: 0,
    education: 0,
    skills: 0,
    projects: 0,
    certifications: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Resume Intelligence & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Aggregated analysis of student resumes created using SmartNShine AI
            Resume Builder.
          </p>
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="Resumes Created"
          value={data?.totalResumesCreated || 0}
          subtitle="Total stored in platform"
          icon={FileText}
          color="emerald"
        />
        <KPICard
          title="Students with Resumes"
          value={data?.studentsWithResumes || 0}
          subtitle={`Out of ${data?.totalEnrolledStudents || 0} enrolled`}
          icon={CheckCircle2}
          color="indigo"
        />
        <KPICard
          title="Avg Resumes / Student"
          value={data?.avgResumesPerStudent || 0}
          subtitle="Iterative drafts created"
          icon={Layers}
          color="blue"
        />
        <KPICard
          title="No Resume Yet"
          value={data?.studentsWithoutResumes || 0}
          subtitle="Need TPO prompt"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Section Completeness & Top Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Completeness Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Resume Section Completeness Benchmark
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Percentage of student resumes containing verified required
              sections
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Professional Summary",
                val: sec.summary,
                color: "bg-indigo-500",
              },
              {
                label: "Technical & Soft Skills",
                val: sec.skills,
                color: "bg-emerald-500",
              },
              {
                label: "Education & Academics",
                val: sec.education,
                color: "bg-blue-500",
              },
              {
                label: "Projects & Portfolios",
                val: sec.projects,
                color: "bg-purple-500",
              },
              {
                label: "Work / Internship Experience",
                val: sec.experience,
                color: "bg-amber-500",
              },
              {
                label: "Certifications & Achievements",
                val: sec.certifications,
                color: "bg-rose-500",
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
                  <span className="text-white">{item.val}%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-50 dark:bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    style={{width: `${item.val}%`}}
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Verified Skills Frequency */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Most Frequent Skills Identified
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Top technical competencies discovered across student resumes
            </p>
          </div>

          {data?.topSkills?.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {data.topSkills.map((s, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="capitalize">{s.skill}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-10 text-center">
              No skill data available yet.
            </p>
          )}
        </div>
      </div>

      {/* Templates Used Distribution */}
      {data?.templateDistribution?.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            ATS Template Selection Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {data.templateDistribution.map((t, idx) => (
              <div
                key={idx}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center space-y-1"
              >
                <span className="text-xs font-mono text-indigo-400 font-bold uppercase truncate block">
                  {t.templateId}
                </span>
                <span className="text-xl font-black text-white">{t.count}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                  students
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

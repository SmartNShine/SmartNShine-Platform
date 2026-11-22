import {useState, useEffect} from "react";
import {tpoReportsAPI} from "@/api/tpo.api";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  FileText,
  Mic2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import TPO3DButton from "@/components/tpo/TPO3DButton";

export default function TPOReports() {
  const [deptReport, setDeptReport] = useState([]);
  const [batchReport, setBatchReport] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingStudents, setExportingStudents] = useState(false);
  const [exportingReadiness, setExportingReadiness] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [deptRes, batchRes, gapsRes] = await Promise.all([
        tpoReportsAPI.getDepartmentReadiness(),
        tpoReportsAPI.getBatchPerformance(),
        tpoReportsAPI.getSkillGaps(),
      ]);

      setDeptReport(deptRes.data.data?.report || []);
      setBatchReport(batchRes.data.data?.report || []);
      setSkillGaps(gapsRes.data.data?.topWeaknesses || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportStudents = async () => {
    try {
      setExportingStudents(true);
      const res = await tpoReportsAPI.exportStudentsCSV();
      downloadBlob(
        new Blob([res.data], {type: "text/csv"}),
        "students_roster.csv"
      );
      toast.success("Students roster CSV downloaded.");
    } catch (err) {
      toast.error("Failed to export students CSV.");
    } finally {
      setExportingStudents(false);
    }
  };

  const handleExportReadiness = async () => {
    try {
      setExportingReadiness(true);
      const res = await tpoReportsAPI.exportReadinessCSV();
      downloadBlob(
        new Blob([res.data], {type: "text/csv"}),
        "readiness_scorecard.csv"
      );
      toast.success("Readiness report CSV downloaded.");
    } catch (err) {
      toast.error("Failed to export readiness CSV.");
    } finally {
      setExportingReadiness(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Executive Reports & Exports
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Department-level benchmarking, batch progress breakdowns, and full
            data exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TPO3DButton
            type="button"
            variant="surface"
            size="md"
            onClick={handleExportStudents}
            disabled={exportingStudents}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>
              {exportingStudents ? "Exporting..." : "Export Students CSV"}
            </span>
          </TPO3DButton>

          <TPO3DButton
            type="button"
            variant="primary"
            size="md"
            onClick={handleExportReadiness}
            disabled={exportingReadiness}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {exportingReadiness ? "Exporting..." : "Export Readiness Report"}
            </span>
          </TPO3DButton>
        </div>
      </div>

      {/* Department Readiness Benchmark Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          Department-Wise Career Readiness Benchmark
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Enrolled Students</th>
                <th className="py-3 px-4 text-center">Assessed Count</th>
                <th className="py-3 px-4 text-center">Average AI Readiness</th>
                <th className="py-3 px-4 text-center">Highest Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-600 dark:text-zinc-300">
              {deptReport.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No department data available.
                  </td>
                </tr>
              ) : (
                deptReport.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-zinc-100 dark:bg-zinc-900/30">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-white">
                      {dept.departmentName} ({dept.departmentCode || "N/A"})
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {dept.studentCount}
                    </td>
                    <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-zinc-400">
                      {dept.assessedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-indigo-400 text-sm">
                        {dept.avgReadiness}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-400">
                        {dept.highestScore}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Performance Breakdown */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Academic Batch Performance & Volume
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchReport.length === 0 ? (
            <p className="col-span-full py-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              No batch performance metrics available.
            </p>
          ) : (
            batchReport.map((b, idx) => (
              <div
                key={idx}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                    {b.batchName}
                  </h4>
                  <span className="text-xs font-black text-indigo-400">
                    {b.avgReadiness ? `${b.avgReadiness}% Ready` : "No Score"}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Enrolled Cohort:</span>
                    <strong className="text-white">{b.studentCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Resumes Generated:</span>
                    <strong className="text-emerald-400">
                      {b.resumesCreated}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mocks Completed:</span>
                    <strong className="text-blue-400">
                      {b.interviewsCompleted}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

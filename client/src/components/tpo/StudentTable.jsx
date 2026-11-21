import {useState} from "react";
import { Link } from "react-router-dom";
import TPO3DButton from "@/components/tpo/TPO3DButton";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
} from "lucide-react";

const inputClass =
  "w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

export default function StudentTable({
  students = [],
  departments = [],
  batches = [],
  onDeactivate,
  onReactivate,
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filtered = students.filter((s) => {
    const matchesSearch =
      searchTerm === "" ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = !selectedDept || String(s.departmentId) === String(selectedDept);
    const matchesBatch = !selectedBatch || String(s.batchId) === String(selectedBatch);
    const matchesStatus =
      selectedStatus === "all" || s.status === selectedStatus;

    return matchesSearch && matchesDept && matchesBatch && matchesStatus;
  });

  const getReadinessBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
          No Data
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          <Sparkles className="w-3 h-3" />
          {score}% Ready
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
          {score}%
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          {score}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
        {score}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-9 pr-4 py-2`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {departments.length > 0 && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`${inputClass} w-auto px-3 py-2`}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code || "DEPT"})
                </option>
              ))}
            </select>
          )}

          {batches.length > 0 && (
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className={`${inputClass} w-auto px-3 py-2`}
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`${inputClass} w-auto px-3 py-2`}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Consent</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 text-xs font-medium border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 sm:px-6">Student</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Department & Batch</th>
                <th className="py-3 px-4 text-center">AI Readiness</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm text-zinc-700 dark:text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading students...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-500">
                    <p className="font-semibold text-zinc-600 dark:text-zinc-400">
                      No students found
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {searchTerm
                        ? "Try clearing search filters."
                        : "Invite or import students to begin tracking."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/70 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex-shrink-0 flex items-center justify-center">
                          {s.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="overflow-hidden">
                          <Link
                            to={`/tpo/students/${s.userId}`}
                            className="font-semibold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate max-w-[180px] sm:max-w-xs"
                          >
                            {s.name}
                          </Link>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate max-w-[180px] sm:max-w-xs">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {s.rollNumber || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                        {s.departmentName || "General"}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {s.batchName || "N/A"}
                        {s.section ? ` • Sec ${s.section}` : ""}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getReadinessBadge(s.readinessScore)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {s.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : s.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                          <Clock className="w-3 h-3" />
                          Invite Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          <XCircle className="w-3 h-3" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TPO3DButton
                          to={`/tpo/students/${s.userId}`}
                          variant="ghost"
                          size="icon"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </TPO3DButton>

                        {s.status === "active" && onDeactivate && (
                          <TPO3DButton
                            type="button"
                            variant="danger"
                            size="icon"
                            onClick={() => onDeactivate(s.userId)}
                            title="Deactivate Student"
                          >
                            <UserX className="w-4 h-4" />
                          </TPO3DButton>
                        )}

                        {s.status === "deactivated" && onReactivate && (
                          <TPO3DButton
                            type="button"
                            variant="primary"
                            size="icon"
                            onClick={() => onReactivate(s.userId)}
                            title="Reactivate Student"
                          >
                            <UserCheck className="w-4 h-4" />
                          </TPO3DButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

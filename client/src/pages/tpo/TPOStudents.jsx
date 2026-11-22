import { useState, useEffect } from "react";
import { tpoStudentsAPI, tpoSettingsAPI } from "@/api/tpo.api";
import StudentTable from "@/components/tpo/StudentTable";
import { UserPlus, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  tpoInput,
  tpoModalOverlay,
  tpoModalPanel,
  tpoPageSubtitle,
  tpoPageTitle,
} from "@/components/tpo/tpoTheme";
import TPO3DButton from "@/components/tpo/TPO3DButton";

export default function TPOStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    departmentId: "",
    batchId: "",
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await tpoStudentsAPI.list({ limit: 100 });
      setStudents(res.data.data?.students || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load students list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await tpoSettingsAPI.get();
      const inst = res.data.data?.institution;
      setDepartments(
        inst?.departments?.filter((d) => d.isActive !== false) || []
      );
      setBatches(inst?.batches?.filter((b) => b.isActive !== false) || []);
    } catch (err) {
      console.error("Failed to load institution settings:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSettings();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.email) {
      toast.error("Student email is required.");
      return;
    }

    try {
      setInviteLoading(true);
      const res = await tpoStudentsAPI.invite(inviteForm);
      toast.success(res.data.message || "Invitation sent successfully!");
      setInviteModalOpen(false);
      setInviteForm({
        name: "",
        email: "",
        rollNumber: "",
        departmentId: "",
        batchId: "",
      });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to invite student.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeactivate = async (studentId) => {
    if (
      !confirm(
        "Are you sure you want to deactivate this student's institutional access?"
      )
    )
      return;
    try {
      await tpoStudentsAPI.deactivate(
        studentId,
        "Deactivated from TPO Dashboard"
      );
      toast.success("Student deactivated.");
      fetchStudents();
    } catch (err) {
      toast.error("Failed to deactivate student.");
    }
  };

  const handleReactivate = async (studentId) => {
    try {
      await tpoStudentsAPI.reactivate(studentId);
      toast.success("Student reactivated.");
      fetchStudents();
    } catch (err) {
      toast.error("Failed to reactivate student.");
    }
  };

  const activeCount = students.filter((s) => s.status === "active").length;
  const pendingCount = students.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans antialiased">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className={tpoPageTitle}>Students</h1>
          <p className={tpoPageSubtitle}>
            Add students by email invite. They join after accepting and giving consent.
          </p>
          {!loading && students.length > 0 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 tabular-nums">
              {activeCount} active · {pendingCount} pending
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <TPO3DButton
            type="button"
            variant="surface"
            size="icon"
            onClick={() => fetchStudents()}
            title="Refresh list"
            aria-label="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </TPO3DButton>
          <TPO3DButton
            type="button"
            variant="primary"
            size="md"
            onClick={() => setInviteModalOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Add student
          </TPO3DButton>
        </div>
      </div>

      <StudentTable
        students={students}
        departments={departments}
        batches={batches}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        loading={loading}
      />

      {inviteModalOpen && (
        <div className={tpoModalOverlay}>
          <div className={`${tpoModalPanel} max-w-md p-6 sm:p-7 space-y-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Add student
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  We&apos;ll email an invite to join your campus.
                </p>
              </div>
              <TPO3DButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setInviteModalOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </TPO3DButton>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="student@college.edu"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  className={tpoInput}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  className={tpoInput}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Roll number
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={inviteForm.rollNumber}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, rollNumber: e.target.value })
                  }
                  className={tpoInput}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Department
                  </label>
                  <select
                    value={inviteForm.departmentId}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        departmentId: e.target.value,
                      })
                    }
                    className={tpoInput}
                  >
                    <option value="">Select</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Batch
                  </label>
                  <select
                    value={inviteForm.batchId}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, batchId: e.target.value })
                    }
                    className={tpoInput}
                  >
                    <option value="">Select</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <TPO3DButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInviteModalOpen(false)}
                >
                  Cancel
                </TPO3DButton>
                <TPO3DButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={inviteLoading}
                >
                  {inviteLoading ? "Sending…" : "Send invite"}
                </TPO3DButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

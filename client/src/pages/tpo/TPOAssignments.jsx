import {useState, useEffect} from "react";
import {tpoAssignmentsAPI, tpoSettingsAPI} from "@/api/tpo.api";
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  FileText,
  Mic2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import TPO3DButton from "@/components/tpo/TPO3DButton";

export default function TPOAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);

  // Assignment form
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "create-resume",
    targetType: "all",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    targetDepartmentIds: [],
    targetBatchIds: [],
  });
  const [creating, setCreating] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await tpoAssignmentsAPI.list();
      setAssignments(res.data.data?.assignments || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    tpoSettingsAPI
      .get()
      .then((res) => {
        const inst = res.data.data?.institution;
        setDepartments(inst?.departments || []);
        setBatches(inst?.batches || []);
      })
      .catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Assignment title is required.");
      return;
    }

    try {
      setCreating(true);
      await tpoAssignmentsAPI.create(form);
      toast.success("Assignment created and distributed to targeted students!");
      setModalOpen(false);
      setForm({
        title: "",
        description: "",
        type: "create-resume",
        targetType: "all",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        targetDepartmentIds: [],
        targetBatchIds: [],
      });
      fetchAssignments();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create assignment."
      );
    } finally {
      setCreating(false);
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      "create-resume": {
        label: "Create ATS Resume",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      },
      "improve-resume": {
        label: "Improve Resume",
        color: "bg-teal-500/15 text-teal-400 border-teal-500/20",
      },
      "technical-interview": {
        label: "Technical Mock Interview",
        color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
      },
      "behavioral-interview": {
        label: "Behavioral Interview",
        color: "bg-purple-500/15 text-purple-400 border-purple-500/20",
      },
      "mock-interview": {
        label: "General Mock Session",
        color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
      },
      "ats-check": {
        label: "ATS Optimization Scan",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      },
      "practice-skill": {
        label: "Skill Deep Dive",
        color: "bg-rose-500/15 text-rose-400 border-rose-500/20",
      },
    };
    const t = map[type] || {
      label: type,
      color: "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    };
    return (
      <span
        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${t.color}`}
      >
        {t.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            Career Preparation Assignments
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Assign ATS resume improvements and AI mock interview challenges to
            specific cohorts.
          </p>
        </div>

        <TPO3DButton
          type="button"
          variant="primary"
          size="md"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </TPO3DButton>
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-zinc-500 dark:text-zinc-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading assignments...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No assignments created yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Motivate your students by creating guided career preparation tasks
              like building ATS resumes or completing technical mock interviews.
            </p>
            <TPO3DButton
              type="button"
              variant="primary"
              size="sm"
              className="mt-2"
              onClick={() => setModalOpen(true)}
            >
              Create First Assignment
            </TPO3DButton>
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a._id}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-zinc-200 dark:border-zinc-700 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {getTypeBadge(a.type)}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      a.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-snug line-clamp-2">
                  {a.title}
                </h3>
                {a.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {a.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    Due {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    Target: {a.targetType}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    <span>Submissions</span>
                    <span>
                      {a.stats?.totalCompleted || 0} /{" "}
                      {a.stats?.totalAssigned || 0}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-50 dark:bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      style={{width: `${a.stats?.completionRate || 0}%`}}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Create Career Assignment
              </h3>
              <TPO3DButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </TPO3DButton>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build Software Engineering ATS Resume"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Activity Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="create-resume">
                    Create ATS-Friendly Resume
                  </option>
                  <option value="improve-resume">
                    Improve Existing Resume
                  </option>
                  <option value="technical-interview">
                    Complete Technical Mock Interview
                  </option>
                  <option value="behavioral-interview">
                    Complete Behavioral Mock Interview
                  </option>
                  <option value="mock-interview">
                    General AI Mock Interview
                  </option>
                  <option value="ats-check">Run ATS Score Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline expected deliverables, e.g. Include at least 3 software projects with metrics..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({...form, description: e.target.value})
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({...form, startDate: e.target.value})
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Submission Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({...form, dueDate: e.target.value})
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <TPO3DButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </TPO3DButton>
                <TPO3DButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={creating}
                >
                  {creating ? "Assigning..." : "Publish Assignment"}
                </TPO3DButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

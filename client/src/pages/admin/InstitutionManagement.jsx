import {useState, useEffect} from "react";
import {
  getInstitutions,
  deleteInstitution,
  createInstitution,
  updateInstitution,
} from "@/api/admin.api";
import {
  isCampusSuspended,
  normalizeCampusStatus,
} from "@/utils/campusStatus";
import {
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Mail,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Plus,
  X,
  Users,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

export default function InstitutionManagement() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    institutionName: "",
    shortName: "",
    institutionEmail: "",
    contactPhone: "",
    website: "",
    emailDomain: "",
    city: "",
    state: "",
    tpoName: "",
    tpoEmail: "",
    tpoPassword: "",
    tpoDesignation: "Head of Training & Placement",
    studentLimit: "500",
  });
  const [limitEdit, setLimitEdit] = useState(null);
  const [limitDraft, setLimitDraft] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);

  const resetCreateForm = () => {
    setCreateForm({
      institutionName: "",
      shortName: "",
      institutionEmail: "",
      contactPhone: "",
      website: "",
      emailDomain: "",
      city: "",
      state: "",
      tpoName: "",
      tpoEmail: "",
      tpoPassword: "",
      tpoDesignation: "Head of Training & Placement",
      studentLimit: "500",
    });
  };

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await getInstitutions();
      setInstitutions(res.data.institutions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load institutions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleSetCampusStatus = async (id, status) => {
    try {
      setProcessingId(id);
      await updateInstitution(id, {status});
      toast.success(
        status === "active" ? "Campus reactivated." : "Campus suspended.",
      );
      fetchInstitutions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update campus status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateCampus = async (e) => {
    e.preventDefault();
    const f = createForm;
    if (
      !f.institutionName ||
      !f.institutionEmail ||
      !f.tpoName ||
      !f.tpoEmail ||
      !f.tpoPassword
    ) {
      toast.error("Fill in required institution and TPO fields.");
      return;
    }
    if (f.tpoPassword.length < 6) {
      toast.error("TPO password must be at least 6 characters.");
      return;
    }
    const seatLimit = parseInt(f.studentLimit, 10);
    if (!Number.isFinite(seatLimit) || seatLimit < 1) {
      toast.error("Enter a valid student seat limit (minimum 1).");
      return;
    }
    try {
      setCreating(true);
      await createInstitution({
        institutionName: f.institutionName,
        shortName: f.shortName,
        institutionEmail: f.institutionEmail,
        contactPhone: f.contactPhone,
        website: f.website,
        emailDomain: f.emailDomain,
        address: {city: f.city, state: f.state},
        tpoName: f.tpoName,
        tpoEmail: f.tpoEmail,
        tpoPassword: f.tpoPassword,
        tpoDesignation: f.tpoDesignation,
        studentLimit: seatLimit,
      });
      toast.success("Campus registered — primary TPO can sign in immediately.");
      setShowCreate(false);
      resetCreateForm();
      fetchInstitutions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register campus.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSeatLimit = async (e) => {
    e.preventDefault();
    if (!limitEdit) return;
    const parsed = parseInt(limitDraft, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error("Seat limit must be at least 1.");
      return;
    }
    try {
      setSavingLimit(true);
      await updateInstitution(limitEdit._id, {studentLimit: parsed});
      toast.success("Student seat limit updated.");
      setLimitEdit(null);
      fetchInstitutions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update seat limit.");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleDeleteInstitution = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setProcessingId(id);
      await deleteInstitution(id);
      toast.success(`Institution "${name}" deleted successfully.`);
      fetchInstitutions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete institution");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = institutions.filter((inst) => {
    const normalized = normalizeCampusStatus(inst.status);
    const matchesFilter =
      filterStatus === "all" || normalized === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.shortName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    total: institutions.length,
    active: institutions.filter((i) => !isCampusSuspended(i.status)).length,
    suspended: institutions.filter((i) => isCampusSuspended(i.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Campus & TPO Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Register institutions and primary TPO accounts directly. Suspend or
            remove access when needed.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register campus
          </button>
          <button
            type="button"
            onClick={fetchInstitutions}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-indigo-600 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl p-4">
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total campuses
          </span>
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 block">
            {counts.total}
          </span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Active
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 block">
            {counts.active}
          </span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Suspended
          </span>
          <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1 block">
            {counts.suspended}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by college name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All campuses</option>
            <option value="active">Active ({counts.active})</option>
            <option value="suspended">Suspended ({counts.suspended})</option>
          </select>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/60 text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] font-semibold border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 sm:px-6">College / Institution</th>
                <th className="py-3 px-4">Contact & Website</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4 text-center">Student seats</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Created</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-gray-700 dark:text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading institutions...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-600 dark:text-zinc-300">
                      No institutions found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchTerm
                        ? "Try clearing search filters."
                        : "No campuses yet — use Register campus to add one."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => (
                  <tr
                    key={inst._id}
                    className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Name & Acronym */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {inst.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-mono">
                              {inst.shortName || "N/A"}
                            </span>
                            {inst.emailDomain && (
                              <span>• domain: @{inst.emailDomain}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Website */}
                    <td className="py-4 px-4">
                      <div className="text-xs text-gray-900 dark:text-zinc-200 font-medium">
                        {inst.contactEmail}
                      </div>
                      {inst.website && (
                        <a
                          href={inst.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>
                            {inst.website.replace(/^https?:\/\//, "")}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-xs text-gray-600 dark:text-zinc-400">
                      {inst.address?.city || inst.address?.state ? (
                        <span>
                          {[inst.address?.city, inst.address?.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-zinc-200">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {inst.studentSeatsUsed ?? 0}
                          {" / "}
                          {inst.studentLimit ?? "—"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLimitEdit(inst);
                          setLimitDraft(
                            String(inst.studentLimit ?? inst.studentSeatsUsed ?? 1),
                          );
                        }}
                        className="mt-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit limit
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      {isCampusSuspended(inst.status) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                          <XCircle className="w-3 h-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-4 text-center text-xs text-gray-500 dark:text-zinc-400">
                      {new Date(inst.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCampusSuspended(inst.status) ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleSetCampusStatus(inst._id, "active")
                            }
                            disabled={processingId === inst._id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleSetCampusStatus(inst._id, "suspended")
                            }
                            disabled={processingId === inst._id}
                            className="px-2.5 py-1 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg text-xs transition-colors"
                            title="Suspend campus"
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteInstitution(inst._id, inst.name)}
                          disabled={processingId === inst._id}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs transition-colors"
                          title="Delete campus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Register campus & primary TPO
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampus} className="p-4 sm:p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Institution
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="sm:col-span-2 block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Name *
                    </span>
                    <input
                      required
                      value={createForm.institutionName}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          institutionName: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Short name
                    </span>
                    <input
                      value={createForm.shortName}
                      onChange={(e) =>
                        setCreateForm({...createForm, shortName: e.target.value})
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Contact email *
                    </span>
                    <input
                      required
                      type="email"
                      value={createForm.institutionEmail}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          institutionEmail: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Phone
                    </span>
                    <input
                      value={createForm.contactPhone}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          contactPhone: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Website
                    </span>
                    <input
                      value={createForm.website}
                      onChange={(e) =>
                        setCreateForm({...createForm, website: e.target.value})
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Student email domain
                    </span>
                    <input
                      placeholder="college.edu"
                      value={createForm.emailDomain}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          emailDomain: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      City
                    </span>
                    <input
                      value={createForm.city}
                      onChange={(e) =>
                        setCreateForm({...createForm, city: e.target.value})
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      State
                    </span>
                    <input
                      value={createForm.state}
                      onChange={(e) =>
                        setCreateForm({...createForm, state: e.target.value})
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="sm:col-span-2 block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Student seat limit *
                    </span>
                    <input
                      required
                      type="number"
                      min={1}
                      value={createForm.studentLimit}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          studentLimit: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                    <span className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1 block">
                      Maximum students (invited + active) who may use SmartNShine
                      under this campus.
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Primary TPO account
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Full name *
                    </span>
                    <input
                      required
                      value={createForm.tpoName}
                      onChange={(e) =>
                        setCreateForm({...createForm, tpoName: e.target.value})
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Designation
                    </span>
                    <input
                      value={createForm.tpoDesignation}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          tpoDesignation: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Login email *
                    </span>
                    <input
                      required
                      type="email"
                      value={createForm.tpoEmail}
                      onChange={(e) =>
                        setCreateForm({...createForm, tpoEmail: e.target.value})
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                      Temporary password *
                    </span>
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={createForm.tpoPassword}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          tpoPassword: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                  The campus is active immediately. Share these credentials with
                  the TPO so they can sign in at the TPO portal.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetCreateForm();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create campus & TPO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {limitEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSeatLimit}
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Student seat limit
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {limitEdit.name} — currently {limitEdit.studentSeatsUsed ?? 0}{" "}
                  in use
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLimitEdit(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="number"
              min={limitEdit.studentSeatsUsed ?? 1}
              value={limitDraft}
              onChange={(e) => setLimitDraft(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLimitEdit(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingLimit}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white disabled:opacity-50"
              >
                {savingLimit ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

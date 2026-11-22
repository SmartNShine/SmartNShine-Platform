import {useState, useEffect} from "react";
import {tpoSettingsAPI, tpoAuthAPI} from "@/api/tpo.api";
import {useTPO} from "@/context/TPOContext";
import {
  Settings,
  Building2,
  Users,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Save,
  UserPlus,
  GraduationCap,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import TPO3DButton from "@/components/tpo/TPO3DButton";

export default function TPOSettings() {
  const {institution, refreshProfile} = useTPO();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Institution form
  const [instForm, setInstForm] = useState({
    name: "",
    shortName: "",
    website: "",
    contactPhone: "",
    emailDomain: "",
    settings: {
      readinessWeights: {
        resume: 30,
        interview: 40,
        technical: 20,
        engagement: 10,
      },
      allowStudentSelfLink: true,
      requireStudentConsent: true,
    },
  });

  // Departments and batches
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tpoUsers, setTpoUsers] = useState([]);

  // New department form
  const [newDept, setNewDept] = useState({name: "", code: "", type: "Engineering"});
  // New batch form
  const [newBatch, setNewBatch] = useState({
    name: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 4,
  });

  // Invite secondary TPO form
  const [newTpo, setNewTpo] = useState({name: "", email: "", designation: ""});
  const [invitingTpo, setInvitingTpo] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await tpoSettingsAPI.get();
      const inst = res.data.data?.institution;
      if (inst) {
        setInstForm({
          name: inst.name || "",
          shortName: inst.shortName || "",
          website: inst.website || "",
          contactPhone: inst.contactPhone || "",
          emailDomain: inst.emailDomain || "",
          settings: inst.settings || {
            readinessWeights: {
              resume: 30,
              interview: 40,
              technical: 20,
              engagement: 10,
            },
            allowStudentSelfLink: true,
            requireStudentConsent: true,
          },
        });
        setDepartments(
          inst.departments?.filter((d) => d.isActive !== false) || []
        );
        setBatches(inst.batches?.filter((b) => b.isActive !== false) || []);
      }
      setTpoUsers(res.data.data?.tpoUsers || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load institution settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const w = instForm.settings.readinessWeights;
    const total =
      Number(w.resume) +
      Number(w.interview) +
      Number(w.technical) +
      Number(w.engagement);
    if (Math.round(total) !== 100) {
      toast.error(`Readiness weights must sum to 100 (current sum: ${total})`);
      return;
    }

    try {
      setSaving(true);
      await tpoSettingsAPI.update(instForm);
      toast.success("Settings saved successfully!");
      refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDept.name.trim()) {
      toast.error("Branch/Department name is required");
      return;
    }
    try {
      setAddingDept(true);
      await tpoSettingsAPI.addDepartment(newDept);
      toast.success(`Branch "${newDept.name}" added successfully!`);
      setNewDept({name: "", code: "", type: "Engineering"});
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add department");
    } finally {
      setAddingDept(false);
    }
  };

  const handleRemoveDept = async (deptId, name) => {
    if (!window.confirm(`Are you sure you want to deactivate branch "${name}"?`)) return;
    try {
      await tpoSettingsAPI.removeDepartment(deptId);
      toast.success(`Branch "${name}" deactivated.`);
      fetchSettings();
    } catch (err) {
      toast.error("Failed to deactivate branch.");
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!newBatch.name.trim()) {
      toast.error("Batch name is required");
      return;
    }
    try {
      setAddingBatch(true);
      await tpoSettingsAPI.addBatch(newBatch);
      toast.success(`Batch "${newBatch.name}" added successfully!`);
      setNewBatch({
        name: "",
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 4,
      });
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add batch");
    } finally {
      setAddingBatch(false);
    }
  };

  const handleRemoveBatch = async (batchId, name) => {
    if (!window.confirm(`Are you sure you want to deactivate batch "${name}"?`)) return;
    try {
      await tpoSettingsAPI.removeBatch(batchId);
      toast.success(`Batch "${name}" deactivated.`);
      fetchSettings();
    } catch (err) {
      toast.error("Failed to deactivate batch.");
    }
  };

  const handleInviteTpo = async (e) => {
    e.preventDefault();
    if (!newTpo.name.trim() || !newTpo.email.trim()) {
      toast.error("Name and email are required for TPO user.");
      return;
    }

    try {
      setInvitingTpo(true);
      const res = await tpoAuthAPI.inviteTpo(newTpo);
      toast.success(res.data.message || "TPO account created!");
      setNewTpo({name: "", email: "", designation: ""});
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add TPO.");
    } finally {
      setInvitingTpo(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Institution & TPO Settings
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure departments, academic batches, authorized staff, and AI
          scoring weights.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Card 1: Institution Profile */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Institution Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={instForm.name}
                onChange={(e) =>
                  setInstForm({...instForm, name: e.target.value})
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                Short Name / Code
              </label>
              <input
                type="text"
                value={instForm.shortName}
                onChange={(e) =>
                  setInstForm({...instForm, shortName: e.target.value})
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={instForm.website}
                onChange={(e) =>
                  setInstForm({...instForm, website: e.target.value})
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                Student Email Domain (for auto-linking)
              </label>
              <input
                type="text"
                placeholder="college.edu"
                value={instForm.emailDomain}
                onChange={(e) =>
                  setInstForm({...instForm, emailDomain: e.target.value})
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: AI Readiness Formula Weights */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              AI Readiness Formula Weights (%)
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Must sum to 100%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                Resume Quality
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={instForm.settings.readinessWeights.resume}
                onChange={(e) =>
                  setInstForm({
                    ...instForm,
                    settings: {
                      ...instForm.settings,
                      readinessWeights: {
                        ...instForm.settings.readinessWeights,
                        resume: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                Mock Interview
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={instForm.settings.readinessWeights.interview}
                onChange={(e) =>
                  setInstForm({
                    ...instForm,
                    settings: {
                      ...instForm.settings,
                      readinessWeights: {
                        ...instForm.settings.readinessWeights,
                        interview: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                Technical Skills
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={instForm.settings.readinessWeights.technical}
                onChange={(e) =>
                  setInstForm({
                    ...instForm,
                    settings: {
                      ...instForm.settings,
                      readinessWeights: {
                        ...instForm.settings.readinessWeights,
                        technical: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                Platform Activity
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={instForm.settings.readinessWeights.engagement}
                onChange={(e) =>
                  setInstForm({
                    ...instForm,
                    settings: {
                      ...instForm.settings,
                      readinessWeights: {
                        ...instForm.settings.readinessWeights,
                        engagement: Number(e.target.value),
                      },
                    },
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <TPO3DButton type="submit" variant="primary" size="md" disabled={saving}>
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </TPO3DButton>
        </div>
      </form>

      {/* Card: Academic Branches & Departments Management */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              Academic Branches & Departments ({departments.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure all college streams, programs, and branches (e.g. CSE, Mechanical, MBA, MCA).
            </p>
          </div>
        </div>

        {/* Existing Departments Table / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((d) => (
            <div
              key={d._id}
              className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex items-center justify-between hover:border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white">{d.name}</h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {d.code || "DEPT"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Type: <span className="text-zinc-500 dark:text-zinc-400 font-medium">{d.type || "Engineering"}</span>
                </p>
              </div>

              <TPO3DButton
                type="button"
                variant="danger"
                size="icon"
                onClick={() => handleRemoveDept(d._id, d.name)}
                title="Deactivate Branch"
              >
                <Trash2 className="w-4 h-4" />
              </TPO3DButton>
            </div>
          ))}

          {departments.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No departments configured yet. Add your college's branches below.
            </div>
          )}
        </div>

        {/* Add Branch Form */}
        <form onSubmit={handleAddDept} className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3">
          <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Add New Academic Branch / Program
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Branch Name (e.g. Computer Science & Engineering)"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Code (e.g. CSE)"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={newDept.type}
                onChange={(e) => setNewDept({ ...newDept, type: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Engineering">Engineering (B.Tech/BE)</option>
                <option value="Post-Graduate Engineering">PG (M.Tech/ME)</option>
                <option value="Management">Management (MBA/BBA)</option>
                <option value="Computer Applications">Applications (MCA/BCA)</option>
                <option value="Sciences">Sciences (B.Sc/M.Sc)</option>
                <option value="Medical/Pharmacy">Medical & Pharmacy</option>
                <option value="Commerce">Commerce & Finance</option>
                <option value="Arts/Humanities">Arts & Humanities</option>
                <option value="Other">Other Stream</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <TPO3DButton
                type="submit"
                variant="primary"
                size="icon"
                className="w-full"
                disabled={addingDept}
                title="Add Branch"
              >
                {addingDept ? "..." : <Plus className="w-4 h-4" />}
              </TPO3DButton>
            </div>
          </div>
        </form>
      </div>

      {/* Card: Academic Batches Management */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Academic Batches & Graduation Years ({batches.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage graduation years and graduating batches (e.g. 2021-2025, 2022-2026).
            </p>
          </div>
        </div>

        {/* Existing Batches List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {batches.map((b) => (
            <div
              key={b._id}
              className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex items-center justify-between hover:border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">{b.name}</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {b.startYear} - {b.endYear}
                </p>
              </div>

              <TPO3DButton
                type="button"
                variant="danger"
                size="icon"
                onClick={() => handleRemoveBatch(b._id, b.name)}
                title="Deactivate Batch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </TPO3DButton>
            </div>
          ))}

          {batches.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No batches configured yet.
            </div>
          )}
        </div>

        {/* Add Batch Form */}
        <form onSubmit={handleAddBatch} className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3">
          <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Add New Academic Batch
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Batch Name (e.g. 2024-2028)"
              value={newBatch.name}
              onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="Start Year (e.g. 2024)"
              value={newBatch.startYear}
              onChange={(e) => setNewBatch({ ...newBatch, startYear: Number(e.target.value) })}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="End Year (e.g. 2028)"
              value={newBatch.endYear}
              onChange={(e) => setNewBatch({ ...newBatch, endYear: Number(e.target.value) })}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <TPO3DButton type="submit" variant="primary" size="sm" disabled={addingBatch}>
              <Plus className="w-3.5 h-3.5" />
              <span>{addingBatch ? "Adding..." : "Add Batch"}</span>
            </TPO3DButton>
          </div>
        </form>
      </div>

      {/* Card 3: Authorized TPO Officers */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4" />
          Authorized Institutional Placement Officers (TPO)
        </h3>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
          {tpoUsers.map((tpo) => (
            <div
              key={tpo._id}
              className="py-3 flex items-center justify-between text-xs sm:text-sm"
            >
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white">{tpo.name}</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {tpo.email} • {tpo.tpoProfile?.designation || "TPO"}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                {tpo.tpoProfile?.isPrimary ? "Primary Admin" : "Officer"}
              </span>
            </div>
          ))}
        </div>

        {/* Add Secondary TPO Form */}
        <form
          onSubmit={handleInviteTpo}
          className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3"
        >
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Authorize New Placement Officer
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Full Name"
              value={newTpo.name}
              onChange={(e) => setNewTpo({...newTpo, name: e.target.value})}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="email"
              placeholder="Officer Email"
              value={newTpo.email}
              onChange={(e) => setNewTpo({...newTpo, email: e.target.value})}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Designation (optional)"
              value={newTpo.designation}
              onChange={(e) =>
                setNewTpo({...newTpo, designation: e.target.value})
              }
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <TPO3DButton type="submit" variant="surface" size="sm" disabled={invitingTpo}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>{invitingTpo ? "Creating..." : "Add TPO Officer"}</span>
          </TPO3DButton>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  HelpCircle,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Award,
  Briefcase,
  X,
  FileQuestion,
  Tag,
  Sliders,
  Check,
} from "lucide-react";
import {
  getAllAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  toggleAdminQuestionStatus,
  deleteAdminQuestion,
} from "@/api/admin.api";
import { ConfirmationModal } from "@/components/common";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: Layers },
  { id: "hr", label: "HR & Introduction", icon: HelpCircle, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "behavioral", label: "Behavioral (STAR)", icon: Award, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { id: "project", label: "Project & Tech", icon: Sparkles, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "application", label: "Role & Fit", icon: Briefcase, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
];

const AdminQuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, hr: 0, behavioral: 0, project: 0, application: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    question: "",
    category: "hr",
    difficulty: "medium",
    tags: "",
    hint: "",
    recommendedLength: "standard",
    recommendedTone: "conversational",
    isActive: true,
  });

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllAdminQuestions({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res.data?.success) {
        setQuestions(res.data.questions || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Fetch questions error:", err);
      toast.error(err.response?.data?.error || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchTerm]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleOpenAdd = () => {
    setFormData({
      question: "",
      category: selectedCategory !== "all" ? selectedCategory : "hr",
      difficulty: "medium",
      tags: "",
      hint: "",
      recommendedLength: "standard",
      recommendedTone: "conversational",
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (q) => {
    setSelectedQuestion(q);
    setFormData({
      question: q.question,
      category: q.category,
      difficulty: q.difficulty || "medium",
      tags: Array.isArray(q.tags) ? q.tags.join(", ") : "",
      hint: q.hint || "",
      recommendedLength: q.recommendedLength || "standard",
      recommendedTone: q.recommendedTone || "conversational",
      isActive: q.isActive !== false,
    });
    setShowEditModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e?.preventDefault();
    if (!formData.question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    try {
      setSubmitting(true);
      if (showEditModal && selectedQuestion) {
        await updateAdminQuestion(selectedQuestion._id, formData);
        toast.success("Question updated successfully");
        setShowEditModal(false);
      } else {
        await createAdminQuestion(formData);
        toast.success("Question added to master bank ⭐");
        setShowAddModal(false);
      }
      fetchQuestions();
    } catch (err) {
      console.error("Save question error:", err);
      toast.error(err.response?.data?.error || "Failed to save question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      await toggleAdminQuestionStatus(q._id);
      setQuestions((prev) =>
        prev.map((item) => (item._id === q._id ? { ...item, isActive: !item.isActive } : item))
      );
      toast.success(`Question marked as ${!q.isActive ? "Active" : "Inactive"}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmQuestion) return;
    try {
      await deleteAdminQuestion(deleteConfirmQuestion._id);
      toast.success("Question removed from master bank");
      setDeleteConfirmQuestion(null);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete question");
    }
  };

  const getCategoryBadge = (cat) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
          found?.color || "text-gray-400 bg-gray-500/10 border-gray-500/20"
        }`}
      >
        {found?.label?.split(" ")[0] || cat}
      </span>
    );
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case "easy":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Easy</span>;
      case "hard":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Hard</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Medium</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
              <FileQuestion className="w-6 h-6" />
            </div>
            Question Bank Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage global interview questions. Answers are uniquely AI-generated for each user based on their own Career Profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchQuestions}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Master Question
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Questions</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total || questions.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
          <span className="text-xs font-medium text-emerald-500">Active Questions</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">{stats.active || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
          <span className="text-xs font-medium text-blue-400">HR Questions</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats.hr || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
          <span className="text-xs font-medium text-purple-400">Behavioral (STAR)</span>
          <p className="text-2xl font-black text-purple-400 mt-1">{stats.behavioral || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
          <span className="text-xs font-medium text-amber-400">Project & Tech</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.project || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10">
          <span className="text-xs font-medium text-emerald-400">Role & Fit</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.application || 0}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions, tags, hints..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-purple-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
                    : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-300 dark:hover:border-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions List / Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading master questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center px-4">
            <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No questions found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              No questions matched your filter criteria. Add a new master question or clear filters.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-white/5">
            {questions.map((q) => (
              <div
                key={q._id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(q.category)}
                    {getDifficultyBadge(q.difficulty)}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        q.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {q.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {q.isActive ? "Active in User App" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                    {q.question}
                  </h3>

                  {q.hint && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/40 p-2.5 rounded-lg border border-gray-200/50 dark:border-white/5">
                      💡 <span className="font-semibold text-gray-600 dark:text-gray-300">Hint:</span> {q.hint}
                    </p>
                  )}

                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Tag className="w-3 h-3 text-gray-400 mr-1" />
                      {q.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => handleToggleStatus(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      q.isActive
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {q.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmQuestion(q)}
                    className="p-2 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {showEditModal ? "Edit Master Question" : "Add New Master Question"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. Tell me about a time you resolved a major technical challenge."
                  required
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="hr">HR & Introduction</option>
                    <option value="behavioral">Behavioral (STAR)</option>
                    <option value="project">Project & Architecture</option>
                    <option value="application">Role & Fit</option>
                    <option value="job-specific">Job-Specific</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. leadership, problem-solving, star-method"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Interviewer Hint / Guidance Tip
                </label>
                <input
                  type="text"
                  value={formData.hint}
                  onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                  placeholder="e.g. Structure with Situation, Task, Action, Result."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-white/20 dark:bg-black"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Publish to all users immediately in their Career Q&A Bank
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {showEditModal ? "Save Changes" : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmQuestion && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Master Question?"
          message={`Are you sure you want to delete "${deleteConfirmQuestion.question}"? Existing user answers will remain in their private history, but this question won't be shown to new candidates.`}
          confirmText="Delete Question"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmQuestion(null)}
        />
      )}
    </div>
  );
};

export default AdminQuestionManagement;

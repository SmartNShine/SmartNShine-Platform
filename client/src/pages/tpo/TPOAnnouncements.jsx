import {useState, useEffect} from "react";
import {tpoAnnouncementsAPI} from "@/api/tpo.api";
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  Users,
  AlertTriangle,
  X,
  Trash2,
  Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import TPO3DButton from "@/components/tpo/TPO3DButton";

export default function TPOAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "general",
    priority: "medium",
    isPinned: false,
  });
  const [publishing, setPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await tpoAnnouncementsAPI.list();
      setAnnouncements(res.data.data?.announcements || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    try {
      setPublishing(true);
      await tpoAnnouncementsAPI.create(form);
      toast.success("Announcement broadcasted successfully!");
      setModalOpen(false);
      setForm({
        title: "",
        content: "",
        type: "general",
        priority: "medium",
        isPinned: false,
      });
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to broadcast announcement.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePin = async (id) => {
    try {
      await tpoAnnouncementsAPI.pin(id);
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to update announcement.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await tpoAnnouncementsAPI.delete(id);
      toast.success("Announcement removed.");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            Institutional Announcements
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Broadcast placement schedules, drive alerts, and preparation
            milestones to students.
          </p>
        </div>

        <TPO3DButton
          type="button"
          variant="primary"
          size="md"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </TPO3DButton>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 dark:text-zinc-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No active announcements
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Keep your student cohorts informed about mock interview deadlines,
              resume workshops, and institutional career guidance.
            </p>
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item._id}
              className={`bg-white dark:bg-zinc-950 border rounded-2xl p-6 transition-all duration-200 ${
                item.isPinned
                  ? "border-amber-500/40 bg-white dark:bg-zinc-950 shadow-lg shadow-amber-500/5"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Pin className="w-2.5 h-2.5" />
                        Pinned Notice
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
                      {item.type}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Posted {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <TPO3DButton
                    type="button"
                    variant={item.isPinned ? "surface" : "ghost"}
                    size="icon"
                    onClick={() => handlePin(item._id)}
                    title={item.isPinned ? "Unpin notice" : "Pin notice"}
                    className={item.isPinned ? "!text-amber-600 dark:!text-amber-400" : ""}
                  >
                    <Pin className="w-4 h-4" />
                  </TPO3DButton>
                  <TPO3DButton
                    type="button"
                    variant="danger"
                    size="icon"
                    onClick={() => handleDelete(item._id)}
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </TPO3DButton>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                Publish Announcement
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
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Technical Mock Interview Schedule"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="general">General Update</option>
                  <option value="assignment">Assignment Alert</option>
                  <option value="assessment">Upcoming Assessment</option>
                  <option value="urgent">Urgent Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Announcement Body *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide complete guidance, dates, and instructions for students..."
                  value={form.content}
                  onChange={(e) => setForm({...form, content: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={form.isPinned}
                  onChange={(e) =>
                    setForm({...form, isPinned: e.target.checked})
                  }
                  className="rounded bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-indigo-600 focus:ring-0"
                />
                <label
                  htmlFor="pinCheck"
                  className="text-xs text-zinc-600 dark:text-zinc-300 font-medium"
                >
                  Pin this announcement to top of student portal
                </label>
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
                  disabled={publishing}
                >
                  {publishing ? "Broadcasting..." : "Broadcast Notice"}
                </TPO3DButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

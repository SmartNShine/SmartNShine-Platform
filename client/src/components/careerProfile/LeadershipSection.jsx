import { Sparkles, Plus, Trash2 } from "lucide-react";

export default function LeadershipSection({ profile, setProfile, onOpenAIModal }) {
  const addLeadership = () => {
    const updated = profile.leadership || [];
    setProfile({
      ...profile,
      leadership: [
        ...updated,
        {
          organization: "",
          position: "",
          startDate: "",
          endDate: "",
          description: "",
          achievements: [],
        },
      ],
    });
  };

  const removeLeadership = (idx) => {
    const updated = profile.leadership.filter((_, i) => i !== idx);
    setProfile({ ...profile, leadership: updated });
  };

  const updateLeadership = (idx, field, val) => {
    const copy = [...(profile.leadership || [])];
    copy[idx][field] = val;
    setProfile({ ...profile, leadership: copy });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Leadership & Responsibility
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Club leads, community organizing, student body, and engineering mentoring.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAIModal("leadership")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Structure</span>
          </button>
          <button
            onClick={addLeadership}
            className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(profile.leadership || []).map((lead, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-zinc-900/40 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Position #{idx + 1}
              </span>
              <button
                onClick={() => removeLeadership(idx)}
                className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Delete position"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Organization *
                </label>
                <input
                  type="text"
                  value={lead.organization || ""}
                  onChange={(e) => updateLeadership(idx, "organization", e.target.value)}
                  placeholder="e.g. Google Developer Student Clubs"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Position Title *
                </label>
                <input
                  type="text"
                  value={lead.position || ""}
                  onChange={(e) => updateLeadership(idx, "position", e.target.value)}
                  placeholder="e.g. Technical Lead & Organizer"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Initiatives & Key Contributions
                </label>
                <textarea
                  rows={2}
                  value={lead.description || ""}
                  onChange={(e) => updateLeadership(idx, "description", e.target.value)}
                  placeholder="Led weekly tech bootcamps, organized hackathons with 500+ participants..."
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>
        ))}

        {(!profile.leadership || profile.leadership.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
            No leadership records added yet.
          </div>
        )}
      </div>
    </div>
  );
}

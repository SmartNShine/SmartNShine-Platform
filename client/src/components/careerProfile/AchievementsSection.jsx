import { Sparkles, Plus, Trash2 } from "lucide-react";

export default function AchievementsSection({ profile, setProfile, onOpenAIModal }) {
  const addAchievement = () => {
    const updated = profile.achievements || [];
    setProfile({
      ...profile,
      achievements: [
        ...updated,
        {
          title: "",
          description: "",
          organization: "",
          date: "",
          category: "Hackathon",
          evidenceUrl: "",
        },
      ],
    });
  };

  const removeAchievement = (idx) => {
    const updated = profile.achievements.filter((_, i) => i !== idx);
    setProfile({ ...profile, achievements: updated });
  };

  const updateAchievement = (idx, field, val) => {
    const copy = [...(profile.achievements || [])];
    copy[idx][field] = val;
    setProfile({ ...profile, achievements: copy });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Honors & Achievements
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Hackathon wins, competitions, awards, and industry rankings.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAIModal("achievements")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Structure</span>
          </button>
          <button
            onClick={addAchievement}
            className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Achievement</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(profile.achievements || []).map((ach, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-zinc-900/40 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Achievement #{idx + 1}
              </span>
              <button
                onClick={() => removeAchievement(idx)}
                className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Delete achievement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={ach.title || ""}
                  onChange={(e) => updateAchievement(idx, "title", e.target.value)}
                  placeholder="e.g. Winner - Smart India Hackathon"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Organization / Host
                </label>
                <input
                  type="text"
                  value={ach.organization || ""}
                  onChange={(e) => updateAchievement(idx, "organization", e.target.value)}
                  placeholder="e.g. Ministry of Education"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Description & Key Impact
                </label>
                <textarea
                  rows={2}
                  value={ach.description || ""}
                  onChange={(e) => updateAchievement(idx, "description", e.target.value)}
                  placeholder="Brief description of the accomplishment and outcome..."
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>
        ))}

        {(!profile.achievements || profile.achievements.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
            No achievements added yet.
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Sparkles, Plus, Trash2, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function ExperienceSection({ profile, setProfile, onOpenAIModal }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, label, key) => {
    if (!text) {
      toast.error(`No ${label} to copy`);
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const addExperience = () => {
    const updated = profile.experience || [];
    setProfile({
      ...profile,
      experience: [
        ...updated,
        {
          company: "",
          position: "",
          employmentType: "Full-time",
          location: "",
          startDate: "",
          endDate: "",
          currentlyWorking: false,
          description: "",
          responsibilities: [],
          achievements: [],
          technologies: [],
        },
      ],
    });
  };

  const removeExperience = (idx) => {
    const updated = profile.experience.filter((_, i) => i !== idx);
    setProfile({ ...profile, experience: updated });
  };

  const updateExperience = (idx, field, val) => {
    const copy = [...(profile.experience || [])];
    copy[idx][field] = val;
    setProfile({ ...profile, experience: copy });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Work Experience</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
              1-Click Copy Ready
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Full-time, internships, contract roles. Click [Copy Bullets] to paste directly into job portal experience fields.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAIModal("experience")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Structure</span>
          </button>
          <button
            onClick={addExperience}
            className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Role</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(profile.experience || []).map((exp, idx) => {
          const bulletsText = (exp.responsibilities || []).join("\n");
          const fullRoleText = `${exp.position || "Role"} at ${exp.company || "Company"} (${exp.startDate || ""} - ${exp.endDate || "Present"})\n\n${bulletsText}`;

          return (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-zinc-900/40 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Experience #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bulletsText, `${exp.company || "Role"} Bullets`, `bullets-${idx}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-500/20 text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer"
                  >
                    {copiedKey === `bullets-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                        <span>Copied Bullets!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Bullets</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(fullRoleText, `${exp.company || "Role"} Full Summary`, `full-${idx}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/5 text-[10px] font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    {copiedKey === `full-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                        <span>Copied Full Role!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Full Role</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => removeExperience(idx)}
                  className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Delete experience"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={exp.company || ""}
                    onChange={(e) => updateExperience(idx, "company", e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Position / Title *
                  </label>
                  <input
                    type="text"
                    value={exp.position || ""}
                    onChange={(e) => updateExperience(idx, "position", e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Employment Type
                  </label>
                  <select
                    value={exp.employmentType || "Full-time"}
                    onChange={(e) => updateExperience(idx, "employmentType", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={exp.startDate || ""}
                    onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                    placeholder="e.g. May 2023"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={exp.endDate || ""}
                    onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                    placeholder="e.g. Present"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Location
                  </label>
                  <input
                    type="text"
                    value={exp.location || ""}
                    onChange={(e) => updateExperience(idx, "location", e.target.value)}
                    placeholder="e.g. Mountain View, CA"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Responsibilities & Impact (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={(exp.responsibilities || []).join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n").filter((l) => l.trim());
                    updateExperience(idx, "responsibilities", lines);
                  }}
                  placeholder="• Engineered high-throughput backend services reducing p99 latency by 35%&#10;• Collaborated with product design to deploy real-time analytics..."
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          );
        })}

        {(!profile.experience || profile.experience.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
            No experience records added yet.
          </div>
        )}
      </div>
    </div>
  );
}

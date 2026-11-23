import { useState } from "react";
import { Sparkles, Plus, Trash2, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function SkillsSection({
  profile,
  setProfile,
  skillCategories,
  newSkillName,
  setNewSkillName,
  newSkillCategory,
  setNewSkillCategory,
  onAddSkill,
  onRemoveSkill,
  onOpenAIModal,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const skills = profile.skills || [];

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

  const allSkillsList = skills.map((s) => s.name).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08] gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Categorized Skills Bank</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
              {skills.length} Total
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Add technical skills, frameworks, and tools. Copy all skills as a comma-separated list into job applications with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(allSkillsList, "All Skills (Comma-Separated)", "all-skills")}
            disabled={skills.length === 0}
            className={`text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
              copiedKey === "all-skills"
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            }`}
            title="Copy all skills as comma-separated string for job applications"
          >
            {copiedKey === "all-skills" ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All Skills List</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenAIModal("skills")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Categorize</span>
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="p-5 rounded-3xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-white/[0.08] space-y-3 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
          Quick Add New Skill
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Skill Name (e.g. React, Docker, Python)"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddSkill()}
            className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white shadow-xs"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white shadow-xs"
          >
            {skillCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            onClick={onAddSkill}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* Display Skills by Category */}
      <div className="space-y-5">
        {skillCategories.map((cat) => {
          const categorySkills = (profile.skills || []).filter((s) => s.category === cat);
          if (categorySkills.length === 0) return null;
          const categoryString = categorySkills.map((s) => s.name).join(", ");

          return (
            <div key={cat} className="space-y-2.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/40 border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                    {cat}
                  </span>
                  <span className="text-[10px] bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded-full font-bold">
                    {categorySkills.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(categoryString, `${cat} Skills`, `cat-${cat}`)}
                  className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `cat-${cat}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy {cat}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {categorySkills.map((s, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-white/[0.08] rounded-xl text-xs shadow-xs hover:border-blue-400 dark:hover:border-blue-500/40 transition-all"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{s.name}</span>
                    {s.proficiency && (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                        {s.proficiency}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(s.name, s.name, `skill-single-${s.name}`)}
                      className="text-gray-400 hover:text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                      title="Copy skill"
                    >
                      {copiedKey === `skill-single-${s.name}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSkill(s.name)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer ml-0.5"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

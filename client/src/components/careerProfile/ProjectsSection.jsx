import { useState } from "react";
import { Sparkles, Plus, Trash2, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function ProjectsSection({ profile, setProfile, onOpenAIModal }) {
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

  const addProject = () => {
    const updated = profile.projects || [];
    setProfile({
      ...profile,
      projects: [
        ...updated,
        {
          name: "",
          shortDescription: "",
          detailedDescription: "",
          problemSolved: "",
          solution: "",
          role: "",
          teamSize: "",
          status: "Completed",
          technologies: [],
          features: [],
          challenges: [],
          results: [],
          metrics: [],
          achievements: [],
          githubUrl: "",
          liveUrl: "",
          demoUrl: "",
        },
      ],
    });
  };

  const removeProject = (idx) => {
    const updated = profile.projects.filter((_, i) => i !== idx);
    setProfile({ ...profile, projects: updated });
  };

  const updateProject = (idx, field, val) => {
    const copy = [...(profile.projects || [])];
    copy[idx][field] = val;
    setProfile({ ...profile, projects: copy });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Featured Projects</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
              1-Click Copy Ready
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Architecture, tech stack, and links. Click [Copy] to paste project summaries into application textboxes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAIModal("projects")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Structure</span>
          </button>
          <button
            onClick={addProject}
            className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(profile.projects || []).map((proj, idx) => {
          const techList = (proj.technologies || []).join(", ");
          const metricsList = (proj.metrics || []).join("\n");
          const fullProjectSummary = `${proj.name || "Project"}\nOverview: ${proj.shortDescription || ""}\nProblem Solved: ${proj.problemSolved || ""}\nSolution: ${proj.solution || ""}\nTech Stack: ${techList}\nMetrics:\n${metricsList}`;

          return (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-zinc-900/40 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Project #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(fullProjectSummary, `${proj.name || "Project"} Summary`, `proj-summary-${idx}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-500/20 text-[10px] font-bold hover:bg-blue-100 transition-all cursor-pointer"
                  >
                    {copiedKey === `proj-summary-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                        <span>Copied Summary!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(techList, `${proj.name || "Project"} Tech Stack`, `proj-tech-${idx}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/5 text-[10px] font-bold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    {copiedKey === `proj-tech-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                        <span>Copied Stack!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Stack</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => removeProject(idx)}
                  className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={proj.name || ""}
                    onChange={(e) => updateProject(idx, "name", e.target.value)}
                    placeholder="e.g. KnockNFix Marketplace"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Role
                  </label>
                  <input
                    type="text"
                    value={proj.role || ""}
                    onChange={(e) => updateProject(idx, "role", e.target.value)}
                    placeholder="e.g. Lead Full-Stack Architect"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={techList}
                    onChange={(e) => {
                      const techs = e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      updateProject(idx, "technologies", techs);
                    }}
                    placeholder="React, Node.js, MongoDB, Redis"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Short Overview
                  </label>
                  <input
                    type="text"
                    value={proj.shortDescription || ""}
                    onChange={(e) => updateProject(idx, "shortDescription", e.target.value)}
                    placeholder="High-level summary of what the application solves..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                      Problem Solved
                    </label>
                    <textarea
                      rows={2}
                      value={proj.problemSolved || ""}
                      onChange={(e) => updateProject(idx, "problemSolved", e.target.value)}
                      placeholder="What specific user friction or system limitation did this address?"
                      className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                      Solution & Architecture
                    </label>
                    <textarea
                      rows={2}
                      value={proj.solution || ""}
                      onChange={(e) => updateProject(idx, "solution", e.target.value)}
                      placeholder="How did you architect the system and solve core challenges?"
                      className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Measurable Results & Metrics (1 per line)
                  </label>
                  <textarea
                    rows={2}
                    value={metricsList}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n").filter((l) => l.trim());
                      updateProject(idx, "metrics", lines);
                    }}
                    placeholder="• 99.9% uptime with 50K monthly users&#10;• Reduced load times by 45%"
                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={proj.githubUrl || ""}
                    onChange={(e) => updateProject(idx, "githubUrl", e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Live URL
                  </label>
                  <input
                    type="url"
                    value={proj.liveUrl || ""}
                    onChange={(e) => updateProject(idx, "liveUrl", e.target.value)}
                    placeholder="https://project.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Demo URL
                  </label>
                  <input
                    type="url"
                    value={proj.demoUrl || ""}
                    onChange={(e) => updateProject(idx, "demoUrl", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {(!profile.projects || profile.projects.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
            No projects added yet.
          </div>
        )}
      </div>
    </div>
  );
}

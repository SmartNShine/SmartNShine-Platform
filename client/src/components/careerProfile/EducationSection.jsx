import { Sparkles, Plus, Trash2 } from "lucide-react";

export default function EducationSection({ profile, setProfile, onOpenAIModal }) {
  const addEducation = () => {
    const updated = profile.education || [];
    setProfile({
      ...profile,
      education: [
        ...updated,
        {
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          gpa: "",
          percentage: "",
          relevantCoursework: [],
          description: "",
        },
      ],
    });
  };

  const removeEducation = (idx) => {
    const updated = profile.education.filter((_, i) => i !== idx);
    setProfile({ ...profile, education: updated });
  };

  const updateEducation = (idx, field, val) => {
    const copy = [...(profile.education || [])];
    copy[idx][field] = val;
    setProfile({ ...profile, education: copy });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Education & Academics
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Degrees, institutions, GPA, coursework, and academic credentials.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAIModal("education")}
            className="text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste & Structure</span>
          </button>
          <button
            onClick={addEducation}
            className="text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(profile.education || []).map((edu, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-zinc-900/40 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Education #{idx + 1}
              </span>
              <button
                onClick={() => removeEducation(idx)}
                className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Delete education"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Institution *
                </label>
                <input
                  type="text"
                  value={edu.institution || ""}
                  onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Degree *
                </label>
                <input
                  type="text"
                  value={edu.degree || ""}
                  onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                  placeholder="e.g. Bachelor of Science"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={edu.fieldOfStudy || ""}
                  onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  GPA / Percentage
                </label>
                <input
                  type="text"
                  value={edu.gpa || edu.percentage || ""}
                  onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                  placeholder="e.g. 3.9 / 4.0"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  Start Date
                </label>
                <input
                  type="text"
                  value={edu.startDate || ""}
                  onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                  placeholder="e.g. Aug 2021"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                  End Date
                </label>
                <input
                  type="text"
                  value={edu.endDate || ""}
                  onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                  placeholder="e.g. May 2025"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {(!profile.education || profile.education.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
            No education records added yet.
          </div>
        )}
      </div>
    </div>
  );
}

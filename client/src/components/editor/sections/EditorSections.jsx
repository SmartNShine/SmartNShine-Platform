import {useState, useEffect} from "react";
import {useToggle} from "@/hooks";
import EditableSection from "./EditableSection";
import {ScoreCard} from "@/components/common/cards";
import {RecommendationsPanel} from "@/components/editor/panels";
import {resumeAPI} from "@/api/api";
import {LimitedTextarea} from "@/components/common/LimitedInputs";
import {
  AlertTriangle,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Calendar,
  ArrowUp,
  ArrowDown,
  Layers,
  BookOpen,
} from "lucide-react";
import {handleDateChange, isValidDate, getDateValidationMessage} from "@/utils/dateValidation";
import AIBulletRewritePill from "./AIBulletRewritePill";
import ResumeQRCodeSection from "./PersonalInfoSection";


export const PersonalInfoSection = ({
  resumeData,
  updateField,
  updateContact,
}) => (
  <div className="space-y-2">
    <input
      type="text"
      value={resumeData.name || ""}
      onChange={(e) => updateField("name", e.target.value)}
      placeholder="Full Name"
      className="input-field font-semibold text-sm sm:text-base"
      autoComplete="name"
    />
    <div className="grid grid-cols-2 gap-2">
      <input
        type="email"
        value={resumeData.contact?.email || ""}
        onChange={(e) => updateContact("email", e.target.value)}
        placeholder="Email"
        className="input-field"
        autoComplete="email"
      />
      <input
        type="tel"
        value={resumeData.contact?.phone || ""}
        onChange={(e) => {
          const value = e.target.value;
          if (/^[0-9\s\-()+ ]*$/.test(value)) {
            updateContact("phone", value);
          }
        }}
        placeholder="Phone (e.g., +1 234-567-8900)"
        className="input-field"
        autoComplete="tel"
        maxLength="20"
      />
    </div>
    <input
      type="text"
      value={resumeData.contact?.location || ""}
      onChange={(e) => updateContact("location", e.target.value)}
      placeholder="Location"
      className="input-field"
      autoComplete="off"
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input
        type="url"
        value={resumeData.contact?.linkedin || ""}
        onChange={(e) => updateContact("linkedin", e.target.value)}
        placeholder="LinkedIn URL"
        className="input-field"
        autoComplete="url"
      />
      <input
        type="url"
        value={resumeData.contact?.github || ""}
        onChange={(e) => updateContact("github", e.target.value)}
        placeholder="GitHub URL"
        className="input-field"
        autoComplete="url"
      />
      <input
        type="url"
        value={resumeData.contact?.portfolio || ""}
        onChange={(e) => updateContact("portfolio", e.target.value)}
        placeholder="Portfolio / Website URL"
        className="input-field"
        autoComplete="url"
      />
    </div>
    <ResumeQRCodeSection resumeData={resumeData} updateField={updateField} />
  </div>
);

export const SkillsSection = ({ resumeData, updateField }) => {
  const [skillsInput, setSkillsInput] = useState("");
  const [isLoading, toggleLoading, setIsLoadingTrue, setIsLoadingFalse] =
    useToggle(false);
  const [error, setError] = useState("");
  const [newSkillInputs, setNewSkillInputs] = useState({});

  // Extract all skills string from resumeData.skills
  const getSkillsString = (skills) => {
    if (!Array.isArray(skills)) return "";
    return skills
      .flatMap((group) => {
        if (typeof group === "string") return [group];
        return Array.isArray(group?.items) ? group.items : [];
      })
      .filter(Boolean)
      .join(", ");
  };

  // Sync skillsInput when resumeData.skills changes
  useEffect(() => {
    if (resumeData?.skills && Array.isArray(resumeData.skills)) {
      const allSkills = getSkillsString(resumeData.skills);
      setSkillsInput(allSkills);
    }
  }, [resumeData?.skills]);

  const handleSkillsInputChange = (e) => {
    const value = e.target.value;
    setSkillsInput(value);
    if (error) setError("");
  };

  // Parse raw text into array of clean skill strings
  const parseSkillsText = (text) => {
    if (!text || typeof text !== "string") return [];
    return text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // Apply raw skills input directly to resumeData
  const handleApplyRawSkills = (inputText = skillsInput) => {
    const parsed = parseSkillsText(inputText);
    if (parsed.length === 0) {
      updateField("skills", []);
      return;
    }

    const currentSkills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
    if (currentSkills.length <= 1) {
      const categoryName = currentSkills[0]?.category?.trim() || "Technical Skills";
      updateField("skills", [{ category: categoryName, items: parsed }]);
    } else {
      const firstCat = currentSkills[0]?.category || "Technical Skills";
      updateField("skills", [{ category: firstCat, items: parsed }]);
    }
    if (error) setError("");
  };

  // Auto-sync on blur if user typed skills and resumeData.skills is empty
  const handleInputBlur = () => {
    if (skillsInput.trim()) {
      const parsed = parseSkillsText(skillsInput);
      const currentSkills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
      const currentCount = currentSkills.flatMap((g) => (Array.isArray(g.items) ? g.items : [])).length;
      if (currentCount === 0 && parsed.length > 0) {
        handleApplyRawSkills(skillsInput);
      }
    }
  };

  const handleCategorize = async () => {
    if (!skillsInput.trim()) {
      setError("Please enter some skills first");
      return;
    }

    setIsLoadingTrue();
    setError("");

    try {
      const response = await resumeAPI.categorizeSkills(
        skillsInput,
        resumeData?._id
      );

      if (response.data && response.data.skills) {
        const categorized = Array.isArray(response.data.skills)
          ? response.data.skills
          : [];
        const cleanCategorized = categorized.map((g) => ({
          category: g.category || "Technical Skills",
          items: Array.isArray(g.items)
            ? g.items
            : typeof g.items === "string"
              ? g.items.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
        }));
        updateField("skills", cleanCategorized);
        setError("");
      } else {
        setError("Failed to categorize skills");
      }
    } catch (err) {
      console.error("Categorization error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to categorize skills. Please try again."
      );
    } finally {
      setIsLoadingFalse();
    }
  };

  // Handle manual edit of categorized skills
  const updateSkillCategoryName = (index, newCategory) => {
    const updatedSkills = [...(resumeData?.skills || [])];
    updatedSkills[index] = {
      ...(updatedSkills[index] || {}),
      category: newCategory,
      items: Array.isArray(updatedSkills[index]?.items)
        ? updatedSkills[index].items
        : [],
    };
    updateField("skills", updatedSkills);
  };

  const updateSkillCategoryItems = (index, itemsValue) => {
    const updatedSkills = [...(resumeData?.skills || [])];
    const itemsArray =
      typeof itemsValue === "string"
        ? itemsValue
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(itemsValue)
          ? itemsValue
          : [];
    updatedSkills[index] = {
      ...(updatedSkills[index] || {}),
      category: updatedSkills[index]?.category || "Technical Skills",
      items: itemsArray,
    };
    updateField("skills", updatedSkills);
  };

  const addSkillToCategory = (index) => {
    const skillToAdd = (newSkillInputs[index] || "").trim();
    if (!skillToAdd) return;

    const updatedSkills = [...(resumeData?.skills || [])];
    const currentItems = Array.isArray(updatedSkills[index]?.items)
      ? updatedSkills[index].items
      : [];

    if (!currentItems.some((s) => s.toLowerCase() === skillToAdd.toLowerCase())) {
      updatedSkills[index] = {
        ...updatedSkills[index],
        category: updatedSkills[index]?.category || "Technical Skills",
        items: [...currentItems, skillToAdd],
      };
      updateField("skills", updatedSkills);
    }

    setNewSkillInputs((prev) => ({ ...prev, [index]: "" }));
  };

  const removeSkillFromCategory = (categoryIndex, skillIndex) => {
    const updatedSkills = [...(resumeData?.skills || [])];
    const currentItems = Array.isArray(updatedSkills[categoryIndex]?.items)
      ? updatedSkills[categoryIndex].items
      : [];
    const newItems = currentItems.filter((_, i) => i !== skillIndex);
    updatedSkills[categoryIndex] = {
      ...updatedSkills[categoryIndex],
      items: newItems,
    };
    updateField("skills", updatedSkills);
  };

  const addCategory = () => {
    const updatedSkills = [...(resumeData?.skills || [])];
    updatedSkills.push({
      category: "Technical Skills",
      items: [],
    });
    updateField("skills", updatedSkills);
  };

  const removeSkillCategory = (index) => {
    const updatedSkills = (resumeData?.skills || []).filter(
      (_, i) => i !== index
    );
    updateField("skills", updatedSkills);
  };

  const totalSkillCount = (resumeData?.skills || []).reduce(
    (acc, g) => acc + (Array.isArray(g?.items) ? g.items.length : 0),
    0
  );

  return (
    <>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="section-title mb-0">Skills</h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            AI-Powered &amp; Instant Save
          </div>
        </div>

        <div className="space-y-4">
          {/* Single input box for all skills */}
          <div className="p-3.5 bg-gray-50 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Enter all your skills (comma-separated or line-separated)
            </label>
            <textarea
              value={skillsInput}
              onChange={handleSkillsInputChange}
              onBlur={handleInputBlur}
              placeholder="e.g., JavaScript, React, Node.js, Python, Docker, AWS, MongoDB, Git, Problem Solving, Team Leadership"
              className="input-field min-h-[100px] resize-y bg-white dark:bg-zinc-950 text-sm"
              rows={4}
              autoComplete="off"
              spellCheck="false"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                List skills and click &quot;Apply Skills&quot; or &quot;Categorize with AI&quot;
              </p>
              {skillsInput && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {skillsInput.split(/[,\n]/).filter((s) => s.trim()).length}{" "}
                  skills detected
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleApplyRawSkills(skillsInput)}
                disabled={!skillsInput.trim()}
                className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all border inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  !skillsInput.trim()
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-zinc-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Apply Skills
              </button>

              <button
                type="button"
                onClick={handleCategorize}
                disabled={isLoading || !skillsInput.trim()}
                className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all border inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  isLoading || !skillsInput.trim()
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-zinc-700 cursor-not-allowed"
                    : "bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200 shadow-xs"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Categorizing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Categorize Skills with AI
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={addCategory}
                className="py-2 px-3.5 rounded-lg text-xs font-semibold transition-all border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 inline-flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Display categorized skills */}
          {resumeData?.skills && resumeData.skills.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Categorized Skills ({resumeData.skills.length} categories, {totalSkillCount} skills)</span>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 lowercase font-normal"
                >
                  <Plus className="w-3 h-3" />
                  add another category
                </button>
              </div>

              {resumeData.skills.map((skillGroup, index) => {
                const itemsList = Array.isArray(skillGroup.items)
                  ? skillGroup.items
                  : typeof skillGroup.items === "string"
                    ? skillGroup.items.split(",").map((s) => s.trim()).filter(Boolean)
                    : [];

                return (
                  <div
                    key={index}
                    className="p-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-xs space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={skillGroup.category || ""}
                        onChange={(e) =>
                          updateSkillCategoryName(index, e.target.value)
                        }
                        placeholder="Category Name (e.g., Languages, Frameworks, Cloud)"
                        className="input-field flex-1 font-semibold text-sm py-1.5"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => removeSkillCategory(index)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                        title="Remove category"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Skill chips */}
                    {itemsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {itemsList.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeSkillFromCategory(index, sIdx)}
                              className="text-blue-400 hover:text-red-600 dark:hover:text-red-400 ml-0.5"
                              title={`Remove ${skill}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inline Quick Add for this category */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSkillInputs[index] || ""}
                        onChange={(e) =>
                          setNewSkillInputs((prev) => ({
                            ...prev,
                            [index]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkillToCategory(index);
                          }
                        }}
                        placeholder="Add a skill and press Enter (or comma-separated)..."
                        className="input-field flex-1 text-xs py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = (newSkillInputs[index] || "").trim();
                          if (val.includes(",")) {
                            const newSkills = val
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const merged = [
                              ...itemsList,
                              ...newSkills.filter(
                                (s) => !itemsList.some((ex) => ex.toLowerCase() === s.toLowerCase())
                              ),
                            ];
                            updateSkillCategoryItems(index, merged);
                            setNewSkillInputs((prev) => ({ ...prev, [index]: "" }));
                          } else {
                            addSkillToCategory(index);
                          }
                        }}
                        disabled={!(newSkillInputs[index] || "").trim()}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const ExperienceSection = ({
  resumeData,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
  moveItem,
  updateField,
}) => (
  <>
    <div className="flex justify-between items-center mb-4">
      <h2 className="section-title mb-0">Experience</h2>
      <button
        onClick={() =>
          addArrayItem("experience", {
            company: "",
            title: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            bullets: [""],
          })
        }
        className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
      >
        + Add Experience
      </button>
    </div>
    {resumeData.experience?.map((exp, index) => (
      <EditableSection
        key={index}
        title={`${exp.title || "Position"} at ${exp.company || "Company"}`}
        content={exp}
        onUpdate={(value) =>
          updateArrayItem("experience", index, "bullets", value)
        }
        onRemove={() => removeArrayItem("experience", index)}
        onMoveUp={
          index > 0 ? () => moveItem("experience", index, index - 1) : null
        }
        onMoveDown={
          index < resumeData.experience.length - 1
            ? () => moveItem("experience", index, index + 1)
            : null
        }
        sectionType="experience"
        resumeData={resumeData}
        experienceData={exp}
        onUpdateExperience={(field, value) =>
          updateArrayItem("experience", index, field, value)
        }
      />
    ))}
  </>
);

export const EducationSection = ({
  resumeData,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
  moveItem,
}) => (
  <>
    <div className="flex justify-between items-center mb-4">
      <h2 className="section-title mb-0">Education</h2>
      <button
        onClick={() =>
          addArrayItem("education", {
            institution: "",
            degree: "",
            field: "",
            location: "",
            startDate: "",
            endDate: "",
            gpa: "",
            bullets: [],
          })
        }
        className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
      >
        + Add Education
      </button>
    </div>
    {resumeData.education?.map((edu, index) => (
      <div key={index} className="mb-4 p-4 border border-gray-200 rounded">
        <div className="flex justify-between mb-3">
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={() => moveItem("education", index, index - 1)}
                className="text-gray-400 hover:text-gray-600"
              >
                ↑
              </button>
            )}
            {index < resumeData.education.length - 1 && (
              <button
                onClick={() => moveItem("education", index, index + 1)}
                className="text-gray-400 hover:text-gray-600"
              >
                ↓
              </button>
            )}
          </div>
          <button
            onClick={() => removeArrayItem("education", index)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={edu.institution}
            onChange={(e) =>
              updateArrayItem("education", index, "institution", e.target.value)
            }
            placeholder="Institution"
            className="input-field"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={edu.degree}
              onChange={(e) =>
                updateArrayItem("education", index, "degree", e.target.value)
              }
              placeholder="Degree (e.g. B.Tech, B.S.)"
              className="input-field"
            />
            <input
              type="text"
              value={edu.field}
              onChange={(e) =>
                updateArrayItem("education", index, "field", e.target.value)
              }
              placeholder="Field of Study / Major / Minor"
              className="input-field"
              title="Enter field of study, major, or minor (e.g. Computer Science or Major in CS, Minor in Cybersecurity)"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="text"
                value={edu.startDate}
                onChange={(e) =>
                  handleDateChange(
                    e.target.value,
                    edu.startDate,
                    (value) => updateArrayItem("education", index, "startDate", value)
                  )
                }
                placeholder="Start (e.g. Aug 2023)"
                className={`input-field ${!isValidDate(edu.startDate) && edu.startDate ? 'border-red-500' : ''}`}
                title="Format: Mon YYYY (e.g., Aug 2023) or MM/YYYY (e.g., 08/2023)"
                maxLength="25"
              />
              {!isValidDate(edu.startDate) && edu.startDate && (
                <p className="text-xs text-red-500 mt-1">
                  {getDateValidationMessage(edu.startDate)}
                </p>
              )}
            </div>
            <div>
              <input
                type="text"
                value={edu.endDate}
                onChange={(e) =>
                  handleDateChange(
                    e.target.value,
                    edu.endDate,
                    (value) => updateArrayItem("education", index, "endDate", value)
                  )
                }
                placeholder="End (e.g. May 2027)"
                className={`input-field ${!isValidDate(edu.endDate) && edu.endDate ? 'border-red-500' : ''}`}
                title="Format: Mon YYYY (e.g., May 2027), MM/YYYY, or Present"
                maxLength="25"
              />
              {!isValidDate(edu.endDate) && edu.endDate && (
                <p className="text-xs text-red-500 mt-1">
                  {getDateValidationMessage(edu.endDate)}
                </p>
              )}
            </div>
            <input
              type="text"
              value={edu.gpa || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value) && value.length <= 4) {
                  updateArrayItem("education", index, "gpa", value);
                }
              }}
              placeholder="GPA (e.g., 3.8)"
              className="input-field"
              maxLength="4"
              title="Enter GPA (e.g., 3.8 or 3.85)"
            />
          </div>
        </div>
      </div>
    ))}
  </>
);

export const ProjectsSection = ({
  resumeData,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
  moveItem,
}) => (
  <>
    <div className="flex justify-between items-center mb-4">
      <h2 className="section-title mb-0">Projects</h2>
      <button
        onClick={() =>
          addArrayItem("projects", {
            name: "",
            description: "",
            technologies: [],
            link: "",
            liveUrl: "",
            github: "",
            githubUrl: "",
            bullets: [""],
          })
        }
        className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
      >
        + Add Project
      </button>
    </div>
    {resumeData.projects?.map((project, index) => (
      <EditableSection
        key={index}
        title={project.name || `Project ${index + 1}`}
        content={project}
        onUpdate={(value) =>
          updateArrayItem("projects", index, "bullets", value)
        }
        onRemove={() => removeArrayItem("projects", index)}
        onMoveUp={
          index > 0 ? () => moveItem("projects", index, index - 1) : null
        }
        onMoveDown={
          index < resumeData.projects.length - 1
            ? () => moveItem("projects", index, index + 1)
            : null
        }
        sectionType="projects"
        resumeData={resumeData}
        projectData={project}
        onUpdateProject={(field, value) =>
          updateArrayItem("projects", index, field, value)
        }
      />
    ))}
  </>
);

export const CertificationsSection = ({
  resumeData,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
}) => (
  <>
    <div className="flex justify-between items-center mb-4">
      <h2 className="section-title mb-0">Certifications</h2>
      <button
        onClick={() =>
          addArrayItem("certifications", {
            name: "",
            issuer: "",
            date: "",
            credentialId: "",
            link: "",
          })
        }
        className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
      >
        + Add Certification
      </button>
    </div>
    {resumeData.certifications?.map((cert, index) => (
      <div key={index} className="mb-4 p-4 border border-gray-200 rounded">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => removeArrayItem("certifications", index)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={cert.name || ""}
            onChange={(e) =>
              updateArrayItem("certifications", index, "name", e.target.value)
            }
            placeholder="Certification Name"
            className="input-field"
            autoComplete="off"
          />
          <input
            type="text"
            value={cert.issuer || ""}
            onChange={(e) =>
              updateArrayItem("certifications", index, "issuer", e.target.value)
            }
            placeholder="Issuing Organization"
            className="input-field"
            autoComplete="off"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                value={cert.date || ""}
                onChange={(e) =>
                  handleDateChange(
                    e.target.value,
                    cert.date || "",
                    (value) => updateArrayItem("certifications", index, "date", value)
                  )
                }
                placeholder="Date (e.g. Mar 2023 or 03/2023)"
                className={`input-field ${!isValidDate(cert.date) && cert.date ? 'border-red-500' : ''}`}
                autoComplete="off"
                title="Format: Mon YYYY (e.g., Mar 2023) or MM/YYYY (e.g., 03/2023)"
                maxLength="25"
              />
              {!isValidDate(cert.date) && cert.date && (
                <p className="text-xs text-red-500 mt-1">
                  {getDateValidationMessage(cert.date)}
                </p>
              )}
            </div>
            <input
              type="text"
              value={cert.credentialId || ""}
              onChange={(e) =>
                updateArrayItem(
                  "certifications",
                  index,
                  "credentialId",
                  e.target.value
                )
              }
              placeholder="Credential ID"
              className="input-field"
              autoComplete="off"
            />
          </div>
          <input
            type="url"
            value={cert.link || ""}
            onChange={(e) =>
              updateArrayItem("certifications", index, "link", e.target.value)
            }
            placeholder="Credential URL"
            className="input-field"
            autoComplete="off"
          />
        </div>
      </div>
    ))}
  </>
);

export const AchievementsSection = ({resumeData, updateField}) => {
  const achievements = Array.isArray(resumeData?.achievements)
    ? resumeData.achievements
    : [];
  const [achievementsInput, setAchievementsInput] = useState("");
  const [isLoading, toggleLoading, setIsLoadingTrue, setIsLoadingFalse] =
    useToggle(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize input from existing data when achievements are loaded
  useEffect(() => {
    if (achievements && achievements.length > 0 && !initialized) {
      const textLines = achievements
        .map((a) =>
          typeof a === "string"
            ? a
            : typeof a === "object" && a !== null
            ? Object.values(a).flat().join("\n")
            : String(a || "")
        )
        .filter(Boolean);
      setAchievementsInput(textLines.join("\n"));
      setInitialized(true);
    }
  }, [achievements, initialized]);

  // Handle AI segregation / formatting
  const handleSegregate = async () => {
    if (!achievementsInput.trim()) {
      setError("Please enter some achievements first");
      return;
    }

    setIsLoadingTrue();
    setError("");

    try {
      const response = await resumeAPI.segregateAchievements(
        achievementsInput,
        resumeData._id
      );

      const raw = response.data?.achievements || response.data?.data;
      let formattedList = [];

      if (Array.isArray(raw)) {
        raw.forEach((item) => {
          if (typeof item === "string" && item.trim()) {
            formattedList.push(item.trim());
          } else if (typeof item === "object" && item !== null) {
            Object.values(item).forEach((v) => {
              if (Array.isArray(v)) {
                v.forEach(
                  (s) =>
                    typeof s === "string" && s.trim() && formattedList.push(s.trim())
                );
              } else if (typeof v === "string" && v.trim()) {
                formattedList.push(v.trim());
              }
            });
          }
        });
      } else if (typeof raw === "object" && raw !== null) {
        if (Array.isArray(raw.achievements)) {
          raw.achievements.forEach(
            (s) =>
              typeof s === "string" && s.trim() && formattedList.push(s.trim())
          );
        } else {
          Object.values(raw).forEach((v) => {
            if (Array.isArray(v)) {
              v.forEach(
                (s) =>
                  typeof s === "string" && s.trim() && formattedList.push(s.trim())
              );
            } else if (typeof v === "string" && v.trim()) {
              formattedList.push(v.trim());
            }
          });
        }
      }

      formattedList = formattedList.filter(Boolean);

      if (formattedList.length > 0) {
        updateField("achievements", formattedList);
        setAchievementsInput("");
        setError("");
      } else {
        setError("Failed to extract achievements. Please check your text and try again.");
      }
    } catch (err) {
      console.error("Segregation error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to format achievements. Please try again."
      );
    } finally {
      setIsLoadingFalse();
    }
  };

  const updateAchievement = (index, value) => {
    const updated = [...achievements];
    updated[index] = value;
    updateField("achievements", updated);
  };

  const removeAchievement = (index) => {
    const updated = achievements.filter((_, i) => i !== index);
    updateField("achievements", updated);
  };

  const addAchievement = () => {
    updateField("achievements", [...achievements, ""]);
  };

  // Manual save - split by newlines and add to achievements
  const handleManualSave = () => {
    if (!achievementsInput.trim()) {
      setError("Please enter some achievements first");
      return;
    }

    // Split by newlines and filter out empty lines
    const newAchievements = achievementsInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (newAchievements.length > 0) {
      updateField("achievements", [...achievements, ...newAchievements]);
      setAchievementsInput("");
      setError("");
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="section-title mb-0">Achievements</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            AI-Powered Formatting
          </div>
        </div>

        <div className="space-y-3">
          {/* Input textarea for bulk achievements */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Enter your achievements (paragraph or mixed format)
            </label>
            <textarea
              value={achievementsInput}
              onChange={(e) => setAchievementsInput(e.target.value)}
              placeholder="e.g., Won first place in national coding competition with 500+ participants. Led a team of 10 developers to successfully complete a major project 2 weeks ahead of schedule. Published 3 research papers in top-tier AI conferences."
              className="input-field min-h-[120px] resize-y"
              rows={5}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Tip: Write naturally and AI will format them into professional
              bullet points
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Manual Save button */}
            <button
              onClick={handleManualSave}
              disabled={!achievementsInput.trim()}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border flex items-center justify-center gap-2 ${
                !achievementsInput.trim()
                  ? "bg-gray-200 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-500 cursor-not-allowed"
                  : "bg-white dark:bg-zinc-900 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              <Plus className="w-4 h-4" />
              Add to List
            </button>

            {/* AI Segregate button */}
            <button
              onClick={handleSegregate}
              disabled={isLoading || !achievementsInput.trim()}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                isLoading || !achievementsInput.trim()
                  ? "bg-gray-200 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-500 cursor-not-allowed"
                  : "bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200 shadow-sm hover:shadow"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Formatting with AI...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Format with AI
                </span>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Display formatted achievements */}
          {achievements && achievements.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Trophy className="w-4 h-4" />
                  <span>Formatted Achievements</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({achievements.length} items)
                  </span>
                </div>
                <button
                  onClick={addAchievement}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add More
                </button>
              </div>

              {achievements.map((achievement, index) => (
                <div key={index} className="group relative flex gap-2 items-center">
                  <input
                    type="text"
                    value={achievement || ""}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                    placeholder="Enter achievement"
                    className="input-field flex-1 pr-28"
                    autoComplete="off"
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center">
                    <AIBulletRewritePill
                      text={achievement}
                      onApply={(newText) => updateAchievement(index, newText)}
                      sectionType="achievements"
                      context={{ role: resumeData?.title }}
                      resumeData={resumeData}
                      size="xs"
                    />
                  </div>
                  <button
                    onClick={() => removeAchievement(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 w-9 h-9 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                    title="Remove achievement"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const CustomSectionsManager = ({resumeData, updateField}) => {
  const customSections = resumeData.customSections || [];

  const addCustomSection = (suggestedTitle = "") => {
    updateField("customSections", [
      ...customSections,
      {
        id: Date.now().toString(),
        title: typeof suggestedTitle === "string" ? suggestedTitle : "",
        items: [],
      },
    ]);
  };

  const updateCustomSection = (index, field, value) => {
    const updated = [...customSections];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    console.log(`📝 [EDITOR] Custom section updated [${field}]:`, updated[index]);
    updateField("customSections", updated);
  };

  const removeCustomSection = (index) => {
    const updated = customSections.filter((_, i) => i !== index);
    updateField("customSections", updated);
  };

  const moveCustomSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= customSections.length) return;
    const updated = [...customSections];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updateField("customSections", updated);
  };

  const suggestions = [
    "Publications & Research",
    "Volunteer Experience",
    "Certifications & Licenses",
    "Honors & Awards",
    "Leadership & Activities",
    "Patents",
    "Speaking Engagements",
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="section-title mb-0">Custom Sections</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add publications, research papers, volunteer work, awards, or custom entries
          </p>
        </div>
        <button
          onClick={() => addCustomSection()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {customSections.length === 0 ? (
        <div className="text-center py-8 px-4 bg-gray-50 dark:bg-black rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-800">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
            No custom sections yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            Add sections for Research Papers, Publications, Volunteer Experience, Awards, or Licenses.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {suggestions.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => addCustomSection(title)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {customSections.map((section, index) => (
            <CustomSectionItem
              key={section.id || `section-${index}`}
              section={section}
              index={index}
              onUpdate={updateCustomSection}
              onRemove={removeCustomSection}
              onMoveUp={index > 0 ? () => moveCustomSection(index, index - 1) : null}
              onMoveDown={index < customSections.length - 1 ? () => moveCustomSection(index, index + 1) : null}
              resumeData={resumeData}
            />
          ))}
        </div>
      )}
    </>
  );
};

const normalizeCustomItem = (rawItem, idx = 0) => {
  if (typeof rawItem === "string") {
    return {
      id: `item-${Date.now()}-${idx}`,
      title: rawItem,
      subtitle: "",
      date: "",
      link: "",
      description: "",
      bullets: [],
    };
  }
  return {
    id: rawItem?.id || `item-${Date.now()}-${idx}`,
    title: rawItem?.title || rawItem?.name || "",
    subtitle: rawItem?.subtitle || rawItem?.organization || rawItem?.issuer || rawItem?.publisher || "",
    date: rawItem?.date || "",
    link: rawItem?.link || rawItem?.url || "",
    description: rawItem?.description || "",
    bullets: Array.isArray(rawItem?.bullets)
      ? rawItem.bullets
      : rawItem?.bullets
      ? [String(rawItem.bullets)]
      : [],
  };
};

const CustomSectionItem = ({
  section,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  resumeData,
}) => {
  const [contentInput, setContentInput] = useState("");
  const [isLoading, toggleLoading, setIsLoadingTrue, setIsLoadingFalse] =
    useToggle(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAiAssist, setShowAiAssist] = useState(false);

  // Normalize all items to structured format
  const rawItems = Array.isArray(section.items) ? section.items : [];
  const items = rawItems.map((item, i) => normalizeCustomItem(item, i));

  const saveItems = (updatedItems) => {
    onUpdate(index, "items", updatedItems);
  };

  // Handle AI processing
  const handleProcess = async () => {
    if (!contentInput.trim()) {
      setError("Please enter some content to format");
      return;
    }

    if (!section.title.trim()) {
      setError("Please enter a section title first (e.g., Research Papers)");
      return;
    }

    setIsLoadingTrue();
    setError("");
    setSuccessMessage("");

    try {
      const resumeId = resumeData?._id || resumeData?.id;
      const response = await resumeAPI.processCustomSection(
        contentInput,
        section.title,
        resumeId
      );

      const rawContent = response.data?.items || response.data?.content;
      let newParsedItems = [];

      if (Array.isArray(rawContent)) {
        newParsedItems = rawContent.map((it, i) => normalizeCustomItem(it, Date.now() + i));
      } else if (rawContent && typeof rawContent === "object") {
        newParsedItems = [normalizeCustomItem(rawContent, Date.now())];
      } else if (typeof rawContent === "string") {
        newParsedItems = rawContent
          .split("\n")
          .filter(Boolean)
          .map((line, i) => ({
            id: `item-${Date.now()}-${i}`,
            title: line.replace(/^[•\-\*]\s*/, ""),
            subtitle: "",
            date: "",
            link: "",
            description: "",
            bullets: [],
          }));
      }

      if (newParsedItems.length > 0) {
        saveItems([...items, ...newParsedItems]);
        setContentInput("");
        setError("");
        setSuccessMessage(`Added ${newParsedItems.length} structured entries!`);
        setShowAiAssist(false);
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError("Failed to extract structured entries. Try rephrasing or add manually.");
      }
    } catch (err) {
      console.error("Processing error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to process content with AI. Please try again or add manually."
      );
    } finally {
      setIsLoadingFalse();
    }
  };

  // Manual Item Management (Without AI)
  const addManualItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      title: "",
      subtitle: "",
      date: "",
      link: "",
      description: "",
      bullets: [""],
    };
    saveItems([...items, newItem]);
  };

  const updateItemField = (itemIndex, field, value) => {
    const updated = [...items];
    updated[itemIndex] = {
      ...updated[itemIndex],
      [field]: value,
    };
    saveItems(updated);
  };

  const removeItem = (itemIndex) => {
    const updated = items.filter((_, i) => i !== itemIndex);
    saveItems(updated);
  };

  const moveItem = (itemIndex, direction) => {
    const targetIndex = itemIndex + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(itemIndex, 1);
    updated.splice(targetIndex, 0, moved);
    saveItems(updated);
  };

  const addBullet = (itemIndex) => {
    const updated = [...items];
    const item = updated[itemIndex];
    updated[itemIndex] = {
      ...item,
      bullets: [...(item.bullets || []), ""],
    };
    saveItems(updated);
  };

  const updateBullet = (itemIndex, bulletIndex, value) => {
    const updated = [...items];
    const item = updated[itemIndex];
    const updatedBullets = [...(item.bullets || [])];
    updatedBullets[bulletIndex] = value;
    updated[itemIndex] = {
      ...item,
      bullets: updatedBullets,
    };
    saveItems(updated);
  };

  const removeBullet = (itemIndex, bulletIndex) => {
    const updated = [...items];
    const item = updated[itemIndex];
    updated[itemIndex] = {
      ...item,
      bullets: (item.bullets || []).filter((_, bIdx) => bIdx !== bulletIndex),
    };
    saveItems(updated);
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-black shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
          title={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5 -rotate-90" />
          )}
        </button>

        <input
          type="text"
          value={section.title || ""}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          placeholder="Section Title (e.g. Research Papers, Publications, Volunteer Work)"
          className="input-field flex-1 font-semibold text-base"
        />

        {/* Section reordering */}
        {onMoveUp && (
          <button
            type="button"
            onClick={onMoveUp}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
            title="Move section up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={onMoveDown}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
            title="Move section down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Remove custom section"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addManualItem}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry (Without AI)
              </button>
              <button
                type="button"
                onClick={() => setShowAiAssist(!showAiAssist)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                  showAiAssist
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                    : "bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                {showAiAssist ? "Close AI Assistant" : "Format with AI"}
              </button>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* AI-Powered Formatting Panel */}
          {showAiAssist && (
            <div className="p-3.5 border border-purple-200 dark:border-purple-900/40 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 dark:text-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>AI Structured Extractor & Formatter</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiAssist(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Paste notes, paper citations, or rough text (e.g. DOI, journal, role, dates):
                </label>
                <textarea
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder={`e.g., Published "Deep Learning in Brain MRI" at IEEE TMI 2024. Authored with Dr. Smith. Reached 98.2% Dice score. Link: https://doi.org/10.1109/...\nAlso presented "Vision Transformers" at CVPR 2023 workshop.`}
                  className="input-field min-h-[90px] resize-y text-xs"
                  rows={3}
                />
                <p className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  <Lightbulb className="w-3 h-3 text-purple-500 inline shrink-0" />
                  <span>
                    AI will automatically extract Title, Publisher/Organization, Date, Links, and bullet points.
                  </span>
                </p>
              </div>

              {error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleProcess}
                disabled={isLoading || !contentInput.trim() || !section.title?.trim()}
                className={`w-full py-2 px-3 rounded-lg font-medium text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading || !contentInput.trim() || !section.title?.trim()
                    ? "bg-gray-200 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting & Structuring with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract & Format Entries</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Structured Entries List */}
          {items.length === 0 ? (
            <div className="text-center py-6 px-4 border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                No entries added to &ldquo;{section.title || "Custom Section"}&rdquo; yet.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={addManualItem}
                  className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md font-medium hover:bg-blue-100 transition-colors"
                >
                  + Add First Entry Manually
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiAssist(true)}
                  className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-md font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Format with AI
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, itemIdx) => (
                <div
                  key={item.id || `custom-entry-${itemIdx}`}
                  className="p-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50/50 dark:bg-zinc-900/50 space-y-2.5 transition-all"
                >
                  {/* Item Header / Controls */}
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200/60 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {item.title || `Entry #${itemIdx + 1}`}
                    </span>
                    <div className="flex items-center gap-1">
                      {itemIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveItem(itemIdx, -1)}
                          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {itemIdx < items.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveItem(itemIdx, 1)}
                          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(itemIdx)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Remove entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Fields: Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Title / Role / Paper / Award *
                      </label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) => updateItemField(itemIdx, "title", e.target.value)}
                        placeholder="e.g. Graph Neural Networks for Drug Discovery"
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Publisher / Journal / Organization
                      </label>
                      <input
                        type="text"
                        value={item.subtitle || ""}
                        onChange={(e) => updateItemField(itemIdx, "subtitle", e.target.value)}
                        placeholder="e.g. Nature Machine Intelligence / IEEE / Red Cross"
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Secondary Fields: Date & Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Date / Period
                      </label>
                      <input
                        type="text"
                        value={item.date || ""}
                        onChange={(e) =>
                          handleDateChange(
                            e.target.value,
                            item.date,
                            (val) => updateItemField(itemIdx, "date", val)
                          )
                        }
                        placeholder="e.g. May 2024 or 2022 - 2024"
                        className={`input-field text-xs ${
                          !isValidDate(item.date) && item.date ? "border-red-500" : ""
                        }`}
                      />
                      {!isValidDate(item.date) && item.date && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {getDateValidationMessage(item.date)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Link / URL / DOI (Optional)
                      </label>
                      <input
                        type="text"
                        value={item.link || ""}
                        onChange={(e) => updateItemField(itemIdx, "link", e.target.value)}
                        placeholder="e.g. https://doi.org/10.1038/... or paper URL"
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Description / Summary Field */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Overview / Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) => updateItemField(itemIdx, "description", e.target.value)}
                      placeholder="Brief 1-sentence abstract or description"
                      className="input-field text-xs"
                    />
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                        Bullet Points (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => addBullet(itemIdx)}
                        className="text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Bullet
                      </button>
                    </div>

                    {(item.bullets || []).map((bullet, bulletIdx) => (
                      <div
                        key={`bullet-${bulletIdx}`}
                        className="group relative flex gap-1.5 items-center"
                      >
                        <span className="text-gray-400 text-xs shrink-0">•</span>
                        <input
                          type="text"
                          value={bullet || ""}
                          onChange={(e) => updateBullet(itemIdx, bulletIdx, e.target.value)}
                          placeholder="e.g. Achieved 98.2% accuracy on benchmark dataset..."
                          className="input-field flex-1 text-xs pr-24 py-1.5"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center">
                          <AIBulletRewritePill
                            text={bullet}
                            onApply={(newText) => updateBullet(itemIdx, bulletIdx, newText)}
                            sectionType="custom"
                            context={{
                              title: section.title,
                              itemTitle: item.title,
                              subtitle: item.subtitle,
                            }}
                            resumeData={resumeData}
                            size="xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBullet(itemIdx, bulletIdx)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs shrink-0"
                          title="Remove bullet"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

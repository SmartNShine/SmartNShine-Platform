import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import toast from "react-hot-toast";
import { resumeAPI } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { parseValidationErrors } from "@/utils/errorHandler";
import { authStorage } from "@/utils/storage";
import { useToggle } from "@/hooks";
import {
  Lightbulb,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Zap,
  AlignLeft,
  List,
} from "lucide-react";
import AIBulletRewritePill from "./AIBulletRewritePill";

const EditableSection = ({
  title,
  content,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  sectionType,
  resumeData,
  experienceData,
  onUpdateExperience,
  projectData,
  onUpdateProject,
}) => {
  const { user } = useAuth();
  const [enhancing, toggleEnhancing, setEnhancingTrue, setEnhancingFalse] =
    useToggle(false);
  const [useRichText, setUseRichText] = useState(false);
  const [techInputValue, setTechInputValue] = useState(
    Array.isArray(projectData?.technologies)
      ? projectData.technologies.join(", ")
      : projectData?.technologies || ""
  );

  // Derive bullets array for structured bullet editing
  const getBulletsList = () => {
    if (sectionType === "experience" && experienceData) {
      if (Array.isArray(experienceData.bullets)) return experienceData.bullets;
      if (typeof experienceData.bullets === "string") return [experienceData.bullets];
      return [""];
    }
    if (sectionType === "projects" && projectData) {
      if (Array.isArray(projectData.bullets)) return projectData.bullets;
      if (typeof projectData.bullets === "string") return [projectData.bullets];
      return [""];
    }
    if (Array.isArray(content)) return content;
    if (typeof content === "object" && Array.isArray(content?.bullets)) return content.bullets;
    return [];
  };

  const bullets = getBulletsList();

  // Initialize TipTap editor for rich text fallback
  const editor = useEditor({
    extensions: [StarterKit],
    content: Array.isArray(content)
      ? `<ul>${content.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`
      : typeof content === "object"
        ? `<ul>${(content.bullets || [])
            .map((bullet) => `<li>${bullet}</li>`)
            .join("")}</ul>`
        : `<p>${content || ""}</p>`,
    onUpdate: ({ editor }) => {
      if (sectionType === "summary") {
        onUpdate(editor.getText());
      } else {
        const html = editor.getHTML();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const parsedBullets = Array.from(doc.querySelectorAll("li")).map((li) =>
          li.textContent.trim()
        );
        onUpdate(parsedBullets.length > 0 ? parsedBullets : [editor.getText()]);
      }
    },
  });

  // Keep TipTap in sync if bullets or summary change from outside
  useEffect(() => {
    if (!editor) return;
    if (sectionType === "summary") {
      if (typeof content === "string" && content !== editor.getText()) {
        editor.commands.setContent(`<p>${content || ""}</p>`);
      }
    }
  }, [content, editor, sectionType]);

  // Handle individual bullet updates
  const handleUpdateBullet = (index, value) => {
    const updated = [...bullets];
    updated[index] = value;
    onUpdate(updated);
    if (editor) {
      editor.commands.setContent(
        `<ul>${updated.map((b) => `<li>${b}</li>`).join("")}</ul>`
      );
    }
  };

  const handleAddBullet = () => {
    const updated = [...bullets, ""];
    onUpdate(updated);
    if (editor) {
      editor.commands.setContent(
        `<ul>${updated.map((b) => `<li>${b}</li>`).join("")}</ul>`
      );
    }
  };

  const handleRemoveBullet = (index) => {
    const updated = bullets.filter((_, i) => i !== index);
    const finalBullets = updated.length > 0 ? updated : [""];
    onUpdate(finalBullets);
    if (editor) {
      editor.commands.setContent(
        `<ul>${finalBullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
      );
    }
  };

  const handleMoveBullet = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= bullets.length) return;
    const updated = [...bullets];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onUpdate(updated);
  };

  // Section-wide enhance
  const handleEnhance = async () => {
    setEnhancingTrue();
    try {
      if (!authStorage.hasToken()) {
        toast.error("Please log in to use AI enhancement", {
          duration: 3000,
        });
        setEnhancingFalse();
        return;
      }

      if (!resumeData?._id && user?.role !== "admin") {
        toast.error(
          "Please save your resume first before using AI enhancement",
          {
            duration: 4000,
          }
        );
        setEnhancingFalse();
        return;
      }

      let contentToEnhance;
      if (sectionType === "summary") {
        contentToEnhance = content;
      } else if (sectionType === "experience" && experienceData) {
        contentToEnhance = Array.isArray(experienceData.bullets)
          ? experienceData.bullets
          : [experienceData.bullets].filter(Boolean);
      } else if (sectionType === "projects" && projectData) {
        contentToEnhance = Array.isArray(projectData.bullets)
          ? projectData.bullets
          : [projectData.bullets].filter(Boolean);
      } else {
        contentToEnhance = content;
      }

      if (
        typeof contentToEnhance === "object" &&
        !Array.isArray(contentToEnhance)
      ) {
        contentToEnhance = JSON.stringify(contentToEnhance);
      }

      const response = await resumeAPI.enhance(
        contentToEnhance,
        sectionType,
        resumeData
      );
      const enhanced = response.data.enhanced;

      if (sectionType === "summary") {
        onUpdate(enhanced);
        editor?.commands.setContent(`<p>${enhanced}</p>`);
      } else {
        const enhancedBullets = Array.isArray(enhanced) ? enhanced : [enhanced];
        const bulletStrings = enhancedBullets.map((b) => {
          if (typeof b === "string") return b;
          if (typeof b === "object" && b !== null) return JSON.stringify(b);
          return String(b);
        });

        onUpdate(bulletStrings);
        editor?.commands.setContent(
          `<ul>${bulletStrings.map((b) => `<li>${b}</li>`).join("")}</ul>`
        );
      }

      toast.success("Section enhanced successfully!", {
        duration: 2000,
      });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Authentication required. Please log in.");
      } else {
        toast.error("Failed to enhance content: " + parseValidationErrors(err));
      }
    } finally {
      setEnhancingFalse();
    }
  };

  // Context metadata for AI rewriter
  const contextData = {
    role: experienceData?.title || resumeData?.title || "",
    company: experienceData?.company || "",
    name: projectData?.name || "",
    technologies: projectData?.technologies || [],
  };

  return (
    <div className="card p-3 sm:p-4 mb-3 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm transition-all">
      {/* Header with Title and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {title && (
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate mb-0">
              {title}
            </h3>
          )}
          {sectionType === "summary" && (
            <AIBulletRewritePill
              text={typeof content === "string" ? content : ""}
              onApply={(newText) => {
                onUpdate(newText);
                editor?.commands.setContent(`<p>${newText}</p>`);
              }}
              sectionType="summary"
              context={{ role: resumeData?.name, skills: resumeData?.skills }}
              resumeData={resumeData}
              buttonText="AI Rewrite Summary"
              alwaysVisible={true}
              size="xs"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
              title="Move Up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
              title="Move Down"
            >
              ↓
            </button>
          )}
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {enhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Polish Section
              </>
            )}
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Experience-specific fields */}
      {sectionType === "experience" && experienceData && onUpdateExperience && (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={experienceData.company || ""}
              onChange={(e) => onUpdateExperience("company", e.target.value)}
              placeholder="Company Name"
              className="input-field text-sm"
              autoComplete="off"
            />
            <input
              type="text"
              value={experienceData.title || ""}
              onChange={(e) => onUpdateExperience("title", e.target.value)}
              placeholder="Job Title"
              className="input-field text-sm"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={experienceData.location || ""}
              onChange={(e) => onUpdateExperience("location", e.target.value)}
              placeholder="Location"
              className="input-field text-xs sm:text-sm"
              autoComplete="off"
            />
            <input
              type="text"
              value={experienceData.startDate || ""}
              onChange={(e) => onUpdateExperience("startDate", e.target.value)}
              placeholder="Start Date (MM/YYYY)"
              className="input-field text-xs sm:text-sm"
              autoComplete="off"
              pattern="(0[1-9]|1[0-2])\/[0-9]{4}"
              title="Format: MM/YYYY (e.g., 01/2020)"
            />
            <input
              type="text"
              value={experienceData.endDate || ""}
              onChange={(e) => onUpdateExperience("endDate", e.target.value)}
              placeholder={
                experienceData.current ? "Present" : "End Date (MM/YYYY)"
              }
              className="input-field text-xs sm:text-sm"
              autoComplete="off"
              disabled={experienceData.current}
              pattern="(0[1-9]|1[0-2])\/[0-9]{4}"
              title="Format: MM/YYYY (e.g., 12/2023)"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={experienceData.current || false}
              onChange={(e) => onUpdateExperience("current", e.target.checked)}
              className="rounded text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Current position
            </span>
          </label>
        </div>
      )}

      {/* Project-specific fields */}
      {sectionType === "projects" && projectData && onUpdateProject && (
        <div className="space-y-2 mb-3">
          <input
            type="text"
            value={projectData.name || ""}
            onChange={(e) => onUpdateProject("name", e.target.value)}
            placeholder="Project Name"
            className="input-field font-medium text-sm"
            autoComplete="off"
          />
          <input
            type="text"
            value={techInputValue}
            onChange={(e) => setTechInputValue(e.target.value)}
            onBlur={(e) => {
              const techArray = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
              onUpdateProject("technologies", techArray);
            }}
            placeholder="Technologies (comma-separated, e.g. React, Node.js, AWS)"
            className="input-field text-xs sm:text-sm"
            autoComplete="off"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              value={projectData.link || projectData.liveUrl || ""}
              onChange={(e) => {
                onUpdateProject("link", e.target.value);
                onUpdateProject("liveUrl", e.target.value);
              }}
              placeholder="Live Demo / Website URL (optional)"
              className="input-field text-xs sm:text-sm"
              autoComplete="off"
            />
            <input
              type="url"
              value={projectData.github || projectData.githubUrl || ""}
              onChange={(e) => {
                onUpdateProject("github", e.target.value);
                onUpdateProject("githubUrl", e.target.value);
              }}
              placeholder="GitHub Repo URL (optional)"
              className="input-field text-xs sm:text-sm"
              autoComplete="off"
            />
          </div>
        </div>
      )}

      {/* Content Editor: Structured Bullets vs Rich Text */}
      {sectionType === "summary" ? (
        <div className="space-y-2">
          <div className="relative group rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/10 transition-all">
            <textarea
              value={typeof content === "string" ? content : ""}
              onChange={(e) => {
                onUpdate(e.target.value);
                editor?.commands.setContent(`<p>${e.target.value}</p>`);
              }}
              placeholder="Write a concise 3-4 sentence professional summary highlighting your core skills and career impact..."
              rows={4}
              className="w-full p-3 text-xs sm:text-sm bg-transparent border-0 resize-y focus:outline-none text-gray-900 dark:text-zinc-100"
            />
            {/* Inline Floating AI Rewrite Pill for Summary */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-auto">
              <AIBulletRewritePill
                text={typeof content === "string" ? content : ""}
                onApply={(newText) => {
                  onUpdate(newText);
                  editor?.commands.setContent(`<p>${newText}</p>`);
                }}
                sectionType="summary"
                context={{ role: resumeData?.name, skills: resumeData?.skills }}
                resumeData={resumeData}
                buttonText="AI Rewrite"
                alwaysVisible={false}
                size="xs"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header for bullets with mode switcher */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <List className="w-3.5 h-3.5 text-zinc-500" />
              Key Accomplishments & Bullets ({bullets.length})
            </span>
            <button
              type="button"
              onClick={() => setUseRichText(!useRichText)}
              className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 inline-flex items-center gap-1"
            >
              {useRichText ? <List className="w-3 h-3" /> : <AlignLeft className="w-3 h-3" />}
              {useRichText ? "Structured View" : "Rich Text View"}
            </button>
          </div>

          {!useRichText ? (
            /* Structured Bullet Points with Hover "AI Rewrite" Pill beside every bullet */
            <div className="space-y-2">
              {bullets.map((bullet, bIdx) => (
                <div
                  key={bIdx}
                  className="group relative flex items-start gap-2 p-2 rounded-xl border border-gray-200/90 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/10 transition-all duration-200"
                >
                  {/* Bullet Marker */}
                  <span className="text-zinc-500 font-extrabold text-sm select-none mt-1.5 pl-1">
                    •
                  </span>

                  {/* Bullet Text Area */}
                  <textarea
                    value={bullet}
                    onChange={(e) => handleUpdateBullet(bIdx, e.target.value)}
                    placeholder="Describe an accomplishment starting with an action verb (e.g. Spearheaded...)"
                    rows={2}
                    className="flex-1 text-xs sm:text-sm bg-transparent border-0 resize-y focus:outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 min-h-[38px] pr-28 leading-relaxed"
                  />

                  {/* Floating Action Strip: Hover AI Rewrite Pill & Controls */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                    <AIBulletRewritePill
                      text={bullet}
                      onApply={(newText) => handleUpdateBullet(bIdx, newText)}
                      sectionType={sectionType}
                      context={contextData}
                      resumeData={resumeData}
                      buttonText="AI Rewrite"
                      size="xs"
                    />

                    {/* Bullet Reordering */}
                    <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center transition-opacity">
                      {bIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveBullet(bIdx, bIdx - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded hover:bg-gray-200 dark:hover:bg-zinc-800"
                          title="Move bullet up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      )}
                      {bIdx < bullets.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveBullet(bIdx, bIdx + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded hover:bg-gray-200 dark:hover:bg-zinc-800"
                          title="Move bullet down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(bIdx)}
                        className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-0.5"
                        title="Delete bullet"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Bullet Button */}
              <button
                type="button"
                onClick={handleAddBullet}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Bullet Point
              </button>
            </div>
          ) : (
            /* Fallback TipTap Rich Editor */
            <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100">
              <div className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700 p-1.5 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    editor?.isActive("bold")
                      ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      : "hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    editor?.isActive("italic")
                      ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      : "hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    editor?.isActive("bulletList")
                      ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      : "hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  • List
                </button>
              </div>
              <EditorContent
                editor={editor}
                className="max-w-none text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 p-2 min-h-[90px]"
              />
            </div>
          )}
        </div>
      )}

      {/* Footer Helper Tip */}
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5 flex items-center gap-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          Hover over any bullet to trigger <strong>AI Rewrite</strong> for Quantified, Executive, or ATS Keyword variations.
        </span>
      </p>
    </div>
  );
};

export default EditableSection;

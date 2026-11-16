import {
  SlidersHorizontal,
  BarChart3,
  User,
  FileText,
  Lightbulb,
  Target,
  BriefcaseBusiness,
  GraduationCap,
  Rocket,
  ScrollText,
  Trophy,
  PenSquare,
} from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import ResumeLayoutControls from "../layout/ResumeLayoutControls";
import ResumeQRCodeSection from "./PersonalInfoSection";
import { ScoreCard } from "@/components/common/cards";
import JobSpecificScoreCard from "@/components/common/cards/JobSpecificScoreCard";
import EditableSection from "./EditableSection";
import { RecommendationsPanel } from "@/components/editor/panels";
import {
  SkillsSection,
  ExperienceSection,
  EducationSection,
  ProjectsSection,
  CertificationsSection,
  AchievementsSection,
  CustomSectionsManager,
} from "./EditorSections";

export default function EditorSectionRenderer({
  sectionId,
  resumeData,
  template,
  setResumeData,
  updateField,
  updateContact,
  addArrayItem,
  updateArrayItem,
  removeArrayItem,
  moveItem,
  draggedSection,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDrop,
  forceSectionExpand,
  handleApplyAiSuggestion,
  aiSuggestions,
  setAiSuggestions,
}) {
  switch (sectionId) {
    case "layout":
      return (
        <CollapsibleSection
          key="layout"
          sectionId="layout"
          title="Resume Layout"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "layout"}
          forceExpanded={forceSectionExpand}
        >
          <ResumeLayoutControls
            resumeData={resumeData}
            template={template}
            updateField={updateField}
            onChange={(layoutSettings) =>
              updateField("layoutSettings", layoutSettings)
            }
          />
        </CollapsibleSection>
      );

    case "combinedScore":
      return (
        <CollapsibleSection
          key="combinedScore"
          sectionId="combinedScore"
          title="ATS Score"
          icon={<BarChart3 className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "combinedScore"}
          forceExpanded={forceSectionExpand}
        >
          <div className="space-y-4">
            <div className="-mx-3.5 -mt-3.5">
              <ScoreCard resumeData={resumeData} expanded={false} />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800" />
            <div className="-mx-3.5 -mb-3.5">
              <JobSpecificScoreCard
                resumeData={resumeData}
                onUpdateField={updateField}
              />
            </div>
          </div>
        </CollapsibleSection>
      );

    case "personal":
      return (
        <CollapsibleSection
          key="personal"
          sectionId="personal"
          title="Personal Information"
          icon={<User className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "personal"}
          forceExpanded={forceSectionExpand}
        >
          <div className="space-y-2">
            <input
              type="text"
              value={resumeData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Full Name"
              className="input-field font-semibold text-sm sm:text-base"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                value={resumeData.contact?.email || ""}
                onChange={(e) => updateContact("email", e.target.value)}
                placeholder="Email"
                className="input-field"
              />
              <input
                type="tel"
                value={resumeData.contact?.phone || ""}
                onChange={(e) => updateContact("phone", e.target.value)}
                placeholder="Phone"
                className="input-field"
              />
            </div>
            <input
              type="text"
              value={resumeData.contact?.location || ""}
              onChange={(e) => updateContact("location", e.target.value)}
              placeholder="Location"
              className="input-field"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="url"
                value={resumeData.contact?.linkedin || ""}
                onChange={(e) => updateContact("linkedin", e.target.value)}
                placeholder="LinkedIn URL"
                className="input-field"
              />
              <input
                type="url"
                value={resumeData.contact?.github || ""}
                onChange={(e) => updateContact("github", e.target.value)}
                placeholder="GitHub URL"
                className="input-field"
              />
            </div>
            <input
              type="url"
              value={
                resumeData.contact?.portfolio ||
                resumeData.contact?.website ||
                ""
              }
              onChange={(e) => {
                const val = e.target.value;
                setResumeData((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    portfolio: val,
                    website: val,
                  },
                }));
              }}
              placeholder="Portfolio / Website URL (e.g. https://yourportfolio.com)"
              className="input-field"
            />
            <ResumeQRCodeSection resumeData={resumeData} updateField={updateField} />
          </div>
        </CollapsibleSection>
      );

    case "summary":
      return (
        <CollapsibleSection
          key="summary"
          sectionId="summary"
          title="Professional Summary"
          icon={<FileText className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "summary"}
          forceExpanded={forceSectionExpand}
        >
          <div className="-m-3.5">
            <EditableSection
              title=""
              content={resumeData.summary}
              onUpdate={(value) => updateField("summary", value)}
              sectionType="summary"
              resumeData={resumeData}
            />
          </div>
        </CollapsibleSection>
      );

    case "recommendations":
      return (
        <CollapsibleSection
          key="recommendations"
          sectionId="recommendations"
          title="Improvement Recommendations"
          icon={<Lightbulb className="w-4 h-4" />}
          defaultExpanded={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "recommendations"}
          forceExpanded={forceSectionExpand}
        >
          <div className="-m-3.5">
            <RecommendationsPanel
              resumeData={resumeData}
              onApplySuggestion={handleApplyAiSuggestion}
              aiSuggestions={aiSuggestions}
              onSuggestionsChange={setAiSuggestions}
              compact={true}
            />
          </div>
        </CollapsibleSection>
      );

    case "skills":
      return (
        <CollapsibleSection
          key="skills"
          sectionId="skills"
          title="Skills"
          icon={<Target className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "skills"}
          forceExpanded={forceSectionExpand}
        >
          <SkillsSection resumeData={resumeData} updateField={updateField} />
        </CollapsibleSection>
      );

    case "experience":
      return (
        <CollapsibleSection
          key="experience"
          sectionId="experience"
          title="Experience"
          icon={<BriefcaseBusiness className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "experience"}
          forceExpanded={forceSectionExpand}
        >
          <ExperienceSection
            resumeData={resumeData}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
            moveItem={moveItem}
            updateField={updateField}
          />
        </CollapsibleSection>
      );

    case "education":
      return (
        <CollapsibleSection
          key="education"
          sectionId="education"
          title="Education"
          icon={<GraduationCap className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "education"}
          forceExpanded={forceSectionExpand}
        >
          <EducationSection
            resumeData={resumeData}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
            moveItem={moveItem}
          />
        </CollapsibleSection>
      );

    case "projects":
      return (
        <CollapsibleSection
          key="projects"
          sectionId="projects"
          title="Projects"
          icon={<Rocket className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "projects"}
          forceExpanded={forceSectionExpand}
        >
          <ProjectsSection
            resumeData={resumeData}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
            moveItem={moveItem}
          />
        </CollapsibleSection>
      );

    case "certifications":
      return (
        <CollapsibleSection
          key="certifications"
          sectionId="certifications"
          title="Certifications"
          icon={<ScrollText className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "certifications"}
          forceExpanded={forceSectionExpand}
        >
          <CertificationsSection
            resumeData={resumeData}
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
          />
        </CollapsibleSection>
      );

    case "achievements":
      return (
        <CollapsibleSection
          key="achievements"
          sectionId="achievements"
          title="Achievements"
          icon={<Trophy className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "achievements"}
          forceExpanded={forceSectionExpand}
        >
          <AchievementsSection
            resumeData={resumeData}
            updateField={updateField}
          />
        </CollapsibleSection>
      );

    case "customSections":
      return (
        <CollapsibleSection
          key="customSections"
          sectionId="customSections"
          title="Custom Sections"
          icon={<PenSquare className="w-4 h-4" />}
          defaultExpanded={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedSection === "customSections"}
          forceExpanded={forceSectionExpand}
        >
          <CustomSectionsManager
            resumeData={resumeData}
            updateField={updateField}
          />
        </CollapsibleSection>
      );

    default:
      return null;
  }
}

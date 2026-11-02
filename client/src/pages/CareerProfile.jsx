import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import {
  User,
  GraduationCap,
  Sparkles,
  Briefcase,
  Rocket,
  Trophy,
  Award,
  Users,
  Plus,
} from "lucide-react";
import careerAPI from "@/api/career.api";
import { resumeAPI } from "@/api/api";
import { handleApiError } from "@/utils/errorHandler";
import {
  ProfileHeader,
  ProfileBanner,
  ProfileSidebar,
  PersonalInfoSection,
  SkillsSection,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  AchievementsSection,
  CertificationsSection,
  LeadershipSection,
  AdditionalInfoSection,
  AIFastImportModal,
  ResumeImportModal,
  CareerProfileExplainer,
  ApplicationCopilotDrawer,
} from "@/components/careerProfile";

const SKILL_CATEGORIES = [
  "Programming Languages",
  "Frameworks",
  "Libraries",
  "Databases",
  "Cloud",
  "DevOps",
  "Tools",
  "AI/ML",
  "Other",
];

const SECTIONS = [
  { id: "personal", label: "Personal Info", icon: User, weight: "15%" },
  { id: "education", label: "Education", icon: GraduationCap, weight: "10%" },
  { id: "skills", label: "Skills", icon: Sparkles, weight: "15%" },
  { id: "experience", label: "Experience", icon: Briefcase, weight: "20%" },
  { id: "projects", label: "Projects", icon: Rocket, weight: "20%" },
  { id: "achievements", label: "Achievements", icon: Trophy, weight: "10%" },
  { id: "certifications", label: "Certifications", icon: Award, weight: "5%" },
  { id: "leadership", label: "Leadership", icon: Users, weight: "5%" },
  { id: "additional", label: "Additional Info", icon: Plus, weight: "Bonus" },
];

export default function CareerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    personalInfo: {},
    education: [],
    skills: [],
    experience: [],
    projects: [],
    achievements: [],
    certifications: [],
    leadership: [],
    additionalInfo: {
      openSource: [],
      hackathons: [],
      publications: [],
      volunteerWork: [],
      languages: [],
      hobbies: [],
      other: [],
    },
  });

  const [completeness, setCompleteness] = useState({
    totalScore: 0,
    sections: {},
    suggestions: [],
  });

  // Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSection, setAiSection] = useState("projects");
  const [aiInputText, setAiInputText] = useState("");
  const [aiStructuring, setAiStructuring] = useState(false);
  const [aiResultPreview, setAiResultPreview] = useState(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [importSections, setImportSections] = useState({
    personal: true,
    education: true,
    skills: true,
    experience: true,
    projects: true,
    certifications: true,
    achievements: true,
  });
  const [importing, setImporting] = useState(false);

  // Skill Quick Add
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Programming Languages");
  const [newSkillProficiency, setNewSkillProficiency] = useState("Intermediate");
  const [newSkillExp, setNewSkillExp] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (aiModalOpen || importModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [aiModalOpen, importModalOpen]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await careerAPI.getProfile();
      if (res.data?.profile) {
        setProfile(res.data.profile);
      }
      if (res.data?.completeness) {
        setCompleteness(res.data.completeness);
      }
    } catch (err) {
      handleApiError(err, "Failed to load career profile", toast);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (silent = false) => {
    try {
      setSaving(true);
      const res = await careerAPI.updateProfile(profile);
      if (res.data?.profile) {
        setProfile(res.data.profile);
      }
      if (res.data?.completeness) {
        setCompleteness(res.data.completeness);
      }
      if (!silent) {
        toast.success("Career profile saved successfully!");
      }
    } catch (err) {
      handleApiError(err, "Failed to save career profile", toast);
    } finally {
      setSaving(false);
    }
  };

  // Open Resume Import
  const handleOpenImportModal = async () => {
    setImportModalOpen(true);
    try {
      const res = await resumeAPI.list();
      const list = res.data?.resumes || [];
      setUserResumes(list);
      if (list.length > 0 && !selectedResumeId) {
        setSelectedResumeId(list[0]._id);
      }
    } catch (err) {
      toast.error("Could not fetch existing resumes.");
    }
  };

  const handleExecuteImport = async () => {
    try {
      setImporting(true);
      const selected = Object.keys(importSections).filter((k) => importSections[k]);
      const res = await careerAPI.importResume(selectedResumeId, selected);
      if (res.data?.profile) {
        setProfile(res.data.profile);
      }
      if (res.data?.completeness) {
        setCompleteness(res.data.completeness);
      }
      toast.success("Resume data successfully merged into Career Profile!");
      setImportModalOpen(false);
    } catch (err) {
      handleApiError(err, "Failed to import resume data", toast);
    } finally {
      setImporting(false);
    }
  };

  // Open AI Structure Modal
  const handleOpenAIModal = (sec = activeTab) => {
    setAiSection(sec);
    setAiInputText("");
    setAiResultPreview(null);
    setAiModalOpen(true);
  };

  const handleRunAIStructure = async () => {
    if (!aiInputText.trim()) {
      toast.error("Please paste some text to structure");
      return;
    }
    try {
      setAiStructuring(true);
      const res = await careerAPI.structureWithAI(aiSection, aiInputText);
      setAiResultPreview(res.data?.structuredData);
      toast.success("Structured by AI! Review and confirm below.");
    } catch (err) {
      handleApiError(err, "AI structuring failed", toast);
    } finally {
      setAiStructuring(false);
    }
  };

  const handleApplyAIResult = () => {
    if (!aiResultPreview) return;
    const updated = { ...profile };

    if (aiSection === "personal") {
      updated.personalInfo = { ...updated.personalInfo, ...aiResultPreview };
    } else if (aiSection === "skills") {
      const current = updated.skills || [];
      const newItems = Array.isArray(aiResultPreview) ? aiResultPreview : [aiResultPreview];
      updated.skills = [...current, ...newItems];
    } else if (aiSection === "additional") {
      updated.additionalInfo = { ...updated.additionalInfo, ...aiResultPreview };
    } else {
      const current = updated[aiSection] || [];
      const newItems = Array.isArray(aiResultPreview) ? aiResultPreview : [aiResultPreview];
      updated[aiSection] = [...current, ...newItems];
    }

    setProfile(updated);
    setAiModalOpen(false);
    toast.success(`Added AI structured data to ${aiSection}!`);
  };

  // Open in Resume Builder
  const handleExportToResumeBuilder = async () => {
    try {
      const res = await careerAPI.getExportResumeFormat();
      if (res.data?.resumeData) {
        navigate("/editor", { state: { resumeData: res.data.resumeData } });
      }
    } catch (err) {
      toast.error("Failed to prepare resume format");
    }
  };

  // Add Single Skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const current = profile.skills || [];
    const exists = current.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    if (exists) {
      toast.error("Skill already exists");
      return;
    }
    const updatedSkills = [
      ...current,
      {
        name: newSkillName.trim(),
        category: newSkillCategory,
        proficiency: newSkillProficiency,
        yearsOfExperience: newSkillExp.trim(),
      },
    ];
    setProfile({ ...profile, skills: updatedSkills });
    setNewSkillName("");
    setNewSkillExp("");
  };

  const handleRemoveSkill = (skillName) => {
    const updated = (profile.skills || []).filter((s) => s.name !== skillName);
    setProfile({ ...profile, skills: updated });
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-3 border-gray-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold tracking-wide uppercase">
            Loading Career Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title="Career Profile | SmartNShine"
        description="Your unified professional master profile. Enter your career information once and reuse everywhere across resumes, ATS analysis, and interview prep."
        noindex={true}
      />

      {/* Standalone Full-Screen Top Bar */}
      <ProfileHeader
        onGoBack={handleGoBack}
        onSave={() => handleSaveProfile(false)}
        saving={saving}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 workspace-container py-8 space-y-8">
        {/* Banner Section */}
        <ProfileBanner
          completeness={completeness}
          sections={SECTIONS}
          onOpenAIModal={() => handleOpenAIModal(activeTab)}
          onOpenImportModal={handleOpenImportModal}
          onExportToResumeBuilder={handleExportToResumeBuilder}
        />

        {/* Why Master Career Profile & How to Use It Interactive Hub */}
        <CareerProfileExplainer onExportToResumeBuilder={handleExportToResumeBuilder} />

        {/* Section Navigation Tabs & Form Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Section List (4 cols) */}
          <div className="lg:col-span-4">
            <ProfileSidebar
              sections={SECTIONS}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              completeness={completeness}
            />
          </div>

          {/* Form Fields Area (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-zinc-950/90 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl">
              {activeTab === "personal" && (
                <PersonalInfoSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "skills" && (
                <SkillsSection
                  profile={profile}
                  setProfile={setProfile}
                  skillCategories={SKILL_CATEGORIES}
                  newSkillName={newSkillName}
                  setNewSkillName={setNewSkillName}
                  newSkillCategory={newSkillCategory}
                  setNewSkillCategory={setNewSkillCategory}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "education" && (
                <EducationSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "experience" && (
                <ExperienceSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "projects" && (
                <ProjectsSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "achievements" && (
                <AchievementsSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "certifications" && (
                <CertificationsSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "leadership" && (
                <LeadershipSection
                  profile={profile}
                  setProfile={setProfile}
                  onOpenAIModal={handleOpenAIModal}
                />
              )}

              {activeTab === "additional" && (
                <AdditionalInfoSection
                  profile={profile}
                  setProfile={setProfile}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AIFastImportModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        sections={SECTIONS}
        aiSection={aiSection}
        setAiSection={setAiSection}
        aiInputText={aiInputText}
        setAiInputText={setAiInputText}
        aiStructuring={aiStructuring}
        onRunAIStructure={handleRunAIStructure}
        aiResultPreview={aiResultPreview}
        onApplyAIResult={handleApplyAIResult}
      />

      <ResumeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        userResumes={userResumes}
        selectedResumeId={selectedResumeId}
        setSelectedResumeId={setSelectedResumeId}
        importSections={importSections}
        setImportSections={setImportSections}
        importing={importing}
        onExecuteImport={handleExecuteImport}
      />

      {/* Floating Job Application Copilot Quick-Dock */}
      <ApplicationCopilotDrawer profile={profile} />
    </div>
  );
}

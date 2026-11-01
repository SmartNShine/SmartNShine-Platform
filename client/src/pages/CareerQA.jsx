import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import {
  MessageSquare,
  Sparkles,
  Star,
  HelpCircle,
  Briefcase,
  Layers,
  Target,
  Flame,
} from "lucide-react";
import careerAPI from "@/api/career.api";
import { handleApiError } from "@/utils/errorHandler";
import {
  QAHeader,
  QABanner,
  QASidebar,
  QAStudio,
  JobPrepModal,
  ProjectQuestionsModal,
  AddCustomQuestionModal,
} from "@/components/careerQA";
import { ApplicationCopilotDrawer } from "@/components/careerProfile";

const CATEGORIES = [
  { id: "all", label: "All Questions", icon: Layers },
  { id: "hr", label: "HR & Culture", icon: MessageSquare },
  { id: "behavioral", label: "Behavioral (STAR)", icon: Target },
  { id: "project", label: "Project & Tech", icon: Briefcase },
  { id: "application", label: "Application & Fit", icon: HelpCircle },
  { id: "job-specific", label: "Job-Specific", icon: Flame },
  { id: "saved", label: "Saved", icon: Star },
];

const DURATION_OPTIONS = [
  { id: "short", label: "Short (30-45s)", desc: "Elevator pitch" },
  { id: "standard", label: "Standard (60-90s)", desc: "Recommended" },
  { id: "detailed", label: "Detailed (2-3m)", desc: "Comprehensive" },
];

const TONE_OPTIONS = [
  { id: "conversational", label: "Conversational", desc: "Natural & warm" },
  { id: "professional", label: "Professional", desc: "Structured & formal" },
  { id: "concise", label: "Concise", desc: "Direct & impactful" },
];

const CATEGORY_BADGE_STYLES = {
  hr: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  behavioral: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  project: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  application: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "job-specific": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function CareerQA() {
  const navigate = useNavigate();

  // State: Filter & List
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSaved, setTotalSaved] = useState(0);

  // State: Selected Question & Studio
  const [selectedItem, setSelectedItem] = useState(null);
  const [editedAnswer, setEditedAnswer] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [talkingPoints, setTalkingPoints] = useState([]);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [missingInfoTip, setMissingInfoTip] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  // State: Generation Controls
  const [answerLength, setAnswerLength] = useState("standard");
  const [answerTone, setAnswerTone] = useState("conversational");

  // State: Job Prep Modal
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobDescriptionInput, setJobDescriptionInput] = useState("");
  const [analyzingJob, setAnalyzingJob] = useState(false);
  const [jobAnalysisResult, setJobAnalysisResult] = useState(null);

  // State: Project Questions Modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [generatingProjectQ, setGeneratingProjectQ] = useState(false);
  const [projectQuestionsResult, setProjectQuestionsResult] = useState(null);

  // State: Custom Question Modal
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [customQuestionCategory, setCustomQuestionCategory] = useState("hr");

  useEffect(() => {
    loadQuestions();
    loadProfileForProjects();
  }, [activeCategory, searchQuery]);

  // Lock background scroll when any modal is active
  useEffect(() => {
    if (jobModalOpen || projectModalOpen || customModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [jobModalOpen, projectModalOpen, customModalOpen]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory === "saved") {
        params.status = "saved";
      } else if (activeCategory !== "all") {
        params.category = activeCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await careerAPI.getQAItems(params);
      const list = res.data?.items || [];
      setItems(list);
      setTotalSaved(res.data?.totalSaved || 0);

      // Default select first item if none selected or not in current list
      if (
        list.length > 0 &&
        (!selectedItem || !list.some((it) => it.question === selectedItem.question))
      ) {
        selectQuestion(list[0]);
      }
    } catch (err) {
      handleApiError(err, "Failed to load question bank", toast);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileForProjects = async () => {
    try {
      const res = await careerAPI.getProfile();
      if (res.data?.profile) {
        setUserProfile(res.data.profile);
        if (res.data.profile.projects?.length > 0) {
          setSelectedProjectId(res.data.profile.projects[0]._id);
        }
      }
    } catch (err) {
      console.warn("Could not load profile for project questions:", err);
    }
  };

  const selectQuestion = (item) => {
    setSelectedItem(item);
    setEditedAnswer(item.savedAnswer || item.aiDraft || "");
    setAiDraft(item.aiDraft || "");
    setTalkingPoints([]);
    setMissingInfoTip("");
    setRelatedProjects(item.relatedProjects || []);
    setAnswerLength(item.answerLength || "standard");
    setAnswerTone(item.answerTone || "conversational");
  };

  const handleGenerateAnswer = async () => {
    if (!selectedItem) return;
    try {
      setGenerating(true);
      const res = await careerAPI.generateAnswer({
        question: selectedItem.question,
        category: selectedItem.category,
        answerLength,
        answerTone,
      });

      const draft = res.data?.aiDraft || "";
      setAiDraft(draft);
      setEditedAnswer(draft);
      setTalkingPoints(res.data?.talkingPoints || []);
      setRelatedProjects(res.data?.relatedProjects || []);
      setMissingInfoTip(res.data?.missingInfoTip || "");

      setSelectedItem((prev) => ({
        ...prev,
        aiDraft: draft,
        status: prev?.savedAnswer ? "saved" : "drafted",
      }));

      toast.success("Personalized answer generated from your Career Profile!");
    } catch (err) {
      handleApiError(err, "Failed to generate answer", toast);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToAnswerBank = async () => {
    if (!selectedItem) return;
    if (!editedAnswer.trim()) {
      toast.error("Please enter or generate an answer first");
      return;
    }

    try {
      setSavingAnswer(true);
      const res = await careerAPI.saveAnswer({
        qaId: selectedItem._id,
        question: selectedItem.question,
        category: selectedItem.category,
        aiDraft: aiDraft || selectedItem.aiDraft,
        savedAnswer: editedAnswer.trim(),
        answerLength,
        answerTone,
        relatedProjects,
      });

      if (res.data?.item) {
        setSelectedItem(res.data.item);
        loadQuestions();
      }
      toast.success("Answer saved to your Career Q&A Bank");
    } catch (err) {
      handleApiError(err, "Failed to save answer", toast);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleToggleStar = async (item, e) => {
    e?.stopPropagation();
    try {
      await careerAPI.toggleStar({
        qaId: item._id,
        question: item.question,
        category: item.category,
      });
      loadQuestions();
    } catch (err) {
      toast.error("Failed to update favorite");
    }
  };

  const handleCopy = () => {
    if (!editedAnswer) return;
    navigator.clipboard.writeText(editedAnswer);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Job Specific Analysis
  const handleAnalyzeJobDescription = async () => {
    if (!jobDescriptionInput.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    try {
      setAnalyzingJob(true);
      const res = await careerAPI.generateJobQuestions(jobDescriptionInput.trim());
      setJobAnalysisResult(res.data);
      toast.success("Generated tailored interview questions based on the JD!");
    } catch (err) {
      handleApiError(err, "Failed to analyze job description", toast);
    } finally {
      setAnalyzingJob(false);
    }
  };

  const handleAddJobQuestionToBank = async (qObj) => {
    try {
      await careerAPI.saveAnswer({
        question: qObj.question,
        category: "job-specific",
        jobContext: {
          jobDescription: jobDescriptionInput,
        },
      });
      toast.success("Question added to your Q&A bank!");
      loadQuestions();
    } catch (err) {
      toast.error("Failed to add question");
    }
  };

  // Project Questions Generation
  const handleGenerateProjectQuestions = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    const proj = userProfile?.projects?.find((p) => p._id === selectedProjectId);
    if (!proj) {
      toast.error("Project not found");
      return;
    }

    try {
      setGeneratingProjectQ(true);
      const res = await careerAPI.generateProjectQuestions(proj);
      setProjectQuestionsResult(res.data);
      toast.success("Generated architectural questions for your project!");
    } catch (err) {
      handleApiError(err, "Failed to generate project questions", toast);
    } finally {
      setGeneratingProjectQ(false);
    }
  };

  const handleAddProjectQuestionToBank = async (qObj) => {
    try {
      await careerAPI.saveAnswer({
        question: qObj.question,
        category: "project",
        relatedProjects: [projectQuestionsResult?.projectName].filter(Boolean),
      });
      toast.success("Added to Q&A bank!");
      loadQuestions();
    } catch (err) {
      toast.error("Failed to add question");
    }
  };

  // Custom Question Add
  const handleAddCustomQuestion = async () => {
    if (!customQuestionText.trim()) {
      toast.error("Please enter a question");
      return;
    }

    try {
      await careerAPI.saveAnswer({
        question: customQuestionText.trim(),
        category: customQuestionCategory,
      });
      toast.success("Custom question created!");
      setCustomModalOpen(false);
      setCustomQuestionText("");
      loadQuestions();
    } catch (err) {
      toast.error("Failed to create question");
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title="Personalized Career & Interview Q&A | SmartNShine"
        description="Smart, personalized answer bank grounded in your real Career Profile. Prepare HR, behavioral, project architecture, and job-specific interview questions."
      />

      {/* Top Bar Header */}
      <QAHeader onGoBack={handleGoBack} />

      {/* Main Workspace Body */}
      <main className="flex-1 workspace-container py-8 space-y-8">
        {/* Banner Section */}
        <QABanner
          totalSaved={totalSaved}
          onOpenJobModal={() => setJobModalOpen(true)}
          onOpenProjectModal={() => setProjectModalOpen(true)}
          onOpenCustomModal={() => setCustomModalOpen(true)}
        />

        {/* Main 2-Column Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Questions Navigator (5 cols) */}
          <div className="lg:col-span-5">
            <QASidebar
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              items={items}
              loading={loading}
              selectedItem={selectedItem}
              onSelectQuestion={selectQuestion}
              onToggleStar={handleToggleStar}
              categoryBadgeStyles={CATEGORY_BADGE_STYLES}
            />
          </div>

          {/* Right Column: Interactive Studio (7 cols) */}
          <div className="lg:col-span-7">
            <QAStudio
              selectedItem={selectedItem}
              editedAnswer={editedAnswer}
              setEditedAnswer={setEditedAnswer}
              generating={generating}
              savingAnswer={savingAnswer}
              copied={copied}
              onCopy={handleCopy}
              onToggleStar={handleToggleStar}
              answerLength={answerLength}
              setAnswerLength={setAnswerLength}
              answerTone={answerTone}
              setAnswerTone={setAnswerTone}
              durationOptions={DURATION_OPTIONS}
              toneOptions={TONE_OPTIONS}
              onGenerateAnswer={handleGenerateAnswer}
              onSaveToAnswerBank={handleSaveToAnswerBank}
              missingInfoTip={missingInfoTip}
              talkingPoints={talkingPoints}
              categoryBadgeStyles={CATEGORY_BADGE_STYLES}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <JobPrepModal
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        jobDescriptionInput={jobDescriptionInput}
        setJobDescriptionInput={setJobDescriptionInput}
        analyzingJob={analyzingJob}
        onAnalyzeJob={handleAnalyzeJobDescription}
        jobAnalysisResult={jobAnalysisResult}
        onAddJobQuestionToBank={handleAddJobQuestionToBank}
      />

      <ProjectQuestionsModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        userProfile={userProfile}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        generatingProjectQ={generatingProjectQ}
        onGenerateProjectQuestions={handleGenerateProjectQuestions}
        projectQuestionsResult={projectQuestionsResult}
        onAddProjectQuestionToBank={handleAddProjectQuestionToBank}
      />

      <AddCustomQuestionModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        categories={CATEGORIES}
        customQuestionCategory={customQuestionCategory}
        setCustomQuestionCategory={setCustomQuestionCategory}
        customQuestionText={customQuestionText}
        setCustomQuestionText={setCustomQuestionText}
        onAddCustomQuestion={handleAddCustomQuestion}
      />

      {/* Floating Job Application Copilot Quick-Dock */}
      <ApplicationCopilotDrawer profile={userProfile || {}} qaItems={items} />
    </div>
  );
}

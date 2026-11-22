import { memo, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  useLocalStorage,
  useToggle,
  useMediaQuery,
  useSectionCompletion,
  isSectionCompleteForResume,
  useFloatingSectionNav,
  useEditorPersistence,
  useResumeSaveActions,
} from "@/hooks";
import { resumeAPI } from "@/api/api";
import { careerAPI } from "@/api";
import { parseValidationErrors } from "@/utils/errorHandler";
import logger from "@/utils/logger";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Lock,
  PencilLine,
  Eye,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  ResumePreview,
  ResumeWizard,
  TemplateSelectorModal,
  EditorHeader,
  ATSRecommendationBanner,
} from "@/components/editor";
import SEO from "@/components/common/SEO";
import { GitHubImportModal } from "@/components/common/modals";
import UpgradeRequiredModal from "@/components/common/modals/UpgradeRequiredModal";
import { TEMPLATES, TEMPLATE_COLOR_THEMES } from "@/components/editor/templateConfig";
import {
  DEFAULT_SECTION_ORDER,
  SECTION_META,
} from "@/components/editor/constants/editorConstants";
import MobileActionBar from "@/components/editor/navigation/MobileActionBar";
import DesktopFloatingSectionNav from "@/components/editor/navigation/DesktopFloatingSectionNav";
import EditorFloatingActionRail from "@/components/editor/navigation/EditorFloatingActionRail";
import EditorMiniScoreBar from "@/components/editor/navigation/EditorMiniScoreBar";
import AnalysisDrawer from "@/components/editor/panels/AnalysisDrawer";
import UnsavedChangesModal from "@/components/editor/modals/UnsavedChangesModal";
import EditorSectionRenderer from "@/components/editor/sections/EditorSectionRenderer";
import useResumeDataOperations from "@/components/editor/hooks/useResumeDataOperations";
import { mergeGitHubImportData } from "@/components/editor/utils/githubResumeImporter";
import { normalizeResumeData } from "@/components/editor/utils/resumeInitializer";
import { useNavigationBlocker } from "@/context/NavigationBlockerContext";

const Editor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const isAdmin = user?.role === "admin";
  const { unblockNavigation } = useNavigationBlocker();
  const resumePreviewRef = useRef(null);
  const previewSectionRef = useRef(null);
  const sectionElementRefs = useRef({});

  // Helper function to check if subscription is expired
  const isSubscriptionExpired = () => {
    if (isAdmin || !user?.subscription) return false;
    const { status, endDate, tier } = user.subscription;
    if (tier === "free") return false;
    if (status === "expired") return true;
    if (endDate && new Date(endDate) < new Date()) return true;
    return false;
  };

  const [resumeData, setResumeData] = useState(null);
  const [aiUpdatedSection, setAiUpdatedSection] = useState(null);
  const [aiAddedMessage, setAiAddedMessage] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [originalResumeData, setOriginalResumeData] = useState(null);
  const [showPreview, togglePreview, setShowPreviewTrue, setShowPreviewFalse] =
    useToggle(true);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [selectedTemplate, setSelectedTemplate] = useLocalStorage(
    "selectedTemplate",
    "classic"
  );
  const [
    showTemplateSelector,
    toggleTemplateSelector,
    showTemplateSelectorTrue,
    showTemplateSelectorFalse,
  ] = useToggle(false);
  const [sectionOrder, setSectionOrder] = useLocalStorage(
    "resumeSectionOrder",
    DEFAULT_SECTION_ORDER
  );

  // Older saved resumes predate the layout section. Add it once and keep it at
  // the top so styling controls are available before content editing.
  useEffect(() => {
    if (!sectionOrder.includes("layout") || sectionOrder[0] !== "layout") {
      setSectionOrder((currentOrder) => [
        "layout",
        ...currentOrder.filter((section) => section !== "layout"),
      ]);
    }
  }, [sectionOrder, setSectionOrder]);

  const [activeSectionId, setActiveSectionId] = useState(
    DEFAULT_SECTION_ORDER[0]
  );
  const [
    isWizardMode,
    toggleWizardMode,
    setIsWizardModeTrue,
    setIsWizardModeFalse,
  ] = useToggle(false);
  const {
    showFloatingNav,
    floatingNavOffset,
    floatingNavContainerRef,
    toggleFloatingNav,
    closeFloatingNav,
    handleFloatingNavDragStart,
  } = useFloatingSectionNav({ isWizardMode });
  const [draggedSection, setDraggedSection] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [forceSectionExpand, setForceSectionExpand] = useState(null);
  const [atsRecommendation, setAtsRecommendation] = useState(
    location.state?.atsRecommendation || null
  );
  const [highlightedSection, setHighlightedSection] = useState(null);

  useEffect(() => {
    if (location.state?.atsRecommendation) {
      setAtsRecommendation(location.state.atsRecommendation);
    }
  }, [location.state?.atsRecommendation]);

  const [
    showGitHubImportModal,
    toggleGitHubImportModal,
    showGitHubImportModalTrue,
    showGitHubImportModalFalse,
  ] = useToggle(false);
  const [
    githubImportSuccess,
    toggleGithubImportSuccess,
    setGithubImportSuccessTrue,
    setGithubImportSuccessFalse,
  ] = useToggle(false);

  // Upgrade modal states
  const [
    showUpgradeModal,
    toggleUpgradeModal,
    showUpgradeModalTrue,
    showUpgradeModalFalse,
  ] = useToggle(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  // Resizable split layout between the two sections (Telegram Web style)
  const [splitRatio, setSplitRatio] = useState(() => {
    try {
      const saved = localStorage.getItem("resume_editor_split_ratio");
      if (saved) {
        const val = parseFloat(saved);
        if (val >= 20 && val <= 80) return val;
      }
    } catch {}
    return 40; // Default 40% editor, 60% resume preview
  });

  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const containerRef = useRef(null);

  const startResizing = useCallback((startClientX) => {
    setIsDraggingSplitter(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (e) => {
      if (!containerRef.current) return;
      const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      if (clientX == null) return;
      const rect = containerRef.current.getBoundingClientRect();
      // percentage of pointer position within the container
      const pct = ((clientX - rect.left) / rect.width) * 100;
      // clamp: editor min 20%, max 78% — preview always has room
      setSplitRatio(Math.min(78, Math.max(20, pct)));
    };

    const onEnd = () => {
      setIsDraggingSplitter(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      setSplitRatio((prev) => {
        try { localStorage.setItem("resume_editor_split_ratio", String(Math.round(prev))); } catch {}
        return prev;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, []);

  const handleSplitterMouseDown = useCallback((e) => {
    e.preventDefault();
    startResizing(e.clientX);
  }, [startResizing]);

  const handleSplitterTouchStart = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      startResizing(e.touches[0].clientX);
    }
  }, [startResizing]);

  const handleResetSplitRatio = useCallback(() => {
    setSplitRatio(50);
    try {
      localStorage.setItem("resume_editor_split_ratio", "50");
    } catch {}
  }, []);

  const {
    saving,
    saveResume: saveResumeAction,
    handleSave,
  } = useResumeSaveActions({
    user,
    navigate,
    resumeData,
    setResumeData,
    setOriginalResumeData,
    setUpgradeMessage,
    showUpgradeModalTrue,
  });

  const {
    hasUnsavedChanges,
    autoSaving,
    showUnsavedModal,
    setShowUnsavedModal,
    setPendingNavigation,
    commitPendingNavigation,
    cancelPendingNavigation,
  } = useEditorPersistence({
    resumeData,
    originalResumeData,
    setResumeData,
    setOriginalResumeData,
    user,
    saving,
    locationState: location.state,
  });

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMobileTogglePreview = useCallback(() => {
    const previewEl = previewSectionRef.current;
    if (previewEl) {
      const rect = previewEl.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        previewEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unblockNavigation();
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [unblockNavigation]);

  // Load resume data on mount
  useEffect(() => {
    // Only load data if we are currently on the editor page
    if (location.pathname !== "/editor") return;

    let isMounted = true;

    const loadResumeData = async () => {
      const stateData = location.state?.resumeData;
      const isNewResume = location.state?.isNewResume || false;
      const templateSelected =
        location.state?.templateSelected ||
        Boolean(location.state?.selectedTemplate) ||
        Boolean(sessionStorage.getItem("templatePreSelected"));

      if (location.state?.selectedTemplate) {
        setSelectedTemplate(location.state.selectedTemplate);
        localStorage.setItem("selectedTemplate", location.state.selectedTemplate);
      }
      sessionStorage.removeItem("templatePreSelected");

      // A draft has no saved ID; use the cached ID only when navigation supplies no resume data.
      const resumeIdToFetch = stateData ? stateData._id : localStorage.getItem("currentResumeId");

      // Case 1: The resume already exists in the database (has an _id or saved in localStorage).
      // ALWAYS fetch the latest saved version from MongoDB so that reloads/updates never show stale data!
      if (resumeIdToFetch && userId) {
        try {
          console.log(`📥 [EDITOR LOAD] Fetching latest resume from MongoDB (ID: ${resumeIdToFetch})...`);
          const response = await resumeAPI.getById(resumeIdToFetch);
          if (!isMounted) return;
          const loadedData = response.data;
          console.log("✅ [EDITOR LOAD] MongoDB resume fetched successfully! Custom sections:", loadedData?.customSections);

          setIsWizardModeFalse();
          initializeResumeData(loadedData);
          localStorage.setItem("currentResumeId", loadedData._id);
          return;
        } catch (err) {
          if (!isMounted) return;
          console.error("❌ Error loading resume from database, trying fallback:", err);
          if (stateData) {
            console.log("ℹ️ Using stateData as fallback");
            initializeResumeData(stateData);
            return;
          }
          localStorage.removeItem("currentResumeId");
          navigate("/upload");
          return;
        }
      }

      // Case 2: Brand new unsaved resume draft without an _id yet
      if (stateData) {
        if (!isMounted) return;
        if (isNewResume) {
          setIsWizardModeTrue();
          // Only show template selector modal if a template was not already chosen
          if (!templateSelected) {
            showTemplateSelectorTrue();
          }
        } else {
          setIsWizardModeFalse();
        }

        if (isNewResume && !isMobile) {
          setShowPreviewTrue();
        }

        initializeResumeData(stateData);
        return;
      }

      if (isMounted && location.pathname === "/editor") {
        navigate("/upload");
      }
    };

    const initializeResumeData = (data) => {
      if (!isMounted) return;
      const normalized = normalizeResumeData(data);
      setResumeData(normalized);
      setOriginalResumeData(JSON.parse(JSON.stringify(normalized)));
    };

    loadResumeData();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, location.state, userId]);

  const resumeAccess = isAdmin ? {} : resumeData?.access || {};
  const isPaidActionLocked = Boolean(
    resumeData?._id &&
      (resumeAccess.upgradeRequired ||
        resumeAccess.canDownload === false ||
        resumeAccess.canUseAI === false)
  );
  const isReadOnlyResume = Boolean(resumeData?._id && resumeAccess.canEdit === false);
  const lockedResumeMessage =
    resumeAccess.lockReason ||
    "Paid actions are locked for your current subscription. You can still edit this resume manually.";

  // Extracted encapsulated data operations
  const {
    updateField,
    updateContact,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    moveItem,
  } = useResumeDataOperations({ setResumeData, isReadOnlyResume });

  const guardedHandleSave = async () => {
    if (isReadOnlyResume) {
      setUpgradeMessage(lockedResumeMessage);
      showUpgradeModalTrue();
      return false;
    }
    return handleSave();
  };

  const handleDownloadPDF = async () => {
    if (!user) {
      toast.error("Please login to download your resume", { duration: 3000 });
      navigate("/login");
      return;
    }

    if (isPaidActionLocked || resumeAccess.canDownload === false) {
      setUpgradeMessage(lockedResumeMessage);
      showUpgradeModalTrue();
      return;
    }

    if (isSubscriptionExpired()) {
      setUpgradeMessage(
        "Your subscription has expired. Please renew or upgrade to download your resume."
      );
      showUpgradeModalTrue();
      return;
    }

    try {
      await resumeAPI.trackDownload(resumeData?._id);
      if (resumePreviewRef.current) {
        resumePreviewRef.current.downloadPDF();
        toast.success("Resume download started!", { duration: 2000 });
      } else {
        toast.error("Could not trigger browser print. Please try again.");
      }
    } catch (err) {
      logger.error("Download tracking error:", err);
      let errorData = err.response?.data;

      if (errorData instanceof Blob) {
        try {
          errorData = JSON.parse(await errorData.text());
        } catch {
          errorData = {};
        }
      }

      if (err.response?.status === 403) {
        const message = errorData?.message || errorData?.error || "Unable to download this resume.";
        if (!isAdmin && (errorData?.upgradeRequired || errorData?.requiresUpgrade)) {
          setUpgradeMessage(message);
          showUpgradeModalTrue();
        } else {
          toast.error(message);
        }
      } else {
        if (resumePreviewRef.current) {
          resumePreviewRef.current.downloadPDF();
        } else {
          toast.error(
            "Failed to download resume: " +
              (errorData?.message || parseValidationErrors(err)),
            { duration: 4000 }
          );
        }
      }
    }
  };

  const handleSaveAndNavigate = async () => {
    const wasSaved = await guardedHandleSave();
    if (wasSaved) {
      commitPendingNavigation(navigate);
    }
  };

  const handleDiscardAndNavigate = () => {
    commitPendingNavigation(navigate);
  };

  const handleCancelNavigation = () => {
    cancelPendingNavigation();
  };

  const handleWizardComplete = () => {
    setIsWizardModeFalse();
    toast.success("Resume setup complete! You can now edit all sections.", {
      duration: 3000,
    });
  };

  // AI suggestions application handler
  const handleApplyAiSuggestion = async (suggestion) => {
    if (isReadOnlyResume) return false;

    if (suggestion.section === "contact") {
      setResumeData((prev) => ({
        ...prev,
        contact: { ...(prev.contact || {}), ...suggestion.value },
      }));
    } else if (suggestion.section === "name") {
      updateField("name", suggestion.value);
    } else if (suggestion.section === "summary") {
      updateField("summary", suggestion.value);
    } else if (suggestion.section === "skills") {
      updateField("skills", suggestion.value);
    } else if (suggestion.fieldPatch) {
      setResumeData((prev) => {
        const items = [...(prev[suggestion.section] || [])];
        items[suggestion.index] = { ...items[suggestion.index], ...suggestion.value };
        return { ...prev, [suggestion.section]: items };
      });
    } else if (
      ["experience", "education", "projects"].includes(suggestion.section) &&
      suggestion.isStarter
    ) {
      addArrayItem(suggestion.section, suggestion.value);
    } else if (["experience", "projects"].includes(suggestion.section)) {
      updateArrayItem(suggestion.section, suggestion.index, "bullets", suggestion.value);
    } else {
      return false;
    }

    const targetSection = suggestion.targetSection || suggestion.section;
    setAiUpdatedSection(targetSection);
    setAiAddedMessage(`${suggestion.label} added`);
    setTimeout(() => {
      sectionElementRefs.current[targetSection]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
    setTimeout(() => {
      setAiUpdatedSection(null);
      setAiAddedMessage("");
    }, 1800);
    return true;
  };

  // Drag and drop handlers for section reordering
  const handleDragStart = (e, sectionId) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    if (draggedSection && draggedSection !== targetSectionId) {
      const newOrder = [...sectionOrder];
      const draggedIndex = newOrder.indexOf(draggedSection);
      const targetIndex = newOrder.indexOf(targetSectionId);

      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedSection);

      setSectionOrder(newOrder);
      setResumeData((prev) => ({
        ...prev,
        sectionOrder: newOrder,
      }));
    }
    setDraggedSection(null);
  };

  // Reorder section by ID (up / down)
  const handleMoveSection = (sectionId, direction) => {
    const currentIndex = sectionOrder.indexOf(sectionId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;

    const newOrder = [...sectionOrder];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, sectionId);

    setSectionOrder(newOrder);
    setResumeData((prev) => ({
      ...prev,
      sectionOrder: newOrder,
    }));
  };

  // GitHub Import Handler
  const handleGitHubImport = async (importedData) => {
    let updatedResumeData = null;

    setResumeData((prev) => {
      const updated = mergeGitHubImportData(prev, importedData);
      updatedResumeData = updated;
      return updated;
    });

    showGitHubImportModalFalse();
    setGithubImportSuccessTrue();
    setTimeout(() => setGithubImportSuccessFalse(), 3000);

    setTimeout(async () => {
      if (updatedResumeData && user) {
        logger.log("💾 Auto-saving imported data...", updatedResumeData);
        await saveResumeAction({
          dataToSave: updatedResumeData,
          showSuccessToast: false,
          requireAuthRedirect: false,
          errorMessagePrefix: "Failed to auto-save imported data: ",
        });
      }
    }, 1000);
  };

  // Reset section order to default
  const handleResetOrder = () => {
    if (window.confirm("Reset section order to default? This cannot be undone.")) {
      setSectionOrder(DEFAULT_SECTION_ORDER);
      setResumeData((prev) => ({
        ...prev,
        sectionOrder: DEFAULT_SECTION_ORDER,
      }));
      toast.success("Section order reset to default!", { duration: 2000 });
    }
  };

  // Import from Career Profile master data
  const handleImportFromCareerProfile = async () => {
    try {
      const toastId = toast.loading("Fetching Career Profile data...");
      const res = await careerAPI.getExportResumeFormat();
      if (!res.data?.resumeData) {
        toast.dismiss(toastId);
        toast.error("No Career Profile data found. Please set up your Career Profile first.");
        return;
      }
      const imported = res.data.resumeData;
      setResumeData((prev) => ({
        ...prev,
        name: imported.name || prev?.name,
        contact: { ...prev?.contact, ...imported.contact },
        summary: imported.summary || prev?.summary,
        skills: imported.skills?.length > 0 ? imported.skills : prev?.skills,
        experience: imported.experience?.length > 0 ? imported.experience : prev?.experience,
        education: imported.education?.length > 0 ? imported.education : prev?.education,
        projects: imported.projects?.length > 0 ? imported.projects : prev?.projects,
        certifications: imported.certifications?.length > 0 ? imported.certifications : prev?.certifications,
        achievements: imported.achievements?.length > 0 ? imported.achievements : prev?.achievements,
      }));
      toast.dismiss(toastId);
      toast.success("Resume populated from your master Career Profile! ✨");
    } catch (err) {
      toast.error("Failed to load Career Profile data");
    }
  };

  useEffect(() => {
    if (isWizardMode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;

        const id = visible[0].target.getAttribute("data-section-id");
        if (id) setActiveSectionId(id);
      },
      {
        root: null,
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sectionOrder.forEach((sectionId) => {
      const element = sectionElementRefs.current[sectionId];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isWizardMode, sectionOrder]);

  const isTrackableSection = useCallback(
    (sectionId) => sectionId !== "layout" && Boolean(SECTION_META[sectionId]),
    []
  );

  const {
    trackableSectionIds,
    sectionCompletionMap,
    completedSectionsCount,
    completionPercentage,
    firstIncompleteSectionId,
  } = useSectionCompletion({
    sectionOrder,
    resumeData,
    isTrackableSection,
  });

  useEffect(() => {
    const handleSectionShortcuts = (event) => {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isTypingTarget || isWizardMode) return;

      const hasLegacyChord = event.altKey && event.shiftKey;
      const hasMacChord = event.metaKey && event.shiftKey;
      if (!hasLegacyChord && !hasMacChord) return;

      const key = event.key.toLowerCase();

      if (key === "e") {
        event.preventDefault();
        setForceSectionExpand(true);
      }

      if (key === "c") {
        event.preventDefault();
        setForceSectionExpand(false);
      }

      if (key === "n") {
        event.preventDefault();
        const firstIncompleteSectionId = sectionOrder.find(
          (sectionId) =>
            sectionId !== "layout" &&
            SECTION_META[sectionId] &&
            !isSectionCompleteForResume(sectionId, resumeData)
        );

        if (!firstIncompleteSectionId) {
          toast.success("All sections look complete.", {
            duration: 2000,
            position: "bottom-right",
          });
          return;
        }

        const element = sectionElementRefs.current[firstIncompleteSectionId];
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSectionId(firstIncompleteSectionId);
        closeFloatingNav();
      }
    };

    window.addEventListener("keydown", handleSectionShortcuts);
    return () => window.removeEventListener("keydown", handleSectionShortcuts);
  }, [isWizardMode, resumeData, sectionOrder, closeFloatingNav]);

  const handleApplyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const newThemes = TEMPLATE_COLOR_THEMES[templateId] || [];
    if (newThemes.length > 0) {
      const exists = newThemes.some(
        (t) =>
          t.id === resumeData?.colorTheme ||
          t.id === resumeData?.selectedTheme
      );
      if (!exists) {
        setResumeData((prev) => ({
          ...prev,
          colorTheme: newThemes[0].id,
          selectedTheme: newThemes[0].id,
        }));
      }
    }
  };

  const scrollToSection = (sectionId) => {
    const element = sectionElementRefs.current[sectionId];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSectionId(sectionId);
    closeFloatingNav();
  };

  const jumpToFirstIncompleteSection = () => {
    if (!firstIncompleteSectionId) {
      toast.success("All sections look complete.", {
        duration: 2000,
        position: "bottom-right",
      });
      return;
    }
    scrollToSection(firstIncompleteSectionId);
  };

  const handleAutoAddKeywordsToSkills = async (keywordsList) => {
    if (!keywordsList || !keywordsList.length || !resumeData) return;

    const currentSkills = Array.isArray(resumeData.skills) ? [...resumeData.skills] : [];
    const cleanKeywords = keywordsList
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (!cleanKeywords.length) return;

    let updatedSkills;

    if (
      currentSkills.length > 0 &&
      typeof currentSkills[0] === "object" &&
      currentSkills[0] !== null
    ) {
      const firstCat = { ...currentSkills[0] };
      let existingItems = [];
      if (Array.isArray(firstCat.items)) {
        existingItems = [...firstCat.items];
      } else if (typeof firstCat.items === "string") {
        existingItems = firstCat.items
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const existingLower = new Set(existingItems.map((s) => s.toLowerCase()));
      const newItems = cleanKeywords.filter((k) => !existingLower.has(k.toLowerCase()));

      if (newItems.length === 0) {
        toast.success("Keywords are already present in your skills list!", {
          icon: "ℹ️",
        });
        return;
      }

      firstCat.items = [...existingItems, ...newItems];
      updatedSkills = [firstCat, ...currentSkills.slice(1)];
    } else if (currentSkills.length > 0 && typeof currentSkills[0] === "string") {
      const existingLower = new Set(currentSkills.map((s) => s.toLowerCase()));
      const newItems = cleanKeywords.filter((k) => !existingLower.has(k.toLowerCase()));

      if (newItems.length === 0) {
        toast.success("Keywords are already present in your skills list!", {
          icon: "ℹ️",
        });
        return;
      }

      updatedSkills = [...currentSkills, ...newItems];
    } else {
      updatedSkills = [
        {
          category: "Technical Skills",
          items: cleanKeywords,
        },
      ];
    }

    const updatedResumeData = {
      ...resumeData,
      skills: updatedSkills,
    };

    setResumeData(updatedResumeData);

    if (user) {
      const saveResult = await saveResumeAction({
        dataToSave: updatedResumeData,
        showSuccessToast: true,
        showErrorToast: true,
        requireAuthRedirect: false,
      });

      if (saveResult?.ok) {
        toast.success(
          `Added ${cleanKeywords.length} keywords to Skills & saved resume! ✨`
        );
      }
    }

    setHighlightedSection("skills");
    if (isWizardMode) {
      setIsWizardModeFalse();
    }
    setTimeout(() => {
      scrollToSection("skills");
    }, 100);
    setTimeout(() => {
      setHighlightedSection(null);
    }, 4000);
  };

  const handleJumpToSectionFromAts = (targetSection) => {
    if (isWizardMode) {
      setIsWizardModeFalse();
    }
    setForceSectionExpand(true);
    setHighlightedSection(targetSection);
    setTimeout(() => {
      scrollToSection(targetSection);
    }, 100);
    setTimeout(() => {
      setHighlightedSection(null);
    }, 4000);
  };

  const handleBackToATS = () => {
    navigate("/ats-analyzer");
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      setPendingNavigation("back");
      return;
    }
    unblockNavigation();
    if (location.state?.fromTemplates) {
      navigate("/templates");
    } else if (location.state?.fromDashboard) {
      navigate("/dashboard");
    } else if (location.state?.fromUpload) {
      navigate("/upload");
    } else if (location.state?.fromATS) {
      navigate("/ats-analyzer");
    } else if (location.state?.fromCareerProfile) {
      navigate("/career-profile");
    } else if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const isExportLocked = isSubscriptionExpired() || isReadOnlyResume;
  const expandAllSections = () => setForceSectionExpand(true);
  const collapseAllSections = () => setForceSectionExpand(false);

  const availableColorThemes = useMemo(() => {
    return TEMPLATE_COLOR_THEMES[selectedTemplate] || [];
  }, [selectedTemplate]);

  const activeColorTheme = useMemo(() => {
    if (!availableColorThemes.length) return null;
    return (
      availableColorThemes.find(
        (t) =>
          t.id === resumeData?.colorTheme ||
          t.id === resumeData?.selectedTheme
      ) || availableColorThemes[0]
    );
  }, [availableColorThemes, resumeData?.colorTheme, resumeData?.selectedTheme]);

  const handleSelectColorTheme = useCallback(
    (themeId) => {
      setResumeData((prev) => ({
        ...prev,
        colorTheme: themeId,
        selectedTheme: themeId,
      }));
      const themeObj = availableColorThemes.find((t) => t.id === themeId);
      if (themeObj) {
        toast.success(`${themeObj.name} theme applied!`, {
          duration: 2000,
          position: "bottom-right",
        });
      }
    },
    [availableColorThemes]
  );

  if (location.pathname !== "/editor") {
    return null;
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen w-full max-w-full overflow-x-hidden bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title={`Editing: ${resumeData.resumeTitle || resumeData.name || "Resume"} | SmartNShine`}
        description="Craft, tailor, and design your ATS-optimized resume with AI assistance and live preview."
        noindex={true}
      />

      {/* Standalone Fullscreen Header */}
      <EditorHeader
        onGoBack={handleGoBack}
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        autoSaving={autoSaving}
        isWizardMode={isWizardMode}
        onSwitchToFullEditor={handleWizardComplete}
        onImportCareerProfile={handleImportFromCareerProfile}
        onResetOrder={handleResetOrder}
        onShowTemplateSelector={showTemplateSelectorTrue}
        availableColorThemes={availableColorThemes}
        activeColorTheme={activeColorTheme}
        onSelectColorTheme={handleSelectColorTheme}
        onSave={guardedHandleSave}
        onExport={handleDownloadPDF}
        isExportLocked={isExportLocked}
        showPreview={showPreview}
        onTogglePreview={isMobile ? handleMobileTogglePreview : togglePreview}
      />

      {/* ── Main content area: flex column so workspace fills remaining viewport ── */}
      <div className="flex flex-1 min-h-0 w-full max-w-[1800px] mx-auto flex-col overflow-y-auto px-2 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 lg:overflow-hidden lg:px-8">
        <MobileActionBar
          showFloatingNav={showFloatingNav}
          onToggleSections={toggleFloatingNav}
          showPreview={showPreview}
          onTogglePreview={handleMobileTogglePreview}
          onSave={guardedHandleSave}
          saving={saving}
          autoSaving={autoSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onExport={handleDownloadPDF}
          isExportLocked={isExportLocked}
          isWizardMode={isWizardMode}
          completedSectionsCount={completedSectionsCount}
          totalTrackableSections={trackableSectionIds.length}
          completionPercentage={completionPercentage}
          onJumpToFirstIncomplete={jumpToFirstIncompleteSection}
          onExpandAll={expandAllSections}
          onCollapseAll={collapseAllSections}
          trackableSectionIds={trackableSectionIds}
          activeSectionId={activeSectionId}
          sectionCompletionMap={sectionCompletionMap}
          onSelectSection={scrollToSection}
          onMoveSection={handleMoveSection}
        />

        {/* Compact Floating Action Rail - Desktop Only */}
        <EditorFloatingActionRail
          showPreview={showPreview}
          togglePreview={togglePreview}
          guardedHandleSave={guardedHandleSave}
          saving={saving}
          autoSaving={autoSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          handleDownloadPDF={handleDownloadPDF}
          isSubscriptionExpired={isExportLocked}
          showScrollTop={showScrollTop}
        />

        {/* Floating Section Navigation - Desktop */}
        {!isWizardMode && (
          <DesktopFloatingSectionNav
            floatingNavContainerRef={floatingNavContainerRef}
            floatingNavOffset={floatingNavOffset}
            showFloatingNav={showFloatingNav}
            onDragStart={handleFloatingNavDragStart}
            onToggleFloatingNav={toggleFloatingNav}
            completionPercentage={completionPercentage}
            onJumpToFirstIncomplete={jumpToFirstIncompleteSection}
            onExpandAll={expandAllSections}
            onCollapseAll={collapseAllSections}
            trackableSectionIds={trackableSectionIds}
            activeSectionId={activeSectionId}
            sectionCompletionMap={sectionCompletionMap}
            onSelectSection={scrollToSection}
            onMoveSection={handleMoveSection}
          />
        )}

        {/* ATS Recommendation Action Banner */}
        {atsRecommendation && (
          <div className="mb-3 shrink-0">
            <ATSRecommendationBanner
              recommendation={atsRecommendation}
              onDismiss={() => setAtsRecommendation(null)}
              onJumpToSection={handleJumpToSectionFromAts}
              onAutoAddKeywords={handleAutoAddKeywordsToSkills}
              onSave={guardedHandleSave}
              onOpenAIAnalysis={() => setIsAnalysisOpen(true)}
              onBackToATS={handleBackToATS}
              saving={saving}
              isWizardMode={isWizardMode}
            />
          </div>
        )}

        {isPaidActionLocked && (
          <div className="mb-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Paid actions locked</p>
                  <p className="text-sm opacity-90">{lockedResumeMessage}</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Unlock Access
              </button>
            </div>
          </div>
        )}

        {/* Conditional: Wizard vs Normal Editor */}
        {isWizardMode ? (
          <div
            ref={containerRef}
            className={`relative flex min-h-[300px] min-w-0 max-w-full flex-1 flex-col gap-0 overflow-hidden lg:min-h-0 lg:flex-row ${
              isDraggingSplitter ? "select-none cursor-col-resize" : ""
            }`}
          >
            {/* Left Panel: Guided Resume Wizard
                Mobile: full width, scrollable; hidden when preview is open
                Desktop: percentage width set by splitter
            */}
            <div
              className="min-h-0 min-w-0 w-full pb-6 scrollbar-hide lg:h-full lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-10 lg:[scrollbar-gutter:stable]"
              style={typeof window !== "undefined" && window.innerWidth >= 1024 && showPreview
                ? { width: `${splitRatio}%`, flexShrink: 0, flexGrow: 0 }
                : { width: "100%" }}
              ref={(el) => {
                // Apply desktop split width only on lg+
                if (!el) return;
                const applyWidth = () => {
                  if (window.innerWidth >= 1024 && showPreview) {
                    el.style.width = `${splitRatio}%`;
                  } else {
                    el.style.width = "100%";
                  }
                };
                applyWidth();
                window.addEventListener("resize", applyWidth);
              }}
            >
              <ResumeWizard
                resumeData={resumeData}
                updateField={updateField}
                updateContact={updateContact}
                addArrayItem={addArrayItem}
                updateArrayItem={updateArrayItem}
                removeArrayItem={removeArrayItem}
                moveItem={moveItem}
                onComplete={handleWizardComplete}
                onSwitchToFullEditor={handleWizardComplete}
                onGoBack={handleGoBack}
              />
            </div>

            {/* Resizable divider — desktop only */}
            {showPreview && (
              <div
                onMouseDown={handleSplitterMouseDown}
                onTouchStart={handleSplitterTouchStart}
                onDoubleClick={handleResetSplitRatio}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sections"
                title="Drag to resize · Double-click to reset 50/50"
                className="hidden lg:flex items-center justify-center w-4 relative z-30 cursor-col-resize select-none shrink-0 group touch-none"
              >
                <div className="absolute inset-y-0 -left-3 -right-3 cursor-col-resize" />
                <div
                  className={`w-[2px] h-full absolute left-1/2 -translate-x-1/2 transition-colors duration-150 ${
                    isDraggingSplitter
                      ? "bg-blue-500 dark:bg-blue-400"
                      : "bg-gray-200/80 dark:bg-zinc-700/80 group-hover:bg-blue-400/70 dark:group-hover:bg-blue-500/70"
                  }`}
                />
                <div
                  className={`relative z-10 flex flex-col items-center justify-center gap-[3px] px-1 py-2.5 rounded-lg transition-all duration-150 ${
                    isDraggingSplitter
                      ? "bg-blue-500 shadow-md shadow-blue-500/30 scale-105"
                      : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 shadow-sm group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:shadow-md group-hover:scale-105"
                  }`}
                >
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-[3px]">
                      {[0, 1].map((col) => (
                        <div
                          key={col}
                          className={`w-[3px] h-[3px] rounded-full transition-colors ${
                            isDraggingSplitter
                              ? "bg-white"
                              : "bg-gray-400 dark:bg-zinc-400 group-hover:bg-blue-500 dark:group-hover:bg-blue-400"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Panel: Resume Preview
                Mobile: rendered directly inline at the ending below wizard
                Desktop: percentage width column side-by-side with splitter
            */}
            {showPreview && (
              <div
                ref={previewSectionRef}
                id="resume-preview-section"
                className="
                  min-h-0 w-full mt-8 pb-32 scrollbar-hide
                  lg:mt-0 lg:pb-8 lg:static lg:z-auto lg:flex lg:h-full lg:max-h-full lg:flex-none lg:flex-col lg:min-w-0
                  lg:overflow-y-auto lg:overscroll-contain lg:pl-1 lg:[scrollbar-gutter:stable]
                "
                style={{ ...(typeof window !== "undefined" && window.innerWidth >= 1024 ? { width: `${100 - splitRatio}%` } : { width: "100%" }) }}
              >
                {/* Mobile section header banner for preview at ending */}
                <div className="lg:hidden mb-3 p-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>Live Resume Preview</span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                          Live
                        </span>
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400">
                        Updates in real-time · Directly edit styling below
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 text-[11px] font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer active:scale-95"
                  >
                    <span>↑ Top</span>
                  </button>
                </div>

                <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-2 sm:p-3.5 shadow-xs flex flex-col">
                  <ResumePreview
                    ref={resumePreviewRef}
                    resumeData={resumeData}
                    template={selectedTemplate}
                    onDownload={handleDownloadPDF}
                    onUpdateField={updateField}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            ref={containerRef}
            className={`relative flex min-h-[300px] min-w-0 max-w-full flex-1 flex-col gap-0 overflow-hidden lg:min-h-0 lg:flex-row ${
              isDraggingSplitter ? "select-none cursor-col-resize" : ""
            }`}
          >
            {/* Editor Panel — full width on mobile, % width on desktop */}
            <div
              className={`
                min-h-0 min-w-0 w-full space-y-3 pb-6 scrollbar-hide
                lg:h-full lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-10 lg:[scrollbar-gutter:stable]
                ${isReadOnlyResume ? "pointer-events-none opacity-75" : ""}
              `}
              style={typeof window !== "undefined" && window.innerWidth >= 1024 && showPreview
                ? { width: `${splitRatio}%`, flexShrink: 0, flexGrow: 0 }
                : { width: "100%" }}
            >
              {sectionOrder.map((sectionId) => (
                <div
                  key={sectionId}
                  data-section-id={sectionId}
                  ref={(el) => {
                    if (el) sectionElementRefs.current[sectionId] = el;
                  }}
                  className={`relative scroll-mt-28 transition-all duration-500 ${
                    highlightedSection === sectionId
                      ? "ring-4 ring-blue-500/80 dark:ring-blue-400/80 rounded-2xl shadow-xl scale-[1.01] bg-blue-50/10 dark:bg-blue-950/20"
                      : ""
                  } ${
                    aiUpdatedSection === sectionId ? "animate-ai-section-added" : ""
                  }`}
                >
                  {aiUpdatedSection === sectionId && (
                    <div className="ai-added-float" role="status">
                      <CheckCircle2 className="w-4 h-4" /> {aiAddedMessage}
                    </div>
                  )}
                  <EditorSectionRenderer
                    sectionId={sectionId}
                    resumeData={resumeData}
                    template={selectedTemplate}
                    setResumeData={setResumeData}
                    updateField={updateField}
                    updateContact={updateContact}
                    addArrayItem={addArrayItem}
                    updateArrayItem={updateArrayItem}
                    removeArrayItem={removeArrayItem}
                    moveItem={moveItem}
                    draggedSection={draggedSection}
                    handleDragStart={handleDragStart}
                    handleDragEnd={handleDragEnd}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    forceSectionExpand={forceSectionExpand}
                    handleApplyAiSuggestion={handleApplyAiSuggestion}
                    aiSuggestions={aiSuggestions}
                    setAiSuggestions={setAiSuggestions}
                  />
                </div>
              ))}
            </div>

            {/* Resizable divider — desktop only */}
            {showPreview && (
              <div
                onMouseDown={handleSplitterMouseDown}
                onTouchStart={handleSplitterTouchStart}
                onDoubleClick={handleResetSplitRatio}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sections"
                title="Drag to resize · Double-click to reset 50/50"
                className="hidden lg:flex items-center justify-center w-4 relative z-30 cursor-col-resize select-none shrink-0 group touch-none"
              >
                <div className="absolute inset-y-0 -left-3 -right-3 cursor-col-resize" />
                <div
                  className={`w-[2px] h-full absolute left-1/2 -translate-x-1/2 transition-colors duration-150 ${
                    isDraggingSplitter
                      ? "bg-blue-500 dark:bg-blue-400"
                      : "bg-gray-200/80 dark:bg-zinc-700/80 group-hover:bg-blue-400/70 dark:group-hover:bg-blue-500/70"
                  }`}
                />
                <div
                  className={`relative z-10 flex flex-col items-center justify-center gap-[3px] px-1 py-2.5 rounded-lg transition-all duration-150 ${
                    isDraggingSplitter
                      ? "bg-blue-500 shadow-md shadow-blue-500/30 scale-105"
                      : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 shadow-sm group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:shadow-md group-hover:scale-105"
                  }`}
                >
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-[3px]">
                      {[0, 1].map((col) => (
                        <div
                          key={col}
                          className={`w-[3px] h-[3px] rounded-full transition-colors ${
                            isDraggingSplitter
                              ? "bg-white"
                              : "bg-gray-400 dark:bg-zinc-400 group-hover:bg-blue-500 dark:group-hover:bg-blue-400"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Panel
                Mobile  : inline preview at ending below sections
                Desktop : side-by-side % column
            */}
            {showPreview && (
              <div
                ref={isWizardMode ? undefined : previewSectionRef}
                id="resume-preview-section-full"
                className="
                  min-h-0 w-full mt-8 pb-32 scrollbar-hide
                  lg:mt-0 lg:pb-8 lg:static lg:z-auto lg:flex lg:h-full lg:max-h-full lg:flex-none lg:flex-col lg:min-w-0
                  lg:overflow-y-auto lg:overscroll-contain lg:pl-1 lg:[scrollbar-gutter:stable]
                "
                style={typeof window !== "undefined" && window.innerWidth >= 1024
                  ? { width: `${100 - splitRatio}%`, flexShrink: 0, flexGrow: 0 }
                  : { width: "100%" }}
              >
                {/* Mobile preview top bar */}
                <div className="lg:hidden mb-3 p-3.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Eye className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>Live Resume Preview</span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                          Live
                        </span>
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400">
                        Updates in real-time · Directly edit styling below
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 text-[11px] font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer active:scale-95"
                  >
                    <span>↑ Top</span>
                  </button>
                </div>

                {/* Preview content */}
                <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-2 sm:p-3.5 shadow-xs flex flex-col">
                  <ResumePreview
                    ref={resumePreviewRef}
                    resumeData={resumeData}
                    template={selectedTemplate}
                    onDownload={handleDownloadPDF}
                    onUpdateField={updateField}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TemplateSelectorModal
        isOpen={showTemplateSelector}
        onClose={showTemplateSelectorFalse}
        templates={TEMPLATES}
        resumeData={resumeData}
        selectedTemplate={selectedTemplate}
        onApplyTemplate={handleApplyTemplate}
      />

      <AnalysisDrawer
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        resumeData={resumeData}
        updateField={updateField}
        handleApplyAiSuggestion={handleApplyAiSuggestion}
        aiSuggestions={aiSuggestions}
        setAiSuggestions={setAiSuggestions}
      />

      <GitHubImportModal
        isOpen={showGitHubImportModal}
        onClose={() => showGitHubImportModalFalse()}
        onImport={handleGitHubImport}
        currentResume={resumeData}
      />

      {githubImportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">Successfully Updated!</p>
              <p className="text-xs text-green-100">
                GitHub data added to your resume
              </p>
            </div>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        saving={saving}
        onSaveAndNavigate={handleSaveAndNavigate}
        onDiscardAndNavigate={handleDiscardAndNavigate}
        onCancelNavigation={handleCancelNavigation}
      />

      {!showPreview && (
        <div className="absolute pointer-events-none invisible -left-[9999px] w-0 h-0 overflow-hidden" aria-hidden="true">
          <ResumePreview
            ref={resumePreviewRef}
            resumeData={resumeData}
            template={selectedTemplate}
            onDownload={handleDownloadPDF}
            onUpdateField={updateField}
          />
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeRequiredModal
          isOpen={showUpgradeModal}
          onClose={() => showUpgradeModalFalse()}
          message={upgradeMessage}
          title="Upgrade Required"
          feature="AI-Powered Features"
        />
      )}
    </div>
  );
};

export default Editor;

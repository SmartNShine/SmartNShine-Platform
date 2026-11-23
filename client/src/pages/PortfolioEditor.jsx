import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Eye,
  Globe2,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  User,
  Phone,
  Rocket,
  Briefcase,
  GraduationCap,
  Trophy,
  Palette,
  Sliders,
  Search,
  Copy,
  Check,
  ExternalLink,
  Camera,
  Upload,
  RefreshCw,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  X,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { portfolioAPI } from "@/api/portfolio.api";
import { portfolioThemeList } from "@/components/portfolio/themes/themeRegistry";
import { useAuth } from "@/hooks/useAuth";
import { useNavigationBlocker } from "@/context/NavigationBlockerContext";
import PortfolioEditorHeader from "@/components/portfolio/PortfolioEditorHeader";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import PortfolioTemplateSelectorModal from "@/components/portfolio/PortfolioTemplateSelectorModal";
import LivePreviewPane from "@/components/portfolio/editor/LivePreviewPane";
import CertificationsPanel from "@/components/portfolio/editor/CertificationsPanel";
import PublishChecklist from "@/components/portfolio/editor/PublishChecklist";
import ProjectCoverImageField from "@/components/portfolio/editor/ProjectCoverImageField";
import CustomSectionsPanel from "@/components/portfolio/editor/CustomSectionsPanel";
import {
  EDITOR_STEPS,
  isPublishReady,
} from "@/components/portfolio/editor/editorSteps";
import { resolveImageUrl } from "@/utils/imageUrlResolver";

const blankProject = {
  title: "",
  shortDescription: "",
  longDescription: "",
  problem: "",
  solution: "",
  impact: "",
  role: "",
  duration: "",
  technologies: [],
  links: {
    live: "",
    github: "",
    caseStudy: "",
    video: "",
  },
  images: [],
  highlights: [],
  featured: false,
  visible: true,
};

const socialLinkTypes = [
  "linkedin",
  "github",
  "twitter",
  "website",
  "leetcode",
  "behance",
  "dribbble",
  "other",
];

const getProjectDescriptionPreview = (project) => {
  return (
    project.shortDescription ||
    project.longDescription ||
    project.highlights?.join(" ") ||
    "No description yet"
  );
};

const getProjectTechnologiesText = (project) => {
  if (project.technologiesText !== undefined) return project.technologiesText;
  return (project.technologies || []).join(", ");
};

const getProjectHighlightsText = (project) => {
  if (project.highlightsText !== undefined) return project.highlightsText;
  return (project.highlights || []).join("\n");
};

const getProjectImagesText = (project) => {
  if (project.imagesText !== undefined) return project.imagesText;
  return (project.images || [])
    .map((image) => [image.url, image.alt].filter(Boolean).join(" | "))
    .join("\n");
};

const imageLinesToArray = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [url, ...altParts] = line.split("|").map((part) => part.trim());

      return {
        url,
        alt: altParts.join(" | "),
        isCover: index === 0,
      };
    });

const getProjectUpdatePayload = (project) => ({
  title: project.title,
  shortDescription: project.shortDescription || "",
  longDescription: project.longDescription || "",
  problem: project.problem || "",
  solution: project.solution || "",
  impact: project.impact || "",
  role: project.role || "",
  duration: project.duration || "",
  technologies: getProjectTechnologiesText(project)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  links: {
    live: project.links?.live || "",
    github: project.links?.github || "",
    caseStudy: project.links?.caseStudy || "",
    video: project.links?.video || "",
  },
  images: imageLinesToArray(getProjectImagesText(project)),
  highlights: linesToArray(getProjectHighlightsText(project)),
  featured: Boolean(project.featured),
  visible: project.visible !== false,
});

const getExistingOrFallback = (existing, fallback) => {
  if (Array.isArray(existing) && existing.length > 0) return existing;
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  return existing || fallback || [];
};

const linesToArray = (value) => {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const commaToArray = (value) => {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const stableStringify = (value) => JSON.stringify(value || null);

const getEditorSnapshot = ({ form, projects }) =>
  stableStringify({
    form,
    projects: (projects || [])
      .filter((project) => project._id)
      .map((project) => getProjectUpdatePayload(project)),
  });

const DEFAULT_SECTION_ORDER = [
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certifications",
  "achievements",
  "customSections",
  "contact",
];

const sectionLabels = {
  about: "About",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  customSections: "Custom Sections",
  contact: "Contact",
};

const normalizeSectionOrder = (sectionOrder) =>
  [
    ...new Set([
      ...(Array.isArray(sectionOrder) ? sectionOrder : []),
      ...DEFAULT_SECTION_ORDER,
    ]),
  ].filter((section) => DEFAULT_SECTION_ORDER.includes(section));

const resizeImageToFavicon = (file, size = 64) => {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml" || file.name.endsWith(".ico")) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Center crop to 1:1 aspect ratio
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], "favicon.png", {
                  type: "image/png",
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                resolve(file);
              }
            },
            "image/png",
            1.0
          );
        } catch (err) {
          console.warn("Canvas resize failed, fallback to original file:", err);
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export default function PortfolioEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { blockNavigation, unblockNavigation } = useNavigationBlocker();
  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [newProject, setNewProject] = useState(blankProject);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingResume, setSyncingResume] = useState(false);
  const [aiAction, setAiAction] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showProfileUrlInput, setShowProfileUrlInput] = useState(false);
  const [showHeroUrlInput, setShowHeroUrlInput] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [showOgUrlInput, setShowOgUrlInput] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [showFaviconUrlInput, setShowFaviconUrlInput] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeStep, setActiveStep] = useState("profile");
  const [panelControl, setPanelControl] = useState({
    version: 0,
    open: null,
  });

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const publicUrl = useMemo(() => {
    if (!portfolio?.slug) return "";
    return `${window.location.origin}/u/${portfolio.slug}`;
  }, [portfolio?.slug]);

  const userTier =
    user?.role === "admin" ? "pro" : user?.subscription?.tier || "free";
  const isThemeAllowed = (theme) => theme.allowedTiers?.includes(userTier);

  const currentSnapshot = useMemo(
    () => (form ? getEditorSnapshot({ form, projects }) : ""),
    [form, projects]
  );
  const hasUnsavedChanges = Boolean(
    form && savedSnapshot && currentSnapshot !== savedSnapshot
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      blockNavigation(() =>
        window.confirm("You have unsaved portfolio changes. Leave anyway?")
      );
    } else {
      unblockNavigation();
    }

    return () => {
      unblockNavigation();
    };
  }, [blockNavigation, hasUnsavedChanges, unblockNavigation]);

  const confirmUnsavedNavigation = () => {
    return (
      !hasUnsavedChanges ||
      window.confirm("You have unsaved portfolio changes. Leave anyway?")
    );
  };

  const navigateWithUnsavedCheck = (to) => {
    if (confirmUnsavedNavigation()) {
      unblockNavigation();
      navigate(to);
    }
  };

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getById(id);
      const portfolioData = response.data.portfolio;
      const resumeSnapshot = response.data.resume || {};
      const hydratedPortfolio = {
        ...portfolioData,
        sectionOrder: normalizeSectionOrder(portfolioData.sectionOrder),
        skills: getExistingOrFallback(
          portfolioData.skills,
          resumeSnapshot.skills
        ),
        experience: getExistingOrFallback(
          portfolioData.experience,
          resumeSnapshot.experience
        ),
        education: getExistingOrFallback(
          portfolioData.education,
          resumeSnapshot.education
        ),
        certifications: getExistingOrFallback(
          portfolioData.certifications,
          resumeSnapshot.certifications
        ),
        achievements: getExistingOrFallback(
          portfolioData.achievements,
          resumeSnapshot.achievements
        ),
        customSections: getExistingOrFallback(
          portfolioData.customSections,
          resumeSnapshot.customSections
        ),
      };

      const finalProjects =
        Array.isArray(response.data.projects) && response.data.projects.length > 0
          ? response.data.projects
          : Array.isArray(resumeSnapshot.projects) &&
            resumeSnapshot.projects.length > 0
          ? resumeSnapshot.projects.map((p, idx) => ({
              _id: `temp-${idx}`,
              title: p.name || p.title || `Project ${idx + 1}`,
              shortDescription: p.description || p.shortDescription || "",
              longDescription:
                p.longDescription ||
                (Array.isArray(p.bullets) ? p.bullets.join("\n") : p.description || ""),
              technologies: p.technologies || [],
              links: {
                live: p.link || p.liveUrl || "",
                github: p.github || p.githubUrl || "",
                caseStudy: "",
                video: "",
              },
              highlights: p.bullets || p.highlights || [],
              featured: idx < 3,
              visible: true,
            }))
          : [];

      setPortfolio(portfolioData);
      setProjects(finalProjects);
      setForm(hydratedPortfolio);
      setSavedSnapshot(
        getEditorSnapshot({
          form: hydratedPortfolio,
          projects: finalProjects,
        })
      );
    } catch (error) {
      toast.error("Failed to load portfolio");
      console.error(error);
      navigate("/portfolio");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncResume = async () => {
    if (
      !confirm(
        "Sync all skills, projects, and work history from your linked resume? This will refresh your portfolio content."
      )
    )
      return;
    setSyncingResume(true);
    const toastId = toast.loading("Syncing latest resume data...");
    try {
      const response = await portfolioAPI.syncFromResume(id);
      const portfolioData = response.data.portfolio;
      const resumeSnapshot = response.data.resume || {};
      const hydratedPortfolio = {
        ...portfolioData,
        sectionOrder: normalizeSectionOrder(portfolioData.sectionOrder),
        skills: getExistingOrFallback(
          portfolioData.skills,
          resumeSnapshot.skills
        ),
        experience: getExistingOrFallback(
          portfolioData.experience,
          resumeSnapshot.experience
        ),
        education: getExistingOrFallback(
          portfolioData.education,
          resumeSnapshot.education
        ),
        certifications: getExistingOrFallback(
          portfolioData.certifications,
          resumeSnapshot.certifications
        ),
        achievements: getExistingOrFallback(
          portfolioData.achievements,
          resumeSnapshot.achievements
        ),
        customSections: getExistingOrFallback(
          portfolioData.customSections,
          resumeSnapshot.customSections
        ),
      };

      setPortfolio(portfolioData);
      setProjects(response.data.projects || []);
      setForm(hydratedPortfolio);
      setSavedSnapshot(
        getEditorSnapshot({
          form: hydratedPortfolio,
          projects: response.data.projects || [],
        })
      );
      toast.success("Portfolio successfully synced with your resume!", {
        id: toastId,
      });
    } catch (error) {
      console.error("Failed to sync resume:", error);
      toast.error(
        error.response?.data?.error || "Failed to sync with resume",
        { id: toastId }
      );
    } finally {
      setSyncingResume(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateNestedField = (group, field, value) => {
    setForm((current) => ({
      ...current,
      [group]: {
        ...(current[group] || {}),
        [field]: value,
      },
    }));
  };

  const updateSection = (field, value) => {
    setForm((current) => ({
      ...current,
      sections: {
        ...(current.sections || {}),
        [field]: value,
      },
    }));
  };

  const moveSection = (section, direction) => {
    setForm((current) => {
      const sectionOrder = normalizeSectionOrder(current.sectionOrder);
      const index = sectionOrder.indexOf(section);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= sectionOrder.length) {
        return current;
      }

      const nextOrder = [...sectionOrder];
      [nextOrder[index], nextOrder[nextIndex]] = [
        nextOrder[nextIndex],
        nextOrder[index],
      ];

      return { ...current, sectionOrder: nextOrder };
    });
  };

  const updateSocialLink = (index, field, value) => {
    setForm((current) => ({
      ...current,
      socialLinks: (current.socialLinks || []).map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const addSocialLink = () => {
    setForm((current) => ({
      ...current,
      socialLinks: [
        ...(current.socialLinks || []),
        { label: "", type: "website", url: "" },
      ],
    }));
  };

  const removeSocialLink = (index) => {
    setForm((current) => ({
      ...current,
      socialLinks: (current.socialLinks || []).filter(
        (_, linkIndex) => linkIndex !== index
      ),
    }));
  };

  const updateProjectDraft = (projectId, updater) => {
    setProjects((items) =>
      items.map((item) =>
        item._id === projectId
          ? {
              ...item,
              ...(typeof updater === "function" ? updater(item) : updater),
            }
          : item
      )
    );
  };

  const updatePortfolioArrayItem = (section, index, updates) => {
    setForm((current) => ({
      ...current,
      [section]: (current[section] || []).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...updates,
            }
          : item
      ),
    }));
  };

  const addPortfolioArrayItem = (section, item) => {
    setForm((current) => ({
      ...current,
      [section]: [...(current[section] || []), item],
    }));
  };

  const removePortfolioArrayItem = (section, index) => {
    setForm((current) => ({
      ...current,
      [section]: (current[section] || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const handleSave = async ({ silent = false } = {}) => {
    setSaving(true);

    try {
      const [response, projectResponses] = await Promise.all([
        portfolioAPI.update(id, form),
        Promise.all(
          projects
            .filter((project) => project._id && project.title?.trim())
            .map((project) =>
              portfolioAPI.updateProject(
                id,
                project._id,
                getProjectUpdatePayload(project)
              )
            )
        ),
      ]);
      setPortfolio(response.data.portfolio);
      setForm(response.data.portfolio);
      setProjects(projectResponses.map((item) => item.data.project));
      setSavedSnapshot(
        getEditorSnapshot({
          form: response.data.portfolio,
          projects: projectResponses.map((item) => item.data.project),
        })
      );
      if (!silent) {
        toast.success("Portfolio saved successfully!");
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save portfolio");
      console.error(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    const saved = await handleSave({ silent: true });
    if (saved) {
      unblockNavigation();
      navigate(`/portfolio/${id}/preview`);
    }
  };

  const handlePublishToggle = async () => {
    try {
      if (portfolio.status === "published") {
        const response = await portfolioAPI.unpublish(id);
        setPortfolio(response.data.portfolio);
        setForm(response.data.portfolio);
        setSavedSnapshot(
          getEditorSnapshot({
            form: response.data.portfolio,
            projects,
          })
        );
        toast.success("Portfolio unpublished");
        return;
      }

      if (!isPublishReady(form)) {
        setActiveStep("publish");
        toast.error("Complete the publish checklist before going live");
        return;
      }

      const saved = await handleSave({ silent: true });
      if (!saved) return;

      const response = await portfolioAPI.publish(id);
      setPortfolio(response.data.portfolio);
      setForm(response.data.portfolio);
      setSavedSnapshot(
        getEditorSnapshot({
          form: response.data.portfolio,
          projects,
        })
      );
      toast.success("Portfolio published live!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Publish action failed");
      console.error(error);
    }
  };

  const handleGenerateAbout = async () => {
    setAiAction("about");

    try {
      const response = await portfolioAPI.generateAbout(id, {
        targetRole: form.professionalTitle,
      });
      updateField("about", response.data.about);
      toast.success("AI generated your About section!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to generate about");
      console.error(error);
    } finally {
      setAiAction("");
    }
  };

  const handleGenerateSeo = async () => {
    setAiAction("seo");

    try {
      const response = await portfolioAPI.generateSeo(id);
      updateNestedField("seo", "title", response.data.seo?.title || "");
      updateNestedField(
        "seo",
        "description",
        response.data.seo?.description || ""
      );
      updateNestedField("seo", "keywords", response.data.seo?.keywords || []);
      toast.success("SEO metadata generated by AI!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to generate SEO");
      console.error(error);
    } finally {
      setAiAction("");
    }
  };

  const handleImproveProject = async (project) => {
    setAiAction(`project:${project._id}`);

    try {
      const response = await portfolioAPI.improveProjectDescription(id, {
        projectId: project._id,
        currentTitle: project.title,
        currentShortDescription: project.shortDescription,
        currentLongDescription: project.longDescription,
      });
      updateProjectDraft(project._id, {
        shortDescription: response.data.improved?.shortDescription,
        longDescription: response.data.improved?.longDescription,
      });
      toast.success("Project description improved by AI!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to improve project");
      console.error(error);
    } finally {
      setAiAction("");
    }
  };

  const handleSaveProject = async (project) => {
    try {
      const response = await portfolioAPI.updateProject(
        id,
        project._id,
        getProjectUpdatePayload(project)
      );
      setProjects((items) =>
        items.map((item) =>
          item._id === project._id ? response.data.project : item
        )
      );
      setSavedSnapshot(
        getEditorSnapshot({
          form,
          projects: projects.map((item) =>
            item._id === project._id ? response.data.project : item
          ),
        })
      );
      toast.success("Project saved!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save project");
      console.error(error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      toast.error("Project title is required");
      return;
    }

    try {
      const payload = {
        ...newProject,
        technologies: commaToArray(newProject.technologiesText),
        highlights: linesToArray(newProject.highlightsText),
        images:
          Array.isArray(newProject.images) && newProject.images.length > 0
            ? newProject.images
            : imageLinesToArray(newProject.imagesText),
      };
      delete payload.technologiesText;
      delete payload.highlightsText;
      delete payload.imagesText;

      const response = await portfolioAPI.createProject(id, payload);
      const nextProjects = [...projects, response.data.project];
      setProjects(nextProjects);
      setSavedSnapshot(getEditorSnapshot({ form, projects: nextProjects }));
      setNewProject(blankProject);
      toast.success("Project created!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add project");
      console.error(error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await portfolioAPI.deleteProject(id, projectId);
      const nextProjects = projects.filter((item) => item._id !== projectId);
      setProjects(nextProjects);
      setSavedSnapshot(getEditorSnapshot({ form, projects: nextProjects }));
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  const handleUploadProfilePhoto = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const oldUrl = form.profileImage;
    setUploadingProfile(true);
    const toastId = toast.loading("Uploading profile photo to Cloudinary...");
    try {
      const res = await portfolioAPI.uploadImage(file, oldUrl);
      if (res.data?.url) {
        updateField("profileImage", res.data.url);
        if (!form.seo?.ogImage || form.seo.ogImage === oldUrl) {
          updateNestedField("seo", "ogImage", res.data.url);
        }
        toast.success("Profile photo uploaded to Cloudinary!", { id: toastId });
        return;
      }
      throw new Error("No upload URL returned from cloud storage");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      toast.error(
        err.response?.data?.error || err.message || "Failed to upload to Cloudinary. Please check credentials in Super Admin.",
        { id: toastId }
      );
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    const oldUrl = form.profileImage;
    updateField("profileImage", "");
    if (form.seo?.ogImage === oldUrl) {
      updateNestedField("seo", "ogImage", "");
    }
    if (oldUrl && oldUrl.includes("cloudinary.com")) {
      portfolioAPI.deleteImage(oldUrl).catch(() => {});
    }
    toast.success("Profile photo removed (switched to text-first)");
  };

  const handleUploadHeroBanner = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const oldUrl = form.heroImage;
    setUploadingHero(true);
    const toastId = toast.loading("Uploading hero banner to Cloudinary...");
    try {
      const res = await portfolioAPI.uploadImage(file, oldUrl);
      if (res.data?.url) {
        updateField("heroImage", res.data.url);
        toast.success("Hero image uploaded to Cloudinary!", { id: toastId });
        return;
      }
      throw new Error("No upload URL returned from cloud storage");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      toast.error(
        err.response?.data?.error || err.message || "Failed to upload to Cloudinary. Please check credentials in Super Admin.",
        { id: toastId }
      );
    } finally {
      setUploadingHero(false);
    }
  };

  const handleRemoveHeroBanner = async () => {
    const oldUrl = form.heroImage;
    updateField("heroImage", "");
    if (oldUrl && oldUrl.includes("cloudinary.com")) {
      portfolioAPI.deleteImage(oldUrl).catch(() => {});
    }
    toast.success("Hero banner removed");
  };

  const handleUploadOgImage = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const oldUrl = form.seo?.ogImage;
    setUploadingOgImage(true);
    const toastId = toast.loading("Uploading social share banner to Cloudinary...");
    try {
      const res = await portfolioAPI.uploadImage(file, oldUrl);
      if (res.data?.url) {
        updateNestedField("seo", "ogImage", res.data.url);
        toast.success("Social sharing banner uploaded to Cloudinary!", { id: toastId });
        return;
      }
      throw new Error("No upload URL returned from cloud storage");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      toast.error(
        err.response?.data?.error || err.message || "Failed to upload to Cloudinary. Please check credentials in Super Admin.",
        { id: toastId }
      );
    } finally {
      setUploadingOgImage(false);
    }
  };

  const handleResetOgImage = async () => {
    const oldUrl = form.seo?.ogImage;
    updateNestedField("seo", "ogImage", "");
    if (oldUrl && oldUrl !== form.profileImage && oldUrl.includes("cloudinary.com")) {
      portfolioAPI.deleteImage(oldUrl).catch(() => {});
    }
    toast.success("Reset to Profile Photo as default social share preview!");
  };

  const handleUploadFavicon = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const oldUrl = form.seo?.favicon;
    setUploadingFavicon(true);
    const toastId = toast.loading("Processing favicon to 64x64 PNG...");
    try {
      const faviconFile = await resizeImageToFavicon(file, 64);
      toast.loading("Uploading favicon to Cloudinary...", { id: toastId });

      const res = await portfolioAPI.uploadImage(faviconFile, oldUrl);
      if (res.data?.url) {
        updateNestedField("seo", "favicon", res.data.url);
        toast.success("Favicon uploaded to Cloudinary!", { id: toastId });
        return;
      }
      throw new Error("No upload URL returned from cloud storage");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      toast.error(
        err.response?.data?.error || err.message || "Failed to upload favicon to Cloudinary. Please check credentials in Super Admin.",
        { id: toastId }
      );
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleRemoveFavicon = async () => {
    const oldUrl = form.seo?.favicon;
    updateNestedField("seo", "favicon", "");
    if (oldUrl && oldUrl.includes("cloudinary.com")) {
      portfolioAPI.deleteImage(oldUrl).catch(() => {});
    }
    toast.success("Favicon removed");
  };

  const handleCopyPublicLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success("Copied live portfolio link!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeStepIndex = EDITOR_STEPS.findIndex((step) => step.id === activeStep);
  const activeStepMeta = EDITOR_STEPS[Math.max(activeStepIndex, 0)] || EDITOR_STEPS[0];

  const goToStep = (stepId) => {
    setActiveStep(stepId);
    setPanelControl((current) => ({
      version: current.version + 1,
      open: true,
    }));
  };

  const goToAdjacentStep = (direction) => {
    const nextIndex = activeStepIndex + direction;
    if (nextIndex < 0 || nextIndex >= EDITOR_STEPS.length) return;
    goToStep(EDITOR_STEPS[nextIndex].id);
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto">
            <div className="absolute inset-0 border-3 border-gray-200 dark:border-zinc-800 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin"></div>
            <Globe2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 font-semibold tracking-wide uppercase">
            Loading Portfolio Editor...
          </p>
        </div>
      </div>
    );
  }

  const isPublished = portfolio.status === "published";

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">
      <SEO
        title={`Editing: ${form.title || "Portfolio"} | SmartNShine`}
        description="Edit, design, and configure your live developer portfolio website."
        noindex={true}
      />

      {/* Top Header */}
      <PortfolioEditorHeader
        onGoBack={() => navigateWithUnsavedCheck("/portfolio")}
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        onSave={() => handleSave()}
        onPreview={handlePreview}
        onShowTemplateSelector={() => setShowTemplateSelector(true)}
        onSyncResume={portfolio?.resumeId ? handleSyncResume : null}
        syncingResume={syncingResume}
        onPublishToggle={handlePublishToggle}
        isPublished={isPublished}
        canPublish={isPublishReady(form)}
        publicUrl={publicUrl}
        slug={portfolio.slug}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 px-3 xs:px-4 sm:px-6 lg:px-10 py-4 sm:py-8 max-w-[1600px] w-full mx-auto space-y-5 sm:space-y-8">
        {/* Stepped section navigation */}
        <div className="sticky top-[49px] xs:top-[53px] sm:top-[57px] z-30 -mx-3 xs:-mx-4 sm:mx-0 px-3 xs:px-4 sm:px-0 py-2 bg-gray-50/90 dark:bg-[#09090b]/90 backdrop-blur-md overflow-x-auto scrollbar-none flex items-center gap-1.5 sm:gap-2 border-b sm:border-b-0 border-gray-200/80 dark:border-white/[0.06]">
          {EDITOR_STEPS.map((item) => {
            const Icon = item.icon;
            const isActive = activeStep === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToStep(item.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 xs:px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                  isActive
                    ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                    : "border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hero Section Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/[0.1] bg-white dark:bg-gradient-to-b dark:from-zinc-900/95 dark:to-zinc-950/95 p-4 xs:p-5 sm:p-7 md:p-8 shadow-sm dark:shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            <div className="space-y-2 sm:space-y-2.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold ${
                    isPublished
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isPublished ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  <span>{isPublished ? "Published & Live" : "Draft (Unpublished)"}</span>
                </span>
                {form.themeId && (
                  <span className="text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/[0.08] capitalize">
                    Theme: {form.themeId}
                  </span>
                )}
              </div>

              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight break-words">
                {form.title || "Untitled Portfolio"}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                {form.professionalTitle || "Configure details, proof links, theme colors, and SEO."}
              </p>
            </div>

            {/* Public Link Pill Card */}
            {isPublished && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-xs max-w-full">
                <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-950 dark:text-emerald-200 min-w-0">
                  <Globe2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm truncate max-w-[200px] xs:max-w-[280px] sm:max-w-md">{publicUrl}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-white/10 transition-all cursor-pointer shadow-2xs"
                    title="Copy live link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 sm:p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                    title="Open live website in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Toolbar & Panel Grid */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Active step panel (8 cols) */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6">
            {/* Active step controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200/90 dark:border-white/[0.1] bg-white dark:bg-zinc-950 px-4 sm:px-6 py-3.5 sm:py-4 shadow-xs">
              <div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-300">
                  Step {activeStepIndex + 1} of {EDITOR_STEPS.length}: {activeStepMeta.label}
                </h2>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                  Edit one section at a time. Live preview updates on the right.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => goToAdjacentStep(-1)}
                  disabled={activeStepIndex <= 0}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToAdjacentStep(1)}
                  disabled={activeStepIndex >= EDITOR_STEPS.length - 1}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Profile Panel */}
            {activeStep === "profile" && (
              <PortfolioPanel
              id="section-profile"
              title="Profile & Bio"
              description="Portfolio title, role headline, slug, and bio narrative."
              icon={User}
              defaultOpen={true}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                    Portfolio Title
                  </label>
                  <input
                    value={form.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                    Professional Title / Headline
                  </label>
                  <input
                    value={form.professionalTitle || ""}
                    onChange={(e) => updateField("professionalTitle", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                    Custom URL Slug
                  </label>
                  <input
                    value={form.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                    Location
                  </label>
                  <input
                    value={form.location || ""}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Profile Photo (Visual Preview Box) */}
                <div className="rounded-2xl border border-gray-200/90 dark:border-white/[0.08] bg-gray-50/50 dark:bg-zinc-900/40 p-3.5 sm:p-5">
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 sm:gap-2">
                        <span>Profile Photo / Headshot</span>
                        {form.profileImage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ✓ Active
                          </span>
                        )}
                      </label>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        Clean portrait headshot or transparent background cutout.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProfileUrlInput(!showProfileUrlInput)}
                      className="text-[11px] text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline font-medium transition-colors cursor-pointer shrink-0"
                    >
                      {showProfileUrlInput ? "Hide URL" : "Edit URL"}
                    </button>
                  </div>

                  {form.profileImage ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 p-3 rounded-2xl bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 shadow-sm">
                      {/* Large Image Preview Box */}
                      <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-950 border-2 border-emerald-500/40 shrink-0 shadow-inner flex items-center justify-center">
                        <img
                          src={resolveImageUrl(form.profileImage)}
                          alt="Profile photo preview"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>

                      {/* Control Actions & Info */}
                      <div className="flex-1 space-y-2 text-center sm:text-left w-full sm:w-auto">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20 active:scale-95">
                            {uploadingProfile ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingProfile ? "Uploading..." : "Replace Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingProfile}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadProfilePhoto(file);
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleRemoveProfilePhoto}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Photo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Upload Dropzone Box */
                    <div className="relative rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-emerald-500 dark:hover:border-emerald-500/70 transition-all p-4 sm:p-5 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 block">
                          No profile photo added (Text-First Layout)
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400 block mt-0.5">
                          PNG cutouts, JPG, WEBP up to 8MB
                        </span>
                      </div>
                      <label className="mt-1 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                        {uploadingProfile ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingProfile ? "Uploading..." : "Upload Photo / Cutout"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingProfile}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProfilePhoto(file);
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Collapsible Manual URL Box */}
                  {showProfileUrlInput && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
                      <input
                        value={form.profileImage || ""}
                        onChange={(e) => updateField("profileImage", resolveImageUrl(e.target.value))}
                        placeholder="Paste image link, Cloudinary URL, or Google Drive link..."
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-800 dark:text-zinc-200"
                      />
                    </div>
                  )}
                </div>

                {/* Hero Banner / Cutout Image (Visual Preview Box) */}
                <div className="rounded-2xl border border-gray-200/90 dark:border-white/[0.08] bg-gray-50/50 dark:bg-zinc-900/40 p-3.5 sm:p-5">
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 sm:gap-2">
                        <span>Hero Cutout / Banner Image</span>
                        {form.heroImage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            ✓ Active
                          </span>
                        )}
                      </label>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        Prominently featured on split-hero templates.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHeroUrlInput(!showHeroUrlInput)}
                      className="text-[11px] text-gray-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 underline font-medium transition-colors cursor-pointer shrink-0"
                    >
                      {showHeroUrlInput ? "Hide URL" : "Edit URL"}
                    </button>
                  </div>

                  {form.heroImage ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 p-3 rounded-2xl bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 shadow-sm">
                      {/* Large Banner Preview Box */}
                      <div className="relative group w-full sm:w-36 h-28 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-950 border-2 border-sky-500/40 shrink-0 shadow-inner flex items-center justify-center">
                        <img
                          src={resolveImageUrl(form.heroImage)}
                          alt="Hero banner preview"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>

                      {/* Control Actions & Info */}
                      <div className="flex-1 space-y-2 text-center sm:text-left w-full sm:w-auto">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-sky-600/20 active:scale-95">
                            {uploadingHero ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingHero ? "Uploading..." : "Replace Banner"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingHero}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadHeroBanner(file);
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleRemoveHeroBanner}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Banner</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                          ✓ High resolution CDN hosting with auto WebP conversion.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Upload Dropzone Box */
                    <div className="relative rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-sky-500 dark:hover:border-sky-500/70 transition-all p-4 sm:p-5 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 block">
                          No hero banner or cutout image added
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400 block mt-0.5">
                          Upload transparent PNG cutout or landscape banner
                        </span>
                      </div>
                      <label className="mt-1 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-sky-500/20 active:scale-95">
                        {uploadingHero ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingHero ? "Uploading..." : "Upload Hero Banner / Cutout"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingHero}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadHeroBanner(file);
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Collapsible Manual URL Box */}
                  {showHeroUrlInput && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex gap-2">
                      <input
                        value={form.heroImage || ""}
                        onChange={(e) => updateField("heroImage", resolveImageUrl(e.target.value))}
                        placeholder="Paste image link, Cloudinary URL, or Google Drive link..."
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none text-gray-800 dark:text-zinc-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                  Tagline / Elevator Pitch
                </label>
                <textarea
                  value={form.tagline || ""}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  rows={2}
                  className="w-full p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200">
                    About / Executive Summary
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAbout}
                    disabled={Boolean(aiAction)}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{aiAction === "about" ? "Generating..." : "Generate with AI"}</span>
                  </button>
                </div>
                <textarea
                  value={form.about || ""}
                  onChange={(e) => updateField("about", e.target.value)}
                  rows={6}
                  className="w-full p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </PortfolioPanel>
            )}

            {/* Contact Panel */}
            {activeStep === "contact" && (
              <PortfolioPanel
              id="section-contact"
              title="Contact & Social Links"
              description="Public contact details and social media profiles."
              icon={Phone}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                    Public Email
                  </label>
                  <input
                    value={form.contact?.email || ""}
                    onChange={(e) => updateNestedField("contact", "email", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 sm:mb-2 block">
                    Public Phone
                  </label>
                  <input
                    value={form.contact?.phone || ""}
                    onChange={(e) => updateNestedField("contact", "phone", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <label className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200/90 dark:border-white/[0.1] text-xs sm:text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.contact?.showEmail !== false}
                    onChange={(e) => updateNestedField("contact", "showEmail", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Show email publicly</span>
                </label>
                <label className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200/90 dark:border-white/[0.1] text-xs sm:text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.contact?.showPhone)}
                    onChange={(e) => updateNestedField("contact", "showPhone", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Show phone publicly</span>
                </label>
              </div>

              <div className="pt-4 sm:pt-5 border-t border-gray-100 dark:border-white/[0.08] space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-300">
                    Social & Portfolio Links
                  </h3>
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(form.socialLinks || []).map((link, index) => (
                    <div
                      key={`social-${index}`}
                      className="grid gap-2.5 sm:gap-3 rounded-2xl border border-gray-200/90 dark:border-white/[0.1] p-3.5 sm:p-4 bg-white dark:bg-zinc-950 grid-cols-1 sm:grid-cols-2 md:grid-cols-[140px_1fr_1.5fr_auto] items-center shadow-2xs"
                    >
                      <select
                        value={link.type || "other"}
                        onChange={(e) => updateSocialLink(index, "type", e.target.value)}
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-semibold capitalize"
                      >
                        {socialLinkTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <input
                        value={link.label || ""}
                        onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                        placeholder="Label (e.g. GitHub)"
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-medium"
                      />
                      <input
                        value={link.url || ""}
                        onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                        placeholder="https://..."
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-mono sm:col-span-2 md:col-span-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer self-center justify-self-end md:justify-self-center"
                        title="Remove social link"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </PortfolioPanel>
            )}

            {/* Projects Panel */}
            {activeStep === "projects" && (
              <PortfolioPanel
              id="section-projects"
              title="Projects"
              description="Cards with cover images, demos, and case studies — images work even when a project is not deployed."
              icon={Rocket}
              badge={`${projects.length} items`}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              <div className="space-y-5 sm:space-y-6">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/[0.1] p-4 sm:p-6 bg-white dark:bg-zinc-950 space-y-4 sm:space-y-5 shadow-xs"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <input
                        value={project.title || ""}
                        onChange={(e) => updateProjectDraft(project._id, { title: e.target.value })}
                        className="w-full sm:flex-1 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-gray-900 dark:text-white"
                        placeholder="Project title"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleImproveProject(project)}
                          disabled={Boolean(aiAction)}
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>{aiAction === `project:${project._id}` ? "Improving..." : "AI Improve"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveProject(project)}
                          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project._id)}
                          className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3.5 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Short Overview
                        </label>
                        <textarea
                          value={project.shortDescription || ""}
                          onChange={(e) => updateProjectDraft(project._id, { shortDescription: e.target.value })}
                          rows={2}
                          className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Detailed Description
                        </label>
                        <textarea
                          value={project.longDescription || ""}
                          onChange={(e) => updateProjectDraft(project._id, { longDescription: e.target.value })}
                          rows={4}
                          className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Role
                        </label>
                        <input
                          value={project.role || ""}
                          onChange={(e) => updateProjectDraft(project._id, { role: e.target.value })}
                          placeholder="e.g. Lead Architect"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Duration
                        </label>
                        <input
                          value={project.duration || ""}
                          onChange={(e) => updateProjectDraft(project._id, { duration: e.target.value })}
                          placeholder="e.g. Jan 2026 - Mar 2026"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Technologies (comma-separated)
                        </label>
                        <input
                          value={getProjectTechnologiesText(project)}
                          onChange={(e) => updateProjectDraft(project._id, { technologiesText: e.target.value })}
                          placeholder="React, Node.js, MongoDB"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Live URL
                          <span className="ml-1 font-medium text-gray-400">(optional)</span>
                        </label>
                        <input
                          value={project.links?.live || ""}
                          onChange={(e) =>
                            updateProjectDraft(project._id, (cur) => ({
                              links: { ...(cur.links || {}), live: e.target.value },
                            }))
                          }
                          placeholder="Leave empty if not deployed"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          GitHub URL
                        </label>
                        <input
                          value={project.links?.github || ""}
                          onChange={(e) =>
                            updateProjectDraft(project._id, (cur) => ({
                              links: { ...(cur.links || {}), github: e.target.value },
                            }))
                          }
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Case Study URL
                        </label>
                        <input
                          value={project.links?.caseStudy || ""}
                          onChange={(e) =>
                            updateProjectDraft(project._id, (cur) => ({
                              links: { ...(cur.links || {}), caseStudy: e.target.value },
                            }))
                          }
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-mono"
                        />
                      </div>

                      <ProjectCoverImageField
                        images={project.images || []}
                        onChange={(nextImages) => {
                          const nextProject = {
                            ...project,
                            images: nextImages,
                          };
                          updateProjectDraft(project._id, { images: nextImages });
                          // Persist immediately so cover shows on public page without a second Save click.
                          handleSaveProject(nextProject);
                        }}
                      />

                      <div className="md:col-span-2 flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={project.visible !== false}
                            onChange={(e) =>
                              updateProjectDraft(project._id, { visible: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>Visible in Portfolio</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(project.featured)}
                            onChange={(e) =>
                              updateProjectDraft(project._id, { featured: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>Featured Hero Project ⭐</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Project Box */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gray-50/90 dark:bg-zinc-900/60 border border-gray-200/90 dark:border-white/[0.1] space-y-3.5 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-300">
                  Add New Project
                </h3>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  <input
                    placeholder="Project title *"
                    value={newProject.title}
                    onChange={(e) => setNewProject((cur) => ({ ...cur, title: e.target.value }))}
                    className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm sm:text-base font-bold"
                  />
                  <input
                    placeholder="Technologies (e.g. React, Node.js)"
                    value={newProject.technologiesText || ""}
                    onChange={(e) => setNewProject((cur) => ({ ...cur, technologiesText: e.target.value }))}
                    className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm font-medium"
                  />
                  <input
                    placeholder="Live URL"
                    value={newProject.links.live}
                    onChange={(e) =>
                      setNewProject((cur) => ({ ...cur, links: { ...cur.links, live: e.target.value } }))
                    }
                    className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-mono"
                  />
                  <input
                    placeholder="GitHub URL"
                    value={newProject.links.github}
                    onChange={(e) =>
                      setNewProject((cur) => ({ ...cur, links: { ...cur.links, github: e.target.value } }))
                    }
                    className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-mono"
                  />
                </div>
                <textarea
                  placeholder="Short project overview description..."
                  value={newProject.shortDescription}
                  onChange={(e) => setNewProject((cur) => ({ ...cur, shortDescription: e.target.value }))}
                  rows={2}
                  className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm sm:text-base leading-relaxed"
                />
                <ProjectCoverImageField
                  images={newProject.images || []}
                  onChange={(nextImages) =>
                    setNewProject((cur) => ({ ...cur, images: nextImages }))
                  }
                  hint="Add a screenshot if this project is not deployed yet."
                />
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>
            </PortfolioPanel>
            )}

            {/* Experience Panel */}
            {activeStep === "experience" && (
              <PortfolioPanel
              id="section-experience"
              title="Experience"
              description="Portfolio copy of your career work experience."
              icon={Briefcase}
              badge={`${(form.experience || []).length} roles`}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
              actions={
                <button
                  type="button"
                  onClick={() =>
                    addPortfolioArrayItem("experience", {
                      title: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      bullets: [],
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Role</span>
                </button>
              }
            >
              <div className="space-y-4 sm:space-y-5">
                {(form.experience || []).map((item, index) => (
                  <div
                    key={`exp-${index}`}
                    className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/[0.1] p-4 sm:p-6 bg-white dark:bg-zinc-950 space-y-3.5 sm:space-y-4 shadow-xs"
                  >
                    <div className="grid gap-3.5 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Role Title
                        </label>
                        <input
                          value={item.title || ""}
                          onChange={(e) => updatePortfolioArrayItem("experience", index, { title: e.target.value })}
                          placeholder="e.g. Full Stack Intern"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-bold text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Company Name
                        </label>
                        <input
                          value={item.company || ""}
                          onChange={(e) => updatePortfolioArrayItem("experience", index, { company: e.target.value })}
                          placeholder="e.g. Acme Technologies"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Location
                        </label>
                        <input
                          value={item.location || ""}
                          onChange={(e) => updatePortfolioArrayItem("experience", index, { location: e.target.value })}
                          placeholder="e.g. Remote / San Francisco, CA"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                            Start Date
                          </label>
                          <input
                            value={item.startDate || ""}
                            onChange={(e) => updatePortfolioArrayItem("experience", index, { startDate: e.target.value })}
                            placeholder="e.g. Apr 2025"
                            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                            End Date
                          </label>
                          <input
                            value={item.endDate || ""}
                            onChange={(e) => updatePortfolioArrayItem("experience", index, { endDate: e.target.value })}
                            placeholder="e.g. Jun 2025"
                            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                        Bullet Points (1 per line)
                      </label>
                      <textarea
                        value={(item.bullets || []).join("\n")}
                        onChange={(e) => updatePortfolioArrayItem("experience", index, { bullets: linesToArray(e.target.value) })}
                        rows={4}
                        className="w-full p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base leading-relaxed text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePortfolioArrayItem("experience", index)}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Experience</span>
                    </button>
                  </div>
                ))}
              </div>
            </PortfolioPanel>
            )}

            {/* Education Panel */}
            {activeStep === "education" && (
              <PortfolioPanel
              id="section-education"
              title="Education"
              description="Degrees, universities, and graduation credentials."
              icon={GraduationCap}
              badge={`${(form.education || []).length} items`}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
              actions={
                <button
                  type="button"
                  onClick={() =>
                    addPortfolioArrayItem("education", {
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
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Education</span>
                </button>
              }
            >
              <div className="space-y-4 sm:space-y-5">
                {(form.education || []).map((item, index) => (
                  <div
                    key={`edu-${index}`}
                    className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/[0.1] p-4 sm:p-6 bg-white dark:bg-zinc-950 space-y-3.5 sm:space-y-4 shadow-xs"
                  >
                    <div className="grid gap-3.5 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Institution / University
                        </label>
                        <input
                          value={item.institution || ""}
                          onChange={(e) => updatePortfolioArrayItem("education", index, { institution: e.target.value })}
                          placeholder="e.g. Stanford University"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Degree / Major
                        </label>
                        <input
                          value={item.degree || ""}
                          onChange={(e) => updatePortfolioArrayItem("education", index, { degree: e.target.value })}
                          placeholder="e.g. B.Tech in Computer Science"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          CGPA / Grade / Score / Percentage
                        </label>
                        <input
                          value={item.gpa || item.cgpa || item.grade || item.percentage || ""}
                          onChange={(e) => updatePortfolioArrayItem("education", index, { gpa: e.target.value, grade: e.target.value, cgpa: e.target.value })}
                          placeholder="e.g. 8.85 CGPA or 3.9/4.0 or 85%"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Location
                        </label>
                        <input
                          value={item.location || ""}
                          onChange={(e) => updatePortfolioArrayItem("education", index, { location: e.target.value })}
                          placeholder="e.g. Nanded, India / Cambridge, MA"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          Start Date / Year
                        </label>
                        <input
                          value={item.startDate || ""}
                          onChange={(e) => updatePortfolioArrayItem("education", index, { startDate: e.target.value })}
                          placeholder="e.g. 2021"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                          End Date / Graduation Year
                        </label>
                        <input
                          value={item.endDate || ""}
                          onChange={(e) => updatePortfolioArrayItem("education", index, { endDate: e.target.value })}
                          placeholder="e.g. 2025"
                          className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePortfolioArrayItem("education", index)}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Education</span>
                    </button>
                  </div>
                ))}
              </div>
            </PortfolioPanel>
            )}

            {/* Skills Panel */}
            {activeStep === "skills" && (
              <PortfolioPanel
              id="section-skills"
              title="Skills"
              description="Categorized skills groups shown on your portfolio."
              icon={Sparkles}
              badge={`${(form.skills || []).length} groups`}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
              actions={
                <button
                  type="button"
                  onClick={() => addPortfolioArrayItem("skills", { category: "", items: [] })}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Group</span>
                </button>
              }
            >
              <div className="space-y-3 sm:space-y-4">
                {(form.skills || []).map((group, index) => (
                  <div
                    key={`skills-${index}`}
                    className="grid gap-3 sm:gap-4 rounded-2xl border border-gray-200/90 dark:border-white/[0.1] p-3.5 sm:p-5 bg-white dark:bg-zinc-950 grid-cols-1 md:grid-cols-[200px_1fr_auto] items-center"
                  >
                    <input
                      value={group.category || ""}
                      onChange={(e) => updatePortfolioArrayItem("skills", index, { category: e.target.value })}
                      placeholder="Category (e.g. Frontend)"
                      className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-bold"
                    />
                    <input
                      value={(group.items || []).join(", ")}
                      onChange={(e) => updatePortfolioArrayItem("skills", index, { items: commaToArray(e.target.value) })}
                      placeholder="React, TypeScript, Next.js, Tailwind CSS"
                      className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => removePortfolioArrayItem("skills", index)}
                      className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer self-center justify-self-end md:justify-self-center"
                      title="Remove skill category"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </PortfolioPanel>
            )}

            {/* Achievements Panel */}
            
            {activeStep === "certifications" && (
              <CertificationsPanel
                certifications={form.certifications || []}
                onAdd={(item) => addPortfolioArrayItem("certifications", item)}
                onUpdate={(index, updates) =>
                  updatePortfolioArrayItem("certifications", index, updates)
                }
                onRemove={(index) =>
                  removePortfolioArrayItem("certifications", index)
                }
                forceState={panelControl.open}
                forceVersion={panelControl.version}
              />
            )}

{activeStep === "achievements" && (
              <PortfolioPanel
              id="section-achievements"
              title="Achievements & Honors"
              description="Competition wins, rankings, and awards (1 per line)."
              icon={Trophy}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              <textarea
                value={(form.achievements || []).join("\n")}
                onChange={(e) => updateField("achievements", linesToArray(e.target.value))}
                rows={5}
                className="w-full p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/90 text-sm sm:text-base leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="• Winner - Smart India Hackathon 2025&#10;• AWS Certified Solutions Architect"
              />
            </PortfolioPanel>
            )}

            {/* Custom Sections */}
            {activeStep === "custom" && (
              <CustomSectionsPanel
                sections={form.customSections || []}
                onAddSection={(section) =>
                  addPortfolioArrayItem("customSections", section)
                }
                onUpdateSection={(index, updates) =>
                  updatePortfolioArrayItem("customSections", index, updates)
                }
                onRemoveSection={(index) =>
                  removePortfolioArrayItem("customSections", index)
                }
                forceState={panelControl.open}
                forceVersion={panelControl.version}
              />
            )}

            {/* Theme Customizer Panel */}
            {activeStep === "theme" && (
              <PortfolioPanel
              id="section-theme"
              title="Theme Design"
              description="Choose aesthetic style & accent colors."
              icon={Palette}
              defaultOpen={true}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              {(() => {
                const activeTheme = portfolioThemeList.find(
                  (t) => t.id === (form.themeId || "smartnshine")
                ) || portfolioThemeList[0];
                const presets = activeTheme?.accentPresets || [];
                const currentAccent = form.themeAccent || presets[0] || "";

                return (
                  <div className="space-y-3.5 sm:space-y-4">
                    {/* Active Selected Theme Card */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Active Template
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          {activeTheme.category}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{activeTheme.name}</span>
                          {activeTheme.badge && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-bold">
                              {activeTheme.badge}
                            </span>
                          )}
                        </h4>
                        <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {activeTheme.subtitle || activeTheme.description}
                        </p>
                      </div>

                      {/* Browse All Templates Button */}
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(true)}
                        className="w-full flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer group"
                      >
                        <LayoutTemplate className="w-4 h-4 text-emerald-400 dark:text-emerald-600 group-hover:rotate-12 transition-transform" />
                        <span>Browse & Switch Templates</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-white/10 dark:bg-black/10 font-normal">
                          {portfolioThemeList.length} Styles
                        </span>
                      </button>
                    </div>

                    {/* Accent Colour Customizer */}
                    <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200">
                          Theme Accent Color
                        </p>
                        <span className="text-[10px] font-mono text-gray-400">
                          {currentAccent}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        {presets.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            title={hex}
                            onClick={() => updateField("themeAccent", hex)}
                            style={{ background: hex }}
                            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                              currentAccent === hex
                                ? "border-gray-900 dark:border-white scale-110 ring-2 ring-offset-1 ring-emerald-500"
                                : "border-transparent"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Kinetic Marquee Ribbon Customizer */}
                    {activeTheme.id === "kinetic" && (
                      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200">
                            Kinetic Marquee Ribbons
                          </p>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            Editable
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[11px] font-mono text-gray-500 dark:text-zinc-400">
                            Top Marquee Ribbon (Separated by ×)
                          </label>
                          <input
                            type="text"
                            value={form.settings?.marqueeText1 || ""}
                            onChange={(e) => updateNestedField("settings", "marqueeText1", e.target.value)}
                            placeholder="e.g. FULL STACK × REACT × NODE.JS × ARCHITECTURE"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[11px] font-mono text-gray-500 dark:text-zinc-400">
                            Bottom Marquee Ribbon (Separated by ×)
                          </label>
                          <input
                            type="text"
                            value={form.settings?.marqueeText2 || ""}
                            onChange={(e) => updateNestedField("settings", "marqueeText2", e.target.value)}
                            placeholder="e.g. PRODUCT DESIGN × PERFORMANCE × SCALABLE CODE"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                          Leave blank to automatically generate dynamic marquee text from your real skills & role.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </PortfolioPanel>
            )}

            {/* Sections Visibility & Ordering Panel */}
            {activeStep === "order" && (
              <PortfolioPanel
              id="section-order"
              title="Sections Ordering"
              description="Toggle visibility and rearrange sections."
              icon={Sliders}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              <div className="space-y-2 sm:space-y-2.5">
                {normalizeSectionOrder(form.sectionOrder).map((section, index) => {
                  const visibilityKey = `show${section.charAt(0).toUpperCase() + section.slice(1)}`;

                  return (
                    <div
                      key={section}
                      className="flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-gray-200/90 dark:border-white/[0.1] p-3 sm:p-3.5 bg-white dark:bg-zinc-950"
                    >
                      <label className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={form.sections?.[visibilityKey] !== false}
                          onChange={(e) => updateSection(visibilityKey, e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 shrink-0"
                        />
                        <span className="truncate">{sectionLabels[section] || section}</span>
                      </label>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveSection(section, -1)}
                          disabled={index === 0}
                          className="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(section, 1)}
                          disabled={index === normalizeSectionOrder(form.sectionOrder).length - 1}
                          className="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PortfolioPanel>
            )}

            {/* SEO Panel */}
            {activeStep === "seo" && (
              <PortfolioPanel
              id="section-seo"
              title="SEO Metadata"
              description="Search engine and social preview tags."
              icon={Search}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
              actions={
                <button
                  type="button"
                  onClick={handleGenerateSeo}
                  disabled={Boolean(aiAction)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{aiAction === "seo" ? "Generating..." : "AI SEO"}</span>
                </button>
              }
            >
              <div className="space-y-3.5 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                    Meta Title
                  </label>
                  <input
                    value={form.seo?.title || ""}
                    onChange={(e) => updateNestedField("seo", "title", e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                    Meta Description
                  </label>
                  <textarea
                    value={form.seo?.description || ""}
                    onChange={(e) => updateNestedField("seo", "description", e.target.value)}
                    rows={3}
                    className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm leading-relaxed"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 mb-1.5 block">
                    Keywords
                  </label>
                  <input
                    value={(form.seo?.keywords || []).join(", ")}
                    onChange={(e) =>
                      updateNestedField(
                        "seo",
                        "keywords",
                        commaToArray(e.target.value)
                      )
                    }
                    placeholder="react, full stack, portfolio, your name"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm sm:text-base"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-500 dark:text-zinc-400">
                    Comma-separated. AI SEO can generate these, or edit them manually.
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 block">
                        Social Sharing Card Image (OG / Twitter Preview)
                      </label>
                      {form.seo?.ogImage ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Custom Banner
                        </span>
                      ) : form.profileImage ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ✓ Default: Profile Photo
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOgUrlInput(!showOgUrlInput)}
                      className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0"
                    >
                      {showOgUrlInput ? "Hide URL Field" : "Edit URL Directly"}
                    </button>
                  </div>

                  {/* Visual Preview + Action Controls Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-zinc-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      {(form.seo?.ogImage || form.profileImage) ? (
                        <img
                          src={resolveImageUrl(form.seo?.ogImage || form.profileImage)}
                          alt="Social Card Preview"
                          className="w-14 h-11 sm:w-16 sm:h-12 rounded-xl object-cover border border-gray-200 dark:border-white/10 shrink-0 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-14 h-11 sm:w-16 sm:h-12 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200 block truncate">
                          {form.seo?.ogImage
                            ? "Custom Social Banner active"
                            : form.profileImage
                            ? "Default Profile Photo active"
                            : "No image set (Text preview only)"}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400 block truncate">
                          {form.seo?.ogImage
                            ? "Overriding default profile photo for social previews."
                            : form.profileImage
                            ? "Shared automatically on LinkedIn, WhatsApp, etc."
                            : "Upload a photo or custom card banner."}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                      {/* Upload Custom OG Button */}
                      <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition-all shadow-sm cursor-pointer">
                        {uploadingOgImage ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{form.seo?.ogImage ? "Replace Banner" : "Upload Banner"}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingOgImage}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadOgImage(e.target.files[0]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>

                      {/* Reset to Profile Photo button */}
                      {form.seo?.ogImage && (
                        <button
                          type="button"
                          onClick={handleResetOgImage}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                          title="Reset to default Profile Photo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Use Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Direct URL Input Field */}
                  {showOgUrlInput && (
                    <div className="mt-3">
                      <input
                        value={form.seo?.ogImage || ""}
                        onChange={(e) => updateNestedField("seo", "ogImage", e.target.value)}
                        placeholder={form.profileImage ? "Leave empty to use Profile Photo, or enter custom URL" : "https://example.com/og-banner.png"}
                        className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
                    Displayed automatically as the visual card when your portfolio link is shared on WhatsApp, LinkedIn, X/Twitter, Discord, etc.
                  </p>
                </div>

                {/* Favicon Upload & Browser Tab Preview Card */}
                <div className="rounded-2xl border border-gray-200/90 dark:border-white/[0.08] bg-gray-50/50 dark:bg-zinc-900/40 p-3.5 sm:p-5">
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 sm:gap-2">
                        <span>Browser Tab Favicon</span>
                        {form.seo?.favicon ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ✓ Custom 64×64 Favicon
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-200/60 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-300/40 dark:border-white/5">
                            Default Icon
                          </span>
                        )}
                      </label>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        Uploaded image is auto-cropped and resized to a crisp 64×64 PNG.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFaviconUrlInput(!showFaviconUrlInput)}
                      className="text-[11px] text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 underline font-medium transition-colors cursor-pointer shrink-0"
                    >
                      {showFaviconUrlInput ? "Hide URL" : "Edit URL"}
                    </button>
                  </div>

                  {/* Browser Tab Live Mockup Preview */}
                  <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                    <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">
                      Browser Tab Preview
                    </span>
                    <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-t-lg bg-gray-100 dark:bg-zinc-800/90 border-t border-x border-gray-200 dark:border-white/10 shadow-xs max-w-full">
                      <div className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0 overflow-hidden bg-white/60 dark:bg-zinc-950/60">
                        {form.seo?.favicon ? (
                          <img
                            src={form.seo.favicon}
                            alt="Favicon"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <Globe2 className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[240px]">
                        {form.seo?.title || form.title || "My Portfolio"}
                      </span>
                      <X className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 ml-1 shrink-0 opacity-60" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-amber-500/20 active:scale-95">
                      {uploadingFavicon ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingFavicon ? "Converting & Uploading..." : form.seo?.favicon ? "Replace Favicon" : "Upload Favicon (Auto 64×64)"}</span>
                      <input
                        type="file"
                        accept="image/*,.ico,.svg"
                        className="hidden"
                        disabled={uploadingFavicon}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadFavicon(e.target.files[0]);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>

                    {form.seo?.favicon && (
                      <button
                        type="button"
                        onClick={handleRemoveFavicon}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
                        title="Remove custom favicon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Optional Direct URL Input Field */}
                  {showFaviconUrlInput && (
                    <div className="mt-3">
                      <input
                        value={form.seo?.favicon || ""}
                        onChange={(e) => updateNestedField("seo", "favicon", e.target.value)}
                        placeholder="https://example.com/favicon.png or .ico"
                        className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </PortfolioPanel>
            )}

            {/* Publish Settings Panel */}
            {activeStep === "publish" && (
              <PortfolioPanel
              id="section-publish"
              title="Publish Settings"
              description="Control recruiter downloads and indexing."
              icon={Globe2}
              defaultOpen={true}
              forceState={panelControl.open}
              forceVersion={panelControl.version}
            >
              <div className="space-y-3 sm:space-y-3.5">
                <PublishChecklist form={form} />
                <label className="flex items-start gap-3 text-xs sm:text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings?.showResumeDownload !== false}
                    onChange={(e) => updateNestedField("settings", "showResumeDownload", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5 shrink-0"
                  />
                  <span>Show "Download Resume" button</span>
                </label>
                <label className="flex items-start gap-3 text-xs sm:text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings?.allowIndexing !== false}
                    onChange={(e) => updateNestedField("settings", "allowIndexing", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5 shrink-0"
                  />
                  <span>Allow Google & search engine indexing</span>
                </label>
                <label className="flex items-start gap-3 text-xs sm:text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings?.showSmartNShineBranding !== false}
                    onChange={(e) => updateNestedField("settings", "showSmartNShineBranding", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5 shrink-0"
                  />
                  <span>Show SmartNShine badge</span>
                </label>
              </div>
            </PortfolioPanel>
            )}

          </div>

          {/* Right Column: Live preview */}
          <aside className="hidden lg:block lg:col-span-4 space-y-5 sm:space-y-6 lg:sticky lg:top-20">
            <LivePreviewPane
              form={form}
              resume={portfolio?.resumeSnapshot}
              projects={projects}
            />
          </aside>
        </div>
      </main>

      {/* Portfolio Template Selector Modal */}
      <PortfolioTemplateSelectorModal
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        selectedThemeId={form.themeId || "smartnshine"}
        onApplyTheme={(themeId) => updateField("themeId", themeId)}
        form={form}
        resume={portfolio?.resumeSnapshot}
        projects={projects}
        userTier={userTier}
      />
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FileBox,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Award,
  Crown,
  Tag,
  Eye,
  Sliders,
  Check,
  X,
  Lock,
  Unlock,
  Zap,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Shield,
  Star,
  ExternalLink,
  HelpCircle,
  Copy,
  ChevronRight,
  Palette,
  Loader2,
} from "lucide-react";
import {
  getAllTemplates,
  getTemplateStats,
  syncDefaultTemplates,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  generateTemplateSeoWithAI,
  deleteTemplate,
} from "@/api/admin.api";
import { ConfirmationModal } from "@/components/common";
import { TEMPLATES } from "@/components/editor/templateConfig";
import React, { Component } from "react";

// Safe Error Boundary for Preview Simulator
class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Preview Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// Sample resume data compatible with both legacy and new template props
const SAMPLE_PREVIEW_RESUME = {
  name: "Alex Morgan",
  contact: {
    email: "alex.morgan@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/alexmorgan",
    github: "https://github.com/alexmorgan",
    website: "https://alexmorgan.dev",
  },
  personalInfo: {
    fullName: "Alex Morgan",
    jobTitle: "Senior Full-Stack Engineer & Architect",
    email: "alex.morgan@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/alexmorgan",
    github: "https://github.com/alexmorgan",
    portfolio: "https://alexmorgan.dev",
    website: "https://alexmorgan.dev",
    summary:
      "Results-driven Senior Full-Stack Engineer with 7+ years of experience designing fault-tolerant microservices, modern React interfaces, and scalable cloud architectures. Led teams to improve platform performance by 45% and reduced AWS infrastructure costs by $120K annually.",
  },
  summary:
    "Results-driven Senior Full-Stack Engineer with 7+ years of experience designing fault-tolerant microservices, modern React interfaces, and scalable cloud architectures. Led teams to improve platform performance by 45% and reduced AWS infrastructure costs by $120K annually.",
  experience: [
    {
      id: "exp-1",
      title: "Lead Software Engineer",
      position: "Lead Software Engineer",
      company: "Stripe Cloud Platforms",
      location: "San Francisco, CA",
      startDate: "2021",
      endDate: "Present",
      current: true,
      bullets: [
        "Spearheaded architecture of global checkout orchestration engine serving 4.5M+ daily requests with 99.99% uptime.",
        "Mentored 12 mid/senior engineers and instituted automated ATS compliance pipelines.",
        "Optimized Node.js/GraphQL bottlenecks, slashing p99 latency from 320ms to 85ms.",
      ],
      description:
        "• Spearheaded architecture of global checkout orchestration engine serving 4.5M+ daily requests with 99.99% uptime.\n• Mentored 12 mid/senior engineers and instituted automated ATS compliance pipelines.\n• Optimized Node.js/GraphQL bottlenecks, slashing p99 latency from 320ms to 85ms.",
    },
    {
      id: "exp-2",
      title: "Senior Frontend Engineer",
      position: "Senior Frontend Engineer",
      company: "Acme Enterprise AI",
      location: "Austin, TX",
      startDate: "2018",
      endDate: "2021",
      current: false,
      bullets: [
        "Designed and shipped a real-time collaborative dashboard using React, TailwindCSS, and WebSockets.",
        "Increased user retention by 28% through intuitive UX workflows and sub-second page loads.",
      ],
      description:
        "• Designed and shipped a real-time collaborative dashboard using React, TailwindCSS, and WebSockets.\n• Increased user retention by 28% through intuitive UX workflows and sub-second page loads.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.S. in Computer Science",
      institution: "University of California, Berkeley",
      school: "University of California, Berkeley",
      location: "Berkeley, CA",
      startDate: "2014",
      endDate: "2018",
      graduationDate: "2018",
      gpa: "3.9 / 4.0",
      grade: "3.9 GPA • Magna Cum Laude",
    },
  ],
  skills: [
    {
      category: "Frontend & Architecture",
      items: [
        "JavaScript (ESNext)",
        "TypeScript",
        "React.js",
        "Next.js",
        "TailwindCSS",
        "Redux Toolkit",
      ],
    },
    {
      category: "Backend & Cloud",
      items: [
        "Node.js",
        "GraphQL",
        "PostgreSQL",
        "MongoDB",
        "Docker",
        "Kubernetes",
        "AWS (ECS/Lambda)",
      ],
    },
    {
      category: "Engineering Practices",
      items: [
        "CI/CD Pipelines",
        "System Design",
        "Microservices",
        "TDD / Jest",
        "ATS Optimization",
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "ATS Resume Analyzer & Career Studio",
      title: "ATS Resume Analyzer & Career Studio",
      technologies: "React, Node.js, GPT-4o, MongoDB",
      link: "https://github.com/alexmorgan/ats-resume",
      bullets: [
        "Engineered an automated semantic resume parser with deep keyword extraction and instant score optimization.",
        "Integrated secure token budgeting and responsive multi-column template rendering.",
      ],
      description:
        "Engineered an automated semantic resume parser with deep keyword extraction and instant score optimization.",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023",
    },
  ],
  achievements: [
    "Published author on distributed state synchronization in high-concurrency web applications.",
    "First Place Winner at Global Cloud Architecture Hackathon 2022.",
  ],
  customSections: [],
  selectedTheme: "navy",
  sectionOrder: [
    "summary",
    "skills",
    "experience",
    "education",
    "projects",
    "certifications",
  ],
};

const CATEGORY_OPTIONS = [
  { id: "all", label: "All Categories" },
  { id: "Professional", label: "Professional" },
  { id: "Tech", label: "Tech & Dev" },
  { id: "Creative", label: "Creative & Design" },
  { id: "Leadership", label: "Executive Leadership" },
  { id: "Modern", label: "Modern" },
  { id: "Minimal", label: "Minimal" },
];

const TIER_OPTIONS = [
  { id: "all", label: "All Access Tiers" },
  { id: "free", label: "Free Starter (₹0)" },
  { id: "one-time", label: "One-Time 21-Day Pass (₹49)" },
  { id: "pro", label: "Pro Unlimited (₹199)" },
];

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    freeTier: 0,
    oneTimeTier: 0,
    proTier: 0,
    averageAtsScore: 95,
    byCategory: {},
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [modalTab, setModalTab] = useState("general"); // "general" | "seo"
  const [generatingSeo, setGeneratingSeo] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    templateId: "",
    name: "",
    category: "Professional",
    emoji: "📄",
    atsScore: 95,
    tier: "free",
    badge: "",
    description: "",
    tags: "",
    isActive: true,
    isFeatured: false,
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      targetSearchQueries: "",
      faqItems: [],
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, statsRes] = await Promise.all([
        getAllTemplates({ limit: 100 }),
        getTemplateStats().catch(() => ({ data: { data: null } })),
      ]);

      const items = templatesRes.data?.data?.templates || [];
      setTemplates(items);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
      toast.error(err.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      previewTemplate ||
      showAddModal ||
      showEditModal ||
      deleteConfirmTemplate
    );

    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow || "unset";
      };
    }
  }, [previewTemplate, showAddModal, showEditModal, deleteConfirmTemplate]);

  // Handle Sync Defaults
  const handleSyncDefaults = async () => {
    try {
      setSyncing(true);
      const res = await syncDefaultTemplates();
      toast.success(res.data.message || "Templates synchronized successfully!");
      fetchData();
    } catch (err) {
      console.error("Sync error:", err);
      toast.error(err.response?.data?.message || "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (tpl) => {
    const newStatus = !tpl.isActive;
    setTogglingId(tpl._id);

    // Optimistic Update
    setTemplates((prev) =>
      prev.map((item) =>
        item._id === tpl._id ? { ...item, isActive: newStatus } : item
      )
    );

    try {
      await updateTemplateStatus(tpl._id, newStatus);
      toast.success(
        newStatus
          ? `Template '${tpl.name}' is now ACTIVE`
          : `Template '${tpl.name}' is now INACTIVE`
      );
      // Refresh stats
      getTemplateStats()
        .then((res) => {
          if (res.data?.data) setStats(res.data.data);
        })
        .catch(() => {});
    } catch (err) {
      console.error("Status toggle error:", err);
      // Revert on error
      setTemplates((prev) =>
        prev.map((item) =>
          item._id === tpl._id ? { ...item, isActive: !newStatus } : item
        )
      );
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (tpl) => {
    setSelectedTemplate(tpl);
    setModalTab("general");
    setFormData({
      templateId: tpl.templateId || "",
      name: tpl.name || "",
      category: tpl.category || "Professional",
      emoji: tpl.emoji || "📄",
      atsScore: tpl.atsScore ?? 95,
      tier: tpl.tier || "free",
      badge: tpl.badge || "",
      description: tpl.description || "",
      tags: Array.isArray(tpl.tags) ? tpl.tags.join(", ") : "",
      isActive: tpl.isActive ?? true,
      isFeatured: tpl.isFeatured ?? false,
      seo: {
        metaTitle: tpl.seo?.metaTitle || `${tpl.name} Resume Template - 98% ATS Score | SmartNShine`,
        metaDescription:
          tpl.seo?.metaDescription ||
          `Build an interview-ready ${tpl.category || "professional"} resume with our top-rated ATS-optimized ${tpl.name} template. Free PDF export & high recruiter pass rate.`,
        keywords: Array.isArray(tpl.seo?.keywords)
          ? tpl.seo.keywords.join(", ")
          : "resume, professional resume, ATS resume templates, modern resume format, free CV maker",
        targetSearchQueries: Array.isArray(tpl.seo?.targetSearchQueries)
          ? tpl.seo.targetSearchQueries.join(", ")
          : `best ${tpl.category?.toLowerCase() || "professional"} resume template, ATS friendly resume, professional resume download`,
        faqItems:
          Array.isArray(tpl.seo?.faqItems) && tpl.seo.faqItems.length > 0
            ? tpl.seo.faqItems
            : [
                {
                  question: `Why does the ${tpl.name} template achieve a 95+ ATS score?`,
                  answer: `This template uses clean single-column structure and standard semantic section markers to ensure 95+ parser scoring and seamless readability across Workday, Taleo, and Greenhouse ATS algorithms.`,
                },
                {
                  question: `Can I customize colors and sections in ${tpl.name}?`,
                  answer: `Yes, you can select custom color palettes, rearrange section ordering, and export directly in ATS-compatible PDF format with zero layout shifts.`,
                },
              ],
      },
    });
    setShowEditModal(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalTab("general");
    setFormData({
      templateId: "",
      name: "",
      category: "Professional",
      emoji: "📄",
      atsScore: 95,
      tier: "free",
      badge: "",
      description: "",
      tags: "ATS-Optimized, Clean, Modern",
      isActive: true,
      isFeatured: false,
      seo: {
        metaTitle: "",
        metaDescription: "",
        keywords: "resume, professional resume, ATS resume templates, modern CV format, free resume maker",
        targetSearchQueries: "best professional resume template, ATS friendly resume, resume format download",
        faqItems: [
          {
            question: "Why is this resume template ATS-friendly?",
            answer: "It utilizes standard section hierarchy, readable typography, and clean bullet formatting that applicant tracking systems parse seamlessly.",
          },
        ],
      },
    });
    setShowAddModal(true);
  };

  // 1-Click AI SEO Generator Handler
  const handleGenerateAISeo = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a template name first");
      return;
    }

    try {
      setGeneratingSeo(true);
      toast.loading("🤖 AI is analyzing template & crafting Google #1 SEO...", {
        id: "ai-seo-gen",
      });

      const res = await generateTemplateSeoWithAI({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        atsScore: formData.atsScore,
        tier: formData.tier,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });

      if (res.data?.success && res.data?.data) {
        const seoData = res.data.data;
        setFormData((prev) => ({
          ...prev,
          seo: {
            metaTitle: seoData.metaTitle || prev.seo.metaTitle,
            metaDescription: seoData.metaDescription || prev.seo.metaDescription,
            keywords: Array.isArray(seoData.keywords)
              ? seoData.keywords.join(", ")
              : seoData.keywords || prev.seo.keywords,
            targetSearchQueries: Array.isArray(seoData.targetSearchQueries)
              ? seoData.targetSearchQueries.join(", ")
              : seoData.targetSearchQueries || prev.seo.targetSearchQueries,
            faqItems:
              Array.isArray(seoData.faqItems) && seoData.faqItems.length > 0
                ? seoData.faqItems
                : prev.seo.faqItems,
          },
        }));
        toast.success("✨ AI SEO metadata & Google rich snippets generated!", {
          id: "ai-seo-gen",
        });
      } else {
        toast.error("Could not generate AI SEO, using high-quality defaults", {
          id: "ai-seo-gen",
        });
      }
    } catch (err) {
      console.error("AI SEO error:", err);
      toast.error(
        err.response?.data?.message || "Failed to generate AI SEO metadata",
        { id: "ai-seo-gen" }
      );
    } finally {
      setGeneratingSeo(false);
    }
  };

  // FAQ item helpers
  const handleAddFaqItem = () => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        faqItems: [
          ...(prev.seo.faqItems || []),
          { question: "", answer: "" },
        ],
      },
    }));
  };

  const handleRemoveFaqItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        faqItems: prev.seo.faqItems.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleFaqChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.seo.faqItems || [])];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        seo: {
          ...prev.seo,
          faqItems: updated,
        },
      };
    });
  };

  // Handle Form Submit (Create / Edit)
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const payload = {
      ...formData,
      templateId: formData.templateId.trim().toLowerCase(),
      name: formData.name.trim(),
      atsScore: Number(formData.atsScore) || 95,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      seo: {
        metaTitle: formData.seo.metaTitle.trim(),
        metaDescription: formData.seo.metaDescription.trim(),
        keywords: formData.seo.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        targetSearchQueries: formData.seo.targetSearchQueries
          .split(",")
          .map((q) => q.trim())
          .filter(Boolean),
        faqItems: (formData.seo.faqItems || []).filter(
          (f) => f.question?.trim() && f.answer?.trim()
        ),
      },
    };

    try {
      setSubmitting(true);
      if (showEditModal && selectedTemplate) {
        await updateTemplate(selectedTemplate._id, payload);
        toast.success(`Template '${payload.name}' & SEO updated successfully!`);
        setShowEditModal(false);
      } else {
        await createTemplate(payload);
        toast.success(`Template '${payload.name}' & SEO created successfully!`);
        setShowAddModal(false);
      }
      fetchData();
    } catch (err) {
      console.error("Save template error:", err);
      toast.error(err.response?.data?.message || "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async () => {
    if (!deleteConfirmTemplate) return;

    try {
      setSubmitting(true);
      await deleteTemplate(deleteConfirmTemplate._id);
      toast.success(
        `Template '${deleteConfirmTemplate.name}' deleted successfully`
      );
      setDeleteConfirmTemplate(null);
      fetchData();
    } catch (err) {
      console.error("Delete template error:", err);
      toast.error(err.response?.data?.message || "Failed to delete template");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        tpl.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.templateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Category
      const matchesCategory =
        selectedCategory === "all" ||
        tpl.category?.toLowerCase() === selectedCategory.toLowerCase();

      // Tier
      const matchesTier =
        selectedTier === "all" || tpl.tier === selectedTier;

      // Status
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" ? tpl.isActive : !tpl.isActive);

      return (
        matchesSearch && matchesCategory && matchesTier && matchesStatus
      );
    });
  }, [templates, searchTerm, selectedCategory, selectedTier, selectedStatus]);

  // Find component for Preview Modal
  const PreviewComponent = useMemo(() => {
    if (!previewTemplate) return null;
    const found = TEMPLATES.find(
      (t) =>
        t.id.toLowerCase() ===
        (previewTemplate.templateId || previewTemplate.name).toLowerCase()
    );
    return found ? found.component : null;
  }, [previewTemplate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md mb-2">
            <FileBox className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
              Template Studio & Access Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Resume Template Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Configure ATS scoring algorithms, manage premium tier locks, toggle
            availability, and preview resume layouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <span>Total Catalog</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 dark:text-white">
              {stats.total || templates.length}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {stats.active || templates.filter((t) => t.isActive).length} Active
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Engineered for ATS parsing
          </p>
        </div>

        {/* Card 2: Free vs Premium */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <span>Tier Access</span>
            <Crown className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {stats.proTier + stats.oneTimeTier ||
                templates.filter((t) => t.tier !== "free").length}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Paid / {stats.freeTier || templates.filter((t) => t.tier === "free").length} Free
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Pro & One-Time Pass unlocks
          </p>
        </div>

        {/* Card 3: Average ATS Score */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <span>Avg. ATS Score</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.averageAtsScore || 96}%
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              Grade A+
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Across standard resume models
          </p>
        </div>

        {/* Card 4: Featured / Popular */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <span>Featured</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {stats.featuredCount || templates.filter((t) => t.isFeatured).length}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Showcased
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Top picks on home & gallery
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search templates by name, ID, tags, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.label}
                </option>
              ))}
            </select>

            {/* Tier Dropdown */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  💎 {t.label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">⚡ All Status</option>
              <option value="active">🟢 Active Only</option>
              <option value="inactive">🔴 Inactive Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-white/5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 pt-1 border-t border-gray-100 dark:border-white/5">
          <span>
            Showing <strong>{filteredTemplates.length}</strong> of{" "}
            <strong>{templates.length}</strong> templates
          </span>
          {(searchTerm ||
            selectedCategory !== "all" ||
            selectedTier !== "all" ||
            selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedTier("all");
                setSelectedStatus("all");
              }}
              className="text-blue-600 dark:text-cyan-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TEMPLATE LISTING: GRID OR TABLE */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-600 dark:text-zinc-400">
            Loading ATS templates catalog...
          </p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              No matching templates found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Try adjusting your search query, clearing filters, or create a new template.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Template</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => {
            const isToggling = togglingId === tpl._id;
            const isFree = tpl.tier === "free";
            const isPro = tpl.tier === "pro";
            const isOneTime = tpl.tier === "one-time";

            return (
              <div
                key={tpl._id}
                className={`bg-white dark:bg-zinc-900/90 border rounded-2xl p-5 space-y-4 transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
                  tpl.isActive
                    ? "border-gray-200 dark:border-white/10"
                    : "border-rose-200 dark:border-rose-500/20 opacity-75 bg-gray-50/50 dark:bg-zinc-950/50"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Emoji, Name, Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {tpl.emoji || "📄"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                            {tpl.name}
                          </h4>
                          {tpl.isFeatured && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 block">
                          ID: {tpl.templateId}
                        </span>
                      </div>
                    </div>

                    {/* Master Active/Inactive Toggle */}
                    <button
                      onClick={() => handleToggleStatus(tpl)}
                      disabled={isToggling}
                      title={tpl.isActive ? "Click to disable" : "Click to enable"}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                        tpl.isActive
                          ? "bg-emerald-500"
                          : "bg-gray-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          tpl.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      >
                        {isToggling && (
                          <Loader2 className="w-2.5 h-2.5 text-emerald-600 animate-spin" />
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Pills Bar: Category, Tier, ATS Score */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Category */}
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-bold">
                      {tpl.category || "Professional"}
                    </span>

                    {/* ATS Score */}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {tpl.atsScore ?? 95}% ATS
                    </span>

                    {/* Tier */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isFree
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : isOneTime
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {isFree
                        ? "Starter (Free)"
                        : isOneTime
                        ? "One-Time (₹49)"
                        : "Pro Plan"}
                    </span>

                    {/* Custom Badge if any */}
                    {tpl.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                        {tpl.badge}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {tpl.description ||
                      "High-impact ATS compliant single/multi-column resume template with optimized typography."}
                  </p>

                  {/* Tags */}
                  {Array.isArray(tpl.tags) && tpl.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tpl.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-sm bg-gray-50 dark:bg-zinc-800/60 text-gray-500 dark:text-zinc-400 text-[9px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {tpl.tags.length > 3 && (
                        <span className="text-[9px] text-gray-400 self-center">
                          +{tpl.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 mt-3">
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-bold rounded-xl transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>

                  <button
                    onClick={() => {
                      openEditModal(tpl);
                      setModalTab("seo");
                    }}
                    className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl transition-all"
                    title="Open AI SEO & Google Ranking Studio"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openEditModal(tpl)}
                    className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl transition-all"
                    title="Edit Template Configuration"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmTemplate(tpl)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition-all"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-800/40 text-[11px] font-black uppercase text-gray-500 dark:text-zinc-400 tracking-wider">
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Access Tier</th>
                  <th className="py-3.5 px-4">ATS Compatibility</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                {filteredTemplates.map((tpl) => (
                  <tr
                    key={tpl._id}
                    className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tpl.emoji || "📄"}</span>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{tpl.name}</span>
                            {tpl.isFeatured && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-gray-400">
                            {tpl.templateId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-zinc-300 font-semibold">
                      {tpl.category || "Professional"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          tpl.tier === "free"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : tpl.tier === "one-time"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {tpl.tier || "free"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {tpl.atsScore ?? 95}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(tpl)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tpl.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tpl.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {tpl.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewTemplate(tpl)}
                          className="p-1.5 hover:bg-blue-500/10 text-blue-600 dark:text-cyan-400 rounded-lg transition-all"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            openEditModal(tpl);
                            setModalTab("seo");
                          }}
                          className="p-1.5 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg transition-all"
                          title="AI SEO Studio"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(tpl)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTemplate(tpl)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-xl shadow-inner">
                  {formData.emoji || "📄"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{showEditModal ? `Configure: ${formData.name || "Template"}` : "Create New Resume Template"}</span>
                    {formData.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                        ⭐ Featured
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Manage tier pricing, ATS compatibility score, and Google SEO ranking
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-zinc-900 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab("general")}
                className={`pb-3 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  modalTab === "general"
                    ? "border-blue-600 text-blue-600 dark:text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>General Configuration</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("seo")}
                className={`pb-3 px-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  modalTab === "seo"
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                }`}
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>AI SEO & Google Ranking Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 font-extrabold border border-orange-500/30 uppercase tracking-wider">
                  AI Auto
                </span>
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-5">
              {modalTab === "general" ? (
                /* TAB 1: GENERAL CONFIGURATION */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Template Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Template Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Executive Modern Pro"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Template ID / Slug */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Template ID / Slug *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={showEditModal}
                        value={formData.templateId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            templateId: e.target.value,
                          })
                        }
                        placeholder="e.g. executive-modern"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Tech">Tech & Developer</option>
                        <option value="Creative">Creative & Design</option>
                        <option value="Leadership">Executive Leadership</option>
                        <option value="Modern">Modern</option>
                        <option value="Minimal">Minimal</option>
                      </select>
                    </div>

                    {/* Tier Access */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Access Tier
                      </label>
                      <select
                        value={formData.tier}
                        onChange={(e) =>
                          setFormData({ ...formData, tier: e.target.value })
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="free">Free Starter (₹0)</option>
                        <option value="one-time">One-Time Pass (₹49)</option>
                        <option value="pro">Pro Unlimited (₹199)</option>
                      </select>
                    </div>

                    {/* Emoji Icon */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Emoji Icon
                      </label>
                      <input
                        type="text"
                        value={formData.emoji}
                        onChange={(e) =>
                          setFormData({ ...formData, emoji: e.target.value })
                        }
                        placeholder="e.g. 💼, ⚡, 🎨"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* ATS Score */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        ATS Compatibility Rating ({formData.atsScore}%)
                      </label>
                      <input
                        type="range"
                        min="70"
                        max="100"
                        value={formData.atsScore}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            atsScore: Number(e.target.value),
                          })
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Badge Text */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                        Promo / Featured Badge Text
                      </label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) =>
                          setFormData({ ...formData, badge: e.target.value })
                        }
                        placeholder="e.g. Most Popular, 98% ATS Score"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Template Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the layout style, recommended target roles, and strengths..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="e.g. ATS-Optimized, Clean, Tech, Leadership"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded-md text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                        🟢 Active in Resume Builder
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isFeatured: e.target.checked,
                          })
                        }
                        className="rounded-md text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                        ⭐ Featured Highlight
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                /* TAB 2: AI SEO & GOOGLE RANKING STUDIO */
                <div className="space-y-5">
                  {/* AI Generator Action Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span>AI SEO Copywriter (GPT-4o)</span>
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                        Auto-crafts Google #1 Meta Titles, high-CTR Descriptions, targeted search terms, and FAQ Schema.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAISeo}
                      disabled={generatingSeo}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 active:scale-95 cursor-pointer shrink-0"
                    >
                      {generatingSeo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating SEO...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>✨ Generate SEO with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* LIVE GOOGLE SERP SIMULATOR */}
                  <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl border border-gray-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-zinc-400">
                      <span>GOOGLE SEARCH SNIPPET PREVIEW</span>
                      <span className="text-blue-600 dark:text-cyan-400">Desktop & Mobile View</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-1 font-sans shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-zinc-400">
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">
                          S
                        </div>
                        <span className="text-xs text-gray-800 dark:text-zinc-300 font-medium">SmartNShine</span>
                        <span className="text-gray-400">› templates › {formData.templateId || "resume"}</span>
                      </div>

                      <h4 className="text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug">
                        {formData.seo.metaTitle || `${formData.name || "Professional"} Resume Template (ATS-Optimized) | SmartNShine`}
                      </h4>

                      <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                        {formData.seo.metaDescription ||
                          `Build an interview-ready resume with the ${formData.name || "top"} ATS template. 98% ATS pass score, instant export, and clean design.`}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>⭐⭐⭐⭐⭐ 4.9 (12,850 reviews)</span>
                        <span>• Free & Pro Plans</span>
                        <span>• {formData.atsScore}% ATS Rated</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                        Meta Title (Google Link Headline)
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          formData.seo.metaTitle.length > 60
                            ? "text-amber-500"
                            : "text-gray-400 dark:text-zinc-500"
                        }`}
                      >
                        {formData.seo.metaTitle.length} / 60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.seo.metaTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: { ...formData.seo, metaTitle: e.target.value },
                        })
                      }
                      placeholder="e.g. Professional Resume Template - 98% ATS Score | SmartNShine"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                        Meta Description (Google Snippet Paragraph)
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          formData.seo.metaDescription.length > 160
                            ? "text-amber-500"
                            : "text-gray-400 dark:text-zinc-500"
                        }`}
                      >
                        {formData.seo.metaDescription.length} / 160 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.seo.metaDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: {
                            ...formData.seo,
                            metaDescription: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Build an ATS-optimized professional resume with our top-rated template. High recruiter response, free PDF export, and clean hierarchy."
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Target Search Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.seo.keywords}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: { ...formData.seo, keywords: e.target.value },
                        })
                      }
                      placeholder="e.g. resume, professional resume, ATS resume templates, modern CV format, free resume maker"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Target Queries */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                      Exact Google Search Query Targets
                    </label>
                    <input
                      type="text"
                      value={formData.seo.targetSearchQueries}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo: {
                            ...formData.seo,
                            targetSearchQueries: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. best professional resume template, ATS friendly resume for developers, executive resume format"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* FAQ Rich Snippets (FAQPage Schema) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-gray-800 dark:text-zinc-200">
                          Google Rich Snippet FAQs (Schema.org FAQPage)
                        </h5>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                          Captures Google &quot;People Also Ask&quot; featured answer boxes
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddFaqItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {(formData.seo.faqItems || []).map((faq, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) =>
                                handleFaqChange(idx, "question", e.target.value)
                              }
                              placeholder="Question (e.g. Why is this template ATS-friendly?)"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFaqItem(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0 cursor-pointer"
                              title="Delete FAQ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) =>
                              handleFaqChange(idx, "answer", e.target.value)
                            }
                            placeholder="Concise authoritative answer (40-60 words)..."
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-800 dark:text-zinc-200 focus:outline-hidden"
                          />
                        </div>
                      ))}

                      {(!formData.seo.faqItems || formData.seo.faqItems.length === 0) && (
                        <div className="text-center py-4 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-400">
                          Click &quot;Generate SEO with AI&quot; or &quot;Add Question&quot; to define Google rich snippet FAQs.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {modalTab === "general" ? (
                    <button
                      type="button"
                      onClick={() => setModalTab("seo")}
                      className="text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Configure AI SEO</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalTab("general")}
                      className="text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Back to General</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {submitting
                      ? "Saving..."
                      : showEditModal
                      ? "Update Template & SEO"
                      : "Create Template & SEO"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE SIMULATOR / PREVIEW MODAL */}
      {previewTemplate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewTemplate(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-contain overflow-y-auto"
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/80 dark:bg-zinc-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{previewTemplate.emoji || "📄"}</span>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {previewTemplate.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 font-bold">
                      {previewTemplate.category || "Professional"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                      {previewTemplate.atsScore ?? 95}% ATS Score
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Live Rendering Simulator • Scroll down inside the document
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(previewTemplate)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all"
                >
                  Configure
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: Interactive Canvas */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-gray-200/70 dark:bg-zinc-950 flex justify-center max-h-[calc(92vh-120px)]">
              <div className="w-full max-w-[800px] bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shrink-0 min-h-max">
                {PreviewComponent ? (
                  <PreviewErrorBoundary
                    fallback={
                      <div className="space-y-6">
                        <div className="border-b pb-4">
                          <h2 className="text-2xl font-bold tracking-tight">
                            {SAMPLE_PREVIEW_RESUME.personalInfo.fullName}
                          </h2>
                          <p className="text-blue-600 font-semibold text-sm">
                            {SAMPLE_PREVIEW_RESUME.personalInfo.jobTitle}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {SAMPLE_PREVIEW_RESUME.personalInfo.email} •{" "}
                            {SAMPLE_PREVIEW_RESUME.personalInfo.phone} •{" "}
                            {SAMPLE_PREVIEW_RESUME.personalInfo.location}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                            Professional Summary
                          </h4>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {SAMPLE_PREVIEW_RESUME.personalInfo.summary}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                            Experience
                          </h4>
                          {SAMPLE_PREVIEW_RESUME.experience.map((exp) => (
                            <div key={exp.id} className="mb-3 space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span>
                                  {exp.title} — {exp.company}
                                </span>
                                <span className="text-gray-500">
                                  {exp.startDate} - {exp.endDate}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 whitespace-pre-line">
                                {exp.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <PreviewComponent
                      resumeData={SAMPLE_PREVIEW_RESUME}
                      data={SAMPLE_PREVIEW_RESUME}
                      selectedTheme="navy"
                      twoPageMode={false}
                      onPageUsageChange={() => {}}
                    />
                  </PreviewErrorBoundary>
                ) : (
                  /* Fallback Mock Layout Simulator */
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {SAMPLE_PREVIEW_RESUME.personalInfo.fullName}
                      </h2>
                      <p className="text-blue-600 font-semibold text-sm">
                        {SAMPLE_PREVIEW_RESUME.personalInfo.jobTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {SAMPLE_PREVIEW_RESUME.personalInfo.email} •{" "}
                        {SAMPLE_PREVIEW_RESUME.personalInfo.phone} •{" "}
                        {SAMPLE_PREVIEW_RESUME.personalInfo.location}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                        Professional Summary
                      </h4>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {SAMPLE_PREVIEW_RESUME.personalInfo.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                        Experience
                      </h4>
                      {SAMPLE_PREVIEW_RESUME.experience.map((exp) => (
                        <div key={exp.id} className="mb-3 space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>
                              {exp.title} — {exp.company}
                            </span>
                            <span className="text-gray-500">
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 whitespace-pre-line">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                        Core Competencies & Stack
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_PREVIEW_RESUME.skills.flatMap((s) => s.items || s).map(
                          (skillName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-medium text-gray-800"
                            >
                              {skillName}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500">
              <span>Standard 8.5&quot; x 11&quot; Letter Ratio</span>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmTemplate && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Template"
          message={`Are you sure you want to delete '${deleteConfirmTemplate.name}'? Users will no longer be able to select this template for their resumes.`}
          confirmText="Delete Template"
          confirmVariant="danger"
          isLoading={submitting}
          onConfirm={handleDeleteTemplate}
          onClose={() => setDeleteConfirmTemplate(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Globe,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Crown,
  Tag,
  ExternalLink,
  Copy,
  LayoutGrid,
  Table as TableIcon,
  Palette,
  Laptop,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  TrendingUp,
  Sliders,
  Check,
  X,
  FileText,
  User as UserIcon,
  Filter,
  ArrowUpRight,
  ChevronRight,
  Shield,
  BarChart2,
  Calendar,
} from "lucide-react";
import {
  getPortfolioAdminStats,
  getAllAdminPortfolios,
  updateAdminPortfolioStatus,
  deleteAdminPortfolio,
  generatePortfolioSeoWithAI,
} from "@/api/admin.api";
import { ConfirmationModal } from "@/components/common";
import { portfolioThemes } from "@/components/portfolio/themes/themeRegistry";
import PortfolioThemeRenderer from "@/components/portfolio/PortfolioThemeRenderer";
import React, { Component } from "react";

// Safe Error Boundary for Live Preview Simulator
class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Portfolio Preview Boundary Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
          <p className="font-bold">Failed to load live preview</p>
          <p className="text-xs text-red-400 mt-1">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Sample demo resume data for simulator
const SAMPLE_PORTFOLIO_RESUME = {
  name: "Alex Vance",
  title: "Full Stack Engineer & Design Systems Architect",
  summary:
    "Building high-performance web applications and fluid digital interfaces. Specialized in React, Node.js, and Swiss precision digital craftsmanship.",
  location: "San Francisco, CA",
  email: "alex@smartnshine.studio",
  phone: "+1 (555) 234-5678",
  skills: [
    { category: "ENGINEERING", items: ["React", "TypeScript", "Node.js", "Next.js", "Tailwind CSS", "GraphQL"] },
    { category: "ARCHITECTURE", items: ["System Design", "Cloud Infrastructure", "API Design", "Performance Optimization"] },
    { category: "DESIGN", items: ["UI/UX Systems", "Micro-Interactions", "Typography", "Figma"] },
  ],
  experience: [
    {
      role: "Lead Design Engineer",
      company: "Apex Studio",
      location: "San Francisco, CA",
      dateRange: "2024 — Present",
      description: "Spearheaded design system architecture and client-facing web application performance optimizations.",
      contributions: [
        "Architected enterprise component system adopted by 12 cross-functional teams",
        "Cut Core Web Vitals LCP by 62% across all primary customer touchpoints",
      ],
    },
    {
      role: "Senior Software Engineer",
      company: "Nexus Labs",
      location: "Remote",
      dateRange: "2022 — 2024",
      description: "Engineered real-time data visualization dashboards and developer platform tooling.",
      contributions: [
        "Implemented zero-latency canvas rendering engine with WebGL acceleration",
        "Authored open-source design tokens library with over 10k monthly downloads",
      ],
    },
  ],
  education: [
    {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "Institute of Technology",
      gpa: "8.9 CGPA",
      location: "San Francisco, CA",
      dateRange: "2020 — 2024",
    },
  ],
  projects: [
    {
      id: "demo-p1",
      title: "Aura Intelligence Platform",
      category: "PRODUCT / AI",
      description: "Autonomous AI orchestration engine designed for high-density engineering workflows.",
      technologies: ["React", "TypeScript", "Node.js", "Tailwind CSS", "GraphQL"],
      featured: true,
      links: { live: "https://example.com", github: "https://github.com" },
    },
    {
      id: "demo-p2",
      title: "Monograph Spatial Canvas",
      category: "DESIGN SYSTEM",
      description: "Spatial 3D canvas and typography system for editorial digital monograph publications.",
      technologies: ["WebGL", "Three.js", "React", "Framer Motion"],
      featured: true,
      links: { live: "https://example.com" },
    },
  ],
  certifications: [
    { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services" },
    { name: "Professional Cloud Developer", issuer: "Google Cloud" },
  ],
  achievements: [
    "Winner of Global Hackathon 2025 (1st Place out of 450+ Teams)",
    "Published 2 technical research papers on distributed frontend architecture",
  ],
};

export default function PortfolioManagement() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("themes"); // "themes" | "userPortfolios"

  // Stats
  const [stats, setStats] = useState({
    totalPortfolios: 0,
    publishedPortfolios: 0,
    draftPortfolios: 0,
    totalViews: 0,
    last7DaysCount: 0,
    themeDistribution: [],
    recentPortfolios: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // User Portfolios state
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");

  // Theme Simulator Modal state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("smartnshine");
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [previewMode, setPreviewMode] = useState("light"); // "light" | "dark"
  const [previewAccent, setPreviewAccent] = useState("");

  // AI SEO Modal state
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [targetPortfolio, setTargetPortfolio] = useState(null);
  const [generatedSeo, setGeneratedSeo] = useState(null);
  const [seoLoading, setSeoLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await getPortfolioAdminStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch portfolio stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch User Portfolios
  const fetchPortfolios = useCallback(async (page = 1) => {
    try {
      setPortfoliosLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        themeId: themeFilter !== "all" ? themeFilter : undefined,
      };
      const res = await getAllAdminPortfolios(params);
      if (res.data?.success) {
        setPortfolios(res.data.data.portfolios || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("Failed to fetch portfolios:", err);
      toast.error("Failed to load user portfolios");
    } finally {
      setPortfoliosLoading(false);
    }
  }, [searchQuery, statusFilter, themeFilter, pagination.limit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "userPortfolios") {
      fetchPortfolios(1);
    }
  }, [activeTab, fetchPortfolios]);

  // Convert theme registry object to array
  const allThemesList = useMemo(() => {
    return Object.values(portfolioThemes);
  }, []);

  // Filtered themes list for Theme Directory
  const [themeCategoryFilter, setThemeCategoryFilter] = useState("all");
  const [themeSearch, setThemeSearch] = useState("");

  const filteredThemes = useMemo(() => {
    return allThemesList.filter((theme) => {
      const matchCategory =
        themeCategoryFilter === "all" ||
        theme.category.toLowerCase() === themeCategoryFilter.toLowerCase();
      const matchSearch =
        !themeSearch ||
        theme.name.toLowerCase().includes(themeSearch.toLowerCase()) ||
        theme.subtitle?.toLowerCase().includes(themeSearch.toLowerCase()) ||
        theme.tags?.some((t) => t.toLowerCase().includes(themeSearch.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [allThemesList, themeCategoryFilter, themeSearch]);

  // Categories list
  const themeCategories = useMemo(() => {
    const cats = new Set(allThemesList.map((t) => t.category));
    return ["all", ...Array.from(cats)];
  }, [allThemesList]);

  // Open Simulator for specific theme
  const handleOpenSimulator = (themeId) => {
    const theme = portfolioThemes[themeId] || allThemesList[0];
    setSelectedThemeId(theme.id);
    setPreviewMode(theme.defaultMode || "light");
    setPreviewAccent(theme.accentPresets?.[0] || "");
    setSimulatorOpen(true);
  };

  // Toggle status
  const handleToggleStatus = async (portfolio) => {
    const nextStatus = portfolio.status === "published" ? "draft" : "published";
    try {
      setActionLoading(true);
      const res = await updateAdminPortfolioStatus(portfolio._id, nextStatus);
      if (res.data?.success) {
        toast.success(`Portfolio marked as ${nextStatus}`);
        setPortfolios((prev) =>
          prev.map((p) => (p._id === portfolio._id ? { ...p, status: nextStatus } : p))
        );
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Portfolio
  const handleDeleteConfirm = async () => {
    if (!portfolioToDelete) return;
    try {
      setActionLoading(true);
      const res = await deleteAdminPortfolio(portfolioToDelete._id);
      if (res.data?.success) {
        toast.success("Portfolio deleted successfully");
        setPortfolios((prev) => prev.filter((p) => p._id !== portfolioToDelete._id));
        setDeleteModalOpen(false);
        setPortfolioToDelete(null);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete portfolio");
    } finally {
      setActionLoading(false);
    }
  };

  // AI SEO Generation
  const handleOpenSeoModal = (portfolio) => {
    setTargetPortfolio(portfolio);
    setGeneratedSeo(null);
    setSeoModalOpen(true);
  };

  const handleGenerateSeo = async () => {
    if (!targetPortfolio) return;
    try {
      setSeoLoading(true);
      const themeConfig = portfolioThemes[targetPortfolio.themeId] || {};
      const payload = {
        title: targetPortfolio.title || targetPortfolio.userId?.name,
        role: targetPortfolio.professionalTitle,
        skills: ["Web Development", "Frontend", "JavaScript", "React"],
        themeName: themeConfig.name || "Modern Portfolio",
        bio: targetPortfolio.about,
      };
      const res = await generatePortfolioSeoWithAI(payload);
      if (res.data?.success) {
        setGeneratedSeo(res.data.data);
        toast.success("AI SEO Metadata Generated!");
      }
    } catch (err) {
      toast.error("Failed to generate AI SEO");
    } finally {
      setSeoLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-zinc-900 dark:text-zinc-100">
      {/* ─── 1. HEADER & TOP CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Public Portfolios
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Manage visual portfolio themes, live simulator, user websites, and AI SEO intelligence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === "userPortfolios") fetchPortfolios(pagination.page);
              toast.success("Data refreshed");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading || portfoliosLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenSimulator("smartnshine")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-mono font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Launch Theme Simulator</span>
          </button>
        </div>
      </div>

      {/* ─── 2. STATS BANNER ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
            <span>Total Portfolios</span>
            <Globe className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
            {stats.totalPortfolios || 0}
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            +{stats.last7DaysCount || 0} this week
          </span>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
            <span>Published Live</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
            {stats.publishedPortfolios || 0}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {stats.totalPortfolios ? Math.round((stats.publishedPortfolios / stats.totalPortfolios) * 100) : 0}% live rate
          </span>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
            <span>Draft Mode</span>
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {stats.draftPortfolios || 0}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">In-progress builds</span>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
            <span>Total Views</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {stats.totalViews?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Public impressions</span>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
            <span>Active Themes</span>
            <Palette className="w-3.5 h-3.5 text-violet-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
            {allThemesList.length}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Production ready</span>
        </div>

        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">
            <span>Top Engine</span>
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-zinc-900 dark:text-white truncate mt-1">
            {stats.themeDistribution?.[0]?._id || "smartnshine"}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {stats.themeDistribution?.[0]?.count || 0} sites
          </span>
        </div>
      </div>

      {/* ─── 3. TAB CONTROLS ─── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("themes")}
          className={`inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "themes"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Themes Directory &amp; Simulator ({allThemesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("userPortfolios")}
          className={`inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "userPortfolios"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>User Portfolios Oversight ({stats.totalPortfolios || 0})</span>
        </button>
      </div>

      {/* ─── TAB 1: THEMES DIRECTORY & SIMULATOR ─── */}
      {activeTab === "themes" && (
        <div className="space-y-6">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
                Category:
              </span>
              {themeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setThemeCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    themeCategoryFilter === cat
                      ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-xs"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={themeSearch}
                onChange={(e) => setThemeSearch(e.target.value)}
                placeholder="Search themes or tags..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map((theme) => {
              return (
                <div
                  key={theme.id}
                  className="rounded-3xl border border-gray-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 flex flex-col justify-between shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Category + Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        {theme.category}
                      </span>
                      {theme.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {theme.badge}
                        </span>
                      )}
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-xl font-black text-gray-950 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {theme.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-1 font-normal leading-relaxed">
                        {theme.subtitle || theme.description}
                      </p>
                    </div>

                    {/* Color Accent Swatches */}
                    {theme.accentPresets?.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-400 font-mono mr-1">Accents:</span>
                        {theme.accentPresets.slice(0, 5).map((color, cIdx) => (
                          <span
                            key={cIdx}
                            className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {theme.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {theme.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-5 mt-5 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-gray-400">
                      Tier: {theme.allowedTiers?.join(", ") || "free"}
                    </span>

                    <button
                      onClick={() => handleOpenSimulator(theme.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:bg-emerald-600 dark:hover:bg-emerald-400 hover:text-white dark:hover:text-gray-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Simulate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: USER PORTFOLIOS OVERSIGHT ─── */}
      {activeTab === "userPortfolios" && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-3xl border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, slug, title..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-bold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-xs font-semibold outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-bold">Theme:</span>
                <select
                  value={themeFilter}
                  onChange={(e) => setThemeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-xs font-semibold outline-none"
                >
                  <option value="all">All Themes</option>
                  {allThemesList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Portfolios Table */}
          <div className="rounded-3xl border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-zinc-950/60 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Portfolio / User</th>
                    <th className="py-3.5 px-4 font-bold">Public URL &amp; Slug</th>
                    <th className="py-3.5 px-4 font-bold">Theme Engine</th>
                    <th className="py-3.5 px-4 font-bold">Views</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Created</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {portfoliosLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        <span>Loading user portfolios...</span>
                      </td>
                    </tr>
                  ) : portfolios.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No portfolios match your filters.
                      </td>
                    </tr>
                  ) : (
                    portfolios.map((item) => {
                      const themeMeta = portfolioThemes[item.themeId] || { name: item.themeId };
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {item.title || "Untitled Portfolio"}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <UserIcon className="w-3 h-3" />
                              <span>{item.userId?.name || "Unknown User"}</span>
                              <span className="text-gray-300 dark:text-zinc-600">·</span>
                              <span className="font-mono text-[10px]">{item.userId?.email}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                              <span>/p/{item.slug}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/p/${item.slug}`);
                                  toast.success("Link copied!");
                                }}
                                title="Copy public link"
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                              {themeMeta.name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-gray-700 dark:text-zinc-300">
                            {item.views || 0}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.status === "published"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {item.status === "published" ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Sliders className="w-3 h-3" />
                              )}
                              <span>{item.status}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-gray-400 font-mono text-[10px]">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/p/${item.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                title="View Live Public Portfolio"
                                className="p-2 rounded-xl text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>

                              <button
                                onClick={() => handleToggleStatus(item)}
                                title={item.status === "published" ? "Unpublish to Draft" : "Publish Live"}
                                className="p-2 rounded-xl text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenSeoModal(item)}
                                title="Generate AI SEO"
                                className="p-2 rounded-xl text-gray-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setPortfolioToDelete(item);
                                  setDeleteModalOpen(true);
                                }}
                                title="Delete Portfolio"
                                className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Row */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchPortfolios(pagination.page - 1)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchPortfolios(pagination.page + 1)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 4. LIVE THEME SIMULATOR MODAL ─── */}
      {simulatorOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSimulatorOpen(false)}
        >
          {/* Top Control Bar */}
          <div
            className="bg-white/95 dark:bg-zinc-900/95 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Theme Switcher */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
                Theme:
              </span>
              <select
                value={selectedThemeId}
                onChange={(e) => {
                  setSelectedThemeId(e.target.value);
                  const theme = portfolioThemes[e.target.value];
                  if (theme) {
                    setPreviewMode(theme.defaultMode || "light");
                    setPreviewAccent(theme.accentPresets?.[0] || "");
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-bold outline-none cursor-pointer"
              >
                {allThemesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>

              {/* Color Preset Palette */}
              {portfolioThemes[selectedThemeId]?.accentPresets?.length > 0 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-zinc-700">
                  {portfolioThemes[selectedThemeId].accentPresets.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewAccent(col)}
                      className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                        previewAccent === col ? "scale-125 ring-2 ring-emerald-500" : "opacity-80"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Center: Device Frame Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  previewDevice === "desktop"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Desktop (100% width)"
              >
                <Laptop className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  previewDevice === "tablet"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  previewDevice === "mobile"
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Mobile (390px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Mode Toggle & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode((prev) => (prev === "dark" ? "light" : "dark"))}
                className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Toggle Light/Dark Simulator Mode"
              >
                {previewMode === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              <button
                onClick={() => setSimulatorOpen(false)}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                title="Close Simulator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Simulator Canvas Frame */}
          <div
            className="flex-1 w-full overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`h-full overflow-y-auto rounded-3xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl transition-all duration-300 ${
                previewDevice === "desktop"
                  ? "w-full"
                  : previewDevice === "tablet"
                  ? "w-[768px] max-w-full"
                  : "w-[390px] max-w-full"
              }`}
            >
              <PreviewErrorBoundary>
                <PortfolioThemeRenderer
                  themeId={selectedThemeId}
                  portfolioData={{
                    themeId: selectedThemeId,
                    themeAccent: previewAccent,
                    title: "Alex Vance",
                    professionalTitle: "Full Stack Engineer & Design Systems Architect",
                    tagline: "I build digital products that make complex things feel simple.",
                    about: "Specialized in Swiss precision typography, reactive state architecture, and micro-interactions.",
                    location: "San Francisco, CA",
                    experience: SAMPLE_PORTFOLIO_RESUME.experience,
                    education: SAMPLE_PORTFOLIO_RESUME.education,
                    skills: SAMPLE_PORTFOLIO_RESUME.skills,
                    projects: SAMPLE_PORTFOLIO_RESUME.projects,
                    certifications: SAMPLE_PORTFOLIO_RESUME.certifications,
                    achievements: SAMPLE_PORTFOLIO_RESUME.achievements,
                  }}
                  resumeSnapshot={SAMPLE_PORTFOLIO_RESUME}
                  isPublic={false}
                  customThemeMode={previewMode}
                />
              </PreviewErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. AI SEO GENERATOR MODAL ─── */}
      {seoModalOpen && targetPortfolio && (
        <div
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSeoModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest block mb-1">
                  AI SEO Intelligence
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  Metadata &amp; Keyword Generation
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Portfolio: {targetPortfolio.title || targetPortfolio.slug}
                </p>
              </div>

              <button
                onClick={() => setSeoModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedSeo ? (
              <div className="p-6 text-center space-y-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                <Sparkles className="w-8 h-8 text-fuchsia-500 mx-auto animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    Generate High-Ranking Metadata
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    AI will analyze candidate skills, theme, and bio to compose optimized title tags, meta summaries, and search keywords.
                  </p>
                </div>
                <button
                  onClick={handleGenerateSeo}
                  disabled={seoLoading}
                  className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {seoLoading ? "Generating with AI..." : "Generate SEO Now"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-zinc-300">Meta Title Tag</label>
                  <input
                    readOnly
                    value={generatedSeo.metaTitle || ""}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-zinc-300">Meta Description</label>
                  <textarea
                    readOnly
                    rows={3}
                    value={generatedSeo.metaDescription || ""}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 font-medium"
                  />
                </div>

                {generatedSeo.keywords?.length > 0 && (
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-zinc-300">SEO Keywords</label>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
                      {generatedSeo.keywords.map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 font-mono text-[10px]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generatedSeo, null, 2));
                      toast.success("SEO JSON copied to clipboard!");
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => setSeoModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 6. DELETE CONFIRMATION MODAL ─── */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPortfolioToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User Portfolio"
        message={`Are you sure you want to permanently delete the portfolio "${portfolioToDelete?.title || portfolioToDelete?.slug}"? This will also remove all associated project records.`}
        confirmText="Delete Portfolio"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}

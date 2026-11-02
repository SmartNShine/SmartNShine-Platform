import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/common/SEO";
import { resumeAPI } from "@/api/api";
import { portfolioAPI } from "@/api/portfolio.api";
import careerAPI from "@/api/career.api";
import toast from "react-hot-toast";
import {
  FileText,
  Globe2,
  Mic,
  MessageSquare,
  UserCircle,
  Target,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  Check,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resumesRes, portfoliosRes, profileRes] =
        await Promise.allSettled([
          resumeAPI.list(),
          portfolioAPI.list(),
          careerAPI.getProfile(),
        ]);

      if (resumesRes.status === "fulfilled") {
        setResumes(resumesRes.value?.data?.resumes || []);
      }
      if (portfoliosRes.status === "fulfilled") {
        setPortfolios(portfoliosRes.value?.data?.portfolios || []);
      }
      if (profileRes.status === "fulfilled") {
        setProfileData(profileRes.value?.data || null);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const primaryPortfolio = portfolios[0] || null;
  const profileCompleteness =
    profileData?.completeness?.totalScore ||
    (profileData?.profile ? 70 : 25);

  const handleCopyPortfolioUrl = async (slug) => {
    const url = `${window.location.origin}/u/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Portfolio link copied", {
      icon: <Check className="w-4 h-4 text-emerald-500" />,
      duration: 2000,
    });
  };

  const displayName =
    user?.firstName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 font-sans">
      <SEO
        title="Dashboard | SmartNShine"
        description="Unified career dashboard for resumes, developer portfolios, and career assets."
        noindex={true}
      />

      <div className="workspace-container py-8 space-y-8">
        {/* 1. CLEAN EXECUTIVE HEADER & PRIMARY ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" />
                Workspace
              </span>
              {user?.isPro && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  PRO Plan
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Welcome back, {displayName}. Here is the overview of your career assets.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Resume</span>
            </Link>

            <Link
              to={primaryPortfolio ? `/portfolio/${primaryPortfolio._id}/edit` : "/portfolio/new"}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-medium transition-colors"
            >
              <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{primaryPortfolio ? "Edit Portfolio" : "New Portfolio"}</span>
            </Link>
          </div>
        </div>

        {/* 2. THREE KEY METRIC STAT CARDS (Refined Accents matching Feature Pages) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stat 1: Resumes (Blue Accent) */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Saved Resumes
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {resumes.length}
              </span>
              <span className="text-xs text-zinc-500">
                {resumes.length === 1 ? "document" : "documents"}
              </span>
            </div>
            <Link
              to="/my-resumes"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-3 inline-flex items-center gap-1"
            >
              <span>Manage resumes</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Stat 2: Web Portfolio (Cyan Accent) */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Web Portfolio
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Globe2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {primaryPortfolio?.isPublished ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Published
                </span>
              ) : primaryPortfolio ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  Draft mode
                </span>
              ) : (
                <span className="text-sm font-medium text-zinc-500">
                  Not Deployed
                </span>
              )}
            </div>
            {primaryPortfolio ? (
              <a
                href={`/u/${primaryPortfolio.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline mt-3 inline-flex items-center gap-1"
              >
                <span>/u/{primaryPortfolio.slug}</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            ) : (
              <Link
                to="/portfolio/new"
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline mt-3 inline-flex items-center gap-1"
              >
                <span>Deploy portfolio website</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Stat 3: Career Profile Readiness (Amber Accent) */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Profile Readiness
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <UserCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {profileCompleteness}%
              </span>
              <span className="text-xs text-zinc-500">readiness score</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(profileCompleteness, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. CORE TWO-COLUMN USABILITY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: RESUMES MANAGEMENT LIST (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Recent Resumes
                </h2>
              </div>
              <Link
                to="/my-resumes"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>View all ({resumes.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden shadow-xs">
              {loading ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Loading resumes...
                </div>
              ) : resumes.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    No resumes created yet
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Choose from 12+ battle-tested ATS templates to generate your first job-winning resume.
                  </p>
                  <Link
                    to="/templates"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Browse Templates</span>
                  </Link>
                </div>
              ) : (
                resumes.slice(0, 4).map((resume) => {
                  const title =
                    resume.resumeTitle ||
                    resume.name ||
                    resume.personalInfo?.fullName ||
                    "Untitled Resume";
                  const updatedAt = resume.updatedAt
                    ? new Date(resume.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Recently";

                  return (
                    <div
                      key={resume._id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {title}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                            {resume.templateId || "Classic"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Edited {updatedAt}</span>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            ATS Verified
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            navigate("/editor", {
                              state: { resumeData: resume, fromDashboard: true },
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          Edit
                        </button>
                        <Link
                          to="/ats-analyzer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-xs font-semibold transition-colors"
                        >
                          Scan
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Diagnostic Shortcut (Emerald Accent) */}
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-950/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    ATS Keyword Diagnostics
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Paste a target job posting to uncover keyword gaps and optimize ATS pass rate.
                  </p>
                </div>
              </div>
              <Link
                to="/ats-analyzer"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-0.5"
              >
                <span>Run Scan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT: PORTFOLIO & INTERVIEW MODULES (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* PORTFOLIO SUMMARY CARD (Cyan Accent) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Developer Portfolio
                  </h2>
                </div>
                <Link
                  to="/portfolio"
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
                {primaryPortfolio ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {primaryPortfolio.title || "Developer Portfolio"}
                        </span>
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium capitalize">
                          Theme: {primaryPortfolio.theme || "Modern"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        /u/{primaryPortfolio.slug}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 border-y border-zinc-100 dark:border-zinc-800 text-center">
                      <div>
                        <span className="text-xs text-zinc-500 block">Total Views</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {primaryPortfolio.analytics?.totalViews || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 block">Downloads</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {primaryPortfolio.analytics?.resumeDownloads || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyPortfolioUrl(primaryPortfolio.slug)}
                        className="flex-1 py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </button>

                      <a
                        href={`/u/${primaryPortfolio.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>

                      <Link
                        to={`/portfolio/${primaryPortfolio._id}/edit`}
                        className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <Globe2 className="w-6 h-6 text-cyan-500 mx-auto" />
                    <p className="text-xs text-zinc-500">
                      Deploy your own personal portfolio website in minutes.
                    </p>
                    <Link
                      to="/portfolio/new"
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline pt-1"
                    >
                      <span>Create Portfolio Website →</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* CAREER Q&A CARD (Indigo Accent) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Career Q&A Bank
                  </h2>
                </div>
                <Link
                  to="/career-qa"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Open Studio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Personalized Answer Bank
                    </span>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      AI Powered
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Generate tailored, STAR-grounded answers for HR, system architecture, and role-specific questions directly from your Career Profile.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to="/career-qa"
                    className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold transition-colors text-center shadow-xs"
                  >
                    Open Q&A Studio
                  </Link>
                  <Link
                    to="/career-profile"
                    className="py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Sync Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CAREER MASTER PROFILE FOOTER CARD (Amber Accent) */}
        <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] dark:bg-amber-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <UserCircle className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Career Master Profile
              </h3>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-mono">
                {profileCompleteness}% ready
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your centralized repository of work experience, skills, and projects. Keeps all your resumes, portfolios, and answer banks updated from one place.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/career-profile"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs shadow-amber-600/20"
            >
              Update Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

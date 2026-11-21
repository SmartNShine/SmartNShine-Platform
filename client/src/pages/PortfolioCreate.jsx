import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import { ArrowLeft, ArrowRight, ChevronDown, FileText, Globe2, Sparkles, RefreshCw } from "lucide-react";
import { resumeAPI } from "@/api/api";
import { portfolioAPI } from "@/api/portfolio.api";

export default function PortfolioCreate() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);
  const [showPlan, setShowPlan] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.list();
      setResumes(response.data.resumes || []);
    } catch (error) {
      toast.error("Failed to load resumes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (resumeId) => {
    setCreatingId(resumeId);

    try {
      const response = await portfolioAPI.createFromResume(resumeId);
      toast.success("Portfolio draft created!");
      navigate(`/portfolio/${response.data.portfolio._id}/edit`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create portfolio");
      console.error(error);
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title="Create Developer Portfolio | SmartNShine"
        description="Choose a resume to generate an interactive portfolio website in seconds."
        noindex={true}
      />

      <main className="flex-1 workspace-container py-8 space-y-6">
        {/* Sleek Minimal Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portfolios Hub</span>
          </Link>
          <span>/</span>
          <span className="text-emerald-600 dark:text-emerald-400">Create New Portfolio</span>
        </div>

        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-zinc-900/90 dark:to-zinc-950/90 p-6 sm:p-8 shadow-sm dark:shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1: Choose Source Resume</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Create Your Portfolio Website
            </h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Select one of your saved resumes. SmartNShine will extract your profile, skills, work history, and projects into a fully customizable live website draft.
            </p>
          </div>
        </div>

        {/* 3-Step Plan Info Card */}
        <section className="overflow-hidden rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 shadow-sm dark:shadow-xl">
          <button
            type="button"
            onClick={() => setShowPlan((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-emerald-500" />
                <span>How Portfolio Publishing Works</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Resume import first, then customize theme, proof links, SEO, and live domain.
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                showPlan ? "rotate-180" : ""
              }`}
            />
          </button>

          {showPlan && (
            <div className="grid gap-4 border-t border-gray-100 dark:border-white/[0.08] p-6 text-xs md:grid-cols-3 bg-gray-50/50 dark:bg-zinc-900/30">
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-gray-100 dark:border-white/[0.06] shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>Import Data</span>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  We copy your resume profile, skills, experience, education, and projects into a draft portfolio.
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-gray-100 dark:border-white/[0.06] shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>Refine & Theme</span>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Select curated themes (Minimal Developer, Professional Corporate), add cover photos, and proof links.
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-gray-100 dark:border-white/[0.06] shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-950 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-bold">3</span>
                  <span>Publish & Share</span>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Preview in real-time on desktop and mobile, then share your custom recruiter-ready link.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Resumes List Area */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white px-1">
            Available Resumes ({resumes.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-xs text-gray-500 dark:text-zinc-400">
              Loading your saved resumes...
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 p-10 text-center bg-white/50 dark:bg-zinc-950/50">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                No resumes found
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">
                Create or upload a resume first, then come back here to generate your portfolio.
              </p>
              <Link
                to="/editor"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Go to Resume Builder
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {resumes.map((resume) => (
                <article
                  key={resume._id}
                  className="rounded-3xl border border-gray-200/80 dark:border-white/[0.08] p-5 bg-white dark:bg-zinc-950 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {resume.resumeTitle || resume.name || "Untitled Resume"}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        <span>
                          Updated {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : "recently"}
                        </span>
                        {resume.name && <span>• {resume.name}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={creatingId === resume._id}
                    onClick={() => handleCreate(resume._id)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-60 transition-all active:scale-95 cursor-pointer"
                  >
                    {creatingId === resume._id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Draft...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Portfolio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

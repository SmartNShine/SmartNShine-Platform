import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "@/components/common/SEO";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  FileText,
  FilePlus2,
  Palette,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { resumeAPI } from "@/api/api";
import { portfolioAPI } from "@/api/portfolio.api";
import { useAuth } from "@/hooks/useAuth";
import { portfolioThemeList } from "@/components/portfolio/themes/themeRegistry";

const STEPS = [
  { id: "theme", label: "Theme", number: 1 },
  { id: "source", label: "Source", number: 2 },
  { id: "confirm", label: "Create", number: 3 },
];

export default function PortfolioCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState("theme");
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("smartnshine");
  const [selectedAccent, setSelectedAccent] = useState(
    portfolioThemeList.find((t) => t.id === "smartnshine")?.accentPresets?.[0] ||
      ""
  );
  const [sourceMode, setSourceMode] = useState(null); // "resume" | "blank"
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  const userTier =
    user?.role === "admin" ? "pro" : user?.subscription?.tier || "free";
  const isThemeAllowed = (theme) => theme.allowedTiers?.includes(userTier);

  const selectedTheme = useMemo(
    () =>
      portfolioThemeList.find((theme) => theme.id === selectedThemeId) ||
      portfolioThemeList.find((theme) => theme.id === "smartnshine"),
    [selectedThemeId]
  );

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume._id === selectedResumeId) || null,
    [resumes, selectedResumeId]
  );

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const response = await resumeAPI.list();
      setResumes(response.data.resumes || []);
    } catch (error) {
      toast.error("Failed to load resumes");
      console.error(error);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleSelectTheme = (theme) => {
    if (!isThemeAllowed(theme)) {
      toast.error("Upgrade your plan to use this theme");
      return;
    }
    setSelectedThemeId(theme.id);
    setSelectedAccent(theme.accentPresets?.[0] || "");
  };

  const canContinueFromTheme = Boolean(selectedThemeId);
  const canContinueFromSource =
    sourceMode === "blank" ||
    (sourceMode === "resume" && Boolean(selectedResumeId));

  const handleCreate = async () => {
    if (!canContinueFromSource || !selectedThemeId) return;

    setCreating(true);
    const themePayload = {
      themeId: selectedThemeId,
      themeAccent: selectedAccent,
    };

    try {
      const response =
        sourceMode === "blank"
          ? await portfolioAPI.createBlank(themePayload)
          : await portfolioAPI.createFromResume(selectedResumeId, themePayload);

      toast.success("Portfolio draft created!");
      navigate(`/portfolio/${response.data.portfolio._id}/edit`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create portfolio");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <SEO
        title="Create Developer Portfolio | SmartNShine"
        description="Pick a theme, import a resume or start blank, and launch your portfolio draft."
        noindex={true}
      />

      <main className="flex-1 workspace-container py-8 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portfolios Hub</span>
          </Link>
          <span>/</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Create New Portfolio
          </span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-gradient-to-b dark:from-zinc-900/90 dark:to-zinc-950/90 p-6 sm:p-8 shadow-sm dark:shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Step {stepIndex + 1} of {STEPS.length}:{" "}
                {STEPS[stepIndex]?.label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Create Your Portfolio Website
            </h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Choose a theme, pick a resume import or start blank, then refine
              everything in the live editor.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {STEPS.map((item, index) => {
                const active = item.id === step;
                const done = index < stepIndex;
                return (
                  <div
                    key={item.id}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border ${
                      active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        : done
                          ? "bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300"
                          : "bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/10 text-gray-400"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[11px]">
                      {done ? <Check className="w-3 h-3" /> : item.number}
                    </span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {step === "theme" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white px-1">
                Pick a starting theme
              </h2>
              {selectedTheme && (
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Selected:{" "}
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">
                    {selectedTheme.name}
                  </span>
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {portfolioThemeList.map((theme) => {
                const allowed = isThemeAllowed(theme);
                const selected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme)}
                    className={`text-left rounded-3xl border p-4 transition-all ${
                      selected
                        ? "border-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md"
                        : "border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 hover:border-gray-300 dark:hover:border-white/20"
                    } ${!allowed ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {theme.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                            {theme.category}
                          </p>
                        </div>
                      </div>
                      {!allowed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          <Crown className="w-3 h-3" /> Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                      {theme.subtitle || theme.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(theme.accentPresets || []).slice(0, 5).map((color) => (
                        <span
                          key={color}
                          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedTheme?.accentPresets?.length > 0 && (
              <div className="rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  Accent color
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTheme.accentPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedAccent(color)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform ${
                        selectedAccent === color
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Accent ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!canContinueFromTheme}
                onClick={() => setStep("source")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-60"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {step === "source" && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white px-1">
              How do you want to start?
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setSourceMode("resume")}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  sourceMode === "resume"
                    ? "border-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-950/30"
                    : "border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Import from resume
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Prefill profile, skills, experience, education, and projects
                  from an existing SmartNShine resume.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceMode("blank");
                  setSelectedResumeId(null);
                }}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  sourceMode === "blank"
                    ? "border-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-950/30"
                    : "border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <FilePlus2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Start blank
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  Begin with an empty draft and your chosen theme. Fill content
                  in the editor at your own pace.
                </p>
              </button>
            </div>

            {sourceMode === "resume" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white px-1">
                  Available resumes ({resumes.length})
                </h3>
                {loadingResumes ? (
                  <div className="text-center py-10 text-xs text-gray-500">
                    Loading your saved resumes...
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800 p-10 text-center bg-white/50 dark:bg-zinc-950/50">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      No resumes found
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">
                      Create a resume first, or go back and choose Start blank.
                    </p>
                    <Link
                      to="/editor"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      Go to Resume Builder
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {resumes.map((resume) => {
                      const selected = selectedResumeId === resume._id;
                      return (
                        <button
                          key={resume._id}
                          type="button"
                          onClick={() => setSelectedResumeId(resume._id)}
                          className={`rounded-3xl border p-4 text-left flex items-center justify-between gap-4 transition-all ${
                            selected
                              ? "border-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-950/30"
                              : "border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {resume.resumeTitle ||
                                  resume.name ||
                                  "Untitled Resume"}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                Updated{" "}
                                {resume.updatedAt
                                  ? new Date(
                                      resume.updatedAt
                                    ).toLocaleDateString()
                                  : "recently"}
                                {resume.name ? ` · ${resume.name}` : ""}
                              </p>
                            </div>
                          </div>
                          {selected && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("theme")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-zinc-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={!canContinueFromSource}
                onClick={() => setStep("confirm")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-60"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {step === "confirm" && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-950 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Ready to create your draft
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-4">
                  <dt className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Theme
                  </dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {selectedTheme?.name || selectedThemeId}
                  </dd>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-4">
                  <dt className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Accent
                  </dt>
                  <dd className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: selectedAccent || "#10b981" }}
                    />
                    {selectedAccent || "Default"}
                  </dd>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/60 p-4 sm:col-span-2">
                  <dt className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Source
                  </dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {sourceMode === "blank"
                      ? "Blank portfolio"
                      : `Resume: ${
                          selectedResume?.resumeTitle ||
                          selectedResume?.name ||
                          "Selected resume"
                        }`}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                You&apos;ll land in the editor next to refine content, SEO, and
                publish settings before going live.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("source")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-zinc-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Creating draft...
                  </>
                ) : (
                  <>
                    Create portfolio
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

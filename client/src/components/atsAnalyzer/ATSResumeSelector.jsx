import {
  Upload,
  BriefcaseBusiness,
  FileUser,
  CheckCircle2,
  AlertCircle,
  ScanSearch,
  RefreshCw,
  X,
} from "lucide-react";

export default function ATSResumeSelector({
  useCareerProfile,
  setUseCareerProfile,
  userResumes,
  loadingResumes,
  selectedResume,
  setSelectedResume,
  uploadedFile,
  setUploadedFile,
  handleFileUpload,
  analyzing,
  handleAnalyze,
  jobDescription,
}) {
  const canAnalyze =
    jobDescription.trim().length > 0 &&
    (useCareerProfile || selectedResume || uploadedFile);

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
          <FileUser className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Resume
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            Pick what to compare against the job
          </p>
        </div>
      </div>

      {/* Option 1: Master Career Profile */}
      <button
        type="button"
        onClick={() => {
          setUseCareerProfile(!useCareerProfile);
          if (!useCareerProfile) {
            setSelectedResume(null);
            setUploadedFile(null);
          }
        }}
        className={`w-full p-4 rounded-2xl border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
          useCareerProfile
            ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600/80"
            : "border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
              useCareerProfile
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300"
            }`}
          >
            <BriefcaseBusiness className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Master Career Profile</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Recommended
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Analyze all verified experience, skills, and projects in your master hub
            </div>
          </div>
        </div>

        {useCareerProfile ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Selected
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-zinc-500">
            Use
          </span>
        )}
      </button>

      {/* Option 2: Saved Resume Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
          Saved resumes
        </label>
        {loadingResumes ? (
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-white/5">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Loading your saved resumes...
            </p>
          </div>
        ) : userResumes.length > 0 ? (
          <select
            value={selectedResume || ""}
            onChange={(e) => {
              setSelectedResume(e.target.value);
              setUseCareerProfile(false);
              setUploadedFile(null);
            }}
            disabled={useCareerProfile}
            className="w-full h-12 px-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Choose a saved resume</option>
            {userResumes.map((resume) => (
              <option key={resume._id} value={resume._id}>
                {resume.resumeTitle || resume.name || "Untitled resume"}
              </option>
            ))}
          </select>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>No saved resumes yet. You can upload a PDF below.</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-white/5" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-zinc-950 text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Or upload
          </span>
        </div>
      </div>

      {/* Option 3: File Upload Dropzone */}
      <label
        className={`cursor-pointer block transition-all ${
          useCareerProfile ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          className="hidden"
          disabled={useCareerProfile}
        />
        <div className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500/60 hover:bg-blue-500/5 rounded-2xl p-6 text-center transition-colors">
          {uploadedFile ? (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                    {uploadedFile.name}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • Click to replace
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setUploadedFile(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto bg-zinc-100 dark:bg-white/[0.06] rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200">
                Upload a PDF or DOCX
              </p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                Up to 5 MB
              </p>
            </div>
          )}
        </div>
      </label>

      {/* Primary Analyze CTA Button */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing || !canAnalyze}
        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
      >
        {analyzing ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Scanning…</span>
          </>
        ) : (
          <>
            <ScanSearch className="w-5 h-5" aria-hidden="true" />
            <span>Run ATS analysis</span>
          </>
        )}
      </button>
    </div>
  );
}

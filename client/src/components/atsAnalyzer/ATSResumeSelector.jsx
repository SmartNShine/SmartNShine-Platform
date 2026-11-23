import {
  Upload,
  FileUser,
  CheckCircle2,
  AlertCircle,
  ScanSearch,
  RefreshCw,
  X,
} from "lucide-react";

export default function ATSResumeSelector({
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
    (selectedResume || uploadedFile);

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

      {/* Saved Resume Dropdown */}
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
            }}
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

      {/* File Upload Dropzone */}
      <label className="block cursor-pointer">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          className="hidden"
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

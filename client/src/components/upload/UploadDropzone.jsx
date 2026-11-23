import {
  Upload as UploadIcon,
  FileUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function UploadDropzone({
  getRootProps,
  getInputProps,
  isDragActive,
  uploading,
  error,
}) {
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-colors duration-200 border-2 border-dashed ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
            : "border-zinc-300 dark:border-white/15 hover:border-blue-500 dark:hover:border-blue-500/60 hover:bg-blue-500/[0.03] bg-white dark:bg-zinc-950 shadow-xs"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />


        <div className="relative z-10 space-y-6 max-w-lg mx-auto">
          {/* Icon */}
          <div className="flex justify-center">
            {uploading ? (
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400" role="status" aria-label="Parsing resume">
                <RefreshCw className="w-8 h-8 animate-spin" aria-hidden="true" />
              </div>
            ) : isDragActive ? (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <UploadIcon className="w-8 h-8" aria-hidden="true" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileUp className="w-8 h-8" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Heading and descriptions */}
          {uploading ? (
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Reading your resume
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                Pulling out contact details, experience and skills
              </p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                Drop to upload
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                We'll start reading it right away
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Drag and drop your resume
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                  or click anywhere to browse your files
                </p>
              </div>

              <div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-colors text-xs sm:text-sm cursor-pointer"
                >
                  <UploadIcon className="w-4 h-4" aria-hidden="true" />
                  <span>Choose file</span>
                </button>
              </div>

              {/* Supported formats footer */}
              <div className="pt-4 border-t border-zinc-100 dark:border-white/10 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                <span className="font-semibold text-gray-700 dark:text-zinc-300">
                  Supported formats:
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.08] font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  PDF
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.08] font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  DOCX
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.08] font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  DOC
                </span>
                <span className="text-gray-400 dark:text-zinc-600">· Max 5 MB</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">Upload failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

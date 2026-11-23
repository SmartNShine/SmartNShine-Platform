import { useState } from "react";
import toast from "react-hot-toast";
import { Camera, Image as ImageIcon, Loader2, Trash2, Upload, Link2 } from "lucide-react";
import { portfolioAPI } from "@/api/portfolio.api";
import { resolveImageUrl } from "@/utils/imageUrlResolver";

const getCoverImage = (images = []) => {
  if (!Array.isArray(images) || images.length === 0) return null;
  return images.find((img) => img?.isCover && img?.url) || images.find((img) => img?.url) || null;
};

export default function ProjectCoverImageField({
  images = [],
  onChange,
  title = "Project cover image",
  hint = "Upload a screenshot when the project is not live. Themes prefer this over URL previews.",
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const cover = getCoverImage(images);
  const coverUrl = cover?.url || "";

  const commitImages = (nextImages) => {
    onChange?.(nextImages);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading project image...");
    try {
      const res = await portfolioAPI.uploadImage(file);
      if (!res.data?.url) {
        throw new Error("No upload URL returned");
      }

      const next = [
        {
          url: res.data.url,
          alt: file.name?.replace(/\.[^.]+$/, "") || "Project cover",
          isCover: true,
        },
        ...(images || [])
          .filter((img) => img?.url && img.url !== coverUrl)
          .map((img) => ({ ...img, isCover: false })),
      ];
      commitImages(next);
      toast.success("Project image uploaded", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error || err.message || "Failed to upload image",
        { id: toastId }
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const oldUrl = coverUrl;
    const next = (images || []).filter((img) => img?.url && img.url !== oldUrl);
    if (next.length > 0 && !next.some((img) => img.isCover)) {
      next[0] = { ...next[0], isCover: true };
    }
    commitImages(next);

    // Saved assets are cleaned up by the server only after persistence.
    toast.success("Project image removed");
  };

  const handleUrlChange = (url) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) {
      commitImages(
        (images || []).filter((img) => img?.url && img.url !== coverUrl)
      );
      return;
    }

    const rest = (images || [])
      .filter((img) => img?.url && img.url !== coverUrl)
      .map((img) => ({ ...img, isCover: false }));

    commitImages([
      {
        url: trimmed,
        alt: cover?.alt || "Project cover",
        isCover: true,
      },
      ...rest,
    ]);
  };

  return (
    <div className="md:col-span-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 block">
            {title}
          </label>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
            {hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          {showUrlInput ? "Hide URL field" : "Paste image URL"}
        </button>
      </div>

      <div className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-zinc-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 w-full sm:w-auto">
          {coverUrl ? (
            <img
              src={resolveImageUrl(coverUrl)}
              alt={cover?.alt || "Project cover"}
              className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl object-cover border border-gray-200 dark:border-white/10 shrink-0 shadow-sm bg-gray-100 dark:bg-zinc-900"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center text-gray-400 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200 block truncate">
              {coverUrl ? "Cover image set" : "No cover image yet"}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 block">
              {coverUrl
                ? "Shown on project cards when live URL preview is unavailable."
                : "Great for private, local, or undeployed projects."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50">
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                {coverUrl ? <Camera className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{coverUrl ? "Replace" : "Upload"}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUpload(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
          </label>

          {coverUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {showUrlInput && (
        <div className="relative">
          <Link2 className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={coverUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://... (screenshot, Drive, or CDN URL)"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-mono"
          />
        </div>
      )}
    </div>
  );
}

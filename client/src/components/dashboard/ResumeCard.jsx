import { FileText, Edit, Edit3, Trash2, Calendar, CreditCard, Lock, CheckCircle2, User } from "lucide-react";

export default function ResumeCard({
  resume,
  isAdmin,
  onLoad,
  onEditInfo,
  onDelete,
  onUnlockOneTime,
  getResumeAccessBadge,
}) {
  const isLocked = !isAdmin && resume.access?.upgradeRequired;
  const badge = getResumeAccessBadge(resume);
  const BadgeIcon = badge.icon;

  const formattedDate = new Date(resume.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article
      className={`group rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl bg-white dark:bg-zinc-950 ${
        isLocked
          ? "border-amber-500/30 bg-amber-500/[0.02]"
          : "border-gray-200/90 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/20"
      }`}
    >
      <div className="space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                isLocked
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              }`}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>
                <BadgeIcon className="h-3 w-3" />
                <span>{badge.label}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => onEditInfo(resume)}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
            title="Edit resume name & notes"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Resume Title & Target Name */}
        <div className="space-y-1.5 pt-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {resume.resumeTitle || resume.name || "Untitled Resume"}
          </h3>

          {resume.name && (
            <p className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-zinc-400">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{resume.name}</span>
            </p>
          )}

          {resume.description && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed pt-1">
              {resume.description}
            </p>
          )}
        </div>

        {/* Date Meta */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 pt-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Updated {formattedDate}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/[0.08] flex items-center gap-3">
        <button
          type="button"
          onClick={() => onLoad(resume._id)}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 font-bold transition-all duration-200 text-xs sm:text-sm shadow-xs active:scale-95 cursor-pointer"
        >
          <Edit className="w-4 h-4" />
          <span>Edit in Builder</span>
        </button>

        {isLocked && (
          <button
            type="button"
            onClick={() => onUnlockOneTime(resume)}
            className="p-3 border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 rounded-2xl transition-all cursor-pointer"
            title="Unlock AI & Export with One-Time Access"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(resume._id)}
          className="p-3 border border-gray-200 dark:border-white/10 text-gray-400 hover:border-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all cursor-pointer"
          title="Delete Resume"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

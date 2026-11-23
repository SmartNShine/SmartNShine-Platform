import {
  Lightbulb,
  MessageSquare,
  Bug,
  Send,
  ThumbsUp,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export function FeedbackTab({
  feedbackForm,
  setFeedbackForm,
  feedbackTypes,
  feedbackCategories,
  feedbackLoading,
  handleFeedbackSubmit,
  myFeedback,
  loadingFeedback,
  handleUpvote,
  handleDeleteFeedback,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Resolved
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20">
            <AlertCircle className="w-3 h-3" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Feedback Submission Form */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-8 border border-gray-200/90 dark:border-white/[0.08] shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Submit Feedback or Report a Bug
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            Help us make SmartNShine faster, smarter, and more powerful.
          </p>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          {/* Feedback Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Type of Feedback
            </label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = feedbackForm.type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFeedbackForm((prev) => ({ ...prev, type: type.id }))
                    }
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold shadow-xs"
                        : "bg-gray-50/50 dark:bg-zinc-950 border-gray-200 dark:border-white/5 text-gray-600 dark:text-zinc-400 font-medium hover:bg-gray-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                Area / Feature
              </label>
              <select
                value={feedbackForm.category}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {feedbackCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                Priority
              </label>
              <select
                value={feedbackForm.priority}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Issue</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Title / Summary
            </label>
            <input
              type="text"
              value={feedbackForm.title}
              onChange={(e) =>
                setFeedbackForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Add dark mode PDF preview"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={feedbackForm.description}
              onChange={(e) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your suggestion or provide steps to reproduce the issue..."
              className="w-full p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-white text-sm sm:text-base font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={feedbackLoading}
            className="w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {feedbackLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Feedback...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right: Feedback History */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-white/[0.08] shadow-sm space-y-4">
        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
          Your Submitted Feedback
        </h3>

        {loadingFeedback ? (
          <p className="text-xs text-gray-500 dark:text-zinc-400 py-6 text-center">
            Loading your submissions...
          </p>
        ) : myFeedback.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-zinc-400 py-6 text-center">
            You haven't submitted any feedback tickets yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {myFeedback.map((item) => (
              <div
                key={item._id}
                className="p-4 rounded-2xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200/70 dark:border-white/5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                    {item.title}
                  </h4>
                  {getStatusBadge(item.status)}
                </div>

                <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5 text-xs text-gray-400">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpvote(item._id)}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{item.upvotes || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(item._id)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

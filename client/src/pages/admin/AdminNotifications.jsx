import {useCallback, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {
  Archive,
  Bell,
  Check,
  CheckCheck,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import {
  archiveNotification,
  deleteNotification,
  getAdminNotificationStats,
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/admin.api";
import {parseValidationErrors} from "@/utils/errorHandler";

const typeOptions = [
  {value: "", label: "All Types"},
  {value: "user", label: "Users"},
  {value: "ai", label: "AI"},
  {value: "payment", label: "Payments"},
  {value: "quota", label: "Quota"},
  {value: "system", label: "System"},
  {value: "contact", label: "Contact"},
  {value: "feedback", label: "Feedback"},
  {value: "security", label: "Security"},
];

const severityOptions = [
  {value: "", label: "All Severity"},
  {value: "info", label: "Info"},
  {value: "warning", label: "Warning"},
  {value: "error", label: "Error"},
  {value: "critical", label: "Critical"},
];

const statusOptions = [
  {value: "", label: "All Status"},
  {value: "unread", label: "Unread"},
  {value: "read", label: "Read"},
  {value: "archived", label: "Archived"},
];

const typeIcons = {
  user: UserPlus,
  ai: Sparkles,
  payment: CreditCard,
  quota: ShieldAlert,
  system: XCircle,
  contact: MessageSquare,
  feedback: MessageSquare,
  security: ShieldAlert,
};

const severityClasses = {
  info: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
  warning:
    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  error: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  critical:
    "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
};

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
};

const titleCase = (value) =>
  String(value || "unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const StatCard = ({label, value, icon: Icon, tone}) => (
  <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
          {value || 0}
        </p>
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    severity: "",
    search: "",
    page: 1,
    limit: 20,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationResponse, statsResponse] = await Promise.all([
        getAdminNotifications(filters),
        getAdminNotificationStats(),
      ]);
      setNotifications(notificationResponse.data.data.notifications);
      setPagination(notificationResponse.data.data.pagination);
      setStats(statsResponse.data.data);
    } catch (error) {
      toast.error(parseValidationErrors(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Lock background body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (showDetailModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          handleCloseDetailModal();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showDetailModal]);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: 1,
    }));
  };

  const handleOpenDetailModal = async (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);

    if (notification.status === "unread") {
      try {
        await markNotificationRead(notification._id);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? {...item, status: "read"} : item
          )
        );
        setSelectedNotification((prev) =>
          prev ? {...prev, status: "read"} : null
        );
        getAdminNotificationStats().then((res) => {
          if (res?.data?.data) setStats(res.data.data);
        });
      } catch (err) {
        console.error("Failed to mark as read on view:", err);
      }
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const handleCopyText = (text, label = "Content") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const runNotificationAction = async (action, id, successMessage) => {
    try {
      setActionLoading(id || action);
      if (action === "read") await markNotificationRead(id);
      if (action === "archive") await archiveNotification(id);
      if (action === "delete") await deleteNotification(id);
      if (action === "read-all") await markAllNotificationsRead();
      toast.success(successMessage);
      if (showDetailModal && selectedNotification?._id === id) {
        if (action === "delete") {
          handleCloseDetailModal();
        } else if (action === "archive") {
          setSelectedNotification((prev) =>
            prev ? {...prev, status: "archived"} : null
          );
        }
      }
      await fetchNotifications();
    } catch (error) {
      toast.error(parseValidationErrors(error));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
            <Bell className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">
              Admin Notifications
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notification Center
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor real-time system alerts, user actions, and error reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() =>
              runNotificationAction(
                "read-all",
                null,
                "All notifications marked as read"
              )
            }
            disabled={!stats?.unread}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unread Alerts"
          value={stats?.unread}
          icon={Bell}
          tone="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
        />
        <StatCard
          label="Critical Events"
          value={stats?.critical}
          icon={ShieldAlert}
          tone="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
        />
        <StatCard
          label="System Errors"
          value={stats?.errors}
          icon={XCircle}
          tone="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        />
        <StatCard
          label="Today's Activity"
          value={stats?.today}
          icon={Sparkles}
          tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-black">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.severity}
            onChange={(e) => updateFilter("severity", e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-black">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-400 opacity-40" />
            <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
              No notifications found
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              New platform events will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const isUnread = notification.status === "unread";

              return (
                <article
                  key={notification._id}
                  className={`p-5 transition hover:bg-gray-50 dark:hover:bg-white/5 ${
                    isUnread ? "bg-cyan-500/[0.04]" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h2>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              severityClasses[notification.severity]
                            }`}
                          >
                            {titleCase(notification.severity)}
                          </span>
                          {isUnread && (
                            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                              Unread
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
                          <span>{titleCase(notification.type)}</span>
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.userId && (
                            <span>
                              {notification.userId.name} ({notification.userId.email})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDetailModal(notification)}
                        className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                      >
                        View
                      </button>
                      {isUnread && (
                        <button
                          onClick={() =>
                            runNotificationAction(
                              "read",
                              notification._id,
                              "Notification marked as read"
                            )
                          }
                          disabled={actionLoading === notification._id}
                          className="inline-flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 transition hover:bg-green-500/20 dark:text-green-400"
                        >
                          <Check className="h-4 w-4" />
                          Read
                        </button>
                      )}
                      {notification.status !== "archived" && (
                        <button
                          onClick={() =>
                            runNotificationAction(
                              "archive",
                              notification._id,
                              "Notification archived"
                            )
                          }
                          disabled={actionLoading === notification._id}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() =>
                          runNotificationAction(
                            "delete",
                            notification._id,
                            "Notification deleted"
                          )
                        }
                        disabled={actionLoading === notification._id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    page: previous.page - 1,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-white/10 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    page: previous.page + 1,
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-white/10 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Fixed Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDetailModal}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black">
                  {(() => {
                    const ModalIcon =
                      typeIcons[selectedNotification.type] || Bell;
                    return <ModalIcon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Notification Details
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {titleCase(selectedNotification.type)} Event •{" "}
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetailModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    severityClasses[selectedNotification.severity] ||
                    severityClasses.info
                  }`}
                >
                  Severity: {titleCase(selectedNotification.severity)}
                </span>
                <span className="rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                  Target: {titleCase(selectedNotification.targetType || "System")}
                </span>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                  Status: Read
                </span>
              </div>

              {/* Title */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedNotification.title}
                </h4>
              </div>

              {/* Message Box */}
              <div className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message Content
                  </span>
                  <button
                    onClick={() =>
                      handleCopyText(
                        selectedNotification.message,
                        "Notification message"
                      )
                    }
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed break-words">
                  {selectedNotification.message}
                </p>
              </div>

              {/* User Info If Applicable */}
              {selectedNotification.userId && (
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/40 p-4 space-y-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Associated User
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedNotification.userId.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedNotification.userId.email}
                      </p>
                    </div>
                    {selectedNotification.userId._id && (
                      <button
                        onClick={() => {
                          handleCloseDetailModal();
                          navigate(`/admin/users/${selectedNotification.userId._id}`);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        <span>View User Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Details */}
              {selectedNotification.metadata &&
                Object.keys(selectedNotification.metadata).length > 0 && (
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Event Metadata
                      </span>
                      <button
                        onClick={() =>
                          handleCopyText(
                            JSON.stringify(selectedNotification.metadata, null, 2),
                            "Metadata JSON"
                          )
                        }
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy JSON
                      </button>
                    </div>
                    <pre className="text-xs bg-white dark:bg-zinc-950 p-3 rounded-lg border border-gray-200/60 dark:border-white/5 overflow-x-auto text-gray-800 dark:text-gray-300 font-mono">
                      {JSON.stringify(selectedNotification.metadata, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Action Link Banner */}
              {selectedNotification.actionUrl &&
                selectedNotification.actionUrl !== "/admin/notifications" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div>
                      <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                        Associated Page Destination
                      </p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                        {selectedNotification.actionUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleCloseDetailModal();
                        navigate(selectedNotification.actionUrl);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Open Page</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedNotification.status !== "archived" && (
                  <button
                    onClick={() =>
                      runNotificationAction(
                        "archive",
                        selectedNotification._id,
                        "Notification archived"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                )}
                <button
                  onClick={() =>
                    runNotificationAction(
                      "delete",
                      selectedNotification._id,
                      "Notification deleted"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="rounded-lg border border-gray-200 dark:border-white/10 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;

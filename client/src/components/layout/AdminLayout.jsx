import {useEffect, useRef, useState} from "react";
import {Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {useToggle} from "@/hooks";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  FileBox,
  Activity,
  Moon,
  Sun,
  TrendingUp,
  Sparkles,
  Bell,
  HelpCircle,
  Check,
  CheckCheck,
  ArrowRight,
  CreditCard,
  ShieldAlert,
  XCircle,
  UserPlus,
  Loader2,
  Bot,
  Globe,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Logo from "@/components/common/Logo";
import {useAuth} from "@/context/AuthContext";
import {useDarkMode} from "@/context/DarkModeContext";
import {PageTransition} from "@/components/common";
import {
  getAdminNotificationStats,
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/admin.api";

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

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

const AdminLayout = () => {
  const [
    isSidebarOpen,
    toggleSidebarOpen,
    setIsSidebarOpenTrue,
    setIsSidebarOpenFalse,
  ] = useToggle(true);
  const [
    isMobileMenuOpen,
    toggleMobileMenu,
    setIsMobileMenuOpenTrue,
    setIsMobileMenuOpenFalse,
  ] = useToggle(false);

  const location = useLocation();
  const navigate = useNavigate();
  const {user, logout} = useAuth();
  const {isDarkMode, toggleDarkMode} = useDarkMode();
  const [notificationStats, setNotificationStats] = useState(null);

  // Notification popover state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [quickNotifications, setQuickNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpenTrue();
        setIsMobileMenuOpenFalse();
      } else {
        setIsSidebarOpenFalse();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarOpenTrue, setIsSidebarOpenFalse, setIsMobileMenuOpenFalse]);

  const navigationGroups = [
    {
      group: "Overview",
      items: [
        {
          path: "/admin/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
          accentColor: "text-indigo-500",
        },
        {
          path: "/admin/earnings",
          icon: TrendingUp,
          label: "Financials & Revenue",
          accentColor: "text-emerald-500",
        },
      ],
    },
    {
      group: "Core Management",
      items: [
        {
          path: "/admin/users",
          icon: Users,
          label: "Users & Accounts",
          accentColor: "text-sky-500",
        },
        {
          path: "/admin/careers",
          icon: UserPlus,
          label: "Founding Candidates",
          accentColor: "text-amber-500",
        },
        {
          path: "/admin/templates",
          icon: FileBox,
          label: "Resume Templates",
          accentColor: "text-violet-500",
        },
        {
          path: "/admin/portfolios",
          icon: Globe,
          label: "Public Portfolios",
          accentColor: "text-teal-500",
        },
        {
          path: "/admin/questions",
          icon: HelpCircle,
          label: "Question Bank",
          accentColor: "text-blue-500",
        },
      ],
    },
    {
      group: "AI & Platform Intelligence",
      items: [
        {
          path: "/admin/interviews",
          icon: Bot,
          label: "AI Interviews & Costs",
          accentColor: "text-purple-500",
        },
        {
          path: "/admin/ai-analytics",
          icon: Sparkles,
          label: "AI Operations & Quotas",
          accentColor: "text-rose-500",
        },
      ],
    },
    {
      group: "Support & Logs",
      items: [
        {
          path: "/admin/feedback",
          icon: MessageSquare,
          label: "Messages & Inquiries",
          accentColor: "text-pink-500",
        },
        {
          path: "/admin/notifications",
          icon: Bell,
          label: "Platform Alerts",
          accentColor: "text-amber-500",
        },
        {
          path: "/admin/settings",
          icon: Settings,
          label: "System Settings",
          accentColor: "text-zinc-500",
        },
      ],
    },
  ];

  const allMenuItems = navigationGroups.flatMap((g) => g.items);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchNotificationStats = async () => {
    try {
      const response = await getAdminNotificationStats();
      setNotificationStats(response.data.data);
    } catch {
      setNotificationStats(null);
    }
  };

  const fetchQuickNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await getAdminNotifications({limit: 6});
      setQuickNotifications(response.data.data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotificationStats();
    const interval = window.setInterval(fetchNotificationStats, 60000);
    return () => window.clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    setIsNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationOpen]);

  const handleToggleNotifications = () => {
    const nextState = !isNotificationOpen;
    setIsNotificationOpen(nextState);
    if (nextState) {
      fetchQuickNotifications();
      fetchNotificationStats();
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
      setQuickNotifications((prev) =>
        prev.map((item) => ({...item, status: "read"}))
      );
      fetchNotificationStats();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationItemClick = async (notification) => {
    if (notification.status === "unread") {
      try {
        await markNotificationRead(notification._id);
        setQuickNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? {...n, status: "read"} : n))
        );
        fetchNotificationStats();
      } catch {
        // silent fail
      }
    }
    setIsNotificationOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate("/admin/notifications");
    }
  };

  const handleSingleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setQuickNotifications((prev) =>
        prev.map((n) => (n._id === id ? {...n, status: "read"} : n))
      );
      fetchNotificationStats();
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpenFalse();
  };

  const activeMenuItem =
    allMenuItems.find((item) => location.pathname.startsWith(item.path)) ||
    allMenuItems[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white dark:selection:bg-indigo-500 dark:selection:text-white">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Docked Static Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 px-5 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
          <Link
            to="/admin/dashboard"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center p-1.5 transition-transform group-hover:scale-95 shadow-xs">
              <Logo
                className="w-full h-full object-contain filter invert-0 dark:invert"
                alt="SmartNShine logo"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white leading-none">
                SmartNShine
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500 mt-1">
                Admin Console
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileMenu}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-indigo-400 dark:text-indigo-600"
                            : `${item.accentColor} opacity-75 group-hover:opacity-100`
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 shrink-0">
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-md border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Candidate Portal</span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </Link>

          <div className="mt-2.5 px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            <span>v2.4.0 • Enterprise</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container Pinned Beside Docked Sidebar */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Docked Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                Admin
              </span>
              <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 hidden sm:inline" />
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>{activeMenuItem?.label || "Console"}</span>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Popover */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`relative p-2 rounded-md border text-xs font-medium transition-colors ${
                  isNotificationOpen
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                aria-label="Platform Notifications"
              >
                <Bell className="w-4 h-4" />
                {notificationStats?.unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-xs">
                    {notificationStats.unread > 99
                      ? "99+"
                      : notificationStats.unread}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Notifications
                      </span>
                      {notificationStats?.unread > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
                          {notificationStats.unread} unread
                        </span>
                      )}
                    </div>
                    {notificationStats?.unread > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[340px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {loadingNotifications ? (
                      <div className="p-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-xs font-mono">Loading alerts...</span>
                      </div>
                    ) : quickNotifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                        <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    ) : (
                      quickNotifications.map((item) => {
                        const Icon = typeIcons[item.type] || Bell;
                        const isUnread = item.status === "unread";
                        return (
                          <div
                            key={item._id}
                            onClick={() => handleNotificationItemClick(item)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 cursor-pointer transition-colors ${
                              isUnread
                                ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                : ""
                            }`}
                          >
                            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                              <Icon className="w-3.5 h-3.5 text-indigo-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                                  {item.title}
                                </p>
                                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                  {formatTimeAgo(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                  {item.severity || "info"}
                                </span>
                                {isUnread && (
                                  <button
                                    onClick={(e) => handleSingleMarkRead(e, item._id)}
                                    className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <Check className="w-3 h-3" />
                                    Read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <Link
                      to="/admin/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-md bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
                    >
                      <span>All Platform Alerts</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
              aria-label="Toggle theme mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Admin Identity Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-zinc-900 dark:text-white leading-none truncate max-w-[120px]">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 leading-none mt-1">
                  Superuser
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

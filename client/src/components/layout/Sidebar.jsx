import {Link, useLocation} from "react-router-dom";
import {BlockableLink} from "@/components/auth";
import {
  Home,
  Grid,
  Palette,
  Wand2,
  Target,
  Mail,
  LayoutDashboard,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCircle,
  Tag,
  Mic,
  HelpCircle,
  TrendingUp,
  FileText,
  History,
} from "lucide-react";
import {useAuth} from "@/context/AuthContext";
import Logo from "@/components/common/Logo";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const {user} = useAuth();
  const isAdmin = user?.role === "admin";

  const navLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      description: "Platform Command Center",
      requiresAuth: true,
    },
    {
      name: "My Resumes",
      path: "/my-resumes",
      icon: FileText,
      description: "Manage your resumes",
      requiresAuth: true,
    },
    {
      name: "Templates",
      path: "/templates",
      icon: Palette,
      description: "Browse templates",
    },
    {
      name: "AI Enhancer",
      path: "/upload",
      icon: Wand2,
      description: "Build resume with AI",
    },
    {
      name: "ATS Analyzer",
      path: "/ats-analyzer",
      icon: Target,
      description: "Check ATS compatibility",
    },
    {
      name: "AI Interview",
      path: "/interview",
      icon: Mic,
      description: "AI Mock Interview Studio",
      requiresAuth: true,
      badge: "NEW",
    },
    {
      name: "Interview History",
      path: "/interview/history",
      icon: History,
      description: "Past interviews & reports",
      requiresAuth: true,
    },
    {
      name: "Career Profile",
      path: "/career-profile",
      icon: UserCircle,
      description: "Your master career info",
      requiresAuth: true,
      openNewTab: true,
    },
    {
      name: "Career Q&A",
      path: "/career-qa",
      icon: HelpCircle,
      description: "Personalized answer bank",
      requiresAuth: true,
      openNewTab: true,
    },
    {
      name: "Portfolios",
      path: "/portfolio",
      icon: Globe2,
      description: "Manage portfolio websites",
      requiresAuth: true,
    },
    // Temporarily disabled - Advanced Analytics
    // {
    //   name: "Analytics",
    //   path: "/analytics",
    //   icon: TrendingUp,
    //   description: "Advanced insights",
    //   badge: "PRO",
    // },
    {
      name: "Profile",
      path: "/profile",
      icon: UserCircle,
      description: "Profile & Subscription",
      requiresAuth: true,
    },
    {
      name: "Pricing",
      path: "/pricing",
      icon: Tag,
      description: "View Pricing",
    },
    {
      name: "Contact",
      path: "/contact",
      icon: Mail,
      description: "Get in touch",
    },
    {
      name: "Landing Page",
      path: "/",
      icon: Home,
      description: "Explore Landing",
    },
  ];

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/#")) return false;
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Floating Sidebar (curved from top and bottom, not connected to screen) */}
      <aside
        className={`fixed z-50 overflow-hidden will-change-transform will-change-[width] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          /* Detached floating offsets: space at top, bottom, and left */
          top-3 bottom-3 left-3 lg:top-3.5 lg:bottom-3.5 lg:left-3.5
          /* Curvature at top and bottom */
          rounded-2xl lg:rounded-3xl
          /* Elevated floating surface */
          bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl
          border border-gray-200/85 dark:border-white/10
          shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)]
          dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.7),0_0_1px_1px_rgba(255,255,255,0.05)]
          ${
            isOpen
              ? "translate-x-0 w-[calc(100vw-1.5rem)] max-w-72 lg:w-64"
              : "-translate-x-[120%] w-64 lg:translate-x-0 lg:w-20"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-3.5 border-b border-gray-200/80 dark:border-white/10">
            {/* Expanded Logo */}
            {isOpen ? (
              <>
                <Link
                  to={user ? "/dashboard" : "/"}
                  className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white group overflow-hidden"
                >
                  <Logo
                    className="w-8 h-8 object-contain group-hover:scale-105 transition-transform duration-200 flex-shrink-0"
                    alt="SmartNShine Logo"
                  />
                  <span className="leading-none font-black tracking-tight truncate">
                    SmartNShine
                  </span>
                </Link>

                {/* Toggle Button (Desktop) */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 flex-shrink-0"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Collapsed Header: Clean vertical layout with logo and dedicated expand button */
              <div className="w-full flex flex-col items-center justify-center gap-1.5 py-1">
                <Link
                  to={user ? "/dashboard" : "/"}
                  className="flex items-center justify-center p-0.5 rounded-xl hover:opacity-85 transition-opacity"
                  title="SmartNShine Dashboard"
                >
                  <Logo
                    className="w-8 h-8 object-contain"
                    alt="SmartNShine Logo"
                  />
                </Link>
                <button
                  onClick={() => setIsOpen(true)}
                  className="w-8 h-4.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-2xs cursor-pointer group"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col">
            <div className="space-y-1 flex-1">
              {/* Admin Panel Link */}
              {isAdmin && (
                <BlockableLink
                  to="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 ${
                    !isOpen ? "justify-center px-0" : "px-3"
                  } ${
                    location.pathname.startsWith("/admin")
                      ? "bg-gray-900/10 text-gray-900 dark:bg-white/10 dark:text-white font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  title={!isOpen ? "Admin Panel" : ""}
                >
                  <Shield
                    className={`w-5 h-5 flex-shrink-0 ${
                      location.pathname.startsWith("/admin")
                        ? ""
                        : "group-hover:scale-110 transition-transform duration-200"
                    }`}
                  />
                  {isOpen && (
                    <span className="font-medium text-sm">Admin Panel</span>
                  )}
                  {isOpen && location.pathname.startsWith("/admin") && (
                    <span className="ml-auto bg-gray-900/10 dark:bg-white/10 text-gray-900 dark:text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      Active
                    </span>
                  )}
                </BlockableLink>
              )}

              {/* Regular Navigation Links */}
              {navLinks.slice(0, -3).map((link) => {
                // Skip links that require auth when user is not logged in
                if (link.requiresAuth && !user) return null;

                const Icon = link.icon;
                const isActive = isActivePath(link.path);

                const linkClass = `group flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 ${
                  !isOpen ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "bg-gray-900/10 text-gray-900 dark:bg-white/10 dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white"
                }`;

                const content = (
                  <>
                    <div className="relative flex items-center justify-center">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          !isActive &&
                          "group-hover:scale-110 transition-transform duration-200"
                        }`}
                      />
                      {!isOpen && link.badge && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-amber-500 to-orange-500 ring-2 ring-white dark:ring-zinc-950"></span>
                        </span>
                      )}
                    </div>
                    {isOpen && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium text-sm">{link.name}</span>
                        {link.badge && (
                          <span className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <span>{link.badge}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </>
                );

                return link.isHash ? (
                  <a
                    key={link.name}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={linkClass}
                    title={!isOpen ? link.name : ""}
                  >
                    {content}
                  </a>
                ) : (
                  <BlockableLink
                    key={link.name}
                    to={link.path}
                    target={link.openNewTab ? "_blank" : undefined}
                    rel={link.openNewTab ? "noopener noreferrer" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={linkClass}
                    title={!isOpen ? link.name : ""}
                  >
                    {content}
                  </BlockableLink>
                );
              })}
            </div>

            {/* Bottom Navigation Links (Profile, Pricing & Contact) */}
            <div className="space-y-1 mt-auto pt-2 border-t border-gray-200/80 dark:border-white/10">
              {navLinks.slice(-3).map((link) => {
                // Skip Profile link if user is not logged in
                if (link.requiresAuth && !user) return null;

                const Icon = link.icon;
                const isActive = isActivePath(link.path);

                const linkClass = `group flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 ${
                  !isOpen ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "bg-gray-900/10 text-gray-900 dark:bg-white/10 dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white"
                }`;

                const content = (
                  <>
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${!isActive &&
                        "group-hover:scale-110 transition-transform duration-200"
                        }`}
                    />
                    {isOpen && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium text-sm">{link.name}</span>
                        {link.badge && (
                          <span className="bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {link.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                );

                return (
                  <BlockableLink
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={linkClass}
                    title={!isOpen ? link.name : ""}
                  >
                    {content}
                  </BlockableLink>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200/80 dark:border-white/10 p-3">
            {isOpen ? (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center font-medium">
                © 2026 SmartNShine
              </p>
            ) : (
              <button
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex items-center justify-center w-full py-1.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

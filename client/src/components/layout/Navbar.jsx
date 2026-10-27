import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BlockableLink } from "@/components/auth";
import { DarkModeToggle, FestiveSaleBanner } from "@/components/common";
import Logo from "@/components/common/Logo";
import { useEffect, useMemo } from "react";
import { useToggle } from "@/hooks";
import {
  Menu,
  Sparkles,
  User,
  LogOut,
  Shield,
  ArrowRight,
  Palette,
  Wand2,
  Target,
  LayoutDashboard,
  UserCircle,
  Mic,
  Globe2,
  Tag,
  Home,
  FileText,
  History,
} from "lucide-react";

const Navbar = ({ toggleSidebar, isSidebarOpen, promotion }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, , setIsScrolledTrue, setIsScrolledFalse] = useToggle(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolledTrue();
      } else {
        setIsScrolledFalse();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setIsScrolledTrue, setIsScrolledFalse]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user?.role === "admin";
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.name || user?.email?.split("@")[0] || "Account";

  const userInitial = (displayName?.[0] || "U").toUpperCase();

  // Dynamic Workspace Meta for Desktop Header
  const activeWorkspace = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) {
      return { title: "Dashboard", icon: LayoutDashboard, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/templates")) {
      return { title: "Resume Templates", icon: Palette, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/upload")) {
      return { title: "AI Enhancer", icon: Wand2, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/ats-analyzer")) {
      return { title: "ATS Diagnostics", icon: Target, color: "text-emerald-600 dark:text-emerald-400" };
    }
    if (path.startsWith("/interview/history") || path.startsWith("/interview/result")) {
      return { title: "Interview History & Reports", icon: History, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/interview")) {
      return { title: "AI Interview Studio", icon: Mic, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/my-resumes")) {
      return { title: "My Resumes", icon: FileText, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/career-profile")) {
      return { title: "Career Profile", icon: UserCircle, color: "text-amber-600 dark:text-amber-400" };
    }
    if (path.startsWith("/career-qa")) {
      return { title: "Career Q&A", icon: Mic, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/portfolio")) {
      return { title: "Developer Portfolios", icon: Globe2, color: "text-cyan-600 dark:text-cyan-400" };
    }
    if (path.startsWith("/pricing")) {
      return { title: "Pricing & Plans", icon: Tag, color: "text-blue-600 dark:text-blue-400" };
    }
    if (path.startsWith("/admin")) {
      return { title: "Admin Console", icon: Shield, color: "text-zinc-600 dark:text-zinc-400" };
    }
    if (path.startsWith("/profile")) {
      return { title: "Account & Profile", icon: User, color: "text-zinc-600 dark:text-zinc-400" };
    }
    return { title: "SmartNShine", icon: Home, color: "text-zinc-400" };
  }, [location.pathname]);

  const ActiveIcon = activeWorkspace.icon;

  return (
    <nav
      className={`fixed top-0 right-0 z-40 transition-all duration-300 no-print ${
        isSidebarOpen ? "left-0 lg:left-72" : "left-0 lg:left-28"
      } ${
        isScrolled
          ? "bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 shadow-xs"
          : "bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left Section: Mobile Menu OR Desktop Clean Workspace Indicator */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button + Brand Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-sm font-bold">
                <Logo
                  className="h-7 w-7 object-contain"
                  alt="SmartNShine Logo"
                />
                <span className="text-zinc-900 dark:text-white font-bold">
                  SmartNShine
                </span>
              </Link>
            </div>

            {/* Desktop Clean Workspace Indicator (Calm, minimal, zero noise) */}
            <div className="hidden lg:flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <ActiveIcon className={`w-4 h-4 ${activeWorkspace.color || "text-zinc-400"}`} />
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {activeWorkspace.title}
              </span>
            </div>
          </div>

          {/* Right Section: Clean, minimal actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {user ? (
              <>
                {/* Admin Portal Button if Admin */}
                {isAdmin && (
                  <BlockableLink
                    to="/admin/dashboard"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Admin Portal"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </BlockableLink>
                )}

                {/* User Avatar & Name linking to Profile */}
                <BlockableLink
                  to="/profile"
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                  title="Profile & Settings"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white max-w-[130px] truncate">
                    {displayName}
                  </span>
                </BlockableLink>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <BlockableLink
                  to="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
                  title="Login"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </BlockableLink>

                {/* CTA: Build Resume */}
                <BlockableLink
                  to="/upload"
                  className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Build My Resume"
                >
                  <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Build Resume</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </BlockableLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

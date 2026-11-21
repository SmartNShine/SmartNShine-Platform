import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import TPOSidebar from "./TPOSidebar";
import TPO3DButton from "./TPO3DButton";
import { useTPO } from "@/context/TPOContext";
import { useDarkMode } from "@/context/DarkModeContext";
import { PageTransition } from "@/components/common";

const PAGE_TITLES = [
  { match: "dashboard", label: "Campus Overview" },
  { match: "students", label: "Student Directory" },
  { match: "resume-analytics", label: "Resume Intelligence" },
  { match: "interview-analytics", label: "Interview Analytics" },
  { match: "readiness", label: "Readiness Engine" },
  { match: "assignments", label: "Assignments" },
  { match: "announcements", label: "Announcements" },
  { match: "leaderboard", label: "Cohort Leaderboard" },
  { match: "reports", label: "Executive Reports" },
  { match: "settings", label: "Campus Settings" },
];

export default function TPOLayout() {
  const { tpoUser, institution, logoutTpo } = useTPO();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pageLabel =
    PAGE_TITLES.find((item) => location.pathname.includes(item.match))?.label ||
    "Placement Office";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    logoutTpo();
    navigate("/tpo/login");
  };

  const statusDot =
    institution?.status === "suspended" || institution?.status === "rejected"
      ? "bg-rose-500"
      : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <TPOSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <TPO3DButton
              type="button"
              variant="surface"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </TPO3DButton>
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                Campus
              </span>
              <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 hidden sm:inline shrink-0" />
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="truncate">{pageLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-[220px]">
              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {institution?.name || "Institution"}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
            </div>

            <TPO3DButton
              type="button"
              variant="surface"
              size="icon"
              onClick={toggleDarkMode}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </TPO3DButton>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {tpoUser?.name?.charAt(0)?.toUpperCase() || "T"}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-zinc-900 dark:text-white leading-none truncate max-w-[120px]">
                  {tpoUser?.name || "Placement Officer"}
                </p>
                <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 leading-none mt-1 truncate max-w-[120px]">
                  {tpoUser?.tpoProfile?.designation || "TPO"}
                </p>
              </div>
            </div>

            <TPO3DButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:!text-rose-400 dark:hover:!text-rose-600"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </TPO3DButton>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

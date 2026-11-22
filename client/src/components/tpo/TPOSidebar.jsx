import { NavLink } from "react-router-dom";
import { useTPO } from "@/context/TPOContext";
import { isCampusSuspended, normalizeCampusStatus } from "@/utils/campusStatus";
import TPO3DButton from "./TPO3DButton";
import Logo from "@/components/common/Logo";
import {
  LayoutDashboard,
  Users,
  FileText,
  Mic2,
  Brain,
  Megaphone,
  BarChart3,
  Settings,
  X,
  ExternalLink,
  GraduationCap,
  Building2,
} from "lucide-react";

const navigationGroups = [
  {
    group: "Overview",
    items: [
      {
        path: "/tpo/dashboard",
        label: "Campus Overview",
        icon: LayoutDashboard,
        accentColor: "text-indigo-500",
      },
      {
        path: "/tpo/students",
        label: "Student Directory",
        icon: Users,
        accentColor: "text-sky-500",
      },
    ],
  },
  {
    group: "Placement Intelligence",
    items: [
      {
        path: "/tpo/resume-analytics",
        label: "Resume Intelligence",
        icon: FileText,
        accentColor: "text-emerald-500",
      },
      {
        path: "/tpo/interview-analytics",
        label: "Interview Analytics",
        icon: Mic2,
        accentColor: "text-purple-500",
      },
      {
        path: "/tpo/readiness",
        label: "Readiness Engine",
        icon: Brain,
        accentColor: "text-indigo-500",
      },
    ],
  },
  {
    group: "Campus Operations",
    items: [
      {
        path: "/tpo/announcements",
        label: "Announcements",
        icon: Megaphone,
        accentColor: "text-rose-500",
      },
      {
        path: "/tpo/reports",
        label: "Executive Reports",
        icon: BarChart3,
        accentColor: "text-teal-500",
      },
    ],
  },
  {
    group: "Institution",
    items: [
      {
        path: "/tpo/settings",
        label: "Campus Settings",
        icon: Settings,
        accentColor: "text-zinc-500",
      },
    ],
  },
];

export default function TPOSidebar({ mobileOpen, onClose }) {
  const { institution } = useTPO();

  const campusStatus = normalizeCampusStatus(institution?.status);
  const suspended = isCampusSuspended(institution?.status);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 px-5 flex items-center justify-between shrink-0">
        <NavLink
          to="/tpo/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center shrink-0">
            <Logo className="w-5 h-5 object-contain" alt="SmartNShine" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white leading-none truncate">
              SmartNShine
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500 mt-1">
              Campus TPO
            </span>
          </div>
        </NavLink>
        <TPO3DButton
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </TPO3DButton>
      </div>

      {institution && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                {institution.name}
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                  suspended
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    suspended ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                {campusStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              {group.group}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/tpo/dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/80"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? "text-indigo-400 dark:text-indigo-600"
                              : `${item.accentColor} opacity-80`
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950 shrink-0">
        <a
          href="/dashboard"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            Student Portal
          </span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </a>
        <div className="mt-2.5 px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
          <span>Campus Suite</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Live
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

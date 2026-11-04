import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import adaptPortfolioData from "./themes/adaptPortfolioData";
import { getPortfolioTheme } from "./themes/themeRegistry";
import PortfolioNavbar from "./PortfolioNavbar";

const PortfolioThemeRenderer = ({
  portfolio,
  resume,
  projects,
  mode = "public",
  customThemeMode,
  onThemeModeChange,
  onContactClick,
  onProjectClick,
  onResumeClick,
  resumeDownloadUrl,
}) => {
  const [localDarkMode, setIsDarkMode] = useState(false);
  const isControlled = customThemeMode === "light" || customThemeMode === "dark";
  const isDarkMode = isControlled ? customThemeMode === "dark" : localDarkMode;

  useEffect(() => {
    if (isControlled) return;
    // Check initial preference or localStorage
    const savedTheme = localStorage.getItem("portfolio-theme");
    const systemPrefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, [isControlled]);

  const toggleDarkMode = () => {
    if (isControlled) {
      onThemeModeChange?.(isDarkMode ? "light" : "dark");
      return;
    }
    setIsDarkMode((current) => {
      const next = !current;

      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("portfolio-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("portfolio-theme", "light");
      }

      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const theme = getPortfolioTheme(portfolio?.themeId);
  const ThemeComponent = theme.component;
  const data = adaptPortfolioData({
    portfolio,
    resume,
    projects,
    mode,
    onContactClick,
    onProjectClick,
    onResumeClick,
    resumeDownloadUrl,
  });

  // Inject themeAccent as an inline CSS variable override so the live
  // accent customizer works without re-rendering the full theme.
  const accentStyle = portfolio?.themeAccent
    ? {
        "--pt-accent": portfolio.themeAccent,
        "--pt-accent-dim": `${portfolio.themeAccent}30`,
      }
    : undefined;

  return (
    <>
      <div
        data-portfolio-theme={portfolio?.themeId || "minimalDeveloper"}
        data-color-mode={isDarkMode ? "dark" : "light"}
        style={{
          ...accentStyle,
          backgroundColor: "var(--pt-bg)",
          color: "var(--pt-text)",
        }}
        className={`relative min-h-screen transition-colors duration-300 ${
          isDarkMode ? "dark portfolio-dark" : "portfolio-light"
        }`}
      >
        <style>{`
          html {
            scroll-behavior: smooth;
          }
          [data-portfolio-theme].portfolio-dark {
            background-color: var(--pt-bg, #09090b) !important;
            color: var(--pt-text, #f4f4f5) !important;
          }

          [data-portfolio-theme] .pt-accent-surface {
            background-color: var(--pt-accent-dim) !important;
            border-color: var(--pt-accent) !important;
          }

          [data-portfolio-theme] .pt-accent-text {
            color: var(--pt-accent) !important;
          }

          [data-portfolio-theme] .pt-accent-fill {
            background-color: var(--pt-accent) !important;
            color: var(--pt-accent-text) !important;
          }
        `}</style>

        {/* Bespoke navigation themes */}
        {theme.id !== "techPortfolio" &&
          theme.id !== "smartnshine" &&
          theme.id !== "swissArchitectural" &&
          theme.id !== "neomorphic" &&
          theme.id !== "liquidGlass" &&
          theme.id !== "retroFuturistic" &&
          theme.id !== "magazine" &&
          theme.id !== "kinetic" && (
            <PortfolioNavbar
              data={data}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              accentColor={portfolio?.themeAccent}
            />
          )}

        {/* Theme Content */}
        <ThemeComponent
          data={data}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          accentColor={portfolio?.themeAccent}
        />

        {mode === "public" &&
          portfolio?.settings?.showSmartNShineBranding !== false && (
            <footer className="border-t border-gray-200/80 bg-white px-5 py-6 text-center text-xs sm:text-sm text-gray-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400">
              Generated with{" "}
              <a
                href="https://www.smartnshine.in"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-gray-900 dark:text-white underline-offset-4 hover:underline"
              >
                SmartNShine
              </a>{" "}
              • Precision Career Platform
            </footer>
          )}

        {/* Floating Theme Toggle Shortcut */}
        <button
          onClick={toggleDarkMode}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full shadow-2xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-amber-400 backdrop-blur-xl border border-white/80 dark:border-white/15 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-cyan-500/20 cursor-pointer"
          aria-label="Toggle dark mode"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-800" />
          )}
        </button>
      </div>
    </>
  );
};

export default PortfolioThemeRenderer;

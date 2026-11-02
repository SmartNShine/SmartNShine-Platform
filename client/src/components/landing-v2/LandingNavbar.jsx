import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../../context/DarkModeContext";
import { useAuth } from "../../context/AuthContext";
import Logo from "@/components/common/Logo";

export default function LandingNavbar() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    setIsScrolled(window.scrollY > 20);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-2 sm:top-5 inset-x-0 z-50 flex flex-col items-center px-2.5 sm:px-6 lg:px-8 pointer-events-none font-scoutie">
      <motion.header
        layout
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.6, ease: "easeOut" },
        }}
        className={`pointer-events-auto relative w-full transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen
            ? isDarkMode
              ? "max-w-2xl sm:max-w-3xl rounded-2xl sm:rounded-3xl bg-zinc-950/95 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-3xl"
              : "max-w-2xl sm:max-w-3xl rounded-2xl sm:rounded-3xl bg-white/95 border border-black/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-3xl"
            : isScrolled
            ? isDarkMode
              ? "max-w-2xl sm:max-w-3xl lg:max-w-4xl rounded-full bg-black/80 border border-white/[0.14] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),inset_0_1px_1.5px_0_rgba(255,255,255,0.22)] backdrop-blur-2xl backdrop-saturate-150"
              : "max-w-2xl sm:max-w-3xl lg:max-w-4xl rounded-full bg-white/85 border border-black/[0.09] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08),inset_0_1.5px_2px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150"
            : isDarkMode
            ? "max-w-6xl xl:max-w-7xl rounded-full bg-black/20 sm:bg-transparent border border-white/5 sm:border-transparent shadow-none backdrop-blur-xs sm:backdrop-blur-none"
            : "max-w-6xl xl:max-w-7xl rounded-full bg-white/30 sm:bg-transparent border border-black/5 sm:border-transparent shadow-none backdrop-blur-xs sm:backdrop-blur-none"
        }`}
      >
        {/* Specular Top Edge Light Streak only when scrolled & bordered */}
        {(isScrolled || isMobileMenuOpen) && (
          <div className="absolute inset-x-10 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/40 to-transparent pointer-events-none rounded-full" />
        )}

        <div
          className={`flex items-center justify-between transition-all duration-300 relative z-10 ${
            isScrolled
              ? "px-4 sm:px-6 h-12 sm:h-14 py-1"
              : "px-4 sm:px-8 h-14 sm:h-[72px] py-1.5 sm:py-2"
          }`}
        >
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <Logo
              className={`object-contain group-hover:scale-105 transition-all duration-200 ${
                isScrolled ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7 sm:w-9 sm:h-9"
              }`}
              alt="SmartNShine Logo"
            />
            <span
              className={`font-light tracking-tight text-zinc-950 dark:text-white leading-none transition-all duration-200 ${
                isScrolled
                  ? "text-sm sm:text-base"
                  : "text-base sm:text-xl lg:text-2xl"
              }`}
            >
              Smart<span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">N</span>Shine
            </span>
          </Link>

          {/* Center Navigation Options (Desktop - visible lg and above) */}
          <nav
            className={`hidden lg:flex items-center transition-all duration-300 shrink-0 ${
              isScrolled
                ? "gap-1 xl:gap-1.5"
                : "gap-4 lg:gap-6 xl:gap-10"
            }`}
          >
            {[
              { label: "Templates", to: "/templates" },
              { label: "ATS Scanner", to: "/ats-analyzer" },
              { label: "Careers", to: "/careers", badge: "Hiring" },
              { label: "Pricing", to: "/pricing" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`font-light whitespace-nowrap transition-all duration-150 ${
                  isScrolled
                    ? "px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                    : "text-base xl:text-lg text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:opacity-100 tracking-wide"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Pills (Auth + Clean Theme Toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Clean Moon/Sun Toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="p-1.5 sm:p-2 transition-all cursor-pointer active:scale-90 text-zinc-600 dark:text-amber-400 hover:text-zinc-950 dark:hover:text-amber-300 flex items-center justify-center"
            >
              {isDarkMode ? (
                <Sun className={isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"} />
              ) : (
                <Moon className={isScrolled ? "w-4.5 h-4.5" : "w-5 h-5"} />
              )}
            </button>

            {/* Desktop Auth Buttons (Visible lg and above) */}
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
              {user ? (
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 rounded-full border border-black/[0.1] dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/12 text-zinc-900 dark:text-white font-light whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer ${
                    isScrolled
                      ? "px-3.5 xl:px-4 py-1.5 text-xs xl:text-sm"
                      : "px-5 sm:px-6 py-2.5 text-sm sm:text-base"
                  }`}
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-zinc-500 dark:text-zinc-400" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`rounded-full font-light whitespace-nowrap text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all ${
                      isScrolled ? "px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm" : "px-4 py-2 text-base sm:text-lg"
                    }`}
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold whitespace-nowrap transition-all shadow-md active:scale-95 cursor-pointer ${
                      isScrolled
                        ? "px-3.5 xl:px-4 py-1.5 text-xs xl:text-sm"
                        : "px-5 sm:px-6 py-2.5 text-sm sm:text-base"
                    }`}
                  >
                    <span>Start Free</span>
                    <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-black stroke-[2.2]" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile & Tablet Menu Toggle Button (Visible below lg / 1024px) */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-1.5 sm:p-2 rounded-full text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-amber-500 transition-transform" />
              ) : (
                <Menu className="w-5 h-5 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Drawer (Below lg) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden px-4 sm:px-6 pb-6 pt-2 border-t border-black/[0.08] dark:border-white/10 flex flex-col gap-3"
            >
              {/* Primary Mobile CTA Button */}
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-extrabold text-sm shadow-md active:scale-95 transition-all"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black text-xs font-extrabold shadow-sm active:scale-95 transition-all"
                  >
                    Start Free →
                  </Link>
                </div>
              )}

              <div className="h-px bg-zinc-200/80 dark:bg-zinc-800/80 my-0.5" />

              {/* Nav Links */}
              {[
                { label: "Resume Templates", to: "/templates" },
                { label: "ATS Scanner Diagnostics", to: "/ats-analyzer" },
                { label: "Careers (We're Hiring)", to: "/careers" },
                { label: "Pricing & Plans", to: "/pricing" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl text-sm font-light text-zinc-700 dark:text-zinc-200 hover:bg-amber-500/10 hover:text-amber-500 transition-colors flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}

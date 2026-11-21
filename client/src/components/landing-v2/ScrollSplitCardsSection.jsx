import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useDarkMode } from "../../context/DarkModeContext";
import Dashboard3DButton from "@/components/dashboard/Dashboard3DButton";

const RESUMES = [
  {
    id: 1,
    title: "Modern Minimalist ATS Resume",
    image: "/img/Resume/1.png",
    webpImage: "/img/Resume/1.webp",
  },
  {
    id: 2,
    title: "Executive Tech Lead ATS Resume",
    image: "/img/Resume/2.png",
    webpImage: "/img/Resume/2.webp",
  },
  {
    id: 3,
    title: "AI & Systems Architect ATS Resume",
    image: "/img/Resume/3.png",
    webpImage: "/img/Resume/3.webp",
  },
];

/**
 * Mobile View: Direct Zoomed Stacked Resumes (Zero scroll flip, zero hydration errors)
 */
function MobileCardsView({ isDarkMode }) {
  const [activeMobileCard, setActiveMobileCard] = useState(1);

  return (
    <section
      className={`relative py-16 px-4 overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "bg-[#06070a] text-zinc-100" : "bg-[#f8f9fc] text-slate-900"
      }`}
    >
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full blur-[140px] bg-amber-500/10 pointer-events-none" />

      <div className="max-w-md mx-auto text-center space-y-3 relative z-10">
        <div className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            3 ATS Resume Perspectives
          </span>
        </div>

        <h2
          className={`text-2xl xs:text-3xl font-normal tracking-tight leading-tight ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          From 1 Live Web Portfolio,{" "}
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500">
            3 ATS Resumes.
          </span>
        </h2>

        <p className={`text-xs xs:text-sm font-light leading-relaxed ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>
          Tap any resume to bring it into focus and explore verified single-column templates.
        </p>

        {/* Selector pills */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {RESUMES.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => setActiveMobileCard(idx)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeMobileCard === idx
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                  : isDarkMode
                  ? "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                  : "bg-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              Resume {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Zoomed Stacked Cards Spread */}
      <div className="relative w-full h-[450px] xs:h-[500px] my-6 flex items-center justify-center relative z-10">
        {RESUMES.map((card, index) => {
          const isSelected = activeMobileCard === index;
          const offsetX = index === 0 ? "-48px" : index === 2 ? "48px" : "0px";
          const offsetY = isSelected ? "-14px" : index === 1 ? "0px" : "16px";
          const rotateZ = index === 0 ? "-6deg" : index === 2 ? "6deg" : "0deg";
          const zIndex = isSelected ? 30 : index === 1 ? 20 : 10;
          const scale = isSelected ? 1.05 : 0.94;

          return (
            <motion.div
              key={card.id}
              onClick={() => setActiveMobileCard(index)}
              animate={{
                x: offsetX,
                y: offsetY,
                rotateZ: isSelected ? 0 : rotateZ,
                scale: scale,
                zIndex: zIndex,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="absolute w-[280px] xs:w-[320px] h-[390px] xs:h-[450px] cursor-pointer"
            >
              <picture>
                <source srcSet={card.webpImage} type="image/webp" />
                <img
                  src={card.image}
                  alt={card.title}
                  width="320"
                  height="450"
                  decoding="async"
                  className={`w-full h-full object-contain rounded-xl transition-all duration-300 ${
                    isSelected
                      ? "drop-shadow-[0_22px_45px_rgba(0,0,0,0.32)] dark:drop-shadow-[0_28px_55px_rgba(0,0,0,0.95)] ring-2 ring-amber-500/40"
                      : "drop-shadow-[0_14px_28px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] opacity-90"
                  }`}
                  loading="lazy"
                />
              </picture>
            </motion.div>
          );
        })}
      </div>

      {/* Action CTA */}
      <div className="text-center relative z-10">
        <Dashboard3DButton
          to="/templates"
          variant="landing"
          size="md"
          className="!rounded-full px-6 text-xs font-medium tracking-normal"
        >
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Explore All 15+ ATS Resume Templates</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Dashboard3DButton>
      </div>
    </section>
  );
}

/**
 * Desktop View: Full 3D Scroll-Split & Fanned Card Flip Experience
 */
function DesktopCardsView({ isDarkMode }) {
  const containerRef = useRef(null);

  // Track scroll progress across the 280vh track
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Snappy spring physics for desktop scroll tracking
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  // Desktop Motion Transforms
  const headerOpacity = useTransform(smoothProgress, [0, 0.15, 0.88, 1], [1, 1, 0.95, 0.35]);
  const headerY = useTransform(smoothProgress, [0, 0.3], [0, -10]);

  const masterUncutOpacity = useTransform(smoothProgress, [0.15, 0.22], [1, 0]);

  const leftCardX = useTransform(smoothProgress, [0.18, 0.48], ["0%", "-14%"]);
  const rightCardX = useTransform(smoothProgress, [0.18, 0.48], ["0%", "14%"]);

  const leftCardY = useTransform(smoothProgress, [0.18, 0.48], ["0px", "4px"]);
  const centerCardY = useTransform(smoothProgress, [0.18, 0.48], ["0px", "-20px"]);
  const rightCardY = useTransform(smoothProgress, [0.18, 0.48], ["0px", "4px"]);

  const leftCardRotateZ = useTransform(smoothProgress, [0.18, 0.48, 0.85], ["0deg", "-6.5deg", "-6deg"]);
  const rightCardRotateZ = useTransform(smoothProgress, [0.18, 0.48, 0.85], ["0deg", "6.5deg", "6deg"]);
  const centerCardScale = useTransform(smoothProgress, [0.18, 0.48, 0.85], [1, 1.05, 1.04]);

  const cardRadius = useTransform(smoothProgress, [0.18, 0.45], ["0px", "22px"]);
  const cardRotateY = useTransform(smoothProgress, [0.46, 0.74], [0, 180]);

  const phaseText = useTransform(smoothProgress, (val) => {
    if (val < 0.20) return "Master Web Portfolio";
    if (val < 0.46) return "Slicing Portfolio Perspectives";
    return "Flipped to 3 Stacked ATS Resumes";
  });

  return (
    <section
      ref={containerRef}
      className={`relative h-[280vh] transition-colors duration-500 ${
        isDarkMode ? "bg-[#06070a] text-zinc-100" : "bg-[#f8f9fc] text-slate-900"
      }`}
    >
      {/* Ambient background glows */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between pt-10 md:pt-12 lg:pt-14 pb-5 md:pb-6 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden z-10 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[170px] bg-gradient-to-r from-blue-600/10 via-amber-500/10 to-emerald-500/10 dark:from-blue-600/15 dark:via-amber-500/15 dark:to-emerald-500/15 transition-all duration-700" />
          <div className="absolute bottom-10 right-10 w-[550px] h-[550px] rounded-full blur-[150px] bg-purple-500/5 dark:bg-purple-500/10" />
        </div>

        {/* ─── Top Header ─── */}
        <motion.div
          style={{ opacity: headerOpacity, y: headerY }}
          className="max-w-3xl mx-auto text-center space-y-1.5 md:space-y-2 pointer-events-auto px-2 shrink-0"
        >
          {/* Phase Status Indicator */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <motion.span className="text-xs font-mono font-medium tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              {phaseText}
            </motion.span>
          </div>

          <h2
            className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-normal tracking-tight leading-tight ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            From 1 Live Web Portfolio,{" "}
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500">
              3 ATS-Engineered Resumes.
            </span>
          </h2>

          <p
            className={`text-xs md:text-sm lg:text-base font-light max-w-xl mx-auto leading-relaxed ${
              isDarkMode ? "text-zinc-400" : "text-slate-600"
            }`}
          >
            Scroll to watch your single master profile slice and 3D-flip directly into a stacked spread of 3 tailored ATS resumes.
          </p>
        </motion.div>

        {/* ─── Center 3D Flip Stack Stage ─── */}
        <div className="w-full max-w-7xl mx-auto my-auto py-1 md:py-2 pointer-events-auto perspective-[1800px] flex items-center justify-center flex-1 min-h-0">
          <div className="relative w-full max-w-[580px] md:max-w-[720px] lg:max-w-[880px] xl:max-w-[1020px] 2xl:max-w-[1140px] h-[340px] md:h-[400px] lg:h-[460px] xl:h-[510px] 2xl:h-[550px] flex items-center justify-center">
            {/* ─── 0. PERFECT UNCUT MASTER UNDERLAY (Fades smoothly as splitting begins) ─── */}
            <motion.div
              style={{
                opacity: masterUncutOpacity,
                borderRadius: "24px",
              }}
              className={`absolute inset-0 w-full h-full z-30 pointer-events-none overflow-hidden ${
                isDarkMode
                  ? "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
                  : "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]"
              }`}
            >
              <picture>
                <source srcSet="/img/portfolios/6.webp" type="image/webp" />
                <img
                  src="/img/portfolios/6.png"
                  alt="Master Web Portfolio Complete View"
                  width="960"
                  height="600"
                  decoding="async"
                  className="w-full h-full object-cover object-left-top rounded-3xl"
                  loading="lazy"
                />
              </picture>
            </motion.div>

            {/* ─── 1. The 3 Cards in Slicing & 3D Stacking Layout ─── */}
            <div className="w-full h-full flex items-stretch relative z-10">
              {RESUMES.map((card, index) => {
                const cardX = index === 0 ? leftCardX : index === 2 ? rightCardX : "0%";
                const cardY = index === 0 ? leftCardY : index === 2 ? rightCardY : centerCardY;
                const cardRotateZ = index === 0 ? leftCardRotateZ : index === 2 ? rightCardRotateZ : "0deg";
                const cardScale = index === 1 ? centerCardScale : 1;
                const cardZIndex = index === 1 ? 30 : index === 2 ? 20 : 10;

                return (
                  <motion.div
                    key={card.id}
                    style={{
                      x: cardX,
                      y: cardY,
                      rotateZ: cardRotateZ,
                      rotateY: cardRotateY,
                      scale: cardScale,
                      borderRadius: cardRadius,
                      zIndex: cardZIndex,
                      transformStyle: "preserve-3d",
                      transformOrigin: "center center",
                    }}
                    className="flex-1 relative h-full"
                  >
                    {/* Front Face: Portfolio Slice */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                      className={`absolute inset-0 w-full h-full overflow-hidden ${
                        index === 0
                          ? "rounded-l-2xl sm:rounded-l-3xl"
                          : index === 2
                          ? "rounded-r-2xl sm:rounded-r-3xl"
                          : ""
                      }`}
                    >
                      <div
                        className="absolute top-0 bottom-0 h-full"
                        style={{
                          width: "300%",
                          left: `${-index * 100}%`,
                        }}
                      >
                        <picture>
                          <source srcSet="/img/portfolios/6.webp" type="image/webp" />
                          <img
                            src="/img/portfolios/6.png"
                            alt="Master Web Portfolio"
                            width="960"
                            height="600"
                            decoding="async"
                            className="w-full h-full object-cover object-left-top"
                            loading="lazy"
                          />
                        </picture>
                      </div>
                    </div>

                    {/* Back Face: Pure ATS Resume */}
                    <div
                      style={{
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                      className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group"
                    >
                      <picture>
                        <source srcSet={card.webpImage} type="image/webp" />
                        <img
                          src={card.image}
                          alt={card.title}
                          width="320"
                          height="450"
                          decoding="async"
                          className="w-full h-full object-contain rounded-xl sm:rounded-2xl drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_28px_55px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </picture>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Bottom Action Bar ─── */}
        <div className="max-w-xl mx-auto text-center pointer-events-auto space-y-2 pb-1 relative z-40 shrink-0">
          <Dashboard3DButton
            to="/templates"
            variant="landing"
            size="lg"
            className="!rounded-full px-7 text-xs md:text-sm font-medium tracking-normal"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Explore All 15+ ATS Resume Templates</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Dashboard3DButton>
        </div>
      </div>
    </section>
  );
}

export default function ScrollSplitCardsSection() {
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (isMobile) {
    return <MobileCardsView isDarkMode={isDarkMode} />;
  }

  return <DesktopCardsView isDarkMode={isDarkMode} />;
}

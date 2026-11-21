import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, ArrowRight, Clock, Zap, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FestiveSaleBanner({ promotion, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0,
  });
  const [dismissed, setDismissed] = useState(false);

  const promo = promotion;

  useEffect(() => {
    if (!promo || !promo.enabled) return;

    const calculateTimeLeft = () => {
      const targetDate = promo.endDate
        ? new Date(promo.endDate).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      const difference = targetDate - Date.now();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [promo?.endDate, promo?.enabled]);

  if (!promo || !promo.enabled || dismissed) {
    return null;
  }

  const formatNumber = (num) => String(num).padStart(2, "0");

  // Dynamic theme styling mapping
  const getThemeStyles = (theme) => {
    switch (theme) {
      case "gold-luxury":
        return {
          container: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-amber-950",
          badge: "bg-amber-950/30 text-yellow-100 border-yellow-300/40",
          badgeIcon: "text-yellow-300",
          titleText: "text-amber-950 font-black",
          bodyText: "text-amber-950/90 font-bold",
          priceTag: "bg-amber-950/20 text-amber-950 font-black",
          oldPrice: "text-amber-900/60",
          clockBg: "bg-amber-950/25 border-yellow-300/30 text-yellow-100",
          clockDigits: "text-yellow-200",
          button: "bg-amber-950 text-yellow-300 hover:bg-black hover:text-white shadow-amber-950/30",
          buttonIcon: "text-yellow-400",
        };
      case "crimson-festive":
        return {
          container: "bg-gradient-to-r from-rose-700 via-red-600 to-pink-600 text-white",
          badge: "bg-white/20 text-pink-100 border-white/30",
          badgeIcon: "text-yellow-300",
          titleText: "text-yellow-200 font-black",
          bodyText: "text-white font-semibold",
          priceTag: "bg-white/25 text-yellow-200 font-black",
          oldPrice: "text-white/60",
          clockBg: "bg-black/30 border-white/20 text-white",
          clockDigits: "text-yellow-300",
          button: "bg-white text-rose-700 hover:bg-rose-50 shadow-rose-900/30",
          buttonIcon: "text-rose-600",
        };
      case "vibrant-indigo":
        return {
          container: "bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-white",
          badge: "bg-white/20 text-indigo-100 border-white/30",
          badgeIcon: "text-yellow-300",
          titleText: "text-yellow-200 font-black",
          bodyText: "text-white font-semibold",
          priceTag: "bg-white/25 text-yellow-200 font-black",
          oldPrice: "text-white/60",
          clockBg: "bg-black/30 border-white/20 text-white",
          clockDigits: "text-yellow-300",
          button: "bg-white text-indigo-700 hover:bg-indigo-50 shadow-indigo-900/30",
          buttonIcon: "text-indigo-600",
        };
      case "rakhi-festive":
      default:
        return {
          container: "bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 text-white",
          badge: "bg-white/20 text-amber-100 border-white/30",
          badgeIcon: "text-yellow-300",
          titleText: "text-yellow-200 font-black",
          bodyText: "text-white font-semibold",
          priceTag: "bg-white/25 text-yellow-200 font-black",
          oldPrice: "text-white/65",
          clockBg: "bg-black/30 border-white/20 text-white",
          clockDigits: "text-yellow-300",
          button: "bg-white text-orange-700 hover:bg-amber-50 shadow-orange-950/30",
          buttonIcon: "text-orange-600",
        };
    }
  };

  const currentTheme = getThemeStyles(promo.theme || "rakhi-festive");
  const discountPercent = Math.round(
    (1 - (promo.oneTimePrice ?? 49) / (promo.originalOneTimePrice ?? 49)) * 100
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative z-10 overflow-hidden shadow-md border-b border-black/10 ${currentTheme.container}`}
      >
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2.5">
          {/* MOBILE VIEW: Single Sleek Compact Line */}
          <div className="flex sm:hidden items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0">🎁</span>
              <p className={`text-xs font-black truncate ${currentTheme.titleText}`}>
                {promo.badgeText || "Rakhi Deal"}:{" "}
                <span className={`px-1.5 py-0.2 rounded font-black ${currentTheme.priceTag}`}>
                  ₹{promo.oneTimePrice ?? 49}
                </span>{" "}
                <span className="opacity-75 font-semibold text-[10px]">({discountPercent}% OFF)</span>
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/pricing"
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black shadow-xs ${currentTheme.button}`}
              >
                <span>Claim</span>
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </Link>
              {onDismiss && (
                <button
                  onClick={() => {
                    setDismissed(true);
                    onDismiss();
                  }}
                  className="p-1 rounded-full opacity-60 hover:opacity-100"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* DESKTOP & TABLET VIEW */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
            {/* Left: Festive Badge + Promotion Title & Clear Details */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-[300px]">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 animate-pulse shadow-xs ${currentTheme.badge}`}
              >
                <Gift className={`w-4 h-4 ${currentTheme.badgeIcon}`} />
                {promo.badgeText || "RAKHI FESTIVE SPECIAL"}
              </span>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm sm:text-base">
                <span className={`text-sm sm:text-base ${currentTheme.titleText}`}>
                  {promo.title || "Raksha Bandhan Special Sale"}
                </span>
                <span className="hidden md:inline opacity-60">•</span>
                <span className={`text-xs sm:text-sm md:text-base ${currentTheme.bodyText}`}>
                  ATS Resume Pass for{" "}
                  <span
                    className={`px-2 py-0.5 rounded-lg text-sm sm:text-base ${currentTheme.priceTag}`}
                  >
                    ₹{promo.oneTimePrice ?? 49}
                  </span>{" "}
                  <span className={`line-through text-xs sm:text-sm ${currentTheme.oldPrice}`}>
                    ₹{promo.originalOneTimePrice ?? 49}
                  </span>{" "}
                  <span className="font-extrabold text-xs sm:text-sm underline underline-offset-2">
                    (Flat {discountPercent}% OFF)
                  </span>
                </span>
              </div>
            </div>

            {/* Middle: Live Countdown Clock */}
            <div
              className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-mono shadow-xs backdrop-blur-md ${currentTheme.clockBg}`}
            >
              <Clock className="w-4 h-4 text-yellow-300 animate-spin-slow" />
              <span className="text-[11px] uppercase tracking-wider font-sans font-bold opacity-80 mr-0.5">
                Ends In:
              </span>
              <span className={`font-black text-sm ${currentTheme.clockDigits}`}>
                {formatNumber(timeLeft.hours)}h
              </span>
              <span className="opacity-40 font-bold">:</span>
              <span className={`font-black text-sm ${currentTheme.clockDigits}`}>
                {formatNumber(timeLeft.minutes)}m
              </span>
              <span className="opacity-40 font-bold">:</span>
              <span className={`font-black text-sm ${currentTheme.clockDigits}`}>
                {formatNumber(timeLeft.seconds)}s
              </span>
            </div>

            {/* Right: CTA Button */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/pricing"
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 ${currentTheme.button}`}
              >
                <Zap className={`w-4 h-4 fill-current ${currentTheme.buttonIcon}`} />
                <span>{promo.ctaText || "Claim ₹9 Resume Deal"}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              {onDismiss && (
                <button
                  onClick={() => {
                    setDismissed(true);
                    onDismiss();
                  }}
                  className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

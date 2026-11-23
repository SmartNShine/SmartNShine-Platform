import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDarkMode } from "@/context/DarkModeContext";

/**
 * 3D CTA with optional depth shadow (default bottom, or right→left diagonal).
 */
const VARIANTS = {
  primary: {
    face:
      "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-950/80 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:border-zinc-300",
    shadow: { light: "#09090b", dark: "#52525b" },
    offsetX: -5,
    offsetY: 5,
  },
  charcoal: {
    face:
      "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 border border-zinc-950/80 dark:border-zinc-300",
    shadow: { light: "#09090b", dark: "#52525b" },
    offsetX: -5,
    offsetY: 5,
  },
  /** Landing CTAs — white face, depth shadow cast left (light from the right) */
  landing: {
    face:
      "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/90 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:border-zinc-300",
    shadow: { light: "#a1a1aa", dark: "#52525b" },
    offsetX: -5,
    offsetY: 5,
  },
  warm: {
    face:
      "bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 border border-amber-600/40 dark:border-amber-400/30",
    shadow: { light: "#78350f", dark: "#451a03" },
    offsetX: -6,
    offsetY: 6,
  },
  amber: {
    face:
      "bg-amber-500 hover:bg-amber-400 text-zinc-950 border border-amber-600 dark:border-amber-500/80",
    shadow: { light: "#b45309", dark: "#92400e" },
    offsetX: -5,
    offsetY: 5,
  },
  surface: {
    face:
      "bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800",
    shadow: { light: "#a1a1aa", dark: "#52525b" },
    offsetX: -5,
    offsetY: 5,
  },
  /** TPO — light UI: dark face + zinc block; dark UI: light face + zinc block (paired contrast) */
  tpoPrimary: {
    face:
      "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:border-zinc-200/90",
    shadow: { light: "#71717a", dark: "#d1d5db" },
    offsetX: 0,
    offsetY: 6,
    radius: "!rounded-2xl",
  },
  /** Secondary / icon — light face in light UI with a darker block for contrast */
  tpoSurface: {
    face:
      "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:border-zinc-200/90",
    shadow: { light: "#52525b", dark: "#a1a1aa" },
    offsetX: 0,
    offsetY: 6,
    radius: "!rounded-2xl",
  },
  tpoGhost: {
    face:
      "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:border-zinc-200/90",
    shadow: { light: "#52525b", dark: "#a1a1aa" },
    offsetX: 0,
    offsetY: 6,
    radius: "!rounded-2xl",
  },
  tpoDanger: {
    face:
      "bg-rose-600 hover:bg-rose-500 text-white border border-rose-900/40 dark:bg-rose-500 dark:hover:bg-rose-400 dark:text-zinc-950 dark:border-rose-300/80",
    shadow: { light: "#fb7185", dark: "#fda4af" },
    offsetX: 0,
    offsetY: 5,
    radius: "!rounded-2xl",
  },
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5 min-h-[34px]",
  md: "px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 min-h-[40px]",
  lg: "px-6 py-3 text-sm rounded-xl gap-2 min-h-[46px]",
  icon: "p-2 gap-0 min-h-[38px] min-w-[38px]",
};

const MotionLink = motion.create(Link);

function depthShadow(offsetX, offsetY, color) {
  return `${offsetX}px ${offsetY}px 0 0 ${color}`;
}

function useMotionDepth(v, isDarkMode, disabled, slabDepth, flat) {
  const offsetX = v.offsetX ?? -5;
  const offsetY = v.offsetY ?? 5;

  if (flat) {
    return {
      style: { boxShadow: "none" },
      whileTap: disabled ? undefined : { scale: 0.98 },
      transition: { duration: 0.12 },
    };
  }

  if (slabDepth) {
    return {};
  }

  const color = isDarkMode ? v.shadow.dark : v.shadow.light;
  const rest = depthShadow(offsetX, offsetY, color);
  const hover =
    offsetX === 0
      ? depthShadow(0, offsetY + 1, color)
      : depthShadow(offsetX - 1, offsetY + 1, color);

  const reserve = v.reserveDepth ? offsetY + 2 : 0;

  return {
    style: {
      boxShadow: rest,
      ...(reserve > 0 ? { marginBottom: reserve } : null),
    },
    whileHover: disabled
      ? undefined
      : {
          x: offsetX < 0 ? 2 : 0,
          y: -1,
          boxShadow: hover,
        },
    whileTap: disabled
      ? undefined
      : {
          x: offsetX,
          y: offsetY,
          boxShadow: "0 0 0 0 rgba(0,0,0,0)",
          scale: 0.98,
        },
    transition: { type: "spring", stiffness: 780, damping: 32, mass: 0.48 },
  };
}

export default function Dashboard3DButton({
  variant = "primary",
  size = "md",
  to,
  href,
  onClick,
  disabled = false,
  className = "",
  children,
  type = "button",
  slabDepth = false,
  flat = false,
  ...rest
}) {
  const { isDarkMode } = useDarkMode();
  const v = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const motionProps = useMotionDepth(v, isDarkMode, disabled, slabDepth, flat);

  const sharedClass = [
    "inline-flex items-center justify-center font-semibold select-none",
    "transition-[background-color,border-color,color] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
    "disabled:opacity-50 disabled:pointer-events-none",
    v.face,
    v.radius || "",
    sizeClass,
    className,
  ].join(" ");

  if (to) {
    return (
      <MotionLink
        to={to}
        className={sharedClass}
        aria-disabled={disabled}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        {...motionProps}
        {...rest}
      >
        {children}
      </MotionLink>
    );
  }

  if (href) {
    return (
      <motion.a
        href={href}
        className={sharedClass}
        {...motionProps}
        {...rest}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={sharedClass}
      {...motionProps}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

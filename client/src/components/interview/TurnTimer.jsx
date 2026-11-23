import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SIZE = 128;
const CENTER = SIZE / 2;
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICKS = 60;

// think: warm amber · answer: teal→sky · last 30 s: amber · last 10 s: rose
const TONES = {
  think: { from: "#FCD34D", to: "#F59E0B", text: "text-amber-100", label: "Think" },
  answer: { from: "#5EEAD4", to: "#38BDF8", text: "text-white", label: "Answer" },
  warning: { from: "#FDE68A", to: "#FBBF24", text: "text-amber-50", label: "Wrap up" },
  critical: { from: "#FDA4AF", to: "#FB7185", text: "text-rose-50", label: "Last seconds" },
};

const format = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Watch-bezel countdown: 60 ticks that burn down, a smooth continuous arc with a
 * glowing head, and digits that roll on each second. Driven by a deadline, not
 * by React ticks, so the sweep is smooth and pauses exactly.
 */
export const TurnTimer = ({ stage, totalSec, getRemainingMs, isPaused }) => {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs?.() ?? totalSec * 1000);

  useEffect(() => {
    let frame;
    let last = 0;
    const loop = (time) => {
      if (time - last > 33) {
        last = time;
        setRemainingMs(getRemainingMs?.() ?? 0);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [getRemainingMs, stage, isPaused]);

  const totalMs = Math.max(1, totalSec * 1000);
  const fraction = Math.min(1, Math.max(0, remainingMs / totalMs));
  const seconds = Math.ceil(remainingMs / 1000);
  const toneKey = stage === "thinking" ? "think" : seconds <= 10 ? "critical" : seconds <= 30 ? "warning" : "answer";
  const tone = TONES[toneKey];
  const angle = -90 + 360 * fraction;
  const head = {
    x: CENTER + RADIUS * Math.cos((angle * Math.PI) / 180),
    y: CENTER + RADIUS * Math.sin((angle * Math.PI) / 180),
  };
  const ticksLeft = Math.ceil(fraction * TICKS);
  const pulse = toneKey === "critical" && !reduceMotion && !isPaused;

  return (
    <div className="relative h-32 w-32 shrink-0" role="timer" aria-label={`${tone.label}: ${format(seconds)} left`}>
      <motion.svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full"
        aria-hidden="true"
        animate={pulse ? { scale: [1, 1.035, 1] } : { scale: 1 }}
        transition={pulse ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.to} />
          </linearGradient>
        </defs>

        {/* Bezel: ticks burn down clockwise with the remaining time. */}
        {Array.from({ length: TICKS }, (_, index) => {
          const major = index % 5 === 0;
          const a = ((index / TICKS) * 360 - 90) * (Math.PI / 180);
          const outer = RADIUS + 11;
          const inner = outer - (major ? 5 : 2.5);
          const lit = index < ticksLeft;
          return (
            <line
              key={index}
              x1={CENTER + inner * Math.cos(a)}
              y1={CENTER + inner * Math.sin(a)}
              x2={CENTER + outer * Math.cos(a)}
              y2={CENTER + outer * Math.sin(a)}
              stroke={lit ? `url(#${gradientId})` : "rgba(255,255,255,0.08)"}
              strokeWidth={major ? 1.6 : 1}
              strokeLinecap="round"
            />
          );
        })}

        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        {fraction > 0.005 && (
          <>
            <circle cx={head.x} cy={head.y} r="7" fill={tone.to} opacity="0.25" />
            <circle cx={head.x} cy={head.y} r="3.5" fill="#fff" />
          </>
        )}
      </motion.svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <div className={`relative h-8 overflow-hidden text-[28px] font-semibold leading-8 tracking-tight tabular-nums ${tone.text}`}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={seconds}
              className="block"
              initial={reduceMotion ? false : { y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 14, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {format(Math.max(0, seconds))}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
          {isPaused ? "Paused" : tone.label}
        </span>
      </div>
    </div>
  );
};

export default TurnTimer;

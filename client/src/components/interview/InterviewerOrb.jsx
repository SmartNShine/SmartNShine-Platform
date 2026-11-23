import { useEffect, useRef } from "react";
import { getVoiceLevel } from "./voiceActivity";

// Shubh's presence: a fluid voice orb drawn on a canvas. It follows the real
// loudness of the interviewer's audio while speaking, leans in while the
// candidate answers, swirls while reviewing and breathes when idle.
//
// state: "idle" | "speaking" | "listening" | "thinking"

const LAYERS = [
  // hue triplets blended with "lighter" for a luminous core
  { color: [56, 189, 248], speed: 0.55, phase: 0.0, lobes: [3, 5], offset: 0.06 }, // sky
  { color: [99, 102, 241], speed: -0.42, phase: 1.7, lobes: [2, 4], offset: 0.08 }, // indigo
  { color: [45, 212, 191], speed: 0.33, phase: 3.1, lobes: [4, 6], offset: 0.07 }, // teal
];

const STATE_ENERGY = { idle: 0.08, speaking: 0.2, listening: 0.12, thinking: 0.16 };

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function drawBlob(ctx, cx, cy, radius, layer, time, energy, spin) {
  const [lobeA, lobeB] = layer.lobes;
  const points = 72;
  ctx.beginPath();
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const wobble =
      Math.sin(angle * lobeA + time * (1.2 + layer.speed) + layer.phase) * 0.55 +
      Math.sin(angle * lobeB - time * (0.9 - layer.speed) + layer.phase * 1.3) * 0.45;
    const r = radius * (1 + wobble * energy);
    const x = cx + Math.cos(angle + spin) * r;
    const y = cy + Math.sin(angle + spin) * r;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * @param {object}   props
 * @param {number}   [props.size=120]   CSS pixels
 * @param {string}   [props.state="idle"]
 * @param {number}   [props.listenLevel=0] candidate mic level 0–1 (listening state)
 * @param {string}   [props.label]       accessible description
 */
export const InterviewerOrb = ({ size = 120, state = "idle", listenLevel = 0, label = "Interviewer", className = "" }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ state, listenLevel });
  useEffect(() => {
    stateRef.current = { state, listenLevel };
  }, [state, listenLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduced = prefersReducedMotion();
    let frame = 0;
    let smoothLevel = 0;
    let energy = STATE_ENERGY.idle;
    let silentSince = 0;
    const start = performance.now();

    const render = (now) => {
      const t = (now - start) / 1000;
      const { state: current, listenLevel: listen } = stateRef.current;

      // Loudness: real analyser level while speaking; synthetic cadence if none arrives
      // (browser speech synthesis, or audio started before the context was primed).
      let target = 0;
      if (current === "speaking") {
        const measured = getVoiceLevel();
        if (measured > 0.02) silentSince = now;
        const synthetic = now - silentSince > 350;
        target = synthetic
          ? 0.35 + 0.3 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1 + 0.6))
          : measured;
      } else if (current === "listening") {
        target = Math.min(1, listen) * 0.5;
      }
      smoothLevel += (target - smoothLevel) * (target > smoothLevel ? 0.35 : 0.12);
      const targetEnergy = (STATE_ENERGY[current] ?? STATE_ENERGY.idle) + smoothLevel * 0.22;
      energy += (targetEnergy - energy) * 0.08;

      const center = size / 2;
      const breathe = reduced ? 0 : Math.sin(t * (current === "idle" ? 1.1 : 1.6)) * 0.025;
      const baseRadius = size * 0.3 * (1 + breathe + smoothLevel * 0.12);
      const spin = current === "thinking" ? t * 0.9 : t * 0.15;

      ctx.clearRect(0, 0, size, size);

      // Halo
      const halo = ctx.createRadialGradient(center, center, baseRadius * 0.6, center, center, size * 0.5);
      halo.addColorStop(0, `rgba(56, 189, 248, ${0.16 + smoothLevel * 0.22})`);
      halo.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Listening ring: the orb visibly "hears" the candidate.
      if (current === "listening") {
        ctx.beginPath();
        ctx.arc(center, center, baseRadius * (1.28 + Math.min(1, listen) * 0.18), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(125, 211, 252, ${0.18 + Math.min(1, listen) * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Thinking arc: a slow orbit around the orb.
      if (current === "thinking") {
        ctx.beginPath();
        ctx.arc(center, center, baseRadius * 1.32, t * 2.4, t * 2.4 + Math.PI * 0.6);
        ctx.strokeStyle = "rgba(165, 180, 252, 0.55)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      LAYERS.forEach((layer, index) => {
        const time = reduced ? 0 : t * (current === "thinking" ? 1.6 : 1);
        const ox = Math.cos(t * layer.speed + layer.phase) * size * layer.offset * (0.4 + energy);
        const oy = Math.sin(t * layer.speed * 1.3 + layer.phase) * size * layer.offset * (0.4 + energy);
        drawBlob(ctx, center + ox, center + oy, baseRadius * (1 - index * 0.06), layer, time, energy, spin * (index % 2 ? -1 : 1));
        const [r, g, b] = layer.color;
        const fill = ctx.createRadialGradient(center + ox - baseRadius * 0.3, center + oy - baseRadius * 0.35, 0, center + ox, center + oy, baseRadius * 1.25);
        fill.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
        fill.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.55)`);
        fill.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.05)`);
        ctx.fillStyle = fill;
        ctx.fill();
      });
      ctx.restore();

      // Glass highlight
      const shine = ctx.createRadialGradient(center - baseRadius * 0.35, center - baseRadius * 0.45, 0, center - baseRadius * 0.35, center - baseRadius * 0.45, baseRadius * 0.9);
      shine.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      shine.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.arc(center, center, baseRadius * 0.98, 0, Math.PI * 2);
      ctx.fill();

      // Reduced motion: a near-static orb that still reflects state changes.
      if (reduced) timer = setTimeout(() => { frame = requestAnimationFrame(render); }, 500);
      else frame = requestAnimationFrame(render);
    };

    let timer = 0;
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

export default InterviewerOrb;

/**
 * ResumeWatermark - AI-Resistant Anti-Screenshot Protection Layer
 *
 * Features:
 * - 3 staggered diagonal watermarks (top, center, bottom)
 * - Normal opacity only (no multiply) so tiled text does not read as rules/lines
 * - Soft fade at the top edge so the margin above the name stays clean
 * - Strictly hidden on exported PDF (.no-print)
 */
export default function ResumeWatermark({ isMobile = false }) {
  return (
    <div
      className="resume-watermark-overlay pointer-events-none select-none absolute inset-0 z-30 overflow-hidden no-print"
      aria-hidden="true"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0px, transparent 52px, black 96px)",
        maskImage:
          "linear-gradient(to bottom, transparent 0px, transparent 52px, black 96px)",
      }}
    >
      {/* Top-third diagonal watermark */}
      <div
        className="absolute left-1/2 flex flex-col items-center justify-center pointer-events-none"
        style={{
          top: "22%",
          transform: "translate(-50%, -50%) rotate(-25deg)",
          width: "140%",
        }}
      >
        <span
          className="font-black uppercase tracking-widest text-[#0f172a]"
          style={{
            fontSize: isMobile ? "32px" : "56px",
            letterSpacing: "0.22em",
            opacity: 0.045,
            whiteSpace: "nowrap",
          }}
        >
          SmartNShine
        </span>
        <span
          className="font-bold tracking-[0.3em] text-[#0f172a] uppercase text-center"
          style={{
            fontSize: isMobile ? "8px" : "10px",
            opacity: 0.035,
            marginTop: "1px",
          }}
        >
          Preview Mode • SmartNShine.app
        </span>
      </div>

      {/* Center diagonal watermark */}
      <div
        className="absolute left-1/2 flex flex-col items-center justify-center pointer-events-none"
        style={{
          top: "52%",
          transform: "translate(-50%, -50%) rotate(-25deg)",
          width: "140%",
        }}
      >
        <span
          className="font-black uppercase tracking-widest text-[#0f172a]"
          style={{
            fontSize: isMobile ? "36px" : "64px",
            letterSpacing: "0.22em",
            opacity: 0.05,
            whiteSpace: "nowrap",
          }}
        >
          SmartNShine
        </span>
        <span
          className="font-bold tracking-[0.3em] text-[#0f172a] uppercase text-center"
          style={{
            fontSize: isMobile ? "8px" : "10px",
            opacity: 0.035,
            marginTop: "1px",
          }}
        >
          Official Preview • Protected Document
        </span>
      </div>

      {/* Bottom-third diagonal watermark */}
      <div
        className="absolute left-1/2 flex flex-col items-center justify-center pointer-events-none"
        style={{
          top: "82%",
          transform: "translate(-50%, -50%) rotate(-25deg)",
          width: "140%",
        }}
      >
        <span
          className="font-black uppercase tracking-widest text-[#0f172a]"
          style={{
            fontSize: isMobile ? "32px" : "56px",
            letterSpacing: "0.22em",
            opacity: 0.045,
            whiteSpace: "nowrap",
          }}
        >
          SmartNShine
        </span>
        <span
          className="font-bold tracking-[0.3em] text-[#0f172a] uppercase text-center"
          style={{
            fontSize: isMobile ? "8px" : "10px",
            opacity: 0.035,
            marginTop: "1px",
          }}
        >
          Preview Copy • Export Clean PDF To Remove
        </span>
      </div>
    </div>
  );
}
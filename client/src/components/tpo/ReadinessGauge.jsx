export default function ReadinessGauge({score, size = "md", showLabel = true}) {
  const numericScore =
    typeof score === "number"
      ? Math.min(100, Math.max(0, Math.round(score)))
      : null;

  // Determine size in pixels
  const dimMap = {
    sm: {size: 64, stroke: 6, text: "text-sm", sub: "text-[9px]"},
    md: {size: 96, stroke: 8, text: "text-xl", sub: "text-[10px]"},
    lg: {size: 140, stroke: 10, text: "text-3xl", sub: "text-xs"},
    xl: {size: 180, stroke: 12, text: "text-4xl", sub: "text-sm"},
  };

  const {
    size: dim,
    stroke,
    text: textClass,
    sub: subClass,
  } = dimMap[size] || dimMap.md;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress =
    numericScore !== null ? (numericScore / 100) * circumference : 0;
  const offset = circumference - progress;

  // Color mapping by score band
  const getColor = () => {
    if (numericScore === null)
      return {stroke: "#a1a1aa", text: "text-zinc-400", label: "No Data"};
    if (numericScore >= 80)
      return {
        stroke: "#10b981",
        text: "text-emerald-600 dark:text-emerald-400",
        label: "Placement Ready",
      };
    if (numericScore >= 65)
      return {
        stroke: "#6366f1",
        text: "text-indigo-600 dark:text-indigo-400",
        label: "Good",
      };
    if (numericScore >= 45)
      return {
        stroke: "#f59e0b",
        text: "text-amber-600 dark:text-amber-400",
        label: "Moderate",
      };
    return {
      stroke: "#f43f5e",
      text: "text-rose-600 dark:text-rose-400",
      label: "Needs Practice",
    };
  };

  const {stroke: strokeColor, text: colorClass, label} = getColor();

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center"
        style={{width: dim, height: dim}}
      >
        <svg width={dim} height={dim} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-zinc-200 dark:text-zinc-800"
          />
          {/* Progress circle */}
          {numericScore !== null && (
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-black tracking-tight ${colorClass} ${textClass}`}
          >
            {numericScore !== null ? numericScore : "N/A"}
          </span>
          {numericScore !== null && (
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              / 100
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <span
          className={`mt-2 font-semibold text-center ${colorClass} ${subClass}`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

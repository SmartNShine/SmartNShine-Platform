import React from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export const ProctoringBadge = ({ proctoringState, activeAlert }) => {
  if (!proctoringState) return null;

  const { status, integrityScore = 100, message } = proctoringState;

  if (activeAlert) {
    return (
      <div role="alert" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium shadow-lg animate-pulse">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        <span className="truncate max-w-[200px] sm:max-w-none">{activeAlert.details || "Integrity Flag Logged"}</span>
      </div>
    );
  }

  const isVerified = status === "active" && integrityScore >= 85;
  const isWarning = status === "warning" || (integrityScore < 85 && integrityScore >= 70);
  const isCritical = status === "critical";

  return (
    <div
      role="status"
      title={message}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition-all duration-300 ${
        isCritical
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
          : isVerified
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          : isWarning
          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
          : "bg-neutral-800/80 border-white/[0.08] text-neutral-300"
      }`}
    >
      {isCritical ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : isVerified ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      ) : isWarning ? (
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Shield className="w-3.5 h-3.5 text-neutral-400" />
      )}
      <span>AI Proctor:</span>
      <span className="font-semibold">{integrityScore}%</span>
      <span className="hidden sm:inline opacity-70">
        {isCritical ? "• Flagged" : isVerified ? "• Active" : isWarning ? "• Review" : "• Initializing"}
      </span>
    </div>
  );
};

export default ProctoringBadge;

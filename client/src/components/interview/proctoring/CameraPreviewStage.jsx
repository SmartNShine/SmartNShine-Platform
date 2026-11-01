import React from "react";
import { Camera, CameraOff, RefreshCw, User } from "lucide-react";

export const CameraPreviewStage = ({
  videoRef,
  isCameraActive,
  cameraError,
  isInitializing,
  onRetryCamera,
  showGuideOval = false,
  layout = "center-stage", // "center-stage" | "pip" | "split" | "setup"
  userName = "Candidate",
}) => {
  if (cameraError) {
    return (
      <div
        className={`${
          layout === "center-stage"
            ? "absolute inset-0 w-full h-full"
            : "w-full h-full min-h-[160px] rounded-2xl"
        } bg-neutral-900/95 border border-rose-500/30 flex flex-col items-center justify-center p-6 text-center z-0`}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3 text-rose-400">
          <CameraOff className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Camera Feed Unavailable</h3>
        <p className="text-xs text-rose-300/90 font-medium mb-3 max-w-sm leading-relaxed">
          {cameraError}
        </p>
        {onRetryCamera && (
          <button
            onClick={onRetryCamera}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-white/10 transition-colors cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Camera</span>
          </button>
        )}
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div
        className={`${
          layout === "center-stage"
            ? "absolute inset-0 w-full h-full"
            : "w-full h-full min-h-[160px] rounded-2xl"
        } bg-neutral-950 border border-white/10 flex flex-col items-center justify-center p-4 z-0`}
      >
        <div className="w-8 h-8 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mb-3" />
        <span className="text-xs text-neutral-400 font-medium">Connecting to webcam...</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${
        layout === "center-stage"
          ? "absolute inset-0 w-full h-full bg-[#08090D]"
          : layout === "pip"
          ? "w-44 sm:w-56 aspect-[4/3] rounded-2xl bg-black border border-white/15 shadow-2xl"
          : layout === "split"
          ? "w-full h-full min-h-[220px] aspect-video rounded-2xl bg-black border border-white/15 shadow-2xl"
          : "w-full max-w-md aspect-video rounded-2xl bg-black border border-white/15 shadow-2xl"
      }`}
    >
      {/* Live Video Feed (Mirrored) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform scale-x-[-1] ${
          isCameraActive ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
      />

      {/* Guide Oval Overlay for Setup Check */}
      {showGuideOval && isCameraActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-32 h-44 sm:w-40 sm:h-52 rounded-[50%] border-2 border-dashed border-emerald-400/40 flex items-center justify-center">
            <span className="text-[10px] text-emerald-300/70 font-medium bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
              Center Face Here
            </span>
          </div>
        </div>
      )}

      {/* Candidate Tag (shown when not full center-stage) */}
      {layout !== "center-stage" && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate max-w-[80px] sm:max-w-none">{userName} (You)</span>
        </div>
      )}

      {/* Camera Standby Fallback if stream is not ready */}
      {!isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#11131A] to-[#090A0E] text-neutral-400 text-xs p-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3">
            <Camera className="w-7 h-7 text-neutral-400 opacity-60" />
          </div>
          <span className="font-medium text-neutral-300 text-xs">Camera Feed Standby</span>
          <span className="text-[11px] text-neutral-500 mt-0.5">Initializing proctoring video feed</span>
        </div>
      )}
    </div>
  );
};

export default CameraPreviewStage;

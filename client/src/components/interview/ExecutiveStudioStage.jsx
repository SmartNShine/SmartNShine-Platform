import React, { useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  SkipForward,
  RotateCcw,
  Check,
  Clock,
  Volume2,
  Square,
  Sparkles,
} from "lucide-react";
import { CameraPreviewStage } from "./proctoring/CameraPreviewStage";
import { ProctoringBadge } from "./proctoring/ProctoringBadge";

export const ExecutiveStudioStage = ({
  currentQuestion,
  elapsedTime = 0,
  interviewDuration = 15,
  formatTime,
  answer = "",
  setAnswer,
  selectedVoice = "anushka",
  selectedRole = "Technical Interview",
  isRecording = false,
  isPlayingAudio = false,
  interviewPhase = "waiting", // "greeting" | "asking" | "waiting" | "processing" | "evaluation"
  aiMessage = "",
  micFrequencyBins = [],
  liveCandidateTranscript = "",
  bargeInNotice = false,
  isMuted = false,
  onToggleMute,
  onSubmitAnswer,
  onStartRecording,
  onStopRecording,
  onSkipQuestion,
  onEndMeeting,
  onRequestRepeat,
  isDarkMode = true,
  // Video & Proctoring props
  cameraVideoRef,
  isCameraActive = false,
  cameraError = null,
  proctoringState,
  activeAlert,
  isPhoneInView = false,
  onRetryCamera,
  userName = "Candidate",
  audioDevices = [],
  selectedAudioDeviceId = "",
  onSwitchAudioDevice,
}) => {
  // Approximate timer calculation
  const totalSeconds = (interviewDuration || 15) * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedTime);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);

  const isAISpeaking =
    isPlayingAudio || interviewPhase === "asking" || interviewPhase === "greeting";

  // Prompt text (Question text stays permanently visible)
  const promptText =
    currentQuestion?.text ||
    aiMessage ||
    "Please introduce yourself and your technical background.";

  // Safe frequency bins (16 bands default)
  const safeBins = micFrequencyBins?.length ? micFrequencyBins : new Array(16).fill(3);

  // Auto-scroll transcript container as candidate speaks multiple sentences
  const transcriptScrollRef = useRef(null);
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [liveCandidateTranscript]);

  return (
    <div className="min-h-screen bg-[#090A0F] text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* 1. TOP MINIMAL BAR */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-white/[0.08] bg-[#0E1017]">
        {/* Left: Role Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
              Live Session
            </span>
          </div>
          <span className="text-neutral-600">/</span>
          <h1 className="text-sm font-medium text-neutral-200 tracking-tight truncate max-w-[260px] sm:max-w-md">
            {selectedRole || "Technical Round"}
          </h1>
        </div>

        {/* Right: Approximate Timer & Clean End Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              {formatTime
                ? `${formatTime(remainingSeconds)} remaining`
                : `~${remainingMinutes} min remaining`}
            </span>
          </div>

          <button
            onClick={onEndMeeting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
            title="Leave Interview"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN VIDEO CALL CANVAS */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-5xl mx-auto w-full relative">
        {/* Barge-In Notification Toast */}
        {bargeInNotice && (
          <div className="absolute top-4 z-40 px-4 py-2 rounded-full bg-neutral-900 border border-white/20 text-neutral-200 text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Interruption detected • Microphone taking priority</span>
          </div>
        )}

        {/* EXECUTIVE VIDEO CALL STAGE */}
        <div
          className={`w-full aspect-[16/10] sm:aspect-[16/9] max-h-[72vh] rounded-2xl sm:rounded-3xl bg-[#090A0E] border transition-all duration-300 shadow-2xl flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden ${
            isPhoneInView
              ? "border-rose-500 ring-2 ring-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.45)]"
              : "border-white/[0.1]"
          }`}
        >
          {/* Real-time Prohibited Device Banner */}
          {isPhoneInView && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-2xl animate-bounce">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>📱 Prohibited Device in View: Mobile Phone</span>
            </div>
          )}

          {/* A. Live Centered Full-Stage Video */}
          <CameraPreviewStage
            videoRef={cameraVideoRef}
            isCameraActive={isCameraActive}
            cameraError={cameraError}
            layout="center-stage"
            userName={userName}
            onRetryCamera={onRetryCamera}
          />

          {/* B. Subtle Vignette Gradient Overlay for high-contrast legible overlays */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/25 to-black/70" />

          {/* C. Top Floating HUD (Status + Real-time AI Proctoring Shield) */}
          <div className="relative z-20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAISpeaking
                    ? "bg-blue-400 animate-pulse"
                    : isRecording
                    ? "bg-emerald-400 animate-ping"
                    : interviewPhase === "processing"
                    ? "bg-amber-400 animate-spin"
                    : "bg-emerald-500"
                }`}
              />
              <span className="text-xs font-medium text-neutral-200">
                {isAISpeaking
                  ? "Interviewer Speaking"
                  : isRecording
                  ? "Recording Your Answer..."
                  : interviewPhase === "processing"
                  ? "Analyzing Response..."
                  : "Ready • Click 'Record Answer' when ready"}
              </span>
            </div>

            {/* AI Proctoring Shield Pill */}
            <div className="flex items-center gap-2">
              <ProctoringBadge proctoringState={proctoringState} activeAlert={activeAlert} />
            </div>
          </div>

          {/* D. Overlaid Question & Live Speech Stage (Permanently Visible Question) */}
          <div className="relative z-20 w-full max-w-3xl mx-auto flex flex-col items-center gap-2.5 mt-auto">
            {/* Audio Waveform Pills */}
            {isRecording ? (
              <div className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/30 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1" />
                {safeBins.map((level, idx) => (
                  <div
                    key={idx}
                    className="w-1 sm:w-1.5 bg-emerald-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                    style={{
                      height: `${Math.max(4, Math.min(22, Math.round(level * 0.45)))}px`,
                    }}
                  />
                ))}
                <span className="text-[11px] font-semibold text-emerald-300 ml-1.5 hidden sm:inline">
                  Microphone Live
                </span>
              </div>
            ) : isAISpeaking ? (
              <div className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-full bg-black/80 backdrop-blur-md border border-blue-500/30 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse mr-1" />
                {[10, 16, 22, 14, 24, 18, 22, 12, 20, 14, 24, 16].map((h, idx) => (
                  <div
                    key={idx}
                    className="w-1 sm:w-1.5 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 0.7}px`,
                      animationDuration: `${0.35 + (idx % 4) * 0.12}s`,
                      animationDelay: `${idx * 40}ms`,
                    }}
                  />
                ))}
                <span className="text-[11px] font-medium text-blue-200 ml-1.5 hidden sm:inline">
                  Interviewer Speaking
                </span>
              </div>
            ) : interviewPhase === "processing" ? (
              <div className="flex items-center justify-center gap-2 h-8 px-4 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/30 shadow-xl">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-amber-300 font-medium">Evaluating your answer with AI...</span>
              </div>
            ) : null}

            {/* 1. PERMANENT INTERVIEWER QUESTION CARD - ALWAYS VISIBLE */}
            <div className="w-full rounded-2xl bg-[#0B0D14]/90 backdrop-blur-xl border border-white/15 px-5 py-3.5 shadow-2xl transition-all">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAISpeaking ? "bg-blue-400 animate-ping" : "bg-blue-500"
                    }`}
                  />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-blue-400">
                    {isAISpeaking ? "Interviewer Asking Question" : "Current Question"}
                  </span>
                </div>
                {currentQuestion?.number && (
                  <span className="text-[10px] font-medium text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    Question #{currentQuestion.number}
                  </span>
                )}
              </div>
              <div className="max-h-20 sm:max-h-24 overflow-y-auto pr-1 text-sm sm:text-base text-neutral-100 font-medium leading-relaxed scrollbar-thin scrollbar-thumb-white/20">
                "{promptText}"
              </div>
            </div>

            {/* 2. DEDICATED LIVE CANDIDATE SPEECH CONTAINER (VISIBLE WHEN RECORDING) */}
            {isRecording && (
              <div className="w-full rounded-2xl bg-black/85 backdrop-blur-xl border border-emerald-500/40 px-5 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                      Live Candidate Speech (You)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300/90 font-medium hidden sm:inline">
                    English preferred • Auto-Detect
                  </span>
                </div>
                <div
                  ref={transcriptScrollRef}
                  className="max-h-16 sm:max-h-20 overflow-y-auto pr-1 text-xs sm:text-sm text-emerald-100 font-normal leading-relaxed scrollbar-thin scrollbar-thumb-emerald-500/30"
                >
                  {liveCandidateTranscript || (
                    <span className="text-neutral-400 italic">
                      Listening... Speak your answer clearly in English.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. BOTTOM CONTROL DOCK (Manual Record & Submit Workflow) */}
      <footer className="min-h-20 py-3 px-6 sm:px-10 flex items-center justify-center border-t border-white/[0.08] bg-[#0E1017]">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* A. CORE ACTION BUTTON: MANUAL RECORD / DONE RECORDING & SUBMIT */}
          {!isRecording ? (
            <button
              onClick={() => {
                if (isAISpeaking) return;
                if (onStartRecording) onStartRecording();
              }}
              disabled={isAISpeaking || interviewPhase === "processing"}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xl cursor-pointer ${
                isAISpeaking || interviewPhase === "processing"
                  ? "bg-white/[0.06] text-neutral-400 cursor-not-allowed border border-white/[0.06]"
                  : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95"
              }`}
              title="Click when you are ready to answer the question"
            >
              <Mic className="w-4 h-4" />
              <span>Record Answer</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onStopRecording) onStopRecording();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-black text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              title="Click when you have finished speaking your response"
            >
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>Done Recording & Submit</span>
            </button>
          )}

          {/* B. MICROPHONE SELECTOR (Choose between internal, headset, AirPods, or USB mic) */}
          {audioDevices.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-neutral-300">
              <Mic className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => onSwitchAudioDevice?.(e.target.value)}
                className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[190px] truncate"
                title="Select Active Microphone"
              >
                {audioDevices.map((d, idx) => (
                  <option
                    key={d.deviceId || idx}
                    value={d.deviceId}
                    className="bg-[#11131A] text-neutral-200"
                  >
                    {d.label || `Microphone ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* C. REPEAT QUESTION BUTTON */}
          <button
            onClick={() => {
              if (onRequestRepeat) onRequestRepeat();
            }}
            disabled={isAISpeaking || isRecording || interviewPhase === "processing"}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isAISpeaking || isRecording || interviewPhase === "processing"
                ? "bg-white/[0.02] text-neutral-500 border-white/[0.04] cursor-not-allowed"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border-white/[0.08]"
            }`}
            title="Hear the interviewer repeat this question"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Repeat Question</span>
          </button>

          {/* D. SKIP QUESTION BUTTON */}
          <button
            onClick={() => {
              if (onSkipQuestion) onSkipQuestion();
            }}
            disabled={isAISpeaking || isRecording || interviewPhase === "processing"}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isAISpeaking || isRecording || interviewPhase === "processing"
                ? "bg-white/[0.02] text-neutral-500 border-white/[0.04] cursor-not-allowed"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 border-white/[0.08]"
            }`}
            title="Skip to next topic"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Skip</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ExecutiveStudioStage;

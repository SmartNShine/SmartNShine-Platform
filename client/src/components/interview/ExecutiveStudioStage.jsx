import { useEffect, useRef } from "react";
import { Check, Clock, Mic, PhoneOff, RotateCcw, SkipForward, Upload } from "lucide-react";
import { CONVERSATION_PHASES } from "./constants";
import { CameraPreviewStage } from "./proctoring/CameraPreviewStage";
import { ProctoringBadge } from "./proctoring/ProctoringBadge";

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const TurnCountdown = ({ remainingSec, totalSec, tone, label, formatTime }) => {
  const fraction = totalSec > 0 ? Math.min(1, Math.max(0, remainingSec / totalSec)) : 0;
  const stroke = {
    think: "stroke-amber-400",
    answer: "stroke-emerald-400",
    warning: "stroke-rose-400",
  }[tone];
  return (
    <div className="relative h-28 w-28 shrink-0" role="timer" aria-label={`${label}: ${formatTime(remainingSec)} left`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RING_RADIUS} className="fill-none stroke-white/10" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={RING_RADIUS}
          className={`fill-none ${stroke} transition-[stroke-dashoffset] duration-300 ease-linear`}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-2xl font-semibold tabular-nums">{formatTime(remainingSec)}</span>
        <span className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</span>
      </div>
    </div>
  );
};

const InterviewerTile = ({ interviewer, isSpeaking }) => (
  <div className={`relative w-24 overflow-hidden rounded-xl border bg-[#11131A] shadow-2xl sm:w-36 ${
    isSpeaking ? "border-blue-400 ring-2 ring-blue-400/50" : "border-white/15"
  }`}>
    {interviewer?.avatarImage ? (
      <img src={interviewer.avatarImage} alt="" className="aspect-[3/4] w-full object-cover" />
    ) : (
      <div className="flex aspect-[3/4] w-full items-center justify-center text-2xl font-semibold text-neutral-300">
        {interviewer?.name?.[0] || "AI"}
      </div>
    )}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-4">
      <p className="truncate text-[11px] font-semibold text-white sm:text-xs">{interviewer?.name || "Interviewer"}</p>
      <p className="hidden truncate text-[10px] text-neutral-300 sm:block">{interviewer?.title}</p>
    </div>
    {isSpeaking && (
      <div className="absolute right-1.5 top-1.5 flex h-4 items-end gap-0.5 rounded bg-black/60 px-1 py-0.5" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span key={bar} className="w-0.5 animate-pulse rounded-full bg-blue-300"
            style={{ height: `${6 + bar * 3}px`, animationDelay: `${bar * 150}ms` }} />
        ))}
      </div>
    )}
  </div>
);

export const ExecutiveStudioStage = ({
  currentQuestion,
  elapsedTime,
  interviewDuration,
  formatTime,
  answer,
  setAnswer,
  selectedMode,
  selectedRole,
  isRecording,
  isSubmitting,
  isPlayingAudio,
  interviewPhase,
  conversationPhase,
  micFrequencyBins,
  liveCandidateTranscript,
  hasRecordingDraft,
  onSubmitAnswer,
  onSkip,
  onAbandon,
  onRequestRepeat,
  onRetryReport,
  cameraVideoRef,
  isCameraActive,
  isCameraInitializing,
  cameraError,
  proctoringState,
  activeAlert,
  isPhoneInView,
  onRetryCamera,
  userName,
  interviewer,
  progress,
  turn,
  audioDevices = [],
  selectedAudioDeviceId,
  onSwitchAudioDevice,
}) => {
  const remainingSeconds = Math.max(0, interviewDuration * 60 - elapsedTime);
  const isWarmUp = conversationPhase === CONVERSATION_PHASES.INTRODUCTION ||
    conversationPhase === CONVERSATION_PHASES.WARM_UP;
  const isTextMode = selectedMode === "text";
  const isCompleting = interviewPhase === "completing";
  const reportFailed = interviewPhase === "report-error";
  const isInterviewerSpeaking = isPlayingAudio || interviewPhase === "asking" || interviewPhase === "greeting";
  const canAnswerText = interviewPhase === "waiting" && !isSubmitting && !isPlayingAudio;
  const stage = turn?.stage || "idle";
  const canSkip = !isWarmUp && !isSubmitting && (isTextMode ? canAnswerText : stage === "thinking" || stage === "answering");
  const transcriptRef = useRef(null);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [liveCandidateTranscript]);

  const prompt = isWarmUp
    ? "Please introduce yourself and tell me a little about your background."
    : currentQuestion?.text;

  const interviewerName = interviewer?.name || "The interviewer";
  const status = isCompleting ? "Generating your interview report…" :
    reportFailed ? "Your report could not be generated." :
    isSubmitting || stage === "submitting" ? "Submitting your answer…" :
    isInterviewerSpeaking ? `${interviewerName} is speaking…` :
    isTextMode ? "" :
    stage === "thinking" ? "Take a moment to think. Your microphone turns on automatically." :
    stage === "starting" ? "Turning on your microphone…" :
    stage === "answering" ? (turn.isWarning ? "Time is almost up — start wrapping up." : "Recording. Speak your answer.") :
    stage === "retry" ? (hasRecordingDraft
      ? "Your answer wasn't submitted. Submit it again or record a new answer."
      : "We didn't catch any audio. Record your answer again.") :
    stage === "mic-error" ? "We couldn't access your microphone. Check the device and try again." :
    "";

  const showCountdown = !isTextMode && (stage === "thinking" || stage === "answering");
  const countdownTone = stage === "thinking" ? "think" : turn?.isWarning ? "warning" : "answer";
  const showMicPicker = !isTextMode && audioDevices.length > 0 &&
    !isRecording && stage !== "starting" && stage !== "answering" && stage !== "submitting";

  const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50";
  const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-neutral-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:cursor-not-allowed disabled:opacity-50";

  const progressCurrent = isWarmUp ? 0 : currentQuestion?.number ?? progress?.current ?? 0;
  const progressTotal = progress?.total || 0;

  return (
    <div className="flex min-h-dvh flex-col bg-[#090A0F] font-sans text-neutral-100 lg:h-dvh lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0E1017] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{selectedRole || "Mock Interview"}</h1>
          {progressTotal > 0 && (
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
              <span className="tabular-nums">{isWarmUp ? "Introduction" : `Question ${progressCurrent} of ${progressTotal}`}</span>
              <span className="h-1 w-24 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <span className="block h-full rounded-full bg-blue-400 transition-[width] duration-500"
                  style={{ width: `${Math.round((progressCurrent / progressTotal) * 100)}%` }} />
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs tabular-nums text-neutral-300">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {remainingSeconds > 0 ? `${formatTime(remainingSeconds)} remaining` : "Wrapping up"}
          </div>
          <button type="button" onClick={onAbandon} disabled={isCompleting}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50">
            <PhoneOff className="h-4 w-4" aria-hidden="true" /> End call
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-3 sm:p-5 lg:min-h-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <section
          aria-label="Video call"
          className={`relative aspect-[3/4] max-h-[62dvh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:max-h-none ${
            isPhoneInView ? "ring-2 ring-inset ring-rose-500" : ""
          }`}
        >
          <CameraPreviewStage
            videoRef={cameraVideoRef}
            isCameraActive={isCameraActive}
            isInitializing={isCameraInitializing}
            cameraError={cameraError}
            layout="center-stage"
            userName={userName}
            onRetryCamera={onRetryCamera}
          />

          <div className="absolute left-3 top-3 z-10">
            <ProctoringBadge proctoringState={proctoringState} activeAlert={activeAlert} />
          </div>

          <div className="absolute right-3 top-3 z-10">
            <InterviewerTile interviewer={interviewer} isSpeaking={isInterviewerSpeaking} />
          </div>

          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium backdrop-blur-md">
            {isRecording ? (
              <span className="flex items-center gap-1.5 text-rose-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" aria-hidden="true" /> REC
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            )}
            <span className="max-w-[160px] truncate">{userName} (you)</span>
          </div>

          {isPhoneInView && (
            <p role="alert" className="absolute inset-x-3 bottom-14 z-10 rounded-lg bg-rose-600/90 px-3 py-2 text-sm font-semibold text-white">
              Mobile phone detected. Remove it from view.
            </p>
          )}
          {!isPhoneInView && proctoringState?.status === "warning" && !activeAlert && (
            <p role="status" className="absolute inset-x-3 bottom-14 z-10 rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-medium text-black">
              {proctoringState.message}
            </p>
          )}
        </section>

        <section aria-label="Interview question and answer"
          className="flex min-w-0 flex-col gap-5 rounded-2xl border border-white/10 bg-[#0E1017] p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-blue-300">
                {isWarmUp ? "Introduction" : `Question ${currentQuestion?.number ?? ""}`}
              </h2>
              {!isWarmUp && currentQuestion?.category && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-neutral-400">{currentQuestion.category}</span>
              )}
            </div>
            <p className="mt-2 break-words text-base leading-relaxed sm:text-lg">{prompt}</p>
          </div>

          {(showCountdown || status) && (
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3">
              {showCountdown && (
                <TurnCountdown
                  remainingSec={turn.remainingSec}
                  totalSec={turn.totalSec}
                  tone={countdownTone}
                  label={stage === "thinking" ? "Think" : "Answer"}
                  formatTime={formatTime}
                />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                {status && <p role="status" className="text-sm text-neutral-300">{status}</p>}
                {isRecording && (
                  <div aria-hidden="true" className="flex h-7 items-center gap-1">
                    {micFrequencyBins.map((level, index) => (
                      <span key={index} className={`w-1 rounded-full ${turn?.isWarning ? "bg-rose-400" : "bg-emerald-400"}`}
                        style={{ height: Math.min(24, Math.max(3, level * 0.45)) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(isRecording || hasRecordingDraft) && liveCandidateTranscript && (
            <div ref={transcriptRef} className="max-h-36 overflow-y-auto rounded-xl bg-black/30 p-3 text-sm leading-relaxed text-neutral-300">
              {liveCandidateTranscript}
            </div>
          )}

          {reportFailed ? (
            <div><button type="button" className={primaryButton} onClick={onRetryReport}>Retry report</button></div>
          ) : isCompleting ? null : isTextMode ? (
            <form onSubmit={onSubmitAnswer} className="flex flex-col gap-3">
              <label htmlFor="interview-answer" className="text-sm font-medium text-neutral-200">Your answer</label>
              <textarea id="interview-answer" value={answer} onChange={(event) => setAnswer(event.target.value)}
                rows={5} disabled={!canAnswerText}
                className="w-full resize-y rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white" />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!canAnswerText || answer.trim().length < 10} className={primaryButton}>Submit answer</button>
                <button type="button" disabled={!canSkip} onClick={onSkip} className={secondaryButton}>Skip question</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {stage === "thinking" && (
                <>
                  <button type="button" onClick={turn.startNow} className={primaryButton}>
                    <Mic className="h-4 w-4" aria-hidden="true" /> Start answering now
                  </button>
                  {turn.canRepeat && (
                    <button type="button" onClick={onRequestRepeat} className={secondaryButton}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Repeat question
                    </button>
                  )}
                </>
              )}
              {stage === "answering" && (
                <button type="button" onClick={turn.finishNow} className={primaryButton}>
                  <Check className="h-4 w-4" aria-hidden="true" /> I'm done
                </button>
              )}
              {stage === "retry" && (
                <>
                  {hasRecordingDraft && (
                    <button type="button" onClick={turn.submitDraft} disabled={isSubmitting} className={primaryButton}>
                      <Upload className="h-4 w-4" aria-hidden="true" /> Submit answer
                    </button>
                  )}
                  <button type="button" onClick={turn.retryMic} disabled={isSubmitting}
                    className={hasRecordingDraft ? secondaryButton : primaryButton}>
                    <Mic className="h-4 w-4" aria-hidden="true" /> Record again
                  </button>
                </>
              )}
              {stage === "mic-error" && (
                <button type="button" onClick={turn.retryMic} className={primaryButton}>
                  <Mic className="h-4 w-4" aria-hidden="true" /> Retry microphone
                </button>
              )}
              {canSkip && (
                <button type="button" onClick={onSkip} className={secondaryButton}>
                  <SkipForward className="h-4 w-4" aria-hidden="true" /> Skip
                </button>
              )}
              {showMicPicker && (
                <select value={selectedAudioDeviceId} onChange={(event) => onSwitchAudioDevice(event.target.value)}
                  disabled={isSubmitting} aria-label="Microphone"
                  className="max-w-full rounded-xl border border-white/15 bg-[#0E1017] px-3 py-2.5 text-sm text-neutral-200 disabled:opacity-50">
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {!isTextMode && !isCompleting && !reportFailed && (
            <p className="mt-auto text-xs leading-relaxed text-neutral-500">
              After each question you get a few seconds to think, then your microphone turns on automatically.
              Press <span className="text-neutral-300">I'm done</span> to finish early.
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ExecutiveStudioStage;

import { useEffect, useRef } from "react";
import { Check, Clock, Mic, PhoneOff, RotateCcw, SkipForward } from "lucide-react";
import { CONVERSATION_PHASES } from "./constants";
import { CameraPreviewStage } from "./proctoring/CameraPreviewStage";
import { ProctoringBadge } from "./proctoring/ProctoringBadge";

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
  onStartRecording,
  onSubmitRecording,
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
  audioDevices = [],
  selectedAudioDeviceId,
  onSwitchAudioDevice,
}) => {
  const remainingSeconds = Math.max(0, interviewDuration * 60 - elapsedTime);
  const isWarmUp = conversationPhase === CONVERSATION_PHASES.INTRODUCTION ||
    conversationPhase === CONVERSATION_PHASES.WARM_UP;
  const isTextMode = selectedMode === "text";
  const canAnswer = interviewPhase === "waiting" && !isSubmitting && !isPlayingAudio;
  const isCompleting = interviewPhase === "completing";
  const reportFailed = interviewPhase === "report-error";
  const canSkip = canAnswer && !isWarmUp && !isRecording;
  const transcriptRef = useRef(null);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [liveCandidateTranscript]);

  const prompt = isWarmUp
    ? "Please introduce yourself and tell me a little about your background."
    : currentQuestion?.text;
  const status = isCompleting ? "Generating your interview report?" :
    reportFailed ? "Your report could not be generated." :
    isSubmitting ? "Submitting your response?" :
    isRecording ? "Recording your answer" :
    hasRecordingDraft ? "Your recording is ready to submit." :
    isPlayingAudio || interviewPhase === "asking" || interviewPhase === "greeting" ? "Interviewer speaking" :
    "";

  const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50";
  const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-neutral-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex min-h-dvh flex-col bg-[#090A0F] font-sans text-neutral-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0E1017] px-4 py-3 sm:px-8">
        <h1 className="min-w-0 break-words text-sm font-semibold">{selectedRole || "Mock Interview"}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs tabular-nums text-neutral-300">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(remainingSeconds)} remaining
          </div>
          <button type="button" onClick={onAbandon} disabled={isCompleting}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 disabled:opacity-50">
            <PhoneOff className="h-4 w-4" aria-hidden="true" /> End call
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-label="Camera" className="min-w-0 self-start overflow-hidden rounded-2xl border border-white/10 bg-[#0E1017]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
            <span className="text-sm font-medium">{userName} (you)</span>
            <ProctoringBadge proctoringState={proctoringState} activeAlert={activeAlert} />
          </div>
          <div className={`relative aspect-video min-h-[180px] bg-black ${isPhoneInView ? "ring-2 ring-inset ring-rose-500" : ""}`}>
            <CameraPreviewStage
              videoRef={cameraVideoRef}
              isCameraActive={isCameraActive}
              isInitializing={isCameraInitializing}
              cameraError={cameraError}
              layout="center-stage"
              userName={userName}
              onRetryCamera={onRetryCamera}
            />
          </div>
          {isPhoneInView && (
            <p role="alert" className="px-4 py-2 text-sm font-semibold text-rose-300">Mobile phone detected. Remove it from view.</p>
          )}
          {!isPhoneInView && proctoringState?.status === "warning" && !activeAlert && (
            <p role="status" className="px-4 py-2 text-xs text-amber-200">{proctoringState.message}</p>
          )}
        </section>

        <section aria-label="Interview question and answer" className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-[#0E1017] p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-blue-300">
              {isWarmUp ? "Introduction" : `Question ${currentQuestion?.number ?? ""}`}
            </h2>
            <p className="mt-2 break-words text-base leading-relaxed sm:text-lg">{prompt}</p>
          </div>

          {status && <p role="status" className="text-sm text-neutral-300">{status}</p>}

          {isRecording && (
            <div aria-hidden="true" className="flex h-7 items-center gap-1">
              {micFrequencyBins.map((level, index) => (
                <span key={index} className="w-1 rounded-full bg-emerald-400" style={{ height: Math.min(24, Math.max(3, level * 0.45)) }} />
              ))}
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
                rows={5} disabled={!canAnswer}
                className="w-full resize-y rounded-xl border border-white/15 bg-black/30 p-3 text-sm text-white" />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!canAnswer || answer.trim().length < 10} className={primaryButton}>Submit answer</button>
                <button type="button" disabled={!canSkip} onClick={onSkip} className={secondaryButton}>Skip question</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {(isRecording || hasRecordingDraft) && (
                <button type="button" onClick={onSubmitRecording} disabled={isSubmitting || (!isRecording && !canAnswer)} className={primaryButton}>
                  <Check className="h-4 w-4" aria-hidden="true" /> {isRecording ? "Done Recording & Submit" : "Submit Recording"}
                </button>
              )}
              {!isRecording && (
                <button type="button" onClick={onStartRecording} disabled={!canAnswer}
                  className={hasRecordingDraft ? secondaryButton : primaryButton}>
                  <Mic className="h-4 w-4" aria-hidden="true" /> {hasRecordingDraft ? "Record Again" : "Record Answer"}
                </button>
              )}
              <button type="button" onClick={onRequestRepeat} disabled={!canSkip} className={secondaryButton}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Repeat
              </button>
              <button type="button" onClick={onSkip} disabled={!canSkip} className={secondaryButton}>
                <SkipForward className="h-4 w-4" aria-hidden="true" /> Skip
              </button>
              {audioDevices.length > 0 && (
                <select value={selectedAudioDeviceId} onChange={(event) => onSwitchAudioDevice(event.target.value)}
                  disabled={isRecording || isSubmitting} aria-label="Microphone"
                  className="max-w-full rounded-xl border border-white/15 bg-[#0E1017] px-3 py-2.5 text-sm text-neutral-200 disabled:opacity-50">
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ExecutiveStudioStage;

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CONVERSATION_PHASES } from "./constants";
import { CameraPreviewStage } from "./proctoring/CameraPreviewStage";
import { ProctoringBadge } from "./proctoring/ProctoringBadge";
import { TurnTimer } from "./TurnTimer";
import { InterviewerOrb } from "./InterviewerOrb";
import { CallEndIcon, DoneIcon, MicLiveIcon, ReplayIcon, SkipIcon, ThinkIcon } from "./StudioIcons";

// Button system for the dark studio: one bright primary, quiet secondaries.
const button = {
  base: "group inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  primary: "bg-white text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-12px_rgba(255,255,255,0.45)] hover:bg-neutral-100 focus-visible:outline-white/70",
  secondary: "bg-white/[0.06] text-neutral-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] hover:text-white focus-visible:outline-white/50",
  quiet: "px-4 text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-100 focus-visible:outline-white/40",
};

const visibleSteps = (current, total) => {
  if (total <= 6) return Array.from({ length: total }, (_, index) => index + 1);
  const keep = new Set([1, 2, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.flatMap((n, index) => (index && n - sorted[index - 1] > 1 ? ["gap", n] : [n]));
};

/** Intro · 1 · 2 · … · 5 — advances only when a new main question starts. */
const QuestionStepper = ({ current, total, isIntro }) => {
  if (!total) return null;
  const steps = visibleSteps(Math.max(current, 1), total);
  return (
    <ol className="flex items-center gap-1.5" aria-label={isIntro ? "Introduction" : `Question ${current} of ${total}`}>
      <li className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-300 ${
        isIntro ? "bg-sky-300/15 text-sky-100 ring-1 ring-inset ring-sky-300/40" : "text-neutral-500"
      }`}>Intro</li>
      {steps.map((step, index) => step === "gap" ? (
        <li key={`gap-${index}`} className="flex gap-0.5 px-0.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => <span key={dot} className="h-1 w-1 rounded-full bg-white/25" />)}
        </li>
      ) : (
        <li key={step} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-px w-3 transition-colors duration-500 sm:w-4 ${step <= current && !isIntro ? "bg-white/50" : "bg-white/10"}`} />
          <span
            aria-current={step === current && !isIntro ? "step" : undefined}
            className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-all duration-500 ${
              step < current ? "bg-white/85 text-neutral-950"
                : step === current && !isIntro ? "bg-sky-300/15 text-sky-50 ring-2 ring-sky-300/60"
                  : "bg-white/[0.04] text-neutral-500 ring-1 ring-inset ring-white/10"
            }`}
          >
            {step}
            {step === current && !isIntro && (
              <span className="absolute inset-0 rounded-full ring-2 ring-sky-300/40 motion-safe:animate-ping" aria-hidden="true" />
            )}
          </span>
        </li>
      ))}
    </ol>
  );
};

const ORB_LABELS = {
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  idle: "Ready",
};

/** Shubh's presence at the top of the conversation panel. */
const InterviewerPresence = ({ interviewer, state, listenLevel }) => {
  const name = interviewer?.name || "Interviewer";
  return (
    <div className="flex items-center gap-4">
      <div className="relative -m-2 shrink-0">
        <InterviewerOrb size={84} state={state} listenLevel={listenLevel} label={`${name}: ${ORB_LABELS[state]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-white">{name}</p>
        <p className="truncate text-xs text-neutral-400">{interviewer?.title}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-sky-200" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${
            state === "speaking" ? "bg-sky-300 motion-safe:animate-pulse"
              : state === "listening" ? "bg-emerald-300 motion-safe:animate-pulse"
                : state === "thinking" ? "bg-indigo-300 motion-safe:animate-pulse" : "bg-neutral-500"
          }`} aria-hidden="true" />
          {ORB_LABELS[state]}
        </p>
      </div>
    </div>
  );
};

const TypingDots = () => (
  <span className="ml-1.5 inline-flex gap-0.5 align-middle" aria-hidden="true">
    {[0, 1, 2].map((dot) => (
      <span key={dot} className="h-1 w-1 rounded-full bg-current motion-safe:animate-bounce" style={{ animationDelay: `${dot * 120}ms` }} />
    ))}
  </span>
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
  isFillerPlaying = false,
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
  questionSteps,
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
  const isInterviewerSpeaking = isPlayingAudio || isFillerPlaying || interviewPhase === "asking" || interviewPhase === "greeting";
  const canAnswerText = interviewPhase === "waiting" && !isSubmitting && !isPlayingAudio;
  const stage = turn?.stage || "idle";
  const isReviewing = isSubmitting || stage === "submitting";
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
  const status = isCompleting ? { text: "Wrapping up and preparing your report", dots: true } :
    reportFailed ? { text: "Your report could not be generated." } :
    isReviewing ? { text: `${interviewerName} is going through your answer`, dots: true } :
    isInterviewerSpeaking ? { text: `${interviewerName} is speaking` } :
    isTextMode ? null :
    stage === "thinking" ? { text: "Take a moment to collect your thoughts. Your mic turns on by itself.", icon: true } :
    stage === "starting" ? { text: "Turning on your microphone", dots: true } :
    stage === "answering" ? { text: turn.isWarning ? "Start bringing your answer to a close." : "You're live. Speak your answer." } :
    stage === "retry" ? { text: hasRecordingDraft
      ? "Your answer didn't go through. Send it again or record a new one."
      : "We didn't catch any audio. Let's try that again." } :
    stage === "mic-error" ? { text: "We couldn't reach your microphone. Check it and try again." } :
    null;

  const orbState = isInterviewerSpeaking ? "speaking"
    : isReviewing || isCompleting ? "thinking"
      : isRecording ? "listening" : "idle";
  const micLevel = isRecording && micFrequencyBins?.length
    ? Math.min(1, Math.max(0, micFrequencyBins.reduce((sum, level) => sum + level, 0) / micFrequencyBins.length - 3) / 20)
    : 0;

  const showTimer = !isTextMode && (stage === "thinking" || stage === "answering");
  const showMicPicker = !isTextMode && audioDevices.length > 0 &&
    (stage === "thinking" || stage === "retry" || stage === "mic-error");
  // Follow-ups use a planned slot without starting a new step.
  const stepTotal = Math.max(1, (progress?.total || 0) - (questionSteps?.followUps || 0));

  return (
    <div className="flex min-h-dvh flex-col bg-[#08090D] font-sans text-neutral-100 lg:h-dvh lg:overflow-hidden">
      <header className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/[0.06] bg-[#0C0E14]/80 px-4 py-3 backdrop-blur sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <p className="min-w-0 truncate text-sm font-medium text-neutral-300">{selectedRole || "Mock interview"}</p>
        <div className="order-3 col-span-2 flex justify-center lg:order-none lg:col-span-1">
          <QuestionStepper current={questionSteps?.current || 0} total={stepTotal} isIntro={isWarmUp} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="rounded-full px-3 py-1.5 text-xs tabular-nums text-neutral-400 ring-1 ring-inset ring-white/10">
            {remainingSeconds > 0 ? formatTime(remainingSeconds) : "Wrapping up"}
          </span>
          <button type="button" onClick={onAbandon} disabled={isCompleting}
            className="group inline-flex h-9 items-center gap-2 rounded-full bg-rose-500/10 px-3.5 text-xs font-semibold text-rose-200 ring-1 ring-inset ring-rose-400/25 transition-[background-color,transform] duration-150 hover:bg-rose-500/20 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300 disabled:opacity-50">
            <CallEndIcon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-[8deg]" /> End interview
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-3 sm:p-5 lg:min-h-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)]">
        <section
          aria-label="Video call"
          className={`relative aspect-[3/4] max-h-[62dvh] w-full overflow-hidden rounded-3xl border bg-black transition-[border-color,box-shadow] duration-300 sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:max-h-none ${
            isPhoneInView ? "border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.35)]" : "border-white/[0.08]"
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

          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
            {isRecording ? (
              <span className="flex items-center gap-1.5 text-rose-200">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                Live
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-neutral-500" aria-hidden="true" />
            )}
            <span className="max-w-[160px] truncate">{userName}</span>
          </div>

          <AnimatePresence>
            {isPhoneInView && (
              <motion.p role="alert"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute inset-x-3 bottom-14 z-10 rounded-2xl bg-rose-600/90 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur">
                A phone is visible on camera. Please put it away.
              </motion.p>
            )}
          </AnimatePresence>
          {!isPhoneInView && proctoringState?.status === "warning" && !activeAlert && (
            <p role="status" className="absolute inset-x-3 bottom-14 z-10 rounded-2xl bg-amber-400/90 px-4 py-2 text-xs font-medium text-neutral-950">
              {proctoringState.message}
            </p>
          )}
        </section>

        <section aria-label="Interview question and answer"
          className="flex min-w-0 flex-col gap-6 rounded-3xl border border-white/[0.08] bg-[#0E1017] p-5 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
          <InterviewerPresence interviewer={interviewer} state={orbState} listenLevel={micLevel} />

          <div className="h-px bg-white/[0.06]" aria-hidden="true" />

          <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
            {isWarmUp ? "Introduction" : currentQuestion?.number ? `Question ${questionSteps?.current || currentQuestion.number}` : "Question"}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={isWarmUp ? "intro" : currentQuestion?.number ?? "none"}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="break-words text-lg font-medium leading-relaxed tracking-[-0.01em] text-neutral-50 sm:text-xl"
            >
              {prompt}
            </motion.p>
          </AnimatePresence>
          </div>

          {(showTimer || status) && (
            <div className="flex items-center gap-5 rounded-2xl bg-white/[0.025] p-4 ring-1 ring-inset ring-white/[0.06]">
              {showTimer && (
                <TurnTimer
                  stage={stage}
                  totalSec={turn.totalSec}
                  getRemainingMs={turn.getRemainingMs}
                  isPaused={turn.isPaused}
                />
              )}
              <div className="min-w-0 flex-1 space-y-3">
                {status && (
                  <p role="status" className="flex items-start gap-2 text-sm leading-relaxed text-neutral-300">
                    {status.icon && <ThinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />}
                    <span>{status.text}{status.dots && <TypingDots />}</span>
                  </p>
                )}
                {isRecording && (
                  <div aria-hidden="true" className="flex h-8 items-center gap-[3px]">
                    {micFrequencyBins.map((level, index) => (
                      <span key={index}
                        className={`w-1 rounded-full transition-[height] duration-75 ${turn?.isWarning ? "bg-amber-300" : "bg-gradient-to-t from-teal-300 to-sky-300"}`}
                        style={{ height: Math.min(28, Math.max(3, level * 0.5)) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(isRecording || hasRecordingDraft) && liveCandidateTranscript && (
            <div ref={transcriptRef} className="max-h-36 overflow-y-auto rounded-2xl bg-black/30 p-4 text-sm leading-relaxed text-neutral-400 ring-1 ring-inset ring-white/[0.05]">
              {liveCandidateTranscript}
            </div>
          )}

          {reportFailed ? (
            <div><button type="button" className={`${button.base} ${button.primary}`} onClick={onRetryReport}>Retry report</button></div>
          ) : isCompleting ? null : isTextMode ? (
            <form onSubmit={onSubmitAnswer} className="flex flex-col gap-3">
              <label htmlFor="interview-answer" className="text-sm font-medium text-neutral-300">Your answer</label>
              <textarea id="interview-answer" value={answer} onChange={(event) => setAnswer(event.target.value)}
                rows={6} disabled={!canAnswerText}
                className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white focus:border-sky-300/50 focus:outline-none" />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!canAnswerText || answer.trim().length < 10} className={`${button.base} ${button.primary}`}>
                  <DoneIcon className="h-[18px] w-[18px]" /> Submit answer
                </button>
                <button type="button" disabled={!canSkip} onClick={onSkip} className={`${button.base} ${button.quiet}`}>
                  <SkipIcon className="h-[18px] w-[18px]" /> Skip
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {stage === "thinking" && (
                <>
                  <button type="button" onClick={turn.startNow} className={`${button.base} ${button.primary}`}>
                    <MicLiveIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-y-px" /> I'm ready
                  </button>
                  {turn.canRepeat && (
                    <button type="button" onClick={onRequestRepeat} className={`${button.base} ${button.secondary}`}>
                      <ReplayIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-45" /> Hear it again
                    </button>
                  )}
                </>
              )}
              {stage === "answering" && (
                <button type="button" onClick={turn.finishNow} className={`${button.base} ${button.primary}`}>
                  <DoneIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" /> I'm done
                </button>
              )}
              {stage === "retry" && (
                <>
                  {hasRecordingDraft && (
                    <button type="button" onClick={turn.submitDraft} disabled={isSubmitting} className={`${button.base} ${button.primary}`}>
                      <DoneIcon className="h-[18px] w-[18px]" /> Send answer
                    </button>
                  )}
                  <button type="button" onClick={turn.retryMic} disabled={isSubmitting}
                    className={`${button.base} ${hasRecordingDraft ? button.secondary : button.primary}`}>
                    <MicLiveIcon className="h-[18px] w-[18px]" /> Record again
                  </button>
                </>
              )}
              {stage === "mic-error" && (
                <button type="button" onClick={turn.retryMic} className={`${button.base} ${button.primary}`}>
                  <MicLiveIcon className="h-[18px] w-[18px]" /> Try microphone again
                </button>
              )}
              {canSkip && (
                <button type="button" onClick={onSkip} className={`${button.base} ${button.quiet}`}>
                  <SkipIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" /> Skip
                </button>
              )}
              {showMicPicker && (
                <select value={selectedAudioDeviceId} onChange={(event) => onSwitchAudioDevice(event.target.value)}
                  disabled={isSubmitting} aria-label="Microphone"
                  className="h-11 max-w-full rounded-full border-0 bg-white/[0.04] px-4 text-xs text-neutral-400 ring-1 ring-inset ring-white/10 hover:text-neutral-200 focus:outline-none focus-visible:ring-white/40 disabled:opacity-50">
                  {audioDevices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {!isTextMode && !isCompleting && !reportFailed && (
            <p className="mt-auto text-xs leading-relaxed text-neutral-500">
              After each question you get a few seconds to think, then your mic turns on by itself.
              Press <span className="text-neutral-300">I'm done</span> whenever you've finished.
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ExecutiveStudioStage;

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { ArrowRight, AudioLines, FileBarChart2, History, ScanFace } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { StudioDialog } from "@/components/interview/StudioDialog";
import { primeVoiceActivity } from "@/components/interview/voiceActivity";
import { CallEndIcon, ShieldIcon, SkipIcon } from "@/components/interview/StudioIcons";
import {
  useScreenShare,
  requestScreenShare,
  stopScreenShare,
  isFullScreenShare,
  isPartialScreenShare,
} from "@/components/interview/hooks/useScreenShare";
import {
  INTERVIEWER_VOICES,
  SetupStep,
  MonitoringCheckStep,
  InterviewStep,
  ResultStep,
  useInterviewSpeech,
  useInterviewRecording,
  useInterviewSession,
  useCameraStream,
  useVideoRecorder,
  useProctoringEngine,
  useInterviewTurnFlow,
  useEnvironmentGuard,
  requestInterviewFullscreen,
  exitInterviewFullscreen,
  getAnswerTimeLimitSec,
  CONVERSATION_PHASES,
  INTRO_ANSWER_TIME_SEC,
} from "@/components/interview";

// Screen sharing is mandatory only for TPO-assigned assessments (security plan S1.5).
// They are not linked to interview sessions yet, so self-chosen proctored mode only flags.
const SCREEN_SHARE_REQUIRED = false;

const AIInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletContext = useOutletContext();
  const setIsFocusMode = outletContext?.setIsFocusMode;
  const isProduction = import.meta.env.PROD || false;
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  // { previous, resolve } while asking to share the entire screen instead of a window/tab.
  const [partialShare, setPartialShare] = useState(null);
  // Setup → monitoring check (camera, system check, consent, screen share) → interview.
  const [isMonitoringCheckOpen, setIsMonitoringCheckOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem("theme") ||
      (document.documentElement.classList.contains("dark") ? "dark" : "light")
    );
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Selected persona & voice engine
  const [selectedVoice] = useState("shubh");
  const [voiceEngine, setVoiceEngineState] = useState(() => {
    if (isProduction) return "sarvam";
    return localStorage.getItem("ai_interview_voice_engine") || "sarvam";
  });

  const setVoiceEngine = (engine) => {
    if (isProduction && engine === "local") {
      toast.error("Local microservices are only available in development mode.");
      return;
    }
    setVoiceEngineState(engine);
    localStorage.setItem("ai_interview_voice_engine", engine);
    toast.success(
      engine === "sarvam"
        ? "Voice Engine: Sarvam AI Cloud (Saaras & Bulbul)"
        : engine === "local"
        ? "Voice Engine: Local Microservices (Whisper & Chatterbox)"
        : engine === "browser"
        ? "Voice Engine: Browser Web Speech API"
        : "Voice Engine: Auto (Smart Hybrid Fallback)"
    );
  };

  // Ref bridge for circular dependencies between speech, recording & session
  const onVoiceSubmitBridgeRef = useRef(null);
  const setInterviewPhaseBridgeRef = useRef(null);
  const isMutedRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const interviewPhaseRef = useRef("idle");
  const hasStartedCameraRef = useRef(false);
  const hasStartedVideoRecRef = useRef(false);
  const answerWindowOpenRef = useRef(false);

  // 1. Hook for Speech & TTS
  const speech = useInterviewSpeech({
    selectedVoice,
    voiceEngine,
    serverTtsAvailable: true,
    isMuted: isMutedRef.current,
    isMutedRef,
    isInterviewActiveRef,
    setInterviewPhase: (phase) => setInterviewPhaseBridgeRef.current?.(phase),
  });

  // 2. Hook for manual answer recording
  const recording = useInterviewRecording({
    getSelectedLanguage: () => session.selectedLanguage,
    isInterviewActiveRef,
    getInterviewPhase: () => interviewPhaseRef.current,
    onVoiceSubmit: (...args) => onVoiceSubmitBridgeRef.current?.(...args),
  });

  // 3. Hook for Session Lifecycle
  const session = useInterviewSession({
    user,
    isProduction,
    voiceEngine,
    setVoiceEngineState,
    selectedVoice,
    speakAndListen: speech.speakAndListen,
    speakSegments: speech.speakSegments,
    playFiller: speech.playFiller,
    preloadClips: speech.preloadClips,
    greetingClip: speech.greetingClip,
    stopLocalAudio: speech.stopLocalAudio,
    cleanupAudioStreams: recording.cleanupAudioStreams,
    isFinalizingRecordingRef: recording.isFinalizingRef,
    answerWindowOpenRef,
    isInterviewActiveRef,
    isMutedRef,
  });

  // 3b. Automatic spoken turn: think time → auto-record → timed answer → auto-submit
  const isWarmUpTurn = session.conversationPhase === CONVERSATION_PHASES.WARM_UP;
  const turnFlow = useInterviewTurnFlow({
    enabled: session.step === "interview" && session.selectedMode !== "text",
    interviewPhase: session.interviewPhase,
    turnKey: isWarmUpTurn ? "intro" : `q${session.currentQuestion?.number ?? 0}`,
    answerLimitSec: isWarmUpTurn
      ? INTRO_ANSWER_TIME_SEC
      : getAnswerTimeLimitSec(session.currentQuestion),
    isRecording: recording.isRecording,
    hasRecordingDraft: recording.hasRecordingDraft,
    startRecording: recording.startRecording,
    submitRecording: recording.submitRecording,
    cancelRecording: recording.cancelRecording,
    prepareMic: recording.startMicPreview,
    // Fill the processing gap like a real interviewer: a natural beat before
    // the acknowledgment (never an instant reply, and the closing mic can't
    // pick it up). Cancelled automatically if the next question is already ready.
    onAnswerEnd: (reason) => {
      speech.playFiller(reason === "timeout" ? "times_up" : "ack", {
        delayMs: reason === "timeout" ? 450 : 700 + Math.round(Math.random() * 400),
      });
    },
    answerWindowOpenRef,
  });


  const handleSkip = () => setIsSkipDialogOpen(true);

  const handleConfirmSkip = async () => {
    setIsSkipDialogOpen(false);
    recording.cancelRecording();
    if (session.selectedMode !== "text") speech.playFiller("skip_ack", { delayMs: 300 });
    await session.handleSkipQuestion({ skipConfirm: true });
  };

  const handleRepeat = () => {
    if (!turnFlow.canRepeat) return;
    turnFlow.recordRepeat();
    session.handleRepeatQuestion();
  };

  // 4. Hook for Camera Video Stream
  const camera = useCameraStream({ autoStart: false });

  // 5. Hook for Session Video Recording
  const videoRecorder = useVideoRecorder();

  const activeSessionId =
    session.session?.id ||
    session.session?._id ||
    session.session?.sessionId;

  // 6. Hook for Real-time AI Proctoring & Edge Anti-Cheat
  const proctoring = useProctoringEngine({
    videoRef: camera.videoRef,
    sessionId: activeSessionId,
    isInterviewActive: session.step === "interview" && session.interviewPhase !== "completing" && session.interviewPhase !== "report-error",
    interviewStartTime: session.session?.startedAt
      ? new Date(session.session.startedAt).getTime()
      : null,
  });

  // 7. Screen sharing (proctored): still frames every 15 s and when the candidate leaves.
  const isProctored = session.proctoringLevel === "proctored";
  const isLiveInterview = session.step === "interview" && session.interviewPhase !== "completing" && session.interviewPhase !== "report-error";
  const screenShare = useScreenShare({
    active: isProctored && isLiveInterview,
    sessionId: activeSessionId,
    interviewStartTime: session.session?.startedAt ? new Date(session.session.startedAt).getTime() : null,
    required: SCREEN_SHARE_REQUIRED,
    logViolation: proctoring.logViolation,
  });

  // 8. Environment guard: time away, fullscreen, displays, virtual devices, tabs.
  const environment = useEnvironmentGuard({
    active: isLiveInterview,
    level: session.proctoringLevel,
    cameraStream: camera.stream,
    getMicStream: recording.getMicStream,
    logViolation: proctoring.logViolation,
    onAwayStart: isProctored ? screenShare.onAwayStart : undefined,
    takeAwayFrameId: isProctored ? screenShare.takeAwayFrameId : undefined,
  });

  // Freeze the turn countdown while a dialog is open, fullscreen was left or the share stopped.
  const isTimerFrozen = isExitModalOpen || isSkipDialogOpen || environment.fullscreenLost || screenShare.shareLost;
  useEffect(() => {
    if (isTimerFrozen) turnFlow.pause();
    else turnFlow.resume();
  }, [isTimerFrozen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session.step !== "setup") setIsMonitoringCheckOpen(false);
    if (session.step === "interview") return;
    exitInterviewFullscreen();
    screenShare.stop();
  }, [session.step]); // eslint-disable-line react-hooks/exhaustive-deps

  // A window or tab was shared: ask once more for the entire screen (a new click).
  const askForEntireScreen = (previous) => new Promise((resolve) => setPartialShare({ previous, resolve }));
  const handleShareEntireScreen = () => {
    const pending = partialShare;
    if (!pending) return;
    requestScreenShare().then((result) => {
      setPartialShare(null);
      if (!result.stream) return pending.resolve(pending.previous); // picker cancelled: keep the first share
      stopScreenShare(pending.previous.stream);
      pending.resolve(result);
    });
  };
  const handleKeepPartialShare = () => {
    const pending = partialShare;
    if (!pending) return;
    setPartialShare(null);
    if (SCREEN_SHARE_REQUIRED) {
      stopScreenShare(pending.previous.stream);
      pending.resolve({ stream: null, status: "declined", reason: "cancelled" });
    } else {
      pending.resolve(pending.previous);
    }
  };

  // Setup "Launch": validate the configuration, then open the monitoring check.
  const handleOpenMonitoringCheck = () => {
    const startError = session.getStartError();
    if (startError) {
      toast.error(startError);
      return;
    }
    setIsMonitoringCheckOpen(true);
    window.scrollTo({ top: 0 });
  };

  // Fullscreen and the screen-share picker must be requested inside the click itself (browser rule).
  const handleStart = async () => {
    primeVoiceActivity(); // in the click: lets Shubh's orb follow his voice
    const startError = session.getStartError();
    if (startError) {
      toast.error(startError);
      return;
    }
    if (!isProctored) {
      await session.handleStartInterview();
      return;
    }
    void requestInterviewFullscreen();
    let share = await requestScreenShare();
    if (isPartialScreenShare(share.status)) share = await askForEntireScreen(share);
    if (SCREEN_SHARE_REQUIRED && !isFullScreenShare(share.status)) {
      stopScreenShare(share.stream);
      exitInterviewFullscreen();
      toast.error("This assessment needs your entire screen shared. Use Chrome or Edge on a computer and choose \"Entire screen\".");
      return;
    }
    screenShare.adopt(share);
    const started = await session.handleStartInterview({ screenShare: { status: share.status } });
    if (started !== true) {
      screenShare.stop();
      exitInterviewFullscreen();
    }
  };

  // Auto-start camera once when entering live interview
  useEffect(() => {
    if (session.step === "interview") {
      if (!hasStartedCameraRef.current) {
        hasStartedCameraRef.current = true;
        if (!camera.streamRef.current?.active) camera.startCamera();
      }
    } else {
      hasStartedCameraRef.current = false;
    }
  }, [session.step]);

  // Start background video recording once camera stream is ready in interview step
  useEffect(() => {
    if (
      session.step === "interview" &&
      camera.stream &&
      !hasStartedVideoRecRef.current
    ) {
      hasStartedVideoRecRef.current = true;
      videoRecorder.startVideoRecording({
        cameraStream: camera.stream,
      });
    } else if (session.step !== "interview") {
      hasStartedVideoRecRef.current = false;
    }
  }, [session.step, !!camera.stream]);

  // Stop video recording and upload upon interview completion
  useEffect(() => {
    if (session.step === "result" && videoRecorder.isRecordingVideo) {
      videoRecorder.stopVideoRecording().then((blob) => {
        camera.stopCamera();
        if (blob && activeSessionId) {
          videoRecorder.uploadSessionVideo(activeSessionId, blob);
        }
      });
    } else if (session.step === "result") {
      camera.stopCamera();
    }
  }, [session.step, activeSessionId, videoRecorder.isRecordingVideo]);

  // Keep phase ref synchronized with session.interviewPhase
  useEffect(() => {
    if (session.interviewPhase) {
      interviewPhaseRef.current = session.interviewPhase;
    }
  }, [session.interviewPhase]);

  // Synchronize focus mode with active live interview (hides sidebar & navbar for 100% focus)
  useEffect(() => {
    if (typeof setIsFocusMode === "function") {
      setIsFocusMode(session.step === "interview" || (session.step === "setup" && isMonitoringCheckOpen));
    }
    return () => {
      if (typeof setIsFocusMode === "function") {
        setIsFocusMode(false);
      }
    };
  }, [session.step, isMonitoringCheckOpen, setIsFocusMode]);

  // Connect bridges
  onVoiceSubmitBridgeRef.current = session.handleVoiceSubmit;
  setInterviewPhaseBridgeRef.current = (phase) => {
    interviewPhaseRef.current = phase;
    session.setInterviewPhase(phase);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speech.stopLocalAudio();
      recording.cleanupAudioStreams();
      camera.stopCamera();
    };
  }, []);

  // Intercept browser back button & page unload during live interview
  useEffect(() => {
    if (session.step !== "interview") return;

    window.history.pushState({ interviewActive: true }, "");

    const handlePopState = () => {
      window.history.pushState({ interviewActive: true }, "");
      setIsExitModalOpen(true);
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session.step]);

  const handleRequestExit = () => {
    setIsExitModalOpen(true);
  };

  const handleConfirmExit = async () => {
    setIsAbandoning(true);
    try {
      await session.handleAbandonInterview(true);
      await videoRecorder.stopVideoRecording();
      camera.stopCamera();
    } finally {
      setIsAbandoning(false);
      setIsExitModalOpen(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (session.loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#121212] text-gray-900 dark:text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading AI Interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-gray-900 dark:text-white transition-colors duration-300">
      {session.step === "interview" ? (
        <InterviewStep
          currentQuestion={session.currentQuestion}
          selectedMode={session.selectedMode}
          selectedRole={session.selectedRole}
          interviewPhase={session.interviewPhase}
          conversationPhase={session.conversationPhase}
          elapsedTime={session.elapsedTime}
          interviewDuration={session.interviewDuration}
          isRecording={recording.isRecording}
          isPlayingAudio={speech.isPlayingAudio}
          isFillerPlaying={speech.isFillerPlaying}
          answer={session.answer}
          setAnswer={session.setAnswer}
          isSubmitting={session.isSubmitting}
          micFrequencyBins={recording.micFrequencyBins}
          liveCandidateTranscript={recording.liveCandidateTranscript}
          user={user}
          onSkip={handleSkip}
          onRequestRepeat={handleRepeat}
          onAbandon={handleRequestExit}
          onSubmitAnswer={session.handleSubmitAnswer}
          interviewer={INTERVIEWER_VOICES[selectedVoice]}
          progress={session.progress}
          questionSteps={session.questionSteps}
          turn={turnFlow}
          hasRecordingDraft={recording.hasRecordingDraft}
          onRetryReport={session.handleCompleteInterview}
          formatTime={formatTime}
          cameraVideoRef={camera.attachVideoRef}
          isCameraActive={camera.isCameraActive}
          isCameraInitializing={camera.isInitializing}
          cameraError={camera.cameraError}
          proctoringState={proctoring.proctoringState}
          activeAlert={proctoring.activeAlert}
          isPhoneInView={proctoring.isPhoneInView}
          onRetryCamera={() => camera.startCamera(camera.selectedDeviceId)}
          audioDevices={recording.audioDevices}
          selectedAudioDeviceId={recording.selectedAudioDeviceId}
          onSwitchAudioDevice={recording.switchAudioDevice}
        />
      ) : session.step === "setup" && isMonitoringCheckOpen ? (
        <MonitoringCheckStep
          proctoringLevel={session.proctoringLevel}
          screenShareRequired={SCREEN_SHARE_REQUIRED}
          roleLabel={session.selectedRole}
          isSubmitting={session.isSubmitting}
          onBack={() => {
            camera.stopCamera();
            setIsMonitoringCheckOpen(false);
          }}
          onBegin={handleStart}
          cameraVideoRef={camera.attachVideoRef}
          isCameraActive={camera.isCameraActive}
          cameraError={camera.cameraError}
          isCameraInitializing={camera.isInitializing}
          onStartCamera={camera.startCamera}
          videoDevices={camera.videoDevices}
          selectedDeviceId={camera.selectedDeviceId}
          onSwitchCamera={camera.switchCamera}
          audioDevices={recording.audioDevices}
          selectedAudioDeviceId={recording.selectedAudioDeviceId}
          onSwitchAudioDevice={recording.switchAudioDevice}
          audioInputLevel={recording.audioInputLevel}
          onStartMicPreview={recording.startMicPreview}
        />
      ) : (
        <div className="workspace-container py-6 sm:py-8 space-y-8">
          {/* Page header */}
          {session.step === "setup" && (
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-sky-300">
                  <AudioLines className="h-4 w-4" aria-hidden="true" />
                  AI Interview Studio
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  Practise the interview before the interview
                </h1>
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-sm text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1.5"><AudioLines className="h-4 w-4 text-gray-400" aria-hidden="true" /> Real voice conversation</li>
                  <li className="flex items-center gap-1.5"><ScanFace className="h-4 w-4 text-gray-400" aria-hidden="true" /> On-device proctoring</li>
                  <li className="flex items-center gap-1.5"><FileBarChart2 className="h-4 w-4 text-gray-400" aria-hidden="true" /> Detailed feedback report</li>
                </ul>
              </div>
              <Link
                to="/interview/history"
                id="btn-view-interview-history"
                className="group inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
              >
                <History className="h-4 w-4" aria-hidden="true" />
                Past interviews
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </header>
          )}

          {/* Step 1: Setup */}
          {session.step === "setup" && !isMonitoringCheckOpen && (
            <SetupStep
              config={session.config}
              resumes={session.resumes}
              selectedType={session.selectedType}
              setSelectedType={session.setSelectedType}
              selectedRole={session.selectedRole}
              setSelectedRole={session.setSelectedRole}
              selectedLevel={session.selectedLevel}
              setSelectedLevel={session.setSelectedLevel}
              selectedMode={session.selectedMode}
              setSelectedMode={session.setSelectedMode}
              selectedLanguage={session.selectedLanguage}
              setSelectedLanguage={session.setSelectedLanguage}
              selectedResume={session.selectedResume}
              setSelectedResume={session.setSelectedResume}
              jobDescription={session.jobDescription}
              setJobDescription={session.setJobDescription}
              interviewDuration={session.interviewDuration}
              setInterviewDuration={session.setInterviewDuration}
              proctoringLevel={session.proctoringLevel}
              setProctoringLevel={session.setProctoringLevel}
              voiceAvailable={session.voiceAvailable}
              ttsAvailable={session.ttsAvailable}
              voiceEngine={voiceEngine}
              setVoiceEngine={setVoiceEngine}
              voiceProviders={session.voiceProviders}
              selectedVoice={selectedVoice}
              isProduction={isProduction}
              isSubmitting={session.isSubmitting}
              isTestingVoice={speech.isTestingVoice}
              isPlayingAudio={speech.isPlayingAudio}
              onTestVoice={speech.handleTestVoice}
              onStart={handleOpenMonitoringCheck}
            />
          )}

          {/* Step 3: Performance Scorecard */}
          {session.step === "result" && (
            <ResultStep
              result={session.result}
              elapsedTime={session.elapsedTime}
              formatTime={formatTime}
              onNewInterview={() => {
                session.resetState();
                session.setStep("setup");
              }}
              onRetry={() => {
                session.resetState();
                session.setStep("setup");
              }}
              onViewHistory={() => navigate("/interview/history")}
            />
          )}
        </div>
      )}

      <StudioDialog
        open={isExitModalOpen}
        tone="danger"
        icon={<CallEndIcon className="h-5 w-5" />}
        title="End this interview?"
        description="Your answers so far won't be scored and you won't get a report. You can start a new interview any time."
        cancelLabel="Keep going"
        confirmLabel="End interview"
        onCancel={() => setIsExitModalOpen(false)}
        onConfirm={handleConfirmExit}
        loading={isAbandoning}
      />

      <StudioDialog
        open={environment.fullscreenLost && !screenShare.shareLost && !isExitModalOpen && session.step === "interview"}
        tone="caution"
        icon={<ShieldIcon className="h-5 w-5" />}
        title="Return to fullscreen"
        description="This is a proctored interview, so it runs in fullscreen. Your timer is paused, and the time spent outside fullscreen is recorded for review."
        cancelLabel="Return to fullscreen"
        confirmLabel="End interview"
        onCancel={() => void environment.returnToFullscreen()}
        onConfirm={() => setIsExitModalOpen(true)}
      />

      <StudioDialog
        open={screenShare.shareLost && !isExitModalOpen && session.step === "interview"}
        tone="caution"
        icon={<ShieldIcon className="h-5 w-5" />}
        title="Share your screen again"
        description={SCREEN_SHARE_REQUIRED
          ? "This assessment needs your entire screen shared. Your timer is paused, and the time without sharing is recorded for review."
          : "Screen sharing stopped. Your timer is paused, and the time without sharing is recorded for review. You can continue without it, but the review will note it."}
        cancelLabel="Share screen again"
        confirmLabel={SCREEN_SHARE_REQUIRED ? "End interview" : "Continue without sharing"}
        onCancel={() => void screenShare.reshare()}
        onConfirm={() => (SCREEN_SHARE_REQUIRED ? setIsExitModalOpen(true) : screenShare.continueWithoutShare())}
      />

      <StudioDialog
        open={Boolean(partialShare)}
        tone="caution"
        icon={<ShieldIcon className="h-5 w-5" />}
        title="Share your entire screen"
        description={SCREEN_SHARE_REQUIRED
          ? "You shared a single window or tab. This assessment needs the entire screen: choose \"Entire screen\" in the next prompt."
          : "You shared a single window or tab. Proctored interviews need the entire screen: choose \"Entire screen\" in the next prompt. If you continue with this window, the review will note it."}
        cancelLabel="Share entire screen"
        confirmLabel={SCREEN_SHARE_REQUIRED ? "Cancel" : "Continue with this window"}
        onCancel={handleShareEntireScreen}
        onConfirm={handleKeepPartialShare}
      />

      <StudioDialog
        open={isSkipDialogOpen}
        tone="caution"
        icon={<SkipIcon className="h-5 w-5" />}
        title="Skip this question?"
        description="A skipped question scores zero and you can't come back to it. Your timer is paused while you decide."
        cancelLabel="Keep answering"
        confirmLabel="Skip question"
        onCancel={() => setIsSkipDialogOpen(false)}
        onConfirm={handleConfirmSkip}
      />
    </div>
  );
};

export default AIInterview;

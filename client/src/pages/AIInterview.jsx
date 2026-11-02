import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { History, Mic } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import ConfirmationModal from "@/components/common/modals/ConfirmationModal";
import {
  INTERVIEWER_VOICES,
  SetupStep,
  InterviewStep,
  ResultStep,
  useInterviewSpeech,
  useInterviewRecording,
  useInterviewSession,
  useCameraStream,
  useVideoRecorder,
  useProctoringEngine,
} from "@/components/interview";

const AIInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletContext = useOutletContext();
  const setIsFocusMode = outletContext?.setIsFocusMode;
  const isProduction = import.meta.env.PROD || false;
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

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
  const [selectedVoice, setSelectedVoice] = useState("shubh");
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

  const handlePersonaChange = (voiceKey) => {
    if (INTERVIEWER_VOICES[voiceKey]) {
      setSelectedVoice(voiceKey);
      const voiceMeta = INTERVIEWER_VOICES[voiceKey];
      toast(`Interviewer set to ${voiceMeta.name} (${voiceMeta.gender === "male" ? "Male" : "Female"})`, {
        icon: "🎙️",
      });
    }
  };

  // Ref bridge for circular dependencies between speech, recording & session
  const startRecordingBridgeRef = useRef(null);
  const onVoiceSubmitBridgeRef = useRef(null);
  const setInterviewPhaseBridgeRef = useRef(null);
  const isMutedRef = useRef(false);
  const isInterviewActiveRef = useRef(false);
  const interviewPhaseRef = useRef("idle");
  const hasStartedCameraRef = useRef(false);
  const hasStartedVideoRecRef = useRef(false);

  // 1. Hook for Speech & TTS
  const speech = useInterviewSpeech({
    selectedRole: "", // dynamically handled
    selectedVoice,
    voiceEngine,
    serverTtsAvailable: true,
    voiceAvailable: true,
    selectedMode: "live",
    isMuted: isMutedRef.current,
    isMutedRef,
    isInterviewActiveRef,
    setInterviewPhase: (phase) => setInterviewPhaseBridgeRef.current?.(phase),
    startRecordingRef: startRecordingBridgeRef,
  });

  // 2. Hook for Recording & VAD
  const recording = useInterviewRecording({
    selectedMode: "live",
    getSelectedLanguage: () => session.selectedLanguage,
    isInterviewActiveRef,
    interviewPhase: "idle",
    getInterviewPhase: () => interviewPhaseRef.current,
    setInterviewPhase: (phase) => setInterviewPhaseBridgeRef.current?.(phase),
    isPlayingAudio: speech.isPlayingAudio,
    audioElementRef: speech.audioElementRef,
    stopLocalAudio: speech.stopLocalAudio,
    speakAndListen: speech.speakAndListen,
    onVoiceSubmit: async (blob) => {
      if (onVoiceSubmitBridgeRef.current) {
        await onVoiceSubmitBridgeRef.current(blob);
      }
    },
  });

  startRecordingBridgeRef.current = recording.startRecording;

  // 3. Hook for Session Lifecycle
  const session = useInterviewSession({
    user,
    isProduction,
    voiceEngine,
    setVoiceEngineState,
    selectedVoice,
    speakAndListen: speech.speakAndListen,
    generateIntroduction: speech.generateIntroduction,
    generateAcknowledgment: speech.generateAcknowledgment,
    stopLocalAudio: speech.stopLocalAudio,
    startRecording: recording.startRecording,
    cleanupAudioStreams: recording.cleanupAudioStreams,
    isInterviewActiveRef,
    isMutedRef,
  });

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
    isInterviewActive: session.step === "interview",
    interviewStartTime: session.session?.startedAt
      ? new Date(session.session.startedAt).getTime()
      : null,
  });

  // Auto-start camera once when entering live interview
  useEffect(() => {
    if (session.step === "interview") {
      if (!hasStartedCameraRef.current) {
        hasStartedCameraRef.current = true;
        camera.startCamera();
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
        if (blob && activeSessionId) {
          videoRecorder.uploadSessionVideo(activeSessionId, blob);
        }
      });
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
      setIsFocusMode(session.step === "interview");
    }
    return () => {
      if (typeof setIsFocusMode === "function") {
        setIsFocusMode(false);
      }
    };
  }, [session.step, setIsFocusMode]);

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
          session={session.session}
          currentQuestion={session.currentQuestion}
          selectedMode={session.selectedMode}
          selectedRole={session.selectedRole}
          interviewPhase={session.interviewPhase}
          elapsedTime={session.elapsedTime}
          interviewDuration={session.interviewDuration}
          progress={session.progress}
          isMuted={session.isMuted}
          isRecording={recording.isRecording}
          isPlayingAudio={speech.isPlayingAudio}
          aiMessage={speech.aiMessage}
          answer={session.answer}
          setAnswer={session.setAnswer}
          evaluation={session.evaluation}
          conversationHistory={session.conversationHistory}
          isSubmitting={session.isSubmitting}
          voiceEngine={voiceEngine}
          setVoiceEngine={setVoiceEngine}
          selectedVoice={selectedVoice}
          setSelectedVoice={handlePersonaChange}
          micFrequencyBins={recording.micFrequencyBins}
          liveCandidateTranscript={recording.liveCandidateTranscript}
          bargeInNotice={recording.bargeInNotice}
          isProduction={isProduction}
          theme={theme}
          user={user}
          onToggleTheme={toggleTheme}
          onToggleMute={session.handleToggleMute}
          onSkip={session.handleSkipQuestion}
          onSkipQuestion={session.handleSkipQuestion}
          onRequestRepeat={session.handleRepeatQuestion}
          onAbandon={handleRequestExit}
          onAbandonInterview={handleRequestExit}
          onSubmitAnswer={recording.isRecording ? recording.stopRecording : session.handleSubmitAnswer}
          onStartRecording={() => recording.startRecording(false)}
          onStopRecording={recording.stopRecording}
          formatTime={formatTime}
          cameraVideoRef={camera.attachVideoRef}
          isCameraActive={camera.isCameraActive}
          cameraError={camera.cameraError}
          proctoringState={proctoring.proctoringState}
          activeAlert={proctoring.activeAlert}
          isPhoneInView={proctoring.isPhoneInView}
          onRetryCamera={camera.startCamera}
          audioDevices={recording.audioDevices}
          selectedAudioDeviceId={recording.selectedAudioDeviceId}
          onSwitchAudioDevice={recording.switchAudioDevice}
        />
      ) : (
        <div className="workspace-container py-6 sm:py-8 space-y-8">
          {/* Executive Studio Hero Banner */}
          {session.step === "setup" && (
            <div className="relative overflow-hidden mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 dark:from-[#111218] dark:via-[#0E1017] dark:to-[#141522] border border-blue-200/80 dark:border-white/10 shadow-sm">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Executive AI Mock Interview Studio</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Master Technical & Behavioral Interviews
                  </h1>

                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    Practice realistic interviews with natural voice speech synthesis, live AI proctoring, and comprehensive diagnostic reports tailored to your target engineering roles.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      ⚡ Voice-to-Voice AI
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      🛡️ Vision Proctoring Guard
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      📊 STAR Diagnostic Report
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <Link
                    to="/interview/history"
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs hover:shadow-md active:scale-95 group"
                    id="btn-view-interview-history"
                  >
                    <History className="w-4 h-4 text-blue-500 group-hover:rotate-[-20deg] transition-transform" />
                    <span>Past Interviews & Reports</span>
                    <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Setup */}
          {session.step === "setup" && (
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
              voiceAvailable={session.voiceAvailable}
              ttsAvailable={session.ttsAvailable}
              voiceEngine={voiceEngine}
              setVoiceEngine={setVoiceEngine}
              voiceProviders={session.voiceProviders}
              selectedVoice={selectedVoice}
              setSelectedVoice={handlePersonaChange}
              isProduction={isProduction}
              isSubmitting={session.isSubmitting}
              isTestingVoice={speech.isTestingVoice}
              isPlayingAudio={speech.isPlayingAudio}
              onTestVoice={speech.handleTestVoice}
              onStart={session.handleStartInterview}
              cameraVideoRef={camera.attachVideoRef}
              isCameraActive={camera.isCameraActive}
              cameraError={camera.cameraError}
              isCameraInitializing={camera.isInitializing}
              onStartCamera={camera.startCamera}
              onStopCamera={camera.stopCamera}
              videoDevices={camera.videoDevices}
              selectedDeviceId={camera.selectedDeviceId}
              onSwitchCamera={camera.switchCamera}
              audioDevices={recording.audioDevices}
              selectedAudioDeviceId={recording.selectedAudioDeviceId}
              onSwitchAudioDevice={recording.switchAudioDevice}
              audioInputLevel={recording.audioInputLevel}
              onStartMicPreview={recording.startMicPreview}
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

      {/* End Interview Confirmation Modal Popup */}
      <ConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={handleConfirmExit}
        title="End Interview Session?"
        message="Are you sure you want to exit? Your active live interview will be terminated and unsaved progress will be lost."
        confirmText="Yes, End Interview"
        cancelText="Stay in Interview"
        type="danger"
        loading={isAbandoning}
      />
    </div>
  );
};

export default AIInterview;

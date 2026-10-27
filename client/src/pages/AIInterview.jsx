import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
} from "@/components/interview";

const AIInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Keep phase ref synchronized with session.interviewPhase
  useEffect(() => {
    if (session.interviewPhase) {
      interviewPhaseRef.current = session.interviewPhase;
    }
  }, [session.interviewPhase]);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Switcher: New Interview vs Past Reports */}
        {session.step === "setup" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" />
                AI Mock Interview Studio
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Practice role-specific mock interviews with live speech processing and comprehensive reports.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/interview/history"
                className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                id="btn-view-interview-history"
              >
                <History className="w-4 h-4" />
                <span>Past Interviews & Reports</span>
              </Link>
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
          />
        )}

        {/* Step 2: Live Interview */}
        {session.step === "interview" && (
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
            bargeInNotice={recording.bargeInNotice}
            isProduction={isProduction}
            theme={theme}
            user={user}
            onToggleTheme={toggleTheme}
            onToggleMute={session.handleToggleMute}
            onSkip={session.handleSkipQuestion}
            onSkipQuestion={session.handleSkipQuestion}
            onAbandon={handleRequestExit}
            onAbandonInterview={handleRequestExit}
            onSubmitAnswer={session.handleSubmitAnswer}
            onStartRecording={() => recording.startRecording(false)}
            onStopRecording={recording.stopRecording}
            formatTime={formatTime}
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

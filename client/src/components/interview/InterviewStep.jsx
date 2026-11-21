import React from "react";
import { useDarkMode } from "../../context/DarkModeContext";
import { ExecutiveStudioStage } from "./ExecutiveStudioStage";

// Interview Step Component (Executive Telepresence Studio)
export const InterviewStep = ({
  currentQuestion,
  progress,
  elapsedTime,
  formatTime,
  interviewDuration,
  answer,
  setAnswer,
  evaluation,
  selectedMode,
  selectedRole,
  user,
  isRecording,
  isSubmitting,
  isPlayingAudio,
  isSpeaking,
  voiceEngine = "auto",
  onSetVoiceEngine,
  voiceProviders,
  selectedVoice = "anushka",
  isProduction = false,
  interviewPhase,
  conversationPhase,
  aiMessage,
  isMuted,
  micFrequencyBins = [],
  liveCandidateTranscript = "",
  bargeInNotice = false,
  onToggleMute,
  onSubmitAnswer,
  onStartRecording,
  onStopRecording,
  onSkip,
  onSkipQuestion,
  onAbandon,
  onAbandonInterview,
  onStopAudio,
  onRequestClarification,
  onRequestRepeat,
  // Video & Proctoring props
  cameraVideoRef,
  isCameraActive,
  cameraError,
  proctoringState,
  activeAlert,
  isPhoneInView = false,
  onRetryCamera,
  audioDevices = [],
  selectedAudioDeviceId = "",
  onSwitchAudioDevice,
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const handleEndMeeting = onAbandon || onAbandonInterview;
  const handleSkip = onSkip || onSkipQuestion;

  return (
    <ExecutiveStudioStage
      currentQuestion={currentQuestion}
      elapsedTime={elapsedTime}
      interviewDuration={interviewDuration}
      formatTime={formatTime}
      answer={answer}
      setAnswer={setAnswer}
      selectedVoice={selectedVoice}
      selectedRole={selectedRole}
      isRecording={isRecording}
      isPlayingAudio={isPlayingAudio}
      interviewPhase={interviewPhase}
      aiMessage={aiMessage}
      micFrequencyBins={micFrequencyBins}
      liveCandidateTranscript={liveCandidateTranscript}
      bargeInNotice={bargeInNotice}
      isMuted={isMuted}
      onToggleMute={onToggleMute}
      onSubmitAnswer={onSubmitAnswer}
      onStartRecording={onStartRecording}
      onStopRecording={onStopRecording}
      onSkipQuestion={handleSkip}
      onEndMeeting={handleEndMeeting}
      onRequestRepeat={onRequestRepeat}
      isDarkMode={isDarkMode}
      cameraVideoRef={cameraVideoRef}
      isCameraActive={isCameraActive}
      cameraError={cameraError}
      proctoringState={proctoringState}
      activeAlert={activeAlert}
      isPhoneInView={isPhoneInView}
      onRetryCamera={onRetryCamera}
      audioDevices={audioDevices}
      selectedAudioDeviceId={selectedAudioDeviceId}
      onSwitchAudioDevice={onSwitchAudioDevice}
      userName={user?.name || "Candidate"}
    />
  );
};

export default InterviewStep;

import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import interviewAPI from "@/api/interview.api";
import { resumeAPI } from "@/api/api";
import { CONVERSATION_PHASES } from "../constants";

export function useInterviewSession({
  user,
  isProduction,
  voiceEngine,
  setVoiceEngineState,
  selectedVoice,
  speakAndListen,
  generateIntroduction,
  generateAcknowledgment,
  stopLocalAudio,
  startRecording,
  cleanupAudioStreams,
  isInterviewActiveRef: externalIsInterviewActiveRef,
  isMutedRef: externalIsMutedRef,
}) {
  // Config & options
  const [config, setConfig] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [serverTtsAvailable, setServerTtsAvailable] = useState(false);
  const [voiceProviders, setVoiceProviders] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup form state
  const [step, setStep] = useState("setup"); // 'setup' | 'interview' | 'result'
  const [selectedType, setSelectedType] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("mid");
  const [selectedMode, setSelectedMode] = useState("live");
  const [selectedLanguage, setSelectedLanguage] = useState("unknown");
  const [selectedResume, setSelectedResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewDuration, setInterviewDuration] = useState(10);

  // Live session state
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 10 });
  const [interviewPhase, setInterviewPhase] = useState("idle");
  const [result, setResult] = useState(null);

  // Timer state
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Conversation history
  const [conversationPhase, setConversationPhase] = useState(CONVERSATION_PHASES.IDLE);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);

  // Mute state
  const [isMuted, setIsMuted] = useState(false);
  const internalMutedRef = useRef(false);
  const isMutedRef = externalIsMutedRef || internalMutedRef;

  // Critical refs
  const sessionRef = useRef(null);
  const currentQuestionRef = useRef(null);
  const startTimeRef = useRef(null);
  const internalActiveRef = useRef(false);
  const isInterviewActiveRef = externalIsInterviewActiveRef || internalActiveRef;
  const isCompletingRef = useRef(false);

  const updateSession = (newSession) => {
    setSession(newSession);
    sessionRef.current = newSession;
  };

  const updateCurrentQuestion = (newQuestion) => {
    setCurrentQuestion(newQuestion);
    currentQuestionRef.current = newQuestion;
  };

  // Load initial configs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configRes, resumesRes, voiceRes, ttsRes] = await Promise.all([
          interviewAPI.getInterviewConfig(),
          resumeAPI.list(),
          interviewAPI.checkVoiceAvailability().catch(() => ({ data: { available: false } })),
          interviewAPI.checkTTSAvailability().catch(() => ({ data: { available: false } })),
        ]);

        const configData = configRes.data || configRes;
        const voiceData = voiceRes.data || voiceRes;
        const ttsData = ttsRes.data || ttsRes;

        const isSarvamAvailable = Boolean(
          voiceData?.sarvam_available || ttsData?.providers?.sarvam?.available
        );
        const isWhisperAvailable = Boolean(
          voiceData?.whisper_available || voiceData?.providers?.whisper?.available
        );
        const isChatterboxAvailable = Boolean(
          ttsData?.providers?.chatterbox?.available
        );

        setVoiceProviders({
          sarvam: {
            available: isSarvamAvailable,
            name: "Sarvam AI Cloud",
            desc: "Saaras v3 STT & Bulbul v3 TTS (Ultra-fast, Realistic)",
          },
          whisper: {
            available: isWhisperAvailable,
            name: "Local Whisper STT",
            desc: "Offline speech-to-text service (port 5001)",
          },
          chatterbox: {
            available: isChatterboxAvailable,
            name: "Local Chatterbox TTS",
            desc: "Offline text-to-speech service (port 5002)",
          },
          browser: {
            available: true,
            name: "Browser Speech Synthesis",
            desc: "Client-side fallback speech synthesis",
          },
        });

        if (voiceEngine === "local" && !isWhisperAvailable && isSarvamAvailable) {
          setVoiceEngineState("sarvam");
          localStorage.setItem("ai_interview_voice_engine", "sarvam");
        }

        setConfig(configData);
        setResumes(resumesRes.data?.resumes || []);
        setVoiceAvailable(voiceData?.available || isSarvamAvailable || isWhisperAvailable || false);
        setTtsAvailable(true);
        setServerTtsAvailable(isSarvamAvailable || isChatterboxAvailable || false);

        if (configData?.experienceLevels?.length > 0) {
          setSelectedLevel(configData.experienceLevels[2]?.id || "mid");
        }
      } catch (error) {
        console.error("Failed to load interview config:", error);
        toast.error("Failed to load interview settings");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Timer interval
  useEffect(() => {
    let interval;
    if (step === "interview" && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        const totalDurationSec = interviewDuration * 60;
        const remainingTime = totalDurationSec - elapsed;

        if (remainingTime <= 0 && selectedMode === "live" && conversationPhase !== CONVERSATION_PHASES.COMPLETED) {
          clearInterval(interval);
          setConversationPhase(CONVERSATION_PHASES.COMPLETED);
          const closingMessage =
            "We have reached the end of our allotted time. Thank you so much for your participation! Generating your comprehensive evaluation report now.";
          speakAndListen(closingMessage, async () => {
            setInterviewPhase("idle");
            await handleCompleteInterview();
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, startTime, interviewDuration, selectedMode, conversationPhase]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        stopLocalAudio({ advanceToListening: false });
      }
      return next;
    });
  }, [stopLocalAudio]);

  const handleStartInterview = async () => {
    if (!selectedType) return toast.error("Please select an interview type");
    if (!selectedRole) return toast.error("Please select a role");
    if (selectedType === "resume-based" && !selectedResume) {
      return toast.error("Please select a resume");
    }
    if (selectedType === "job-description" && (!jobDescription || jobDescription.length < 50)) {
      return toast.error("Please enter a job description (at least 50 characters)");
    }

    setIsSubmitting(true);
    try {
      const estimatedQuestions = Math.floor(interviewDuration * 0.8);
      const createRes = await interviewAPI.createSession({
        interviewType: selectedType,
        role: selectedRole,
        experienceLevel: selectedLevel,
        mode: selectedMode,
        resumeId: selectedResume || undefined,
        jobDescription: selectedType === "job-description" ? jobDescription : undefined,
        totalQuestions: Math.max(5, Math.min(15, estimatedQuestions)),
        interviewDuration: interviewDuration,
        voiceEngineUsed: voiceEngine,
        personaUsed: selectedVoice,
        interviewLanguage: selectedLanguage,
      });

      if (!createRes.success) throw new Error(createRes.error || "Failed to create session");

      const startRes = await interviewAPI.startSession(createRes.data.sessionId);
      if (!startRes.success) throw new Error(startRes.error || "Failed to start session");

      const sessionData = { id: createRes.data.sessionId, ...createRes.data };
      updateSession(sessionData);
      updateCurrentQuestion(startRes.data.currentQuestion);
      isInterviewActiveRef.current = true;
      isCompletingRef.current = false;

      setProgress(startRes.data.progress);
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      setStep("interview");
      setQuestionCount(1);

      if (selectedMode === "live") {
        setConversationPhase(CONVERSATION_PHASES.INTRODUCTION);
        setInterviewPhase("greeting");

        const introductionText = generateIntroduction(selectedRole);
        setConversationHistory([
          {
            role: "ai",
            type: "introduction",
            content: introductionText,
            timestamp: Date.now(),
          },
        ]);

        speakAndListen(introductionText, () => {
          setConversationPhase(CONVERSATION_PHASES.WARM_UP);
          setInterviewPhase("waiting");
          // Do not auto-start recording; candidate will click "Record Answer" when ready
        });
      } else {
        setInterviewPhase("greeting");
        toast.success("Interview started! Good luck!");
        setTimeout(() => setInterviewPhase("waiting"), 1500);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedMode === "live") {
      // In live voice mode, response is captured via microphone
      if (!answer.trim()) {
        toast("Click 'Record Answer' to speak your response.", { icon: "🎙️" });
        return;
      }
    }
    if (!answer.trim() || answer.length < 10) {
      return toast.error("Please provide an answer of at least 10 characters");
    }

    setIsSubmitting(true);
    setEvaluation(null);
    setInterviewPhase("processing");

    try {
      const response = await interviewAPI.submitAnswer(session.id, {
        answer: answer.trim(),
        questionNumber: currentQuestion.number,
      });

      if (!response.success) throw new Error(response.error || "Failed to submit answer");

      setEvaluation(response.data.evaluation);
      setProgress(response.data.progress);
      setInterviewPhase("evaluation");

      if (response.data.isComplete) {
        toast.success("Interview complete! Generating your report...");
        setInterviewPhase("idle");
        await handleCompleteInterview();
      } else if (response.data.nextQuestion) {
        const showEvalDuration = selectedMode === "live" ? 2500 : 3000;
        setTimeout(async () => {
          if (selectedMode === "live") {
            const randomAck = generateAcknowledgment();
            setInterviewPhase("transitioning");
            speakAndListen(randomAck, () => {
              updateCurrentQuestion(response.data.nextQuestion);
              setAnswer("");
              setEvaluation(null);
              setInterviewPhase("asking");

              if (response.data.nextQuestion?.text) {
                speakAndListen(response.data.nextQuestion.text, () => {
                  setInterviewPhase("waiting");
                  // Candidate will manually click "Record Answer" when ready
                });
              }
            });
          } else {
            updateCurrentQuestion(response.data.nextQuestion);
            setAnswer("");
            setEvaluation(null);
            setInterviewPhase("waiting");
          }
        }, showEvalDuration);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error(error.message || "Failed to submit answer");
      setInterviewPhase("waiting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceSubmit = async (audioBlob, clientTranscript = "") => {
    if (!isInterviewActiveRef.current) return;
    const currentSession = sessionRef.current;
    const currentQ = currentQuestionRef.current;

    if (!audioBlob || audioBlob.size === 0) {
      if (selectedMode === "live" && isInterviewActiveRef.current) {
        setInterviewPhase("waiting");
      }
      return;
    }

    if (!currentSession?.id) return;

    setIsSubmitting(true);
    setInterviewPhase("processing");

    try {
      const mimeType = audioBlob.type || "audio/webm";
      const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : "webm";
      const audioFile = new File([audioBlob], `answer.${extension}`, { type: mimeType });

      // Warm-up phase
      if (conversationPhase === CONVERSATION_PHASES.WARM_UP && selectedMode === "live") {
        let selfIntroText = "";
        try {
          const transcribeResponse = await interviewAPI.transcribeAudioOnly(audioFile, {
            languageCode: selectedLanguage,
            clientTranscript,
          });
          if (transcribeResponse?.success && transcribeResponse.data?.text) {
            selfIntroText = transcribeResponse.data.text.trim();
          }
        } catch (transcribeErr) {
          console.warn("Warm-up audio transcription warning:", transcribeErr.message);
        }

        // Fallback to client real-time speech transcript if available
        if (!selfIntroText && clientTranscript && clientTranscript.trim().length >= 4) {
          selfIntroText = clientTranscript.trim();
        }

        if (!selfIntroText) {
          console.log("Warm-up intro had no clear speech. Re-prompting candidate gently...");
          const reprompt = "I didn't quite catch that. Could you please tell me a little bit about yourself and your background?";
          setInterviewPhase("asking");
          await speakAndListen(reprompt, () => {
            setInterviewPhase("waiting");
          });
          setIsSubmitting(false);
          return;
        }

        setConversationHistory((prev) => [
          ...prev,
          { role: "user", type: "self-introduction", content: selfIntroText, timestamp: Date.now() },
        ]);

        const warmAcknowledgments = [
          `Great introduction! Let's dive right into your first question.`,
          `Thanks for sharing that background! Let's get started.`,
          `Awesome! Let's jump into the first question for the ${selectedRole} role.`,
        ];
        const randomAck = warmAcknowledgments[Math.floor(Math.random() * warmAcknowledgments.length)];
        const firstQText = currentQ?.text || "Let's start with the first question.";
        const fullIntroSpeech = `${randomAck} ${firstQText}`;

        setConversationPhase(CONVERSATION_PHASES.CORE_INTERVIEW);
        setInterviewPhase("asking");

        setConversationHistory((prev) => [
          ...prev,
          { role: "ai", type: "question", content: fullIntroSpeech, timestamp: Date.now() },
        ]);

        await speakAndListen(fullIntroSpeech, () => {
          setInterviewPhase("waiting");
        });

        setIsSubmitting(false);
        return;
      }

      // Live time check
      const currentStartTime = startTimeRef.current || Date.now();
      const elapsed = Math.floor((Date.now() - currentStartTime) / 1000);
      const totalDurationSec = interviewDuration * 60;
      const remainingTime = totalDurationSec - elapsed;

      if (selectedMode === "live" && (remainingTime <= 10 || elapsed >= totalDurationSec)) {
        const closingMessage =
          "We've reached the end of our allotted time. Thank you so much for your answers today. Generating your evaluation report now.";
        setConversationPhase(CONVERSATION_PHASES.COMPLETED);

        await speakAndListen(closingMessage, async () => {
          setInterviewPhase("idle");
          await handleCompleteInterview();
        });
        setIsSubmitting(false);
        return;
      }

      const response = await interviewAPI.submitVoiceAnswer(
        currentSession.id,
        audioFile,
        currentQ.number,
        { voiceEngine, languageCode: selectedLanguage, clientTranscript }
      );

      if (!response.success) throw new Error(response.error || "Failed to process voice answer");

      const transcribedText = response.data.transcription?.text || "";
      setAnswer(transcribedText);
      setProgress(response.data.progress);
      setQuestionCount((prev) => prev + 1);

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: transcribedText, timestamp: Date.now() },
      ]);

      // Check repeat/clarify requests
      if (selectedMode === "live" && transcribedText) {
        const userText = transcribedText.toLowerCase().trim();
        const wordCount = userText.split(/\s+/).filter(Boolean).length;

        const isExplicitRepeat =
          wordCount < 12 &&
          (userText.startsWith("repeat") ||
            userText.startsWith("can you repeat") ||
            userText.startsWith("please repeat") ||
            userText.startsWith("say that again") ||
            userText.startsWith("what was the question"));

        const isExplicitClarify =
          wordCount < 12 &&
          (userText.startsWith("clarify") ||
            userText.startsWith("can you clarify") ||
            userText.startsWith("what do you mean") ||
            userText.startsWith("i don't understand"));

        if (isExplicitRepeat) {
          const repeatSpeech = `Sure, no problem! Here's the question again: ${currentQ?.text || ""}`;
          setInterviewPhase("asking");
          await speakAndListen(repeatSpeech, () => {
            setInterviewPhase("waiting");
          });
          setIsSubmitting(false);
          return;
        }

        if (isExplicitClarify) {
          const clarifySpeech = `Sure! In simple terms for the ${selectedRole} role: ${currentQ?.text || ""}`;
          setInterviewPhase("asking");
          await speakAndListen(clarifySpeech, () => {
            setInterviewPhase("waiting");
          });
          setIsSubmitting(false);
          return;
        }
      }

      const shouldEndInterview = response.data.isComplete || (remainingTime <= 20 && elapsed >= 60);

      if (shouldEndInterview) {
        const closingMessage =
          "We've covered all our topics for today. Thank you so much for your time and thoughtful responses! Let me generate your detailed report.";
        setConversationPhase(CONVERSATION_PHASES.COMPLETED);

        await speakAndListen(closingMessage, async () => {
          setInterviewPhase("idle");
          await handleCompleteInterview();
        });
      } else if (response.data.nextQuestion) {
        if (selectedMode === "live") {
          const ack = response.data.nextQuestion.acknowledgmentBridge || generateAcknowledgment();
          const nextQText = response.data.nextQuestion.text;
          const fullSpeech = `${ack} ${nextQText}`;

          updateCurrentQuestion(response.data.nextQuestion);
          setAnswer("");
          setEvaluation(null);

          setConversationHistory((prev) => [
            ...prev,
            { role: "ai", type: "question", content: fullSpeech, timestamp: Date.now() },
          ]);

          await speakAndListen(fullSpeech, () => {
            setInterviewPhase("waiting");
          });
        } else {
          setEvaluation(response.data.evaluation);
          setInterviewPhase("evaluation");
          setTimeout(() => {
            updateCurrentQuestion(response.data.nextQuestion);
            setAnswer("");
            setEvaluation(null);
            setInterviewPhase("waiting");
          }, 3000);
        }
      } else {
        await handleCompleteInterview();
      }
    } catch (error) {
      console.error("Failed to submit voice answer:", error);
      toast.error(error.message || "Failed to process voice answer");
      setInterviewPhase("waiting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (!window.confirm("Are you sure you want to skip this question? It will affect your score.")) return;

    const currentSession = sessionRef.current;
    const currentQ = currentQuestionRef.current;
    setIsSubmitting(true);

    try {
      const response = await interviewAPI.skipQuestion(currentSession.id, currentQ.number);
      if (!response.success) throw new Error(response.error || "Failed to skip question");

      setProgress(response.data.progress);

      if (response.data.isComplete) {
        await handleCompleteInterview();
      } else if (response.data.nextQuestion) {
        updateCurrentQuestion(response.data.nextQuestion);
        setAnswer("");
        setEvaluation(null);
        setInterviewPhase("asking");

        if (selectedMode === "live" && response.data.nextQuestion?.text) {
          setTimeout(() => {
            speakAndListen(response.data.nextQuestion.text, () => {
              setInterviewPhase("waiting");
            });
          }, 500);
        } else {
          setTimeout(() => setInterviewPhase("waiting"), 500);
        }
      }
      toast.success("Question skipped");
    } catch (error) {
      console.error("Failed to skip question:", error);
      toast.error(error.message || "Failed to skip question");
      setInterviewPhase("waiting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepeatQuestion = async () => {
    const currentQ = currentQuestionRef.current;
    if (!currentQ?.text || !isInterviewActiveRef.current) return;

    if (cleanupAudioStreams) cleanupAudioStreams();
    setInterviewPhase("asking");
    const repeatSpeech = `Sure! Here is the question again: ${currentQ.text}`;
    await speakAndListen(repeatSpeech, () => {
      setInterviewPhase("waiting");
    });
  };

  const handleCompleteInterview = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    isInterviewActiveRef.current = false;

    const currentSession = sessionRef.current;
    stopLocalAudio();
    cleanupAudioStreams();

    try {
      const response = await interviewAPI.completeSession(currentSession.id);
      if (!response.success) throw new Error(response.error || "Failed to generate report");

      setResult(response.data);
      setStep("result");
      setInterviewPhase("idle");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      toast.error(error.message || "Failed to generate report");
    }
  };

  const handleAbandonInterview = async (skipConfirm = false) => {
    if (!skipConfirm && !window.confirm("Are you sure you want to end this interview? Your progress will be lost.")) return;

    isInterviewActiveRef.current = false;
    const currentSession = sessionRef.current;

    try {
      stopLocalAudio();
      cleanupAudioStreams();

      if (currentSession?.id) {
        await interviewAPI.abandonSession(currentSession.id);
      }

      toast.success("Interview ended");
      setStep("setup");
      setInterviewPhase("idle");
      resetState();
    } catch (error) {
      console.error("Failed to abandon interview:", error);
      toast.error(error.message || "Failed to end interview");
      resetState();
      setStep("setup");
    }
  };

  const resetState = () => {
    stopLocalAudio();
    cleanupAudioStreams();

    startTimeRef.current = null;
    isMutedRef.current = false;

    updateSession(null);
    updateCurrentQuestion(null);
    setAnswer("");
    setEvaluation(null);
    setResult(null);
    setStartTime(null);
    setElapsedTime(0);
    setIsMuted(false);
    setConversationHistory([]);
    setQuestionCount(0);
    setConversationPhase(CONVERSATION_PHASES.IDLE);
  };

  return {
    config,
    resumes,
    voiceAvailable,
    ttsAvailable,
    serverTtsAvailable,
    voiceProviders,
    loading,
    step,
    setStep,
    selectedType,
    setSelectedType,
    selectedRole,
    setSelectedRole,
    selectedLevel,
    setSelectedLevel,
    selectedMode,
    setSelectedMode,
    selectedLanguage,
    setSelectedLanguage,
    selectedResume,
    setSelectedResume,
    jobDescription,
    setJobDescription,
    interviewDuration,
    setInterviewDuration,
    session,
    currentQuestion,
    answer,
    setAnswer,
    isSubmitting,
    evaluation,
    progress,
    interviewPhase,
    setInterviewPhase,
    result,
    startTime,
    elapsedTime,
    conversationPhase,
    conversationHistory,
    questionCount,
    isMuted,
    isMutedRef,
    isInterviewActiveRef,
    sessionRef,
    currentQuestionRef,
    handleToggleMute,
    handleStartInterview,
    handleSubmitAnswer,
    handleVoiceSubmit,
    handleSkipQuestion,
    handleRepeatQuestion,
    handleCompleteInterview,
    handleAbandonInterview,
    resetState,
  };
}

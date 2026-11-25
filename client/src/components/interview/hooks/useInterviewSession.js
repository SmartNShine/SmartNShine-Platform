import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import interviewAPI from "@/api/interview.api";
import { resumeAPI } from "@/api/api";
import { CONVERSATION_PHASES, estimateQuestionCount } from "../constants";
import { VOICE_CLIPS } from "../voiceClips";

// Never open a new question with less time than this left on the clock.
const MIN_SECONDS_FOR_NEXT_QUESTION = 60;

export function useInterviewSession({
  user,
  isProduction,
  voiceEngine,
  setVoiceEngineState,
  selectedVoice,
  speakAndListen,
  speakSegments,
  playFiller,
  preloadClips,
  greetingClip,
  stopLocalAudio,
  cleanupAudioStreams,
  isFinalizingRecordingRef,
  answerWindowOpenRef,
  isInterviewActiveRef: externalIsInterviewActiveRef,
  isMutedRef: externalIsMutedRef,
}) {
  // Config & options
  const [config, setConfig] = useState(null);
  const [access, setAccess] = useState(null);
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
  // "practice" (light-touch) or "proctored" (assessment rules); see security plan §4.
  const [proctoringLevel, setProctoringLevel] = useState("practice");

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
  // Progress the candidate sees: main questions only. Follow-ups continue the
  // same step (and use up one planned slot, so the step total shrinks by one).
  const [questionSteps, setQuestionSteps] = useState({ current: 0, followUps: 0 });
  const lastShownNumberRef = useRef(null);

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
  const turnInFlightRef = useRef(null);
  const isStartingRef = useRef(false);
  const accessRequestRef = useRef(0);

  const updateSession = (newSession) => {
    setSession(newSession);
    sessionRef.current = newSession;
  };

  const updateCurrentQuestion = (newQuestion) => {
    setCurrentQuestion(newQuestion);
    currentQuestionRef.current = newQuestion;
  };

  const refreshAccess = useCallback(async () => {
    const request = ++accessRequestRef.current;
    try {
      const response = await interviewAPI.getAccess();
      if (request === accessRequestRef.current) setAccess(response.data);
    } catch (error) {
      console.warn("Could not refresh interview access:", error.message);
    }
  }, []);

  useEffect(() => {
    if (!user || step === "interview") return;
    void refreshAccess();
    window.addEventListener("focus", refreshAccess);
    return () => {
      accessRequestRef.current += 1;
      window.removeEventListener("focus", refreshAccess);
    };
  }, [user, step, refreshAccess]);

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

  // Grace period: when the clock runs out mid-answer, let the candidate finish
  // that answer (bounded by its own answer timer) before closing the interview.
  useEffect(() => {
    if (step !== "interview" || !startTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      if (elapsed >= interviewDuration * 60 && !isFinalizingRecordingRef.current &&
          !answerWindowOpenRef?.current &&
          !turnInFlightRef.current && isInterviewActiveRef.current) {
        clearInterval(interval);
        void handleCompleteInterview();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step, startTime, interviewDuration, isFinalizingRecordingRef, isInterviewActiveRef]);

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

  // Synchronous so the Start click can check it before opening the screen-share picker.
  const getStartError = () => {
    if (!selectedType) return "Please select an interview type";
    if (!selectedRole) return "Please select a role";
    if (selectedType === "resume-based" && !selectedResume) return "Please select a resume";
    if (selectedType === "job-description" && (!jobDescription || jobDescription.length < 50)) {
      return "Please enter a job description (at least 50 characters)";
    }
    return null;
  };

  /** @param {{ screenShare?: { status: string } }} [options] proctored mode: result of the share request */
  const handleStartInterview = async ({ screenShare } = {}) => {
    if (isStartingRef.current || access?.canStart === false) return false;
    const startError = getStartError();
    if (startError) return toast.error(startError);

    isStartingRef.current = true;
    setIsSubmitting(true);
    try {
      // The server derives the count from interviewDuration; this is a fallback.
      const estimatedQuestions = estimateQuestionCount(interviewDuration, selectedMode);
      const createRes = await interviewAPI.createSession({
        interviewType: selectedType,
        role: selectedRole,
        experienceLevel: selectedLevel,
        mode: selectedMode,
        resumeId: selectedResume || undefined,
        jobDescription: selectedType === "job-description" ? jobDescription : undefined,
        totalQuestions: estimatedQuestions,
        interviewDuration: interviewDuration,
        voiceEngineUsed: voiceEngine,
        personaUsed: selectedVoice,
        interviewLanguage: selectedLanguage,
        proctoringLevel,
        proctoringConsent: { accepted: true },
        screenShare: proctoringLevel === "proctored" ? screenShare : undefined,
      });

      if (!createRes.success) throw new Error(createRes.error || "Failed to create session");

      const startRes = await interviewAPI.startSession(createRes.data.sessionId);
      if (!startRes.success) throw new Error(startRes.error || "Failed to start session");

      const sessionData = {
        id: createRes.data.sessionId,
        ...createRes.data,
        status: startRes.data.status,
        startedAt: startRes.data.startedAt,
      };
      updateSession(sessionData);
      updateCurrentQuestion(startRes.data.currentQuestion);
      isInterviewActiveRef.current = true;
      isCompletingRef.current = false;

      setProgress(startRes.data.progress);
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      setAccess(null);
      setStep("interview");
      setQuestionCount(1);

      if (selectedMode === "live") {
        setConversationPhase(CONVERSATION_PHASES.INTRODUCTION);
        setInterviewPhase("greeting");

        preloadClips();
        const greeting = greetingClip();
        setConversationHistory([
          {
            role: "ai",
            type: "introduction",
            content: VOICE_CLIPS[greeting],
            timestamp: Date.now(),
          },
        ]);

        speakSegments([{ clip: greeting }], () => {
          setConversationPhase(CONVERSATION_PHASES.WARM_UP);
          // Hands over to useInterviewTurnFlow: think time, then auto-recording.
          setInterviewPhase("waiting");
        });
      } else {
        lastShownNumberRef.current = startRes.data.currentQuestion?.number ?? 1;
        setQuestionSteps({ current: 1, followUps: 0 });
        setInterviewPhase("waiting");
      }
      return true;
    } catch (error) {
      const failure = error.response?.data;
      if (failure?.access) {
        accessRequestRef.current += 1;
        setAccess(failure.access);
      } else {
        toast.error(failure?.error || error.message || "Failed to start interview");
      }
      return false;
    } finally {
      isStartingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const beginTurn = () => {
    if (!isInterviewActiveRef.current || turnInFlightRef.current ||
        !sessionRef.current?.id || !currentQuestionRef.current) return null;

    const turn = { sessionId: sessionRef.current.id, question: currentQuestionRef.current };
    turnInFlightRef.current = turn;
    setIsSubmitting(true);
    setInterviewPhase("processing");
    return turn;
  };

  const isCurrentTurn = (turn) => isInterviewActiveRef.current && turnInFlightRef.current === turn;

  const finishTurn = (turn) => {
    if (turnInFlightRef.current === turn) {
      turnInFlightRef.current = null;
      setIsSubmitting(false);
    }
  };

  // leadClip: pre-recorded line to open with when there is no AI reaction.
  const showQuestion = (question, { leadClip } = {}) => {
    if (question.number !== lastShownNumberRef.current) {
      lastShownNumberRef.current = question.number;
      setQuestionSteps((previous) => question.isFollowUp
        ? { ...previous, followUps: previous.followUps + 1 }
        : { ...previous, current: previous.current + 1 });
    }
    updateCurrentQuestion(question);
    setAnswer("");
    setEvaluation(null);
    if (selectedMode === "live") {
      setInterviewPhase("asking");
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "ai",
          type: question.isFollowUp ? "follow-up" : "question",
          content: [question.leadIn, question.text].filter(Boolean).join(" "),
          timestamp: Date.now(),
        },
      ]);
      void speakSegments([
        !question.leadIn && leadClip ? { clip: leadClip } : null,
        question.leadIn ? { text: question.leadIn } : null,
        { text: question.text },
      ], () => setInterviewPhase("waiting"));
    } else {
      setInterviewPhase("waiting");
    }
  };

  const advanceInterview = (data) => {
    setProgress(data.progress);
    const remainingMs = startTimeRef.current
      ? interviewDuration * 60 * 1000 - (Date.now() - startTimeRef.current)
      : Infinity;
    const noTimeForAnotherQuestion = remainingMs < MIN_SECONDS_FOR_NEXT_QUESTION * 1000;
    if (data.isComplete || noTimeForAnotherQuestion) {
      void handleCompleteInterview();
    } else if (data.nextQuestion) {
      setQuestionCount(data.nextQuestion.number);
      showQuestion(data.nextQuestion);
    }
  };

  const showTurnError = (turn, error, fallback) => {
    if (!isCurrentTurn(turn)) return;
    toast.error(error.response?.data?.error || error.message || fallback);
    setInterviewPhase("waiting");
  };

  const handleSubmitAnswer = async (event) => {
    event?.preventDefault();
    const text = answer.trim();
    if (text.length < 10) return toast.error("Please provide an answer of at least 10 characters");
    const turn = beginTurn();
    if (!turn) return;

    try {
      const response = await interviewAPI.submitAnswer(turn.sessionId, {
        answer: text, questionNumber: turn.question.number, turnToken: turn.question.turnToken,
      });
      if (!isCurrentTurn(turn)) return;
      if (!response.success) throw new Error(response.error || "Failed to submit answer");
      advanceInterview(response.data);
    } catch (error) {
      showTurnError(turn, error, "Failed to submit answer");
    } finally {
      finishTurn(turn);
    }
  };

  const handleVoiceSubmit = async (audioBlob, clientTranscript = "", durationSeconds) => {
    if (!audioBlob?.size) return false;
    const turn = beginTurn();
    if (!turn) return false;

    try {
      const mimeType = audioBlob.type || "audio/webm";
      const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const audioFile = new File([audioBlob], `answer.${extension}`, { type: mimeType });

      if (conversationPhase === CONVERSATION_PHASES.WARM_UP && selectedMode === "live") {
        let introduction = clientTranscript.trim();
        if (introduction.length < 4) {
          const response = await interviewAPI.transcribeAudioOnly(audioFile, {
            languageCode: selectedLanguage, durationSeconds,
          });
          introduction = response.data?.text?.trim() || "";
        }
        if (!isCurrentTurn(turn)) return false;
        if (!introduction) throw new Error("No speech was detected. You can retry or record your introduction again.");

        setConversationHistory((prev) => [
          ...prev, { role: "user", type: "self-introduction", content: introduction, timestamp: Date.now() },
        ]);

        // The server re-plans question 1 around the introduction; on failure
        // the original first question is still valid.
        let firstQuestion = turn.question;
        try {
          const response = await interviewAPI.submitIntroduction(turn.sessionId, introduction);
          if (response.success && response.data?.currentQuestion?.number === turn.question.number) {
            firstQuestion = response.data.currentQuestion;
          }
        } catch (error) {
          console.warn("Introduction could not be personalised:", error.message);
        }
        if (!isCurrentTurn(turn)) return false;

        setConversationPhase(CONVERSATION_PHASES.CORE_INTERVIEW);
        showQuestion(firstQuestion, { leadClip: "intro_ack" });
        return true;
      }

      const response = await interviewAPI.submitVoiceAnswer(turn.sessionId, audioFile, turn.question.number, {
        turnToken: turn.question.turnToken,
        voiceEngine, languageCode: selectedLanguage, clientTranscript, durationSeconds,
      });
      if (!isCurrentTurn(turn)) return false;
      if (!response.success) throw new Error(response.error || "Failed to process voice answer");

      const { transcription, questionRequest } = response.data;
      if (transcription?.text) {
        setConversationHistory((prev) => [...prev, { role: "user", content: transcription.text, timestamp: Date.now() }]);
      }
      if (questionRequest) {
        showQuestion(turn.question);
      } else {
        advanceInterview(response.data);
      }
      return true;
    } catch (error) {
      showTurnError(turn, error, "Failed to process voice answer");
      return false;
    } finally {
      finishTurn(turn);
    }
  };

  const handleSkipQuestion = async ({ skipConfirm = false } = {}) => {
    if (turnInFlightRef.current || interviewPhase !== "waiting") return;
    if (!skipConfirm && !window.confirm("Skip this question? It will affect your score.")) return;
    const turn = beginTurn();
    if (!turn) return;

    try {
      const response = await interviewAPI.skipQuestion(turn.sessionId, turn.question.number, turn.question.turnToken);
      if (!isCurrentTurn(turn)) return;
      if (!response.success) throw new Error(response.error || "Failed to skip question");
      advanceInterview(response.data);
      return true;
    } catch (error) {
      showTurnError(turn, error, "Failed to skip question");
    } finally {
      finishTurn(turn);
    }
  };

  const handleRepeatQuestion = () => {
    const question = currentQuestionRef.current;
    if (!question?.text || !isInterviewActiveRef.current || interviewPhase !== "waiting") return;
    setInterviewPhase("asking");
    // Question audio is cached, so a repeat costs no TTS credits.
    void speakAndListen(question.text, () => setInterviewPhase("waiting"));
  };

  const handleCompleteInterview = async () => {
    if (isCompletingRef.current) return;
    if (!sessionRef.current?.id) return;
    isCompletingRef.current = true;
    isInterviewActiveRef.current = false;
    setConversationPhase(CONVERSATION_PHASES.COMPLETED);
    setInterviewPhase("completing");

    const currentSession = sessionRef.current;
    stopLocalAudio();
    cleanupAudioStreams();
    if (selectedMode !== "text") playFiller("closing");

    try {
      const response = await interviewAPI.completeSession(currentSession.id);
      if (!response.success) throw new Error(response.error || "Failed to generate report");

      setResult(response.data);
      setStep("result");
      setInterviewPhase("idle");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to generate report");
      isCompletingRef.current = false;
      setInterviewPhase("report-error");
    }
  };

  const handleAbandonInterview = async (sessionId) => {
    if (!sessionId) return false;
    try {
      await interviewAPI.abandonSession(sessionId);
      isInterviewActiveRef.current = false;
      toast.success("Interview ended");
      setStep("setup");
      setInterviewPhase("idle");
      resetState();
      return true;
    } catch (error) {
      console.error("Failed to abandon interview:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to end interview");
      return false;
    } finally {
      if (step === "setup") void refreshAccess();
    }
  };

  const resetState = () => {
    stopLocalAudio();
    cleanupAudioStreams();

    startTimeRef.current = null;
    turnInFlightRef.current = null;
    isCompletingRef.current = false;
    setIsSubmitting(false);
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
    setQuestionSteps({ current: 0, followUps: 0 });
    lastShownNumberRef.current = null;
    setConversationPhase(CONVERSATION_PHASES.IDLE);
  };

  return {
    config,
    access,
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
    proctoringLevel,
    setProctoringLevel,
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
    questionSteps,
    isMuted,
    isMutedRef,
    isInterviewActiveRef,
    sessionRef,
    currentQuestionRef,
    handleToggleMute,
    handleStartInterview,
    getStartError,
    handleSubmitAnswer,
    handleVoiceSubmit,
    handleSkipQuestion,
    handleRepeatQuestion,
    handleCompleteInterview,
    handleAbandonInterview,
    resetState,
  };
}

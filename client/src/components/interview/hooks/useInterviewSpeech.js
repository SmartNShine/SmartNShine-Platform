import { useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import interviewAPI from "@/api/interview.api";
import { INTERVIEWER_VOICES } from "../constants";

export function useInterviewSpeech({
  selectedRole,
  selectedVoice,
  voiceEngine,
  serverTtsAvailable,
  voiceAvailable,
  selectedMode,
  isMuted,
  isMutedRef,
  isInterviewActiveRef,
  setInterviewPhase,
  startRecordingRef,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [audioRef, setAudioRef] = useState(null);

  const audioElementRef = useRef(null);
  const speechTimeoutsRef = useRef(new Set());
  const speechRunRef = useRef(0);

  const clearSpeechTimeouts = useCallback(() => {
    speechTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    speechTimeoutsRef.current.clear();
  }, []);

  const setManagedSpeechTimeout = useCallback((callback, delay) => {
    const timeoutId = setTimeout(() => {
      speechTimeoutsRef.current.delete(timeoutId);
      callback();
    }, delay);

    speechTimeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  const stopLocalAudio = useCallback(
    ({ advanceToListening = false } = {}) => {
      speechRunRef.current += 1;
      clearSpeechTimeouts();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.src = "";
        audioElementRef.current = null;
      }

      setAudioRef(null);
      setIsPlayingAudio(false);
      setIsSpeaking(false);

      if (advanceToListening && isInterviewActiveRef.current) {
        setInterviewPhase("waiting");
        // User will manually click Record Answer when ready to speak
      }
    },
    [clearSpeechTimeouts, isInterviewActiveRef, selectedMode, setInterviewPhase, setManagedSpeechTimeout, startRecordingRef, voiceAvailable]
  );

  const splitSpeechIntoChunks = useCallback((text) => {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (sentences.length <= 1) return [text];

    const chunks = [];
    let currentChunk = "";

    sentences.forEach((sentence) => {
      const nextChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      if (nextChunk.length > 130 && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk = nextChunk;
      }
    });

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }, []);

  const speakAndListen = useCallback(
    async (text, onComplete) => {
      stopLocalAudio();

      const speechRunId = speechRunRef.current + 1;
      speechRunRef.current = speechRunId;

      const isCurrentSpeech = () =>
        speechRunRef.current === speechRunId;

      const completeSpeech = () => {
        if (speechRunRef.current !== speechRunId) return;
        setIsPlayingAudio(false);
        setIsSpeaking(false);
        if (onComplete) onComplete();
      };

      const playTtsChunk = async (chunkText) => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Voice TTS timeout (> 6.0s)")), 6000)
        );
        const audioBlob = await Promise.race([
          interviewAPI.synthesizeSpeech(chunkText, {
            engine: voiceEngine === "local" ? "local" : "sarvam",
            speaker: selectedVoice || "shubh",
            language: "en-IN",
          }),
          timeoutPromise,
        ]);

        if (!audioBlob || !(audioBlob instanceof Blob) || audioBlob.size === 0) {
          throw new Error("Empty audio response from TTS service");
        }

        if (audioBlob.type && audioBlob.type.includes("json")) {
          throw new Error("TTS service returned non-audio response");
        }

        if (!isCurrentSpeech()) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audioElementRef.current = audio;
        setAudioRef(audio);

        await new Promise((resolve) => {
          let hasResolved = false;
          const finish = () => {
            if (hasResolved) return;
            hasResolved = true;
            clearTimeout(safetyTimer);
            URL.revokeObjectURL(audioUrl);
            if (audioElementRef.current === audio) {
              audioElementRef.current = null;
              setAudioRef(null);
            }
            resolve();
          };

          const wordCount = chunkText.split(/\s+/).filter(Boolean).length;
          const chunkMaxDurationMs = Math.max(4000, (wordCount / 100) * 60 * 1000 + 2500);
          const safetyTimer = setTimeout(finish, chunkMaxDurationMs);

          audio.onplay = () => {
            if (isCurrentSpeech()) {
              setIsPlayingAudio(true);
              setIsSpeaking(true);
              setInterviewPhase("asking");
            }
          };

          audio.onended = finish;
          audio.onerror = (e) => {
            console.warn("⚠️ Audio chunk error, proceeding:", e);
            finish();
          };

          audio.play().catch((playErr) => {
            console.warn("⚠️ Audio autoplay blocked or failed, proceeding:", playErr.message);
            finish();
          });
        });
      };

      const playPipelinedTts = async () => {
        if (text.length <= 450) {
          if (!isCurrentSpeech()) return;
          await playTtsChunk(text);
          completeSpeech();
          return;
        }

        const chunks = splitSpeechIntoChunks(text);
        let nextChunkPromise = interviewAPI.synthesizeSpeech(chunks[0], {
          engine: voiceEngine === "local" ? "local" : "sarvam",
          speaker: selectedVoice || "shubh",
          language: "en-IN",
        });

        for (let i = 0; i < chunks.length; i++) {
          if (!isCurrentSpeech()) return;

          const currentBlob = await nextChunkPromise;

          if (i + 1 < chunks.length) {
            nextChunkPromise = interviewAPI.synthesizeSpeech(chunks[i + 1], {
              engine: voiceEngine === "local" ? "local" : "sarvam",
              speaker: selectedVoice || "shubh",
              language: "en-IN",
            });
          }

          if (!currentBlob || !(currentBlob instanceof Blob) || currentBlob.size === 0 || currentBlob.type?.includes("json")) {
            continue;
          }

          if (!isCurrentSpeech()) return;

          const audioUrl = URL.createObjectURL(currentBlob);
          const audio = new Audio(audioUrl);
          audioElementRef.current = audio;
          setAudioRef(audio);

          await new Promise((resolve, reject) => {
            audio.onplay = () => {
              if (isCurrentSpeech()) {
                setIsPlayingAudio(true);
                setIsSpeaking(true);
                setInterviewPhase("asking");
              }
            };
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              if (audioElementRef.current === audio) {
                audioElementRef.current = null;
                setAudioRef(null);
              }
              resolve();
            };
            audio.onerror = (e) => {
              URL.revokeObjectURL(audioUrl);
              reject(e);
            };
            audio.play().catch(reject);
          });
        }

        completeSpeech();
      };

      setAiMessage(text);

      try {
        if (isMutedRef.current) {
          setIsPlayingAudio(true);
          setIsSpeaking(true);
          setInterviewPhase("asking");
          const wordCount = text.split(" ").length;
          const readingTimeMs = Math.max(3000, (wordCount / 150) * 60 * 1000);
          setManagedSpeechTimeout(completeSpeech, readingTimeMs);
          return;
        }

        try {
          if (voiceEngine !== "browser" && (serverTtsAvailable || voiceEngine === "sarvam" || voiceEngine === "auto")) {
            await playPipelinedTts();
            return;
          }
        } catch (ttsError) {
          console.warn("⚠️ Server TTS failed, falling back to Web Speech:", ttsError.message);
        }

        if ("speechSynthesis" in window) {
          return new Promise((resolve) => {
            try {
              window.speechSynthesis.cancel();
              window.speechSynthesis.resume();
            } catch (_) {}

            const utterance = new SpeechSynthesisUtterance(text);
            let hasCompleted = false;

            const safeDone = () => {
              if (hasCompleted) return;
              hasCompleted = true;
              clearTimeout(safetyTimer);
              if (isCurrentSpeech()) {
                completeSpeech();
              }
              resolve();
            };

            const wordCount = text.split(/\s+/).filter(Boolean).length;
            const maxSpeechTimeMs = Math.max(4000, (wordCount / 120) * 60 * 1000 + 2000);
            const safetyTimer = setTimeout(safeDone, maxSpeechTimeMs);

            utterance.onstart = () => {
              if (isCurrentSpeech()) {
                setIsPlayingAudio(true);
                setIsSpeaking(true);
                setInterviewPhase("asking");
              }
            };

            const voices = window.speechSynthesis.getVoices();
            const personaMeta = INTERVIEWER_VOICES[selectedVoice] || INTERVIEWER_VOICES.shubh;
            const isMale = personaMeta?.gender === "male";
            const preferredVoices = isMale
              ? ["Google UK English Male", "Google US English Male", "Microsoft Guy Online (Natural)", "Microsoft David", "Daniel", "Alex"]
              : ["Google UK English Female", "Google US English Female", "Microsoft Aria Online (Natural)", "Microsoft Zira", "Samantha", "Victoria"];

            let matchedVoice = null;
            for (const pref of preferredVoices) {
              matchedVoice = voices.find((v) => v.name === pref || v.name.includes(pref));
              if (matchedVoice) break;
            }
            if (!matchedVoice) {
              matchedVoice = voices.find((v) => v.lang.startsWith("en-IN")) || voices.find((v) => v.lang.startsWith("en"));
            }

            if (matchedVoice) utterance.voice = matchedVoice;
            utterance.rate = isMale ? 0.95 : 0.98;
            utterance.pitch = isMale ? 0.95 : 1.05;
            utterance.volume = 1.0;

            utterance.onend = safeDone;
            utterance.onerror = safeDone;

            window.speechSynthesis.speak(utterance);
          });
        }

        const wordCount = text.split(" ").length;
        const readingTimeMs = Math.max(3000, (wordCount / 150) * 60 * 1000);
        setManagedSpeechTimeout(completeSpeech, readingTimeMs);
      } catch (error) {
        console.error("❌ TTS speech error:", error);
        setManagedSpeechTimeout(completeSpeech, 4000);
      }
    },
    [isInterviewActiveRef, isMutedRef, selectedMode, selectedVoice, serverTtsAvailable, setInterviewPhase, setManagedSpeechTimeout, splitSpeechIntoChunks, stopLocalAudio, voiceEngine]
  );

  const handleTestVoice = async (preset = "greeting") => {
    if (isTestingVoice || isPlayingAudio) return;

    setIsTestingVoice(true);
    try {
      const samplePhrases = {
        greeting:
          "Hello! I'm your AI interviewer. I'm excited to learn more about your background and experience today.",
        question:
          "Can you tell me about a challenging project you worked on recently and how you approached solving the problems you encountered?",
        acknowledgment:
          "That's a great answer! I really appreciate the detail you provided. It gives me excellent insight into your problem-solving approach.",
        closing:
          "Thank you so much for your time today. You've shared some really valuable insights. We'll be in touch soon with next steps.",
      };

      const testText = samplePhrases[preset] || samplePhrases.greeting;

      try {
        const audioBlob = await interviewAPI.synthesizeSpeech(testText, {
          engine: voiceEngine === "local" ? "local" : "sarvam",
          speaker: selectedVoice || "shubh",
          language: "en-IN",
        });

        if (audioBlob && audioBlob instanceof Blob && audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audioElementRef.current = audio;
          setAudioRef(audio);
          setIsPlayingAudio(true);

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (audioElementRef.current === audio) {
              audioElementRef.current = null;
              setAudioRef(null);
            }
            setIsPlayingAudio(false);
            setIsTestingVoice(false);
            toast.success(`Voice test completed (${INTERVIEWER_VOICES[selectedVoice]?.name || "AI Voice"})!`);
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            if (audioElementRef.current === audio) {
              audioElementRef.current = null;
              setAudioRef(null);
            }
            setIsPlayingAudio(false);
            setIsTestingVoice(false);
            toast.error("Voice synthesis test failed");
          };

          await audio.play();
          toast.success(`Testing ${preset} with ${INTERVIEWER_VOICES[selectedVoice]?.name || "AI"} (Sarvam Bulbul v3)...`);
          return;
        }
      } catch (serverTtsError) {
        console.warn("⚠️ Server TTS test failed, falling back to browser TTS:", serverTtsError.message);
      }

      if (!window.speechSynthesis) {
        throw new Error("Browser TTS not supported");
      }

      const voices = window.speechSynthesis.getVoices();
      const personaMeta = INTERVIEWER_VOICES[selectedVoice] || INTERVIEWER_VOICES.shubh;
      const isMale = personaMeta?.gender === "male";
      const preferredVoices = isMale
        ? ["Google UK English Male", "Google US English Male", "Microsoft Guy Online (Natural)", "Microsoft David", "Daniel", "Alex"]
        : ["Google UK English Female", "Google US English Female", "Microsoft Aria Online (Natural)", "Microsoft Zira", "Samantha", "Victoria"];

      let matchedBrowserVoice = null;
      for (const preferredName of preferredVoices) {
        matchedBrowserVoice = voices.find((v) => v.name === preferredName);
        if (matchedBrowserVoice) break;
      }
      if (!matchedBrowserVoice) {
        matchedBrowserVoice = voices.find((v) => v.lang.startsWith("en-IN")) || voices.find((v) => v.lang.startsWith("en"));
      }

      const utterance = new SpeechSynthesisUtterance(testText);
      if (matchedBrowserVoice) utterance.voice = matchedBrowserVoice;
      utterance.rate = isMale ? 0.92 : 0.96;
      utterance.pitch = isMale ? 0.9 : 1.05;
      utterance.volume = 1.0;

      setIsPlayingAudio(true);
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setIsTestingVoice(false);
        toast.success(`Voice test completed (${personaMeta.name})!`);
      };
      utterance.onerror = (e) => {
        setIsPlayingAudio(false);
        setIsTestingVoice(false);
        toast.error("Voice test failed: " + e.error);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      toast.success(`Testing ${preset} voice with ${personaMeta.name}...`);
    } catch (error) {
      console.error("❌ Voice test failed:", error);
      toast.error(error.message || "Failed to test voice");
      setIsTestingVoice(false);
      setIsPlayingAudio(false);
    }
  };

  const generateIntroduction = useCallback((roleOverride = "") => {
    const role = roleOverride || selectedRole || "your target role";
    const quickIntros = [
      `Hi, welcome! To start, could you give a brief introduction about yourself and your experience in ${role}?`,
      `Hello! Great to meet you. Let's begin with a quick introduction about your background in ${role}.`,
      `Hi there! Welcome to your interview. Tell me a bit about yourself and what you've been working on.`,
    ];
    return quickIntros[Math.floor(Math.random() * quickIntros.length)];
  }, [selectedRole]);

  const generateAcknowledgment = useCallback(() => {
    const neutralTransitions = [
      "Got it. Next up,",
      "Understood. Moving on to the next question,",
      "Noted. Let's look at another area,",
      "Thanks for explaining. Let's shift gears slightly,",
      "Got it. Moving forward to the next scenario,",
      "Understood. For the next question,",
      "Noted. Let's dive into the next topic,",
      "Okay, moving forward,",
    ];
    return neutralTransitions[Math.floor(Math.random() * neutralTransitions.length)];
  }, []);

  return {
    isPlayingAudio,
    setIsPlayingAudio,
    isSpeaking,
    setIsSpeaking,
    isTestingVoice,
    aiMessage,
    setAiMessage,
    audioRef,
    setAudioRef,
    audioElementRef,
    clearSpeechTimeouts,
    setManagedSpeechTimeout,
    stopLocalAudio,
    speakAndListen,
    handleTestVoice,
    generateIntroduction,
    generateAcknowledgment,
  };
}

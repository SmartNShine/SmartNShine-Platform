import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  SILENCE_THRESHOLD,
  SILENCE_DURATION,
  MIN_RECORDING_DURATION,
  EXTENDED_SILENCE_DURATION,
  VOCAL_SPEECH_THRESHOLD,
} from "../constants";
import remoteLogger from "@/utils/remoteLogger";

export function useInterviewRecording({
  selectedMode,
  selectedLanguage = "en-IN",
  getSelectedLanguage,
  isInterviewActiveRef,
  interviewPhase,
  getInterviewPhase,
  setInterviewPhase,
  isPlayingAudio,
  audioElementRef,
  stopLocalAudio,
  speakAndListen,
  onVoiceSubmit,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [micFrequencyBins, setMicFrequencyBins] = useState(new Array(16).fill(3));
  const [bargeInNotice, setBargeInNotice] = useState(false);
  const [liveCandidateTranscript, setLiveCandidateTranscript] = useState("");
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [audioInputLevel, setAudioInputLevel] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceStartRef = useRef(null);
  const streamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const silenceCheckIntervalRef = useRef(null);
  const hasUserSpokenRef = useRef(false);
  const silencePromptCountRef = useRef(0);
  const startRecordingRef = useRef(null);
  const bargeInCountRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const speechConsecutiveFramesRef = useRef(0);
  const speechRecognitionRef = useRef(null);
  const lastTranscriptTimeRef = useRef(0);
  const recorderRef = useRef(null);
  const isRecordingRef = useRef(false);
  const selectedAudioDeviceIdRef = useRef(selectedAudioDeviceId);
  const accumulatedTranscriptRef = useRef("");

  useEffect(() => {
    selectedAudioDeviceIdRef.current = selectedAudioDeviceId;
  }, [selectedAudioDeviceId]);

  // Enumerate connected microphones
  const refreshAudioDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "audioinput");
      setAudioDevices(inputs);
      if (inputs.length > 0 && !selectedAudioDeviceId) {
        setSelectedAudioDeviceId(inputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate audio devices:", err);
    }
  }, [selectedAudioDeviceId]);

  useEffect(() => {
    refreshAudioDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshAudioDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshAudioDevices);
    };
  }, [refreshAudioDevices]);

  // 60fps audio waveform sampling & Barge-In Interruption Detection
  useEffect(() => {
    let isRunning = true;

    const sampleAudioLevels = () => {
      if (!isRunning) return;

      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // 16 responsive frequency bands across the vocal spectrum
        const binCount = 16;
        const binSize = Math.max(1, Math.floor(bufferLength / binCount));
        const levels = [];
        let totalSum = 0;

        for (let i = 0; i < binCount; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += dataArray[i * binSize + j] || 0;
          }
          const avg = sum / binSize;
          totalSum += avg;
          // When quiet, stay close to baseline 3px; when active, expand dynamically up to 52px
          const normalized = avg < 5 ? 3 : Math.max(3, Math.min(52, Math.round((avg / 255) * 48) + 3));
          levels.push(normalized);
        }

        setMicFrequencyBins(levels);

        const avgVol = totalSum / binCount;
        const normalizedVol = Math.min(100, Math.round((avgVol / 40) * 100));
        setAudioInputLevel(normalizedVol);

        const isActuallyPlaying =
          isPlayingAudio &&
          audioElementRef.current &&
          !audioElementRef.current.paused &&
          audioElementRef.current.currentTime > 0.6;

        // Middle frequency vocal energy (human voice range)
        const vocalEnergy = (levels[3] + levels[4] + levels[5] + levels[6] + levels[7] + levels[8]) / 6;

        if (isActuallyPlaying && isInterviewActiveRef.current && selectedMode === "live" && vocalEnergy > 26 && avgVol > 22) {
          bargeInCountRef.current += 1;
          if (bargeInCountRef.current >= 4) {
            console.log("⚡ Barge-in: Candidate interrupted AI speech.");
            bargeInCountRef.current = 0;
            setBargeInNotice(true);
            setTimeout(() => setBargeInNotice(false), 3000);
            stopLocalAudio({ advanceToListening: true });
          }
        } else {
          bargeInCountRef.current = Math.max(0, bargeInCountRef.current - 1);
        }
      } else {
        setMicFrequencyBins(new Array(16).fill(3));
      }

      animFrameIdRef.current = requestAnimationFrame(sampleAudioLevels);
    };

    animFrameIdRef.current = requestAnimationFrame(sampleAudioLevels);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [audioElementRef, isInterviewActiveRef, isPlayingAudio, selectedMode, stopLocalAudio]);

  const handleExtendedSilence = useCallback(async () => {
    if (selectedMode !== "live" || !isInterviewActiveRef.current) return;

    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }

    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }

    const promptCount = silencePromptCountRef.current;
    silencePromptCountRef.current = promptCount + 1;

    const prompts = [
      "Hey, are you still there? Take your time if you need to think about it!",
      "No rush at all! Let me know if you'd like me to clarify or repeat anything.",
      "Take all the time you need. If you'd like, we can move forward whenever you're ready.",
    ];

    const silenceResponse = prompts[Math.min(promptCount, prompts.length - 1)];
    setInterviewPhase("transitioning");

    await speakAndListen(silenceResponse, () => {
      hasUserSpokenRef.current = false;
      setInterviewPhase("waiting");
    });
  }, [isInterviewActiveRef, mediaRecorder, selectedMode, setInterviewPhase, speakAndListen]);

  const checkSilence = (recorder) => {
    if (!isInterviewActiveRef.current || !analyserRef.current || !recorder || recorder.state !== "recording") {
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const binCount = 8;
    const binSize = Math.max(1, Math.floor(dataArray.length / binCount));
    let vocalSum = 0;
    for (let i = 2; i <= 5; i++) {
      let bandSum = 0;
      for (let j = 0; j < binSize; j++) {
        bandSum += dataArray[i * binSize + j] || 0;
      }
      vocalSum += bandSum / binSize;
    }
    const vocalEnergy = vocalSum / 4;

    const now = Date.now();
    const recordingDuration = now - (recordingStartTimeRef.current || now);

    // Hard safety cap: never exceed 25 seconds to guarantee staying under Sarvam AI 30s limit
    if (recordingDuration >= 25000) {
      console.log("⏱️ Max recording duration (25s) reached. Submitting response to stay under audio limit...");
      remoteLogger.warn("AUDIO_RECORDER", "Safety cap reached: 25s max recording duration reached. Auto-submitting turn.");
      stopRecording();
      return;
    }

    if (recordingDuration < MIN_RECORDING_DURATION) return;

    // Detect if user is actively vocalizing or live speech recognition is receiving text
    const isVocalizing = vocalEnergy > VOCAL_SPEECH_THRESHOLD || average > SILENCE_THRESHOLD;
    const isTranscribing = Date.now() - lastTranscriptTimeRef.current < 4000;
    const isUserTalking = isVocalizing || isTranscribing;

    if (isUserTalking) {
      speechConsecutiveFramesRef.current += 1;
      const hasLiveWords = liveCandidateTranscript.trim().length >= 4;
      // Require either recognized speech text OR 8 consecutive frames of vocal presence (~800ms) to confirm valid speech
      if (!hasUserSpokenRef.current && (hasLiveWords || speechConsecutiveFramesRef.current >= 8)) {
        hasUserSpokenRef.current = true;
        console.log("🗣️ User speech activity confirmed with valid content.");
      }
      silenceStartRef.current = null;
    } else {
      speechConsecutiveFramesRef.current = 0;
      if (hasUserSpokenRef.current) {
        const words = liveCandidateTranscript.trim().split(/\s+/).filter(Boolean);
        // Candidate has manual control with "Done Recording & Submit".
        // Never cut them off during normal thinking pauses; only fallback after 14s of total inactivity.
        if (words.length >= 3) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = now;
          } else if (now - silenceStartRef.current >= 14000) {
            console.log(`🎤 Extended silence (14s) after spoken answer. Auto-submitting response...`);
            stopRecording();
            return;
          }
        } else {
          silenceStartRef.current = null;
        }
      } else {
        // User hasn't started speaking yet
        if (recordingDuration >= EXTENDED_SILENCE_DURATION) {
          console.log("⏳ Extended silence: user hasn't spoken.");
          handleExtendedSilence();
          return;
        }
      }
    }
  };

  const startMicPreview = useCallback(async () => {
    try {
      if (streamRef.current && streamRef.current.active) return streamRef.current;
      const deviceId = selectedAudioDeviceIdRef.current;
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && (!audioContextRef.current || audioContextRef.current.state === "closed")) {
          audioContextRef.current = new AudioCtx();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
        }
      } catch (err) {
        console.warn("AudioContext setup warning in preview:", err);
      }

      await refreshAudioDevices();
      return stream;
    } catch (err) {
      console.warn("Microphone preview error:", err);
      return null;
    }
  }, [refreshAudioDevices]);

  const switchAudioDevice = useCallback(
    async (deviceId) => {
      setSelectedAudioDeviceId(deviceId);
      selectedAudioDeviceIdRef.current = deviceId;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (isRecordingRef.current) {
        stopRecording();
        setTimeout(() => {
          if (isInterviewActiveRef.current) {
            startRecording(true);
          }
        }, 400);
      } else {
        startMicPreview();
      }
    },
    [isInterviewActiveRef, startMicPreview]
  );

  const startRecording = async (autoStart = false) => {
    if (!isInterviewActiveRef.current) return;

    const currentPhase = getInterviewPhase ? getInterviewPhase() : interviewPhase;
    if (currentPhase !== "waiting" && !autoStart) {
      if (currentPhase === "asking") {
        toast("Please wait for the question to finish", { icon: "⏳" });
      }
      return;
    }

    try {
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        const preferredDeviceId = selectedAudioDeviceIdRef.current || selectedAudioDeviceId;
        const audioConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(preferredDeviceId ? { deviceId: { ideal: preferredDeviceId } } : {}),
          },
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        } catch (constraintErr) {
          console.warn("⚠️ Audio constraint failed, falling back to default mic:", constraintErr.message);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        streamRef.current = stream;

        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            audioContextRef.current = new AudioCtx();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
          }
        } catch (audioCtxError) {
          console.warn("AudioContext setup warning:", audioCtxError.message);
        }

        silenceStartRef.current = null;
        hasUserSpokenRef.current = false;
      }

      silenceStartRef.current = null;
      recordingStartTimeRef.current = Date.now();
      hasUserSpokenRef.current = false;
      accumulatedTranscriptRef.current = "";
      setLiveCandidateTranscript("");

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      // Start Web Speech API live recognition for immediate live captions if supported
      try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          if (speechRecognitionRef.current) {
            try { speechRecognitionRef.current.stop(); } catch (_) {}
          }
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          const chosenLang = getSelectedLanguage ? getSelectedLanguage() : selectedLanguage;
          const speechLang =
            chosenLang && chosenLang !== "unknown"
              ? chosenLang
              : "en-IN";
          recognition.lang = speechLang;

          recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                accumulatedTranscriptRef.current += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const liveText = (accumulatedTranscriptRef.current + interim).trim();
            if (liveText) {
              setLiveCandidateTranscript(liveText);
              hasUserSpokenRef.current = true;
              lastTranscriptTimeRef.current = Date.now();
              silenceStartRef.current = null;
            }
          };

          recognition.onerror = (e) => {
            console.warn("Live speech recognition notice:", e.error);
          };

          // Continuous auto-restart on Chrome pauses so transcription never dies mid-sentence
          recognition.onend = () => {
            if (isRecordingRef.current && speechRecognitionRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        }
      } catch (sttErr) {
        console.warn("Could not initiate live SpeechRecognition:", sttErr);
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        isRecordingRef.current = false;
        if (silenceCheckIntervalRef.current) {
          clearInterval(silenceCheckIntervalRef.current);
          silenceCheckIntervalRef.current = null;
        }
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch (_) {}
          speechRecognitionRef.current = null;
        }
        setIsRecording(false);

        const blob = new Blob(chunks, { type: mimeType });
        remoteLogger.info("AUDIO_RECORDER", `Voice clip finalized: ${blob.size} bytes (${mimeType})`, {
          bytes: blob.size,
          mimeType,
          transcriptWords: liveCandidateTranscript.trim().split(/\s+/).filter(Boolean).length,
        });
        if (selectedMode !== "live") {
          stream.getTracks().forEach((track) => track.stop());
        }

        if (blob.size === 0) {
          toast.error("No audio recorded. Please try again.");
          const currentPhase = getInterviewPhase ? getInterviewPhase() : interviewPhase;
          if (selectedMode === "live" && currentPhase === "waiting") {
            setTimeout(() => startRecording(true), 500);
          }
          return;
        }

        if (onVoiceSubmit) {
          await onVoiceSubmit(blob, liveCandidateTranscript);
        }
      };

      recorderRef.current = recorder;
      setMediaRecorder(recorder);
      lastTranscriptTimeRef.current = 0;
      setAudioChunks(chunks);
      recorder.start(1000);
      isRecordingRef.current = true;
      setIsRecording(true);

      if (selectedMode === "live") {
        silenceCheckIntervalRef.current = setInterval(() => {
          if (!isInterviewActiveRef.current) {
            clearInterval(silenceCheckIntervalRef.current);
            silenceCheckIntervalRef.current = null;
            return;
          }
          checkSilence(recorder);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Microphone access denied or not available");
    }
  };

  startRecordingRef.current = startRecording;

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (_) {}
      speechRecognitionRef.current = null;
    }

    const rec = recorderRef.current || mediaRecorder;
    if (rec && rec.state === "recording") {
      rec.stop();
      setIsRecording(false);
    }
  };

  const cleanupAudioStreams = () => {
    isRecordingRef.current = false;
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (_) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (_) {}
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setIsRecording(false);
    setLiveCandidateTranscript("");
  };

  return {
    isRecording,
    setIsRecording,
    mediaRecorder,
    audioChunks,
    micFrequencyBins,
    bargeInNotice,
    liveCandidateTranscript,
    setLiveCandidateTranscript,
    startRecording,
    stopRecording,
    startRecordingRef,
    hasUserSpokenRef,
    silencePromptCountRef,
    cleanupAudioStreams,
    audioDevices,
    selectedAudioDeviceId,
    setSelectedAudioDeviceId,
    switchAudioDevice,
    refreshAudioDevices,
    audioInputLevel,
    startMicPreview,
  };
}

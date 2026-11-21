import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sun,
  Moon,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import { ExecutiveStudioStage } from "@/components/interview/ExecutiveStudioStage";

export default function InterviewPreviewPage() {
  // Playground state controls
  const [phase, setPhase] = useState("waiting"); // "asking" | "waiting" | "processing"
  const [topicIdx, setTopicIdx] = useState(0);
  const [candidateLiveTranscript, setCandidateLiveTranscript] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Real Microphone & Audio Analysis
  const [isLiveMicActive, setIsLiveMicActive] = useState(false);
  const [micFrequencyBins, setMicFrequencyBins] = useState(new Array(16).fill(3));
  const [bargeInNotice, setBargeInNotice] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const speechRecRef = useRef(null);
  const bargeInCountRef = useRef(0);

  // Toggle Physical Microphone with Live STT and 16-Band Frequency Analyser
  const toggleLiveMic = async () => {
    if (isLiveMicActive) {
      if (speechRecRef.current) {
        try { speechRecRef.current.stop(); } catch (_) {}
        speechRecRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setIsLiveMicActive(false);
      setMicFrequencyBins(new Array(16).fill(3));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        // Start Web Speech API live captions if available
        try {
          const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRec) {
            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "en-US";
            let transcriptBuf = "";

            rec.onresult = (e) => {
              let interim = "";
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                  transcriptBuf += e.results[i][0].transcript + " ";
                } else {
                  interim += e.results[i][0].transcript;
                }
              }
              const liveText = (transcriptBuf + interim).trim();
              if (liveText) {
                setCandidateLiveTranscript(liveText);
              }
            };
            rec.onerror = (e) => console.warn("Live STT notice:", e.error);
            rec.start();
            speechRecRef.current = rec;
          }
        } catch (sttErr) {
          console.warn("Speech recognition error:", sttErr);
        }

        setIsLiveMicActive(true);
        setPhase("waiting");
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone permission was denied or is unavailable.");
      }
    }
  };

  // Continuous 60fps sampling loop for visualizer
  useEffect(() => {
    let isRunning = true;

    const sampleAudio = () => {
      if (!isRunning) return;

      if (analyserRef.current && isLiveMicActive) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // 16 vocal frequency bands
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
          // Clean dynamic scaling: baseline 3px when quiet, jumps up to 54px as user speaks
          const normalized = avg < 6 ? 3 : Math.max(3, Math.min(54, Math.round((avg / 255) * 50) + 3));
          levels.push(normalized);
        }

        setMicFrequencyBins(levels);

        // Barge-in detection in asking phase
        const avgVol = totalSum / binCount;
        const vocalEnergy = (levels[3] + levels[4] + levels[5] + levels[6]) / 4;
        if (phase === "asking" && vocalEnergy > 24 && avgVol > 20) {
          bargeInCountRef.current += 1;
          if (bargeInCountRef.current >= 4) {
            bargeInCountRef.current = 0;
            setBargeInNotice(true);
            setTimeout(() => setBargeInNotice(false), 2500);
            setPhase("waiting");
          }
        } else {
          bargeInCountRef.current = Math.max(0, bargeInCountRef.current - 1);
        }
      } else if (!isLiveMicActive) {
        // If not connected to real mic, display quiet baseline or subtle active state
        if (phase === "waiting") {
          setMicFrequencyBins([4, 6, 8, 12, 16, 22, 18, 14, 10, 8, 6, 4, 3, 3, 3, 3]);
        } else {
          setMicFrequencyBins(new Array(16).fill(3));
        }
      }

      animFrameIdRef.current = requestAnimationFrame(sampleAudio);
    };

    animFrameIdRef.current = requestAnimationFrame(sampleAudio);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isLiveMicActive, phase]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (speechRecRef.current) {
        try { speechRecRef.current.stop(); } catch (_) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const sampleQuestions = [
    {
      type: "System Architecture",
      text: "Could you walk me through the architecture of a high-traffic system you designed, and how you handled database scaling, caching, and state management?",
    },
    {
      type: "Concurrency & Real-time Sync",
      text: "How would you design a real-time collaborative document editor supporting thousands of concurrent users with WebSocket synchronization?",
    },
    {
      type: "Incident Post-Mortem",
      text: "Tell me about a high-severity production outage you navigated. How did you triage root cause under pressure, and what safeguards did you put in place?",
    },
  ];

  const currentQ = sampleQuestions[topicIdx];

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* MINIMAL PLAYGROUND CONTROLLER (Monochrome & Neutral) */}
      <div className="bg-[#0D0F15] border-b border-white/[0.08] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            UI Playground
          </span>
          <span className="text-xs text-neutral-500 hidden sm:inline">
            Connect your physical mic to test live captions and frequency reaction
          </span>
        </div>

        {/* Phase Simulation Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Simulation:</span>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setPhase("asking")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                phase === "asking"
                  ? "bg-neutral-200 text-neutral-900 font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              AI Speaking
            </button>
            <button
              onClick={() => setPhase("waiting")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                phase === "waiting"
                  ? "bg-emerald-500 text-black font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Candidate Speaking
            </button>
            <button
              onClick={() => setPhase("processing")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                phase === "processing"
                  ? "bg-neutral-200 text-neutral-900 font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Processing
            </button>
          </div>
        </div>

        {/* Real Mic Toggle & Topic Cycler */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLiveMic}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiveMicActive
                ? "bg-emerald-500 text-black border-emerald-400 font-semibold shadow-sm"
                : "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-neutral-200"
            }`}
            title="Connect physical microphone"
          >
            {isLiveMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{isLiveMicActive ? "Live Mic Connected (Speak!)" : "Test Real Mic"}</span>
          </button>

          <button
            onClick={() => setTopicIdx((prev) => (prev + 1) % sampleQuestions.length)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-neutral-300 transition-all cursor-pointer"
            title="Next Topic"
          >
            Next Scenario
          </button>
        </div>
      </div>

      {/* RENDER THE CLEAN MINIMAL STUDIO STAGE */}
      <ExecutiveStudioStage
        currentQuestion={{
          text: currentQ.text,
          type: currentQ.type,
        }}
        elapsedTime={180}
        interviewDuration={15}
        formatTime={formatTime}
        answer={candidateLiveTranscript}
        setAnswer={setCandidateLiveTranscript}
        selectedRole="Full Stack Technical Assessment"
        isRecording={isLiveMicActive || phase === "waiting"}
        isPlayingAudio={phase === "asking"}
        interviewPhase={phase}
        aiMessage={currentQ.text}
        micFrequencyBins={micFrequencyBins}
        liveCandidateTranscript={candidateLiveTranscript}
        bargeInNotice={bargeInNotice}
        isMuted={false}
        onToggleMute={toggleLiveMic}
        onSubmitAnswer={() => setPhase("processing")}
        onStartRecording={() => {
          if (!isLiveMicActive) toggleLiveMic();
          setPhase("waiting");
        }}
        onStopRecording={() => setPhase("processing")}
        onSkipQuestion={() => setTopicIdx((prev) => (prev + 1) % sampleQuestions.length)}
        onEndMeeting={() => alert("End meeting invoked")}
        onRequestRepeat={() => alert(`Repeating: "${currentQ.text}"`)}
      />
    </div>
  );
}

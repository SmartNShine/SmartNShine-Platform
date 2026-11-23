import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Volume2,
  Play,
  Pause,
  Square,
  Mic,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
  Sparkles,
  User,
} from "lucide-react";

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "literally",
  "sort of",
  "kind of",
  "actually",
  "honestly",
];

// Novelty and legacy robotic voices to strictly exclude
const ROBOTIC_VOICE_BLACKLIST = [
  "fred",
  "ralph",
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "good news",
  "hysterical",
  "pipe organ",
  "trinoids",
  "whisper",
  "zarvox",
  "junior",
  "princess",
  "kathy",
  "organ",
  "grandma",
  "grandpa",
  "jester",
  "reed",
  "rocko",
  "sandy",
  "shelley",
  "superstar",
  "wobble",
  "eddy",
  "flo",
  "daniel",
];

// Clean text for speech synthesis (remove markdown formatting & symbols)
function cleanSpeechText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/•/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Split text into natural sentences for human-like conversational cadence
function splitIntoSentences(text) {
  if (!text) return [];
  const matched = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g);
  return (matched || [text]).map((s) => s.trim()).filter(Boolean);
}

// Format clean display name for top 4 voices without emojis
function formatTopVoiceLabel(voice) {
  const name = voice.name.toLowerCase();
  if (name.includes("samantha") || name.includes("google us") || name.includes("jenny")) {
    return "Samantha — Warm & Natural";
  }
  if (name.includes("karen") || name.includes("ava") || name.includes("moira") || name.includes("tessa")) {
    return "Karen — Articulate Recruiter";
  }
  if (name.includes("alex") || name.includes("oliver")) {
    return "Alex — Executive Male";
  }
  if (name.includes("rishi") || name.includes("guy") || name.includes("tom")) {
    return "Rishi — Conversational Male";
  }
  const clean = voice.name.replace(/(Google|Microsoft|Apple|Desktop|English|\(United States\)|\(United Kingdom\))/gi, "").trim() || voice.name;
  return clean;
}

export default function QAVoicePractice({ answerText = "", questionText = "" }) {
  // TTS States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.96);
  const [naturalVoices, setNaturalVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const synthRef = useRef(null);
  const sentencesQueueRef = useRef([]);
  const currentSentenceIdxRef = useRef(0);
  const isCancelledRef = useRef(false);

  // STT / Voice Practice States
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Speech Synthesis and filter for STRICTLY TOP 4 natural voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;

      const loadAndRankVoices = () => {
        const allVoices = synthRef.current.getVoices();
        if (!allVoices || allVoices.length === 0) return;

        // 1. Filter English voices and exclude robotic / novelty voices
        const filtered = allVoices.filter((v) => {
          const nameLower = v.name.toLowerCase();
          const isEnglish = v.lang.startsWith("en");
          const isRobotic = ROBOTIC_VOICE_BLACKLIST.some((rv) => nameLower.includes(rv));
          return isEnglish && !isRobotic;
        });

        // 2. Score and rank voices by natural quality
        const ranked = filtered.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();

          const score = (name, voice) => {
            let s = 0;
            if (name.includes("samantha")) s += 100;
            if (name.includes("google") && name.includes("us english")) s += 95;
            if (name.includes("karen")) s += 90;
            if (name.includes("alex")) s += 85;
            if (name.includes("rishi")) s += 80;
            if (name.includes("moira")) s += 75;
            if (name.includes("ava") || name.includes("siri")) s += 70;
            if (name.includes("natural") || name.includes("online")) s += 65;
            if (voice.default) s += 10;
            return s;
          };

          return score(bName, b) - score(aName, a);
        });

        // Strictly take TOP 4 best voices
        const top4Voices = (ranked.length > 0 ? ranked : allVoices).slice(0, 4);
        setNaturalVoices(top4Voices);

        // Auto-select the #1 voice
        if (top4Voices.length > 0 && !selectedVoiceURI) {
          setSelectedVoiceURI(top4Voices[0].voiceURI);
        }
      };

      loadAndRankVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadAndRankVoices;
      }
    }

    return () => {
      stopTTS();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Stop playback cleanly if answer changes
  useEffect(() => {
    stopTTS();
    setAnalysisResult(null);
    setTranscript("");
  }, [answerText]);

  // -------------------------------------------------------------
  // FREE NATURAL TEXT-TO-SPEECH
  // -------------------------------------------------------------
  const playNextSentence = () => {
    if (!synthRef.current || isCancelledRef.current) return;

    if (currentSentenceIdxRef.current >= sentencesQueueRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    const sentence = sentencesQueueRef.current[currentSentenceIdxRef.current];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = speechRate;
    utterance.pitch = 1.02;

    if (selectedVoiceURI && naturalVoices.length > 0) {
      const v = naturalVoices.find((voice) => voice.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    utterance.onend = () => {
      if (isCancelledRef.current) return;
      currentSentenceIdxRef.current += 1;
      setTimeout(() => {
        playNextSentence();
      }, 100);
    };

    utterance.onerror = (e) => {
      console.warn("Speech error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
  };

  const handlePlayTTS = () => {
    if (!synthRef.current) {
      toast.error("Text-to-Speech is not supported in this browser");
      return;
    }

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    stopTTS();
    isCancelledRef.current = false;

    const cleaned = cleanSpeechText(answerText);
    if (!cleaned) {
      toast.error("No answer text to read aloud");
      return;
    }

    const sentences = splitIntoSentences(cleaned);
    sentencesQueueRef.current = sentences;
    currentSentenceIdxRef.current = 0;

    setIsPlaying(true);
    setIsPaused(false);
    playNextSentence();
  };

  const handlePauseTTS = () => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopTTS = () => {
    isCancelledRef.current = true;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT & PRACTICE MODE
  // -------------------------------------------------------------
  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in this browser. Try Google Chrome or Edge.");
      return;
    }

    stopTTS();
    setTranscript("");
    setAnalysisResult(null);
    setRecordingSeconds(0);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + " ";
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access was denied. Please allow mic permissions in your browser.");
        stopRecording();
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started. Speak your answer clearly.");
    } catch (err) {
      toast.error("Failed to start microphone recording");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);

    analyzeSpeech(transcript, recordingSeconds);
  };

  const analyzeSpeech = (spokenText, durationSec) => {
    if (!spokenText.trim() || durationSec < 3) {
      toast("Answer too short for detailed voice analysis. Try speaking for at least 10 seconds.");
      return;
    }

    const words = spokenText.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Calculate WPM (Words Per Minute)
    const minutes = Math.max(durationSec / 60, 0.1);
    const wpm = Math.round(wordCount / minutes);

    let paceAssessment = "Optimal (130-160 WPM)";
    let paceScore = 95;
    if (wpm < 100) {
      paceAssessment = "Slightly Slow (<100 WPM) - Add more energy and momentum";
      paceScore = 75;
    } else if (wpm > 175) {
      paceAssessment = "Too Fast (>175 WPM) - Pause between thoughts to let points sink in";
      paceScore = 70;
    }

    // 2. Count Filler Words
    let fillerCount = 0;
    const detectedFillers = {};
    FILLER_WORDS.forEach((fw) => {
      const regex = new RegExp(`\\b${fw}\\b`, "gi");
      const matches = spokenText.match(regex);
      if (matches) {
        fillerCount += matches.length;
        detectedFillers[fw] = matches.length;
      }
    });

    const fillerScore = Math.max(100 - fillerCount * 8, 40);

    // 3. Keyword / Concept Coverage against Model Answer
    const modelWords = answerText.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const uniqueModelWords = Array.from(new Set(modelWords));
    let matchedKeywords = 0;
    uniqueModelWords.forEach((kw) => {
      if (spokenText.toLowerCase().includes(kw)) {
        matchedKeywords++;
      }
    });
    const coverageRatio = uniqueModelWords.length > 0 ? matchedKeywords / uniqueModelWords.length : 0.8;
    const coverageScore = Math.min(Math.round(coverageRatio * 100) + 20, 100);

    // 4. Overall Delivery Score
    const overallScore = Math.round(paceScore * 0.35 + fillerScore * 0.35 + coverageScore * 0.30);

    setAnalysisResult({
      wpm,
      paceAssessment,
      durationSec,
      wordCount,
      fillerCount,
      detectedFillers,
      coverageScore,
      overallScore,
    });

    toast.success(`Voice Practice Analyzed: ${overallScore}% Delivery Score`);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/40 p-4 sm:p-5 space-y-4">
      {/* Header Bar with Top 4 Natural Voice Selector & Speed */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Voice Studio & Audio Coach</span>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Free
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">
              Listen to model answer delivery or record your spoken answer for pacing feedback.
            </p>
          </div>
        </div>

        {/* Top 4 Natural Voice Selector & Speed Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Top 4 Voice Dropdown */}
          {naturalVoices.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase hidden sm:inline">
                Voice:
              </span>
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  if (isPlaying) stopTTS();
                }}
                className="py-1 px-2.5 rounded-lg bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-800 text-[11px] font-medium focus:outline-none max-w-[230px] shadow-2xs cursor-pointer"
              >
                {naturalVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {formatTopVoiceLabel(v)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Speed Buttons */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-950 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-2xs">
            {[0.85, 0.96, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setSpeechRate(rate);
                  if (isPlaying) stopTTS();
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  speechRate === rate
                    ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                    : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {rate === 0.96 ? "1.0x" : `${rate}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dual Action Controllers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        {/* ACTION 1: LISTEN TO MODEL ANSWER */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-gray-500" />
              Listen to Model Answer
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Playing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 my-1">
            {!isPlaying ? (
              <button
                onClick={handlePlayTTS}
                disabled={!answerText.trim()}
                className="flex-1 py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-40 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>{isPaused ? "Resume Audio" : "Play Natural Delivery"}</span>
              </button>
            ) : (
              <button
                onClick={handlePauseTTS}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Audio</span>
              </button>
            )}

            {(isPlaying || isPaused) && (
              <button
                onClick={stopTTS}
                className="py-2 px-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                title="Stop audio"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>

          {/* Stable Fixed-Height Audio Indicator */}
          <div className="h-3 flex items-center justify-center gap-1">
            {isPlaying ? (
              [0.3, 0.9, 0.5, 1.0, 0.7, 0.85, 0.4, 0.75].map((scale, i) => (
                <motion.span
                  key={i}
                  animate={{ transform: [`scaleY(0.2)`, `scaleY(${scale})`, `scaleY(0.2)`] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.07, ease: "easeInOut" }}
                  className="w-1 h-3 bg-emerald-500 rounded-full inline-block origin-center"
                />
              ))
            ) : (
              <span className="text-[10px] text-gray-400 font-medium">Click to hear delivery</span>
            )}
          </div>
        </div>

        {/* ACTION 2: RECORD & PRACTICE (SPEECH TO TEXT) */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-gray-500" />
              Practice Spoken Delivery
            </span>
            {isRecording && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                {formatTime(recordingSeconds)}
              </span>
            )}
          </div>

          <div className="my-1">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-full py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Record Yourself Speaking</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Finish & Analyze Delivery</span>
              </button>
            )}
          </div>

          <div className="h-3 flex items-center justify-center">
            {isRecording ? (
              <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                Listening... Speak your answer
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium">
                Pacing & filler word diagnostic
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Transcript Preview while recording */}
      {isRecording && transcript && (
        <div className="p-3 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-1">
          <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            Live Speech Transcript:
          </span>
          <p className="text-xs text-gray-800 dark:text-zinc-200 leading-relaxed font-sans italic">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Instant AI Speech Diagnostics & Feedback Score */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Voice Delivery Diagnostic
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                <span className="text-xs text-gray-500">Score:</span>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                  {analysisResult.overallScore}%
                </span>
              </div>
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Metric 1: Pacing & WPM */}
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                  <span>Pacing & Speed</span>
                  <Activity className="w-3 h-3 text-zinc-400" />
                </div>
                <div className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                  {analysisResult.wpm} WPM
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  {analysisResult.paceAssessment}
                </p>
              </div>

              {/* Metric 2: Filler Words */}
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                  <span>Filler Words</span>
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                </div>
                <div
                  className={`text-sm font-extrabold font-mono ${
                    analysisResult.fillerCount === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {analysisResult.fillerCount} detected
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  {analysisResult.fillerCount === 0
                    ? "Crisp, confident delivery with zero fillers! ✓"
                    : `Caught: ${Object.keys(analysisResult.detectedFillers).join(", ")}`}
                </p>
              </div>

              {/* Metric 3: Content Match */}
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                  <span>Key Points Match</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                  {analysisResult.coverageScore}%
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Covered core achievements and engineering context.
                </p>
              </div>
            </div>

            {/* Transcript Quote */}
            {transcript && (
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950 text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed italic border border-gray-100 dark:border-zinc-800">
                <span className="font-bold not-italic text-gray-700 dark:text-zinc-300">
                  Your spoken transcript:
                </span>{" "}
                "{transcript.trim()}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

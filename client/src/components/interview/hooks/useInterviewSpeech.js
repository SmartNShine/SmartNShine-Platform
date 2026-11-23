import { connectVoiceActivity, primeVoiceActivity } from "../voiceActivity";
import { useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import interviewAPI from "@/api/interview.api";
import { INTERVIEWER_VOICES } from "../constants";
import { CLIP_GROUPS, VOICE_CLIPS, clipUrl, pickClip } from "../voiceClips";

const TTS_CACHE_LIMIT = 12;
const FILLER_WAIT_CAP_MS = 4000;
// Human pacing: a breath after the acknowledgment and between reaction and question.
const PAUSE_AFTER_FILLER_MS = 450;
const PAUSE_BETWEEN_SEGMENTS_MS = 280;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Interviewer speech.
 * - Fixed lines (greeting, acknowledgments, closing) play from pre-recorded clips.
 * - Dynamic lines (reaction + question) use server TTS, fetched in parallel and
 *   cached so "Repeat" never pays for the same audio twice.
 * - Browser Web Speech is the last fallback.
 * Fillers ("Okay, thank you.") play on their own channel while an answer is
 * processed, and the next question waits for them to finish instead of cutting in.
 */
export function useInterviewSpeech({
  selectedVoice,
  voiceEngine,
  serverTtsAvailable,
  isMutedRef,
  isInterviewActiveRef,
  setInterviewPhase,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFillerPlaying, setIsFillerPlaying] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const audioElementRef = useRef(null);
  const fillerRef = useRef(null);
  const fillerTimerRef = useRef(null);
  const speechRunRef = useRef(0);
  const ttsCacheRef = useRef(new Map());
  const lastAckRef = useRef(null);

  const persona = INTERVIEWER_VOICES[selectedVoice] || INTERVIEWER_VOICES.shubh;
  const voiceId = persona.id;

  const stopFiller = useCallback(() => {
    clearTimeout(fillerTimerRef.current);
    fillerTimerRef.current = null;
    const filler = fillerRef.current;
    fillerRef.current = null;
    if (filler) {
      filler.audio.pause();
      filler.audio.src = "";
      filler.done();
    }
    setIsFillerPlaying(false);
  }, []);

  const stopMainAudio = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
  }, []);

  const stopLocalAudio = useCallback(
    ({ advanceToListening = false } = {}) => {
      speechRunRef.current += 1;
      stopMainAudio();
      stopFiller();
      if (advanceToListening && isInterviewActiveRef.current) setInterviewPhase("waiting");
    },
    [isInterviewActiveRef, setInterviewPhase, stopFiller, stopMainAudio]
  );

  const fetchTts = useCallback(async (text) => {
    const key = `${voiceId}:${text}`;
    const cache = ttsCacheRef.current;
    if (cache.has(key)) return cache.get(key);

    const request = interviewAPI.synthesizeSpeech(text, {
      engine: voiceEngine === "local" ? "local" : "sarvam",
      speaker: voiceId,
      language: "en-IN",
    }).then((blob) => {
      if (!(blob instanceof Blob) || !blob.size || blob.type?.includes("json")) {
        throw new Error("TTS service returned no audio");
      }
      return blob;
    });
    cache.set(key, request);
    request.catch(() => cache.delete(key));
    if (cache.size > TTS_CACHE_LIMIT) cache.delete(cache.keys().next().value);
    return request;
  }, [voiceEngine, voiceId]);

  const playSource = useCallback((src, isCurrent) => new Promise((resolve, reject) => {
    if (!isCurrent()) return resolve();
    const audio = new Audio(src);
    audioElementRef.current = audio;
    connectVoiceActivity(audio); // drives the interviewer orb
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      if (audioElementRef.current === audio) audioElementRef.current = null;
      if (error) reject(error); else resolve();
    };
    // Never let a stalled element block the interview.
    const safetyTimer = setTimeout(() => finish(), 60000);
    audio.onplay = () => {
      if (!isCurrent()) return;
      setIsPlayingAudio(true);
      setInterviewPhase("asking");
    };
    audio.onended = () => finish();
    audio.onerror = () => finish(new Error("Audio playback failed"));
    audio.onpause = () => { if (!isCurrent()) finish(); };
    audio.play().catch(finish);
  }), [setInterviewPhase]);

  const speakWithBrowser = useCallback((text, isCurrent) => new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !isCurrent()) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = ["Google UK English Male", "Microsoft Guy Online (Natural)", "Microsoft David", "Daniel", "Alex"];
    utterance.voice = preferred.map((name) => voices.find((voice) => voice.name.includes(name))).find(Boolean) ||
      voices.find((voice) => voice.lang.startsWith("en-IN")) || voices.find((voice) => voice.lang.startsWith("en")) || null;
    utterance.rate = 0.95;
    const words = text.split(/\s+/).length;
    const safetyTimer = setTimeout(resolve, Math.max(4000, (words / 120) * 60000 + 2000));
    const done = () => { clearTimeout(safetyTimer); resolve(); };
    utterance.onstart = () => {
      if (!isCurrent()) return;
      setIsPlayingAudio(true);
      setInterviewPhase("asking");
    };
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  }), [setInterviewPhase]);

  /**
   * Speak segments in order. Segment: { clip: clipId } | { text: string }.
   * All server audio is requested up front so segment 2 is ready when 1 ends.
   */
  const speakSegments = useCallback(async (segments, onComplete) => {
    const runId = ++speechRunRef.current;
    const isCurrent = () => speechRunRef.current === runId;
    stopMainAudio();

    const useServerTts = voiceEngine !== "browser" && (serverTtsAvailable || voiceEngine === "sarvam" || voiceEngine === "auto");
    const parts = segments.filter((segment) => segment && (segment.clip || segment.text?.trim()));
    const pending = parts.map((segment) => {
      if (segment.clip || !useServerTts) return null;
      const request = fetchTts(segment.text.trim());
      request.catch(() => {});
      return request;
    });

    try {
      if (isMutedRef.current) return;
      // A filler still waiting for its natural pause is dropped; one already
      // playing finishes, followed by a short breath.
      clearTimeout(fillerTimerRef.current);
      fillerTimerRef.current = null;
      if (fillerRef.current) {
        await Promise.race([fillerRef.current.ended, wait(FILLER_WAIT_CAP_MS)]);
        if (isCurrent()) await wait(PAUSE_AFTER_FILLER_MS);
      }
      if (!isCurrent()) return;
      stopFiller();

      for (let index = 0; index < parts.length && isCurrent(); index++) {
        const segment = parts[index];
        if (index > 0) await wait(PAUSE_BETWEEN_SEGMENTS_MS);
        if (!isCurrent()) break;
        const fallbackText = segment.clip ? VOICE_CLIPS[segment.clip] : segment.text;
        try {
          if (segment.clip) {
            await playSource(clipUrl(segment.clip, voiceId), isCurrent);
            continue;
          }
          if (!pending[index]) throw new Error("Server TTS disabled");
          const blob = await pending[index];
          const url = URL.createObjectURL(blob);
          try {
            await playSource(url, isCurrent);
          } finally {
            URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.warn("Interviewer audio fell back to browser speech:", error.message);
          await speakWithBrowser(fallbackText, isCurrent);
        }
      }
    } finally {
      if (isCurrent()) {
        setIsPlayingAudio(false);
        onComplete?.();
      }
    }
  }, [fetchTts, isMutedRef, playSource, serverTtsAvailable, speakWithBrowser, stopFiller, stopMainAudio, voiceEngine, voiceId]);

  const speakAndListen = useCallback(
    (text, onComplete, { leadIn = "" } = {}) =>
      speakSegments([leadIn ? { text: leadIn } : null, { text }], onComplete),
    [speakSegments]
  );

  const startFillerAudio = useCallback((clipId) => {
    const audio = new Audio(clipUrl(clipId, voiceId));
    connectVoiceActivity(audio);
    let done;
    const ended = new Promise((resolve) => { done = resolve; });
    const filler = { audio, ended, done };
    fillerRef.current = filler;
    const finish = () => {
      done();
      if (fillerRef.current === filler) {
        fillerRef.current = null;
        setIsFillerPlaying(false);
      }
    };
    audio.onended = finish;
    audio.onerror = finish;
    setIsFillerPlaying(true);
    audio.play().catch(finish);
  }, [voiceId]);

  /**
   * Short pre-recorded line that never takes the interview phase.
   * delayMs: natural pause before speaking; cancelled if the next line arrives first.
   */
  const playFiller = useCallback((clipOrGroup, { delayMs = 0 } = {}) => {
    if (isMutedRef.current) return;
    const clipId = CLIP_GROUPS[clipOrGroup] ? pickClip(clipOrGroup, lastAckRef.current) : clipOrGroup;
    if (!VOICE_CLIPS[clipId]) return;
    lastAckRef.current = clipId;
    stopFiller();
    if (delayMs > 0) {
      fillerTimerRef.current = setTimeout(() => {
        fillerTimerRef.current = null;
        startFillerAudio(clipId);
      }, delayMs);
      return;
    }
    startFillerAudio(clipId);
  }, [isMutedRef, stopFiller, startFillerAudio]);

  const preloadClips = useCallback(() => {
    Object.keys(VOICE_CLIPS).forEach((clipId) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = clipUrl(clipId, voiceId);
    });
  }, [voiceId]);

  /** Opening line: a pre-recorded greeting that already asks for an introduction. */
  const greetingClip = useCallback(() => pickClip("greeting"), []);

  const handleTestVoice = async () => {
    if (isTestingVoice || isPlayingAudio) return;
    primeVoiceActivity(); // inside the click: allows the orb to follow the voice
    setIsTestingVoice(true);
    try {
      await speakSegments([{ clip: "voice_sample" }]);
    } catch (error) {
      toast.error(error.message || "Failed to test voice");
    } finally {
      setIsTestingVoice(false);
    }
  };

  return {
    isPlayingAudio,
    isFillerPlaying,
    isTestingVoice,
    stopLocalAudio,
    speakAndListen,
    speakSegments,
    playFiller,
    preloadClips,
    greetingClip,
    handleTestVoice,
  };
}

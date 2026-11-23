import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const quietBins = new Array(16).fill(3);
const audioFormats = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function useInterviewRecording({
  getSelectedLanguage,
  getInterviewPhase,
  isInterviewActiveRef,
  onVoiceSubmit,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordingDraft, setHasRecordingDraft] = useState(false);
  const [liveCandidateTranscript, setLiveCandidateTranscript] = useState("");
  const [micFrequencyBins, setMicFrequencyBins] = useState(quietBins);
  const [audioInputLevel, setAudioInputLevel] = useState(0);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const deviceIdRef = useRef("");
  const streamRef = useRef(null);
  const micRequestRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const captureRef = useRef(null);
  const startingRef = useRef(false);
  const isFinalizingRef = useRef(false);
  const submittingRef = useRef(false);
  const draftRef = useRef(null);
  const voiceSubmitRef = useRef(onVoiceSubmit);
  voiceSubmitRef.current = onVoiceSubmit;

  const refreshAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const inputs = devices?.filter((device) => device.kind === "audioinput") || [];
      setAudioDevices(inputs);
      if (!deviceIdRef.current && inputs[0]?.deviceId) {
        deviceIdRef.current = inputs[0].deviceId;
        setSelectedAudioDeviceId(deviceIdRef.current);
      }
    } catch (error) {
      console.warn("Could not enumerate microphones:", error);
    }
  }, []);

  useEffect(() => {
    void refreshAudioDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshAudioDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshAudioDevices);
  }, [refreshAudioDevices]);

  useEffect(() => {
    const timer = setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const bandSize = data.length / quietBins.length;
      const bands = quietBins.map((_, index) => {
        const values = data.subarray(index * bandSize, (index + 1) * bandSize);
        return values.reduce((sum, value) => sum + value, 0) / bandSize;
      });
      setAudioInputLevel(Math.min(100, Math.round(bands.reduce((sum, value) => sum + value, 0) / 6.4)));
      if (captureRef.current) {
        setMicFrequencyBins(bands.map((value) => value < 5 ? 3 : Math.round(3 + value * 48 / 255)));
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const releaseMicrophone = useCallback(() => {
    micRequestRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioInputLevel(0);
  }, []);

  const startMicPreview = useCallback(async () => {
    if (streamRef.current?.active) return streamRef.current;
    if (micRequestRef.current) return micRequestRef.current;
    if (!navigator.mediaDevices?.getUserMedia) return null;
    const deviceId = deviceIdRef.current;
    const request = navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
      },
    }).then((stream) => {
      if (micRequestRef.current !== request) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }
      streamRef.current = stream;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          audioContextRef.current.createMediaStreamSource(stream).connect(analyserRef.current);
        }
      } catch (error) {
        console.warn("Could not initialize microphone levels:", error);
      }
      void refreshAudioDevices();
      return stream;
    }).catch((error) => {
      console.warn("Microphone access failed:", error);
      return null;
    }).finally(() => {
      if (micRequestRef.current === request) micRequestRef.current = null;
    });
    micRequestRef.current = request;
    return request;
  }, [refreshAudioDevices]);

  const switchAudioDevice = useCallback(async (deviceId) => {
    if (captureRef.current || startingRef.current) return;
    deviceIdRef.current = deviceId;
    setSelectedAudioDeviceId(deviceId);
    releaseMicrophone();
    await startMicPreview();
  }, [releaseMicrophone, startMicPreview]);

  const submitDraft = async () => {
    const draft = draftRef.current;
    if (!draft || submittingRef.current || !isInterviewActiveRef.current) return;
    submittingRef.current = true;
    try {
      const accepted = await voiceSubmitRef.current(draft.blob, draft.transcript, draft.durationSeconds);
      if (accepted && draftRef.current === draft) {
        draftRef.current = null;
        setHasRecordingDraft(false);
        setLiveCandidateTranscript("");
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const startRecording = async () => {
    if (!isInterviewActiveRef.current || getInterviewPhase() !== "waiting" ||
        captureRef.current || startingRef.current || submittingRef.current) return false;
    startingRef.current = true;
    try {
      const stream = await startMicPreview();
      if (!stream || !isInterviewActiveRef.current || getInterviewPhase() !== "waiting") {
        if (!stream && isInterviewActiveRef.current) toast.error("Microphone access is unavailable.");
        return false;
      }

      const mimeType = audioFormats.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 48000, ...(mimeType ? { mimeType } : {}) });
      const capture = {
        recorder, startedAt: Date.now(), chunks: [], transcript: "", submitOnStop: false,
      };
      recorder.ondataavailable = ({ data }) => {
        if (data.size) capture.chunks.push(data);
      };
      recorder.onstop = () => {
        if (captureRef.current !== capture) return;
        captureRef.current = null;
        isFinalizingRef.current = false;
        stopRecognition(capture);
        setIsRecording(false);
        setMicFrequencyBins(quietBins);
        const blob = new Blob(capture.chunks, { type: recorder.mimeType || mimeType || capture.chunks[0]?.type });
        if (!blob.size) {
          toast.error("No audio recorded. Please try again.");
          return;
        }

        draftRef.current = {
          blob,
          transcript: capture.transcript,
          durationSeconds: (Date.now() - capture.startedAt) / 1000,
        };
        setHasRecordingDraft(true);
        if (capture.submitOnStop) void submitDraft();
      };

      recorder.start(1000);
      captureRef.current = capture;
      draftRef.current = null;
      setHasRecordingDraft(false);
      setLiveCandidateTranscript("");
      setIsRecording(true);
      startRecognition(capture);
      return true;
    } catch (error) {
      console.error("Could not start recording:", error);
      toast.error("Could not start recording. Check your microphone access.");
      return false;
    } finally {
      startingRef.current = false;
    }
  };

  function startRecognition(capture) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    const language = getSelectedLanguage();
    recognition.lang = language && language !== "unknown" ? language : "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    let completedText = "";
    let mayRestart = true;
    recognition.onresult = (event) => {
      if (captureRef.current !== capture) return;
      const currentText = Array.from(event.results, (result) => result[0].transcript).join(" ").trim();
      capture.transcript = [completedText, currentText].filter(Boolean).join(" ");
      setLiveCandidateTranscript(capture.transcript);
    };
    recognition.onerror = ({ error }) => {
      if (error !== "no-speech") mayRestart = false;
    };
    recognition.onend = () => {
      if (!mayRestart || captureRef.current !== capture || capture.recorder.state !== "recording") return;
      completedText = capture.transcript;
      try { recognition.start(); } catch { /* Audio recording continues independently. */ }
    };
    capture.recognition = recognition;
    try { recognition.start(); } catch { /* The server can transcribe the audio. */ }
  }

  function stopRecognition(capture) {
    if (!capture.recognition) return;
    capture.recognition.onend = null;
    capture.recognition.onresult = null;
    try { capture.recognition.stop(); } catch { /* Recognition may already have stopped. */ }
  }

  const submitRecording = () => {
    const capture = captureRef.current;
    if (capture?.recorder.state === "recording") {
      capture.submitOnStop = true;
      isFinalizingRef.current = true;
      capture.recorder.stop();
    } else if (!capture) {
      void submitDraft();
    }
  };

  const discardDraft = () => {
    draftRef.current = null;
    setHasRecordingDraft(false);
    setLiveCandidateTranscript("");
  };

  // Abort an in-progress capture without submitting it; the mic stays open.
  const cancelRecording = () => {
    const capture = captureRef.current;
    captureRef.current = null;
    isFinalizingRef.current = false;
    if (capture) {
      stopRecognition(capture);
      if (capture.recorder.state === "recording") capture.recorder.stop();
    }
    discardDraft();
    setIsRecording(false);
    setMicFrequencyBins(quietBins);
  };

  const cleanupAudioStreams = () => {
    const capture = captureRef.current;
    captureRef.current = null;
    isFinalizingRef.current = false;
    if (capture) {
      stopRecognition(capture);
      if (capture.recorder.state === "recording") capture.recorder.stop();
    }
    discardDraft();
    releaseMicrophone();
    setIsRecording(false);
    setMicFrequencyBins(quietBins);
  };

  return {
    isRecording, hasRecordingDraft, micFrequencyBins, liveCandidateTranscript, isFinalizingRef,
    startRecording, submitRecording, cancelRecording, discardDraft, cleanupAudioStreams,
    audioDevices, selectedAudioDeviceId, switchAudioDevice, audioInputLevel, startMicPreview,
  };
}

import { useState, useRef, useEffect, useCallback } from "react";
import { recordProctoringEvent, sendProctoringHeartbeat } from "@/api/interview.api";
import toast from "react-hot-toast";
import { getFaceLandmarker, getObjectDetector } from "@/lib/vision/visionModels";
import { extractHeadPose, extractGazeFromBlendshapes, isAttentionDiverted } from "@/lib/vision/gazeCalculator";
import { TemporalEvidence, CandidateContinuity, faceDescriptor, DETECTOR_VERSION } from "../proctoring/temporalEvidence";
import remoteLogger from "@/utils/remoteLogger";

const DETAILS = {
  PHONE_DETECTED: "Mobile phone detected. Remove it from the camera view.",
  MULTIPLE_FACES: "Only the candidate may be visible. Another person was detected.",
  FACE_ABSENT: "Please remain visible and keep the camera unobstructed.",
  IDENTITY_SWITCH: "Candidate continuity changed. Please remain alone and clearly visible.",
  GAZE_DEVIATION: "Please look directly at the interview screen.",
};
const SEVERE = new Set(["PHONE_DETECTED", "MULTIPLE_FACES", "IDENTITY_SWITCH"]);

export function useProctoringEngine({ videoRef, sessionId, isInterviewActive, interviewStartTime, onViolation }) {
  const [proctoringState, setProctoringState] = useState({ status: "initializing", message: "Initializing AI integrity guard...", integrityScore: 100, flagsCount: 0 });
  const [activeAlert, setActiveAlert] = useState(null);
  const [isPhoneInView, setIsPhoneInView] = useState(false);
  const [recentViolations, setRecentViolations] = useState([]);
  const [stabilizedEvents, setStabilizedEvents] = useState([]);
  const landmarkerRef = useRef(null);
  const detectorRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const alertTimerRef = useRef(null);
  const lastLoggedRef = useRef({});
  const healthRef = useRef({ faceAt: 0, objectAt: 0 });
  const evidenceRef = useRef(new TemporalEvidence());
  const continuityRef = useRef(new CandidateContinuity());
  const runtimeRef = useRef({});
  const startedAtRef = useRef(Date.now());
  // Keep animation/heartbeat loops stable across transcript and score renders.
  runtimeRef.current = { sessionId, isInterviewActive, interviewStartTime, onViolation };

  const applySummary = useCallback((summary) => {
    if (!summary) return;
    setProctoringState((previous) => {
      const flagsCount = Object.values(summary.flagCounts || {}).reduce((sum, count) => sum + count, 0);
      if (flagsCount < previous.flagsCount) return previous;
      return {
        ...previous,
        status: summary.verdict === "FLAGGED_SUSPICIOUS" ? "critical" : summary.verdict === "REVIEW_RECOMMENDED" ? "warning" : "active",
        message: summary.verdict === "VERIFIED_CLEAN" ? "Visual proctoring active" : "Interview integrity events recorded for review.",
        integrityScore: summary.integrityScore,
        flagsCount,
      };
    });
  }, []);

  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
      return canvas.toDataURL("image/webp", 0.6);
    } catch { return null; }
  }, [videoRef]);

  const logViolation = useCallback(async (evidence) => {
    const runtime = runtimeRef.current;
    if (!runtime.isInterviewActive) return;
    const { eventType } = evidence;
    const now = Date.now();
    if (now - (lastLoggedRef.current[eventType] || 0) < 3500) return;
    lastLoggedRef.current[eventType] = now;
    const severity = evidence.severity || (SEVERE.has(eventType) ? "high" : eventType === "GAZE_DEVIATION" ? "low" : "medium");
    const payload = {
      confidence: 1, durationMs: 0, evidenceCount: 0, faceCount: null,
      detectorVersion: DETECTOR_VERSION, meta: {}, ...evidence, severity,
      details: evidence.details || DETAILS[eventType] || "Integrity event recorded",
      timestampSeconds: Math.max(0, Math.round((now - (runtime.interviewStartTime || startedAtRef.current)) / 1000)),
      snapshotData: SEVERE.has(eventType) ? captureSnapshot() : null,
    };
    setActiveAlert(payload);
    clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setActiveAlert(null), 6000);
    setProctoringState((previous) => ({ ...previous, status: severity === "high" ? "critical" : "warning", message: payload.details }));
    if (severity === "high") toast.error(payload.details, { id: `proctor-${eventType}`, duration: 4000 });
    else toast(payload.details, { id: `proctor-${eventType}`, duration: 4000 });
    runtime.onViolation?.(payload);
    remoteLogger.proctor(runtime.sessionId, eventType, payload.details, { severity, confidence: payload.confidence, durationMs: payload.durationMs });
    setRecentViolations((previous) => [{ ...payload, snapshotData: undefined, timeString: new Date().toLocaleTimeString() }, ...previous.slice(0, 9)]);
    if (!runtime.sessionId) return;
    try {
      const response = await recordProctoringEvent(runtime.sessionId, payload);
      if (runtimeRef.current.sessionId === runtime.sessionId && runtimeRef.current.isInterviewActive && response.success) applySummary(response.data.summary);
    } catch (error) {
      console.warn("Failed to transmit proctoring event:", error.message);
      setProctoringState((previous) => ({ ...previous, status: "warning", message: "Proctoring connection interrupted. Check your network." }));
    }
  }, [applySummary, captureSnapshot]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFaceLandmarker(), getObjectDetector()]).then(([face, object]) => {
      if (cancelled) return;
      landmarkerRef.current = face;
      detectorRef.current = object;
      setProctoringState((previous) => ({ ...previous, status: "initializing", message: "Waiting for camera analysis..." }));
    }).catch((error) => {
      console.warn("Vision proctoring unavailable:", error.message);
      if (!cancelled) setProctoringState((previous) => ({ ...previous, status: "warning", message: "Visual proctoring unavailable. Reload to retry." }));
    });
    return () => { cancelled = true; clearTimeout(alertTimerRef.current); };
  }, []);

  useEffect(() => {
    startedAtRef.current = Date.now();
    evidenceRef.current = new TemporalEvidence();
    continuityRef.current = new CandidateContinuity();
    healthRef.current = { faceAt: 0, objectAt: 0 };
    lastLoggedRef.current = {};
    clearTimeout(alertTimerRef.current);
    setActiveAlert(null);
    setIsPhoneInView(false);
    setRecentViolations([]);
    setStabilizedEvents([]);
    setProctoringState({ status: "initializing", message: "Waiting for camera analysis...", integrityScore: 100, flagsCount: 0 });
  }, [sessionId]);

  useEffect(() => {
    if (!isInterviewActive) return;
    let frameId;
    let lastFaceAt = 0;
    let lastObjectAt = 0;
    let lastVideoTime = -1;
    let lastStateSyncAt = 0;
    const observe = (eventType, sample) => {
      const event = evidenceRef.current.observe(eventType, sample);
      if (event) void logViolation(event);
    };
    const processFrame = () => {
      const now = performance.now();
      const video = videoRef.current;
      const track = video?.srcObject?.getVideoTracks?.()[0];
      const cameraReady = video?.readyState >= 2 && !video.paused && !video.ended && track?.readyState === "live" && track.enabled && !track.muted;
      // A frozen video must not keep the heartbeat healthy or accumulate evidence.
      if (cameraReady && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        if (landmarkerRef.current && now - lastFaceAt >= 200) {
          lastFaceAt = now;
          try {
            if (!analysisCanvasRef.current) {
              analysisCanvasRef.current = document.createElement("canvas");
              analysisCanvasRef.current.width = 320;
              analysisCanvasRef.current.height = 240;
            }
            const canvas = analysisCanvasRef.current;
            canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
            const results = landmarkerRef.current.detectForVideo(canvas, now);
            healthRef.current.faceAt = Date.now();
            const faces = results.faceLandmarks || [];
            healthRef.current.faceCount = faces.length;
            const common = { now, faceCount: faces.length, confidence: 0.8 };
            observe("MULTIPLE_FACES", { ...common, present: faces.length > 1 });
            observe("FACE_ABSENT", { ...common, present: faces.length === 0 });
            const continuity = continuityRef.current.observe(faces.length === 1 ? faceDescriptor(faces[0]) : null, now);
            observe("IDENTITY_SWITCH", { ...common, present: continuity.changed, confidence: continuity.confidence, meta: { signal: "face-geometry-continuity", difference: continuity.difference || 0 } });
            const assessment = faces.length === 1 ? isAttentionDiverted({
              headPose: extractHeadPose(results.facialTransformationMatrixes?.[0]?.data),
              gazeBlendshape: extractGazeFromBlendshapes(results.faceBlendshapes?.[0]),
            }) : { isDiverted: false };
            observe("GAZE_DEVIATION", { ...common, present: assessment.isDiverted });
          } catch { /* Failed inference is not evidence of absence or recovery. */ }
        }
        if (detectorRef.current && now - lastObjectAt >= 250) {
          lastObjectAt = now;
          try {
            const results = detectorRef.current.detectForVideo(video, now);
            healthRef.current.objectAt = Date.now();
            let confidence = 0;
            for (const detection of results.detections || []) {
              for (const category of detection.categories || []) {
                if (["cell phone", "phone", "mobile phone", "telephone"].includes(category.categoryName?.toLowerCase())) confidence = Math.max(confidence, category.score || 0);
              }
            }
            observe("PHONE_DETECTED", { now, present: confidence >= 0.6, confidence, faceCount: healthRef.current.faceCount ?? null });
            setIsPhoneInView(evidenceRef.current.isActive("PHONE_DETECTED"));
          } catch { /* The heartbeat reports persistent inference failure. */ }
        }
      }
      if (now - lastStateSyncAt >= 250) {
        lastStateSyncAt = now;
        const faceHealthy = Date.now() - healthRef.current.faceAt < 5000;
        const objectHealthy = Date.now() - healthRef.current.objectAt < 5000;
        const active = Object.keys(DETAILS).filter((type) => evidenceRef.current.isActive(type) && (type === "PHONE_DETECTED" ? objectHealthy : faceHealthy));
        setStabilizedEvents((previous) => previous.join() === active.join() ? previous : active);
        if (!objectHealthy) setIsPhoneInView(false);
      }
      frameId = requestAnimationFrame(processFrame);
    };
    frameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isInterviewActive, sessionId, logViolation, videoRef]);

  useEffect(() => {
    if (!isInterviewActive || !sessionId) return;
    let cancelled = false;
    let timer;
    const heartbeat = async () => {
      const now = Date.now();
      const detectorHealthy = now - healthRef.current.faceAt < 5000 && now - healthRef.current.objectAt < 5000;
      try {
        const response = await sendProctoringHeartbeat(sessionId, { detectorHealthy, detectorVersion: DETECTOR_VERSION });
        if (cancelled) return;
        if (detectorHealthy && !response.data.offline) applySummary(response.data.summary);
        else setProctoringState((previous) => ({ ...previous, status: "warning", message: "Camera or detector unavailable. Restore the camera and keep this tab open." }));
      } catch {
        if (!cancelled) setProctoringState((previous) => ({ ...previous, status: "warning", message: "Proctoring connection interrupted. Retrying..." }));
      } finally {
        // Retry well within the server's 60-second grace period; no overlapping requests.
        if (!cancelled) timer = setTimeout(heartbeat, 10000);
      }
    };
    void heartbeat();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isInterviewActive, sessionId, applySummary]);

  useEffect(() => {
    if (!isInterviewActive) return;
    const visibility = () => { if (document.hidden) void logViolation({ eventType: "TAB_SWITCH", details: "Candidate switched tabs or minimized the window" }); };
    const blur = () => { void logViolation({ eventType: "WINDOW_BLUR", severity: "low", details: "Interview window lost focus" }); };
    const paste = (event) => { if (["TEXTAREA", "INPUT"].includes(event.target?.tagName)) void logViolation({ eventType: "PASTE_ATTEMPT", details: "External text pasted into the answer input" }); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    document.addEventListener("paste", paste);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      document.removeEventListener("paste", paste);
      clearTimeout(alertTimerRef.current);
    };
  }, [isInterviewActive, logViolation]);

  const persistentEvent = stabilizedEvents.find((type) => SEVERE.has(type)) || stabilizedEvents[0];
  const stabilizedAlert = persistentEvent ? {
    eventType: persistentEvent,
    details: DETAILS[persistentEvent],
    severity: SEVERE.has(persistentEvent) ? "high" : "medium",
  } : null;
  return {
    proctoringState,
    activeAlert: stabilizedAlert?.severity === "high" ? stabilizedAlert : activeAlert || stabilizedAlert,
    isPhoneInView, recentViolations, captureSnapshot, logViolation,
  };
}

export default useProctoringEngine;

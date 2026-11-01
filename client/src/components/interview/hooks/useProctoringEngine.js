import { useState, useRef, useEffect, useCallback } from "react";
import axios from "@/api/api";
import toast from "react-hot-toast";
import { getFaceLandmarker, getObjectDetector, cleanupVisionModels } from "@/lib/vision/visionModels";
import { extractHeadPose, extractGazeFromBlendshapes, isAttentionDiverted } from "@/lib/vision/gazeCalculator";
import remoteLogger from "@/utils/remoteLogger";

export function useProctoringEngine({
  videoRef,
  sessionId,
  isInterviewActive,
  interviewStartTime,
  onViolation,
}) {
  const [proctoringState, setProctoringState] = useState({
    status: "initializing", // initializing | active | warning | critical
    message: "Initializing AI integrity guard...",
    integrityScore: 100,
    flagsCount: 0,
  });

  const [activeAlert, setActiveAlert] = useState(null);
  const [isPhoneInView, setIsPhoneInView] = useState(false);
  const [recentViolations, setRecentViolations] = useState([]);

  // Internal tracking refs
  const landmarkerRef = useRef(null);
  const detectorRef = useRef(null);
  const isRunningRef = useRef(false);
  const animFrameIdRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const lastFaceCheckTimeRef = useRef(0);
  const lastObjectCheckTimeRef = useRef(0);

  // Temporal debouncing durations
  const absentTimeRef = useRef(0);
  const multipleFaceTimeRef = useRef(0);
  const gazeAwayTimeRef = useRef(0);
  const phoneDetectionsCountRef = useRef(0);
  const phoneMissingFramesRef = useRef(0);
  const lastLoggedFlagTimeRef = useRef({});
  const isWindowBlurredRef = useRef(false);
  const isTabHiddenRef = useRef(false);

  // Helper to capture a lightweight 320x240 compressed WebP snapshot from the video element
  const captureSnapshot = useCallback(() => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return null;

    try {
      if (!analysisCanvasRef.current) {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 240;
        analysisCanvasRef.current = c;
      }
      const canvas = analysisCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/webp", 0.6);
    } catch (err) {
      console.warn("Could not capture proctoring snapshot:", err);
      return null;
    }
  }, [videoRef]);

  // Dispatch an infraction event to the server and update local state
  const logViolation = useCallback(
    async ({ eventType, severity = "medium", confidence = 1, details = "" }) => {
      if (!isInterviewActive) return;

      // Rate limit duplicate flags of the exact same event type to once every 3.5 seconds
      const now = Date.now();
      const lastTime = lastLoggedFlagTimeRef.current[eventType] || 0;
      if (now - lastTime < 3500) return;
      lastLoggedFlagTimeRef.current[eventType] = now;

      const elapsedSeconds = interviewStartTime
        ? Math.max(0, Math.round((now - interviewStartTime) / 1000))
        : 0;

      const snapshotData = captureSnapshot();

      // Show temporary HUD alert
      setActiveAlert({ eventType, details, severity });
      setTimeout(() => setActiveAlert(null), 4000);

      // Instant user-facing notification
      if (eventType === "PHONE_DETECTED") {
        toast.error("Prohibited Device: Mobile phone detected in camera view", {
          id: "proctor-alert-phone",
          icon: "📱",
          duration: 4000,
        });
      } else if (eventType === "GAZE_DEVIATION") {
        toast("Please look directly at the screen", {
          id: "proctor-alert-gaze",
          icon: "👀",
          duration: 3000,
        });
      } else if (eventType === "MULTIPLE_FACES") {
        toast.error("Integrity Alert: Multiple people detected in camera frame", {
          id: "proctor-alert-faces",
          icon: "👥",
          duration: 4000,
        });
      } else if (eventType === "FACE_ABSENT") {
        toast.error("Please remain visible in the camera frame", {
          id: "proctor-alert-absent",
          icon: "⚠️",
          duration: 3000,
        });
      }

      onViolation?.({ eventType, details, severity });
      remoteLogger.proctor(sessionId, eventType, details, { severity, confidence, elapsedSeconds });

      if (sessionId) {
        try {
          const response = await axios.post(`/interview/sessions/${sessionId}/proctoring/event`, {
            eventType,
            severity,
            confidence,
            timestampSeconds: elapsedSeconds,
            details,
            snapshotData,
          });

          if (response.data.success) {
            const summary = response.data.data.summary;
            setProctoringState((prev) => ({
              ...prev,
              status: summary.verdict === "VERIFIED_CLEAN" ? "active" : "warning",
              integrityScore: summary.integrityScore,
              flagsCount: prev.flagsCount + 1,
              message: details || "Integrity event logged",
            }));

            setRecentViolations((prev) => [
              {
                eventType,
                timestampSeconds: elapsedSeconds,
                details,
                severity,
                timeString: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 9),
            ]);
          }
        } catch (err) {
          console.warn("Failed to transmit proctoring event to server:", err);
        }
      } else {
        // Fallback local score deduction if previewing without session ID
        setProctoringState((prev) => ({
          ...prev,
          status: "warning",
          integrityScore: Math.max(40, prev.integrityScore - 15),
          flagsCount: prev.flagsCount + 1,
          message: details || "Integrity event logged",
        }));
      }
    },
    [captureSnapshot, interviewStartTime, isInterviewActive, onViolation, sessionId]
  );

  // Initialize vision models
  useEffect(() => {
    let isCancelled = false;

    const initVision = async () => {
      try {
        const [fl, od] = await Promise.all([getFaceLandmarker(), getObjectDetector()]);
        if (!isCancelled) {
          landmarkerRef.current = fl;
          detectorRef.current = od;
          setProctoringState((prev) => ({
            ...prev,
            status: "active",
            message: "AI Integrity Guard Active & Verified",
          }));
          console.log("🛡️ Proctoring engine ready with hardware acceleration.");
        }
      } catch (err) {
        console.warn("Could not initialize vision models for proctoring:", err.message);
        if (!isCancelled) {
          setProctoringState((prev) => ({
            ...prev,
            status: "active",
            message: "Proctoring active (Browser integrity mode)",
          }));
        }
      }
    };

    initVision();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Main video analysis frame loop
  useEffect(() => {
    if (!isInterviewActive || !videoRef.current) return;

    isRunningRef.current = true;
    let lastTimestamp = performance.now();

    const processFrame = () => {
      if (!isRunningRef.current) return;

      const now = performance.now();
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      const video = videoRef.current;

      if (video && video.readyState >= 2 && !video.paused) {
        const shouldCheckFace =
          landmarkerRef.current && now - lastFaceCheckTimeRef.current >= 200;
        const shouldCheckObject =
          detectorRef.current && now - lastObjectCheckTimeRef.current >= 220;

        // 1. FACE LANDMARKER & GAZE ANALYSIS (~5 FPS / every 200ms on offscreen canvas)
        if (shouldCheckFace) {
          lastFaceCheckTimeRef.current = now;

          if (!analysisCanvasRef.current) {
            const c = document.createElement("canvas");
            c.width = 320;
            c.height = 240;
            analysisCanvasRef.current = c;
          }
          const canvas = analysisCanvasRef.current;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, 320, 240);

          try {
            const results = landmarkerRef.current.detectForVideo(canvas, now);

            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
              // 0 Faces: Candidate absent or out of frame
              absentTimeRef.current += dt;
              gazeAwayTimeRef.current = 0;
              multipleFaceTimeRef.current = 0;

              if (absentTimeRef.current >= 4.0) {
                logViolation({
                  eventType: "FACE_ABSENT",
                  severity: "medium",
                  details: "Candidate not visible in camera frame",
                });
                absentTimeRef.current = 0;
              }
            } else if (results.faceLandmarks.length > 1) {
              // > 1 Faces: Multiple people detected in camera view
              multipleFaceTimeRef.current += dt;
              absentTimeRef.current = 0;
              gazeAwayTimeRef.current = 0;

              if (multipleFaceTimeRef.current >= 2.0) {
                logViolation({
                  eventType: "MULTIPLE_FACES",
                  severity: "high",
                  details: "Multiple people detected in interview frame",
                });
                multipleFaceTimeRef.current = 0;
              }
            } else {
              // Exactly 1 Face: Check head orientation and eye gaze
              absentTimeRef.current = 0;
              multipleFaceTimeRef.current = 0;

              const matrix = results.facialTransformationMatrixes?.[0]?.data;
              const blendshapes = results.faceBlendshapes?.[0];

              const headPose = extractHeadPose(matrix);
              const gazeBlendshape = extractGazeFromBlendshapes(blendshapes);

              const assessment = isAttentionDiverted({ headPose, gazeBlendshape });

              if (assessment.isDiverted) {
                gazeAwayTimeRef.current += dt;
                if (gazeAwayTimeRef.current >= 4.0) {
                  logViolation({
                    eventType: "GAZE_DEVIATION",
                    severity: "low",
                    details: `Looking away from screen (${assessment.reason})`,
                  });
                  gazeAwayTimeRef.current = 0;
                }
              } else {
                gazeAwayTimeRef.current = Math.max(0, gazeAwayTimeRef.current - dt * 2);
              }
            }
          } catch (e) {
            // Frame inference error; keep loop alive
          }
        }

        // 2. PROHIBITED OBJECT DETECTION (Mobile phone/device/cheat materials, every ~220ms on hardware-accelerated video)
        if (shouldCheckObject) {
          lastObjectCheckTimeRef.current = now;

          try {
            const detections = detectorRef.current.detectForVideo(video, now);
            let phoneFound = false;
            let matchedCategory = "";
            let bestScore = 0;

            if (detections && detections.detections) {
              for (const det of detections.detections) {
                for (const cat of det.categories || []) {
                  const name = cat.categoryName?.toLowerCase() || "";
                  const score = cat.score || 0;

                  // Target specifically mobile/cell phones with high confidence >= 0.48
                  // Never trigger on laptops, microphones, or background clutter
                  const isCellPhone =
                    (name === "cell phone" ||
                      name.includes("cell phone") ||
                      name === "phone" ||
                      name === "mobile phone" ||
                      name === "telephone") &&
                    !name.includes("laptop") &&
                    !name.includes("microphone");

                  if (isCellPhone && score >= 0.48) {
                    phoneFound = true;
                    matchedCategory = "mobile phone";
                    bestScore = Math.max(bestScore, score);
                    console.log(`📱 Cell phone detected! Class: "${name}", confidence: ${(score * 100).toFixed(1)}%`);
                    break;
                  }
                }
                if (phoneFound) break;
              }
            }

            if (phoneFound) {
              phoneMissingFramesRef.current = 0;
              phoneDetectionsCountRef.current += 1;
              // Require 3 consecutive detection frames (~660ms) to eliminate background noise & hand position blips
              if (phoneDetectionsCountRef.current >= 3) {
                setIsPhoneInView(true);
                logViolation({
                  eventType: "PHONE_DETECTED",
                  severity: "high",
                  details: `Mobile phone detected in camera view (${Math.round(bestScore * 100)}% match)`,
                });
              }
            } else {
              phoneMissingFramesRef.current += 1;
              if (phoneMissingFramesRef.current >= 3) {
                setIsPhoneInView(false);
                phoneDetectionsCountRef.current = 0;
              }
            }
          } catch (e) {
            console.warn("Object detector frame inference warning:", e.message);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunningRef.current = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isInterviewActive, logViolation, videoRef]);

  // 3. BROWSER ENVIRONMENT INTEGRITY LISTENERS (Tab Switch, Blur, Paste)
  useEffect(() => {
    if (!isInterviewActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isTabHiddenRef.current) {
          isTabHiddenRef.current = true;
          console.warn("⚠️ Tab switch detected.");
          logViolation({
            eventType: "TAB_SWITCH",
            severity: "medium",
            details: "Candidate switched browser tabs or minimized window",
          });
        }
      } else {
        isTabHiddenRef.current = false;
      }
    };

    const handleWindowBlur = () => {
      if (!isWindowBlurredRef.current) {
        isWindowBlurredRef.current = true;
        console.warn("⚠️ Window lost focus.");
        logViolation({
          eventType: "WINDOW_BLUR",
          severity: "low",
          details: "Interview window lost focus to another application",
        });
      }
    };

    const handleWindowFocus = () => {
      isWindowBlurredRef.current = false;
    };

    const handlePaste = (e) => {
      // Check if candidate is pasting into an input or textarea
      const target = e.target;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) {
        console.warn("⚠️ Unauthorized paste attempt in interview input.");
        logViolation({
          eventType: "PASTE_ATTEMPT",
          severity: "medium",
          details: "Candidate attempted to paste external text into answer box",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isInterviewActive, logViolation]);

  return {
    proctoringState,
    activeAlert,
    isPhoneInView,
    recentViolations,
    captureSnapshot,
    logViolation,
  };
}

export default useProctoringEngine;

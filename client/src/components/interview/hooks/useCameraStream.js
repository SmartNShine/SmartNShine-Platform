import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export function useCameraStream({ autoStart = false } = {}) {
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Enumerate connected cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate video devices:", err);
    }
  }, [selectedDeviceId]);

  // Start or restart camera stream
  const startCamera = useCallback(
    async (deviceId) => {
      setIsInitializing(true);
      setCameraError(null);

      // Stop any existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        const primaryConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
          },
          audio: false,
        };

        let mediaStream = null;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
        } catch (constraintErr) {
          if (
            constraintErr.name === "OverconstrainedError" ||
            constraintErr.name === "ConstraintNotSatisfiedError"
          ) {
            console.warn("⚠️ OverconstrainedError with 720p constraints. Falling back to default video device...", constraintErr);
            // Universal fallback: standard unconstrained video
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } else {
            throw constraintErr;
          }
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((e) => console.warn("Video play error:", e));
        }

        await refreshDevices();
        return mediaStream;
      } catch (err) {
        console.error("Camera access failed:", err);
        let errorMsg = "Unable to access webcam.";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMsg = "Camera permission was denied. Please allow camera access in your browser settings.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMsg = "No webcam found on this device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMsg = "Camera is currently in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMsg = "Camera does not support the requested video resolution.";
        }
        setCameraError(errorMsg);
        setIsCameraActive(false);
        toast.error(errorMsg);
        return null;
      } finally {
        setIsInitializing(false);
      }
    },
    [refreshDevices]
  );

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsCameraActive(false);
  }, []);

  // Switch to specific camera
  const switchCamera = useCallback(
    async (newDeviceId) => {
      setSelectedDeviceId(newDeviceId);
      await startCamera(newDeviceId);
    },
    [startCamera]
  );

  // Sync ref when video element mounts
  const attachVideoRef = useCallback(
    (node) => {
      videoRef.current = node;
      if (node && streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(() => {});
      }
    },
    []
  );

  // Optional auto-start on mount
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    stream,
    streamRef,
    videoRef,
    attachVideoRef,
    isCameraActive,
    cameraError,
    isInitializing,
    videoDevices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
    refreshDevices,
  };
}

export default useCameraStream;

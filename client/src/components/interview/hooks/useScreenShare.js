import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { updateScreenShareStatus, uploadScreenFrame } from "@/api/interview.api";

// Screen sharing for proctored interviews (docs/interview-security-plan.md, S1.5).
// Only small still frames are uploaded: every 15 s and shortly after the candidate
// leaves the interview window. No screen video is recorded.

const FRAME_WIDTH = 640;
const PERIODIC_MS = 15000;
const AWAY_CAPTURE_DELAY_MS = 1500; // let the other app come to the front first
const MIN_UPLOAD_GAP_MS = 4200; // server accepts one frame per 4 s
const MAX_FRAME_CHARS = 330000; // ≈ 240 KB of base64, under the server's 250 KB cap

/** Shares that give reviewers the full picture. "unknown" = browser does not report the surface. */
export const isFullScreenShare = (status) => status === "monitor" || status === "unknown";
export const isPartialScreenShare = (status) => status === "window" || status === "browser";

export const isScreenShareSupported = () => Boolean(navigator.mediaDevices?.getDisplayMedia);

/**
 * Ask for the entire screen. Must be called synchronously inside a click handler
 * (before any await) so the browser sees the user gesture.
 *
 * @returns {Promise<{ stream: MediaStream|null, status: "monitor"|"window"|"browser"|"unknown"|"declined"|"unavailable", reason?: string }>}
 */
export function requestScreenShare() {
  if (!isScreenShareSupported()) {
    return Promise.resolve({ stream: null, status: "unavailable", reason: "unsupported" });
  }
  let request;
  try {
    request = navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "monitor", frameRate: { ideal: 1, max: 2 } },
      audio: false,
      monitorTypeSurfaces: "include",
      surfaceSwitching: "exclude",
      selfBrowserSurface: "exclude",
      systemAudio: "exclude",
    });
  } catch (error) {
    return Promise.resolve({ stream: null, status: "unavailable", reason: error?.name || "error" });
  }
  return request.then(
    (stream) => {
      const surface = stream.getVideoTracks()[0]?.getSettings?.().displaySurface;
      return { stream, status: ["monitor", "window", "browser"].includes(surface) ? surface : "unknown" };
    },
    (error) => ({
      stream: null,
      // Chrome reports both "cancelled the picker" and "blocked by policy" as NotAllowedError.
      status: error?.name === "NotAllowedError" ? "declined" : "unavailable",
      reason: error?.name || "error",
    }),
  );
}

export const stopScreenShare = (stream) => stream?.getTracks?.().forEach((track) => track.stop());

async function grabFrame(stream, videoRef) {
  const track = stream?.getVideoTracks?.()[0];
  if (!track || track.readyState !== "live") return null;
  let source = null;
  let width = 0;
  let height = 0;
  // ImageCapture keeps working while the interview tab is hidden; a <video> may not.
  if (typeof window.ImageCapture === "function") {
    try {
      source = await new window.ImageCapture(track).grabFrame();
      ({ width, height } = source);
    } catch { source = null; }
  }
  if (!source) {
    let video = videoRef.current;
    if (!video || video.srcObject !== stream) {
      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      videoRef.current = video;
      await video.play().catch(() => {});
    }
    if (!video.videoWidth) return null;
    source = video;
    width = video.videoWidth;
    height = video.videoHeight;
  }
  const scale = Math.min(1, FRAME_WIDTH / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  let data = canvas.toDataURL("image/webp", 0.5);
  // Safari has no webp encoder and silently returns PNG.
  if (!data.startsWith("data:image/webp") || data.length > MAX_FRAME_CHARS) data = canvas.toDataURL("image/jpeg", 0.55);
  if (data.length > MAX_FRAME_CHARS) data = canvas.toDataURL("image/jpeg", 0.35);
  return data.length > MAX_FRAME_CHARS ? null : data;
}

/**
 * Live screen-share monitoring for a proctored interview.
 *
 * @param {object}   options
 * @param {boolean}  options.active              interview step is running (proctored)
 * @param {string}   options.sessionId
 * @param {number}   options.interviewStartTime  ms epoch, for frame timestamps
 * @param {boolean}  options.required            share is mandatory (TPO assessments)
 * @param {Function} options.logViolation        proctoring engine logger
 */
export function useScreenShare({ active, sessionId, interviewStartTime, required = false, logViolation }) {
  const [status, setStatus] = useState("off");
  const [shareLost, setShareLost] = useState(false);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const stoppedAtRef = useRef(null);
  const lastUploadAtRef = useRef(0);
  const awayFrameIdRef = useRef(null);
  const awayTimerRef = useRef(null);
  const initialStatusRef = useRef(null);
  const runtimeRef = useRef({});
  useLayoutEffect(() => {
    runtimeRef.current = { active, sessionId, interviewStartTime, logViolation };
  });

  const log = useCallback((event) => runtimeRef.current.logViolation?.(event), []);
  const postStatus = useCallback((payload) => {
    const { sessionId: id } = runtimeRef.current;
    if (id) updateScreenShareStatus(id, payload).catch(() => {});
  }, []);

  const captureAndUpload = useCallback(async (reason) => {
    const { active: isActive, sessionId: id, interviewStartTime: startedAt } = runtimeRef.current;
    if (!isActive || !id || !streamRef.current) return null;
    const wait = lastUploadAtRef.current + MIN_UPLOAD_GAP_MS - Date.now();
    if (wait > 0) {
      if (reason === "periodic") return null; // the next tick will do
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    const imageData = await grabFrame(streamRef.current, videoRef);
    if (!imageData) return null;
    lastUploadAtRef.current = Date.now();
    try {
      const response = await uploadScreenFrame(id, {
        imageData,
        reason,
        timestampSeconds: Math.max(0, Math.round((Date.now() - (startedAt || Date.now())) / 1000)),
      });
      return response?.data?.frameId || null;
    } catch { return null; }
  }, []);

  const handleEnded = useCallback(() => {
    streamRef.current = null;
    videoRef.current = null;
    if (!runtimeRef.current.active) return;
    stoppedAtRef.current = Date.now();
    setShareLost(true);
    setStatus("off");
    postStatus({ status: "off" });
  }, [postStatus]);

  /** Take ownership of a stream returned by `requestScreenShare()`. */
  const adopt = useCallback((result) => {
    if (streamRef.current && streamRef.current !== result?.stream) stopScreenShare(streamRef.current);
    streamRef.current = result?.stream || null;
    videoRef.current = null;
    result?.stream?.getVideoTracks()[0]?.addEventListener("ended", handleEnded, { once: true });
    setStatus(result?.status || "off");
    if (initialStatusRef.current == null) initialStatusRef.current = result || { status: "off" };
  }, [handleEnded]);

  /** Dialog button after "Stop sharing": must run inside the click. */
  const reshare = useCallback(async () => {
    const result = await requestScreenShare();
    if (!result.stream) return false;
    adopt(result);
    const durationMs = stoppedAtRef.current ? Date.now() - stoppedAtRef.current : 0;
    stoppedAtRef.current = null;
    setShareLost(false);
    log({
      eventType: "SCREEN_SHARE_STOPPED",
      durationMs,
      details: `Screen sharing was off for ${Math.round(durationMs / 1000)}s`,
      meta: { durationSec: Math.round(durationMs / 1000), resumedSurface: result.status },
    });
    postStatus({ status: result.status, stoppedMs: durationMs });
    void captureAndUpload("share_resumed");
    return true;
  }, [adopt, captureAndUpload, log, postStatus]);

  /** Optional share only: keep going without the screen. Logged and counted as time off. */
  const continueWithoutShare = useCallback(() => {
    if (required) return;
    const durationMs = stoppedAtRef.current ? Date.now() - stoppedAtRef.current : 0;
    setShareLost(false);
    log({
      eventType: "SCREEN_SHARE_UNAVAILABLE",
      details: "Continued the interview without sharing the screen",
      meta: { reason: "stopped_by_candidate", offSec: Math.round(durationMs / 1000) },
    });
    // The rest of the interview runs unshared; the remaining off time is not measurable.
    postStatus({ status: "off", stoppedMs: durationMs });
    stoppedAtRef.current = null;
  }, [required, log, postStatus]);

  // Report how the interview started (once the session can receive events).
  useEffect(() => {
    if (!active || !sessionId) return;
    const initial = initialStatusRef.current;
    if (!initial || initial.reported) return;
    initial.reported = true;
    const timer = setTimeout(() => {
      if (isPartialScreenShare(initial.status)) {
        log({
          eventType: "SCREEN_SHARE_PARTIAL",
          details: `Shared a ${initial.status === "browser" ? "browser tab" : "window"} instead of the entire screen`,
          meta: { surface: initial.status },
        });
      } else if (!isFullScreenShare(initial.status)) {
        log({
          eventType: "SCREEN_SHARE_UNAVAILABLE",
          details: initial.status === "declined" ? "Screen sharing was declined" : "Screen sharing is not available in this browser",
          meta: { reason: initial.reason || initial.status },
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [active, sessionId, log]);

  // Periodic frames.
  useEffect(() => {
    if (!active || !sessionId || shareLost) return;
    void captureAndUpload("periodic");
    const timer = setInterval(() => void captureAndUpload("periodic"), PERIODIC_MS);
    return () => clearInterval(timer);
  }, [active, sessionId, shareLost, captureAndUpload]);

  // Stop sharing when the interview ends or the page unmounts.
  useEffect(() => {
    if (active) return;
    clearTimeout(awayTimerRef.current);
    setShareLost(false);
  }, [active]);
  useEffect(() => () => stopScreenShare(streamRef.current), []);

  /** Called by the environment guard when the candidate leaves the window. */
  const onAwayStart = useCallback((kind) => {
    awayFrameIdRef.current = null;
    clearTimeout(awayTimerRef.current);
    awayTimerRef.current = setTimeout(async () => {
      const stillAway = document.hidden || !document.hasFocus();
      if (!stillAway) return;
      awayFrameIdRef.current = await captureAndUpload(kind === "tab" ? "tab_hidden" : "window_blur");
    }, AWAY_CAPTURE_DELAY_MS);
  }, [captureAndUpload]);

  /** Frame id for the time-away event being logged now (cleared once read). */
  const takeAwayFrameId = useCallback(() => {
    const id = awayFrameIdRef.current;
    awayFrameIdRef.current = null;
    return id;
  }, []);

  const stop = useCallback(() => {
    stopScreenShare(streamRef.current);
    streamRef.current = null;
    videoRef.current = null;
    initialStatusRef.current = null;
    stoppedAtRef.current = null;
    setStatus("off");
    setShareLost(false);
  }, []);

  return { status, shareLost, adopt, reshare, continueWithoutShare, onAwayStart, takeAwayFrameId, stop };
}

export default useScreenShare;

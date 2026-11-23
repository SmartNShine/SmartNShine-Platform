import { useCallback, useEffect, useRef, useState } from "react";

// Software that injects video/audio instead of a real device. Phone-as-webcam apps
// (DroidCam, Camo, EpocCam) and noise filters (NVIDIA Broadcast, Krisp) are real
// capture paths and deliberately not listed.
const VIRTUAL_DEVICE_PATTERN = /\b(obs|virtual|manycam|snap camera|xsplit|mmhmm|camtwist|e2esoft|splitcam|youcam|ndi|vb-audio|voicemeeter|blackhole|loopback|soundflower|cable (?:output|input))\b/i;

const CHANNEL_NAME = "smartnshine-interview";
const RESIZE_RATIO = 0.7;
const RESIZE_GRACE_MS = 5000;
const SCREEN_RECHECK_MS = 30000;

export const isVirtualDeviceLabel = (label = "") => VIRTUAL_DEVICE_PATTERN.test(label);

export const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);

export function requestInterviewFullscreen() {
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request || isFullscreen()) return Promise.resolve(isFullscreen());
  return Promise.resolve(request.call(root, { navigationUI: "hide" })).then(() => true).catch(() => false);
}

export function exitInterviewFullscreen() {
  if (!isFullscreen()) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  exit?.call(document)?.catch?.(() => {});
}

/**
 * Pre-flight environment check (setup screen). Labels are only available once
 * camera/mic permission has been granted.
 * @returns {Promise<{ virtualDevices: string[], extendedDisplay: boolean|null, fullscreenSupported: boolean }>}
 */
export async function checkInterviewEnvironment({ cameraStream, micStream } = {}) {
  const virtualDevices = [
    ...(cameraStream?.getVideoTracks?.() || []),
    ...(micStream?.getAudioTracks?.() || []),
  ]
    .filter((track) => track.readyState === "live" && isVirtualDeviceLabel(track.label))
    .map((track) => track.label);
  return {
    virtualDevices: [...new Set(virtualDevices)],
    // Chromium only; other browsers report null (unknown), never "fine".
    extendedDisplay: typeof window.screen?.isExtended === "boolean" ? window.screen.isExtended : null,
    fullscreenSupported: Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen),
    screenShareSupported: Boolean(navigator.mediaDevices?.getDisplayMedia),
  };
}

/**
 * Live-interview environment monitoring (security plan, Phase S1).
 * Emits proctoring events through `logViolation`; never blocks by itself.
 *
 * @param {object}   options
 * @param {boolean}  options.active        interview step is running
 * @param {"practice"|"proctored"} options.level
 * @param {MediaStream|null} options.cameraStream
 * @param {Function} options.getMicStream  returns the current mic MediaStream
 * @param {Function} options.logViolation  proctoring engine logger
 * @param {Function} [options.onAwayStart]     ("tab"|"window") candidate just left; screen share grabs a frame
 * @param {Function} [options.takeAwayFrameId] screen frame id to attach to the time-away event
 */
export function useEnvironmentGuard({ active, level, cameraStream, getMicStream, logViolation, onAwayStart, takeAwayFrameId }) {
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const [duplicateTab, setDuplicateTab] = useState(false);
  const logRef = useRef(logViolation);
  logRef.current = logViolation;
  const awayRef = useRef({ onAwayStart, takeAwayFrameId });
  awayRef.current = { onAwayStart, takeAwayFrameId };
  const proctored = level === "proctored";

  const log = useCallback((event) => logRef.current?.(event), []);

  // Time away from the interview, measured as a duration (2 s and 40 s differ).
  useEffect(() => {
    if (!active) return;
    let hiddenAt = null;
    let blurredAt = null;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        awayRef.current.onAwayStart?.("tab");
        return;
      }
      if (hiddenAt) {
        const durationMs = Date.now() - hiddenAt;
        hiddenAt = null;
        log({
          eventType: "TAB_SWITCH",
          severity: durationMs > 10000 ? "high" : "medium",
          durationMs,
          details: `Left the interview tab for ${Math.round(durationMs / 1000)}s`,
          meta: withScreenFrame({ durationSec: Math.round(durationMs / 1000) }),
        });
      }
    };
    const withScreenFrame = (meta) => {
      const screenFrameId = awayRef.current.takeAwayFrameId?.();
      return screenFrameId ? { ...meta, screenFrameId } : meta;
    };
    const onBlur = () => {
      if (document.hidden) return;
      blurredAt = Date.now();
      awayRef.current.onAwayStart?.("window");
    };
    const onFocus = () => {
      if (!blurredAt) return;
      const durationMs = Date.now() - blurredAt;
      blurredAt = null;
      if (durationMs < 1500) { // OS notifications / permission prompts
        awayRef.current.takeAwayFrameId?.();
        return;
      }
      log({
        eventType: "WINDOW_BLUR",
        severity: durationMs > 10000 ? "medium" : "low",
        durationMs,
        details: `Interview window lost focus for ${Math.round(durationMs / 1000)}s`,
        meta: withScreenFrame({ durationSec: Math.round(durationMs / 1000) }),
      });
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [active, log]);

  // Fullscreen (proctored): exiting is logged with how long they stayed out.
  useEffect(() => {
    if (!active || !proctored) {
      setFullscreenLost(false);
      return;
    }
    let exitedAt = isFullscreen() ? null : Date.now();
    setFullscreenLost(!isFullscreen());
    const onChange = () => {
      if (isFullscreen()) {
        if (exitedAt) {
          const durationMs = Date.now() - exitedAt;
          log({
            eventType: "FULLSCREEN_EXIT",
            durationMs,
            details: `Left fullscreen for ${Math.round(durationMs / 1000)}s`,
            meta: { durationSec: Math.round(durationMs / 1000) },
          });
        }
        exitedAt = null;
        setFullscreenLost(false);
      } else {
        exitedAt = Date.now();
        setFullscreenLost(true);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [active, proctored, log]);

  // Extra displays: checked at start, periodically and when screens change.
  useEffect(() => {
    if (!active || typeof window.screen?.isExtended !== "boolean") return;
    let reported = false;
    const check = () => {
      if (window.screen.isExtended && !reported) {
        reported = true;
        log({ eventType: "MULTI_SCREEN", details: "An extra display is connected", meta: { source: "screen.isExtended" } });
      } else if (!window.screen.isExtended) {
        reported = false;
      }
    };
    check();
    const timer = setInterval(check, SCREEN_RECHECK_MS);
    window.screen.addEventListener?.("change", check);
    return () => {
      clearInterval(timer);
      window.screen.removeEventListener?.("change", check);
    };
  }, [active, log]);

  // Virtual camera / microphone: the tracks actually in use, re-checked on device changes.
  useEffect(() => {
    if (!active) return;
    const reported = new Set();
    const check = () => {
      const tracks = [
        ...(cameraStream?.getVideoTracks?.() || []),
        ...(getMicStream?.()?.getAudioTracks?.() || []),
      ];
      for (const track of tracks) {
        if (isVirtualDeviceLabel(track.label) && !reported.has(track.label)) {
          reported.add(track.label);
          log({
            eventType: "VIRTUAL_DEVICE",
            severity: "high",
            details: `Virtual ${track.kind === "video" ? "camera" : "microphone"} in use: ${track.label}`,
            meta: { kind: track.kind, label: track.label },
          });
        }
      }
    };
    check();
    const timer = setInterval(check, 15000);
    navigator.mediaDevices?.addEventListener?.("devicechange", check);
    return () => {
      clearInterval(timer);
      navigator.mediaDevices?.removeEventListener?.("devicechange", check);
    };
  }, [active, cameraStream, getMicStream, log]);

  // Another tab running an interview at the same time.
  useEffect(() => {
    if (!active || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    channel.onmessage = ({ data }) => {
      if (data?.id === id) return;
      if (data?.type === "hello") channel.postMessage({ type: "here", id });
      if (data?.type === "hello" || data?.type === "here") {
        setDuplicateTab(true);
        log({ eventType: "MULTI_SESSION", details: "The interview is open in another tab" });
      }
    };
    channel.postMessage({ type: "hello", id });
    return () => {
      channel.close();
      setDuplicateTab(false);
    };
  }, [active, log]);

  // Copying the question (proctored: blocked as well as logged).
  useEffect(() => {
    if (!active) return;
    const onCopy = (event) => {
      if (proctored) event.preventDefault();
      log({ eventType: "COPY_ATTEMPT", severity: "low", details: "Tried to copy text from the interview" });
    };
    const onContextMenu = (event) => { if (proctored) event.preventDefault(); };
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [active, proctored, log]);

  // Shrunk window / picture-in-picture style layouts (proctored).
  useEffect(() => {
    if (!active || !proctored) return;
    let smallSince = null;
    const timer = setInterval(() => {
      const small = window.innerWidth < window.screen.availWidth * RESIZE_RATIO ||
        window.innerHeight < window.screen.availHeight * RESIZE_RATIO;
      if (!small || isFullscreen()) {
        smallSince = null;
        return;
      }
      smallSince ??= Date.now();
      if (Date.now() - smallSince >= RESIZE_GRACE_MS) {
        log({
          eventType: "WINDOW_RESIZE",
          severity: "low",
          details: "The interview window was made much smaller than the screen",
          meta: { width: window.innerWidth, height: window.innerHeight },
        });
        smallSince = Date.now() + 60000; // at most once a minute
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [active, proctored, log]);

  return {
    fullscreenLost,
    duplicateTab,
    returnToFullscreen: requestInterviewFullscreen,
  };
}

export default useEnvironmentGuard;

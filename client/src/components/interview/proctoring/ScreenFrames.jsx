import React, { useEffect, useRef, useState } from "react";
import { Monitor } from "lucide-react";
import { fetchScreenFrame } from "@/api/interview.api";

// Screen-share frames are private: each image is fetched with the auth header
// (blob URL), only once it scrolls into view, and released on unmount.

const REASON_LABELS = {
  periodic: "Periodic",
  tab_hidden: "Left the tab",
  window_blur: "Left the window",
  share_resumed: "Share resumed",
};

const formatSeconds = (sec = 0) => `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

export const ScreenFrameImage = ({ sessionId, frameId, alt = "Shared screen", className = "", eager = false }) => {
  const holderRef = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (visible || !holderRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { rootMargin: "200px" });
    observer.observe(holderRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !sessionId || !frameId) return undefined;
    let objectUrl = null;
    let cancelled = false;
    setFailed(false);
    fetchScreenFrame(sessionId, frameId)
      .then((created) => {
        objectUrl = created;
        if (cancelled) URL.revokeObjectURL(created);
        else setUrl(created);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, sessionId, frameId]);

  return (
    <div ref={holderRef} className={`relative overflow-hidden bg-black/40 ${className}`}>
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-500">
          {failed ? "Image no longer available" : "Loading…"}
        </span>
      )}
    </div>
  );
};

/** Filmstrip of every screen frame, in interview order. */
export const ScreenFrameStrip = ({ sessionId, screenShare, onSelect }) => {
  const frames = screenShare?.frames || [];
  const statusLabel = {
    monitor: "entire screen",
    unknown: "screen (type not reported by the browser)",
    window: "a single window",
    browser: "a browser tab",
    declined: "not shared (declined)",
    unavailable: "not shared (not available)",
    off: "not shared",
  }[screenShare?.status] || "not shared";
  const offSec = Math.round((screenShare?.stoppedMsTotal || 0) / 1000);

  return (
    <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
          Shared screen
        </h4>
        <span className="text-[11px] text-gray-500 dark:text-neutral-400">
          Shared: {statusLabel}
          {offSec > 0 && ` · off for ${formatSeconds(offSec)} in total`}
          {` · ${frames.length} image${frames.length === 1 ? "" : "s"}`}
        </span>
      </div>
      {frames.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-neutral-400">No screen images were captured.</p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-2" aria-label="Screen images">
          {frames.map((frame) => (
            <li key={frame.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect?.(frame)}
                className="block w-40 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden text-left hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <ScreenFrameImage sessionId={sessionId} frameId={frame.id} className="h-24 w-40" alt={`Screen at ${formatSeconds(frame.timestampSeconds)}`} />
                <span className={`block px-2 py-1 text-[10px] ${frame.reason === "periodic" ? "text-gray-500 dark:text-neutral-400" : "text-amber-600 dark:text-amber-300 font-medium"}`}>
                  {formatSeconds(frame.timestampSeconds)} · {REASON_LABELS[frame.reason] || frame.reason}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScreenFrameStrip;

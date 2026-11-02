import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Smartphone, Eye, Users, AlertTriangle, Monitor, ExternalLink } from "lucide-react";

export const IntegrityTimeline = ({ proctoringAudit, videoRecordingUrl, onSeekVideo }) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  if (!proctoringAudit) return null;

  const {
    integrityScore = 100,
    flagCounts = {},
    verdict = "VERIFIED_CLEAN",
    events = [],
  } = proctoringAudit;

  const isClean = verdict === "VERIFIED_CLEAN";
  const isReview = verdict === "REVIEW_RECOMMENDED";

  const getEventIcon = (type) => {
    switch (type) {
      case "PHONE_DETECTED":
        return <Smartphone className="w-4 h-4 text-rose-400" />;
      case "GAZE_DEVIATION":
        return <Eye className="w-4 h-4 text-amber-400" />;
      case "MULTIPLE_FACES":
        return <Users className="w-4 h-4 text-rose-400" />;
      case "FACE_ABSENT":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "TAB_SWITCH":
      case "WINDOW_BLUR":
      case "PASTE_ATTEMPT":
        return <Monitor className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-neutral-400" />;
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#12141A] border border-gray-200 dark:border-white/[0.08] p-6 shadow-sm">
      {/* Top Header: Trust Score & Verdict */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isClean
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : isReview
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
            }`}
          >
            {isClean ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              AI Proctoring & Integrity Audit
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Automated on-device computer vision & behavioral focus verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{integrityScore}%</span>
            <span className="block text-[11px] text-gray-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
              Integrity Score
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isClean
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : isReview
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {isClean ? "Verified Clean" : isReview ? "Review Recommended" : "Suspicious Activity"}
          </span>
        </div>
      </div>

      {/* Flag Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/[0.04]">
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">Phone Detected</span>
          <span className="block text-lg font-bold text-gray-900 dark:text-white mt-1">
            {flagCounts.phone || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/[0.04]">
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">Looking Away</span>
          <span className="block text-lg font-bold text-gray-900 dark:text-white mt-1">
            {flagCounts.gaze || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/[0.04]">
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">Multiple Faces</span>
          <span className="block text-lg font-bold text-gray-900 dark:text-white mt-1">
            {flagCounts.multipleFaces || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/[0.04]">
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">Candidate Absent</span>
          <span className="block text-lg font-bold text-gray-900 dark:text-white mt-1">
            {flagCounts.absent || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/[0.04]">
          <span className="text-[11px] text-gray-500 dark:text-neutral-400">Tab Switches</span>
          <span className="block text-lg font-bold text-gray-900 dark:text-white mt-1">
            {flagCounts.tabSwitch || 0}
          </span>
        </div>
      </div>

      {/* Recorded Video Player preview if videoRecordingUrl exists */}
      {videoRecordingUrl && (
        <div className="my-4 p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
              Session Video Recording (Replay & Audit)
            </span>
            <a
              href={videoRecordingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <video
            controls
            src={videoRecordingUrl}
            className="w-full max-h-64 rounded-lg bg-black object-contain border border-white/10"
          />
        </div>
      )}

      {/* Event Timeline */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-3">
          Chronological Integrity Timeline ({events.length} {events.length === 1 ? "flag" : "flags"})
        </h4>

        {events.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <p className="text-xs text-emerald-400 font-medium">
              ✨ No proctoring infractions detected. The candidate maintained unbroken focus throughout the entire session.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {events.map((ev, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-900/60 border border-gray-200 dark:border-white/[0.06] text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-black/20 dark:bg-black/40 flex items-center justify-center">
                    {getEventIcon(ev.eventType)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {ev.details || ev.eventType}
                    </span>
                    <span className="block text-[10px] text-gray-500 dark:text-neutral-400">
                      Timestamp: {formatSeconds(ev.timestampSeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ev.snapshotUrl && (
                    <button
                      onClick={() => setSelectedSnapshot(ev.snapshotUrl)}
                      className="px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-medium border border-blue-500/20 transition-colors"
                    >
                      View Snapshot
                    </button>
                  )}
                  {videoRecordingUrl && onSeekVideo && (
                    <button
                      onClick={() => onSeekVideo(ev.timestampSeconds)}
                      className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-medium border border-white/10 transition-colors"
                    >
                      Jump to {formatSeconds(ev.timestampSeconds)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className="max-w-md w-full rounded-2xl bg-neutral-900 border border-white/20 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Captured Infraction Snapshot</span>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={selectedSnapshot}
              alt="Infraction Evidence"
              className="w-full rounded-xl border border-white/10 object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrityTimeline;

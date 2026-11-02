import { useState, useRef, useCallback } from "react";
import axios from "@/api/api";
import toast from "react-hot-toast";

// IndexedDB Helper for fail-safe video chunk backup
const DB_NAME = "SmartNShineInterviewRecDB";
const STORE_NAME = "recording_chunks";

function openChunkDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveChunkToIDB(chunk) {
  try {
    const db = await openChunkDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(chunk);
  } catch (err) {
    console.warn("Could not save video chunk to IndexedDB:", err);
  }
}

async function clearChunksIDB() {
  try {
    const db = await openChunkDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
  } catch (_) {}
}

export function useVideoRecorder() {
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const isStartedRef = useRef(false);

  // Select optimal supported video container format
  const getSupportedMimeType = () => {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=avc1",
      "video/mp4",
    ];
    for (const t of types) {
      try {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
          return t;
        }
      } catch (_) {}
    }
    return "";
  };

  /**
   * Start recording candidate video stream
   */
  const startVideoRecording = useCallback(async ({ cameraStream, audioStream }) => {
    if (
      isStartedRef.current ||
      (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording")
    ) {
      return true;
    }

    if (!cameraStream) {
      console.warn("Cannot start video recording: cameraStream is missing");
      return false;
    }

    isStartedRef.current = true;
    chunksRef.current = [];
    await clearChunksIDB();

    try {
      const liveVideoTracks = cameraStream
        .getVideoTracks()
        .filter((t) => t.readyState === "live");

      if (liveVideoTracks.length === 0) {
        console.warn("MediaRecorder: No active live video tracks available.");
        isStartedRef.current = false;
        return false;
      }

      const tracks = [...liveVideoTracks];

      // Optional separate audio track if provided (cloned to avoid resource contention)
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => {
          try {
            if (track.readyState === "live") {
              tracks.push(track.clone());
            }
          } catch (_) {
            tracks.push(track);
          }
        });
      }

      const combinedStream = new MediaStream(tracks);
      const mimeType = getSupportedMimeType();

      // Configure recorder with fail-safe fallback options
      const attachListeners = (rec) => {
        rec.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
            await saveChunkToIDB(e.data);
          }
        };

        rec.onerror = (e) => {
          console.warn("MediaRecorder runtime warning:", e.error);
        };

        rec.onstart = () => {
          setIsRecordingVideo(true);
          console.log("🎥 Session video recording started.");
        };

        rec.onstop = () => {
          setIsRecordingVideo(false);
          isStartedRef.current = false;
          mediaRecorderRef.current = null;
          console.log("⏹️ Session video recording stopped.");
        };
      };

      const startRecorderSafely = (r) => {
        try {
          r.start(5000);
        } catch (_) {
          r.start();
        }
      };

      let recorder = null;

      // Tier 1: Preferred format with bitrate limits
      if (mimeType) {
        try {
          const rec = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 450000,
          });
          attachListeners(rec);
          startRecorderSafely(rec);
          recorder = rec;
        } catch (_) {
          recorder = null;
        }
      }

      // Tier 2: Preferred format without specific bitrate limits
      if (!recorder && mimeType) {
        try {
          const rec = new MediaRecorder(combinedStream, { mimeType });
          attachListeners(rec);
          startRecorderSafely(rec);
          recorder = rec;
        } catch (_) {
          recorder = null;
        }
      }

      // Tier 3: Browser default format
      if (!recorder) {
        try {
          const rec = new MediaRecorder(combinedStream);
          attachListeners(rec);
          startRecorderSafely(rec);
          recorder = rec;
        } catch (tier3Err) {
          console.warn("MediaRecorder default initialization notice:", tier3Err.message);
          isStartedRef.current = false;
          return false;
        }
      }

      mediaRecorderRef.current = recorder;
      return true;
    } catch (err) {
      isStartedRef.current = false;
      console.warn("Session video recording unavailable in current environment:", err.message);
      return false;
    }
  }, []);

  /**
   * Stop recording and finalize video Blob
   */
  const stopVideoRecording = useCallback(() => {
    isStartedRef.current = false;
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = () => {
          setIsRecordingVideo(false);
          const mimeType = getSupportedMimeType() || "video/webm";
          const finalBlob = new Blob(chunksRef.current, { type: mimeType });
          resolve(finalBlob);
        };
        recorder.stop();
      } else {
        setIsRecordingVideo(false);
        const mimeType = getSupportedMimeType() || "video/webm";
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        resolve(finalBlob);
      }
    });
  }, []);

  /**
   * Upload recorded video to backend server
   */
  const uploadSessionVideo = useCallback(
    async (sessionId, videoBlob) => {
      if (!sessionId || !videoBlob || videoBlob.size === 0) {
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
        formData.append("video", videoBlob, `interview-${sessionId}.${ext}`);

        const response = await axios.post(
          `/interview/sessions/${sessionId}/video-recording`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percent);
              }
            },
          }
        );

        if (response.data.success) {
          const url = response.data.data.videoRecordingUrl;
          setRecordedVideoUrl(url);
          await clearChunksIDB();
          return url;
        }
        return null;
      } catch (err) {
        console.error("Failed to upload video recording:", err);
        toast.error("Video recording upload encountered an issue, but your answers were preserved.");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    isRecordingVideo,
    isUploading,
    uploadProgress,
    recordedVideoUrl,
    startVideoRecording,
    stopVideoRecording,
    uploadSessionVideo,
  };
}

export default useVideoRecorder;

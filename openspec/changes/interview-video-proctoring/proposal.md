# Proposal: Interview Video Integration & AI Anti-Cheat Proctoring Pipeline

## Why

As the platform transitions from basic text/audio practice to high-stakes, job-ready technical interviews, candidates and hiring managers require verified interview integrity. Without video integration and automated proctoring, interviews are vulnerable to external cheating—such as reading answers off smartphones, receiving verbal assistance from a secondary person in the room, switching browser tabs to ChatGPT, or consulting off-screen second monitors.

Adding automated edge AI proctoring and video recording enables real-time candidate verification, trust scoring, and replay auditing with zero cloud GPU hosting overhead.

## What Changes

- **Webcam Media Stream & Stage Integration**: Implement direct webcam feed integration via `navigator.mediaDevices.getUserMedia`, replacing the placeholder camera badge in `ExecutiveStudioStage` with a live candidate video window (supporting Picture-in-Picture and Side-by-Side stage layouts).
- **Video Pre-Flight Hardware Check**: Add camera and lighting verification to the interview setup flow (`SetupStep.jsx`) to confirm facial alignment and camera functionality before a session starts.
- **Continuous Local Video & Audio Recording**: Utilize the browser `MediaRecorder` API to capture the session video stream (WebM/MP4 format) and upload it upon interview completion to the backend storage/cloud bucket for audit replay.
- **Client-Side Edge Anti-Cheat Engine (`@mediapipe/tasks-vision`)**:
  - **Mobile Phone / Prohibited Device Detection**: Periodic lightweight object detection scanning for smartphones, tablets, or books with temporal debouncing (flagged only if sustained $\ge 1.5$s).
  - **Gaze Tracking & Head Pose Deviation**: 478-point 3D Face Landmarker + iris tracking computing head yaw/pitch/roll and eye vector deviation (flagged if candidate looks away from screen $\ge 3.0$s).
  - **Presence & Multi-Person Detection**: Real-time face count tracking flagging "Candidate Absent" (0 faces $\ge 4$s) or "Unauthorized Person Present" (>1 faces $\ge 2$s).
- **Browser Environment Integrity Watchdog**: Event listeners tracking tab switching (`visibilitychange`), loss of window focus (`window.onblur`), fullscreen exits, and unauthorized paste events.
- **Evidentiary Snapshot & Violation Log Streaming**: Capture lightweight, compressed WebP snapshots (~20KB) at the exact moment of confirmed infractions and send structured violation telemetry to the backend.
- **Trust & Integrity Scoring Engine**: Dynamic integrity score calculation (0–100%) stored in `InterviewSession` and `InterviewResult`, providing recruiters and candidates with a violation timeline and flagged video markers.

## Capabilities

### New Capabilities
- `interview-video-capture`: Webcam media stream ingestion, hardware pre-flight verification, UI video stage rendering (PiP / side-by-side), and session video recording with upload.
- `ai-proctoring-analysis`: Client-side edge computer vision pipeline detecting phone usage, gaze deviation, multiple faces, face absence, and browser focus loss.
- `proctoring-integrity-audit`: Backend proctoring schema, infraction telemetry ingestion, weighted trust score calculation, evidentiary snapshot management, and recruiter audit timeline UI.

### Modified Capabilities
<!-- None: No existing specs exist in the repository prior to this proposal -->

## Impact

- **Frontend Dependencies**: Adds `@mediapipe/tasks-vision` for edge computer vision inference (FaceLandmarker and ObjectDetector via WebAssembly and WebGL).
- **Client Components**:
  - `client/src/components/interview/ExecutiveStudioStage.jsx`: Renders live webcam stream and proctoring status HUD.
  - `client/src/components/interview/SetupStep.jsx`: Adds camera test, lighting feedback, and permission guidance.
  - `client/src/components/interview/ResultStep.jsx`: Displays Integrity & Proctoring summary card and violation timeline.
  - New custom hooks: `useCameraStream.js`, `useProctoringEngine.js`, `useVideoRecorder.js`.
- **Backend Models & Routes**:
  - `server/models/InterviewSession.model.js`: Adds `videoRecordingUrl`, `proctoringEvents`, and `proctoringSummary`.
  - `server/models/InterviewResult.model.js`: Stores final `integrityScore`, `infractionBreakdown`, and evidentiary snapshots.
  - New route: `POST /api/interview/:sessionId/proctoring/event` and `POST /api/interview/:sessionId/video-recording` with Multer upload handling.
- **Performance & Costs**: Running inference client-side on-device avoids cloud GPU streaming costs (\$0 GPU server bill) and preserves candidate video privacy.

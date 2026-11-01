# Tasks: Interview Video Integration & AI Proctoring Pipeline

## 1. Edge ML Dependencies & Vision Pipeline Setup

- [x] 1.1 Add `@mediapipe/tasks-vision` dependency to `client/package.json` and verify library import and Wasm fileset resolution
- [x] 1.2 Implement vision service utility `client/src/lib/vision/visionModels.js` and `gazeCalculator.js` to initialize and cache `FaceLandmarker` and `ObjectDetector` models with GPU/CPU delegate fallback

## 2. Webcam Capture & Pre-Flight Hardware Verification

- [x] 2.1 Create custom hook `client/src/components/interview/hooks/useCameraStream.js` to manage webcam `MediaStream` acquisition, constraints (720p @ 24-30fps), error handling, and device switching
- [x] 2.2 Update `client/src/components/interview/SetupStep.jsx` to include an interactive camera pre-flight check with live preview, facial centering oval, and permission troubleshooting
- [x] 2.3 Integrate live candidate camera feed into `client/src/components/interview/ExecutiveStudioStage.jsx`, replacing the "Camera Standby" badge with a Picture-in-Picture / Side-by-Side stage toggle

## 3. Session Video Recording & Upload Pipeline

- [x] 3.1 Implement custom hook `client/src/components/interview/hooks/useVideoRecorder.js` using browser `MediaRecorder` with 5-second chunk slicing and IndexedDB persistence
- [x] 3.2 Add backend route and controller endpoint `POST /api/interview/:sessionId/video-recording` in `server/routes/interview.routes.js` with Multer disk storage and session URL association
- [x] 3.3 Connect video recording lifecycle to interview session start, question transitions, and completion in `client/src/pages/AIInterview.jsx`

## 4. Real-Time Edge Anti-Cheat & Proctoring Engine

- [x] 4.1 Implement custom hook `client/src/components/interview/hooks/useProctoringEngine.js` with FaceLandmarker loop calculating 3D head yaw/pitch and eye gaze deviation with temporal debouncing (>= 3.0s)
- [x] 4.2 Add periodic 1 Hz ObjectDetector scan for `cell phone`, `laptop`, and `book` with >= 1.5s confirmation window
- [x] 4.3 Add presence and multi-person detection tracking face count (flagging 0 faces for >= 4.0s and >1 faces for >= 2.0s)
- [x] 4.4 Add browser watchdog listeners for `visibilitychange` (tab switch), `window.onblur`, and textarea paste event interception
- [x] 4.5 Add canvas evidentiary snapshot generator producing lightweight compressed WebP thumbnails (~20KB) upon confirmed violations

## 5. Backend Schema & Telemetry Logging

- [x] 5.1 Extend `server/models/InterviewSession.model.js` and `server/models/InterviewResult.model.js` with `proctoringEvents`, `proctoringSummary`, and `integrityScore`
- [x] 5.2 Create endpoint `POST /api/interview/:sessionId/proctoring/event` in `server/controllers/interview.controller.js` to ingest, validate, and append telemetry infraction events
- [x] 5.3 Implement dynamic integrity score algorithm calculating weighted deductions for confirmed infractions

## 6. Review UI & End-to-End Verification

- [x] 6.1 Update `client/src/components/interview/ResultStep.jsx` to render the "Integrity & Proctoring Scorecard" with interactive timeline markers, violation summaries, and snapshot previews
- [x] 6.2 Add subtle in-stage proctoring status indicator (green/amber shield pill) in `ExecutiveStudioStage.jsx`
- [x] 6.3 Verify end-to-end functionality via test scripts, ensure no UI frame drops, and verify linting with `npm run lint`

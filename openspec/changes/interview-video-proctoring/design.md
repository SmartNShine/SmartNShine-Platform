# Technical Design: Interview Video Integration & Edge AI Proctoring

## Context

The current interview system (`client/src/pages/AIInterview.jsx`, `client/src/components/interview/ExecutiveStudioStage.jsx`) provides real-time audio conversation using Web Audio API frequency analysis, Sarvam AI / Chatterbox / Whisper STT/TTS, and dynamic question evaluation. While the stage UI contains a placeholder "Camera Standby" badge, there is currently no active video capture, no candidate video recording, and no automated anti-cheat or proctoring mechanisms.

See `proposal.md` for the core motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Provide seamless, hardware-accelerated webcam capture and picture-in-picture / split-stage video rendering.
- Execute real-time anti-cheat detection on-device (client-side edge ML):
  - Cell phone / mobile device detection.
  - Gaze tracking and head pose estimation (yaw, pitch, roll) to detect looking away or reading off-screen notes.
  - Candidate presence and multi-person detection (flagging 0 faces or >1 faces).
  - Browser focus integrity (tab switching, window blur, paste prevention).
- Capture evidentiary snapshots at infraction moments and stream structured telemetry to the backend.
- Record the candidate's session video using browser `MediaRecorder` and store it for evaluator audit.
- Compute an automated Integrity Score (0–100%) and render an interactive audit timeline in results.

**Non-Goals:**
- Continuous server-side cloud GPU video stream decoding (avoiding massive \$1,000s/mo cloud GPU infrastructure costs).
- Biometric facial recognition matching against government IDs (focus is on behavioral integrity and cheat deterrence).
- Secondary external room surveillance camera / 360-degree mirror requirement.

## Architectural Decisions

```
+-----------------------------------------------------------------------------------+
| CANDIDATE BROWSER (React + Vite + Wasm/WebGL)                                     |
|                                                                                   |
|  +--------------------+       +------------------------------------------------+  |
|  | navigator          |       | @mediapipe/tasks-vision (WebAssembly / GPU)   |  |
|  | .mediaDevices      | ----> | - FaceLandmarker: 478 3D points + iris mesh    |  |
|  | .getUserMedia()    |       |   -> Head Pose (Yaw/Pitch) & Eye Gaze Vector   |  |
|  +---------+----------+       |   -> Face Count (0 = Absent, >1 = Multi-person)|  |
|            |                  | - ObjectDetector (EfficientDet-Lite0):         |  |
|            v                  |   -> Cell Phone / Mobile Device Detection      |  |
|  +--------------------+       +-----------------------+------------------------+  |
|  | MediaRecorder      |                               |                           |
|  | (Audio + Video)    |                               v                           |
|  | -> WebM Chunks     |                 +----------------------------+            |
|  +---------+----------+                 | Proctoring Watchdog Hook   |            |
|            |                            | - Temporal Debouncing      |            |
|            | (On Complete)              | - Violation Filter (>=1.5s)|            |
|            |                            | - Canvas Snapshot Capture  |            |
|            |                            +--------------+-------------+            |
+------------|-------------------------------------------|--------------------------+
             |                                           |
             | Video Blob Upload                         | Telemetry + Snapshot
             v                                           v
+-----------------------------------------------------------------------------------+
| BACKEND SERVER (Node.js / Express / MongoDB)                                      |
|                                                                                   |
|  +-----------------------------------+       +---------------------------------+  |
|  | POST /api/interview/:id/recording |       | POST /api/interview/:id/event   |  |
|  | -> Multer -> Local/Cloud Storage  |       | -> Validate & Append to Session |  |
|  +-----------------+-----------------+       +----------------+----------------+  |
|                    |                                          |                   |
|                    v                                          v                   |
|  +-----------------------------------------------------------------------------+  |
|  | Mongoose Models:                                                            |  |
|  | - InterviewSession: proctoringEvents[], proctoringSummary, videoUrl         |  |
|  | - InterviewResult: integrityScore (0-100), auditTimeline, snapshots         |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### 1. Client-Side Edge ML vs. Cloud Server Inference
- **Decision**: Run `@mediapipe/tasks-vision` (FaceLandmarker + ObjectDetector) directly in the candidate's browser via WebAssembly (Wasm) and WebGL hardware acceleration (`delegate: "GPU"`).
- **Rationale**:
  - Processing video frames on a cloud server via WebRTC requires dedicated GPU instances (e.g. AWS g4dn / GCP T4), costing \$0.50–\$1.50 per stream hour. At scale, this is economically prohibitive.
  - Edge ML eliminates streaming latency and guarantees zero raw-video transmission over the network during live questioning.
  - Only when an infraction is confirmed (after temporal debouncing) is a compressed 320x240 WebP snapshot (~20KB) sent to the backend.
- **Alternatives Considered**:
  - *Cloud WebRTC SFU + PyTorch*: Rejected due to high server hosting costs, bandwidth saturation, and privacy compliance hurdles.
  - *TensorFlow.js (Standalone)*: MediaPipe Tasks-Vision was chosen over pure TF.js because Google's Wasm runtime is 3x faster, has official iris landmarks built-in, and provides pre-quantized models.

### 2. Adaptive Inference Frequencies (CPU/GPU Throttle Protection)
- **Decision**: Decouple model execution frequencies based on detection urgency:
  - **Face Landmarker (Head Pose & Gaze)**: Runs at 10–12 FPS inside `requestAnimationFrame`. Faces move continuously, but 10 FPS is more than sufficient to detect steady orientation shifts while consuming < 8% CPU.
  - **Object Detector (Mobile Phone)**: Runs at 1 FPS (once every 1000ms). Candidates cannot pick up, read, and hide a phone in under 1 second; scanning at 1 Hz cuts computational overhead by 90%.
- **Alternatives Considered**: Running both models at full 30 FPS. Rejected because candidate laptops could experience fan noise, thermal throttling, or stutter during speech recognition.

### 3. Temporal Debouncing & False Positive Elimination
- **Decision**: Require multi-frame sustained state before triggering infractions:
  - *Phone Detection*: Must be detected with confidence $\ge 0.60$ across at least 2 consecutive frames (~1.5s window).
  - *Gaze / Head Away*: Natural cognitive pauses and glances are ignored. Violation logged only if yaw/pitch $> 25^\circ$ or gaze is off-screen for $\ge 3.0$ consecutive seconds.
  - *Candidate Absent*: Logged only if 0 faces detected for $\ge 4.0$ consecutive seconds.
  - *Multiple Faces*: Logged if $\ge 2$ faces persist for $\ge 2.0$ seconds.

### 4. UI Stage Integration in `ExecutiveStudioStage.jsx`
- **Decision**: Replace the static camera placeholder with a dynamic PiP camera box located at the top-right of the 16:9 meeting canvas, toggleable to a Side-by-Side split view.
- Visual feedback is non-distracting:
  - A subtle security shield pill in the frame header:
    - Green (`Verified & In Frame`)
    - Amber pulsing (`Looking Away` / `Re-center Face`)
    - Red outline with gentle prompt if phone or multiple faces appear.

### 5. MediaRecorder Video Capture & Fail-Safe Upload
- **Decision**: Use `MediaRecorder` configured with `video/webm;codecs=vp8,opus` (fallback to `video/mp4` on Safari) with `timeslice: 5000` (5-second chunk slices).
- Chunks are stored in memory and incrementally written to an IndexedDB buffer.
- On interview completion, the combined video blob is uploaded to `/api/interview/:sessionId/video-recording`. If the candidate's connection drops, the local IndexedDB buffer allows resumption without losing the video.

## Risks / Trade-offs

- **[Risk: Low-end candidate devices or disabled hardware acceleration]**  
  → *Mitigation*: Fallback to `delegate: "CPU"` with automatic frame throttling (lowering Face Landmarker to 5 FPS and Object Detector to 0.5 FPS). If device fails hardware checks during setup, display an advisory to close background tabs.
- **[Risk: Lighting changes or eyeglasses affecting iris tracking]**  
  → *Mitigation*: Combine eye iris vector with 3D head pose Euler angles (yaw and pitch). If head pose is facing forward within $\pm 15^\circ$, minor iris jitter is damp-filtered to prevent false positives.
- **[Risk: Large video upload failure after 30-minute interview]**  
  → *Mitigation*: Cap recording resolution at 720p (1280x720) @ 24fps with variable bitrate (~600 kbps), yielding ~130MB for a 30-minute session. IndexedDB backup ensures the user can re-upload if network drops at the final step.
- **[Risk: Browser permissions denied for camera]**  
  → *Mitigation*: Interactive pre-flight diagnostic in `SetupStep.jsx` tests camera and mic before interview generation, providing direct browser permission guides.

## Schema & API Extensions

### 1. `InterviewSession.model.js` additions:
```javascript
{
  hasVideoRecording: { type: Boolean, default: false },
  videoRecordingUrl: { type: String, default: null },
  proctoringEvents: [
    {
      timestampSeconds: Number,
      eventType: {
        type: String,
        enum: [
          "PHONE_DETECTED",
          "MULTIPLE_FACES",
          "FACE_ABSENT",
          "GAZE_DEVIATION",
          "TAB_SWITCH",
          "WINDOW_BLUR",
          "PASTE_ATTEMPT"
        ]
      },
      severity: { type: String, enum: ["low", "medium", "high"] },
      confidence: Number,
      snapshotUrl: String,
      details: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  proctoringSummary: {
    integrityScore: { type: Number, min: 0, max: 100, default: 100 },
    flagCounts: {
      phone: { type: Number, default: 0 },
      gaze: { type: Number, default: 0 },
      multipleFaces: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      tabSwitch: { type: Number, default: 0 }
    },
    verdict: {
      type: String,
      enum: ["VERIFIED_CLEAN", "REVIEW_RECOMMENDED", "FLAGGED_SUSPICIOUS"],
      default: "VERIFIED_CLEAN"
    }
  }
}
```

### 2. New Backend Endpoints:
- `POST /api/interview/:sessionId/proctoring/event`: Receives violation event payload and optional base64 WebP snapshot.
- `POST /api/interview/:sessionId/video-recording`: Multer multipart endpoint receiving the final session video file.
- `GET /api/interview/:sessionId/proctoring/report`: Returns the proctoring summary and timeline for recruiter/candidate review.

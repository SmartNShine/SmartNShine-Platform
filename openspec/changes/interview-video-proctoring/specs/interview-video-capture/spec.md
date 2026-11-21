# Spec Delta: Interview Video Capture

## Purpose

Provides webcam media capture, video device pre-flight checking, real-time candidate video rendering within the interview stage, and full-session video recording.

## ADDED Requirements

### Requirement: Webcam Pre-Flight and Permissions
The system MUST verify camera access and stream readiness before allowing a candidate to enter the live interview stage.

#### Scenario: User grants camera permission successfully
- **WHEN** the candidate accesses the interview setup step and clicks camera test
- **THEN** the system requests getUserMedia video stream and renders the live camera preview with an active device status badge

#### Scenario: User denies camera permission
- **WHEN** the candidate denies camera access in the browser permission prompt
- **THEN** the system displays a clear warning toast and troubleshooting instructions to re-enable camera access before proceeding

### Requirement: Live Video Stage Rendering
The system MUST display the candidate's real-time webcam feed inside the executive interview stage alongside the interviewer persona.

#### Scenario: Active interview stage display
- **WHEN** a live video interview session is in progress
- **THEN** the system renders the candidate camera feed in a picture-in-picture viewport with posture guides and a proctoring status pill

#### Scenario: Candidate toggles video stage layout
- **WHEN** the user switches between Picture-in-Picture and Side-by-Side stage mode
- **THEN** the stage dynamically updates the video layout without interrupting the camera media stream or audio visualizers

### Requirement: Session Video Recording and Upload
The system MUST record the candidate's combined video and audio stream throughout the session and upload the recorded file upon interview completion.

#### Scenario: Successful recording capture and upload
- **WHEN** the interview session concludes or the candidate finishes the final question
- **THEN** the system finalizes the MediaRecorder output and sends the video file to the server recording storage endpoint

#### Scenario: Network interruption during upload
- **WHEN** the final recording upload fails due to temporary network loss
- **THEN** the system caches the recording blob locally in IndexedDB and offers a retry prompt to prevent loss of interview evidence

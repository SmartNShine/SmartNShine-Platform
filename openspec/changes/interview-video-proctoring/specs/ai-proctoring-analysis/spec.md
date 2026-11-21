# Spec Delta: AI Proctoring Analysis

## Purpose

Executes on-device computer vision and browser event monitoring to detect cheating behaviors including mobile phone usage, looking away, multiple faces, absence, and tab switching.

## ADDED Requirements

### Requirement: Mobile Phone and Prohibited Device Detection
The system MUST perform periodic lightweight object detection on video frames to detect cell phones, tablets, or cheat sheets held by or near the candidate.

#### Scenario: Mobile phone held in camera view
- **WHEN** an object classified as a cell phone is detected with confidence >= 0.60 for at least 1.5 consecutive seconds
- **THEN** the system triggers a PHONE_DETECTED infraction flag, records the timestamp, and triggers an evidentiary frame snapshot

#### Scenario: Incidental hand movement without device
- **WHEN** the candidate gestures with empty hands or holds a coffee mug
- **THEN** the detector does not trigger a phone violation flag, avoiding false positive alerts

### Requirement: Gaze Deviation and Head Pose Tracking
The system MUST track 3D facial landmarks and iris position to estimate head pose orientation and eye gaze deviation from the screen.

#### Scenario: Candidate looks away or reads off-screen notes
- **WHEN** the candidate turns their head (yaw/pitch > 25 degrees) or shifts iris gaze away from the screen for longer than 3.0 seconds
- **THEN** the system displays a gentle reminder badge ("Please focus on your screen") and logs a GAZE_DEVIATION flag if sustained past 5.0 seconds

#### Scenario: Natural conversational glances and blinks
- **WHEN** the candidate briefly glances away or blinks for under 2.0 seconds while thinking
- **THEN** no violation is logged, treating the glance as natural cognitive contemplation

### Requirement: Face Presence and Multi-Person Detection
The system MUST continuously count the number of human faces detected in the video stream to ensure identity continuity and prevent unauthorized assistance.

#### Scenario: Candidate leaves the camera view
- **WHEN** zero faces are detected in the video stream continuously for 4.0 seconds or longer
- **THEN** the system logs a FACE_ABSENT warning and records the duration of absence

#### Scenario: Secondary person enters the room
- **WHEN** two or more faces are detected simultaneously in the video frame for at least 2.0 seconds
- **THEN** the system flags a MULTIPLE_FACES security violation with an evidence snapshot captured for review

### Requirement: Browser Environment and Focus Integrity
The system MUST monitor browser window visibility, document focus, and unauthorized clipboard operations during the interview.

#### Scenario: Candidate switches browser tabs
- **WHEN** the browser tab visibility state changes to hidden or the window loses focus
- **THEN** the system immediately logs a TAB_SWITCH or WINDOW_BLUR infraction and notes the elapsed duration out of focus

#### Scenario: Candidate attempts to paste text into answer input
- **WHEN** a clipboard paste event is triggered in the interview answer textarea
- **THEN** the system blocks external clipboard insertion and displays a notice that answers must be formulated organically

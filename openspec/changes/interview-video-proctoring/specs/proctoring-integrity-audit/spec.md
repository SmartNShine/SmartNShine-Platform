# Spec Delta: Proctoring Integrity Audit

## Purpose

Aggregates proctoring telemetry, calculates interview trust and integrity scores, stores evidentiary violation logs, and surfaces interactive audit timelines for review.

## ADDED Requirements

### Requirement: Weighted Integrity Score Calculation
The system MUST compute an overall Interview Integrity Score (0 to 100%) based on weighted penalties for confirmed infractions during the session.

#### Scenario: Clean interview session with no infractions
- **WHEN** the candidate completes the entire interview with zero confirmed proctoring flags
- **THEN** the system issues an Integrity Score of 100% with a "VERIFIED_CLEAN" compliance verdict

#### Scenario: Severe infractions detected during session
- **WHEN** confirmed infractions occur (e.g. phone detected at -15 points, secondary person at -15 points, tab switches at -5 points each)
- **THEN** the system deducts points from the baseline score and marks the session status as "FLAGGED_FOR_REVIEW" if the score drops below 80%

### Requirement: Evidentiary Snapshot Capture and Storage
The system MUST capture compressed image snapshots at the exact moment of high-severity infractions to provide visual evidence for human audit.

#### Scenario: High-severity violation triggered
- **WHEN** a PHONE_DETECTED or MULTIPLE_FACES event is confirmed
- **THEN** the client captures a compressed 320x240 WebP frame from the canvas and transmits it with the violation telemetry payload to the server

#### Scenario: Snapshot storage and association
- **WHEN** the backend receives the violation event payload
- **THEN** it stores the snapshot image reference in the InterviewSession proctoring event log with an exact video timestamp offset

### Requirement: Interactive Recruiter Audit Timeline
The system MUST present an interactive audit timeline in the interview results view displaying all flagged moments with visual evidence.

#### Scenario: Reviewing flagged moments in results
- **WHEN** an evaluator or candidate navigates to the interview result proctoring section
- **THEN** the system displays a chronological event timeline with colored severity badges, violation descriptions, and expandable evidence snapshots

#### Scenario: Synchronized video playback jumping
- **WHEN** the reviewer clicks a flagged moment on the timeline
- **THEN** the embedded video player jumps directly to that timestamp in the session video recording for immediate visual verification

# AI Interview — Security & Anti-Cheating Plan

Status: in progress (S0, S1, S2 core done) · Created 2026-11-23 · Owner: @atharva038
Related: [interview-upgrade-plan.md](interview-upgrade-plan.md)

## 1. Goal

Make it hard to cheat in an AI interview, easy to spot when someone tries, and fair to honest candidates.

- **Deter:** candidates know what is monitored before they start.
- **Detect:** catch the common cheating methods with signals that hold up to review.
- **Decide with evidence:** reviewers (TPO / admin) see a timeline with snapshots and video timestamps.
  The system **flags**; a human **decides**. No automatic fail on a single signal.

Out of scope: certifying identity like a government exam, and blocking every possible desktop tool
(a browser cannot see other apps). We aim to make cheating *costly and visible*, not impossible.

---

## 2. Threat model — how people actually cheat in a voice interview

| # | Method | Today | Planned defence |
|---|---|---|---|
| T1 | AI copilot app listens and shows answers (Cluely, Final Round AI, ChatGPT voice on a phone) | Partly (phone, gaze) | Reading-pattern gaze, answer-delivery analysis, typing sounds, adaptive follow-ups |
| T2 | Second screen / second laptop with notes or ChatGPT | Gaze only | Multi-screen check, reading-pattern gaze, fullscreen |
| T3 | Phone held below the camera / on the desk | Yes (restored 2026-11-23) | Keep; add "look-down" gaze pattern |
| T4 | Friend in the room whispering answers | Multiple faces only if visible | Lip-sync vs audio, second-voice detection |
| T5 | Someone else takes the interview (proxy) | Identity continuity (geometry) | Start-of-interview liveness + reference selfie, voice consistency |
| T6 | Pre-recorded / deepfake video via virtual camera | No | Virtual device block, liveness challenge, random mid-interview check |
| T7 | Switching tabs / apps to search | Tab switch + blur (count only) | Fullscreen, time-away duration, multi-tab lock |
| T8 | Pasting prepared text (text mode) | Paste event | Keep; add typing-rhythm signal |
| T9 | Faking timing / scripting the API | Client timer only | Server-authoritative timing, per-question tokens |
| T10 | Leaked questions between students (TPO batch) | No | Adaptive + randomised blueprints per candidate |
| T11 | Tampering with the client (disable proctoring JS) | Heartbeat + offline watchdog | Signed heartbeats with detector health, required signals for "proctored" mode |

---

## 3. What already exists (baseline)

**Client** (`client/src/components/interview/hooks/useProctoringEngine.js`, `proctoring/temporalEvidence.js`)
- MediaPipe FaceLandmarker (multiple faces, face absent, gaze/head pose, face-geometry continuity).
- MediaPipe ObjectDetector (phone; sensitivity restored on 2026-11-23).
- `TemporalEvidence` turns per-frame samples into sustained events (duration, frame count, ratio, confidence floor).
- Browser events: `TAB_SWITCH`, `WINDOW_BLUR`, `PASTE_ATTEMPT`.
- Snapshots (320×240 webp) attached to severe events; full session video upload (`useVideoRecorder`, 450 kbps).

**Server** (`server/services/proctoring-scoring.js`, `proctoring.service.js`)
- `EVENT_WEIGHTS`, `scoreProctoringEvents` → `integrityScore` + verdict
  (`VERIFIED_CLEAN` / `REVIEW_RECOMMENDED` / `FLAGGED_SUSPICIOUS`).
- Heartbeat with a 60 s grace period; watchdog emits `PROCTORING_OFFLINE`.
- Events stored in `InterviewSession.proctoringEvents` (**enum-restricted**: each new event type needs a model change).

**Review UI**: `proctoring/IntegrityTimeline.jsx`, `ProctoringBadge.jsx`.

**Adding a new signal touches:** client `DETAILS` + detection, `temporalEvidence` `RULES` (if frame-based),
`InterviewSession` event enum, `EVENT_WEIGHTS` + `countKey` in `proctoring-scoring.js`, `IntegrityTimeline` labels,
and tests in `server/tests/proctoring.test.js`.

---

## 4. Principles

1. **Two proctoring levels.**
   - `practice` (default, self-started): light monitoring, gentle nudges, integrity score shown but never blocks.
   - `proctored` (TPO assessment / opt-in): fullscreen required, liveness + reference selfie, device checks block the
     start, all signals on, strict verdict thresholds, and a review queue for the TPO.
   Stored as `session.proctoringLevel`; every signal below says which level enables it.
2. **Several signals, not one.** A verdict needs corroboration (e.g. reading gaze + delivery anomaly), except for
   hard evidence (a second face, a phone, a virtual camera in proctored mode).
3. **Evidence over accusation.** Each event stores confidence, duration, detector version, a snapshot and a video
   timestamp. Candidate-facing copy is neutral ("Please keep your eyes on the screen"), never "cheating detected".
4. **Server is the source of truth** for timing, the event log and verdicts. The client is untrusted.
5. **Privacy by design.** Consent screen, minimal retention, no biometric template leaves the device unless needed,
   compliant with India's DPDP Act 2023 (consent, purpose limitation, deletion on request).
6. **Measure false positives** before tightening anything. Every detector ships behind a flag with a version string.

---

## 5. Architecture

```
          ┌──────────────── client (untrusted) ─────────────────┐
camera ──►│ vision: faces · gaze · phone · lip motion · liveness │
mic    ──►│ audio: voice activity · typing · second voice        │──► TemporalEvidence ──► events ─┐
browser──►│ env: fullscreen · focus · screens · devices · tabs   │                                  │
          └──────────────────────────────────────────────────────┘                                  ▼
                                                    POST /proctoring/event  (signed, rate-limited)
                                                    POST /proctoring/heartbeat (health + signal coverage)
          ┌──────────────── server (authoritative) ────────────────────────────────────────────────┐
          │ question tokens + timestamps · answer timing checks · delivery analysis (transcript)   │
          │ event store (enum) · scoreProctoringEvents v2 (corroboration) · watchdog               │
          └───────────────────────────────┬────────────────────────────────────────────────────────┘
                                          ▼
                       InterviewResult.integrity  →  report · IntegrityTimeline · TPO review queue
```

---

## 6. Phases & checklists

Effort: S ≤ 1 day · M 2–3 days · L ≥ 1 week.

### Phase S0 — Foundation (do first) · M

- [x] `proctoringLevel: "practice" | "proctored"` on `InterviewSession` (default `practice`); passed from setup
      (TPO-assigned assessments set `proctored`). Return it in the session payload.
- [x] Event catalog in one shared module (`server/services/proctoring-events.js`): type, default severity, weight,
      levels where it is active, candidate-facing message, reviewer label. The model enum, `EVENT_WEIGHTS`,
      `countKey` and client `DETAILS` are generated from or checked against it (test).
- [x] Consent and briefing screen before start: what is monitored, why, and how long it is kept; checkbox required.
      Store `consent: { acceptedAt, version, level }` on the session.
- [ ] Event payload hardening: cap `meta` size, whitelist meta keys per event, reject unknown types (400),
      per-session rate limit on `/proctoring/event` (already has `interviewProctoringLimiter`; add a per-session cap).
- [x] `detectorVersion` per signal family (`vision-3`, `audio-1`, `env-1`) for later false-positive analysis.

### Phase S1 — Quick wins: environment & device · M

| Signal | Event type | Level | Detection | Action |
|---|---|---|---|---|
| Fullscreen | `FULLSCREEN_EXIT` | proctored (practice: nudge only) | `requestFullscreen` at start; `fullscreenchange` | Overlay "Return to fullscreen" button, pause the answer timer, log duration away |
| Time away | extend `TAB_SWITCH` / `WINDOW_BLUR` with `durationMs` | both | `visibilitychange` / `blur` → `focus` | Weight scales with duration (< 2 s minor, > 10 s major) |
| Second screen | `MULTI_SCREEN` | proctored blocks start; practice logs | `window.screen.isExtended` (Chromium); re-check every 30 s and on `screenschange` (Screen Details API, when permitted) | Pre-check: "Disconnect extra displays to continue" |
| Virtual camera/mic | `VIRTUAL_DEVICE` | proctored blocks; practice logs | Device label denylist: OBS, ManyCam, Snap Camera, XSplit, mmhmm, CamTwist, NVIDIA Broadcast (allowed?), "Virtual", VB-Audio, BlackHole, Loopback | Pre-check blocks; mid-interview device switch to a virtual device → high severity |
| Duplicate tab/session | `MULTI_SESSION` | both | `BroadcastChannel("smartnshine-interview")` ping; server rejects a second active session per user | Second tab shows "Interview open in another tab" |
| Picture-in-picture / resize | `WINDOW_RESIZE` | proctored | Window < 70% of screen width or height for > 5 s | Nudge |
| Copy / context menu | `COPY_ATTEMPT` | proctored | `copy`, `contextmenu` on the question card | Block + log (low) |
| DevTools | — | — | **Skip.** Unreliable and easy to bypass; heartbeat integrity covers tampering better |

- [x] Implement `useEnvironmentGuard()` hook (fullscreen, focus duration, screens, devices, tabs, resize).
- [x] Pre-flight "System check" step in `SetupStep` for proctored mode (blocks start on failures, with fix-it copy).
- [x] Pause the turn timer while fullscreen is exited (reuse `turnFlow.pause()`).
- [x] Tests: event catalog, payload validation, scoring weights by duration.

### Phase S1.5 — Screen sharing (proctored only) · S–M

Proves what was on screen when the candidate left the interview. It does **not** catch copilot overlays built to
hide from screen capture (Cluely, Final Round AI): S3/S4 cover those. A second monitor stays `MULTI_SCREEN`, since
browsers let the user share only one screen. A phone on the desk is the camera's job. Mobile browsers can't share
the screen, so proctored mode is desktop-only.

| Step | Behaviour |
|---|---|
| Start | Setup → **Monitoring check** screen (`MonitoringCheckStep`: camera + mic, system check, consent) → "Share screen & start interview" runs `getDisplayMedia` (entire screen preferred, 1–2 fps, no audio) and fullscreen in the same click, then creates the session |
| Verify | `displaySurface === "monitor"`; a window/tab → ask once more, then accept + `SCREEN_SHARE_PARTIAL`. Non-Chromium browsers don't report the surface → status `unknown`, not blocked |
| Unavailable / declined | Optional share (self-chosen proctored): start + `SCREEN_SHARE_UNAVAILABLE`. Required share (`screenShare.required`, TPO assessments later): start blocked, client and server |
| Stopped sharing | Dialog "Share your screen again", timer paused; resuming logs `SCREEN_SHARE_STOPPED` with the time off. Optional share can continue without it (logged) |
| Evidence | 640px webp/jpeg frames every 15 s + 1.5 s after leaving the tab/window (`TAB_SWITCH`/`WINDOW_BLUR` carry `meta.screenFrameId`). ≈ 5 MB per 30 min. No screen video |
| Review | `IntegrityTimeline`: "View screen" on time-away events + a filmstrip of all frames with share status and time off |
| Privacy | Own consent line; frames stored outside the public `/uploads` folder, served only to the candidate or an admin (`Cache-Control: no-store`); deleted after `SCREEN_FRAME_RETENTION_DAYS` (default 30) |

- [x] `useScreenShare()` hook (request, surface check, stop/re-share, periodic + away frames).
- [x] Start flow + "entire screen" and "share again" dialogs; timer paused while the share is off.
- [x] Server: `screenShare` on the session, `POST …/proctoring/screen-frame`, `POST …/proctoring/screen-share`,
      `GET …/screen-frames/:frameId`, own rate limiter, 400-frame cap, 250 KB per frame, one frame per 4 s.
- [x] Scoring (proctored): unavailable/partial, ≥ 3 stops or > 60 s off in total → `REVIEW_RECOMMENDED`. Never hard evidence.
- [x] Retention sweep (daily in the cleanup job, `npm run purge:screen-frames` by hand).
- [ ] Set `screenShare.required` from TPO assessments once they are linked to sessions (`isScreenShareRequired` in
      `interview.controller.js`, `SCREEN_SHARE_REQUIRED` in `AIInterview.jsx`).
- [ ] Remove a session's frames in the data-deletion endpoint (S8; `deleteSessionScreenFrames` is ready).

### Phase S2 — Server-authoritative timing & API integrity · M

- [x] Store `askedAt` (server time when the question payload is returned) and `answerStartedAt`/`answeredAt` per question.
- [x] Reject or flag answers when `answeredAt - askedAt > thinkTime + answerTimeLimitSec + speechDuration + 20 s` (`TIMING_ANOMALY`).
- [ ] Cross-check audio `durationSeconds` (client) with server-measured audio length (ffprobe on upload or the STT
      provider's duration); a mismatch over 15% → `TIMING_ANOMALY`.
- [x] Per-question **turn token**: an HMAC of `{sessionId, questionNumber, askedAt}` returned with each question and required
      on submit/skip (stops scripted submits for questions not yet served, and replays).
- [ ] Signed heartbeat: include a rolling counter + per-signal health (`face`, `object`, `audio`, `env`); the server
      flags missing counters / gaps > 20 s (`PROCTORING_DEGRADED`) before the existing 60 s offline grace.
- [ ] In proctored mode a session cannot complete with `PROCTORING_OFFLINE` > 2 min total → verdict at least `REVIEW_RECOMMENDED`.

### Phase S3 — Who is speaking: lip-sync & voices · L

- [ ] **Lip-sync check** (`SPEECH_WITHOUT_LIPS`, both levels): mouth-open ratio from FaceLandmarker
      (`jawOpen` blendshape + inner-lip distance 13↔14) vs mic RMS from the existing analyser.
      Sustained mic speech (VAD) with a closed, still mouth for ≥ 3 s, ≥ 70% of samples, and the face visible → event.
      Catches whispering helpers, playback and someone off-camera answering.
- [ ] **Speech while the interviewer talks / during think time** (`SPEECH_DURING_THINK`, low): other voices in the
      room during think time (candidate's lips still) → corroborating signal only.
- [ ] **Voice consistency** (`VOICE_MISMATCH`, proctored): voice embedding of the self-introduction vs later answers.
      Option A: server-side speaker embedding (Python service next to Whisper, e.g. ECAPA-TDNN via SpeechBrain);
      Option B: provider API if Sarvam/OpenAI exposes speaker verification. Store only the embedding, delete after report.
- [ ] Tune on recorded test sessions (see §8) before enabling scoring weight; ship weight 0 first ("observe only").

### Phase S4 — Copilot & reading detection · L

- [ ] **Reading-pattern gaze** (`READING_PATTERN`): from the gaze/iris time series, detect repeated left→right sweeps
      with return saccades (≥ 3 lines in 6 s) while the candidate is answering. Different from "looking away to think"
      (single slow glance). Uses landmarks already computed — no extra model.
- [ ] **Off-screen fixation zone** (`OFFSCREEN_FOCUS`): gaze held at a consistent point outside the screen (e.g. below
      the camera = phone, side = second monitor) for > 40% of answer time.
- [ ] **Typing sounds** (`TYPING_DURING_ANSWER`): `@mediapipe/tasks-audio` AudioClassifier (YAMNet) on the mic stream,
      classes "Typing", "Computer keyboard", "Mouse click"; ≥ 0.5 over 2 s while answering. New dependency (~4 MB model,
      lazy-loaded in proctored mode only).
- [ ] **Answer-delivery analysis** (server, background, no extra latency): per answer compute
      - onset latency (question end → first speech),
      - words per minute and its variance,
      - filler-word rate ("um", "uh", "like"), self-corrections,
      - "written-text" score — one cheap gpt-4o-mini call during background scoring: does this read like spoken
        reasoning or like a generated essay?
      Flag `DELIVERY_ANOMALY` only when ≥ 2 indicators fire (e.g. long silent onset + no fillers + essay-like text).
- [ ] **Adaptive drill-down consistency** (already partly in place): when a delivery anomaly fires, the planner prefers
      a follow-up on the candidate's own words; a strong answer followed by a collapse on the follow-up is recorded as
      corroboration (`FOLLOW_UP_COLLAPSE`, reviewer-only signal, no weight alone).

### Phase S5 — Identity: liveness & reference · M

- [ ] **Start liveness challenge** (proctored): random sequence of 2 of {turn left, turn right, blink twice, smile},
      verified with head pose / blendshapes within 8 s. Defeats photos and simple looped video.
- [ ] **Reference selfie**: frontal frame captured after liveness → stored with the session for reviewers (not a
      biometric match against government ID; optional ID upload left as a future enterprise feature).
- [ ] **Random mid-interview check** (proctored, 1× per interview, during a think window): "Quick check: please turn
      your head to the left." Failure → `LIVENESS_FAILED` (high).
- [ ] Feed the reference frame into `CandidateContinuity` as the anchor (today it learns from the first frames).

### Phase S6 — Question security (TPO batches) · S–M

- [ ] Per-candidate topic order shuffle within each blueprint phase (seeded by session id) for proctored assessments.
- [ ] Prompt variation: the question generator receives a per-session "scenario seed" (company type, domain) so wording differs.
- [ ] Never expose upcoming questions to the client (already true — keep it as a test).
- [ ] Cooldown / attempt limits per assessment per student (TPO setting).

### Phase S7 — Scoring v2 & review experience · M

- [ ] `scoreProctoringEvents` v2:
      - hard evidence (sustained second face, phone ≥ 2, virtual device in proctored mode, liveness failed) → `FLAGGED_SUSPICIOUS`;
      - soft signals (gaze, reading, delivery, typing, time away) count only when **corroborated within a 30 s window**
        or repeated across ≥ 2 questions;
      - practice mode never yields `FLAGGED_SUSPICIOUS` from soft signals alone.
- [ ] Per-question integrity summary (which answers are affected) so reviewers can discount specific answers instead of the whole interview.
- [ ] `IntegrityTimeline`: lane per signal family, snapshot thumbnails, click → seek the session video to `timestampSeconds`.
- [ ] TPO review queue: list of `REVIEW_RECOMMENDED` / `FLAGGED_SUSPICIOUS` sessions with accept / dismiss / note
      (stored as `review: { status, reviewerId, note, at }`); dismissals feed false-positive metrics.
- [ ] Candidate report: neutral "Integrity notes" section (e.g. "You left the interview window 3 times") — no accusations.

### Phase S8 — Privacy, retention & compliance · S (runs alongside every phase)

- [ ] Consent screen copy + versioning (S0). Practice mode explains it is for feedback only.
- [ ] Retention: snapshots and video deleted after N days (default 30; TPO assessments 90) via a scheduled job;
      voice embeddings deleted right after the report is generated.
- [ ] Access control: only the candidate, the owning TPO and admins can view integrity evidence; access is logged in `AdminLog`.
- [ ] Data-deletion endpoint covers proctoring evidence.
- [ ] Document what is processed on-device (vision, audio classification) versus on the server (STT, delivery analysis).

---

### Implementation notes — S0–S2 (2026-11-23)

- Catalog: `server/services/proctoring-events.js` → model enum, `EVENT_WEIGHTS`, request validation, `FLAG_COUNT_KEYS`.
  Meta is sanitized (flat, ≤ 20 keys, ≤ 2 KB). Test: `server/tests/interview-security.test.js`.
- Level + consent: `session.proctoringLevel`, `session.proctoringConsent {acceptedAt, version, level}`; proctored
  sessions are refused without consent. Setup screen has a Practice / Proctored switch (opt-in for now; TPO
  assignment will set it later) with a live system check that blocks start in proctored mode.
- `useEnvironmentGuard` (client): tab/blur **with durations** (moved out of `useProctoringEngine`), fullscreen
  (proctored: requested on the Start click, exit → dialog + paused timer + `FULLSCREEN_EXIT` with duration),
  `MULTI_SCREEN` (`screen.isExtended`, Chromium), `VIRTUAL_DEVICE` (active track labels; OBS/ManyCam/XSplit/
  VB-Audio/BlackHole…; DroidCam/Camo/NVIDIA Broadcast/Krisp allowed), `MULTI_SESSION` (BroadcastChannel),
  `COPY_ATTEMPT` (blocked in proctored), `WINDOW_RESIZE` (proctored).
- Scoring: virtual device = hard evidence in proctored, review in practice; extra display, duplicate tab, ≥ 3
  fullscreen exits or ≥ 2 timing anomalies → `REVIEW_RECOMMENDED`.
- Server timing: question `startedAt` is the ask time (reset for Q1 when the introduction arrives); budget =
  2 × spoken length + think + answer limit + 60 s slack (+ intro budget if the intro never arrived); late answers
  log `TIMING_ANOMALY` (never block). Text mode is untimed.
- Turn tokens: HMAC(sessionId:questionNumber) issued with every question, required on answer/voice/skip for new
  sessions (`session.integrity.turnTokens`); legacy sessions are accepted without one. Invalid → 403.
- Phone detector thresholds changed → `DETECTOR_VERSION` bumped to `temporal-vision-3`.
- S1.5 screen sharing: `client/src/components/interview/hooks/useScreenShare.js`,
  `server/services/screen-share.service.js` (policy, validation, storage, purge), frames in
  `server/storage/screen-frames/<sessionId>/` (git-ignored). Consent version `2026-11-23.2`.
- Still open in S0–S2: per-session event cap, audio-duration cross-check, signed heartbeat counters /
  `PROCTORING_DEGRADED`, offline > 2 min rule in proctored mode.

## 7. Event catalog (target)

| Event | Family | Levels | Severity | Weight (draft) | Hard evidence? |
|---|---|---|---|---|---|
| PHONE_DETECTED | vision | both | high | 15 | yes (≥ 2) |
| MULTIPLE_FACES | vision | both | high | 15 | yes (sustained) |
| FACE_ABSENT | vision | both | medium | 8 | no |
| IDENTITY_SWITCH | vision | both | high | 18 | yes (≥ 3) |
| GAZE_DEVIATION | vision | both | low | 3 | no |
| READING_PATTERN | vision | both | medium | 6 | no |
| OFFSCREEN_FOCUS | vision | both | medium | 6 | no |
| LIVENESS_FAILED | vision | proctored | high | 20 | yes |
| SPEECH_WITHOUT_LIPS | vision+audio | both | high | 12 | corroborated |
| SPEECH_DURING_THINK | audio | both | low | 2 | no |
| TYPING_DURING_ANSWER | audio | proctored | medium | 8 | no |
| VOICE_MISMATCH | audio | proctored | high | 15 | corroborated |
| TAB_SWITCH (+duration) | env | both | medium | 5 × duration factor | no |
| WINDOW_BLUR (+duration) | env | both | low | 4 × duration factor | no |
| FULLSCREEN_EXIT | env | proctored | medium | 5 | no |
| MULTI_SCREEN | env | both | medium / blocks in proctored | 8 | no |
| VIRTUAL_DEVICE | env | both | high / blocks in proctored | 20 | yes (proctored) |
| MULTI_SESSION | env | both | medium | 6 | no |
| WINDOW_RESIZE | env | proctored | low | 2 | no |
| SCREEN_SHARE_UNAVAILABLE | env | proctored | medium | 4 | no |
| SCREEN_SHARE_PARTIAL | env | proctored | low | 3 | no |
| SCREEN_SHARE_STOPPED (+duration) | env | proctored | medium | 6 × duration factor | no |
| COPY_ATTEMPT / PASTE_ATTEMPT | env | both | low/medium | 2 / 5 | no |
| TIMING_ANOMALY | server | both | medium | 8 | no |
| DELIVERY_ANOMALY | server | both | medium | 6 | no |
| FOLLOW_UP_COLLAPSE | server | both | info | 0 | reviewer-only |
| PROCTORING_DEGRADED / OFFLINE | server | both | medium / high | 4 / 10 | no |

Weights are drafts; calibrate with §8 data before release.

---

## 8. Testing & calibration

- [ ] **Scripted test sessions** (recorded with consent from the team): honest answers; phone below the camera;
      second monitor with ChatGPT; friend whispering; reading notes; typing into ChatGPT mid-answer; virtual camera
      (OBS) with a looped video; proxy swap halfway. 3+ people, 2 lighting setups, laptop + external webcam.
- [ ] Replay harness: run detectors on recorded videos offline (`node --test` with stored landmark/audio feature
      traces) so threshold changes are regression-tested.
- [ ] Targets before enabling a signal's weight: **false-positive rate < 3% of honest sessions**, detection ≥ 70% of
      scripted cheats for that method.
- [ ] Unit tests: event catalog consistency, payload validation, scoring v2 corroboration window, timing checks, turn tokens.
- [ ] Performance budget: total proctoring CPU ≤ 25% of one core on a 2020 MacBook Air / mid-range Windows laptop;
      audio classifier lazy-loaded; vision stays at 5 fps face / 4 fps objects on fixed small frames.

## 9. Rollout

1. Ship each detector **observe-only** (logged with weight 0, hidden from candidates) for 1–2 weeks.
2. Review the distributions and dismissals → set thresholds and weights.
3. Enable in `proctored` mode first (TPO pilots), then the light version in `practice`.
4. Feature flags per signal (`PROCTOR_SIGNALS=lipsync,reading,typing,...`) + `detectorVersion` on every event.

## 10. Metrics

- Share of sessions per verdict, by level; reviewer dismiss rate per event type (false-positive proxy).
- Detection rate on the scripted cheat suite per release.
- Proctoring-related drop-off (candidates abandoning at the system check / consent).
- Client CPU and frame-drop telemetry from the heartbeat.

## 11. Suggested build order

1. S0 foundation → S1 environment & devices → S2 server timing (quick, high value, low false-positive risk).
2. S3 lip-sync (biggest new catch for whispering/proxy) → S4 reading gaze + delivery analysis (copilots).
3. S5 liveness (needed before TPO assessments go live) → S7 scoring v2 + review queue.
4. S4 typing classifier, S3 voice consistency, S6 question security as TPO usage grows. S8 throughout.

## 12. Open decisions

1. Who sets `proctored` mode: only TPO-assigned assessments, or can a student opt in for "real exam practice"?
2. Block vs log for a second screen and virtual devices in **practice** mode (proposal: log + nudge).
3. Retention periods (proposal: 30 days practice, 90 days TPO assessments; voice embeddings deleted after the report).
4. Voice consistency: self-hosted speaker model (more control, more infra) vs provider API (if available).
5. Should integrity notes be visible to the candidate in proctored assessments, or only to the TPO?

**Decided**

- Screen sharing unavailable in proctored mode (2026-11-23): blocks the start only when the share is required (TPO
  assessments); self-chosen proctored practice starts and flags `SCREEN_SHARE_UNAVAILABLE` for review. A shared
  window/tab instead of the entire screen gets one more prompt, then is accepted and flagged (blocked if required).

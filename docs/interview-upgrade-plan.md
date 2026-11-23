# AI Interview Upgrade Plan

Status: in progress (Phases 1, 2, 4 core done) · Created 2026-11-23 · Owner: @atharva038

Goal: make the live interview feel like a real video call that runs itself —
the interviewer asks, the candidate gets thinking time, the mic opens on its own,
a timer bounds the answer, and the interview moves on without the candidate
clicking "Record". Cut Sarvam TTS spend by pre-recording every fixed phrase.

---

## Current state (what the audit found)

| Area | Finding | Where |
|---|---|---|
| Video tile | Box is `aspect-video` (16:9) inside a ~55% width column, video uses `object-contain` → letterboxed, wide-and-short | `ExecutiveStudioStage.jsx:93`, `CameraPreviewStage.jsx:89` |
| Interviewer presence | No interviewer tile during the live call. `InterviewerGraphic.jsx` (699 lines) exists but is not used on the live stage | `ExecutiveStudioStage.jsx` |
| Answer flow | Fully manual: after TTS ends, phase → `waiting`, candidate must click **Record Answer**, then **Done Recording & Submit** | `useInterviewSession.js:241`, `useInterviewSpeech.js:63` |
| Per-question timer | None. Only a global countdown for the whole interview | `ExecutiveStudioStage.jsx:44` |
| Global timer | Hard-completes the interview when time runs out; no grace for an answer in progress (known issue) | `useInterviewSession.js:155-166` |
| Question count | `totalQuestions = duration × 0.8` (10 min → 8 Qs). Won't fit once each answer gets 2–3 min | `useInterviewSession.js:189` |
| Difficulty | Server stores `difficulty` + `cognitiveLevel` per question, but the client only receives `cognitiveLevel` | `interview.controller.js:309` |
| TTS credits | Every phrase hits Sarvam: greeting, every question, **every Repeat click** (re-synthesizes the same text), and every **Test Voice** click on setup | `useInterviewSpeech.js`, `handleRepeatQuestion` |
| Transitions | `generateAcknowledgment()` has 8 transition phrases — never used. Server-side `acknowledgmentBridge` is generated but never sent/played | `useInterviewSpeech.js:357`, `InterviewSession.model.js` |
| STT for long answers | Sarvam STT is skipped when audio > 28 s → 2–3 min answers always fall back to OpenAI Whisper (cost + latency) | `interview.controller.js:943` |
| Intro text | Greeting is random 1-of-3 and embeds the role name → can't be pre-recorded as-is | `useInterviewSpeech.js:347` |

---

## Phase 1 — Live stage layout (video fix)

**Outcome:** call-style layout, video fills its tile, no letterboxing.

- [x] Redesign `ExecutiveStudioStage` into a full-height (`h-dvh`, no page scroll) call layout:
  - Desktop (`lg+`): left = **interviewer tile** (top) + **candidate video** (bottom), or side-by-side tiles; right = question card + timer + status.
  - Mobile: candidate tile on top (`aspect-[3/4]`), question card below, interviewer shown as a small avatar chip with speaking indicator.
- [x] Candidate video: switch to `object-cover`, tile height driven by the viewport (`flex-1 min-h-0`) instead of `aspect-video`.
- [ ] Request a 4:3 or 1:1-friendly stream (`aspectRatio: { ideal: 4/3 }`) in `useCameraStream` so `object-cover` crops less.
- [ ] Check proctoring still works: `object-cover` only crops visually — the detector reads the full frame, but a face at the frame edge could be hidden from the user while still being "in view". Add a subtle face-guide overlay if needed.
- [x] Interviewer tile: persona `avatarImage` + name/title + animated "speaking" ring driven by `isPlayingAudio` (reuse parts of `InterviewerGraphic` or delete it — see Phase 7).
- [x] Show `Question n / total` progress bar in header next to global time.
- [ ] Verify at 1280×720, 1440×900, 1920×1080, iPhone 14, iPad; light content contrast in dark stage.

## Phase 2 — Automatic turn engine (core feature)

**Outcome:** no manual record button. Each question runs:

```
SPEAKING (TTS) ──► THINKING (10 s) ──► ANSWERING (2–3 min, mic auto-on) ──► SUBMITTING ──► next question
                        │ "Start now" skips           │ "I'm done" ends early
                        │                             │ timer hits 0 → auto-submit
```

- [x] Add a turn state machine hook `useInterviewTurnFlow` (new file) owning sub-phases: `speaking | thinking | answering | submitting`. Keep `useInterviewSession` as the API layer; stop spreading phase logic across three hooks + bridge refs.
- [x] **Thinking window:** 10 s countdown ring after TTS ends. Mic is *pre-warmed* (stream open, not recording) so recording starts instantly. Button: "Start answering now".
- [x] **Answer window:** on thinking → 0, call `recording.startRecording()` automatically. Countdown visible as ring + `m:ss`.
  - [ ] Duration by difficulty (see open decision #1). Server sends `answerTimeLimitSec` per question.
  - [ ] Warning cue at 30 s left (color change + short pre-recorded "about thirty seconds left" clip, or a soft tone — must not be captured into the recording; play via `<audio>` with echo cancellation on, or use visual-only).
  - [ ] At 0 → `submitRecording()` automatically + pre-recorded "Thank you, let's move on" clip.
- [x] **Finish early:** "I'm done" button → submit immediately.
- [ ] **Silence handling (nice-to-have):** if analyser shows no speech for the first 20 s of the answer window, show a nudge; if silent for the whole window, submit as "no answer" instead of sending empty audio (avoid STT cost).
- [x] **Re-record:** remove the "Record Again" draft step from live mode (one take per question, like a real interview). Keep it behind a setting only if you want a practice mode (open decision #3).
- [ ] **Repeat question:** allowed only during THINKING; replays the *cached* audio blob (no new TTS call); pauses the thinking countdown and restarts it after replay. Limit to 1 repeat per question.
- [x] **Skip:** allowed during THINKING/ANSWERING with confirm; stops recording and discards audio.
- [x] Introduction (warm-up) turn uses the same flow with its own limit (suggest 90 s).
- [ ] Text mode: keep as-is but add the same per-question answer timer (textarea locks + auto-submit at 0).
- [ ] Mic failures mid-answer (device unplugged / permission revoked): pause the answer timer, show a blocking banner with device picker, resume.
- [ ] Tab hidden during ANSWERING: keep recording, log a proctoring event (already have the event endpoint).

## Phase 3 — Pre-recorded voice clips (save Sarvam credits)

**Outcome:** every fixed phrase plays from a static file; Sarvam is only called for the actual question text.

- [ ] Write a clip script `client/src/components/interview/voiceClips.js` — one source of truth for clip IDs + text:
  - `greeting_1..3` — role-agnostic ("Hi, welcome! Thanks for joining today…")
  - `intro_prompt` — "To start, could you briefly introduce yourself?"
  - `think_prompt` — "Take a moment to think. Your timer will start shortly."
  - `start_answer` — "You can begin your answer now." (optional; a tone may be better)
  - `time_warning` — "About thirty seconds left."
  - `times_up` — "Thank you, that's time."
  - `transition_1..8` — reuse the 8 unused phrases from `generateAcknowledgment()`
  - `followup_lead_1..3` — "Let me follow up on that."
  - `skip_ack` — "No problem, let's move on."
  - `closing_1..2` — "That's the end of our interview… your report is being prepared."
  - `voice_test_sample` — for the setup-screen **Test Voice** button
- [ ] Server script `server/scripts/generateInterviewClips.js`: for each persona × clip, call `sarvamService.textToSpeech`, transcode WAV → Opus/MP3 (ffmpeg, ~10× smaller), write `client/public/audio/interview/{persona}/{clipId}.mp3` + `manifest.json`. Idempotent: skip existing files unless `--force`. One-time cost ≈ 6 personas × ~25 clips.
- [ ] Note: the 6 UI personas map to Sarvam speakers via `speakerAliases` (`sarvam.service.js`) — generate per *Sarvam speaker*, not per UI name, to avoid duplicates.
- [ ] Client `playClip(persona, clipId)` in `useInterviewSpeech`: static file → fallback to Sarvam TTS → fallback to Web Speech. Preload the persona's clips when the interview starts.
- [ ] Sequence before each question: `transition_k` clip (free) + Sarvam TTS of the question only.
- [ ] Cache question audio blobs client-side per question number (for Repeat) — never re-synthesize the same text.
- [ ] Replace **Test Voice** on setup with the pre-recorded sample.
- [ ] Optionally serve clips from a CDN/Azure Blob later; static `public/` is fine for v1.
- [ ] Track TTS chars per session in `AIUsage` (before/after numbers to prove savings).

## Phase 4 — Server: pacing, difficulty, timing

- [x] Add `answerTimeLimitSec` to the question subdocument in `InterviewSession.model.js`; compute in one place (e.g. `interview-difficulty.service.js`) from `difficulty` / `cognitiveLevel` / `questionType`.
- [x] Return `difficulty` + `answerTimeLimitSec` in `currentQuestion` / `nextQuestion` payloads (start, submit, voice-submit, skip).
- [x] Recompute `totalQuestions` from duration: `floor((duration·60 − intro − closing) / (avgAnswer + think + ~25 s TTS/processing))` → 10 min ≈ 3–4 Qs, 20 min ≈ 6–7, 30 min ≈ 9–10. Move this calculation server-side (client currently sends it).
- [x] Update setup duration presets/copy to show "≈ N questions".
- [x] Global timer grace: when global time hits 0 during ANSWERING, let the current answer finish (up to its own limit), then play `closing` and complete. Never start a new question with < 60 s remaining.
- [ ] Server-side validation: reject/flag answers whose `durationSeconds` > `answerTimeLimitSec + 10` (anti-tamper).
- [ ] Return the server `acknowledgmentBridge` only if we decide to TTS it (costs credits) — otherwise drop it from the prompt to save tokens (open decision #4).

## Phase 5 — STT for 2–3 minute answers

- [ ] Sarvam sync STT is capped (~30 s). Options:
  - **A (recommended):** chunk the recording client-side into ≤25 s segments (`MediaRecorder` restarted on a rolling window, or split server-side with ffmpeg), transcribe chunks in parallel with Sarvam, join text.
  - **B:** Sarvam batch/async STT job API for long audio (check current Sarvam docs + latency).
  - **C:** keep OpenAI Whisper fallback for long answers (simplest, costs more).
- [ ] Optional: stream chunks *during* the answer so transcription is mostly done when the timer ends → faster next question.
- [ ] Raise multer upload limit / timeouts to fit 3 min Opus audio (~1–2 MB) — verify `multer.config.js`.
- [ ] Keep client Web Speech transcript as a last-resort fallback (already wired).

## Phase 6 — Polish & edge cases

- [ ] Pre-interview "system check" screen: camera framing, mic level, speaker test (pre-recorded clip), and a 5 s explanation of the flow ("10 s to think, then your mic turns on automatically").
- [ ] Clear visual states with consistent colors: Speaking (blue) · Thinking (amber ring) · Recording (red dot + waveform) · Processing (spinner).
- [ ] Live captions toggle for interviewer speech (text already available).
- [ ] Keyboard: `Space` = start now / I'm done; `R` = repeat (thinking only).
- [ ] Accessibility: `aria-live` on countdowns at coarse intervals (not every second), focus management between phases.
- [ ] Processing latency: show "Interviewer is reviewing your answer…" with a pre-recorded filler if evaluation takes > 4 s.
- [ ] Result page: show per-question time used vs limit; surface "answered in non-English" penalty clearly.
- [ ] Analytics events: thinking skipped, answers timed out vs finished early, avg answer length, repeats used.

## Phase 7 — Cleanup

- [ ] `InterviewerGraphic.jsx` is still used by `SetupStep`; decide whether to keep it or move setup to the same avatar tile as the live stage.
- [ ] Deduplicate browser-voice selection logic (copied in `speakAndListen` and `handleTestVoice`).
- [ ] Remove the ref-bridge pattern in `AIInterview.jsx` once `useInterviewTurnFlow` owns turn state.
- [x] Fix `"Generating your interview report?"` / `"Submitting your response?"` — stray `?` that should be `…` (`ExecutiveStudioStage.jsx:61-63`).
- [x] Update `CLAUDE.md` Known Issues once the timer grace period ships.

---

## Implementation notes (2026-11-23)

- Defaults used: 10 s think · answer 2:00 (cognitive L1–2) / 2:30 (L3) / 3:00 (L4+) · intro 1:30 · one take, "I'm done" to finish early · 1 repeat per question, during think time only.
- `answerTimeLimitSec` is derived (`getAnswerTimeLimitSec` in `interview-difficulty.service.js`), not stored — no migration. Client mirrors it in `constants.js` as a fallback.
- Question count: `estimateQuestionCount` → 10 min ≈ 3 Qs, 15 ≈ 5, 20 ≈ 7, 30 ≈ 11. `InterviewSession.totalQuestions` min lowered 5 → 2.
- Turn engine: `client/src/components/interview/hooks/useInterviewTurnFlow.js`. Stages `idle → thinking → starting → answering → submitting`, plus `retry` (upload failed / empty audio) and `mic-error`.
- Not done yet from Phases 1–2: 30 s warning *audio* cue (visual only for now), silence detection, mic-loss pause, tab-hidden event, text-mode per-question timer, repeat replaying cached audio (Phase 3).

## Open decisions

1. **Answer time per question** — proposal: easy/cognitive L1–2 → **2:00**, medium L3 → **2:30**, hard L4+ / system-design → **3:00**, intro → **1:30**. Thinking time fixed at **10 s** (maybe 15 s for hard?).
2. **"I'm done" early-finish button** — recommended yes.
3. **Re-record** in live mode — recommended no (one take, realistic); maybe a "practice mode" toggle later.
4. **Spoken acknowledgments** — pre-recorded generic transitions only (free) vs. AI-generated contextual bridge via TTS (costs credits, feels smarter).
5. **Long-answer STT** — chunked Sarvam (A) vs. Whisper fallback (C).

## Suggested order

1. Phase 1 (layout) — small, visible win, independent.
2. Phase 4 server fields (`answerTimeLimitSec`, `totalQuestions`) — unblocks Phase 2.
3. Phase 2 (auto turn engine).
4. Phase 3 (pre-recorded clips) — can run in parallel with 2 once clip IDs are agreed.
5. Phase 5 (long-answer STT) — must land with or right after Phase 2, otherwise every auto-recorded answer pays Whisper.
6. Phases 6–7.

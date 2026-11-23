# AI Interview Upgrade Plan

Status: in progress (Phases 1, 2, 2b, 3 core, 4 core done) · Created 2026-11-23 · Owner: @atharva038

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

## Phase 2b — Conversational interviewer (adaptive turns)

**Outcome:** the interviewer reacts to what the candidate actually said and decides the next
question from the answer — like a real interviewer — instead of reading a pre-generated list.

Problem found: the next question was generated *before* the candidate answered
(`prepareNextInterviewQuestion` → `preparedQuestion`), and evaluation only ran in the background.
So nothing adapted to the answer, and the self-introduction was never sent to the server.

### Turn algorithm

```
answer submitted
  ├─ client: instantly play a pre-recorded acknowledgment ("Okay, thank you…")   ← hides latency
  ├─ server: STT (voice) → planNextTurn() — one fast LLM call (JSON):
  │     decision   FOLLOW_UP | ADVANCE
  │     kind       PROBE_DEEP (vague / buzzwords → ask for specifics they mentioned)
  │                CHALLENGE  (strong answer → edge case, scale, failure mode)
  │                STEP_DOWN  (wrong / confused → check the fundamental underneath)
  │                CLARIFY    (contradiction or unclear claim)
  │     reaction   ≤ 18 words, neutral, references their words, never grades
  │     question   ≤ 45 words, spoken style, one question only
  ├─ guards enforced in code (not trusted to the LLM):
  │     • max 2 consecutive follow-ups on one thread, then ADVANCE
  │     • skipped answer → ADVANCE (no LLM call)
  │     • ADVANCE targets the next uncovered syllabus topic + cognitive level
  │     • timeout / bad JSON → syllabus fallback question, no reaction
  ├─ background: full 5-dimension scoring (unchanged, does not block the turn)
  └─ client: speak reaction, then question (two TTS calls fetched in parallel)
```

- [x] `server/services/interview-conversation.service.js` — `planNextTurn()` + `planOpeningQuestion()`.
- [x] Fast model for the live turn (`INTERVIEW_TURN_MODEL`, default `gpt-4o-mini`), 8 s timeout, no retries.
- [x] `saveInterviewTurn` uses the adaptive next question; stores `turnDecision` on the answered
      question and `acknowledgmentBridge`, `isFollowUp`, `parentQuestionNumber` on the next one.
- [x] Background `preparedQuestion` generation disabled when adaptive turns are on (saves a GPT-4o call per turn).
- [x] Self-introduction is sent to the server (`POST /sessions/:id/introduction`); Q1 is re-planned
      from the intro + resume and opens with a reaction to it. Intro is kept as context for later turns.
- [x] Next-question payload carries `leadIn` + `isFollowUp`; follow-ups shown with a "Follow-up" tag.
- [ ] Tune prompts after 10–20 real sessions (follow-up rate target: ~30–40% of turns).
- [ ] Phase 5 (long-answer STT) directly cuts turn latency — do next.

### Voice: Shubh only
- [x] Only the Shubh persona is offered (others sounded poor). Server normalizes `personaUsed` to `shubh`.

## Phase 2c — Interview-type blueprints (all 5 formats)

**Problem found (audit 2026-11-23):** `generateInterviewSyllabus` ignored the selected format.
Phases 1–4 were always technical and unconditional; behavioral questions only filled "leftover"
slots — which never exist now that question count follows duration (3–5 Qs). So a **Behavioral
interview asked only technical questions**. Also:
- Q1 was generated with the plan's type, not the session's → JD/resume context dropped from Q1.
- Resume-based: only Q1 used the resume. JD-based: topics never came from the JD.
- Mixed: no real alternation. Syllabus could be longer than `totalQuestions`.
- Scoring (`processInterviewTurn`) and the final report used technical rubrics for every answer.

### Blueprint per format (length = `totalQuestions`, which follows the selected time)

| Format | Question plan | Never asks |
|---|---|---|
| **Technical** | Role ontology topics; cognitive level ramps from seniority min → max across the interview (fundamentals → trade-offs → design → failure modes) | Behavioral / "tell me about a time" |
| **Behavioral** | Competency bank ordered by seniority (fresher: teamwork, learning, ownership… · senior/lead: leadership, influence, conflict…). STAR "tell me about a time" + situational "what would you do"; freshers may use college/internship examples | Technical, coding, system design |
| **Resume-based** | Anchored to the resume: flagship project → technical decisions → skill-depth check → hardest problem → measurable impact → collaboration → "what would you change" | Generic textbook questions unrelated to the resume |
| **Job description** | Requirements extracted from the JD, ramped in difficulty; one team/culture-fit question (≥ 4 Qs) and a role scenario | Topics absent from the JD (falls back to role topics only if nothing extractable) |
| **Mixed** | ~60% technical / ~40% behavioral, interleaved T, B, T, T, B… (behavioral guaranteed by Q2); resume project first when a resume is attached | — |

### Checklist
- [x] Rewrite `generateInterviewSyllabus` as per-format builders; exact length = `totalQuestions`.
- [x] `extractJobRequirements(jd)` — requirement lines + soft-skill lines from the JD.
- [x] Q1 (`startSession`) and fallback generation use the session format's prompt context (JD/resume kept) + topic objective.
- [x] `buildQuestionPrompt`: `situational` case, objective line, fresher-friendly behavioral wording.
- [x] Adaptive planner: hard format rule per interview type; behavioral follow-ups probe STAR gaps
      (own action, result, what you'd change) instead of technical depth; follow-ups keep the parent's type.
- [x] Follow-up budget scales with interview length (≤ 5 Qs: 1 follow-up in a row, ~35% of turns max)
      so short interviews still cover their key topics.
- [x] Next-topic selection by unopened category for both adaptive and fallback paths.
- [x] Answer time by type: technical 2:00–3:00 by level · behavioral 2:30 (3:00 senior+) · situational 2:00 ·
      resume 2:30 · follow-up 2:00.
- [x] Type-aware scoring rubric (behavioral/situational → STAR, ownership, judgment; resume → ownership & credibility).
- [x] Type-aware final report interpretation (behavioral reports don't penalize "technical depth").
- [x] Tests: each format's blueprint at 3/5/7/11 questions; behavioral contains zero technical items.

### Implementation notes (2026-11-23)
- Topic tracking is positional: the Nth main question consumes the Nth planned topic; follow-ups don't
  consume topics (fixes topics being skipped, and repeats for sessions whose Q1 stored the model's own label).
- Q1 and fallback questions store the *plan's* category/type, not the model's labels.
- Follow-ups keep their parent's `questionType` (behavioral follow-ups stay behavioral for timing, scoring, rules).
- Live check (gpt-4o-mini / gpt-4o): behavioral Q1 = teamwork STAR question with college/internship framing;
  JD Q1 = Node/Express from the JD; resume Q1 names the candidate's project. Behavioral follow-ups probe
  personal role and impact, never technology.
- Tests: `server/tests/interview-blueprint.test.js` (11) — all formats × 5 durations × 5 levels.
- [ ] Watch: JD requirement extraction is heuristic (bullets / sentences with requirement verbs). JDs written as
      one paragraph without those verbs fall back to role topics. Consider an LLM extraction at session create.

## Phase 2d — Studio polish round (2026-11-23, from live test)

- [x] No question numbers, category pills, "Follow-up" tag or AI lead-in text on screen — the candidate sees only the question.
- [x] Header stepper `Intro · 1 · 2 · … · N`, advances only on a new *main* question (follow-ups stay on the same step;
      the step total shrinks by one per follow-up since it uses a planned slot). Compresses to `1 2 … n` for long interviews.
- [x] Human pacing: acknowledgment waits 0.7–1.1 s after "I'm done" (0.45 s on timeout), 0.45 s breath before the reaction,
      0.28 s between reaction and question; a pending acknowledgment is dropped if the next question is already ready.
- [x] Warmer voice: Sarvam `pace 0.95`, `temperature 0.72` (env `SARVAM_TTS_PACE` / `SARVAM_TTS_TEMPERATURE`);
      acknowledgments rewritten with natural pauses ("Mm-hmm… okay. Thank you for that.") and re-recorded.
- [x] New button system (white primary, quiet secondaries, no flat green), custom duotone icon set (`StudioIcons.jsx`),
      micro-interactions on hover/press, reduced-motion respected.
- [x] `TurnTimer`: watch-bezel with 60 burning ticks, smooth deadline-driven arc with glowing head, rolling digits;
      amber think → teal/sky answer → amber last 30 s → pulsing rose last 10 s; shows "Paused" in dialogs.
- [x] `StudioDialog` for End interview and Skip (skip used to be `window.confirm`); safe action focused by default,
      Esc/backdrop cancel, timer paused while open.
- [x] Phone detection restored: commit 542a65b had raised the bar to ≥ 0.6 on 70 % of frames for 2 s, which
      EfficientDet-Lite0 rarely reaches for a hand-held phone. Now ≥ 0.45 for ~1 s (50 % of frames), "remote"
      class counted at ≥ 0.55, detection runs on a fixed 640 px frame.
- [x] Camera requests 1080p @ 30 fps (was 720p). Proctoring analyses fixed small frames and the recorder bitrate is
      capped at 450 kbps, so CPU and upload size don't grow.
- [ ] Verify phone detection false-positive rate across lighting / backgrounds before tightening or loosening further.

## Phase 3 — Pre-recorded voice clips (save Sarvam credits)

**Outcome:** every fixed phrase plays from a static file; Sarvam is only called for the actual question text.

- [x] Write a clip script `client/src/components/interview/voiceClips.js` — one source of truth for clip IDs + text:
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
- [x] Server script `server/scripts/generateInterviewClips.js`: for each persona × clip, call `sarvamService.textToSpeech`, transcode WAV → Opus/MP3 (ffmpeg, ~10× smaller), write `client/public/audio/interview/{persona}/{clipId}.mp3` + `manifest.json`. Idempotent: skip existing files unless `--force`. One-time cost ≈ 6 personas × ~25 clips.
- [x] ~~Note: the 6 UI personas map~~ (moot — Shubh only). Note: the 6 UI personas map to Sarvam speakers via `speakerAliases` (`sarvam.service.js`) — generate per *Sarvam speaker*, not per UI name, to avoid duplicates.
- [x] Client `playClip(persona, clipId)` in `useInterviewSpeech`: static file → fallback to Sarvam TTS → fallback to Web Speech. Preload the persona's clips when the interview starts.
- [ ] Sequence before each question: `transition_k` clip (free) + Sarvam TTS of the question only.
- [x] Cache question audio blobs client-side per question number (for Repeat) — never re-synthesize the same text.
- [x] Replace **Test Voice** on setup with the pre-recorded sample.
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
- Not done yet from Phases 1–2: 30 s warning *audio* cue (visual only — a spoken cue would be captured by the mic), silence detection, tab-hidden event, text-mode per-question timer.
- Turn countdown now pauses while the "End interview?" dialog is open.

## Implementation notes (2026-11-23, round 2)

- Adaptive turns live-tested on `gpt-4o-mini`: 1.1–1.8 s per decision. Vague answer → probe on their own words;
  wrong answer ("an API is a database") → step down to fundamentals; solid answer → deeper probe.
- Env flags: `INTERVIEW_ADAPTIVE_TURNS=false` restores the old pre-generated flow; `INTERVIEW_TURN_MODEL`
  (default `gpt-4o-mini`); `INTERVIEW_TURN_TIMEOUT_MS` (default 8000).
- Fallback when the planner fails is the generic syllabus template question (background GPT-4o pre-generation
  is off in adaptive mode). Watch logs for `Interview turn planning failed`.
- Clips: 14 Shubh lines recorded (868 Sarvam characters, 408 KB) in `client/public/audio/interview/shubh/`.
  Regenerate after editing `voiceClips.js`: `cd server && npm run interview:clips`.
- Sound design per turn: answer ends → "Okay, thank you." / "Okay, that's time." (timeout) / "No problem,
  let's move on." (skip) → AI reaction → question. The next question waits (≤ 3 s) for the filler to finish.
- New tests: `server/tests/interview-conversation.test.js` (8), included in `npm run test:interview`.

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

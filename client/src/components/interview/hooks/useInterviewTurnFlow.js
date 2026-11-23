import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ANSWER_WARNING_SEC, THINK_TIME_SEC } from "../constants";

/**
 * Drives a spoken interview turn without manual record buttons:
 *
 *   interviewer finishes speaking (phase "waiting")
 *     → thinking  (THINK_TIME_SEC countdown, mic pre-warmed)
 *     → answering (mic records automatically, answerLimitSec countdown)
 *     → submitting (auto at 0, or early via finishNow)
 *
 * Stages: idle | thinking | starting | answering | submitting | retry | mic-error
 * "retry" means a recording exists (or was empty) but was not accepted, so the
 * candidate gets manual Submit / Record again controls instead of a silent loop.
 */
export function useInterviewTurnFlow({
  enabled,
  frozen = false,
  interviewPhase,
  turnKey,
  answerLimitSec,
  isRecording,
  hasRecordingDraft,
  startRecording,
  submitRecording,
  cancelRecording,
  prepareMic,
  onAnswerEnd,
  answerWindowOpenRef,
}) {
  const [stage, setStageState] = useState("idle");
  const [remainingSec, setRemainingSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [repeatsUsed, setRepeatsUsed] = useState(0);

  const stageRef = useRef("idle");
  const deadlineRef = useRef(0);
  const pausedRemainingMsRef = useRef(null);
  const runIdRef = useRef(0);
  const repeatsByTurnRef = useRef(new Map());
  const sawRecordingRef = useRef(false);
  // Latest callbacks/limit, read from timers and async continuations.
  const latest = useRef({});
  useLayoutEffect(() => {
    latest.current = { frozen, answerLimitSec, startRecording, submitRecording, cancelRecording, prepareMic, onAnswerEnd };
  });

  const setStage = useCallback((next) => {
    stageRef.current = next;
    setStageState(next);
    if (answerWindowOpenRef) {
      answerWindowOpenRef.current = next === "starting" || next === "answering" || next === "submitting";
    }
  }, [answerWindowOpenRef]);

  const startCountdown = useCallback((seconds) => {
    const paused = latest.current.frozen;
    deadlineRef.current = paused ? 0 : Date.now() + seconds * 1000;
    pausedRemainingMsRef.current = paused ? seconds * 1000 : null;
    setIsPaused(paused);
    setRemainingSec(seconds);
  }, []);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    deadlineRef.current = 0;
    pausedRemainingMsRef.current = null;
    setIsPaused(false);
    setRemainingSec(0);
    setStage("idle");
  }, [setStage]);

  const beginAnswer = useCallback(async () => {
    if (latest.current.frozen) return;
    const stageNow = stageRef.current;
    if (stageNow !== "thinking" && stageNow !== "mic-error" && stageNow !== "retry") return;
    const runId = ++runIdRef.current;
    setStage("starting");
    const started = await latest.current.startRecording();
    if (runIdRef.current !== runId) {
      // The turn ended while the mic was opening (skip, timeout, exit).
      if (started) latest.current.cancelRecording();
      return;
    }
    if (!started) {
      setStage("mic-error");
      return;
    }
    sawRecordingRef.current = false;
    setStage("answering");
    startCountdown(latest.current.answerLimitSec);
  }, [setStage, startCountdown]);

  // reason: "timeout" (answer timer hit 0) | "done" (candidate finished early)
  const finishAnswer = useCallback((reason = "done") => {
    if (stageRef.current !== "answering") return;
    setStage("submitting");
    setRemainingSec(0);
    latest.current.submitRecording();
    latest.current.onAnswerEnd?.(reason);
  }, [setStage]);

  // Re-send a recording that failed to upload (stage "retry").
  const submitDraft = useCallback(() => {
    if (stageRef.current !== "retry") return;
    setStage("submitting");
    latest.current.submitRecording();
    latest.current.onAnswerEnd?.("retry");
  }, [setStage]);

  // A new candidate turn begins whenever the interviewer hands over ("waiting").
  useEffect(() => {
    if (!enabled || interviewPhase !== "waiting") {
      if (stageRef.current !== "idle") reset();
      return;
    }
    if (stageRef.current !== "idle" || isRecording) return;
    if (hasRecordingDraft) {
      setStage("retry");
      return;
    }
    setStage("thinking");
    startCountdown(THINK_TIME_SEC);
    void latest.current.prepareMic?.();
  }, [enabled, interviewPhase, turnKey, isRecording, hasRecordingDraft, reset, setStage, startCountdown]);

  // The recorder stopped but the session never left "waiting": the audio was
  // empty or the upload failed. Hand control back to the candidate.
  useEffect(() => {
    if (stage === "submitting" && !isRecording && interviewPhase === "waiting") {
      setStage("retry");
    }
  }, [stage, isRecording, interviewPhase, setStage]);

  // A recording that stops on its own (device unplugged) ends the answer early.
  useEffect(() => {
    if (stage !== "answering") return;
    if (isRecording) {
      sawRecordingRef.current = true;
    } else if (sawRecordingRef.current) {
      setStage(hasRecordingDraft ? "retry" : "mic-error");
    }
  }, [stage, isRecording, hasRecordingDraft, setStage]);

  useEffect(() => {
    setRepeatsUsed(repeatsByTurnRef.current.get(turnKey) || 0);
  }, [turnKey]);

  useEffect(() => {
    if ((stage !== "thinking" && stage !== "answering") || isPaused) return;
    const tick = () => {
      if (latest.current.frozen) return;
      const msLeft = deadlineRef.current - Date.now();
      setRemainingSec(Math.max(0, Math.ceil(msLeft / 1000)));
      if (msLeft > 0) return;
      if (stageRef.current === "thinking") void beginAnswer();
      else if (stageRef.current === "answering") finishAnswer("timeout");
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [stage, isPaused, beginAnswer, finishAnswer]);

  // Keep the pause state even when a dialog opens before a countdown exists.
  useLayoutEffect(() => {
    if (frozen) {
      if (pausedRemainingMsRef.current === null && deadlineRef.current) {
        pausedRemainingMsRef.current = Math.max(0, deadlineRef.current - Date.now());
        deadlineRef.current = 0;
      }
      setIsPaused(true);
    } else {
      if (pausedRemainingMsRef.current !== null) {
        deadlineRef.current = Date.now() + pausedRemainingMsRef.current;
        pausedRemainingMsRef.current = null;
      }
      setIsPaused(false);
    }
  }, [frozen]);

  const recordRepeat = useCallback(() => {
    const used = (repeatsByTurnRef.current.get(turnKey) || 0) + 1;
    repeatsByTurnRef.current.set(turnKey, used);
    setRepeatsUsed(used);
  }, [turnKey]);

  const getRemainingMs = useCallback(
    () => pausedRemainingMsRef.current ?? Math.max(0, deadlineRef.current - Date.now()),
    []
  );

  const totalSec = stage === "thinking" ? THINK_TIME_SEC : answerLimitSec;

  return {
    stage,
    remainingSec,
    totalSec,
    isPaused,
    isWarning: stage === "answering" && remainingSec <= ANSWER_WARNING_SEC,
    // Sub-second precision for smooth timer animation.
    getRemainingMs,
    canRepeat: stage === "thinking" && repeatsUsed < 1,
    startNow: beginAnswer,
    finishNow: () => finishAnswer("done"),
    retryMic: beginAnswer,
    submitDraft,
    recordRepeat,
    reset,
  };
}

export default useInterviewTurnFlow;

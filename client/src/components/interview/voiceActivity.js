// Live loudness of the interviewer's voice, used to animate the voice orb.
//
// Interviewer audio (pre-recorded clips and TTS blobs) is same-origin, so it can
// be routed through one shared AnalyserNode. The AudioContext must be created
// inside a user gesture: call `primeVoiceActivity()` from a click (Start,
// "Hear Shubh"). If the context isn't running, audio plays untouched and the orb
// falls back to a synthetic speaking motion — playback is never put at risk.

let context = null;
let analyser = null;
let samples = null;

const getAudioContextClass = () => window.AudioContext || window.webkitAudioContext;

/** Create/resume the shared AudioContext. Call synchronously inside a click handler. */
export function primeVoiceActivity() {
  try {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;
    if (!context) {
      context = new AudioContextClass();
      analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;
      analyser.connect(context.destination);
      samples = new Uint8Array(analyser.fftSize);
    }
    if (context.state === "suspended") void context.resume();
  } catch {
    context = null;
    analyser = null;
  }
}

/**
 * Route an <audio> element through the analyser before it plays.
 * No-op unless the context is already running (otherwise the element would be muted).
 */
export function connectVoiceActivity(audio) {
  if (!context || !analyser || context.state !== "running" || !audio || audio.__voiceActivity) return;
  try {
    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    audio.__voiceActivity = true;
    const release = () => {
      try { source.disconnect(); } catch { /* already gone */ }
    };
    audio.addEventListener("ended", release, { once: true });
    audio.addEventListener("error", release, { once: true });
  } catch { /* element already captured or context closed */ }
}

/** Current interviewer loudness, 0–1 (0 when nothing is routed). */
export function getVoiceLevel() {
  if (!analyser || !samples || context?.state !== "running") return 0;
  analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const value = (samples[index] - 128) / 128;
    sum += value * value;
  }
  // Speech RMS sits around 0.02–0.25; map that to a lively 0–1 range.
  return Math.min(1, Math.sqrt(sum / samples.length) * 4.5);
}

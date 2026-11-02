export const DETECTOR_VERSION = "temporal-vision-2";

const RULES = {
  PHONE_DETECTED: { duration: 2000, frames: 7, ratio: 0.7, floor: 0.6 },
  MULTIPLE_FACES: { duration: 2000, frames: 8, ratio: 0.8, floor: 0.7 },
  FACE_ABSENT: { duration: 4000, frames: 16, ratio: 0.8, floor: 0.7 },
  IDENTITY_SWITCH: { duration: 3000, frames: 10, ratio: 0.85, floor: 0.7 },
  GAZE_DEVIATION: { duration: 4000, frames: 16, ratio: 0.8, floor: 0.6 },
};

// Raw samples stay here; callers only surface the stabilized state/events.
export class TemporalEvidence {
  constructor() {
    this.buffers = new Map();
    this.lastEmitted = new Map();
    this.active = new Map();
  }

  observe(eventType, { present, confidence = 0, faceCount = null, now, meta = {} }) {
    const rule = RULES[eventType];
    if (!rule) return null;
    let samples = this.buffers.get(eventType) || [];
    // Inference gaps must not turn a few disconnected frames into sustained evidence.
    if (samples.length && now - samples.at(-1).now > 1000) {
      samples = [];
      this.active.set(eventType, false);
    }
    samples = samples.filter((sample) => now - sample.now <= 5000);
    samples.push({ now, present: present && confidence >= rule.floor, confidence });
    this.buffers.set(eventType, samples);
    const hits = samples.filter((sample) => sample.present);
    const durationMs = hits.length ? now - hits[0].now : 0;
    const stabilized = Boolean(present && confidence >= rule.floor && hits.length >= rule.frames && hits.length / samples.length >= rule.ratio && durationMs >= rule.duration);
    const recentlySeen = hits.some((sample) => now - sample.now < 1000);
    // One missed frame must not flicker an already-stabilized warning.
    this.active.set(eventType, stabilized || (this.isActive(eventType) && recentlySeen && hits.length / samples.length >= 0.4));
    if (!stabilized || now - (this.lastEmitted.get(eventType) ?? -Infinity) < 15000) return null;
    this.lastEmitted.set(eventType, now);
    return {
      eventType, confidence: hits.reduce((sum, sample) => sum + sample.confidence, 0) / hits.length,
      durationMs, evidenceCount: hits.length, faceCount, detectorVersion: DETECTOR_VERSION,
      meta: { ...meta, sampleCount: samples.length, positiveRatio: hits.length / samples.length },
    };
  }

  isActive(eventType) { return this.active.get(eventType) === true; }
}

// Translation/scale-invariant geometry, kept in memory only. This is a conservative
// continuity signal for human review, not biometric identity verification.
export function faceDescriptor(points) {
  if (!points?.[454]) return null;
  const distance = (a, b) => Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
  const width = distance(33, 263);
  if (width < 0.06 || Math.abs(points[33].y - points[263].y) / width > 0.2) return null;
  const noseOffset = Math.abs(points[1].x - (points[33].x + points[263].x) / 2) / width;
  if (noseOffset > 0.18) return null; // Only compare near-frontal observations.
  return [[234, 454], [10, 152], [168, 1], [1, 152], [61, 291]].map(([a, b]) => distance(a, b) / width);
}

export class CandidateContinuity {
  constructor() { this.baseline = null; this.calibration = []; this.lastSampleAt = null; }

  observe(descriptor, now) {
    if (!descriptor) {
      if (!this.baseline) this.calibration = [];
      return { changed: false, confidence: 0 };
    }
    if (!this.baseline) {
      if (this.lastSampleAt !== null && now - this.lastSampleAt > 1000) this.calibration = [];
      this.lastSampleAt = now;
      this.calibration.push({ descriptor, now });
      if (this.calibration.length >= 10 && now - this.calibration[0].now >= 2000) {
        this.baseline = descriptor.map((_, index) => {
          const values = this.calibration.map((sample) => sample.descriptor[index]).sort((a, b) => a - b);
          return values[Math.floor(values.length / 2)];
        });
        this.calibration = [];
      }
      return { changed: false, confidence: 0 };
    }
    const difference = descriptor.reduce((sum, value, index) => sum + Math.abs(value - this.baseline[index]) / Math.max(0.1, this.baseline[index]), 0) / descriptor.length;
    return { changed: difference > 0.22, confidence: Math.min(0.9, difference * 3), difference };
  }
}

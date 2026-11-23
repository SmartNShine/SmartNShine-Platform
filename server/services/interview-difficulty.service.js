/**
 * Interview Difficulty & Adaptive Cognitive Ladder Service
 * Implements a 5-level cognitive ladder (Bloom's Taxonomy adapted for Software Engineering),
 * seniority baselines, and state-driven turn decision logic.
 */

export const COGNITIVE_LEVELS = {
  1: {
    level: 1,
    name: "Foundations & Recall",
    label: "Level 1: Fundamentals",
    description: "Definition of terms, core concepts, syntax mechanics, and basic tool purposes.",
    sampleActionVerbs: ["Define", "Describe", "Explain difference between", "Identify"],
    rubricFocus: "Conceptual accuracy and clear definitions.",
  },
  2: {
    level: 2,
    name: "Practical Implementation",
    label: "Level 2: Implementation",
    description: "Writing code, assembling standard components, API usage, and configuring setups.",
    sampleActionVerbs: ["Implement", "Build", "Configure", "Demonstrate", "Integrate"],
    rubricFocus: "Working knowledge of practical implementation and standard library/framework idioms.",
  },
  3: {
    level: 3,
    name: "Optimization & Trade-offs",
    label: "Level 3: Trade-offs & Tuning",
    description: "Benchmarking, caching trade-offs, query tuning, concurrency nuances, and space/time complexity.",
    sampleActionVerbs: ["Analyze", "Optimize", "Compare trade-offs", "Diagnose bottleneck"],
    rubricFocus: "Awareness of resource costs (latency, CPU, memory) and why one solution is chosen over another.",
  },
  4: {
    level: 4,
    name: "System Design & Architecture",
    label: "Level 4: Architecture",
    description: "High availability, distributed data partitioning, consistency guarantees, and failover design.",
    sampleActionVerbs: ["Architect", "Design for 100k RPS", "Decompose", "Structure multi-region"],
    rubricFocus: "Handling scale, distributed consensus, decoupling, and operational resilience.",
  },
  5: {
    level: 5,
    name: "Chaos, Recovery & Synthesis",
    label: "Level 5: Chaos & Recovery",
    description: "Complex incident triage, cascading failure prevention, split-brain recovery, and zero-downtime migrations.",
    sampleActionVerbs: ["Triage live outage", "Resolve split-brain", "Recover from data corruption", "Execute zero-downtime cutover"],
    rubricFocus: "Executive composure, root-cause diagnosis under ambiguity, and robust disaster recovery.",
  },
};

// Experience level constraints on cognitive depth
export const SENIORITY_BASELINES = {
  fresher: { minLevel: 1, defaultLevel: 1, maxLevel: 3 },
  junior: { minLevel: 1, defaultLevel: 2, maxLevel: 3 },
  mid: { minLevel: 2, defaultLevel: 2, maxLevel: 4 },
  senior: { minLevel: 3, defaultLevel: 3, maxLevel: 5 },
  lead: { minLevel: 3, defaultLevel: 4, maxLevel: 5 },
};

export const TURN_DECISIONS = {
  PROBE_DEEP: "PROBE_DEEP", // Candidate made a vague claim or skipped critical architectural trade-off
  CHALLENGE_CONSTRAINT: "CHALLENGE_CONSTRAINT", // Candidate gave a strong answer; test edge-case / scale constraint
  STEP_DOWN_FOUNDATION: "STEP_DOWN_FOUNDATION", // Candidate struggled significantly; verify prerequisite concepts
  ADVANCE_SYLLABUS: "ADVANCE_SYLLABUS", // Candidate answered satisfactorily; advance to next syllabus topic
};

/**
 * Determine next cognitive level and turn decision based on answer evaluation
 * @param {Object} params
 * @returns {Object} { decision, nextCognitiveLevel, reason }
 */
export function evaluateTurnProgression({
  currentCognitiveLevel = 2,
  evaluationScore = 70,
  experienceLevel = "mid",
  hasVagueClaim = false,
  consecutiveHighScores = 0,
  consecutiveLowScores = 0,
  isFollowUp = false,
}) {
  const baseline = SENIORITY_BASELINES[experienceLevel] || SENIORITY_BASELINES.mid;
  let nextCognitiveLevel = currentCognitiveLevel;
  let decision = TURN_DECISIONS.ADVANCE_SYLLABUS;
  let reason = "Candidate gave a well-grounded response. Moving to next topic.";

  // If already in a follow-up, limit further drill-downs to prevent endless loops
  if (isFollowUp) {
    if (evaluationScore >= 70) {
      nextCognitiveLevel = Math.min(baseline.maxLevel, currentCognitiveLevel + 1);
      decision = TURN_DECISIONS.ADVANCE_SYLLABUS;
      reason = "Candidate successfully clarified the deep-dive question. Resuming planned syllabus.";
    } else {
      nextCognitiveLevel = Math.max(baseline.minLevel, currentCognitiveLevel - 1);
      decision = TURN_DECISIONS.ADVANCE_SYLLABUS;
      reason = "Clarification provided. Transitioning to next syllabus topic to maintain interview momentum.";
    }
    return {
      decision,
      nextCognitiveLevel,
      cognitiveMeta: COGNITIVE_LEVELS[nextCognitiveLevel],
      reason,
    };
  }

  // 1. Vague claims / buzzword dropping with moderate score -> Drill down immediately
  if (hasVagueClaim || (evaluationScore >= 50 && evaluationScore < 70)) {
    decision = TURN_DECISIONS.PROBE_DEEP;
    reason = "Candidate mentioned key concepts but lacked concrete operational details or trade-offs. Initiating targeted probe.";
    return {
      decision,
      nextCognitiveLevel: currentCognitiveLevel,
      cognitiveMeta: COGNITIVE_LEVELS[currentCognitiveLevel],
      reason,
    };
  }

  // 2. Exceptionally strong answer (> 85) -> Challenge with production scale or edge case
  if (evaluationScore >= 85) {
    if (consecutiveHighScores >= 1 && currentCognitiveLevel < baseline.maxLevel) {
      nextCognitiveLevel = Math.min(baseline.maxLevel, currentCognitiveLevel + 1);
      decision = TURN_DECISIONS.CHALLENGE_CONSTRAINT;
      reason = "Exceptional mastery demonstrated. Elevating cognitive depth to test real-world constraints.";
    } else {
      decision = TURN_DECISIONS.ADVANCE_SYLLABUS;
      reason = "Solid technical depth demonstrated. Advancing to next core competency.";
    }
    return {
      decision,
      nextCognitiveLevel,
      cognitiveMeta: COGNITIVE_LEVELS[nextCognitiveLevel],
      reason,
    };
  }

  // 3. Significant struggle (< 45) -> Step down diagnostic
  if (evaluationScore < 45) {
    if (currentCognitiveLevel > baseline.minLevel) {
      nextCognitiveLevel = Math.max(baseline.minLevel, currentCognitiveLevel - 1);
      decision = TURN_DECISIONS.STEP_DOWN_FOUNDATION;
      reason = "Candidate struggled with advanced trade-offs. Stepping down to test foundational prerequisites.";
    } else {
      decision = TURN_DECISIONS.ADVANCE_SYLLABUS;
      reason = "Pivot to a different domain to give candidate fresh opportunity.";
    }
    return {
      decision,
      nextCognitiveLevel,
      cognitiveMeta: COGNITIVE_LEVELS[nextCognitiveLevel],
      reason,
    };
  }

  // 4. Default: Smooth progress
  return {
    decision: TURN_DECISIONS.ADVANCE_SYLLABUS,
    nextCognitiveLevel: Math.max(baseline.minLevel, Math.min(baseline.maxLevel, nextCognitiveLevel)),
    cognitiveMeta: COGNITIVE_LEVELS[nextCognitiveLevel],
    reason: "Consistent performance. Advancing along syllabus.",
  };
}

/**
 * Format prompt instructions for the target cognitive level
 */
export function getCognitiveLevelPrompt(level = 2, role = "Engineer", experienceLevel = "mid") {
  const meta = COGNITIVE_LEVELS[level] || COGNITIVE_LEVELS[2];
  return `
COGNITIVE DEPTH TARGET: ${meta.label} (${meta.name})
- Target Expectation: ${meta.description}
- Rubric Focus: ${meta.rubricFocus}
- Suitable for: ${experienceLevel.toUpperCase()} level ${role}
- Question must NOT be trivia; test real-world reasoning appropriate for this cognitive depth.
`;
}

// Live-interview pacing: thinking window before the mic opens, and the answer
// window per question. Spoken modes only; text mode is untimed per question.
export const THINK_TIME_SEC = 10;
export const INTRO_ANSWER_TIME_SEC = 90;
const ANSWER_TIME_BY_DIFFICULTY = { easy: 120, medium: 150, hard: 180 };

/**
 * Seconds the candidate gets to answer a question.
 * Follow-ups are narrower (2:00); STAR stories and resume walkthroughs need room
 * (2:30, 3:00 at senior scope); hypotheticals are shorter (2:00); technical
 * questions scale with cognitive depth (2:00 / 2:30 / 3:00).
 */
export function getAnswerTimeLimitSec({ questionType, cognitiveLevel, difficulty, isFollowUp } = {}) {
  const level = Number(cognitiveLevel);
  if (isFollowUp || questionType === "follow-up") return level >= 4 ? 150 : 120;
  if (questionType === "behavioral" || questionType === "resume-based") return level >= 4 ? 180 : 150;
  if (questionType === "situational") return 120;
  if (level >= 4) return ANSWER_TIME_BY_DIFFICULTY.hard;
  if (level === 3) return ANSWER_TIME_BY_DIFFICULTY.medium;
  if (level === 1 || level === 2) return ANSWER_TIME_BY_DIFFICULTY.easy;
  return ANSWER_TIME_BY_DIFFICULTY[difficulty] || ANSWER_TIME_BY_DIFFICULTY.medium;
}

/**
 * How many questions fit into an interview of `minutes` length.
 * Spoken turns budget think time + an average answer + TTS/evaluation overhead,
 * after the greeting and self-introduction.
 */
export function estimateQuestionCount(minutes, mode = "live") {
  const duration = Number(minutes);
  if (!Number.isFinite(duration) || duration <= 0) return null;
  if (mode === "text") return Math.max(3, Math.min(15, Math.floor(duration * 0.8)));
  const introSec = 30 + THINK_TIME_SEC + INTRO_ANSWER_TIME_SEC;
  const perQuestionSec = THINK_TIME_SEC + 120 + 20; // most answers end before the limit
  const count = Math.floor((duration * 60 - introSec) / perQuestionSec);
  return Math.max(2, Math.min(15, count));
}

export default {
  COGNITIVE_LEVELS,
  SENIORITY_BASELINES,
  TURN_DECISIONS,
  THINK_TIME_SEC,
  INTRO_ANSWER_TIME_SEC,
  evaluateTurnProgression,
  getCognitiveLevelPrompt,
  getAnswerTimeLimitSec,
  estimateQuestionCount,
};

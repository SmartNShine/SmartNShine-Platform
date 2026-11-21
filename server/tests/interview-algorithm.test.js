/**
 * Unit Test Suite for Next-Generation AI Interview Algorithms
 * Verifies Syllabus Planning, Bloom's Cognitive Progression,
 * Answer Signal Detection, and Turn Decision Logic.
 */

import assert from "node:assert/strict";
import {
  ROLE_ONTOLOGIES,
  getOntologyForRole,
  generateInterviewSyllabus,
  calculateCompetencyCoverage,
} from "../services/interview-syllabus.service.js";
import {
  COGNITIVE_LEVELS,
  SENIORITY_BASELINES,
  TURN_DECISIONS,
  evaluateTurnProgression,
  getCognitiveLevelPrompt,
} from "../services/interview-difficulty.service.js";
import {
  analyzeAnswerSignals,
  buildEvaluatorPrompt,
} from "../services/interview-evaluator.service.js";

async function runTests() {
  console.log("🧪 Starting Next-Gen AI Interview Algorithm Test Suite...\n");
  let passed = 0;

  // Test 1: Role Ontologies and Custom Fallback
  console.log("Test 1: Role Ontologies and Fallbacks");
  assert.ok(ROLE_ONTOLOGIES.backend, "Backend ontology must exist");
  assert.ok(ROLE_ONTOLOGIES.backend.coreCategories.length >= 6, "Backend should have >= 6 categories");
  assert.ok(ROLE_ONTOLOGIES.backend.technicalKeywords.includes("ACID Transactions"), "Backend should contain key terms");
  
  const customRole = getOntologyForRole("Quantum Computing Specialist");
  assert.ok(customRole.title === "Quantum Computing Specialist", "Custom role should retain requested title");
  assert.ok(customRole.coreCategories.length > 0, "Custom role should have fallback categories");
  passed++;
  console.log("  ✅ Passed: Role ontologies and fallback resolution\n");

  // Test 2: Dynamic 5-Phase Syllabus Generation
  console.log("Test 2: Dynamic 5-Phase Syllabus Generation");
  const syllabus = generateInterviewSyllabus({
    role: "Backend Engineer",
    experienceLevel: "senior",
    interviewType: "mixed",
    resumeText: "Built microservices using Node.js and Kafka.",
    totalQuestions: 8,
  });

  assert.equal(syllabus.length, 8, "Syllabus should contain exactly 8 planned questions");
  assert.equal(syllabus[0].questionType, "resume-based", "Mixed interview with resume should start with resume deep dive");
  assert.equal(syllabus[0].cognitiveLevel, 2, "Phase 1 starts at level 2");

  // Senior level should test level 4 in Phase 3
  const phase3 = syllabus.find((s) => s.phase.includes("Phase 3"));
  assert.ok(phase3, "Phase 3 (Architecture) must be planned");
  assert.equal(phase3.cognitiveLevel, 4, "Senior candidate should have Level 4 cognitive target in Architecture phase");
  passed++;
  console.log("  ✅ Passed: Syllabus planning and phase allocation\n");

  // Test 3: Competency Coverage Tracking
  console.log("Test 3: Competency Coverage Tracking");
  const mockQuestions = [
    { questionNumber: 1, userAnswer: "Node.js with Postgres", category: syllabus[0].category, syllabusPhase: syllabus[0].phase },
    { questionNumber: 2, userAnswer: "Used Redis for cache", category: syllabus[1].category, syllabusPhase: syllabus[1].phase },
  ];
  const coverage = calculateCompetencyCoverage(syllabus, mockQuestions);
  assert.equal(coverage.completedCount, 2, "Completed count should be 2");
  assert.equal(coverage.totalPlanned, 8, "Total planned should match syllabus");
  assert.equal(coverage.nextPlannedItem.targetQuestionNumber, 3, "Next target should be question #3");
  passed++;
  console.log("  ✅ Passed: Competency coverage tracking\n");

  // Test 4: Answer Signal Analysis & Buzzword Detection
  console.log("Test 4: Answer Signal Analysis & Buzzword Detection");
  const fluffyAnswer = "We leveraged microservices, kafka, and kubernetes to achieve high availability.";
  const fluffySignals = analyzeAnswerSignals(fluffyAnswer, "technical");
  assert.ok(fluffySignals.isVagueOrFluffy, "Short answer with multiple buzzwords should trigger isVagueOrFluffy");
  assert.ok(fluffySignals.detectedBuzzwords.includes("kafka"), "Kafka buzzword should be detected");
  assert.equal(fluffySignals.hasConcreteMetrics, false, "Fluffy answer lacks concrete numbers");

  const solidAnswer = "I designed the Kafka consumer group with 12 partitions, reducing P99 consumer lag from 850ms to 45ms at 25k RPS.";
  const solidSignals = analyzeAnswerSignals(solidAnswer, "technical");
  assert.equal(solidSignals.isVagueOrFluffy, false, "Deep answer with metrics should not be flagged fluffy");
  assert.equal(solidSignals.hasConcreteMetrics, true, "Numbers and latency units should be detected");
  assert.ok(solidSignals.ownershipRatio >= 50, "Answer using 'I' should have high ownership ratio");
  passed++;
  console.log("  ✅ Passed: Answer signal analysis and buzzword detection\n");

  // Test 5: Cognitive Ladder Progression & Turn Decisions
  console.log("Test 5: Cognitive Ladder Progression & Turn Decisions");

  // 5a: Fluffy / Vague answer -> PROBE_DEEP
  const vagueProgression = evaluateTurnProgression({
    currentCognitiveLevel: 2,
    evaluationScore: 60,
    experienceLevel: "mid",
    hasVagueClaim: true,
  });
  assert.equal(vagueProgression.decision, TURN_DECISIONS.PROBE_DEEP, "Vague answer must trigger PROBE_DEEP");
  assert.equal(vagueProgression.nextCognitiveLevel, 2, "Probe stays at current cognitive level to test claim");

  // 5b: Exceptional score (90) with high consecutive scores -> CHALLENGE_CONSTRAINT
  const highProgression = evaluateTurnProgression({
    currentCognitiveLevel: 3,
    evaluationScore: 92,
    experienceLevel: "senior",
    consecutiveHighScores: 2,
  });
  assert.equal(highProgression.decision, TURN_DECISIONS.CHALLENGE_CONSTRAINT, "High consecutive score triggers CHALLENGE_CONSTRAINT");
  assert.equal(highProgression.nextCognitiveLevel, 4, "Cognitive depth must escalate from level 3 to 4");

  // 5c: Severe struggle (35) -> STEP_DOWN_FOUNDATION
  const struggleProgression = evaluateTurnProgression({
    currentCognitiveLevel: 3,
    evaluationScore: 35,
    experienceLevel: "mid",
  });
  assert.equal(struggleProgression.decision, TURN_DECISIONS.STEP_DOWN_FOUNDATION, "Low score triggers STEP_DOWN_FOUNDATION");
  assert.equal(struggleProgression.nextCognitiveLevel, 2, "Cognitive depth steps down from level 3 to 2");

  // 5d: Follow-up resolution -> resets to ADVANCE_SYLLABUS
  const followUpResolved = evaluateTurnProgression({
    currentCognitiveLevel: 2,
    evaluationScore: 78,
    isFollowUp: true,
  });
  assert.equal(followUpResolved.decision, TURN_DECISIONS.ADVANCE_SYLLABUS, "Follow-up question must advance to avoid probe loops");
  passed++;
  console.log("  ✅ Passed: Cognitive ladder progression and turn decisions\n");

  // Test 6: Prompt Construction Integrity
  console.log("Test 6: Prompt Construction Integrity");
  const cogPrompt = getCognitiveLevelPrompt(4, "Backend Engineer", "senior");
  assert.ok(cogPrompt.includes("System Design & Architecture"), "Level 4 prompt must specify architecture");

  const { systemPrompt, userPrompt } = buildEvaluatorPrompt({
    question: "How do you handle split-brain in distributed caches?",
    answer: "We use quorum reads and fencing tokens.",
    category: "Distributed Systems",
    role: "Backend Engineer",
    experienceLevel: "senior",
    cognitiveLevel: 4,
    signals: solidSignals,
  });
  assert.ok(systemPrompt.includes("Principal Engineering Interviewer"), "System prompt has staff-level persona");
  assert.ok(systemPrompt.includes("Depth & Trade-off Awareness"), "Prompt enforces trade-off rubric");
  assert.ok(userPrompt.includes("split-brain"), "User prompt includes target question");
  passed++;
  console.log("  ✅ Passed: Prompt construction integrity\n");

  console.log(`🎉 All ${passed}/${passed} Algorithm Unit Tests Passed Successfully!`);
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});

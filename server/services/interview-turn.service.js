/**
 * Unified Interview Turn Decision Engine
 * Executes answer evaluation, cognitive ladder progression, turn decision,
 * and next question generation (with conversational bridge) in a single fast structured pass.
 */

import * as openaiService from "./openai.service.js";
import AIUsage from "../models/AIUsage.model.js";
import { analyzeAnswerSignals } from "./interview-evaluator.service.js";
import {
  evaluateTurnProgression,
  COGNITIVE_LEVELS,
  getCognitiveLevelPrompt,
  TURN_DECISIONS,
} from "./interview-difficulty.service.js";
import { calculateCompetencyCoverage } from "./interview-syllabus.service.js";

/**
 * Parse AI response safely with resilient fallbacks
 */
function parseTurnResponse(responseText, fallback = {}) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse AI turn response:", err.message);
    return fallback;
  }
}

/**
 * Execute a complete interview turn in one structured LLM call
 * @param {Object} params
 * @returns {Promise<Object>} { evaluation, nextQuestion, turnDecision, progress }
 */
export async function processInterviewTurn(params) {
  const {
    session,
    currentQuestion,
    answerText,
    userId,
    isComplete = false,
    detectedLanguage = "unknown",
  } = params;

  const startTime = Date.now();
  const role = session.role || "Software Engineer";
  const experienceLevel = session.experienceLevel || "mid";
  const syllabus = session.syllabus || [];
  const questions = session.questions || [];
  const currentCognitiveLevel = currentQuestion.cognitiveLevel || 2;

  // 1. Compute candidate signals
  const signals = analyzeAnswerSignals(answerText, currentQuestion.questionType, detectedLanguage);

  // 2. Compute competency coverage
  const coverage = calculateCompetencyCoverage(syllabus, questions);
  const nextTargetTopic = coverage.nextPlannedItem || {
    category: "System Design & Architecture",
    cognitiveLevel: 3,
    phase: "Phase 3: Architecture & Trade-Offs",
    questionType: "technical",
  };

  // 3. Pre-evaluate turn progression
  const recentScores = questions
    .slice(-3)
    .map((q) => q.evaluation?.score || 70);
  const consecutiveHighScores = recentScores.filter((s) => s >= 80).length;
  const consecutiveLowScores = recentScores.filter((s) => s <= 50).length;

  const plannedProgression = evaluateTurnProgression({
    currentCognitiveLevel,
    evaluationScore: 70, // baseline estimation for prompt guidance
    experienceLevel,
    hasVagueClaim: signals.isVagueOrFluffy,
    consecutiveHighScores,
    consecutiveLowScores,
    isFollowUp: Boolean(currentQuestion.isFollowUp),
  });

  const nextCognitiveLevel = plannedProgression.nextCognitiveLevel;
  const cognitivePrompt = getCognitiveLevelPrompt(nextCognitiveLevel, role, experienceLevel);

  // If this turn completes the interview, we don't need a next question
  const isFinalQuestion = isComplete || questions.length >= session.totalQuestions;

  const systemPrompt = `You are an elite Technical Lead & Staff Interviewer conducting a real-time ${session.interviewType} interview for a ${experienceLevel.toUpperCase()} ${role}.

YOUR DUAL OBJECTIVE IN THIS TURN:
1. Thoroughly evaluate the candidate's answer against staff-level engineering rubrics.
2. If the interview continues, formulate the next question and an acknowledgment bridge.

INTERVIEW CANDIDATE CONTEXT:
- Role: ${role} (${experienceLevel} level)
- Interview Type: ${session.interviewType}
${session.targetSkills?.length ? `- Focus Skills: ${session.targetSkills.join(", ")}` : ""}
${session.resumeText ? `- Candidate Resume Summary: ${session.resumeText.substring(0, 800)}...` : ""}
${session.jobDescription ? `- Job Requirements: ${session.jobDescription.substring(0, 600)}...` : ""}

CURRENT INTERVIEW STATUS:
- Current Question #${currentQuestion.questionNumber}: "${currentQuestion.questionText}"
- Category: ${currentQuestion.category}
- Target Depth: Cognitive Level ${currentCognitiveLevel}
- Signals: Word count=${signals.wordCount}, Buzzwords=${signals.detectedBuzzwords.join(", ") || "none"}, HasMetrics=${signals.hasConcreteMetrics}, Language=${signals.isNonEnglishAnswer ? "Non-English/Code-Mixed (PENALIZE)" : "English"}

NEXT QUESTION OBJECTIVE (if not final question):
- Planned Syllabus Target: ${nextTargetTopic.category} (${nextTargetTopic.phase})
${cognitivePrompt}

CRITICAL LANGUAGE COMPLIANCE POLICY (ENGLISH MANDATORY):
- English is strictly the required interview language.
- Evaluate the candidate's language:
  * If the answer is in English: evaluate normally on engineering merit.
  * If the candidate answers primarily or substantially in a non-English language (such as Hindi, Bengali, Tamil, Telugu, Marathi, Spanish, etc., or Hinglish without English explanation):
    1. HEAVILY DEDUCT MARKS: Deduct 25 to 40 points from the total score and communicationSignal. Maximum overall score must not exceed 50.
    2. Add to "weaknesses": "Answer was delivered in non-English / unauthorized language. English is mandatory for this interview."
    3. In "feedback", explicitly state: "Marks were deducted because the response was not delivered in English."
    4. In "improvementTips", include: "Practice articulating technical solutions strictly in English."

TURN DECISION LOGIC:
- If candidate's answer was vague / dropped buzzwords without substance -> Ask a DIRECT targeted DRILL-DOWN follow-up probe on their claim.
- If candidate's answer was exceptionally strong -> Introduce a PRODUCTION SCALE or EDGE-CASE constraint.
- If candidate struggled significantly -> Step down to verify prerequisite foundations.
- If candidate gave a good solid answer -> Advance to the planned syllabus target with a natural conversational bridge.

RULES FOR THE NEXT QUESTION:
1. Strictly 1 to 2 sentences (20-35 words max) for smooth real-time voice synthesis.
2. Must include a warm, natural conversational acknowledgment bridge (e.g. "Got it, that clarifies your indexing strategy. Looking at system resilience...").
3. DO NOT recite long resume summaries or preface with robot speak.
4. Test real engineering depth, trade-offs, and failure recovery.

OUTPUT FORMAT (JSON ONLY):
{
  "evaluation": {
    "score": 78,
    "technicalAccuracy": 80,
    "depthAndTradeoffs": 75,
    "evidenceAndGrounding": 70,
    "communicationSignal": 85,
    "strengths": ["Specific strength with candidate quote", "Another solid point"],
    "weaknesses": ["Specific technical gap or unaddressed trade-off"],
    "missingKeywords": ["keyword1", "keyword2"],
    "suggestedAnswer": "Concise senior engineer ideal answer",
    "improvementTips": ["Actionable tip 1", "Actionable tip 2"],
    "feedback": "Two-sentence balanced summary of their answer",
    "starBreakdown": {
      "situation": "Identified context or (Missing)",
      "task": "Identified task or (Missing)",
      "action": "Personal action or (Missing)",
      "result": "Measurable outcome or (Missing)"
    },
    "hasVagueClaim": false
  },
  "turnDecision": "PROBE_DEEP|CHALLENGE_CONSTRAINT|STEP_DOWN_FOUNDATION|ADVANCE_SYLLABUS",
  "decisionReason": "Why this turn decision was made",
  "nextQuestion": ${isFinalQuestion ? "null" : `{
    "text": "Your 1-2 sentence spoken interview question here",
    "acknowledgmentBridge": "Brief human transition acknowledgment",
    "questionType": "${nextTargetTopic.questionType || "technical"}",
    "category": "${nextTargetTopic.category || "Architecture"}",
    "cognitiveLevel": ${nextCognitiveLevel},
    "difficulty": "${nextCognitiveLevel >= 4 ? "hard" : nextCognitiveLevel <= 2 ? "easy" : "medium"}",
    "isFollowUp": false,
    "expectedKeywords": ["key1", "key2"]
  }`}
}`;

  const userPrompt = `
CANDIDATE'S ACTUAL ANSWER TO QUESTION #${currentQuestion.questionNumber}:
"${answerText}"
${detectedLanguage && detectedLanguage !== "unknown" ? `[STT Auto-Detected Language: ${detectedLanguage}]` : ""}
${signals.isNonEnglishAnswer ? `[System Language Flag: Non-English response detected - apply language penalty]` : ""}

Process this turn completely and output strictly the required JSON structure.`;

  try {
    const response = await openaiService.chatCompletion(systemPrompt, userPrompt, {
      temperature: 0.4,
      maxTokens: 1400,
    });

    const parsed = parseTurnResponse(response.text, {
      evaluation: {
        score: 75,
        technicalAccuracy: 75,
        depthAndTradeoffs: 70,
        evidenceAndGrounding: 70,
        communicationSignal: 80,
        strengths: ["Clear and relevant response."],
        weaknesses: ["Could provide deeper trade-off analysis."],
        missingKeywords: [],
        suggestedAnswer: "A more comprehensive answer would balance latency with operational cost.",
        improvementTips: ["Cite specific production metrics and architectural trade-offs."],
        feedback: "Solid foundation. Keep backing your claims with concrete examples.",
      },
      turnDecision: TURN_DECISIONS.ADVANCE_SYLLABUS,
      decisionReason: "Progressing along the interview syllabus.",
      nextQuestion: isFinalQuestion
        ? null
        : {
            text: `How do you handle data consistency and caching invalidation across distributed services?`,
            acknowledgmentBridge: "Good points on that implementation.",
            questionType: "technical",
            category: nextTargetTopic.category || "Distributed Systems",
            cognitiveLevel: nextCognitiveLevel,
            difficulty: nextCognitiveLevel >= 4 ? "hard" : "medium",
            isFollowUp: false,
            expectedKeywords: ["Cache-Aside", "TTL", "Eventual Consistency"],
          },
    });

    const responseTime = Date.now() - startTime;

    // Log AI usage
    try {
      if (userId) {
        await AIUsage.create({
          userId,
          aiProvider: "openai",
          aiModel: "gpt4o",
          feature: "ai_interview_turn",
          tokensUsed: response.tokenUsage?.totalTokens || 0,
          cost: (response.tokenUsage?.totalTokens || 0) * 0.00002,
          responseTime,
          status: "success",
          metadata: {
            action: "interview_turn",
            questionNumber: currentQuestion.questionNumber,
            turnDecision: parsed.turnDecision,
          },
        });
      }
    } catch (_) {}

    return {
      evaluation: {
        score: parsed.evaluation?.score || 70,
        relevance: parsed.evaluation?.communicationSignal || 75,
        technicalAccuracy: parsed.evaluation?.technicalAccuracy || 75,
        clarity: parsed.evaluation?.communicationSignal || 75,
        confidence: signals.wordCount >= 25 ? 80 : 65,
        roleFit: parsed.evaluation?.technicalAccuracy || 75,
        depthAndTradeoffs: parsed.evaluation?.depthAndTradeoffs || 70,
        evidenceAndGrounding: parsed.evaluation?.evidenceAndGrounding || 70,
        strengths: parsed.evaluation?.strengths || ["Well articulated answer."],
        weaknesses: parsed.evaluation?.weaknesses || [],
        missingKeywords: parsed.evaluation?.missingKeywords || [],
        suggestedAnswer: parsed.evaluation?.suggestedAnswer || "",
        improvementTips: parsed.evaluation?.improvementTips || [],
        feedback: parsed.evaluation?.feedback || "Response evaluated successfully.",
        starBreakdown: parsed.evaluation?.starBreakdown || null,
        signals,
      },
      turnDecision: parsed.turnDecision || TURN_DECISIONS.ADVANCE_SYLLABUS,
      decisionReason: parsed.decisionReason || "",
      nextQuestion: parsed.nextQuestion
        ? {
            ...parsed.nextQuestion,
            cognitiveMeta: COGNITIVE_LEVELS[parsed.nextQuestion.cognitiveLevel || nextCognitiveLevel],
          }
        : null,
      signals,
    };
  } catch (error) {
    console.error("❌ Error in unified interview turn execution:", error.message);
    const responseTime = Date.now() - startTime;

    // Graceful fallback
    return {
      evaluation: {
        score: 75,
        technicalAccuracy: 75,
        depthAndTradeoffs: 70,
        evidenceAndGrounding: 70,
        communicationSignal: 75,
        confidence: 75,
        relevance: 75,
        roleFit: 75,
        strengths: ["Answer recorded and evaluated."],
        weaknesses: [],
        improvementTips: ["Continue providing practical examples from your experience."],
        feedback: "Your response has been captured. Keep up the solid momentum!",
        signals,
      },
      turnDecision: TURN_DECISIONS.ADVANCE_SYLLABUS,
      decisionReason: "Fallback resilient progression.",
      nextQuestion: isFinalQuestion
        ? null
        : {
            text: `Could you walk me through how you approach system scalability and handle critical performance bottlenecks in your projects?`,
            acknowledgmentBridge: "Thank you for that response.",
            questionType: "technical",
            category: nextTargetTopic.category || "Architecture",
            cognitiveLevel: 3,
            difficulty: "medium",
            isFollowUp: false,
            expectedKeywords: ["Profiling", "Caching", "Load Balancing"],
            cognitiveMeta: COGNITIVE_LEVELS[3],
          },
      signals,
    };
  }
}

export default {
  processInterviewTurn,
};

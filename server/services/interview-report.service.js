/**
 * Executive Interview Report Service
 * Generates comprehensive multi-dimensional competency radar reports,
 * question-level audit grids, and personalized 14-day growth roadmaps.
 */

import * as openaiService from "./openai.service.js";
import AIUsage from "../models/AIUsage.model.js";

function parseReportResponse(responseText, fallback = {}) {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse report AI response:", err.message);
    return fallback;
  }
}

/**
 * Generate deep executive performance report
 * @param {Object} session
 * @param {Object} user
 * @returns {Promise<Object>}
 */
export async function generateExecutiveReport(session, user) {
  const startTime = Date.now();
  const role = session.role || "Software Engineer";
  const experienceLevel = session.experienceLevel || "mid";

  // Summarize questions and evaluations
  const qaSummary = session.questions.map((q) => ({
    number: q.questionNumber,
    question: q.questionText,
    type: q.questionType,
    category: q.category,
    cognitiveLevel: q.cognitiveLevel || 2,
    answer: q.userAnswer || q.transcribedText || "(Skipped)",
    score: q.evaluation?.score || 0,
    strengths: q.evaluation?.strengths || [],
    weaknesses: q.evaluation?.weaknesses || [],
    missingKeywords: q.evaluation?.missingKeywords || [],
    starBreakdown: q.evaluation?.starBreakdown || null,
  }));

  const systemPrompt = `You are a Principal Engineering Bar Raiser and Technical Hiring Committee Lead generating an Executive Interview Performance Report for a ${experienceLevel.toUpperCase()} ${role}.

REPORT OBJECTIVES:
1. Provide a rigorous, evidence-based assessment.
2. Evaluate across the 5 Core Technical Competencies:
   - Technical Depth & Correctness (0-100)
   - Architectural Trade-offs & Scalability (0-100)
   - Evidence & Grounding in Real Systems (0-100)
   - STAR Behavioral & Problem Solving (0-100)
   - Communication Signal & Conciseness (0-100)
3. Generate a personalized 14-Day Growth Roadmap with targeted topics and resources.
4. Provide Resume Optimization Suggestions based on projects/technologies demonstrated.
5. Language Policy Assessment: English is the mandatory interview language. If candidate answers contained non-English responses, reflect this in Communication Signal deductions, weaknesses, and hiring recommendations.

OUTPUT FORMAT (JSON ONLY):
{
  "overallScore": 78,
  "grade": "A|B|C|D",
  "performanceLevel": "Excellent|Good|Average|Needs Improvement",
  "hiringRecommendation": {
    "recommendation": "strong-hire|hire|maybe|no-hire|strong-no-hire",
    "confidence": 85,
    "reasoning": "Executive summary of why this recommendation was reached"
  },
  "radarCompetencies": {
    "technicalDepth": { "score": 82, "summary": "Demonstrated solid understanding of indexing and memory management." },
    "architecturalTradeoffs": { "score": 75, "summary": "Identified primary trade-offs, could go deeper into failure modes." },
    "evidenceAndGrounding": { "score": 70, "summary": "Cited some production metrics; needs more concrete scale numbers." },
    "starProblemSolving": { "score": 80, "summary": "Clear personal ownership in conflict scenarios." },
    "communicationSignal": { "score": 85, "summary": "Structured and direct communication without unnecessary fluff." }
  },
  "skillBreakdown": {
    "communication": { "score": 85, "feedback": "Clear and articulate delivery." },
    "technicalKnowledge": { "score": 82, "feedback": "Strong core fundamentals." },
    "problemSolving": { "score": 78, "feedback": "Methodical decomposition of trade-offs." },
    "situationalAwareness": { "score": 80, "feedback": "Mature engineering perspective." },
    "culturalFit": { "score": 85, "feedback": "Collaborative, ownership-driven mindset." }
  },
  "topicBreakdown": [
    { "skillName": "Distributed Systems", "score": 75, "questionsAsked": 2, "feedback": "Good handle on caching; study consensus." }
  ],
  "strengths": ["Top strength with specific evidence", "Another demonstrated strength"],
  "weaknesses": ["Primary technical blind spot", "Secondary area for improvement"],
  "missedKeywords": ["keyword1", "keyword2"],
  "resumeImprovements": [
    "Translate project discussion in Q2 into a resume bullet: 'Engineered Redis caching layer reducing API P99 latency by 45%'",
    "Highlight specific metrics and user scale in past project bullets."
  ],
  "practiceAreas": ["Distributed Consensus (Raft/Paxos)", "Database Sharding & Partitioning"],
  "studyRoadmap": [
    { "day": "Days 1-3", "focus": "Deep dive into Raft consensus and split-brain recovery", "recommendedResource": "Designing Data-Intensive Applications (Chapter 8-9)" },
    { "day": "Days 4-7", "focus": "Hands-on database indexing and query plan analysis", "recommendedResource": "Use The Index, Luke! & PostgreSQL EXPLAIN guides" },
    { "day": "Days 8-14", "focus": "System design mock rounds under high-scale constraints", "recommendedResource": "High Scalability architecture case studies" }
  ],
  "summary": "Executive summary paragraph of overall interview performance.",
  "detailedFeedback": "In-depth technical review analyzing the candidate's strengths and areas for growth."
}`;

  const userPrompt = `
INTERVIEW QUESTIONS & ANSWERS DATA:
${JSON.stringify(qaSummary, null, 2)}

TOTAL TIME: ${session.totalDurationSeconds || 0} seconds
ROLE: ${role} (${experienceLevel})

Generate the complete executive report JSON.`;

  try {
    const response = await openaiService.chatCompletion(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 2200,
    });

    const parsed = parseReportResponse(response.text, {
      overallScore: 75,
      grade: "B",
      performanceLevel: "Good",
      hiringRecommendation: { recommendation: "hire", confidence: 75, reasoning: "Solid performance across technical domains." },
      radarCompetencies: {
        technicalDepth: { score: 75, summary: "Solid fundamentals." },
        architecturalTradeoffs: { score: 70, summary: "Good awareness of common patterns." },
        evidenceAndGrounding: { score: 72, summary: "Provided practical examples." },
        starProblemSolving: { score: 78, summary: "Effective approach to technical challenges." },
        communicationSignal: { score: 80, summary: "Clear and structured explanations." },
      },
      skillBreakdown: {
        communication: { score: 80, feedback: "Clear articulation." },
        technicalKnowledge: { score: 75, feedback: "Solid concepts." },
        problemSolving: { score: 75, feedback: "Logical approach." },
        situationalAwareness: { score: 75, feedback: "Good perspective." },
        culturalFit: { score: 80, feedback: "Collaborative mindset." },
      },
      topicBreakdown: [],
      strengths: ["Clear technical articulation", "Demonstrated hands-on experience"],
      weaknesses: ["Deepen trade-off analysis between architectural patterns"],
      missedKeywords: [],
      resumeImprovements: ["Include measurable metrics for performance optimizations mentioned."],
      practiceAreas: ["System Scalability", "Failure Mode Scenarios"],
      studyRoadmap: [
        { day: "Days 1-7", focus: "Architecture & Scalability", recommendedResource: "System design case studies" },
        { day: "Days 8-14", focus: "STAR Behavioral Refinement", recommendedResource: "STAR storytelling framework" }
      ],
      summary: "Completed interview round with solid foundation across core topics.",
      detailedFeedback: "Performance demonstrated good hands-on proficiency with room to expand into advanced architectural edge cases.",
    });

    const responseTime = Date.now() - startTime;

    if (user?._id) {
      try {
        await AIUsage.create({
          userId: user._id,
          aiProvider: "openai",
          aiModel: "gpt4o",
          feature: "ai_interview_report",
          tokensUsed: response.tokenUsage?.totalTokens || 0,
          cost: (response.tokenUsage?.totalTokens || 0) * 0.00003,
          responseTime,
          status: "success",
          metadata: { action: "executive_report" },
        });
      } catch (_) {}
    }

    return parsed;
  } catch (error) {
    console.error("❌ Error generating executive report:", error.message);
    const evaluatedQuestions = session.questions.filter((q) => q.evaluation?.score > 0);
    const scores = evaluatedQuestions.map((q) => q.evaluation.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;

    return {
      overallScore: avgScore,
      grade: avgScore >= 80 ? "A" : avgScore >= 60 ? "B" : "C",
      performanceLevel: avgScore >= 80 ? "Good" : "Average",
      hiringRecommendation: { recommendation: avgScore >= 75 ? "hire" : "maybe", confidence: 70, reasoning: "Consistent effort demonstrated." },
      radarCompetencies: {
        technicalDepth: { score: avgScore, summary: "Solid baseline understanding." },
        architecturalTradeoffs: { score: avgScore - 5, summary: "Focus on comparing architectural options." },
        evidenceAndGrounding: { score: avgScore, summary: "Clear project context." },
        starProblemSolving: { score: avgScore, summary: "Sound problem-solving methodology." },
        communicationSignal: { score: avgScore + 5, summary: "Articulate answers." },
      },
      skillBreakdown: {
        communication: { score: avgScore + 5, feedback: "Good communication." },
        technicalKnowledge: { score: avgScore, feedback: "Good fundamentals." },
        problemSolving: { score: avgScore, feedback: "Structured reasoning." },
        situationalAwareness: { score: avgScore, feedback: "Mature engineering approach." },
        culturalFit: { score: avgScore + 5, feedback: "Collaborative mindset." },
      },
      topicBreakdown: [],
      strengths: evaluatedQuestions.flatMap((q) => q.evaluation?.strengths || []).slice(0, 5),
      weaknesses: evaluatedQuestions.flatMap((q) => q.evaluation?.weaknesses || []).slice(0, 5),
      missedKeywords: [],
      resumeImprovements: ["Include quantitative production impact in resume bullet points."],
      practiceAreas: ["System Design Trade-offs", "Production Incident Triage"],
      studyRoadmap: [
        { day: "Days 1-7", focus: "Architecture & Scale", recommendedResource: "Modern system design deep-dives" },
        { day: "Days 8-14", focus: "Performance Optimization", recommendedResource: "Benchmarking and profiling guides" }
      ],
      summary: "Interview completed. Review individual question feedback for detailed metrics.",
      detailedFeedback: "Solid technical performance with consistent engagement throughout the session.",
    };
  }
}

export default {
  generateExecutiveReport,
};

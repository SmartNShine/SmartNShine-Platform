/**
 * Interview Evaluator Service
 * Implements multi-rubric evaluation, STAR behavioral parsing,
 * buzzword fluff detection, and evidence-grounded feedback.
 */

/**
 * Common technical buzzwords that candidates often drop without concrete depth
 */
const BUZZWORD_WATCHLIST = [
  "scalability", "microservices", "kubernetes", "kafka", "distributed systems",
  "high availability", "low latency", "cloud-native", "idempotency", "resilience",
  "event-driven", "nosql", "caching", "optimized", "agile", "devops", "ci/cd"
];

/**
 * Analyze candidate answer for observable delivery traits and buzzwords
 * @param {string} answerText
 * @param {string} questionType
 * @returns {Object} Delivery metrics and buzzword flags
 */
export function analyzeAnswerSignals(answerText = "", questionType = "technical", detectedLanguage = null) {
  const text = (answerText || "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Personal ownership vs team delegation
  const lowerText = text.toLowerCase();
  const iMatches = (lowerText.match(/\b(i|my|mine|myself)\b/g) || []).length;
  const weMatches = (lowerText.match(/\b(we|our|us|team)\b/g) || []).length;
  const ownershipRatio = iMatches / Math.max(1, iMatches + weMatches);

  // Buzzword analysis
  const detectedBuzzwords = BUZZWORD_WATCHLIST.filter((bw) =>
    new RegExp(`\\b${bw}\\b`, "i").test(lowerText)
  );

  // Vague flag: high buzzwords but very short word count (< 35 words)
  const isVagueOrFluffy = detectedBuzzwords.length >= 2 && wordCount < 35;

  // Measurable metrics detection (numbers, percentages, milliseconds, TPS, RPS)
  const hasConcreteMetrics = /\b\d+(?:\.\d+)?(?:%|ms|s|k|m|rps|qps|users|req\/s|gb|tb)?\b/i.test(text);

  // Language compliance analysis (English preferred; non-English answers penalized)
  const hasIndicOrNonLatinScript = /[\u0900-\u0D7F\u0600-\u06FF]/.test(text);
  const ROMANIZED_NON_ENGLISH = [
    "karna", "karta", "karenge", "karega", "nahi", "nahin", "hoga", "hogi",
    "hota", "hoti", "mera", "meri", "humne", "maine", "unhone", "kuch",
    "bohot", "bahut", "accha", "achha", "samajh", "chahiye", "bolna", "kaise",
    "kyunki", "isliye", "lekin", "magar", "matlab"
  ];
  const romanizedMatches = ROMANIZED_NON_ENGLISH.filter((w) =>
    new RegExp(`\\b${w}\\b`, "i").test(lowerText)
  );
  const isSttNonEnglish = Boolean(
    detectedLanguage &&
    detectedLanguage !== "unknown" &&
    !detectedLanguage.toLowerCase().startsWith("en")
  );
  const isNonEnglishAnswer = hasIndicOrNonLatinScript || romanizedMatches.length >= 2 || isSttNonEnglish;

  return {
    wordCount,
    detectedBuzzwords,
    isVagueOrFluffy,
    hasConcreteMetrics,
    ownershipRatio: Math.round(ownershipRatio * 100),
    deliveryConfidence: wordCount >= 30 ? "high" : wordCount >= 15 ? "moderate" : "brief",
    isNonEnglishAnswer,
    detectedLanguage: detectedLanguage || (hasIndicOrNonLatinScript ? "indic-script" : isSttNonEnglish ? detectedLanguage : null),
  };
}

/**
 * Build evaluation prompt with strict rubrics and STAR parsing rules
 */
export function buildEvaluatorPrompt({
  question,
  answer,
  questionType = "technical",
  category = "General",
  expectedKeywords = [],
  role = "Software Engineer",
  experienceLevel = "mid",
  cognitiveLevel = 2,
  signals = {},
}) {
  const isBehavioral = questionType === "behavioral" || category.toLowerCase().includes("behavioral");

  const systemPrompt = `You are a Principal Engineering Interviewer and Staff Bar Raiser assessing candidates for a ${experienceLevel.toUpperCase()} ${role} role.

EVALUATION RUBRIC:
1. Technical Precision & Accuracy (0-100):
   - Correctness of concepts, architecture, and terminology.
   - Zero tolerance for hallucinated or factually invalid claims.

2. Depth & Trade-off Awareness (0-100):
   - Did the candidate explain WHY they chose a solution over alternatives?
   - Did they address latency, cost, memory, or operational trade-offs?

3. Evidence & Concrete Grounding (0-100):
   - Real-world specifics, metrics, edge cases, and personal technical agency.
   - Penalize generic textbook answers or unsubstantiated buzzword dropping.

${isBehavioral ? `
4. STAR Behavioral Execution (0-100):
   - Situation: Clear business/technical context?
   - Task: Specific challenge assigned to the candidate?
   - Action: WHAT DID THE CANDIDATE PERSONALLY DO? (Differentiate 'I' from 'we').
   - Result: Measurable outcome, production impact, or post-incident learning?
` : `
4. Practical Problem-Solving (0-100):
   - Feasibility of implementation, edge-case coverage, and handling of failure modes.
`}

5. Communication Signal-to-Noise (0-100):
   - Structured, concise, articulate delivery vs rambling or evasive deflection.

6. LANGUAGE COMPLIANCE POLICY (ENGLISH MANDATED):
   - English is strictly the required interview language for all technical and behavioral assessments.
   - Spoken answers are auto-detected.
   - If the candidate answered in English: evaluate normally on technical merit.
   - If the candidate answered in a non-English language (e.g. Hindi, Bengali, Tamil, Telugu, Spanish, Hinglish without English explanation):
     * DEDUCT MARKS HEAVILY: Deduct 25 to 40 points from the total score and cap communicationSignal at 45 max. Overall score must not exceed 50.
     * In "weaknesses", include: "Response was delivered in a non-English language. English is mandatory for this professional evaluation."
     * In "feedback", explicitly state: "Marks were deducted because the response was not delivered in English."
     * In "improvementTips", include: "Practice articulating technical solutions and trade-offs strictly in English."

OBSERVABLE SIGNALS:
- Candidate Answer Word Count: ${signals.wordCount || 0} words
- Detected Buzzwords: ${signals.detectedBuzzwords?.join(", ") || "None"}
- Has Concrete Metrics: ${signals.hasConcreteMetrics ? "Yes" : "No"}
- Target Cognitive Level: Level ${cognitiveLevel}
- Language Compliance Status: ${signals.isNonEnglishAnswer ? "⚠️ Non-English signals detected (apply score deduction)" : "English detected"}

OUTPUT FORMAT:
Respond with ONLY valid JSON:
{
  "score": 78,
  "technicalAccuracy": 80,
  "depthAndTradeoffs": 75,
  "evidenceAndGrounding": 70,
  "starOrProblemSolving": 80,
  "communicationSignal": 85,
  "strengths": ["Specific strength quoting candidate's actual answer", "Another solid point"],
  "weaknesses": ["Specific gap or unaddressed trade-off", "Missing edge-case"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestedAnswer": "Concise, senior-engineer ideal answer outline",
  "improvementTips": ["1 actionable advice", "Another practical recommendation"],
  "feedback": "2-sentence executive summary of the response",
  "starBreakdown": {
    "situation": "Identified context or (Missing)",
    "task": "Identified task or (Missing)",
    "action": "Personal action described or (Missing)",
    "result": "Measurable outcome or (Missing)"
  },
  "hasVagueClaim": false,
  "vagueClaimDetail": "Specific point that sounded like a buzzword without depth, or null"
}`;

  const userPrompt = `
INTERVIEW QUESTION:
"${question}" (Category: ${category}, Type: ${questionType})

CANDIDATE'S ACTUAL RESPONSE:
"${answer}"

Evaluate with rigorous senior engineering standards.`;

  return { systemPrompt, userPrompt };
}

export default {
  analyzeAnswerSignals,
  buildEvaluatorPrompt,
};

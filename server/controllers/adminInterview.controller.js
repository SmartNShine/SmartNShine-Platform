import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import Settings from "../models/Settings.model.js";
import User from "../models/User.model.js";
import mongoose from "mongoose";

/**
 * Helper to get active interview pricing config
 */
const getActivePricing = async () => {
  try {
    const settings = await Settings.getSettings();
    return (
      settings.interviewPricing || {
        sarvamSttRatePerMinuteInr: 0.50, // Official Sarvam Saaras rate: ₹30/hr = ₹0.50/min
        sarvamTtsRatePerThousandCharsInr: 3.00, // Official Sarvam Bulbul v3 rate: ₹30 per 10k chars = ₹3.00/1k chars
        llmInputTokenRatePerMillionInr: 13.0, // Official GPT-4o-mini: $0.15/1M ≈ ₹13.00
        llmOutputTokenRatePerMillionInr: 52.0, // Official GPT-4o-mini: $0.60/1M ≈ ₹52.00
        usdToInrExchangeRate: 86.5,
        creditsPerLiveInterview: 5,
        creditsPerTextInterview: 2,
      }
    );
  } catch (error) {
    return {
      sarvamSttRatePerMinuteInr: 0.50,
      sarvamTtsRatePerThousandCharsInr: 3.00,
      llmInputTokenRatePerMillionInr: 13.0,
      llmOutputTokenRatePerMillionInr: 52.0,
      usdToInrExchangeRate: 86.5,
      creditsPerLiveInterview: 5,
      creditsPerTextInterview: 2,
    };
  }
};

/**
 * Helper to calculate or derive session costs
 */
export const calculateSessionCosts = (session, pricing) => {
  const isLive = session.mode === "live" || session.mode === "voice";
  const exchangeRate = pricing.usdToInrExchangeRate || 86.5;
  const engine = session.voiceEngineUsed || (session.mode === "text" ? "none" : "local");
  const isSarvam = engine === "sarvam";

  const answeredCount = session.questions?.filter((q) => q.userAnswer)?.length || 0;
  const hasActivity = answeredCount > 0 || session.status === "completed";

  // 1. STT metrics
  let sttDurationSec = session.costBreakdown?.stt?.durationSeconds || 0;
  if (!sttDurationSec && isLive && hasActivity) {
    sttDurationSec = answeredCount * 45; // average 45s voice answer
  }
  const sttMinutes = sttDurationSec / 60;
  // Local Whisper has ₹0 API cost; only Sarvam cloud STT incurs API charges
  const sttCostInr = isSarvam ? +(sttMinutes * (pricing.sarvamSttRatePerMinuteInr || 0.50)).toFixed(3) : 0;
  const sttCostUsd = +(sttCostInr / exchangeRate).toFixed(4);

  // 2. TTS metrics
  let ttsChars = session.costBreakdown?.tts?.characterCount || 0;
  if (!ttsChars && isLive && hasActivity) {
    ttsChars = session.questions?.reduce((sum, q) => sum + (q.questionText?.length || 150), 0) || 0;
    ttsChars += 300; // intro + closing
  }
  // Local Chatterbox has ₹0 API cost; only Sarvam cloud TTS incurs API charges
  const ttsCostInr = isSarvam ? +((ttsChars / 1000) * (pricing.sarvamTtsRatePerThousandCharsInr || 3.00)).toFixed(3) : 0;
  const ttsCostUsd = +(ttsCostInr / exchangeRate).toFixed(4);

  // 3. LLM metrics
  let promptTokens = session.costBreakdown?.llm?.promptTokens || 0;
  let completionTokens = session.costBreakdown?.llm?.completionTokens || 0;
  if (!promptTokens && !completionTokens) {
    if (hasActivity) {
      const qCount = Math.max(1, answeredCount || session.questions?.length || 1);
      promptTokens = qCount * 800; // Question generation & context
      completionTokens = qCount * 350; // Evaluation & feedback
    } else {
      promptTokens = 0;
      completionTokens = 0;
    }
  }
  const totalTokens = promptTokens + completionTokens;
  const inputCostInr = (promptTokens / 1000000) * (pricing.llmInputTokenRatePerMillionInr || 13.0);
  const outputCostInr = (completionTokens / 1000000) * (pricing.llmOutputTokenRatePerMillionInr || 52.0);
  const llmCostInr = +(inputCostInr + outputCostInr).toFixed(3);
  const llmCostUsd = +(llmCostInr / exchangeRate).toFixed(4);

  // Total
  const totalCostInr = +(sttCostInr + ttsCostInr + llmCostInr).toFixed(2);
  const totalCostUsd = +(totalCostInr / exchangeRate).toFixed(3);

  return {
    engine,
    stt: {
      durationSeconds: Math.round(sttDurationSec),
      durationMinutes: +sttMinutes.toFixed(1),
      costInr: sttCostInr,
      costUsd: sttCostUsd,
    },
    tts: {
      characterCount: ttsChars,
      costInr: ttsCostInr,
      costUsd: ttsCostUsd,
    },
    llm: {
      promptTokens,
      completionTokens,
      totalTokens,
      costInr: llmCostInr,
      costUsd: llmCostUsd,
    },
    totalCostInr,
    totalCostUsd,
  };
};

/**
 * @desc    Get aggregate AI Interview stats, spend breakdown & KPI metrics
 * @route   GET /api/admin/interviews/stats
 * @access  Private (Admin)
 */
export const getInterviewAdminStats = async (req, res) => {
  try {
    const pricing = await getActivePricing();

    const [
      totalSessions,
      completedSessions,
      inProgressSessions,
      abandonedSessions,
      liveSessions,
      textSessions,
      allSessions,
    ] = await Promise.all([
      InterviewSession.countDocuments(),
      InterviewSession.countDocuments({ status: "completed" }),
      InterviewSession.countDocuments({ status: "in-progress" }),
      InterviewSession.countDocuments({ status: "abandoned" }),
      InterviewSession.countDocuments({ mode: { $in: ["live", "voice"] } }),
      InterviewSession.countDocuments({ mode: "text" }),
      InterviewSession.find({}, "mode voiceEngineUsed questions totalDurationSeconds costBreakdown createdAt status")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Aggregate real-time costs and question stats
    let totalQuestionsAnswered = 0;
    let totalDurationSec = 0;
    let totalScoreSum = 0;
    let scoredQuestionsCount = 0;

    let sarvamCount = 0;
    let localCount = 0;
    let browserCount = 0;

    let aggregateSttCostInr = 0;
    let aggregateTtsCostInr = 0;
    let aggregateLlmCostInr = 0;
    let aggregateTotalCostInr = 0;

    const dailyTimelineMap = {};
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dailyTimelineMap[key] = { date: key, sessions: 0, costInr: 0 };
    }

    allSessions.forEach((sess) => {
      const costs = calculateSessionCosts(sess, pricing);

      const engine = sess.voiceEngineUsed || (sess.mode === "text" ? "none" : "local");
      if (engine === "sarvam") sarvamCount++;
      else if (engine === "local") localCount++;
      else if (engine === "browser") browserCount++;

      aggregateSttCostInr += costs.stt.costInr;
      aggregateTtsCostInr += costs.tts.costInr;
      aggregateLlmCostInr += costs.llm.costInr;
      aggregateTotalCostInr += costs.totalCostInr;

      totalDurationSec += sess.totalDurationSeconds || 0;

      if (sess.questions) {
        sess.questions.forEach((q) => {
          if (q.userAnswer) totalQuestionsAnswered++;
          if (q.evaluation?.score > 0) {
            totalScoreSum += q.evaluation.score;
            scoredQuestionsCount++;
          }
        });
      }

      if (sess.createdAt) {
        const dateKey = new Date(sess.createdAt).toISOString().split("T")[0];
        if (dailyTimelineMap[dateKey]) {
          dailyTimelineMap[dateKey].sessions += 1;
          dailyTimelineMap[dateKey].costInr += costs.totalCostInr;
        }
      }
    });

    const averageCostPerSessionInr =
      totalSessions > 0 ? +(aggregateTotalCostInr / totalSessions).toFixed(2) : 0;
    const averageScore =
      scoredQuestionsCount > 0 ? Math.round(totalScoreSum / scoredQuestionsCount) : 0;
    const exchangeRate = pricing.usdToInrExchangeRate || 86.5;

    const dailyTimeline = Object.values(dailyTimelineMap).map((d) => ({
      ...d,
      costInr: +d.costInr.toFixed(2),
      costUsd: +(d.costInr / exchangeRate).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSessions,
          completedSessions,
          inProgressSessions,
          abandonedSessions,
          liveSessions,
          textSessions,
          sarvamSessions: sarvamCount,
          localSessions: localCount,
          browserSessions: browserCount,
          completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
          totalQuestionsAnswered,
          averageScore,
          totalDurationMinutes: Math.round(totalDurationSec / 60),
        },
        costs: {
          currency: "INR",
          exchangeRate,
          totalSpendInr: +aggregateTotalCostInr.toFixed(2),
          totalSpendUsd: +(aggregateTotalCostInr / exchangeRate).toFixed(2),
          averageCostPerSessionInr,
          averageCostPerSessionUsd: +(averageCostPerSessionInr / exchangeRate).toFixed(2),
          breakdown: {
            stt: {
              name: "Sarvam Saaras v3 STT",
              costInr: +aggregateSttCostInr.toFixed(2),
              costUsd: +(aggregateSttCostInr / exchangeRate).toFixed(2),
              percentage:
                aggregateTotalCostInr > 0
                  ? Math.round((aggregateSttCostInr / aggregateTotalCostInr) * 100)
                  : 0,
            },
            tts: {
              name: "Sarvam Bulbul v3 TTS",
              costInr: +aggregateTtsCostInr.toFixed(2),
              costUsd: +(aggregateTtsCostInr / exchangeRate).toFixed(2),
              percentage:
                aggregateTotalCostInr > 0
                  ? Math.round((aggregateTtsCostInr / aggregateTotalCostInr) * 100)
                  : 0,
            },
            llm: {
              name: "OpenAI LLM Tokens",
              costInr: +aggregateLlmCostInr.toFixed(2),
              costUsd: +(aggregateLlmCostInr / exchangeRate).toFixed(2),
              percentage:
                aggregateTotalCostInr > 0
                  ? Math.round((aggregateLlmCostInr / aggregateTotalCostInr) * 100)
                  : 0,
            },
          },
        },
        dailyTimeline,
        pricing,
      },
    });
  } catch (error) {
    console.error("Error in getInterviewAdminStats:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load interview stats",
    });
  }
};

/**
 * @desc    Get all interview sessions with pagination, search & cost filters
 * @route   GET /api/admin/interviews
 * @access  Private (Admin)
 */
export const getAllInterviewSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      role = "",
      mode = "",
      engine = "",
      status = "",
      interviewType = "",
      sortBy = "newest",
    } = req.query;

    const pricing = await getActivePricing();
    const query = {};

    if (role) query.role = new RegExp(role, "i");
    if (mode) query.mode = mode;
    if (status) query.status = status;
    if (interviewType) query.interviewType = interviewType;

    // Engine filtering (Sarvam Cloud vs Local Whisper/Chatterbox vs Browser)
    if (engine === "sarvam") {
      query.voiceEngineUsed = "sarvam";
    } else if (engine === "local") {
      query.$or = [
        { voiceEngineUsed: "local" },
        {
          voiceEngineUsed: { $exists: false },
          mode: { $in: ["live", "voice"] },
        },
        {
          voiceEngineUsed: null,
          mode: { $in: ["live", "voice"] },
        },
      ];
    } else if (engine === "browser") {
      query.voiceEngineUsed = "browser";
    } else if (engine === "none") {
      query.$or = [{ voiceEngineUsed: "none" }, { mode: "text" }];
    }

    // Search by candidate name or email
    if (search) {
      const matchingUsers = await User.find(
        {
          $or: [
            { name: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
          ],
        },
        "_id"
      ).lean();

      const userIds = matchingUsers.map((u) => u._id);
      query.$or = [
        { userId: { $in: userIds } },
        { role: new RegExp(search, "i") },
      ];
    }

    const sortOptions = {};
    if (sortBy === "newest") sortOptions.createdAt = -1;
    else if (sortBy === "oldest") sortOptions.createdAt = 1;
    else if (sortBy === "duration_desc") sortOptions.totalDurationSeconds = -1;
    else sortOptions.createdAt = -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await InterviewSession.countDocuments(query);

    const rawSessions = await InterviewSession.find(query)
      .populate("userId", "name email profilePicture tier")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const sessions = rawSessions.map((session) => {
      const costs = calculateSessionCosts(session, pricing);
      const answeredCount = session.questions?.filter((q) => q.userAnswer)?.length || 0;
      const evaluatedQuestions = session.questions?.filter((q) => q.evaluation?.score > 0) || [];
      const averageScore =
        evaluatedQuestions.length > 0
          ? Math.round(
              evaluatedQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) /
                evaluatedQuestions.length
            )
          : 0;

      return {
        id: session._id,
        user: session.userId || { name: "Anonymous Candidate", email: "N/A" },
        role: session.role,
        experienceLevel: session.experienceLevel,
        interviewType: session.interviewType,
        mode: session.mode,
        status: session.status,
        voiceEngineUsed:
          session.voiceEngineUsed ||
          (session.mode === "text" ? "none" : "local"),
        personaUsed:
          session.personaUsed ||
          (session.mode === "text" ? "standard" : "shubh"),
        questionsTotal: session.totalQuestions || session.questions?.length || 0,
        questionsAnswered: answeredCount,
        averageScore,
        durationSeconds: session.totalDurationSeconds || 0,
        costs,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllInterviewSessions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load interview sessions",
    });
  }
};

/**
 * @desc    Get complete audit details for a specific interview session
 * @route   GET /api/admin/interviews/:sessionId
 * @access  Private (Admin)
 */
export const getInterviewSessionDetail = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const pricing = await getActivePricing();

    const [session, interviewResult] = await Promise.all([
      InterviewSession.findById(sessionId)
        .populate("userId", "name email profilePicture tier createdAt")
        .populate("resumeId", "title")
        .lean(),
      InterviewResult.findOne({ sessionId }).lean(),
    ]);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Interview session not found",
      });
    }

    const costs = calculateSessionCosts(session, pricing);

    // Fallback result for partial or in-progress interviews without a completed InterviewResult document
    let result = interviewResult;
    if (!result) {
      const answeredQuestions = (session.questions || []).filter(
        (q) => (q.evaluation && q.evaluation.score > 0) || q.userAnswer
      );
      const evaluatedQuestions = (session.questions || []).filter(
        (q) => q.evaluation && typeof q.evaluation.score === "number" && q.evaluation.score > 0
      );
      const averageScore = evaluatedQuestions.length > 0
        ? Math.round(
            evaluatedQuestions.reduce((acc, q) => acc + (q.evaluation.score || 0), 0) /
              evaluatedQuestions.length
          )
        : 0;

      let grade = "N/A";
      if (averageScore >= 90) grade = "A+";
      else if (averageScore >= 80) grade = "A";
      else if (averageScore >= 70) grade = "B";
      else if (averageScore >= 60) grade = "C";
      else if (averageScore > 0) grade = "D";

      let performanceLevel = "Not Evaluated";
      if (averageScore >= 85) performanceLevel = "Excellent";
      else if (averageScore >= 70) performanceLevel = "Good";
      else if (averageScore >= 55) performanceLevel = "Average";
      else if (averageScore > 0) performanceLevel = "Needs Improvement";

      result = {
        overallScore: averageScore,
        grade,
        performanceLevel,
        isPartial: true,
        summary:
          session.status === "completed"
            ? `Interview completed with an overall score of ${averageScore}%.`
            : `Session is currently "${session.status}". ${answeredQuestions.length} of ${
                session.totalQuestions || session.questions?.length || 0
              } questions answered so far.`,
        strengths: evaluatedQuestions.flatMap((q) => q.evaluation?.strengths || []).filter(Boolean).slice(0, 5),
        weaknesses: evaluatedQuestions.flatMap((q) => q.evaluation?.weaknesses || []).filter(Boolean).slice(0, 5),
        hiringRecommendation: {
          recommendation: averageScore >= 75 ? "hire" : averageScore >= 60 ? "maybe" : "no-hire",
          confidence: Math.min(100, Math.max(20, evaluatedQuestions.length * 20)),
          reasoning: `Based on preliminary scores across ${evaluatedQuestions.length} evaluated questions.`,
        },
        skillBreakdown: {
          technicalKnowledge: {
            score: averageScore,
            feedback: "Based on technical responses provided during the session.",
          },
          communication: {
            score:
              evaluatedQuestions.length > 0
                ? Math.round(
                    evaluatedQuestions.reduce(
                      (acc, q) => acc + (q.evaluation?.clarity || averageScore),
                      0
                    ) / evaluatedQuestions.length
                  )
                : averageScore,
            feedback: "Based on clarity and response articulation.",
          },
          problemSolving: {
            score:
              evaluatedQuestions.length > 0
                ? Math.round(
                    evaluatedQuestions.reduce(
                      (acc, q) => acc + (q.evaluation?.relevance || averageScore),
                      0
                    ) / evaluatedQuestions.length
                  )
                : averageScore,
            feedback: "Based on response relevance and problem structuring.",
          },
          situationalAwareness: {
            score:
              evaluatedQuestions.length > 0
                ? Math.round(
                    evaluatedQuestions.reduce(
                      (acc, q) => acc + (q.evaluation?.confidence || averageScore),
                      0
                    ) / evaluatedQuestions.length
                  )
                : averageScore,
            feedback: "Based on candidate confidence and context understanding.",
          },
          culturalFit: {
            score:
              evaluatedQuestions.length > 0
                ? Math.round(
                    evaluatedQuestions.reduce(
                      (acc, q) => acc + (q.evaluation?.roleFit || averageScore),
                      0
                    ) / evaluatedQuestions.length
                  )
                : averageScore,
            feedback: "Based on role alignment and professional presentation.",
          },
        },
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        session: {
          ...session,
          voiceEngineUsed:
            session.voiceEngineUsed ||
            (session.mode === "text" ? "none" : "local"),
          personaUsed:
            session.personaUsed ||
            (session.mode === "text" ? "standard" : "shubh"),
          costs,
        },
        result,
        pricing,
      },
    });
  } catch (error) {
    console.error("Error in getInterviewSessionDetail:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load interview detail",
    });
  }
};

/**
 * @desc    Get current interview pricing & API cost config
 * @route   GET /api/admin/interviews/pricing-config
 * @access  Private (Admin)
 */
export const getInterviewPricingConfig = async (req, res) => {
  try {
    const pricing = await getActivePricing();
    return res.status(200).json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error in getInterviewPricingConfig:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load pricing config",
    });
  }
};

/**
 * @desc    Update interview pricing, API cost rates & credit policy
 * @route   PATCH /api/admin/interviews/pricing-config
 * @access  Private (Admin)
 */
export const updateInterviewPricingConfig = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    const updatedPricing = {
      sarvamSttRatePerMinuteInr:
        req.body.sarvamSttRatePerMinuteInr !== undefined
          ? Number(req.body.sarvamSttRatePerMinuteInr)
          : settings.interviewPricing?.sarvamSttRatePerMinuteInr || 0.15,
      sarvamTtsRatePerThousandCharsInr:
        req.body.sarvamTtsRatePerThousandCharsInr !== undefined
          ? Number(req.body.sarvamTtsRatePerThousandCharsInr)
          : settings.interviewPricing?.sarvamTtsRatePerThousandCharsInr || 0.015,
      llmInputTokenRatePerMillionInr:
        req.body.llmInputTokenRatePerMillionInr !== undefined
          ? Number(req.body.llmInputTokenRatePerMillionInr)
          : settings.interviewPricing?.llmInputTokenRatePerMillionInr || 12.5,
      llmOutputTokenRatePerMillionInr:
        req.body.llmOutputTokenRatePerMillionInr !== undefined
          ? Number(req.body.llmOutputTokenRatePerMillionInr)
          : settings.interviewPricing?.llmOutputTokenRatePerMillionInr || 50.0,
      usdToInrExchangeRate:
        req.body.usdToInrExchangeRate !== undefined
          ? Number(req.body.usdToInrExchangeRate)
          : settings.interviewPricing?.usdToInrExchangeRate || 86.5,
      creditsPerLiveInterview:
        req.body.creditsPerLiveInterview !== undefined
          ? Number(req.body.creditsPerLiveInterview)
          : settings.interviewPricing?.creditsPerLiveInterview || 5,
      creditsPerTextInterview:
        req.body.creditsPerTextInterview !== undefined
          ? Number(req.body.creditsPerTextInterview)
          : settings.interviewPricing?.creditsPerTextInterview || 2,
    };

    settings.interviewPricing = updatedPricing;
    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "AI Interview pricing configuration updated successfully",
      data: updatedPricing,
    });
  } catch (error) {
    console.error("Error in updateInterviewPricingConfig:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update pricing config",
    });
  }
};

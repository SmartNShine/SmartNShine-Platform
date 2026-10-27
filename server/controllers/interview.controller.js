import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import Resume from "../models/Resume.model.js";
import * as interviewService from "../services/interview.service.js";
import * as interviewStateManager from "../services/interview-state.service.js";
import * as sarvamService from "../services/sarvam.service.js";
import {transcribeAudioWithAI} from "../services/openai.service.js";
import axios from "axios";
import FormData from "form-data";

/**
 * Interview Controller
 * Handles all interview-related API endpoints
 */

/**
 * Get interview configuration options
 * GET /api/interview/config
 */
export const getInterviewConfig = async (req, res) => {
  try {
    const config = {
      interviewTypes: [
        {
          id: "resume-based",
          name: "Resume-Based Interview",
          description: "Questions derived from your resume",
        },
        {
          id: "job-description",
          name: "Job Description Interview",
          description: "Questions based on a job posting",
        },
        {
          id: "technical",
          name: "Technical Interview",
          description: "Role-specific technical questions",
        },
        {
          id: "behavioral",
          name: "Behavioral Interview",
          description: "STAR-based situational questions",
        },
        {
          id: "mixed",
          name: "Mixed Interview",
          description: "Combination of technical and behavioral",
        },
      ],
      roles: interviewService.getAvailableRoles(),
      experienceLevels: interviewService.getExperienceLevels(),
      limits: interviewService.getInterviewLimits(),
      modes: [
        {id: "text", name: "Text Mode", description: "Type your answers"},
        {
          id: "voice",
          name: "Voice Mode",
          description: "Speak your answers (requires microphone)",
        },
        {
          id: "live",
          name: "Live Interview",
          description:
            "Real-time conversation with AI interviewer (voice-to-voice)",
          requiresTTS: true,
        },
      ],
      ttsAvailable: true, // Always true - Browser TTS (Web Speech API) is always available as fallback
    };

    res.json({success: true, data: config});
  } catch (error) {
    console.error("❌ Get interview config error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to get interview configuration"});
  }
};

/**
 * Create a new interview session
 * POST /api/interview/sessions
 */
export const createSession = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {
      interviewType,
      role,
      experienceLevel = "mid",
      mode = "text",
      resumeId,
      jobDescription,
      targetSkills = [],
      totalQuestions = 10,
      voiceEngineUsed = "sarvam",
      personaUsed = "shubh",
      interviewLanguage = "unknown",
    } = req.body;

    // Validate required fields
    if (!interviewType || !role) {
      return res.status(400).json({
        success: false,
        error: "Interview type and role are required",
      });
    }

    // Validate interview type
    const validTypes = [
      "resume-based",
      "job-description",
      "technical",
      "behavioral",
      "mixed",
    ];
    if (!validTypes.includes(interviewType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interview type. Must be one of: ${validTypes.join(
          ", "
        )}`,
      });
    }

    // Get resume text if resume-based interview
    let resumeText = "";
    if (resumeId || interviewType === "resume-based") {
      if (!resumeId) {
        return res.status(400).json({
          success: false,
          error: "Resume ID is required for resume-based interviews",
        });
      }

      const resume = await Resume.findOne({_id: resumeId, userId});
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: "Resume not found",
        });
      }

      resumeText = resume.rawText || convertResumeToText(resume);
    }

    // Validate job description for JD-based interviews
    if (interviewType === "job-description" && !jobDescription) {
      return res.status(400).json({
        success: false,
        error: "Job description is required for job-description interviews",
      });
    }

    // Create session
    const session = new InterviewSession({
      userId,
      interviewType,
      role,
      experienceLevel,
      mode,
      resumeId,
      resumeText,
      jobDescription,
      targetSkills,
      totalQuestions: Math.min(Math.max(totalQuestions, 5), 15), // Clamp between 5-15
      status: "created",
      startedAt: new Date(),
      voiceEngineUsed: mode === "text" ? "none" : voiceEngineUsed,
      personaUsed: mode === "text" ? "standard" : personaUsed,
      interviewLanguage: sarvamService.normalizeSttLanguage(interviewLanguage),
      aiModel: selectAIModel(req.user),
      metadata: {
        browserInfo: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    await session.save();

    console.log(
      `✅ Interview session created: ${session._id} for user ${userId}`
    );

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        interviewType: session.interviewType,
        role: session.role,
        experienceLevel: session.experienceLevel,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("❌ Create session error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to create interview session"});
  }
};

/**
 * Start an interview session and get first question
 * POST /api/interview/sessions/:sessionId/start
 */
export const startSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    try {
      await interviewStateManager.transitionTo(session, interviewStateManager.STATES.IN_PROGRESS, "User started session");
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    // Generate first question
    const questionConfig = {
      interviewType: session.interviewType,
      role: session.role,
      experienceLevel: session.experienceLevel,
      resumeText: session.resumeText,
      jobDescription: session.jobDescription,
      targetSkills: session.targetSkills,
      previousQuestions: [],
      previousAnswers: [],
      currentDifficulty: "medium",
      questionNumber: 1,
    };

    const questionData = await interviewService.generateQuestion(
      questionConfig,
      req.user
    );

    // Add question to session
    session.addQuestion({
      questionText: questionData.question,
      questionType: questionData.questionType,
      category: questionData.category,
      difficulty: questionData.difficulty,
    });

    await session.save();

    console.log(
      `✅ Interview session started: ${session._id} (mode: ${session.mode})`
    );

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        status: session.status,
        mode: session.mode,
        currentQuestion: {
          number: 1,
          text: questionData.question,
          type: questionData.questionType,
          category: questionData.category,
          audio: null,
        },
        progress: {
          current: 1,
          total: session.totalQuestions,
          percentage: Math.round((1 / session.totalQuestions) * 100),
        },
      },
    });
  } catch (error) {
    console.error("❌ Start session error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to start interview session"});
  }
};

/**
 * Submit answer and get evaluation + next question
 * POST /api/interview/sessions/:sessionId/answer
 */
export const submitAnswer = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const {answer, questionNumber, answerMode = "text"} = req.body;
    const userId = req.user.userId || req.user._id;

    if (!answer || answer.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Please provide a more detailed answer (at least 10 characters)",
      });
    }

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    if (session.status !== interviewStateManager.STATES.IN_PROGRESS && session.status !== interviewStateManager.STATES.PAUSED) {
      return res.status(400).json({
        success: false,
        error: `Cannot submit answer for session with status: ${session.status}`,
      });
    }

    // Get current question
    const currentQuestion = session.questions.find(
      (q) => q.questionNumber === questionNumber
    );
    if (!currentQuestion) {
      return res
        .status(400)
        .json({success: false, error: "Question not found"});
    }

    if (currentQuestion.userAnswer) {
      return res
        .status(400)
        .json({success: false, error: "Question already answered"});
    }

    // Submit the answer
    session.submitAnswer(questionNumber, answer.trim(), answerMode);

    // Evaluate the answer
    const evaluation = await interviewService.evaluateAnswer(
      {
        question: currentQuestion.questionText,
        answer: answer.trim(),
        questionType: currentQuestion.questionType,
        category: currentQuestion.category,
        expectedKeywords: currentQuestion.expectedKeywords,
        role: session.role,
        experienceLevel: session.experienceLevel,
      },
      req.user
    );

    // Add evaluation to the question
    session.addEvaluation(questionNumber, {
      score: evaluation.score,
      relevance: evaluation.relevance,
      technicalAccuracy: evaluation.technicalAccuracy,
      clarity: evaluation.clarity,
      confidence: evaluation.confidence,
      roleFit: evaluation.roleFit,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missingKeywords: evaluation.missingKeywords,
      suggestedAnswer: evaluation.suggestedAnswer,
      improvementTips: evaluation.improvementTips,
      feedback: evaluation.feedback,
    });

    // Check if interview is complete
    const answeredCount = session.questions.filter(
      (q) => q.userAnswer || q.skipped
    ).length;
    const isComplete = answeredCount >= session.totalQuestions;

    let nextQuestion = null;
    let shouldAskFollowUp =
      evaluation.shouldAskFollowUp && !isComplete && Math.random() < 0.3;

    if (!isComplete) {
      // Determine if we should ask a follow-up or new question
      if (shouldAskFollowUp) {
        const followUpData = await interviewService.generateFollowUp(
          {
            previousQuestion: currentQuestion.questionText,
            previousAnswer: answer.trim(),
            followUpReason: evaluation.followUpReason,
            role: session.role,
            experienceLevel: session.experienceLevel,
          },
          req.user
        );

        session.addQuestion({
          questionText: followUpData.question,
          questionType: "follow-up",
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          isFollowUp: true,
          parentQuestionNumber: questionNumber,
        });

        nextQuestion = {
          number: session.questions.length,
          text: followUpData.question,
          type: "follow-up",
          category: currentQuestion.category,
          isFollowUp: true,
        };
      } else if (answeredCount < session.totalQuestions) {
        // Generate next regular question
        const previousQuestions = session.questions.map((q) => q.questionText);
        const previousAnswers = session.questions.map(
          (q) => q.userAnswer || ""
        );

        // Adaptive difficulty
        const recentScores = session.questions
          .slice(-3)
          .map((q) => q.evaluation?.score || 50);
        const avgRecentScore =
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        let currentDifficulty = currentQuestion.difficulty;

        if (avgRecentScore >= 80) currentDifficulty = "hard";
        else if (avgRecentScore <= 40) currentDifficulty = "easy";
        else currentDifficulty = "medium";

        const questionConfig = {
          interviewType: session.interviewType,
          role: session.role,
          experienceLevel: session.experienceLevel,
          resumeText: session.resumeText,
          jobDescription: session.jobDescription,
          targetSkills: session.targetSkills,
          previousQuestions,
          previousAnswers,
          currentDifficulty,
          questionNumber: session.questions.length + 1,
        };

        const questionData = await interviewService.generateQuestion(
          questionConfig,
          req.user
        );

        session.addQuestion({
          questionText: questionData.question,
          questionType: questionData.questionType,
          category: questionData.category,
          difficulty: questionData.difficulty,
        });

        nextQuestion = {
          number: session.questions.length,
          text: questionData.question,
          type: questionData.questionType,
          category: questionData.category,
        };
      }
    }

    // This will auto-transition to completed if all questions are answered
    await interviewStateManager.checkAutoComplete(session);
    await session.save();

    const response = {
      success: true,
      data: {
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          improvementTips: evaluation.improvementTips,
        },
        progress: {
          current: answeredCount,
          total: session.totalQuestions,
          percentage: Math.round(
            (answeredCount / session.totalQuestions) * 100
          ),
        },
        isComplete,
        mode: session.mode,
      },
    };

    if (nextQuestion) {
      response.data.nextQuestion = nextQuestion;
    }

    if (isComplete) {
      response.data.message = "Interview completed! Generating your report...";
    }

    res.json(response);
  } catch (error) {
    console.error("❌ Submit answer error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to process your answer"});
  }
};

/**
 * Skip current question
 * POST /api/interview/sessions/:sessionId/skip
 */
export const skipQuestion = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const {questionNumber} = req.body;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    const question = session.questions.find(
      (q) => q.questionNumber === questionNumber
    );
    if (!question) {
      return res
        .status(400)
        .json({success: false, error: "Question not found"});
    }

    question.skipped = true;
    question.answeredAt = new Date();
    question.evaluation = {
      score: 0,
      feedback: "Question was skipped",
    };

    // Check if complete
    const answeredCount = session.questions.filter(
      (q) => q.userAnswer || q.skipped
    ).length;
    const isComplete = answeredCount >= session.totalQuestions;

    let nextQuestion = null;

    if (!isComplete && answeredCount < session.totalQuestions) {
      // Generate next question
      const previousQuestions = session.questions.map((q) => q.questionText);
      const previousAnswers = session.questions.map(
        (q) => q.userAnswer || "(skipped)"
      );

      const questionConfig = {
        interviewType: session.interviewType,
        role: session.role,
        experienceLevel: session.experienceLevel,
        resumeText: session.resumeText,
        jobDescription: session.jobDescription,
        targetSkills: session.targetSkills,
        previousQuestions,
        previousAnswers,
        currentDifficulty: "medium",
        questionNumber: session.questions.length + 1,
      };

      const questionData = await interviewService.generateQuestion(
        questionConfig,
        req.user
      );

      session.addQuestion({
        questionText: questionData.question,
        questionType: questionData.questionType,
        category: questionData.category,
        difficulty: questionData.difficulty,
      });

      nextQuestion = {
        number: session.questions.length,
        text: questionData.question,
        type: questionData.questionType,
        category: questionData.category,
        audio: null,
      };
    }

    await interviewStateManager.checkAutoComplete(session);
    await session.save();

    res.json({
      success: true,
      data: {
        skipped: true,
        progress: {
          current: answeredCount,
          total: session.totalQuestions,
          percentage: Math.round(
            (answeredCount / session.totalQuestions) * 100
          ),
        },
        nextQuestion,
        isComplete,
      },
    });
  } catch (error) {
    console.error("❌ Skip question error:", error);
    res.status(500).json({success: false, error: "Failed to skip question"});
  }
};

/**
 * Complete interview and generate report
 * POST /api/interview/sessions/:sessionId/complete
 */
export const completeSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    // Idempotency: Return existing result immediately if already generated
    const existingResult = await InterviewResult.findOne({sessionId});
    if (existingResult) {
      return res.json({success: true, data: existingResult});
    }

    // Mark session as completed and calculate total duration
    session.status = "completed";
    session.completedAt = new Date();
    const startTime = session.startedAt || session.createdAt || session.completedAt;
    const computedSec = Math.max(1, Math.round((session.completedAt.getTime() - new Date(startTime).getTime()) / 1000));
    if (!session.totalDurationSeconds || session.totalDurationSeconds <= 0) {
      session.totalDurationSeconds = computedSec;
    }
    await session.save().catch(() => {});

    // Generate comprehensive report with safe fallback
    let reportData;
    try {
      reportData = await interviewService.generateReport(session, req.user);
    } catch (reportErr) {
      console.error("⚠️ Error generating LLM report, using fallback evaluation:", reportErr.message);
      const evaluatedQuestions = session.questions.filter(
        (q) => q.evaluation && typeof q.evaluation.score === "number"
      );
      const scores = evaluatedQuestions.map((q) => q.evaluation.score);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 70;

      reportData = {
        overallScore: avgScore,
        grade: avgScore >= 80 ? "A" : avgScore >= 60 ? "B" : "C",
        skillBreakdown: [],
        topicBreakdown: [],
        strengths: evaluatedQuestions.flatMap((q) => q.evaluation?.strengths || []).slice(0, 5),
        weaknesses: evaluatedQuestions.flatMap((q) => q.evaluation?.weaknesses || []).slice(0, 5),
        missedKeywords: [],
        resumeImprovements: [],
        practiceAreas: [],
        summary: "Interview session completed successfully.",
        detailedFeedback: "Performance evaluated across all answered questions.",
        hiringRecommendation: avgScore >= 75 ? "Hire" : "Needs Practice",
      };
    }

    // Calculate metrics
    const answeredQuestions = session.questions.filter(
      (q) => q.userAnswer || q.transcribedText
    ).length;
    const skippedQuestions = session.questions.filter((q) => q.skipped).length;
    const questionsAboveThreshold = session.questions.filter(
      (q) => (q.evaluation?.score || 0) >= 70
    ).length;
    const totalTime = session.questions.reduce(
      (sum, q) => sum + (q.timeSpentSeconds || 0),
      0
    );
    const avgTimePerQuestion =
      answeredQuestions > 0 ? Math.round(totalTime / answeredQuestions) : 0;

    // Get previous result for comparison
    const previousResult = await InterviewResult.findOne({
      userId,
      role: session.role,
      sessionId: {$ne: sessionId},
    }).sort({createdAt: -1});

    // Calculate percentile
    let percentile = 75;
    try {
      percentile = await InterviewResult.calculatePercentile(
        session.role,
        reportData.overallScore
      );
    } catch (_) {}

    // Create result document
    const result = new InterviewResult({
      userId,
      sessionId: session._id,
      overallScore: reportData.overallScore || 70,
      grade: reportData.overallScore >= 80 ? "A" : reportData.overallScore >= 60 ? "B" : "C",
      skillBreakdown: reportData.skillBreakdown || [],
      topicBreakdown: reportData.topicBreakdown || [],
      strengths: reportData.strengths || [],
      weaknesses: reportData.weaknesses || [],
      expectedKeywords: [],
      mentionedKeywords: [],
      missedKeywords: reportData.missedKeywords || [],
      resumeImprovements: reportData.resumeImprovements || [],
      practiceAreas: reportData.practiceAreas || [],
      summary: reportData.summary || "Interview completed.",
      detailedFeedback: reportData.detailedFeedback || "",
      overallFeedback: reportData.summary || reportData.detailedFeedback || "Great effort! Review the detailed breakdown below.",
      metrics: {
        totalQuestions: session.totalQuestions || 10,
        answeredQuestions,
        skippedQuestions,
        averageTimePerQuestion: avgTimePerQuestion,
        totalDuration: session.totalDurationSeconds || 0,
        questionsAboveThreshold,
      },
      comparisonData: {
        previousScore: previousResult?.overallScore,
        scoreChange: previousResult
          ? (reportData.overallScore || 70) - previousResult.overallScore
          : null,
        percentileRank: percentile,
        trend: previousResult
          ? (reportData.overallScore || 70) > previousResult.overallScore
            ? "improving"
            : (reportData.overallScore || 70) < previousResult.overallScore
            ? "declining"
            : "stable"
          : null,
      },
      interviewType: session.interviewType,
      role: session.role,
      experienceLevel: session.experienceLevel,
      aiModel: session.aiModel || "gpt-4",
      hiringRecommendation: reportData.hiringRecommendation || "Consider",
      isPremiumAnalysis: isPremiumUser(req.user),
    });

    await result.save();

    console.log(`✅ Interview completed and report generated: ${session._id}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Complete session error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to generate interview report"});
  }
};

/**
 * Get session details
 * GET /api/interview/sessions/:sessionId
 */
export const getSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      userId,
    }).populate("resumeId", "resumeTitle name");

    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    res.json({success: true, data: session});
  } catch (error) {
    console.error("❌ Get session error:", error);
    res.status(500).json({success: false, error: "Failed to get session"});
  }
};

/**
 * Get interview result
 * GET /api/interview/results/:sessionId
 */
export const getResult = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    let result = await InterviewResult.findOne({sessionId, userId});
    const session = await InterviewSession.findOne({_id: sessionId, userId});

    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    // If result document doesn't exist yet (e.g. abandoned or in-progress session), generate partial summary from session evaluations
    if (!result && session) {
      const evaluatedQuestions = session.questions.filter(
        (q) => q.evaluation && typeof q.evaluation.score === "number"
      );
      const scores = evaluatedQuestions.map((q) => q.evaluation.score);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      result = {
        _id: `partial-${session._id}`,
        sessionId: session._id,
        userId: session.userId,
        overallScore: avgScore,
        grade: avgScore >= 80 ? "A" : avgScore >= 60 ? "B" : avgScore > 0 ? "C" : "N/A",
        status: session.status,
        skillScores: [],
        strengths: evaluatedQuestions
          .flatMap((q) => q.evaluation?.strengths || [])
          .slice(0, 5),
        weaknesses: evaluatedQuestions
          .flatMap((q) => q.evaluation?.weaknesses || [])
          .slice(0, 5),
        isPartial: true,
      };
    }

    res.json({
      success: true,
      data: {
        result,
        session,
      },
    });
  } catch (error) {
    console.error("❌ Get result error:", error);
    res.status(500).json({success: false, error: "Failed to get result"});
  }
};

/**
 * Get user's interview history
 * GET /api/interview/history
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const {limit = 10, skip = 0, status} = req.query;

    const sessions = await InterviewSession.getUserHistory(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      status,
    });

    // Get results for completed sessions
    const completedSessionIds = sessions
      .filter((s) => s.status === "completed")
      .map((s) => s._id);

    const results = await InterviewResult.find({
      sessionId: {$in: completedSessionIds},
    }).select("sessionId overallScore grade");

    const resultsMap = new Map(results.map((r) => [r.sessionId.toString(), r]));

    // Combine session data with results
    const history = sessions.map((session) => ({
      ...session,
      result: resultsMap.get(session._id.toString()) || null,
    }));

    // Get total count
    const totalCount = await InterviewSession.countDocuments({
      userId,
      ...(status && {status}),
    });

    res.json({
      success: true,
      data: {
        interviews: history,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: totalCount > parseInt(skip) + parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get history error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to get interview history"});
  }
};

/**
 * Get user's interview statistics
 * GET /api/interview/stats
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const stats = await InterviewSession.getUserStats(userId);

    // Get improvement trend
    const trend = await InterviewResult.getImprovementTrend(userId, 10);

    res.json({
      success: true,
      data: {
        ...stats,
        improvementTrend: trend,
      },
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({success: false, error: "Failed to get statistics"});
  }
};

/**
 * Abandon/cancel an interview session
 * POST /api/interview/sessions/:sessionId/abandon
 */
/**
 * Pause interview session
 * POST /api/interview/sessions/:sessionId/pause
 */
export const pauseSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    await interviewStateManager.transitionTo(session, interviewStateManager.STATES.PAUSED, "User paused session");

    res.json({success: true, message: "Interview session paused", status: session.status});
  } catch (error) {
    console.error("❌ Pause session error:", error);
    res.status(400).json({success: false, error: error.message});
  }
};

/**
 * Resume interview session
 * POST /api/interview/sessions/:sessionId/resume
 */
export const resumeSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    await interviewStateManager.transitionTo(session, interviewStateManager.STATES.IN_PROGRESS, "User resumed session");

    res.json({success: true, message: "Interview session resumed", status: session.status});
  } catch (error) {
    console.error("❌ Resume session error:", error);
    res.status(400).json({success: false, error: error.message});
  }
};

export const abandonSession = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const userId = req.user.userId || req.user._id;

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    if (session.status === interviewStateManager.STATES.COMPLETED) {
      return res
        .status(400)
        .json({success: false, error: "Cannot abandon a completed session"});
    }

    try {
      await interviewStateManager.transitionTo(session, interviewStateManager.STATES.ABANDONED, "User abandoned session");
    } catch (err) {
      return res.status(400).json({success: false, error: err.message});
    }

    res.json({success: true, message: "Interview session abandoned"});
  } catch (error) {
    console.error("❌ Abandon session error:", error);
    res.status(500).json({success: false, error: "Failed to abandon session"});
  }
};

// Helper functions

function convertResumeToText(resume) {
  const parts = [];

  if (resume.name) parts.push(`Name: ${resume.name}`);
  if (resume.summary) parts.push(`Summary: ${resume.summary}`);

  if (resume.skills?.length) {
    const skills = resume.skills
      .map((s) => `${s.category}: ${s.items?.join(", ")}`)
      .join("; ");
    parts.push(`Skills: ${skills}`);
  }

  if (resume.experience?.length) {
    const exp = resume.experience
      .map(
        (e) =>
          `${e.title} at ${e.company} (${e.startDate} - ${
            e.endDate
          }): ${e.bullets?.join(". ")}`
      )
      .join(" | ");
    parts.push(`Experience: ${exp}`);
  }

  if (resume.education?.length) {
    const edu = resume.education
      .map((e) => `${e.degree} in ${e.field} from ${e.institution}`)
      .join("; ");
    parts.push(`Education: ${edu}`);
  }

  if (resume.projects?.length) {
    const proj = resume.projects
      .map((p) => `${p.name}: ${p.description} (${p.technologies?.join(", ")})`)
      .join(" | ");
    parts.push(`Projects: ${proj}`);
  }

  return parts.join("\n\n");
}

function selectAIModel(user) {
  return "gpt4o";
}

function isPremiumUser(user) {
  const tier = user.subscription?.tier || "free";
  return tier === "pro";
}

/**
 * Submit voice answer (audio file)
 * POST /api/interview/sessions/:sessionId/voice-answer
 */
export const submitVoiceAnswer = async (req, res) => {
  try {
    const {sessionId} = req.params;
    const {questionNumber} = req.body;
    const userId = req.user.userId || req.user._id;
    const audioFile = req.file;

    console.log("🎤 Voice answer submission:");
    console.log("  - sessionId:", sessionId);
    console.log("  - questionNumber:", questionNumber);
    console.log(
      "  - req.file:",
      audioFile
        ? `${audioFile.originalname} (${audioFile.size} bytes, buffer: ${
            audioFile.buffer?.length || "NO BUFFER"
          })`
        : "MISSING"
    );
    console.log("  - Content-Type:", req.headers["content-type"]);
    console.log("  - req.body keys:", Object.keys(req.body || {}));

    if (!audioFile) {
      console.error("❌ No audio file in request.");
      console.error("  - req.files:", req.files);
      console.error("  - req.body:", req.body);
      return res.status(400).json({
        success: false,
        error:
          "No audio file provided. Please record your answer and try again.",
      });
    }

    if (!audioFile.buffer || audioFile.buffer.length === 0) {
      console.error("❌ Audio file has no buffer data!");
      return res.status(400).json({
        success: false,
        error: "Audio file is empty. Please record again.",
      });
    }

    const session = await InterviewSession.findOne({_id: sessionId, userId});
    if (!session) {
      return res.status(404).json({success: false, error: "Session not found"});
    }

    if (session.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        error: `Cannot submit answer for session with status: ${session.status}`,
      });
    }

    // Transcribe the audio using Sarvam AI (Production) or local Whisper ML service (Local dev)
    let transcribedText = "";
    let transcriptionProvider = "none";
    let transcriptionLanguage = "unknown";
    let languageProbability = null;
    const requestedEngine =
      req.body.voiceEngine ||
      req.body.engine ||
      process.env.VOICE_ENGINE_PREFERENCE ||
      "auto";

    console.log(`🎙️ [STT Engine] Requested: ${requestedEngine}`);

    // Helper: Local Whisper call
    const callLocalWhisper = async () => {
      const mlServiceUrl =
        process.env.VOICE_SERVICE_URL ||
        process.env.ML_SERVICE_URL ||
        "http://localhost:5001";

      console.log("📡 Sending to local Whisper voice service:", `${mlServiceUrl}/transcribe`);
      const formData = new FormData();
      formData.append("audio", audioFile.buffer, {
        filename: audioFile.originalname,
        contentType: audioFile.mimetype,
      });

      const transcriptionResponse = await axios.post(
        `${mlServiceUrl}/transcribe`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
        }
      );
      const transcriptionResult = transcriptionResponse.data;
      if (transcriptionResult?.success && transcriptionResult?.data?.text) {
        return transcriptionResult.data.text;
      } else {
        throw new Error(
          transcriptionResult?.error || "Failed to transcribe audio from local service"
        );
      }
    };

    // Helper: Sarvam AI STT call
    const callSarvamSTT = async () => {
      if (!sarvamService.isAvailable()) {
        throw new Error("Sarvam AI API key is not configured");
      }
      console.log("🎙️ Using Sarvam AI STT (Saaras v4) for transcription...");
      const sarvamResult = await sarvamService.speechToText(audioFile.buffer, {
        filename: audioFile.originalname,
        mimetype: audioFile.mimetype,
        model: "saaras:v4",
        language_code: sarvamService.normalizeSttLanguage(
          req.body.languageCode || session.interviewLanguage
        ),
        mode: "transcribe",
      });
      if (sarvamResult?.text) {
        return sarvamResult;
      }
      throw new Error("Sarvam AI returned empty transcript");
    };

    // Helper: OpenAI Whisper STT call (Cloud Fallback)
    const callOpenAIWhisper = async () => {
      console.log("🎙️ Using OpenAI Whisper Cloud API for transcription fallback...");
      const text = await transcribeAudioWithAI(audioFile.buffer, {
        filename: audioFile.originalname,
        mimetype: audioFile.mimetype,
      });
      if (text && text.trim()) {
        return text.trim();
      }
      throw new Error("OpenAI Whisper returned empty transcript");
    };

    // Execution based on chosen engine
    if (requestedEngine === "local" || requestedEngine === "local-whisper") {
      try {
        transcribedText = await callLocalWhisper();
        transcriptionProvider = "local-whisper";
        console.log(`✅ Local Whisper transcription success (${transcribedText.length} chars)`);
      } catch (whisperError) {
        console.warn("⚠️ Local Whisper offline, falling back to cloud STT:", whisperError.message);
        if (sarvamService.isAvailable()) {
          try {
            const sarvamResult = await callSarvamSTT();
            transcribedText = sarvamResult.text;
            transcriptionLanguage = sarvamResult.language;
            languageProbability = sarvamResult.languageProbability;
            transcriptionProvider = "sarvam";
          } catch (_) {}
        }
        if (!transcribedText) {
          try {
            transcribedText = await callOpenAIWhisper();
            transcriptionProvider = "openai-whisper";
          } catch (_) {}
        }
        if (!transcribedText) {
          return res.status(503).json({
            success: false,
            error: "Local Whisper microservice is not reachable on port 5001 and cloud STT fallback failed.",
            provider: "local-whisper",
          });
        }
      }
    } else if (requestedEngine === "sarvam") {
      try {
        const sarvamResult = await callSarvamSTT();
        transcribedText = sarvamResult.text;
        transcriptionLanguage = sarvamResult.language;
        languageProbability = sarvamResult.languageProbability;
        transcriptionProvider = "sarvam";
        console.log(`✅ Sarvam AI transcription success (${transcribedText.length} chars)`);
      } catch (sarvamError) {
        console.warn("⚠️ Sarvam STT failed, falling back to OpenAI Whisper:", sarvamError.message);
        try {
          transcribedText = await callOpenAIWhisper();
          transcriptionProvider = "openai-whisper";
        } catch (openAiErr) {
          console.warn("⚠️ OpenAI Whisper fallback failed:", openAiErr.message);
          try {
            transcribedText = await callLocalWhisper();
            transcriptionProvider = "local-whisper";
          } catch (localErr) {
            console.error("❌ All STT fallback engines failed:", localErr.message);
            return res.status(503).json({
              success: false,
              error: `Voice transcription error: ${sarvamError.message}`,
              provider: "sarvam",
            });
          }
        }
      }
    } else {
      // Auto Mode: Sarvam -> OpenAI Whisper -> Local Whisper
      if (sarvamService.isAvailable()) {
        try {
          const sarvamResult = await callSarvamSTT();
          transcribedText = sarvamResult.text;
          transcriptionLanguage = sarvamResult.language;
          languageProbability = sarvamResult.languageProbability;
          transcriptionProvider = "sarvam";
          console.log(`✅ Sarvam AI transcription success (${transcribedText.length} chars)`);
        } catch (sarvamError) {
          console.warn("⚠️ Sarvam STT failed in auto mode, trying OpenAI Whisper:", sarvamError.message);
          try {
            transcribedText = await callOpenAIWhisper();
            transcriptionProvider = "openai-whisper";
          } catch (_) {
            try {
              transcribedText = await callLocalWhisper();
              transcriptionProvider = "local-whisper";
            } catch (whisperErr) {
              console.error("❌ All STT engines failed:", whisperErr.message);
            }
          }
        }
      } else {
        try {
          transcribedText = await callOpenAIWhisper();
          transcriptionProvider = "openai-whisper";
        } catch (_) {
          try {
            transcribedText = await callLocalWhisper();
            transcriptionProvider = "local-whisper";
          } catch (whisperErr) {
            console.error("❌ Local Whisper transcription failed in auto mode:", whisperErr.message);
          }
        }
      }
    }

    if (!transcribedText || !transcribedText.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "Could not detect speech in the audio. Please speak clearly and try again.",
      });
    }

    // Now process the transcribed text as a regular answer
    // Store the transcription in the question
    const currentQuestion = session.questions.find(
      (q) => q.questionNumber === parseInt(questionNumber)
    );
    if (!currentQuestion) {
      return res
        .status(400)
        .json({success: false, error: "Question not found"});
    }

    // If already answered (e.g. from a retried request or network retry), update the answer
    if (currentQuestion.userAnswer) {
      console.log(`ℹ️ Question ${questionNumber} was previously answered. Updating with fresh voice transcription.`);
    }

    // Submit or update the transcribed answer
    session.submitAnswer(
      parseInt(questionNumber),
      transcribedText.trim(),
      "voice"
    );
    currentQuestion.transcribedText = transcribedText.trim();

    // Check if interview is complete
    const answeredCount = session.questions.filter(
      (q) => q.userAnswer || q.skipped
    ).length;
    const isComplete = answeredCount >= session.totalQuestions;

    let nextQuestion = null;

    if (!isComplete && answeredCount < session.totalQuestions) {
      // Check if the next question already exists on the session
      const existingNextQ = session.questions.find(
        (q) => q.questionNumber === parseInt(questionNumber) + 1
      );

      if (existingNextQ) {
        nextQuestion = {
          number: existingNextQ.questionNumber,
          text: existingNextQ.questionText,
          type: existingNextQ.questionType,
          category: existingNextQ.category,
          audio: null,
        };
      } else {
        // Generate next question
        const previousQuestions = session.questions.map((q) => q.questionText);
        const previousAnswers = session.questions.map((q) => q.userAnswer || "");

        const recentScores = session.questions
          .slice(-3)
          .map((q) => q.evaluation?.score || 50);
        const avgRecentScore =
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        let currentDifficulty = "medium";
        if (avgRecentScore >= 80) currentDifficulty = "hard";
        else if (avgRecentScore <= 40) currentDifficulty = "easy";

        const questionConfig = {
          interviewType: session.interviewType,
          role: session.role,
          experienceLevel: session.experienceLevel,
          resumeText: session.resumeText,
          jobDescription: session.jobDescription,
          targetSkills: session.targetSkills,
          previousQuestions,
          previousAnswers,
          currentDifficulty,
          questionNumber: session.questions.length + 1,
        };

        const questionData = await interviewService.generateQuestion(
          questionConfig,
          req.user
        );

        session.addQuestion({
          questionText: questionData.question,
          questionType: questionData.questionType,
          category: questionData.category,
          difficulty: questionData.difficulty,
        });

        nextQuestion = {
          number: session.questions.length,
          text: questionData.question,
          type: questionData.questionType,
          category: questionData.category,
          audio: null,
        };
      }
    }

    await session.save();

    const wordCount = transcribedText.trim().split(/\s+/).filter(Boolean).length;

    // Fast response: return immediately to the candidate
    res.json({
      success: true,
      data: {
        transcription: {
          text: transcribedText.trim(),
          duration: null,
          wordCount,
          provider: transcriptionProvider,
          language: transcriptionLanguage,
          languageProbability,
        },
        evaluation: {
          score: 75,
          feedback: "Answer received and evaluated.",
        },
        progress: {
          current: answeredCount,
          total: session.totalQuestions,
          percentage: Math.round(
            (answeredCount / session.totalQuestions) * 100
          ),
        },
        nextQuestion,
        isComplete,
      },
    });

    // Run deep rubric evaluation in the background without blocking conversational turn
    (async () => {
      try {
        const evaluation = await interviewService.evaluateAnswer(
          {
            question: currentQuestion.questionText,
            answer: transcribedText.trim(),
            questionType: currentQuestion.questionType,
            category: currentQuestion.category,
            expectedKeywords: currentQuestion.expectedKeywords,
            role: session.role,
            experienceLevel: session.experienceLevel,
          },
          req.user
        );

        const updatedSession = await InterviewSession.findById(session._id);
        if (updatedSession) {
          updatedSession.addEvaluation(parseInt(questionNumber), {
            score: evaluation.score,
            relevance: evaluation.relevance,
            technicalAccuracy: evaluation.technicalAccuracy,
            clarity: evaluation.clarity,
            confidence: evaluation.confidence,
            roleFit: evaluation.roleFit,
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            missingKeywords: evaluation.missingKeywords,
            suggestedAnswer: evaluation.suggestedAnswer,
            improvementTips: evaluation.improvementTips,
            feedback: evaluation.feedback,
          });
          await updatedSession.save();
          console.log(`✅ Background evaluation saved for Q${questionNumber}`);
        }
      } catch (bgEvalError) {
        console.error("⚠️ Background evaluation error:", bgEvalError.message);
      }
    })();
  } catch (error) {
    console.error("❌ Submit voice answer error:", error);
    res
      .status(500)
      .json({success: false, error: "Failed to process voice answer"});
  }
};

export default {
  getInterviewConfig,
  createSession,
  startSession,
  submitAnswer,
  submitVoiceAnswer,
  skipQuestion,
  completeSession,
  getSession,
  getResult,
  getHistory,
  getStats,
  abandonSession,
};

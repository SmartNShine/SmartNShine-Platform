/**
 * Interview API Service
 * Handles all interview-related API calls
 */

import api from "./api";

/**
 * Get interview configuration options
 * @returns {Promise<Object>} Interview config (types, roles, levels, limits)
 */
export const getInterviewConfig = async () => {
  const response = await api.get("/interview/config");
  return response.data;
};

/**
 * Create a new interview session
 * @param {Object} params Session parameters
 * @param {string} params.interviewType - Type of interview
 * @param {string} params.role - Target role
 * @param {string} params.experienceLevel - Experience level
 * @param {string} params.mode - text or voice
 * @param {string} [params.resumeId] - Resume ID for resume-based interviews
 * @param {string} [params.jobDescription] - JD for job-description interviews
 * @param {string[]} [params.targetSkills] - Skills to focus on
 * @param {number} [params.totalQuestions] - Number of questions (5-15)
 * @returns {Promise<Object>} Created session data
 */
export const createSession = async (params) => {
  const response = await api.post("/interview/sessions", params);
  return response.data;
};

/**
 * Start an interview session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} First question and session info
 */
export const startSession = async (sessionId) => {
  const response = await api.post(`/interview/sessions/${sessionId}/start`);
  return response.data;
};

/**
 * Submit text answer
 * @param {string} sessionId - Session ID
 * @param {Object} params Answer params
 * @param {string} params.answer - User's answer text
 * @param {number} params.questionNumber - Question number
 * @returns {Promise<Object>} Evaluation and next question
 */
export const submitAnswer = async (sessionId, {answer, questionNumber}) => {
  const response = await api.post(`/interview/sessions/${sessionId}/answer`, {
    answer,
    questionNumber,
    answerMode: "text",
  });
  return response.data;
};

/**
 * Submit voice answer (audio file)
 * @param {string} sessionId - Session ID
 * @param {File} audioFile - Audio file blob
 * @param {number} questionNumber - Question number
 * @returns {Promise<Object>} Transcription, evaluation, and next question
 */
export const submitVoiceAnswer = async (
  sessionId,
  audioFile,
  questionNumber,
  options = {}
) => {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("questionNumber", questionNumber.toString());

  const engine = typeof options === "string" ? options : options?.voiceEngine || options?.engine;
  if (engine) {
    formData.append("voiceEngine", engine);
  }
  if (typeof options === "object" && options?.languageCode) {
    formData.append("languageCode", options.languageCode);
  }
  if (typeof options === "object" && options?.clientTranscript) {
    formData.append("clientTranscript", options.clientTranscript);
  }

  console.log("📤 Submitting voice answer:", {
    sessionId,
    fileName: audioFile.name,
    size: audioFile.size,
    type: audioFile.type,
    questionNumber,
    voiceEngine: engine || "auto",
  });

  // Use fetch API directly for FormData - axios has issues with multipart
  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const response = await fetch(
    `${baseUrl}/interview/sessions/${sessionId}/voice-answer`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to submit voice answer");
  }

  return data;
};

/**
 * Skip current question
 * @param {string} sessionId - Session ID
 * @param {number} questionNumber - Question number to skip
 * @returns {Promise<Object>} Next question info
 */
export const skipQuestion = async (sessionId, questionNumber) => {
  const response = await api.post(`/interview/sessions/${sessionId}/skip`, {
    questionNumber,
  });
  return response.data;
};

/**
 * Complete interview and get report
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Interview result/report
 */
export const completeSession = async (sessionId) => {
  const response = await api.post(`/interview/sessions/${sessionId}/complete`);
  return response.data;
};

/**
 * Abandon an interview session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Confirmation
 */
export const abandonSession = async (sessionId) => {
  const response = await api.post(`/interview/sessions/${sessionId}/abandon`);
  return response.data;
};

/**
 * Get session details
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Full session data
 */
export const getSession = async (sessionId) => {
  const response = await api.get(`/interview/sessions/${sessionId}`);
  return response.data;
};

/**
 * Get interview result
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Interview result/report
 */
export const getResult = async (sessionId) => {
  const response = await api.get(`/interview/results/${sessionId}`);
  return response.data;
};

/**
 * Get user's interview history
 * @param {Object} [params] Query params
 * @param {number} [params.limit] - Items per page
 * @param {number} [params.skip] - Items to skip
 * @param {string} [params.status] - Filter by status
 * @returns {Promise<Object>} History with pagination
 */
export const getHistory = async (params = {}) => {
  const response = await api.get("/interview/history", {params});
  return response.data;
};

/**
 * Get user's interview statistics
 * @returns {Promise<Object>} Stats and trends
 */
export const getStats = async () => {
  const response = await api.get("/interview/stats");
  return response.data;
};

/**
 * Check if voice transcription (STT) is available
 * @returns {Promise<Object>} Voice availability info
 */
export const checkVoiceAvailability = async () => {
  const response = await api.get("/voice/transcribe/health");
  return response.data;
};

/**
 * Transcribe audio to text only (no evaluation)
 * Used for warm-up/intro phase where we don't need to evaluate the response
 * @param {File} audioFile - Audio file to transcribe
 * @returns {Promise<Object>} { success, data: { text, language, duration, wordCount } }
 */
export const transcribeAudioOnly = async (audioFile, options = {}) => {
  const formData = new FormData();
  formData.append("audio", audioFile);
  if (options.languageCode) {
    formData.append("languageCode", options.languageCode);
  }
  if (options.clientTranscript) {
    formData.append("clientTranscript", options.clientTranscript);
  }

  console.log("📤 Transcribing audio (no evaluation):", audioFile.name, audioFile.size, "bytes");

  const response = await api.post("/voice/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * Check if text-to-speech (TTS) is available for live mode
 * @returns {Promise<Object>} TTS availability info
 */
export const checkTTSAvailability = async () => {
  const response = await api.get("/voice/tts/health");
  return response.data;
};

/**
 * Synthesize text to speech - returns binary audio blob (more efficient)
 * @param {string} text - Text to convert to speech
 * @param {string} [voiceId] - Optional voice ID
 * @param {string} [preset] - Optional voice preset (warm, question, acknowledgment, etc.)
 * @returns {Promise<Blob>} Audio blob (audio/mpeg)
 */
export const synthesizeSpeech = async (text, optionsOrVoiceId = {}, preset) => {
  let payload = { text };
  if (typeof optionsOrVoiceId === "string") {
    payload.voiceId = optionsOrVoiceId;
    if (preset) payload.preset = preset;
  } else if (typeof optionsOrVoiceId === "object") {
    payload = { ...payload, ...optionsOrVoiceId };
  }

  const response = await api.post(
    "/voice/tts/synthesize",
    payload,
    {responseType: "blob"}
  );
  return response.data; // Returns Blob directly
};

/**
 * Synthesize text to speech - returns base64 JSON (legacy fallback)
 * @param {string} text - Text to convert to speech
 * @param {string} [voiceId] - Optional voice ID
 * @returns {Promise<Object>} { audioBase64, contentType, estimatedDuration }
 */
export const synthesizeSpeechBase64 = async (text, voiceId, preset) => {
  const response = await api.post("/voice/tts/synthesize-json", {
    text,
    voiceId,
    preset,
  });
  return response.data;
};

/**
 * Get available TTS voices
 * @returns {Promise<Array>} List of available voices
 */
export const getTTSVoices = async () => {
  const response = await api.get("/voice/tts/voices");
  return response.data;
};

/**
 * Test voice with sample phrases - returns binary audio blob
 * @param {string} [preset] - Voice preset (greeting, question, acknowledgment, transition, closing)
 * @param {string} [customText] - Custom text to synthesize
 * @returns {Promise<Blob>} Audio blob (audio/mpeg)
 */
export const testVoice = async (preset, customText) => {
  const response = await api.post(
    "/voice/tts/test",
    {preset, customText},
    {responseType: "blob"}
  );
  return response.data; // Returns Blob directly
};

export default {
  getInterviewConfig,
  createSession,
  startSession,
  submitAnswer,
  submitVoiceAnswer,
  skipQuestion,
  completeSession,
  abandonSession,
  getSession,
  getResult,
  getHistory,
  getStats,
  checkVoiceAvailability,
  transcribeAudioOnly,
  checkTTSAvailability,
  synthesizeSpeech,
  synthesizeSpeechBase64,
  getTTSVoices,
  testVoice,
};

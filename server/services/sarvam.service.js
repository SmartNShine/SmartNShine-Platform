/**
 * Sarvam AI Service
 *
 * Production Voice & Speech AI service for SmartNShine powered by official Sarvam AI SDK.
 * Features:
 * 1. Bulbul v3 (Text-to-Speech) - Ultra-fast, Indian/Global English & Indic voices
 * 2. Saaras v3 (Speech-to-Text) - Benchmark transcription for Indian accents & code-mixed speech
 */

import { SarvamAIClient } from "sarvamai";

let clientInstance = null;
let lastApiKey = null;

export const SUPPORTED_STT_LANGUAGES = new Set([
  "unknown", "en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN", "gu-IN",
  "kn-IN", "ml-IN", "mr-IN", "pa-IN", "od-IN", "as-IN", "ur-IN",
  "ne-IN", "kok-IN", "ks-IN", "sd-IN", "sa-IN", "sat-IN", "mni-IN",
  "brx-IN", "mai-IN", "doi-IN",
]);

export function normalizeSttLanguage(languageCode) {
  return SUPPORTED_STT_LANGUAGES.has(languageCode) ? languageCode : "unknown";
}

/**
 * Check if Sarvam AI is configured and available
 * @returns {boolean}
 */
export function isAvailable() {
  const key = process.env.SARVAM_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

/**
 * Get or initialize Sarvam AI SDK client
 * @returns {SarvamAIClient}
 */
function getClient() {
  const key = process.env.SARVAM_API_KEY?.trim();
  if (!key) {
    throw new Error("SARVAM_API_KEY is not configured in environment variables");
  }

  if (!clientInstance || lastApiKey !== key) {
    clientInstance = new SarvamAIClient({
      apiSubscriptionKey: key,
    });
    lastApiKey = key;
  }

  return clientInstance;
}

/**
 * Convert Text to Speech using Sarvam Bulbul v3
 *
 * @param {string} text - Text to synthesize
 * @param {Object} [options={}] - Options
 * @param {string} [options.speaker='shubh'] - Speaker voice (e.g. 'shubh', 'anushka', 'amartya', 'meera', 'arvind')
 * @param {string} [options.target_language_code='en-IN'] - Language code (e.g. 'en-IN', 'hi-IN', 'ta-IN')
 * @param {number} [options.pace=1.0] - Speech pace (0.5 to 2.0)
 * @param {string} [options.model='bulbul:v3'] - Model version ('bulbul:v3' or 'bulbul:v2')
 * @param {number} [options.speech_sample_rate=22050] - Sample rate (8000, 16000, 22050, 24000)
 * @returns {Promise<Buffer>} Raw binary WAV audio buffer
 */
export async function textToSpeech(text, options = {}) {
  try {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error("Text is required and must be a non-empty string");
    }

    const cleanText = text.trim();
    if (cleanText.length > 2500) {
      throw new Error("Text exceeds Sarvam TTS limit of 2500 characters");
    }

    const bulbulV3Speakers = [
      "shubh",
      "aditya",
      "ashutosh",
      "rahul",
      "rohan",
      "amit",
      "dev",
      "ratan",
      "varun",
      "manan",
      "sumit",
      "kabir",
      "aayan",
      "advait",
      "anand",
      "tarun",
      "sunny",
      "mani",
      "gokul",
      "vijay",
      "mohit",
      "rehan",
      "soham",
      "ritu",
      "priya",
      "neha",
      "pooja",
      "simran",
      "kavya",
      "ishita",
      "shreya",
      "roopa",
      "tanya",
      "shruti",
      "suhani",
      "kavitha",
      "rupali",
      "niharika",
    ];

    const speakerAliases = {
      anushka: "priya",
      amartya: "kabir",
      meera: "pooja",
      arvind: "aditya",
      rachel: "simran",
    };

    let rawSpeaker = (options.speaker || options.voice || "shubh").toLowerCase();
    let speaker = speakerAliases[rawSpeaker] || rawSpeaker;

    if (!bulbulV3Speakers.includes(speaker)) {
      speaker = "shubh";
    }

    const languageCode =
      options.target_language_code || options.language || "en-IN";
    // Interviewer delivery: slightly calmer than default with a little more
    // expressiveness (temperature is bulbul:v3 only). Clips and live questions
    // share these so Shubh sounds the same throughout.
    const pace = options.pace ?? Number(process.env.SARVAM_TTS_PACE || 0.95);
    const temperature = options.temperature ?? Number(process.env.SARVAM_TTS_TEMPERATURE || 0.72);
    const model = options.model || "bulbul:v3";
    const sampleRate = options.speech_sample_rate || options.sampleRate || 22050;

    console.log(
      `🎙️ [Sarvam TTS] Synthesizing ${cleanText.length} chars (Voice: ${speaker}, Lang: ${languageCode}, Model: ${model})...`
    );

    const client = getClient();
    const response = await client.textToSpeech.convertStream({
      text: cleanText,
      target_language_code: languageCode,
      speaker: speaker,
      model: model,
      pace: pace,
      ...(model === "bulbul:v3" ? { temperature } : {}),
      speech_sample_rate: sampleRate,
    });

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    console.log(`✅ [Sarvam TTS] Generated ${audioBuffer.length} bytes audio`);
    return audioBuffer;
  } catch (error) {
    const errorDetails = error.message || error;
    console.error(`❌ [Sarvam TTS] Error: ${errorDetails}`);
    throw new Error(`Sarvam TTS synthesis failed: ${errorDetails}`);
  }
}

/**
 * Transcribe speech audio to text using Sarvam Saaras
 *
 * @param {Buffer|Blob|File} audioData - Audio buffer or stream
 * @param {Object} [options={}] - Options
 * @param {string} [options.filename='audio.webm'] - Audio filename
 * @param {string} [options.mimetype='audio/webm'] - Audio MIME type
 * @param {string} [options.model='saaras:v4'] - STT model
 * @param {string} [options.language_code] - Optional language code hint
 * @returns {Promise<{text: string, language: string, requestId?: string}>}
 */
export async function speechToText(audioData, options = {}) {
  try {
    if (!audioData) {
      throw new Error("Audio data is required for transcription");
    }

    const client = getClient();
    const filename = options.filename || options.originalname || "audio.webm";
    const mimetype = options.mimetype || options.contentType || "audio/webm";
    const model = options.model || "saaras:v4";
    const languageCode = normalizeSttLanguage(options.language_code);

    console.log(
      `🎧 [Sarvam STT] Transcribing audio file '${filename}' (${mimetype}) with ${model}...`
    );

    // Convert Buffer to File object required by the SDK
    let fileObj;
    if (audioData instanceof File) {
      fileObj = audioData;
    } else {
      const blob = new Blob([audioData], { type: mimetype });
      fileObj = new File([blob], filename, { type: mimetype });
    }

    const requestPayload = {
      file: fileObj,
      model: model,
      mode: options.mode || "transcribe",
      language_code: languageCode,
    };

    const response = await client.speechToText.transcribe(requestPayload);

    const transcript = response.transcript || "";
    const detectedLanguage = response.language_code || "en-IN";

    console.log(
      `✅ [Sarvam STT] Transcription complete (${transcript.length} chars, language: ${detectedLanguage})`
    );

    return {
      text: transcript.trim(),
      language: detectedLanguage,
      languageProbability: response.language_probability ?? null,
      requestId: response.request_id,
    };
  } catch (error) {
    const errorDetails = error.message || error;
    console.error(`❌ [Sarvam STT] Error: ${errorDetails}`);
    throw new Error(`Sarvam STT transcription failed: ${errorDetails}`);
  }
}

/**
 * Get Sarvam AI service status & health
 */
export async function getHealth() {
  const configured = isAvailable();
  return {
    configured,
    provider: "sarvam",
    sdk: "sarvamai",
    models: {
      tts: "bulbul:v3",
      stt: "saaras:v4",
    },
    capabilities: [
      "text-to-speech",
      "speech-to-text",
      "indian-accents",
      "code-mixed",
    ],
  };
}

export default {
  isAvailable,
  textToSpeech,
  speechToText,
  getHealth,
};

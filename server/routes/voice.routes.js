import express from "express";
import {authenticateToken} from "../middleware/auth.middleware.js";
import {audioUpload} from "../config/multer.config.js";
// ElevenLabs DISABLED - using Sarvam AI (Production) + Chatterbox TTS (Local) + Browser TTS (Fallback)
import * as sarvamService from "../services/sarvam.service.js";
import * as chatterboxService from "../services/chatterbox.service.js";
import {transcribeAudioWithAI} from "../services/openai.service.js";
import FormData from "form-data";
import axios from "axios";

const router = express.Router();
const unavailableVoiceHealthLogs = new Set();

function getVoiceServiceUrl() {
  return (
    process.env.VOICE_SERVICE_URL ||
    process.env.ML_SERVICE_URL ||
    "http://localhost:5001"
  );
}

function logVoiceServiceUnavailable(serviceName, serviceUrl, error) {
  const logKey = `${serviceName}:${serviceUrl}`;
  const message = error?.cause?.code || error?.code || error?.message;

  if (!unavailableVoiceHealthLogs.has(logKey)) {
    unavailableVoiceHealthLogs.add(logKey);
    console.warn(
      `${serviceName} health check unavailable on ${serviceUrl}: ${
        message || "request failed"
      }`
    );
  }
}

async function fetchVoiceHealth(path) {
  const voiceServiceUrl = getVoiceServiceUrl();
  const response = await fetch(`${voiceServiceUrl}${path}`, {
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) {
    throw new Error(`Voice service returned ${response.status}`);
  }

  return {
    data: await response.json(),
    voiceServiceUrl,
  };
}

/**
 * Voice Routes
 *
 * - STT: Sarvam Saaras (Production) / Whisper (Local voice-service)
 * - TTS: Sarvam Bulbul (Production) / Chatterbox (Local) / Browser TTS (Fallback)
 * Used by the AI Interview feature for live interview mode.
 *
 * Priority for TTS: Sarvam AI (Cloud/Production) → Chatterbox (Local dev) → Browser TTS (Fallback)
 */

/**
 * @route   GET /api/voice/health
 * @desc    Check if voice transcription and synthesis services are available
 * @access  Public
 */
router.get("/health", async (req, res) => {
  const sarvamAvailable = sarvamService.isAvailable();
  const voiceServiceUrl = getVoiceServiceUrl();
  let whisperAvailable = false;
  let chatterboxAvailable = false;

  try {
    const {data} = await fetchVoiceHealth("/health");
    whisperAvailable = data?.whisper_available || data?.status === "healthy";
  } catch (error) {
    logVoiceServiceUnavailable("Voice service", voiceServiceUrl, error);
  }

  try {
    chatterboxAvailable = await chatterboxService.isAvailable();
  } catch {
    chatterboxAvailable = false;
  }

  const isAnyVoiceAvailable = sarvamAvailable || whisperAvailable;

  res.json({
    success: true,
    data: {
      available: isAnyVoiceAvailable,
      status: isAnyVoiceAvailable ? "healthy" : "unavailable",
      sarvam_available: sarvamAvailable,
      whisper_available: whisperAvailable,
      chatterbox_available: chatterboxAvailable,
      active_preference: process.env.VOICE_ENGINE_PREFERENCE || "auto",
      providers: {
        sarvam: {
          available: sarvamAvailable,
          name: "Sarvam AI Cloud",
          models: { stt: "saaras:v4", tts: "bulbul:v3" },
          description: "Ultra-fast Indian & Global English voices + transcription (Production)",
        },
        whisper: {
          available: whisperAvailable,
          name: "Local Whisper STT",
          url: voiceServiceUrl,
          description: "Offline local speech recognition microservice",
        },
        chatterbox: {
          available: chatterboxAvailable,
          name: "Local Chatterbox TTS",
          url: process.env.CHATTERBOX_SERVICE_URL || "http://localhost:5002",
          description: "Offline local voice synthesis microservice",
        },
        browser: {
          available: true,
          name: "Browser Web Speech API",
          description: "Client-side fallback speech synthesis",
        },
      },
    },
  });
});

/**
 * @route   GET /api/voice/tts/health
 * @desc    Check text-to-speech services status (Sarvam AI + Chatterbox + Browser TTS)
 * @access  Public
 */
router.get("/tts/health", async (req, res) => {
  try {
    const sarvamAvailable = sarvamService.isAvailable();
    const chatterboxAvailable = await chatterboxService.isAvailable();

    let chatterboxHealth = null;
    if (chatterboxAvailable) {
      try {
        chatterboxHealth = await chatterboxService.getHealth();
      } catch (error) {
        console.error("Chatterbox health check error:", error);
      }
    }

    res.json({
      success: true,
      available: true, // TTS is always available (Browser TTS fallback)
      activePreference: process.env.VOICE_ENGINE_PREFERENCE || "auto",
      providers: {
        sarvam: {
          available: sarvamAvailable,
          priority: 1,
          cost: "low-cost API",
          model: "bulbul:v3",
          name: "Sarvam AI Cloud",
          note: "Production cloud voice synthesis",
        },
        chatterbox: {
          available: chatterboxAvailable,
          priority: 2,
          cost: "free",
          name: "Chatterbox TTS",
          details: chatterboxHealth,
          note: "Local microservice synthesis",
        },
        browser: {
          available: true,
          priority: 3,
          cost: "free",
          name: "Browser Speech Synthesis",
          note: "Frontend fallback (Web Speech API)",
        },
      },
      recommended: sarvamAvailable
        ? "sarvam"
        : chatterboxAvailable
        ? "chatterbox"
        : "browser",
    });
  } catch (error) {
    console.error("TTS health check error:", error);
    res.json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/voice/transcribe/health
 * @desc    Check transcription capabilities and limits
 * @access  Private
 */
router.get("/transcribe/health", authenticateToken, async (req, res) => {
  const voiceServiceUrl = getVoiceServiceUrl();
  const sarvamAvailable = sarvamService.isAvailable();

  try {
    const {data} = await fetchVoiceHealth("/transcribe/health");

    res.json({
      success: true,
      data: {
        ...data,
        sarvam_available: sarvamAvailable,
      },
    });
  } catch (error) {
    logVoiceServiceUnavailable("Transcription service", voiceServiceUrl, error);
    res.json({
      success: true,
      data: {
        available: sarvamAvailable,
        sarvam_available: sarvamAvailable,
        error: sarvamAvailable ? null : "Voice service not reachable",
      },
    });
  }
});

/**
 * @route   POST /api/voice/transcribe
 * @desc    Transcribe uploaded audio file to text
 * @access  Private
 */
router.post(
  "/transcribe",
  authenticateToken,
  audioUpload.single("audio"),
  async (req, res) => {
    try {
      const audioFile = req.file;
      if (!audioFile) {
        return res.status(400).json({
          success: false,
          error: "No audio file provided",
        });
      }

      let transcribedText = "";
      let provider = "none";
      let detectedLanguage = "unknown";
      let languageProbability = null;

      // 1. Try Sarvam AI STT (Saaras v4)
      if (sarvamService.isAvailable()) {
        try {
          const sarvamResult = await sarvamService.speechToText(audioFile.buffer, {
            filename: audioFile.originalname || "audio.webm",
            mimetype: audioFile.mimetype || "audio/webm",
            model: "saaras:v4",
            language_code: sarvamService.normalizeSttLanguage(req.body.languageCode),
            mode: "transcribe",
          });
          if (sarvamResult?.text) {
            transcribedText = sarvamResult.text;
            provider = "sarvam";
            detectedLanguage = sarvamResult.language;
            languageProbability = sarvamResult.languageProbability;
          }
        } catch (sarvamErr) {
          console.warn("⚠️ Sarvam STT failed in /api/voice/transcribe:", sarvamErr.message);
        }
      }

      // 2. Try OpenAI Whisper Cloud Fallback
      if (!transcribedText && process.env.OPENAI_API_KEY) {
        try {
          transcribedText = await transcribeAudioWithAI(audioFile.buffer, {
            filename: audioFile.originalname || "audio.webm",
            mimetype: audioFile.mimetype || "audio/webm",
          });
          if (transcribedText) {
            provider = "openai-whisper";
          }
        } catch (openAiErr) {
          console.warn("⚠️ OpenAI Whisper failed in /api/voice/transcribe:", openAiErr.message);
        }
      }

      // 3. Try Local Whisper Microservice Fallback
      if (!transcribedText) {
        try {
          const mlServiceUrl = getVoiceServiceUrl();
          const formData = new FormData();
          formData.append("audio", audioFile.buffer, {
            filename: audioFile.originalname || "audio.webm",
            contentType: audioFile.mimetype || "audio/webm",
          });

          const localRes = await axios.post(`${mlServiceUrl}/transcribe`, formData, {
            headers: formData.getHeaders(),
            timeout: 30000,
          });

          if (localRes.data?.success && localRes.data?.data?.text) {
            transcribedText = localRes.data.data.text;
            provider = "local-whisper";
          }
        } catch (localErr) {
          console.warn("⚠️ Local Whisper failed in /api/voice/transcribe:", localErr.message);
        }
      }

      // 4. Try client live speech transcript fallback if audio exceeded limits or STT engines failed
      if (!transcribedText && req.body.clientTranscript && req.body.clientTranscript.trim().length >= 4) {
        transcribedText = req.body.clientTranscript.trim();
        provider = "client-web-speech";
        console.log(`ℹ️ Falling back to verified client speech transcript in /api/voice/transcribe (${transcribedText.length} chars)`);
      }

      const cleanedText = (transcribedText || "").trim();

      return res.json({
        success: true,
        data: {
          text: cleanedText,
          provider,
          language: detectedLanguage,
          languageProbability,
          wordCount: cleanedText ? cleanedText.split(/\s+/).filter(Boolean).length : 0,
        },
      });
    } catch (err) {
      console.error("❌ Transcription error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to transcribe audio",
      });
    }
  }
);

/**
 * @route   GET /api/voice/tts/voices
 * @desc    Get available TTS voices (ElevenLabs disabled - using Chatterbox + Sarvam)
 * @access  Private
 */
router.get("/tts/voices", authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    voices: [
      { id: "shubh", name: "Shubh (Male - Indian / Global English)", provider: "sarvam" },
      { id: "anushka", name: "Anushka (Female - Indian / Global English)", provider: "sarvam" },
      { id: "amartya", name: "Amartya (Male - Deep Professional)", provider: "sarvam" },
      { id: "meera", name: "Meera (Female - Clear Warm)", provider: "sarvam" },
      { id: "arvind", name: "Arvind (Male - Conversational)", provider: "sarvam" },
      { id: "rachel", name: "Rachel (Female - Technical Assessor)", provider: "sarvam" },
    ],
  });
});

/**
 * @route   POST /api/voice/tts/synthesize
 * @desc    Convert text to speech - returns binary audio directly
 * @access  Private
 * @body    { text: string, speaker?: string, language?: string, voiceRef?: string, engine?: 'sarvam' | 'chatterbox' | 'browser' | 'auto' }
 * @returns Binary audio/wav stream
 */
router.post("/tts/synthesize", authenticateToken, async (req, res) => {
  try {
    const {text, speaker, language, voiceRef, engine, voiceEngine} = req.body;
    const requestedEngine = engine || voiceEngine || process.env.VOICE_ENGINE_PREFERENCE || "auto";

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: "Text too long. Maximum 5000 characters.",
      });
    }

    // Direct Browser request
    if (requestedEngine === "browser") {
      return res.status(503).json({
        success: false,
        error: "Browser TTS requested",
        fallback: "browser",
      });
    }

    // 1. Explicit Local / Chatterbox requested (Strict: No silent Sarvam fallback)
    if (requestedEngine === "chatterbox" || requestedEngine === "local") {
      try {
        const chatterboxAvailable = await chatterboxService.isAvailable();
        if (chatterboxAvailable) {
          console.log("🎙️ [TTS] Synthesizing via Chatterbox (Explicit Local Selection)");
          const audioBuffer = await chatterboxService.textToSpeech(text, {
            voiceRef: voiceRef || process.env.DEFAULT_VOICE_REF,
            language: language || "en",
          });

          res.set({
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.length,
            "Cache-Control": "no-cache",
            "X-TTS-Provider": "chatterbox",
          });
          return res.send(audioBuffer);
        } else {
          console.warn("⚠️ Chatterbox not running on port 5002");
          return res.status(503).json({
            success: false,
            error: "Local Chatterbox TTS microservice is offline (port 5002).",
            fallback: "browser",
          });
        }
      } catch (localError) {
        console.warn("⚠️ Chatterbox synthesis failed:", localError.message);
        return res.status(503).json({
          success: false,
          error: `Chatterbox synthesis error: ${localError.message}`,
          fallback: "browser",
        });
      }
    }

    // 2. Sarvam AI (Explicit or Auto Default)
    if (requestedEngine === "sarvam") {
      if (sarvamService.isAvailable()) {
        try {
          console.log("🎙️ [TTS] Synthesizing via Sarvam AI Bulbul v3");
          const audioBuffer = await sarvamService.textToSpeech(text, {
            speaker: speaker || "shubh",
            target_language_code: language || "en-IN",
            model: "bulbul:v3",
            pace: 1.0,
          });

          res.set({
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.length,
            "Cache-Control": "no-cache",
            "X-TTS-Provider": "sarvam",
          });

          return res.send(audioBuffer);
        } catch (sarvamError) {
          console.error("❌ Sarvam AI TTS failed:", sarvamError.message);
          return res.status(503).json({
            success: false,
            error: `Sarvam AI TTS error: ${sarvamError.message}`,
            fallback: "browser",
          });
        }
      } else {
        return res.status(503).json({
          success: false,
          error: "SARVAM_API_KEY is not configured in environment.",
          fallback: "browser",
        });
      }
    }

    // 3. Auto Mode: Sarvam first -> Chatterbox -> Browser
    if (requestedEngine === "auto") {
      if (sarvamService.isAvailable()) {
        try {
          console.log("🎙️ [TTS] Auto: Synthesizing via Sarvam AI Bulbul v3");
          const audioBuffer = await sarvamService.textToSpeech(text, {
            speaker: speaker || "shubh",
            target_language_code: language || "en-IN",
            model: "bulbul:v3",
            pace: 1.0,
          });

          res.set({
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.length,
            "Cache-Control": "no-cache",
            "X-TTS-Provider": "sarvam",
          });

          return res.send(audioBuffer);
        } catch (sarvamError) {
          console.warn("⚠️ Sarvam TTS failed in auto mode, trying Chatterbox fallback:", sarvamError.message);
        }
      }
    }

    // 3. Auto fallback to Chatterbox if Sarvam wasn't used or failed
    if (requestedEngine === "auto") {
      try {
        const chatterboxAvailable = await chatterboxService.isAvailable();
        if (chatterboxAvailable) {
          console.log("🎙️ [TTS] Fallback to Chatterbox (Local microservice)");
          const audioBuffer = await chatterboxService.textToSpeech(text, {
            voiceRef: voiceRef || process.env.DEFAULT_VOICE_REF,
            language: language || "en",
          });

          res.set({
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.length,
            "Cache-Control": "no-cache",
            "X-TTS-Provider": "chatterbox",
          });

          return res.send(audioBuffer);
        }
      } catch (chatterboxError) {
        console.warn("⚠️ Chatterbox fallback failed:", chatterboxError.message);
      }
    }

    // 4. Fallback to Browser Web Speech API
    console.log("📱 Returning 503 to trigger browser TTS fallback");
    return res.status(503).json({
      success: false,
      error: "Server TTS unavailable",
      message:
        "Server TTS not running or failed. Browser TTS will be used automatically.",
      provider: "none",
      fallback: "browser",
    });
  } catch (error) {
    console.error("TTS route error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * @route   POST /api/voice/tts/synthesize-json
 * @desc    DISABLED - Convert text to speech (base64 JSON)
 * @access  Private
 */
router.post("/tts/synthesize-json", authenticateToken, async (req, res) => {
  console.log("⚠️ synthesize-json endpoint called but ElevenLabs is disabled");

  return res.status(503).json({
    success: false,
    error: "Endpoint unavailable",
    message:
      "ElevenLabs is disabled. Use /api/voice/tts/synthesize instead (returns 503 for browser TTS fallback).",
  });
});

/**
 * @route   POST /api/voice/tts/stream
 * @desc    DISABLED - Stream text-to-speech audio (ElevenLabs)
 * @access  Private
 */
router.post("/tts/stream", authenticateToken, async (req, res) => {
  console.log("⚠️ stream endpoint called but ElevenLabs is disabled");

  return res.status(503).json({
    success: false,
    error: "Endpoint unavailable",
    message: "ElevenLabs is disabled. Use browser TTS instead.",
  });
});

/**
 * @route   POST /api/voice/tts/test
 * @desc    Test voice with sample interview phrases (Sarvam AI / Chatterbox)
 * @access  Private
 * @returns Binary audio/wav stream
 */
router.post("/tts/test", authenticateToken, async (req, res) => {
  try {
    const { preset = "greeting", customText, speaker = "shubh", engine = "sarvam", language = "en-IN" } = req.body;

    const SAMPLE_PRESETS = {
      greeting:
        "Hello! I'm your AI interviewer. I'm excited to learn more about your background and experience today.",
      question:
        "Can you tell me about a challenging project you worked on recently and how you approached solving the problems you encountered?",
      acknowledgment:
        "That's a great answer! I really appreciate the detail you provided. It gives me excellent insight into your problem-solving approach.",
      closing:
        "Thank you so much for your time today. You've shared some really valuable insights. We'll be in touch soon with next steps.",
    };

    const textToSynthesize = customText || SAMPLE_PRESETS[preset] || SAMPLE_PRESETS.greeting;

    // 1. If Sarvam AI available
    if (sarvamService.isAvailable() && engine !== "chatterbox" && engine !== "local") {
      try {
        console.log(`🎙️ [TTS Test] Synthesizing test '${preset}' with Sarvam speaker '${speaker}'`);
        const audioBuffer = await sarvamService.textToSpeech(textToSynthesize, {
          speaker: speaker,
          target_language_code: language,
          model: "bulbul:v3",
          pace: 1.0,
        });

        res.set({
          "Content-Type": "audio/wav",
          "Content-Length": audioBuffer.length,
          "Cache-Control": "no-cache",
          "X-TTS-Provider": "sarvam",
          "X-TTS-Speaker": speaker,
        });

        return res.send(audioBuffer);
      } catch (sarvamErr) {
        console.warn("⚠️ Sarvam test TTS failed:", sarvamErr.message);
      }
    }

    // 2. Local Chatterbox fallback if available
    const chatterboxAvailable = await chatterboxService.isAvailable();
    if (chatterboxAvailable) {
      console.log("🎙️ [TTS Test] Synthesizing test via Chatterbox");
      const audioBuffer = await chatterboxService.textToSpeech(textToSynthesize, {
        voiceRef: req.body.voiceRef || process.env.DEFAULT_VOICE_REF,
        language: "en",
      });

      res.set({
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length,
        "Cache-Control": "no-cache",
        "X-TTS-Provider": "chatterbox",
      });

      return res.send(audioBuffer);
    }

    return res.status(503).json({
      success: false,
      error: "TTS testing service unavailable",
      fallback: "browser",
    });
  } catch (error) {
    console.error("❌ TTS test route error:", error);
    return res.status(500).json({
      success: false,
      error: "TTS test failed: " + error.message,
    });
  }
});

export default router;

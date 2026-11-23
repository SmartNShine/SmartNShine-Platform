/**
 * Pre-record the interviewer's fixed lines (greetings, acknowledgments, closing…)
 * with Sarvam TTS so they play from static files at no runtime cost.
 *
 * Source of truth: client/src/components/interview/voiceClips.js
 * Output:          client/public/audio/interview/<voice>/<clipId>.mp3 + manifest.json
 *
 * Usage (from server/):
 *   npm run interview:clips            # only new or changed clips
 *   npm run interview:clips -- --force # re-record everything
 *
 * Requires SARVAM_API_KEY in server/.env and ffmpeg on PATH (WAV → MP3).
 */

import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import * as sarvamService from "../services/sarvam.service.js";
import { CLIP_VOICE, VOICE_CLIPS } from "../../client/src/components/interview/voiceClips.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "../../client/public/audio/interview", CLIP_VOICE);
const manifestPath = path.join(outputDir, "manifest.json");
const force = process.argv.includes("--force");

const hashText = (text) => crypto.createHash("sha1").update(`${CLIP_VOICE}:${text}`).digest("hex").slice(0, 12);

function toMp3(wavBuffer, outputPath) {
  const tempWav = path.join(os.tmpdir(), `clip-${process.pid}-${Date.now()}.wav`);
  fs.writeFileSync(tempWav, wavBuffer);
  try {
    const result = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tempWav, "-ac", "1", "-b:a", "64k", outputPath]);
    if (result.status !== 0) throw new Error(result.stderr?.toString() || "ffmpeg failed");
  } finally {
    fs.rmSync(tempWav, { force: true });
  }
}

async function main() {
  if (!sarvamService.isAvailable()) throw new Error("SARVAM_API_KEY is not configured");
  if (spawnSync("ffmpeg", ["-version"]).status !== 0) throw new Error("ffmpeg is not installed");

  fs.mkdirSync(outputDir, { recursive: true });
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : { voice: CLIP_VOICE, clips: {} };

  let recorded = 0;
  let characters = 0;
  for (const [clipId, text] of Object.entries(VOICE_CLIPS)) {
    const file = `${clipId}.mp3`;
    const hash = hashText(text);
    if (!force && manifest.clips[clipId]?.hash === hash && fs.existsSync(path.join(outputDir, file))) continue;

    const wav = await sarvamService.textToSpeech(text, { speaker: CLIP_VOICE, language: "en-IN" });
    toMp3(wav, path.join(outputDir, file));
    manifest.clips[clipId] = { file, text, hash };
    recorded++;
    characters += text.length;
    console.log(`🎙️  ${clipId}: "${text}"`);
  }

  for (const clipId of Object.keys(manifest.clips)) {
    if (!(clipId in VOICE_CLIPS)) {
      fs.rmSync(path.join(outputDir, manifest.clips[clipId].file), { force: true });
      delete manifest.clips[clipId];
      console.log(`🗑️  removed stale clip ${clipId}`);
    }
  }

  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✅ ${recorded} clip(s) recorded (${characters} TTS characters) → ${path.relative(process.cwd(), outputDir)}`);
}

main().catch((error) => {
  console.error("❌ Clip generation failed:", error.message);
  process.exit(1);
});

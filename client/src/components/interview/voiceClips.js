// Fixed interviewer lines, pre-recorded once with Sarvam (Shubh voice) so they cost
// no TTS credits at runtime. Plain data: also imported by
// server/scripts/generateInterviewClips.js — keep this file free of JSX/aliases.
//
// After editing any text, regenerate:  cd server && npm run interview:clips

export const CLIP_VOICE = "shubh";
export const CLIP_BASE_URL = "/audio/interview";

export const VOICE_CLIPS = {
  greeting_1: "Hi, welcome, and thanks for joining today. I'm Shubh, and I'll be your interviewer. To get started, could you briefly introduce yourself?",
  greeting_2: "Hello, and welcome. I'm Shubh. Before we dive in, tell me a little about yourself and what you've been working on recently.",
  greeting_3: "Hi there, good to meet you. I'm Shubh, and I'll be taking your interview today. Let's begin with a short introduction about yourself.",

  // Played the moment an answer is submitted, while it is transcribed and the
  // next question is planned.
  // Commas and ellipses give Bulbul natural breaths; keep these neutral (no grading).
  ack_1: "Mm-hmm… okay. Thank you for that.",
  ack_2: "Okay, got it. Thanks.",
  ack_3: "Hmm, alright… give me just a second.",
  ack_4: "Right. Thanks for walking me through that.",
  ack_5: "Okay… I see. Thank you.",
  ack_6: "Alright, understood. Let me think about that for a moment.",

  intro_ack: "Great, thanks for that introduction. Let's get started.",
  times_up: "Okay… let's stop there. Thank you.",
  skip_ack: "That's alright, no problem. Let's move on.",
  closing: "Alright, that brings us to the end. Thank you so much for your time today… I'm putting together your feedback now.",
  voice_sample: "Hello! I'm Shubh, your interviewer. I'm looking forward to learning about your background and experience today.",
};

export const CLIP_GROUPS = {
  greeting: ["greeting_1", "greeting_2", "greeting_3"],
  ack: ["ack_1", "ack_2", "ack_3", "ack_4", "ack_5", "ack_6"],
};

export const clipUrl = (clipId, voice = CLIP_VOICE) => `${CLIP_BASE_URL}/${voice}/${clipId}.mp3`;

export function pickClip(group, avoid) {
  const options = CLIP_GROUPS[group] || [group];
  const pool = options.length > 1 ? options.filter((id) => id !== avoid) : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

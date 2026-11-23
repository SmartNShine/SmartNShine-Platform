import {
  FileText,
  Briefcase,
  Code,
  Users,
  Sparkles,
} from "lucide-react";

// Sarvam AI & Local Voice Personas
export const INTERVIEWER_VOICES = {
  shubh: {
    id: "shubh",
    name: "Shubh",
    gender: "male",
    title: "Senior Engineering Lead",
    provider: "sarvam",
    accent: "Indian / Global English",
    badge: "Default",
    avatarImage: "/images/interviewer_shubh.jpg",
  },
  anushka: {
    id: "anushka",
    name: "Anushka",
    gender: "female",
    title: "Senior Technical Recruiter",
    provider: "sarvam",
    accent: "Indian / Global English",
    badge: "Popular",
    avatarImage: "/images/interviewer_anushka.jpg",
  },
  amartya: {
    id: "amartya",
    name: "Amartya",
    gender: "male",
    title: "Principal Solutions Architect",
    provider: "sarvam",
    accent: "Deep Professional",
    badge: "Executive",
    avatarImage: "/images/interviewer_shubh.jpg",
  },
  meera: {
    id: "meera",
    name: "Meera",
    gender: "female",
    title: "Director of Engineering",
    provider: "sarvam",
    accent: "Clear & Warm",
    badge: "Leadership",
    avatarImage: "/images/interviewer_anushka.jpg",
  },
  arvind: {
    id: "arvind",
    name: "Arvind",
    gender: "male",
    title: "Staff Systems Engineer",
    provider: "sarvam",
    accent: "Conversational Pace",
    badge: "Dynamic",
    avatarImage: "/images/interviewer_shubh.jpg",
  },
  rachel: {
    id: "rachel",
    name: "Rachel",
    gender: "female",
    title: "Technical Assessor",
    provider: "sarvam",
    accent: "Global English",
    badge: "Specialist",
    avatarImage: "/images/interviewer_rachel.jpg",
  },
};

// Languages supported by Sarvam Saaras speech-to-text. Questions remain in
// English; this setting controls how spoken candidate answers are transcribed.
export const INTERVIEW_LANGUAGES = [
  { code: "unknown", name: "Auto-detect (recommended)" },
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi" },
  { code: "bn-IN", name: "Bengali" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "gu-IN", name: "Gujarati" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "mr-IN", name: "Marathi" },
  { code: "pa-IN", name: "Punjabi" },
  { code: "od-IN", name: "Odia" },
  { code: "as-IN", name: "Assamese" },
  { code: "ur-IN", name: "Urdu" },
  { code: "ne-IN", name: "Nepali" },
  { code: "kok-IN", name: "Konkani" },
  { code: "ks-IN", name: "Kashmiri" },
  { code: "sd-IN", name: "Sindhi" },
  { code: "sa-IN", name: "Sanskrit" },
  { code: "sat-IN", name: "Santali" },
  { code: "mni-IN", name: "Manipuri" },
  { code: "brx-IN", name: "Bodo" },
  { code: "mai-IN", name: "Maithili" },
  { code: "doi-IN", name: "Dogri" },
];

// Interview type icons
export const TYPE_ICONS = {
  "resume-based": FileText,
  "job-description": Briefcase,
  technical: Code,
  behavioral: Users,
  mixed: Sparkles,
};

// Conversation phases for natural interview flow
export const CONVERSATION_PHASES = {
  IDLE: "idle",
  INTRODUCTION: "introduction",
  WARM_UP: "warm_up",
  CORE_INTERVIEW: "core_interview",
  WRAP_UP: "wrap_up",
  COMPLETED: "completed",
};

// Live-interview pacing. Mirrors server/services/interview-difficulty.service.js;
// the server sends answerTimeLimitSec per question, these are the fallbacks.
export const THINK_TIME_SEC = 10;
export const INTRO_ANSWER_TIME_SEC = 90;
export const ANSWER_WARNING_SEC = 30;
const ANSWER_TIME_BY_DIFFICULTY = { easy: 120, medium: 150, hard: 180 };

export function getAnswerTimeLimitSec(question) {
  if (Number(question?.answerTimeLimitSec) > 0) return Number(question.answerTimeLimitSec);
  const level = Number(question?.cognitiveLevel);
  if (level >= 4) return ANSWER_TIME_BY_DIFFICULTY.hard;
  if (level === 3) return ANSWER_TIME_BY_DIFFICULTY.medium;
  if (level === 1 || level === 2) return ANSWER_TIME_BY_DIFFICULTY.easy;
  return ANSWER_TIME_BY_DIFFICULTY[question?.difficulty] || ANSWER_TIME_BY_DIFFICULTY.medium;
}

export function estimateQuestionCount(minutes, mode = "live") {
  if (mode === "text") return Math.max(3, Math.min(15, Math.floor(minutes * 0.8)));
  const introSec = 30 + THINK_TIME_SEC + INTRO_ANSWER_TIME_SEC;
  const perQuestionSec = THINK_TIME_SEC + 120 + 20;
  return Math.max(2, Math.min(15, Math.floor((minutes * 60 - introSec) / perQuestionSec)));
}

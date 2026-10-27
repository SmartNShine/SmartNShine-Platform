import React from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Briefcase,
  Award,
  FileText,
  MessageSquare,
  Mic,
  Volume2,
  Cpu,
  Zap,
  Radio,
  RefreshCw,
  AlertTriangle,
  User,
  Timer,
  Languages,
  Sparkles,
  Loader2,
  Clock,
  History,
} from "lucide-react";
import { INTERVIEWER_VOICES, INTERVIEW_LANGUAGES, TYPE_ICONS } from "./constants";
import { InterviewerGraphic } from "./InterviewerGraphic";
import { useDarkMode } from "../../context/DarkModeContext";

// Setup Step Component
export const SetupStep = ({
  config,
  resumes,
  selectedType,
  setSelectedType,
  selectedRole,
  setSelectedRole,
  selectedLevel,
  setSelectedLevel,
  selectedMode,
  setSelectedMode,
  selectedLanguage,
  setSelectedLanguage,
  selectedResume,
  setSelectedResume,
  jobDescription,
  setJobDescription,
  interviewDuration,
  setInterviewDuration,
  isRecording,
  isTestingVoice,
  isPlayingAudio,
  voiceEngine = "auto",
  setVoiceEngine,
  voiceProviders,
  voiceAvailable,
  ttsAvailable,
  selectedVoice = "shubh",
  setSelectedVoice,
  isProduction = false,
  isSubmitting,
  onTestVoice,
  onStart,
}) => {
  const { isDarkMode } = useDarkMode();
  const currentInterviewer =
    INTERVIEWER_VOICES[selectedVoice] || INTERVIEWER_VOICES.shubh;
  const isLocalWhisperAvailable = voiceProviders?.whisper?.available;
  const isSarvamAvailable = Boolean(voiceProviders?.sarvam?.available);
  const isCurrentEngineValid =
    voiceEngine === "local"
      ? isLocalWhisperAvailable
      : Boolean(isSarvamAvailable || voiceAvailable);

  return (
    <div className="space-y-8">
      {/* Interview Type Selection */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Select Interview Type
          </h2>
          <Link
            to="/interview/history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition-all shadow-xs"
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Interviews & Reports</span>
            <span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config?.interviewTypes?.map((type) => {
            const Icon = TYPE_ICONS[type.id] || Sparkles;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  selectedType === type.id
                    ? "border-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 shadow-lg shadow-blue-500/20"
                    : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 bg-white dark:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mb-2 ${selectedType === type.id ? "text-blue-500 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {type.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role & Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Selection */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Target Role
          </h2>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="" className="bg-white dark:bg-[#1C1C1C]">
              Select a role...
            </option>
            {config?.roles?.map((role) => {
              const roleId = typeof role === "object" ? role.id || role.name : role;
              const roleName = typeof role === "object" ? role.name || role.id : role;
              return (
                <option
                  key={roleId}
                  value={roleId}
                  className="bg-white dark:bg-[#1C1C1C]"
                >
                  {roleName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Experience Level */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Experience Level
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {config?.experienceLevels?.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all duration-300 ${
                  selectedLevel === level.id
                    ? "border-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 shadow-md shadow-blue-500/20"
                    : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 bg-white dark:bg-white/5"
                }`}
              >
                <span className="font-semibold text-gray-900 dark:text-white block">
                  {level.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {level.years}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resume Selection (for resume-based interview) */}
      {selectedType === "resume-based" && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Select Resume
          </h2>
          {resumes?.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No resumes found. Please create a resume first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {resumes?.map((resume) => (
                <button
                  key={resume._id}
                  onClick={() => setSelectedResume(resume._id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedResume === resume._id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15"
                      : "border-gray-200 dark:border-white/10 hover:border-blue-300"
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {resume.title || "Untitled Resume"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedType === "job-description" && (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Job Description
          </h2>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={6}
            className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {jobDescription.length}/50 characters minimum
          </p>
        </div>
      )}

      {/* Mode & Voice Configuration - Unified 1-Column Layout */}
      <div className="space-y-6">
        {/* Answer Mode & Voice Settings */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Answer Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Live Voice Mode */}
            <button
              type="button"
              onClick={() => {
                if (voiceEngine === "local" && !isLocalWhisperAvailable && isSarvamAvailable) {
                  setVoiceEngine("sarvam");
                }
                setSelectedMode("live");
              }}
              disabled={(!isSarvamAvailable && !isLocalWhisperAvailable && !voiceAvailable) || !ttsAvailable}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                (!isSarvamAvailable && !isLocalWhisperAvailable && !voiceAvailable) || !ttsAvailable
                  ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5"
                  : selectedMode === "live"
                    ? "border-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/50"
              }`}
            >
              <Volume2
                className={`w-6 h-6 ${selectedMode === "live" ? "text-blue-500 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
              />
              <span className="font-semibold text-gray-900 dark:text-white">
                Live Voice
              </span>
              {(!isSarvamAvailable && !isLocalWhisperAvailable && !voiceAvailable) || !ttsAvailable ? (
                <span className="text-xs text-amber-500 dark:text-amber-400 font-semibold">
                  Needs Voice Key
                </span>
              ) : (
                <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                  Voice-to-Voice AI
                </span>
              )}
            </button>

            {/* 2. Text Mode */}
            <button
              type="button"
              onClick={() => setSelectedMode("text")}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                selectedMode === "text"
                  ? "border-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500"
                  : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/50"
              }`}
            >
              <MessageSquare
                className={`w-6 h-6 ${selectedMode === "text" ? "text-blue-500 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
              />
              <span className="font-semibold text-gray-900 dark:text-white">
                Text
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Type Answers
              </span>
            </button>
          </div>

          {selectedMode === "live" && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <label
                htmlFor="interview-answer-language"
                className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2"
              >
                <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Answer language
              </label>
              <select
                id="interview-answer-language"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="mt-2 w-full p-3 border border-emerald-200 dark:border-emerald-500/30 rounded-xl bg-white dark:bg-[#121420] text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {INTERVIEW_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400">
                Sarvam Saaras v4 transcribes Indian accents and code-mixed answers. Interview questions stay in English.
              </p>
            </div>
          )}

          {/* Voice Processing Engine Switcher (Always available in dev mode) */}
          {!isProduction && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-blue-200/60 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Voice Processing Engine
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Dev Switcher
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Sarvam AI Cloud */}
                <button
                  type="button"
                  onClick={() => setVoiceEngine("sarvam")}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    voiceEngine === "sarvam"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500"
                      : "border-gray-200 dark:border-white/10 hover:border-emerald-400/50 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      Sarvam AI Cloud
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSarvamAvailable
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          : "bg-gray-400 dark:bg-zinc-600"
                      }`}
                      title={
                        isSarvamAvailable
                          ? "Sarvam API Connected"
                          : "API Key not detected in .env"
                      }
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                    Saaras v3 STT & Bulbul v3 TTS. Production engine.
                  </p>
                </button>

                {/* 2. Local Microservices */}
                <button
                  type="button"
                  onClick={() => setVoiceEngine("local")}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    voiceEngine === "local"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-950 dark:text-indigo-100 shadow-sm ring-1 ring-indigo-500"
                      : "border-gray-200 dark:border-white/10 hover:border-indigo-400/50 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      Local Services
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLocalWhisperAvailable
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          : "bg-amber-400"
                      }`}
                      title={
                        isLocalWhisperAvailable
                          ? "Whisper microservice online (5001)"
                          : "Local microservice offline"
                      }
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                    Local Whisper STT (5001) & Chatterbox (5002).
                  </p>
                </button>

                {/* 3. Auto Hybrid */}
                <button
                  type="button"
                  onClick={() => setVoiceEngine("auto")}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    voiceEngine === "auto"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-950 dark:text-blue-100 shadow-sm ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-white/10 hover:border-blue-400/50 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      Auto Hybrid
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300 bg-blue-500/20 px-1 py-0.5 rounded">
                      Default
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                    Uses Sarvam AI first with smart fallback.
                  </p>
                </button>
              </div>

              {/* Offline Warning Notice */}
              {voiceEngine === "local" && !isLocalWhisperAvailable && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Local Microservice Offline:</span> Local Whisper is not running on port 5001. Please switch to <button type="button" onClick={() => setVoiceEngine("sarvam")} className="font-bold underline text-emerald-600 dark:text-emerald-400">Sarvam AI Cloud</button> to use voice mode.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Interviewer Persona & Voice Selector */}
          <div className="mt-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Interviewer Persona
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {currentInterviewer.name} ({currentInterviewer.gender === "male" ? "Male" : "Female"})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(INTERVIEWER_VOICES)
                .filter((v) => !isProduction || v.provider === "sarvam")
                .map((v) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-950 dark:text-indigo-100 shadow-sm"
                          : "border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {v.name}
                        </span>
                        {v.badge && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                            {v.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {v.title}
                      </p>
                    </button>
                  );
                })}
            </div>

            {/* Live Interviewer Studio Graphic Preview & Voice Tester */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/60 dark:from-indigo-950/30 dark:via-[#121420] dark:to-blue-950/25 border border-indigo-200/80 dark:border-indigo-500/25 flex flex-col sm:flex-row items-center gap-5 shadow-sm overflow-hidden">
              <div className="shrink-0 flex items-center justify-center">
                <InterviewerGraphic
                  isSpeaking={isTestingVoice || isPlayingAudio}
                  isThinking={false}
                  isDark={isDarkMode}
                  voice={selectedVoice}
                  size="sm"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {currentInterviewer.name}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {currentInterviewer.title}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentInterviewer.description || `${currentInterviewer.name} evaluates technical depth, architecture trade-offs, and communication.`}
                </p>

                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => onTestVoice?.("greeting")}
                    disabled={isTestingVoice || isPlayingAudio}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isTestingVoice || isPlayingAudio ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Speaking...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Preview Voice & Animation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedMode === "live" && (
            <p className="mt-3 text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-200 dark:border-blue-500/20">
              Natural conversation mode: {currentInterviewer.name} will speak questions aloud and
              listen for your answers automatically with hands-free barge-in.
            </p>
          )}
        </div>

        {/* Interview Duration */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Interview Duration
          </h2>
          <input
            type="range"
            min="5"
            max="20"
            value={interviewDuration}
            onChange={(e) => setInterviewDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-3">
            <span>5 min (Quick)</span>
            <span className="font-bold text-blue-600 text-lg">
              {interviewDuration} min
            </span>
            <span>20 min (Thorough)</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            The interview will naturally conclude when time is up
          </p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={
          isSubmitting ||
          !selectedType ||
          !selectedRole ||
          (selectedMode !== "text" && !isCurrentEngineValid)
        }
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Starting Interview...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Start Interview
          </>
        )}
      </button>
    </div>
  );
};

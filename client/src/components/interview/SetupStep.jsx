import React, { useState, useMemo } from "react";
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
  Camera,
  CameraOff,
  ShieldCheck,
  Search,
  Check,
  ChevronDown,
  X,
  Play,
  ArrowRight,
  Headphones,
  SlidersHorizontal,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { INTERVIEWER_VOICES, TYPE_ICONS } from "./constants";
import { InterviewerGraphic } from "./InterviewerGraphic";
import { CameraPreviewStage } from "./proctoring/CameraPreviewStage";
import { useDarkMode } from "../../context/DarkModeContext";

const POPULAR_ROLES = [
  { id: "fullstack", name: "Full Stack Developer" },
  { id: "frontend", name: "Frontend Developer" },
  { id: "backend", name: "Backend Developer" },
  { id: "devops", name: "DevOps Engineer" },
  { id: "data-scientist", name: "Data Scientist" },
  { id: "machine-learning", name: "AI / ML Engineer" },
  { id: "product-manager", name: "Product Manager" },
  { id: "mobile", name: "Mobile App Engineer" },
];

const DURATION_PRESETS = [
  { mins: 5, label: "5 mins", estimate: "~4 Qs" },
  { mins: 10, label: "10 mins", estimate: "~8 Qs" },
  { mins: 15, label: "15 mins", estimate: "~12 Qs (Recommended)" },
  { mins: 20, label: "20 mins", estimate: "~16+ Qs" },
];

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
  // Camera & Proctoring Pre-Flight props
  cameraVideoRef,
  isCameraActive = false,
  cameraError = null,
  isCameraInitializing = false,
  onStartCamera,
  onStopCamera,
  videoDevices = [],
  selectedDeviceId = "",
  onSwitchCamera,
  audioDevices = [],
  selectedAudioDeviceId = "",
  onSwitchAudioDevice,
  audioInputLevel = 0,
  onStartMicPreview,
}) => {
  const { isDarkMode } = useDarkMode();
  const [roleSearch, setRoleSearch] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const currentInterviewer =
    INTERVIEWER_VOICES[selectedVoice] || INTERVIEWER_VOICES.shubh;
  const isLocalWhisperAvailable = voiceProviders?.whisper?.available;
  const isSarvamAvailable = Boolean(voiceProviders?.sarvam?.available);
  const isCurrentEngineValid =
    voiceEngine === "local"
      ? isLocalWhisperAvailable
      : Boolean(isSarvamAvailable || voiceAvailable);

  // Normalize available roles from backend ontology
  const availableRoles = useMemo(() => {
    if (!config?.roles || !Array.isArray(config.roles)) return [];
    return config.roles.map((r) => {
      const id = typeof r === "object" ? r.id || r.name : r;
      const name = typeof r === "object" ? r.name || r.id : r;
      const topics = typeof r === "object" ? r.topics || [] : [];
      return { id, name, topics };
    });
  }, [config?.roles]);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return availableRoles;
    const q = roleSearch.toLowerCase();
    return availableRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.topics.some((t) => t.toLowerCase().includes(q))
    );
  }, [availableRoles, roleSearch]);

  // Current role title
  const currentRoleObj = useMemo(() => {
    return availableRoles.find(
      (r) => r.id === selectedRole || r.name === selectedRole
    );
  }, [availableRoles, selectedRole]);

  const displayRoleTitle = currentRoleObj ? currentRoleObj.name : selectedRole;

  // Experience levels
  const defaultLevels = [
    { id: "fresher", name: "Fresher", years: "0–1 yrs" },
    { id: "junior", name: "Junior", years: "1–3 yrs" },
    { id: "mid", name: "Mid-Level", years: "3–5 yrs" },
    { id: "senior", name: "Senior", years: "5–8 yrs" },
    { id: "lead", name: "Lead / Staff", years: "8+ yrs" },
  ];
  const experienceLevels =
    config?.experienceLevels && config.experienceLevels.length > 0
      ? config.experienceLevels
      : defaultLevels;

  const isReadyToStart = Boolean(
    selectedType &&
      selectedRole &&
      (selectedType !== "resume-based" || selectedResume) &&
      (selectedType !== "job-description" || (jobDescription && jobDescription.length >= 50)) &&
      (selectedMode === "text" || isCurrentEngineValid)
  );

  return (
    <div className="space-y-8 pb-16 font-sans text-zinc-900 dark:text-zinc-100">
      {/* 2-COLUMN STUDIO WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: PRIMARY CONFIGURATION CANVAS (8 cols)        */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 1. INTERVIEW FORMAT */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111218] border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  1. Select Interview Format
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choose the structure, focus area, and question criteria
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                Step 1 of 4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
              {config?.interviewTypes?.map((type) => {
                const Icon = TYPE_ICONS[type.id] || Sparkles;
                const isSelected = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500/30 shadow-xs"
                        : "border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#141620] hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                        {type.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {type.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold ${
                          isSelected
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select Format"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. TARGET POSITION & TRACK */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111218] border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  2. Target Position & Role
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Search a position or select from popular engineering tracks
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                Step 2 of 4
              </span>
            </div>

            {/* Search Input with Autocomplete */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={roleSearch || (isRoleDropdownOpen ? "" : displayRoleTitle || "")}
                  onChange={(e) => {
                    setRoleSearch(e.target.value);
                    setIsRoleDropdownOpen(true);
                  }}
                  onFocus={() => setIsRoleDropdownOpen(true)}
                  placeholder="Search position or enter custom role (e.g. Senior Backend Engineer)..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141620] text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs"
                />

                <div className="absolute right-2.5 flex items-center gap-1">
                  {selectedRole && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("");
                        setRoleSearch("");
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isRoleDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Autocomplete Dropdown */}
              {isRoleDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-[#141520] border border-zinc-200 dark:border-white/15 shadow-xl p-2 space-y-1">
                  {filteredRoles.length === 0 ? (
                    <div className="p-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                      No matching roles. Press enter to use "<strong>{roleSearch}</strong>" as a custom role.
                    </div>
                  ) : (
                    filteredRoles.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            setSelectedRole(role.id);
                            setRoleSearch("");
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold"
                              : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{role.name}</div>
                            {role.topics && role.topics.length > 0 && (
                              <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-sm mt-0.5">
                                Topics: {role.topics.slice(0, 4).join(", ")}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Popular Tracks Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                Popular roles:
              </span>
              {POPULAR_ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id);
                      setRoleSearch("");
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200/60 dark:border-white/5"
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>

            {/* Active Topics Preview */}
            {currentRoleObj?.topics && currentRoleObj.topics.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
                  Focus Areas:
                </span>
                {currentRoleObj.topics.slice(0, 6).map((topic, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400 font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. SENIORITY / EXPERIENCE LEVEL (HORIZONTAL SEGMENTED BAR) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111218] border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  3. Seniority & Experience
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Calibrates the depth, complexity, and architectural expectations of questions
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                Step 3 of 4
              </span>
            </div>

            {/* Horizontal Segmented Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5">
              {experienceLevels.map((level) => {
                const isSelected = selectedLevel === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSelectedLevel(level.id)}
                    className={`py-3 px-3 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-white dark:bg-[#1C1F2E] text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-white/15 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 font-medium"
                    }`}
                  >
                    <span className="text-sm font-bold block">{level.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                      {level.years || "Standard"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Adaptive Evaluation:</span>
              <span>Questions progressively adapt in real time to candidate answer depth.</span>
            </div>
          </div>

          {/* CONDITIONAL: RESUME PICKER (When resume-based) */}
          {selectedType === "resume-based" && (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111218] border border-blue-200 dark:border-blue-500/20 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Source Resume
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select which resume to derive project and technical questions from
                </p>
              </div>

              {resumes?.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-300 dark:border-white/10">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No resumes found. Please create or upload a resume in My Resumes first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {resumes?.map((resume) => {
                    const isSelected = selectedResume === resume._id;
                    return (
                      <button
                        key={resume._id}
                        type="button"
                        onClick={() => setSelectedResume(resume._id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500/30"
                            : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141620] hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                            {resume.title || "Untitled Resume"}
                          </p>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONDITIONAL: JOB DESCRIPTION (When job-description) */}
          {selectedType === "job-description" && (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111218] border border-blue-200 dark:border-blue-500/20 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Target Job Description
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Paste the job requirements to generate tailored role-specific questions
                </p>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description, responsibilities, and qualifications..."
                rows={5}
                className="w-full p-4 border border-zinc-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#141620] text-sm text-zinc-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              />

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Minimum 50 characters required</span>
                <span
                  className={`font-semibold ${
                    jobDescription.length >= 50
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-500"
                  }`}
                >
                  {jobDescription.length}/50 characters
                </span>
              </div>
            </div>
          )}

          {/* 4. ANSWER MODE & SESSION PROTOCOL */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111218] border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  4. Answer Mode & Session Protocol
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choose live spoken conversational AI or structured written typing
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                Step 4 of 4
              </span>
            </div>

            {/* Voice vs Text Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Voice Mode */}
              <button
                type="button"
                onClick={() => {
                  if (voiceEngine === "local" && !isLocalWhisperAvailable && isSarvamAvailable) {
                    setVoiceEngine("sarvam");
                  }
                  setSelectedMode("live");
                }}
                disabled={(!isSarvamAvailable && !isLocalWhisperAvailable && !voiceAvailable) || !ttsAvailable}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === "live"
                    ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500/30 shadow-xs"
                    : "border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#141620] hover:border-zinc-300 dark:hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Live Voice
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Live Conversational Voice
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    AI speaks questions aloud. Answer naturally with your voice and hands-free recording.
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Natural Speech</span>
                  {selectedMode === "live" && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>

              {/* Text Mode */}
              <button
                type="button"
                onClick={() => setSelectedMode("text")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === "text"
                    ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500/30 shadow-xs"
                    : "border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#141620] hover:border-zinc-300 dark:hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                      Self-Paced
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Written & Code Mode
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Read interview questions on screen and type detailed answers with code or markdown.
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <span>Keyboard Input</span>
                  {selectedMode === "text" && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* Spoken Language Protocol Note */}
            {selectedMode === "live" && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                    <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Language Protocol</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Auto-Detect Active
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Spoken answers are automatically detected by Sarvam Saaras AI. <strong className="text-zinc-900 dark:text-white">English is strictly preferred</strong> for this interview. Please deliver all answers in English — answering in other languages will result in mark deductions on communication rubrics.
                </p>
              </div>
            )}

            {/* Session Duration Selector */}
            <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-500" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    Session Duration
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                  {interviewDuration} Minutes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_PRESETS.map((preset) => {
                  const isSelected = interviewDuration === preset.mins;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => setInterviewDuration(preset.mins)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200/60 dark:border-white/5"
                      }`}
                    >
                      <span className="block font-bold">{preset.label}</span>
                      <span className="text-[11px] opacity-80 mt-0.5 block">{preset.estimate}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dev Voice Switcher */}
            {!isProduction && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    <span>Voice Processing Engine</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Dev Mode
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["sarvam", "local", "auto"].map((eng) => (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => setVoiceEngine(eng)}
                      className={`p-2 rounded-xl border text-center transition-all capitalize ${
                        voiceEngine === eng
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold"
                          : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {eng === "sarvam" ? "Sarvam Cloud" : eng === "local" ? "Local Whisper" : "Auto Hybrid"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: TELEPRESENCE & LAUNCH DECK (4 or 5 cols)    */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* 1. INTERVIEWER PERSONA */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111218] border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  AI Interviewer Persona
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Voice persona and questioning tone
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {currentInterviewer.accent}
              </span>
            </div>

            {/* Avatar & Voice Preview */}
            <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 flex items-center gap-4">
              <div className="shrink-0">
                <InterviewerGraphic
                  isSpeaking={isTestingVoice || isPlayingAudio}
                  isThinking={false}
                  isDark={isDarkMode}
                  voice={selectedVoice}
                  size="sm"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {currentInterviewer.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {currentInterviewer.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onTestVoice?.("greeting")}
                  disabled={isTestingVoice || isPlayingAudio}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingVoice || isPlayingAudio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Voice...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test Interviewer Voice</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Persona Switcher Chips */}
            <div className="grid grid-cols-3 gap-1.5">
              {Object.values(INTERVIEWER_VOICES)
                .filter((v) => !isProduction || v.provider === "sarvam")
                .map((v) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold shadow-2xs"
                          : "border-zinc-200/70 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="text-xs font-bold block">{v.name}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate block mt-0.5">
                        {v.title?.split(" ")[0] || "Interviewer"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 2. CAMERA & AUDIO PRE-FLIGHT DIAGNOSTIC */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111218] border border-zinc-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Pre-Flight Hardware Check
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Webcam alignment and microphone diagnostic
                </p>
              </div>

              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Integrity Ready</span>
              </span>
            </div>

            {/* Live Camera View Box */}
            <div className="flex flex-col items-center justify-center pt-1">
              <CameraPreviewStage
                videoRef={cameraVideoRef}
                isCameraActive={isCameraActive}
                cameraError={cameraError}
                isInitializing={isCameraInitializing}
                onRetryCamera={onStartCamera}
                showGuideOval={true}
                layout="setup"
              />
            </div>

            {/* Device Selectors & Live Meter */}
            <div className="space-y-3 pt-2">
              {/* Mic Input & Sensitivity Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Microphone Input
                  </label>
                  {audioInputLevel > 5 ? (
                    <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Audio active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartMicPreview?.()}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Test Mic
                    </button>
                  )}
                </div>

                {audioDevices.length > 0 ? (
                  <select
                    value={selectedAudioDeviceId}
                    onChange={(e) => onSwitchAudioDevice?.(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {audioDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId} className="dark:bg-neutral-900 text-zinc-900 dark:text-white">
                        🎙️ {d.label || `Microphone ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10">
                    <Mic className="w-4 h-4 text-emerald-500" />
                    <span>Default Microphone</span>
                  </div>
                )}

                {/* Live Mic Meter */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Level:</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                      style={{ width: `${Math.max(4, audioInputLevel)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Camera Source Selector if multiple */}
              {videoDevices.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Camera Device
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => onSwitchCamera?.(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {videoDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Camera Preview Button */}
              <div className="pt-1">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      onStartCamera?.();
                      onStartMicPreview?.();
                    }}
                    disabled={isCameraInitializing}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Enable Camera & Mic Preview</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStopCamera}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CameraOff className="w-4 h-4 text-zinc-500" />
                    <span>Stop Camera Preview</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. GROUNDED LAUNCH DECK */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111218] border border-blue-200 dark:border-blue-500/20 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Session Summary
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ready to initialize high-fidelity mock interview
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-white/5">
                <span className="text-zinc-500 dark:text-zinc-400">Position:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {displayRoleTitle || "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-white/5">
                <span className="text-zinc-500 dark:text-zinc-400">Seniority:</span>
                <span className="font-bold text-zinc-900 dark:text-white capitalize">
                  {selectedLevel} Level
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-white/5">
                <span className="text-zinc-500 dark:text-zinc-400">Format:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {config?.interviewTypes?.find((t) => t.id === selectedType)?.name || selectedType || "Technical"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500 dark:text-zinc-400">Mode & Time:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {selectedMode === "live" ? "Voice AI" : "Text"} • {interviewDuration} mins
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              disabled={isSubmitting || !isReadyToStart}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing Studio...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Interview Studio</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {!selectedRole && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-medium">
                Please select or enter a target role to launch
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupStep;

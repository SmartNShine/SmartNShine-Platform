import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  Cpu,
  FileText,
  Keyboard,
  Languages,
  Layers,
  Loader2,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { INTERVIEWER_VOICES, TYPE_ICONS, estimateQuestionCount } from "./constants";
import { InterviewerOrb } from "./InterviewerOrb";
import { SelectMenu } from "./SelectMenu";

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

// Spoken answers get 2-3 minutes each, so question counts are derived from
// the same pacing the server uses (see estimateQuestionCount).
const DURATION_PRESETS = [
  { mins: 10 },
  { mins: 15, recommended: true },
  { mins: 20 },
  { mins: 30 },
];

const DEFAULT_LEVELS = [
  { id: "fresher", name: "Fresher", years: "0–1 yrs" },
  { id: "junior", name: "Junior", years: "1–3 yrs" },
  { id: "mid", name: "Mid-Level", years: "3–5 yrs" },
  { id: "senior", name: "Senior", years: "5–8 yrs" },
  { id: "lead", name: "Lead / Staff", years: "8+ yrs" },
];

const card = "rounded-3xl border border-zinc-200/90 bg-white shadow-xs dark:border-white/10 dark:bg-zinc-950";

/** Two-option switch with an icon and a one-line hint per option. */
const Segmented = ({ label, value, options, onChange }) => (
  <div className="min-w-0">
    <span className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/[0.04]">
      {options.map((option) => {
        const OptionIcon = option.icon;
        const checked = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-[background-color,color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
              checked
                ? "bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <OptionIcon className={`h-4 w-4 shrink-0 ${checked ? "text-blue-600 dark:text-sky-300" : ""}`} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{option.label}</span>
              <span className="block truncate text-[11px] opacity-80">{option.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

/** Searchable role field: pick a known role or type a custom one (Enter). */
const RoleCombobox = ({ roles, selectedRole, displayRoleTitle, onSelect }) => {
  const id = useId();
  const rootRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const trimmed = query.trim();
  const matches = useMemo(() => {
    if (!trimmed) return roles;
    const q = trimmed.toLowerCase();
    return roles.filter((role) =>
      role.name.toLowerCase().includes(q) || role.id.toLowerCase().includes(q) ||
      role.topics?.some((topic) => topic.toLowerCase().includes(q)));
  }, [roles, trimmed]);
  const exact = matches.some((role) => role.name.toLowerCase() === trimmed.toLowerCase());

  const pick = (value) => {
    onSelect(value);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Role</label>
      <div className={`flex h-11 items-center gap-2.5 rounded-xl border bg-white px-3 transition-[border-color,box-shadow] duration-150 dark:bg-white/[0.03] ${
        open ? "border-blue-500 ring-4 ring-blue-500/10 dark:border-sky-400/60 dark:ring-sky-400/10" : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
      }`}>
        <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={open ? query : displayRoleTitle || ""}
          placeholder={open && displayRoleTitle ? displayRoleTitle : "Search or type a role"}
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); setQuery(""); event.currentTarget.blur(); }
            if (event.key === "Enter" && trimmed) {
              event.preventDefault();
              pick(matches.length === 1 ? matches[0].id : trimmed);
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
        />
        {selectedRole && !open && (
          <button type="button" onClick={() => onSelect("")} aria-label="Clear role"
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </div>

      {open && (
        <ul id={`${id}-list`} role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40">
          {trimmed && !exact && (
            <li role="option" aria-selected={false} onClick={() => pick(trimmed)}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/[0.06]">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-sky-300" aria-hidden="true" />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">Use “{trimmed}”</span>
              <span className="ml-auto text-xs text-zinc-400">Custom role</span>
            </li>
          )}
          {!trimmed && <li className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Popular roles</li>}
          {matches.map((role) => (
            <li key={role.id} role="option" aria-selected={selectedRole === role.id} onClick={() => pick(role.id)}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/[0.06]">
              <Briefcase className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{role.name}</span>
                {role.topics?.length > 0 && (
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{role.topics.slice(0, 4).join(" · ")}</span>
                )}
              </span>
              {selectedRole === role.id && <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400" aria-hidden="true" />}
            </li>
          ))}
          {trimmed && matches.length === 0 && (
            <li className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">No match. Press Enter to use it as a custom role.</li>
          )}
        </ul>
      )}
    </div>
  );
};

const SummaryRow = ({ icon: RowIcon, label, value }) => (
  <div className="flex items-center gap-3 py-2">
    <RowIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
    <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    <span className="ml-auto truncate pl-3 text-right text-xs font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
  </div>
);

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
  selectedResume,
  setSelectedResume,
  jobDescription,
  setJobDescription,
  interviewDuration,
  setInterviewDuration,
  isTestingVoice,
  isPlayingAudio,
  voiceEngine = "auto",
  setVoiceEngine,
  voiceProviders,
  voiceAvailable,
  ttsAvailable,
  selectedVoice = "shubh",
  isProduction = false,
  isSubmitting,
  onTestVoice,
  onStart,
  proctoringLevel = "practice",
  setProctoringLevel,
}) => {
  const interviewer = INTERVIEWER_VOICES[selectedVoice] || INTERVIEWER_VOICES.shubh;
  const isLocalWhisperAvailable = voiceProviders?.whisper?.available;
  const isSarvamAvailable = Boolean(voiceProviders?.sarvam?.available);
  const isCurrentEngineValid = voiceEngine === "local"
    ? isLocalWhisperAvailable
    : Boolean(isSarvamAvailable || voiceAvailable);
  const voiceDisabled = (!isSarvamAvailable && !isLocalWhisperAvailable && !voiceAvailable) || !ttsAvailable;

  const configRoles = config?.roles;
  const roles = useMemo(() => {
    const fromConfig = Array.isArray(configRoles) ? configRoles.map((role) => {
      const id = typeof role === "object" ? role.id || role.name : role;
      const name = typeof role === "object" ? role.name || role.id : role;
      return { id, name, topics: typeof role === "object" ? role.topics || [] : [] };
    }) : [];
    return fromConfig.length ? fromConfig : POPULAR_ROLES;
  }, [configRoles]);
  const currentRole = roles.find((role) => role.id === selectedRole || role.name === selectedRole);
  const displayRoleTitle = currentRole ? currentRole.name : selectedRole;

  const levels = config?.experienceLevels?.length ? config.experienceLevels : DEFAULT_LEVELS;
  const typeName = config?.interviewTypes?.find((type) => type.id === selectedType)?.name;

  const isReadyToStart = Boolean(
    selectedType &&
      selectedRole &&
      (selectedType !== "resume-based" || selectedResume) &&
      (selectedType !== "job-description" || (jobDescription && jobDescription.length >= 50)) &&
      (selectedMode === "text" || isCurrentEngineValid),
  );
  const missing = !selectedRole ? "Choose a role to continue."
    : selectedType === "resume-based" && !selectedResume ? "Choose a resume to continue."
      : selectedType === "job-description" && (jobDescription?.length || 0) < 50 ? "Paste a job description (at least 50 characters)."
        : selectedMode !== "text" && !isCurrentEngineValid ? "Voice isn't available right now. Switch to text answers."
          : null;
  const isVoiceBusy = isTestingVoice || isPlayingAudio;

  return (
    <div className="grid grid-cols-1 items-start gap-6 pb-16 font-sans text-zinc-900 dark:text-zinc-100 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Configuration */}
      <section aria-labelledby="setup-title" className={`${card} p-5 sm:p-7`}>
        <h2 id="setup-title" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Set up your interview</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Takes under a minute. Questions adapt to your answers as you go.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectMenu
            label="Interview format"
            value={selectedType}
            onChange={setSelectedType}
            placeholder="Choose a format"
            options={(config?.interviewTypes || []).map((type) => ({
              value: type.id,
              label: type.name,
              description: type.description,
              icon: TYPE_ICONS[type.id] || Sparkles,
            }))}
          />
          <RoleCombobox roles={roles} selectedRole={selectedRole} displayRoleTitle={displayRoleTitle} onSelect={setSelectedRole} />
          <SelectMenu
            label="Experience level"
            value={selectedLevel}
            onChange={setSelectedLevel}
            icon={BarChart3}
            options={levels.map((level) => ({ value: level.id, label: level.name, meta: level.years }))}
          />
          <SelectMenu
            label="Duration"
            value={interviewDuration}
            onChange={setInterviewDuration}
            icon={Clock}
            options={DURATION_PRESETS.map((preset) => ({
              value: preset.mins,
              label: `${preset.mins} minutes${preset.recommended ? " · Recommended" : ""}`,
              meta: `about ${estimateQuestionCount(preset.mins, selectedMode)} questions`,
            }))}
          />

          {selectedType === "resume-based" && (
            <div className="sm:col-span-2">
              {resumes?.length ? (
                <SelectMenu
                  label="Resume"
                  value={selectedResume}
                  onChange={setSelectedResume}
                  placeholder="Choose the resume to ask about"
                  icon={FileText}
                  options={resumes.map((resume) => ({
                    value: resume._id,
                    label:
                      [resume.resumeTitle, resume.name, resume.title].find(
                        (t) => t && t.trim() && t !== "Untitled Resume"
                      ) || "Untitled resume",
                    meta: `Updated ${new Date(resume.updatedAt).toLocaleDateString()}`,
                    icon: FileText,
                  }))}
                />
              ) : (
                <p className="flex items-center gap-2.5 rounded-xl border border-dashed border-zinc-300 px-3.5 py-3 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                  <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                  No resumes yet. Create or upload one in My Resumes first.
                </p>
              )}
            </div>
          )}

          {selectedType === "job-description" && (
            <div className="sm:col-span-2">
              <label htmlFor="setup-jd" className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Job description
                <span className={(jobDescription?.length || 0) >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}>
                  {jobDescription?.length || 0} / 50 min
                </span>
              </label>
              <textarea
                id="setup-jd"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the responsibilities and requirements"
                rows={4}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="my-6 h-px bg-zinc-100 dark:bg-white/[0.06]" aria-hidden="true" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Segmented
            label="How you answer"
            value={selectedMode}
            onChange={(mode) => {
              if (mode === "live" && voiceEngine === "local" && !isLocalWhisperAvailable && isSarvamAvailable) setVoiceEngine("sarvam");
              setSelectedMode(mode);
            }}
            options={[
              { value: "live", label: "Voice", hint: "Spoken, like a real call", icon: Mic, disabled: voiceDisabled },
              { value: "text", label: "Text", hint: "Type at your own pace", icon: Keyboard },
            ]}
          />
          <Segmented
            label="Monitoring"
            value={proctoringLevel}
            onChange={(level) => setProctoringLevel?.(level)}
            options={[
              { value: "practice", label: "Practice", hint: "Light monitoring", icon: Layers },
              { value: "proctored", label: "Proctored", hint: "Exam rules", icon: ShieldCheck },
            ]}
          />
        </div>

        {selectedMode === "live" && (
          <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            <Languages className="mt-px h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
            Answer in English. Your language is detected automatically, and answers in other languages score lower on communication.
          </p>
        )}

        {!isProduction && (
          <div className="mt-5 max-w-xs">
            <SelectMenu
              label="Voice engine (development only)"
              value={voiceEngine}
              onChange={setVoiceEngine}
              icon={Cpu}
              options={[
                { value: "sarvam", label: "Sarvam cloud" },
                { value: "local", label: "Local Whisper" },
                { value: "auto", label: "Auto hybrid" },
              ]}
            />
          </div>
        )}
      </section>

      {/* Interviewer + launch */}
      <aside className="space-y-4 lg:sticky lg:top-20">
        <div className={`${card} overflow-hidden`}>
          <div className="relative flex items-center gap-4 bg-zinc-950 px-5 py-4">
            <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,#12202e_0%,#09090b_75%)] ring-1 ring-inset ring-white/15 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
              <InterviewerOrb size={84} state={isVoiceBusy ? "speaking" : "idle"} label={`${interviewer.name}, your interviewer`} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-white">{interviewer.name}</p>
              <p className="truncate text-xs text-neutral-400">{interviewer.title}</p>
              <button
                type="button"
                onClick={() => onTestVoice?.("greeting")}
                disabled={isVoiceBusy}
                className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-60"
              >
                {isVoiceBusy
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Playing</>
                  : <><Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> Hear {interviewer.name}</>}
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 px-5 py-2 dark:divide-white/[0.06]">
            <SummaryRow icon={Briefcase} label="Role" value={displayRoleTitle || "Not chosen"} />
            <SummaryRow icon={TYPE_ICONS[selectedType] || Sparkles} label="Format" value={typeName || "Not chosen"} />
            <SummaryRow icon={BarChart3} label="Level" value={levels.find((level) => level.id === selectedLevel)?.name || selectedLevel} />
            <SummaryRow icon={selectedMode === "text" ? Keyboard : Mic} label="Answers"
              value={`${selectedMode === "text" ? "Text" : "Voice"} · ${interviewDuration} min`} />
            <SummaryRow icon={proctoringLevel === "proctored" ? ShieldCheck : Layers} label="Monitoring"
              value={proctoringLevel === "proctored" ? "Proctored" : "Practice"} />
          </div>

          <div className="space-y-2.5 px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={onStart}
              disabled={isSubmitting || !isReadyToStart}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-[background-color,transform] duration-150 hover:bg-blue-500 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none dark:disabled:bg-white/[0.06] dark:disabled:text-zinc-500"
            >
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Preparing</>
                : <>Continue <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /></>}
            </button>
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              {missing || "Next: a quick camera and monitoring check."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SetupStep;

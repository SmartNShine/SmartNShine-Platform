import { useEffect, useState } from "react";
import { CameraPreviewStage } from "./proctoring/CameraPreviewStage";
import { checkInterviewEnvironment } from "./hooks/useEnvironmentGuard";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CopyBlockIcon,
  DisplaysIcon,
  DoneIcon,
  FaceScanIcon,
  FullscreenIcon,
  LockIcon,
  MicLiveIcon,
  ScreenShareIcon,
  ShieldIcon,
  TabAwayIcon,
  VirtualDeviceIcon,
} from "./StudioIcons";

const STEPS = ["Setup", "Monitoring", "Interview"];

const selectClass =
  "w-full min-w-0 appearance-none rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-neutral-200 ring-1 ring-inset ring-white/10 " +
  "transition-colors hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 cursor-pointer";

const StepTrail = () => (
  <ol className="flex items-center gap-2 text-xs" aria-label="Progress">
    {STEPS.map((step, index) => {
      const done = index === 0;
      const current = index === 1;
      return (
        <li key={step} className="flex items-center gap-2">
          {index > 0 && <span className="h-px w-6 bg-white/15 sm:w-10" aria-hidden="true" />}
          <span className={`flex items-center gap-1.5 ${current ? "font-semibold text-white" : done ? "text-neutral-400" : "text-neutral-600"}`}
            aria-current={current ? "step" : undefined}>
            {done ? (
              <DoneIcon className="h-4 w-4 text-emerald-400" />
            ) : (
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] tabular-nums ${
                current ? "bg-sky-400 text-neutral-950" : "ring-1 ring-inset ring-white/15"
              }`}>{index + 1}</span>
            )}
            {step}
          </span>
        </li>
      );
    })}
  </ol>
);

/** One readiness row: icon tile coloured by state, label and a fix hint. */
const CheckRow = ({ icon: RowIcon, label, state, hint }) => {
  const tone = {
    ok: "bg-emerald-400/10 text-emerald-300",
    warn: "bg-amber-400/10 text-amber-300",
    block: "bg-rose-500/10 text-rose-300",
    pending: "bg-white/[0.04] text-neutral-400",
  }[state];
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <RowIcon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-neutral-100">{label}</span>
          {state === "ok" && <DoneIcon className="h-4 w-4 shrink-0 text-emerald-400" />}
          {(state === "warn" || state === "block") && (
            <AlertIcon className={`h-4 w-4 shrink-0 ${state === "block" ? "text-rose-300" : "text-amber-300"}`} />
          )}
          {state === "pending" && (
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white/15 border-t-sky-300 motion-safe:animate-spin" aria-label="Checking" />
          )}
        </span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-neutral-400">{hint}</span>}
      </span>
    </li>
  );
};

const MonitorItem = ({ icon: ItemIcon, children }) => (
  <li className="flex items-start gap-3">
    <ItemIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-300/80" />
    <span className="text-[13px] leading-relaxed text-neutral-300">{children}</span>
  </li>
);

/**
 * Full-screen step between setup and the interview: monitoring starts here
 * (camera and mic, system check, consent). The Start click turns on fullscreen
 * and screen sharing (proctored) and creates the session.
 */
export const MonitoringCheckStep = ({
  proctoringLevel = "practice",
  screenShareRequired = false,
  roleLabel = "",
  isSubmitting = false,
  onBack,
  onBegin,
  cameraVideoRef,
  isCameraActive = false,
  cameraError = null,
  isCameraInitializing = false,
  onStartCamera,
  videoDevices = [],
  selectedDeviceId = "",
  onSwitchCamera,
  audioDevices = [],
  selectedAudioDeviceId = "",
  onSwitchAudioDevice,
  audioInputLevel = 0,
  onStartMicPreview,
}) => {
  const isProctored = proctoringLevel === "proctored";
  const [accepted, setAccepted] = useState(false);
  const [environment, setEnvironment] = useState(null);
  const [micHeard, setMicHeard] = useState(false);

  // Monitoring starts as soon as this screen opens.
  useEffect(() => {
    if (!isCameraActive && !isCameraInitializing) {
      onStartCamera?.();
      onStartMicPreview?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioInputLevel > 5 && !micHeard) setMicHeard(true);
  }, [audioInputLevel, micHeard]);

  // System check: re-run when devices change or the camera starts.
  useEffect(() => {
    let cancelled = false;
    const run = () => checkInterviewEnvironment().then((result) => { if (!cancelled) setEnvironment(result); });
    run();
    const timer = setInterval(run, 5000);
    navigator.mediaDevices?.addEventListener?.("devicechange", run);
    return () => {
      cancelled = true;
      clearInterval(timer);
      navigator.mediaDevices?.removeEventListener?.("devicechange", run);
    };
  }, [isCameraActive]);

  // state: ok | warn (start allowed) | block (start disabled) | pending
  const checks = [
    {
      key: "camera",
      icon: CameraIcon,
      label: "Camera",
      state: isCameraActive ? "ok" : isCameraInitializing ? "pending" : isProctored ? "block" : "warn",
      hint: isCameraActive ? null : cameraError ? "Allow camera access in your browser, then try again." : "Turning on your camera…",
    },
    {
      key: "mic",
      icon: MicLiveIcon,
      label: "Microphone",
      state: micHeard ? "ok" : "pending",
      hint: micHeard ? null : "Say a few words. The level meter under the camera should move.",
    },
  ];
  if (isProctored) {
    const virtual = environment?.virtualDevices || [];
    checks.push(
      {
        key: "virtual",
        icon: VirtualDeviceIcon,
        label: "Real camera and microphone",
        state: !environment ? "pending" : virtual.length ? "block" : "ok",
        hint: virtual.length ? `Switch away from ${virtual.join(", ")}.` : null,
      },
      {
        key: "display",
        icon: DisplaysIcon,
        label: "Single display",
        state: !environment ? "pending" : environment.extendedDisplay === true ? "block" : "ok",
        hint: environment?.extendedDisplay === true
          ? "Disconnect or mirror extra monitors."
          : environment?.extendedDisplay === null ? "This browser can't confirm it. Use one screen only." : null,
      },
      {
        key: "fullscreen",
        icon: FullscreenIcon,
        label: "Fullscreen",
        state: !environment ? "pending" : environment.fullscreenSupported ? "ok" : "block",
        hint: environment && !environment.fullscreenSupported ? "Use a recent Chrome, Edge or Firefox." : null,
      },
      {
        key: "share",
        icon: ScreenShareIcon,
        label: "Screen sharing",
        state: !environment ? "pending" : environment.screenShareSupported ? "ok" : screenShareRequired ? "block" : "warn",
        hint: environment && !environment.screenShareSupported
          ? screenShareRequired
            ? "Not available in this browser. Use Chrome or Edge on a computer."
            : "Not available in this browser. You can still start; the review will note it."
          : null,
      },
    );
  }
  const blocked = checks.some((check) => check.state === "block") || (isProctored && !environment);
  const canBegin = accepted && !blocked && !isSubmitting;

  return (
    <div className="flex min-h-dvh flex-col bg-[#08090D] font-sans text-neutral-100">
      <header className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/[0.06] bg-[#0C0E14]/80 px-4 py-3 backdrop-blur sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="group inline-flex w-fit items-center gap-2 rounded-full px-2 py-1.5 text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-50"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Back to setup
        </button>
        <div className="order-3 col-span-2 flex justify-center lg:order-none lg:col-span-1">
          <StepTrail />
        </div>
        <p className="truncate text-right text-sm text-neutral-400">{roleLabel}</p>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(380px,1fr)] lg:gap-8">
        {/* Camera stage */}
        <section aria-label="Camera and microphone" className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-black lg:aspect-auto lg:min-h-[460px] lg:flex-1">
            <CameraPreviewStage
              videoRef={cameraVideoRef}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              isInitializing={isCameraInitializing}
              onRetryCamera={onStartCamera}
              showGuideOval
              layout="center-stage"
            />
          </div>

          <div className="grid gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06] sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex items-center gap-2.5">
              <MicLiveIcon className={`h-5 w-5 ${micHeard ? "text-emerald-300" : "text-neutral-400"}`} />
              <div className="flex h-5 items-end gap-[3px]" aria-label={`Microphone level ${Math.round(audioInputLevel)}%`} role="meter"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(audioInputLevel)}>
                {Array.from({ length: 14 }, (_, bar) => {
                  const lit = audioInputLevel >= ((bar + 1) / 14) * 70;
                  return (
                    <span key={bar}
                      className={`w-[3px] rounded-full transition-[height,background-color] duration-75 ${lit ? "bg-emerald-300" : "bg-white/10"}`}
                      style={{ height: `${30 + ((bar * 37) % 70)}%` }} />
                  );
                })}
              </div>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {audioDevices.length > 0 && (
                <label className="min-w-0">
                  <span className="sr-only">Microphone</span>
                  <select value={selectedAudioDeviceId} onChange={(event) => onSwitchAudioDevice?.(event.target.value)} className={selectClass}>
                    {audioDevices.map((device, index) => (
                      <option key={device.deviceId || index} value={device.deviceId} className="bg-neutral-900">
                        {device.label || `Microphone ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {videoDevices.length > 1 && (
                <label className="min-w-0">
                  <span className="sr-only">Camera</span>
                  <select value={selectedDeviceId} onChange={(event) => onSwitchCamera?.(event.target.value)} className={selectClass}>
                    {videoDevices.map((device, index) => (
                      <option key={device.deviceId || index} value={device.deviceId} className="bg-neutral-900">
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Readiness + consent */}
        <section aria-labelledby="monitoring-title" className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-sky-300">
              <ShieldIcon className="h-[18px] w-[18px]" />
              {isProctored ? "Proctored interview" : "Practice interview"}
            </div>
            <h1 id="monitoring-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
              Let's get you ready
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
              {isProctored
                ? "Monitoring starts before the first question. When everything below is green, share your screen to begin."
                : "A quick camera and microphone check, then your interview begins."}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Readiness</h2>
            <ul className="mt-1 divide-y divide-white/[0.05]">
              {checks.map(({ key, ...check }) => <CheckRow key={key} {...check} />)}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">During the interview</h2>
            <ul className="mt-3 space-y-2.5">
              <MonitorItem icon={FaceScanIcon}>Your camera: only you in view, no phone, eyes on the screen.</MonitorItem>
              <MonitorItem icon={TabAwayIcon}>Leaving the interview tab or window, and for how long.</MonitorItem>
              <MonitorItem icon={DisplaysIcon}>Virtual cameras or microphones, extra displays and a second interview tab.</MonitorItem>
              {isProctored && (
                <>
                  <MonitorItem icon={FullscreenIcon}>Fullscreen stays on. Leaving it pauses your timer and is recorded.</MonitorItem>
                  <MonitorItem icon={CopyBlockIcon}>Copying the question text is blocked.</MonitorItem>
                  <MonitorItem icon={ScreenShareIcon}>
                    Your entire screen is captured as still images every 15 seconds and when you leave the window. Not a video.
                  </MonitorItem>
                </>
              )}
            </ul>
          </div>

          <p className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3.5 text-xs leading-relaxed text-neutral-400 ring-1 ring-inset ring-white/[0.06]">
            <LockIcon className="mt-px h-[18px] w-[18px] shrink-0 text-neutral-300" />
            <span>
              {isProctored
                ? "Events are saved with snapshots for a person to review. Nothing is decided automatically. Screen images can show notifications, so close anything private first. They're deleted after 30 days."
                : "In practice mode, monitoring only adds integrity notes to your report."}
            </span>
          </p>

          <div className="mt-auto space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-white/5 accent-sky-400"
              />
              I understand what is monitored and agree to it for this interview.
            </label>

            <button
              type="button"
              onClick={() => { if (canBegin) onBegin?.(); }}
              disabled={!canBegin}
              className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-sky-400 px-6 text-sm font-semibold text-neutral-950 transition-[background-color,transform] duration-150 hover:bg-sky-300 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-neutral-500"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-neutral-950/30 border-t-neutral-950 motion-safe:animate-spin" aria-hidden="true" />
                  Starting interview…
                </>
              ) : (
                <>
                  {isProctored && <ScreenShareIcon className="h-[18px] w-[18px]" />}
                  {isProctored ? "Share screen and start" : "Start interview"}
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-neutral-500">
              {blocked
                ? "Fix the items marked above to continue."
                : !accepted
                  ? "Tick the box above to continue."
                  : isProctored
                    ? "Your browser will ask what to share. Choose “Entire screen”."
                    : "The interviewer will greet you first."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MonitoringCheckStep;

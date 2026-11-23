// Custom duotone icons for the live interview studio. 24px grid, 1.75 stroke,
// a soft currentColor fill for depth. Decorative by default (aria-hidden).

const Icon = ({ children, className = "h-5 w-5", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

export const MicLiveIcon = (props) => (
  <Icon {...props}>
    <rect x="9" y="2.75" width="6" height="11.5" rx="3" fill="currentColor" fillOpacity="0.16" />
    <path d="M5.5 11.25a6.5 6.5 0 0 0 13 0" />
    <path d="M12 17.75v3.5" />
    <path d="M9.25 21.25h5.5" />
    <path d="M2.75 8.5v2.5M21.25 8.5v2.5" opacity="0.55" />
  </Icon>
);

export const DoneIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9.25" fill="currentColor" fillOpacity="0.14" />
    <path d="M8 12.4l2.7 2.7 5.4-5.6" />
  </Icon>
);

export const SkipIcon = (props) => (
  <Icon {...props}>
    <path d="M4.5 7.1v9.8L11 12z" fill="currentColor" fillOpacity="0.16" />
    <path d="M11 7.1v9.8L17.5 12z" fill="currentColor" fillOpacity="0.16" />
    <path d="M20.25 6.5v11" />
  </Icon>
);

export const ReplayIcon = (props) => (
  <Icon {...props}>
    <path d="M4.75 12a7.25 7.25 0 1 0 2.12-5.13" />
    <path d="M4.75 4.25v3.5h3.5" />
    <path d="M10.6 9.4v5.2l4.1-2.6z" fill="currentColor" fillOpacity="0.2" />
  </Icon>
);

export const CallEndIcon = (props) => (
  <Icon {...props}>
    <path
      d="M3.4 13.6c4.8-4.3 12.4-4.3 17.2 0 .55.5.6 1.35.1 1.9l-1.55 1.65a1.3 1.3 0 0 1-1.68.2l-2.15-1.4a1.3 1.3 0 0 1-.58-1.18l.08-1.45a10.6 10.6 0 0 0-5.64 0l.08 1.45c.03.47-.2.92-.58 1.18l-2.15 1.4a1.3 1.3 0 0 1-1.68-.2L3.3 15.5a1.33 1.33 0 0 1 .1-1.9Z"
      fill="currentColor"
      fillOpacity="0.16"
    />
  </Icon>
);

export const ThinkIcon = (props) => (
  <Icon {...props}>
    <path
      d="M12 3a6 6 0 0 0-3.55 10.84c.62.46.98 1.18.98 1.95v.21h5.14v-.21c0-.77.36-1.49.98-1.95A6 6 0 0 0 12 3Z"
      fill="currentColor"
      fillOpacity="0.16"
    />
    <path d="M9.5 18.5h5M10.5 21h3" />
  </Icon>
);

export const CloseIcon = (props) => (
  <Icon {...props}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);

export const ShieldIcon = (props) => (
  <Icon {...props}>
    <path
      d="M12 2.75 4.75 5.6v5.65c0 4.5 3.05 8.45 7.25 9.95 4.2-1.5 7.25-5.45 7.25-9.95V5.6z"
      fill="currentColor"
      fillOpacity="0.16"
    />
    <path d="M9 12.2l2.1 2.1 4-4.2" />
  </Icon>
);

// ---- Monitoring check (setup → monitoring → interview) ----

export const CameraIcon = (props) => (
  <Icon {...props}>
    <rect x="2.75" y="6.25" width="13.5" height="11.5" rx="2.5" fill="currentColor" fillOpacity="0.16" />
    <path d="M16.25 10.4l4.2-2.6c.35-.22.8.03.8.45v7.5c0 .42-.45.67-.8.45l-4.2-2.6" />
    <circle cx="6.5" cy="9.6" r="0.6" fill="currentColor" stroke="none" />
  </Icon>
);

export const ScreenShareIcon = (props) => (
  <Icon {...props}>
    <rect x="2.75" y="3.75" width="18.5" height="12.5" rx="2.25" fill="currentColor" fillOpacity="0.16" />
    <path d="M8.5 20.25h7M12 16.25v4" />
    <path d="M9.5 10.5 12 8l2.5 2.5M12 8v5" />
  </Icon>
);

export const DisplaysIcon = (props) => (
  <Icon {...props}>
    <rect x="2.75" y="5.25" width="11.5" height="8.5" rx="1.75" fill="currentColor" fillOpacity="0.16" />
    <path d="M17.25 8.25h2.25c.97 0 1.75.78 1.75 1.75v5c0 .97-.78 1.75-1.75 1.75h-6.5c-.97 0-1.75-.78-1.75-1.75v-1.25" opacity="0.6" />
    <path d="M6.5 17.75h4M8.5 13.75v4" />
  </Icon>
);

export const FullscreenIcon = (props) => (
  <Icon {...props}>
    <rect x="5.75" y="5.75" width="12.5" height="12.5" rx="2" fill="currentColor" fillOpacity="0.12" stroke="none" />
    <path d="M3.25 8.5V5.25c0-1.1.9-2 2-2H8.5M15.5 3.25h3.25c1.1 0 2 .9 2 2V8.5M20.75 15.5v3.25c0 1.1-.9 2-2 2H15.5M8.5 20.75H5.25c-1.1 0-2-.9-2-2V15.5" />
  </Icon>
);

export const TabAwayIcon = (props) => (
  <Icon {...props}>
    <rect x="2.75" y="4.75" width="15.5" height="14.5" rx="2.25" fill="currentColor" fillOpacity="0.16" />
    <path d="M2.75 9h15.5" />
    <path d="M14.5 14.25h6.75M18.75 11.75l2.5 2.5-2.5 2.5" />
  </Icon>
);

export const FaceScanIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.16" />
    <path d="M10.2 11h.01M13.8 11h.01M10.3 13.6c.95.8 2.45.8 3.4 0" />
    <path d="M3.25 7.5V5.25c0-1.1.9-2 2-2H7.5M16.5 3.25h2.25c1.1 0 2 .9 2 2V7.5M20.75 16.5v2.25c0 1.1-.9 2-2 2H16.5M7.5 20.75H5.25c-1.1 0-2-.9-2-2V16.5" />
  </Icon>
);

export const VirtualDeviceIcon = (props) => (
  <Icon {...props}>
    <rect x="3.25" y="6.75" width="11" height="10.5" rx="2.25" fill="currentColor" fillOpacity="0.16" />
    <path d="M14.25 10.5l3.5-2v7l-3.5-2" />
    <path d="M3 3l18 18" opacity="0.7" />
  </Icon>
);

export const CopyBlockIcon = (props) => (
  <Icon {...props}>
    <rect x="8.25" y="8.25" width="12" height="12" rx="2.25" fill="currentColor" fillOpacity="0.16" />
    <path d="M15.75 8.25V5.5c0-1.1-.9-2-2-2H5.5c-1.1 0-2 .9-2 2v8.25c0 1.1.9 2 2 2h2.75" />
    <path d="M11.75 14.25h5" />
  </Icon>
);

export const LockIcon = (props) => (
  <Icon {...props}>
    <rect x="4.75" y="10.25" width="14.5" height="10.5" rx="2.25" fill="currentColor" fillOpacity="0.16" />
    <path d="M8 10.25V7.5a4 4 0 0 1 8 0v2.75M12 14.5v2" />
  </Icon>
);

export const AlertIcon = (props) => (
  <Icon {...props}>
    <path d="M10.3 3.9 2.6 17.25c-.75 1.3.19 2.95 1.7 2.95h15.4c1.51 0 2.45-1.65 1.7-2.95L13.7 3.9c-.76-1.3-2.64-1.3-3.4 0z" fill="currentColor" fillOpacity="0.16" />
    <path d="M12 9v4.25M12 16.75h.01" />
  </Icon>
);

export const ArrowLeftIcon = (props) => (
  <Icon {...props}>
    <path d="M19.25 12H4.75M10.5 6.25 4.75 12l5.75 5.75" />
  </Icon>
);

export const ArrowRightIcon = (props) => (
  <Icon {...props}>
    <path d="M4.75 12h14.5M13.5 6.25 19.25 12l-5.75 5.75" />
  </Icon>
);

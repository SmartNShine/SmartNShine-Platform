import {
  SlidersHorizontal,
  User,
  FileText,
  Target,
  BriefcaseBusiness,
  GraduationCap,
  Rocket,
  ScrollText,
  Trophy,
  PenSquare,
} from "lucide-react";

// Default section order (only editable resume sections)
export const DEFAULT_SECTION_ORDER = [
  "layout",
  "personal",
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
  "achievements",
  "customSections",
];

export const SECTION_META = {
  layout: { label: "Resume Layout", icon: SlidersHorizontal },
  personal: { label: "Personal Info", icon: User },
  summary: { label: "Summary", icon: FileText },
  skills: { label: "Skills", icon: Target },
  experience: { label: "Experience", icon: BriefcaseBusiness },
  education: { label: "Education", icon: GraduationCap },
  projects: { label: "Projects", icon: Rocket },
  certifications: { label: "Certifications", icon: ScrollText },
  achievements: { label: "Achievements", icon: Trophy },
  customSections: { label: "Custom Sections", icon: PenSquare },
};

export const LAYOUT_DEFAULTS = {
  fontScale: 100,
  fontFamily: "Arial, Helvetica, sans-serif",
  pagePadding: "0.44in",
  pagePaddingTop: "0.35in",
  pagePaddingBottom: "0.35in",
  sectionSpacing: 100,
  contactLayout: "center-inline",
};

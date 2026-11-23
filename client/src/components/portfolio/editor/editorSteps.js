import {
  User,
  Phone,
  Rocket,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  Trophy,
  Layers,
  Palette,
  Sliders,
  Search,
  Globe2,
} from "lucide-react";

export const EDITOR_STEPS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "projects", label: "Projects", icon: Rocket },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "achievements", label: "Honors", icon: Trophy },
  { id: "custom", label: "Custom", icon: Layers },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "order", label: "Ordering", icon: Sliders },
  { id: "seo", label: "SEO", icon: Search },
  { id: "publish", label: "Publish", icon: Globe2 },
];

export const getPublishChecklist = (form) => {
  const hasTitle = Boolean(form?.title?.trim() || form?.professionalTitle?.trim());
  const hasContact = Boolean(
    form?.contact?.email ||
      form?.contact?.phone ||
      (form?.socialLinks || []).some((link) => link?.url)
  );
  const visibleSectionCount = Object.values(form?.sections || {}).filter(
    Boolean
  ).length;

  return [
    {
      id: "title",
      label: "Add a portfolio title or professional title",
      ok: hasTitle,
    },
    {
      id: "contact",
      label: "Add at least one contact method or social link",
      ok: hasContact,
    },
    {
      id: "sections",
      label: "Enable at least one visible portfolio section",
      ok: visibleSectionCount > 0,
    },
  ];
};

export const isPublishReady = (form) =>
  getPublishChecklist(form).every((item) => item.ok);

import { DEFAULT_QR_CODE } from "../utils/qrCode";

/**
 * Rich, professional demo resume data used for:
 * 1. Template selection previews (TemplateSelectorModal thumbnails)
 * 2. Visual live preview when building a new resume from scratch before user input
 */
export const DEMO_RESUME_DATA = {
  name: "Alex Morgan",
  qrCode: { ...DEFAULT_QR_CODE },
  targetJobRole: "Senior Full Stack Software Engineer",
  contact: {
    email: "alex.morgan@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexmorgan",
    github: "github.com/alexmorgan",
    portfolio: "alexmorgan.dev",
  },
  summary:
    "Dynamic Senior Full Stack Engineer with 6+ years of experience architecting high-scale distributed systems and modern web applications. Proven track record of improving cloud reliability to 99.99%, reducing API latency by 35%, and mentoring engineering teams in high-growth environments.",
  skills: [
    "React / Next.js",
    "TypeScript",
    "Node.js",
    "Python",
    "PostgreSQL",
    "Docker & Kubernetes",
    "AWS & Cloud Architecture",
    "GraphQL & REST APIs",
    "Microservices",
    "CI/CD Pipelines",
    "Tailwind CSS",
    "System Design",
  ],
  experience: [
    {
      id: "exp-1",
      title: "Senior Full Stack Engineer",
      company: "Stripe",
      location: "San Francisco, CA",
      startDate: "2021",
      endDate: "Present",
      current: true,
      description:
        "Spearheaded architecture of high-throughput payment settlement microservices handling $40M+ in daily transaction volume with 99.99% availability.\nLed a team of 7 engineers to migrate legacy services to modern React/Node infrastructure, cutting page load times by 42%.\nDesigned automated CI/CD deployment pipelines reducing release rollback frequency from 8% to under 0.5%.",
    },
    {
      id: "exp-2",
      title: "Software Engineer",
      company: "DoorDash",
      location: "San Francisco, CA",
      startDate: "2019",
      endDate: "2021",
      current: false,
      description:
        "Engineered real-time delivery routing algorithm components in Go and TypeScript serving 2M+ active consumers.\nRefactored database query plans and implemented Redis caching, reducing p95 latency from 320ms to 45ms.\nPartnered with product teams to roll out merchant portal features driving 18% increase in partner retention.",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Stanford University",
      degree: "B.S. in Computer Science",
      location: "Stanford, CA",
      startDate: "2015",
      endDate: "2019",
      gpa: "3.85 / 4.0",
      description:
        "Focus on Distributed Systems & Artificial Intelligence. Graduated with Honors. President of ACM Student Chapter.",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "CloudScale Infrastructure Monitor",
      technologies: "React, TypeScript, Go, Docker, Prometheus",
      link: "https://github.com/alexmorgan/cloudscale",
      description:
        "Open-source distributed observability platform with 3,500+ GitHub stars. Provides real-time metrics and automated anomaly alerts for cloud workloads.",
    },
    {
      id: "proj-2",
      name: "AI Document & Resume Optimizer",
      technologies: "Next.js, Python, FastAPI, Tailwind CSS",
      link: "https://alexmorgan.dev/ai-optimizer",
      description:
        "Engineered an automated ATS parsing and keyword optimization platform helping 40,000+ job seekers analyze resume compatibility.",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023",
      url: "https://aws.amazon.com",
    },
    {
      id: "cert-2",
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "Cloud Native Computing Foundation",
      date: "2022",
    },
  ],
  achievements: [
    "1st Place – Global Cloud Architecture Hackathon: Selected top winner among 420 international engineering teams for low-latency serverless edge computing engine.",
  ],
  customSections: [],
  selectedTheme: "navy",
  colorTheme: "navy",
  density: "medium",
  fontPairing: "modernSans",
};

/**
 * Checks if resume has little to no user-entered content
 */
export function isResumeDataEmpty(data) {
  if (!data) return true;
  const hasName = Boolean(data.name && data.name.trim().length > 0);
  const hasSummary = Boolean(
    data.summary && data.summary.replace(/<[^>]*>/g, "").trim().length > 0
  );
  const hasExp = Boolean(data.experience && data.experience.length > 0);
  const hasEdu = Boolean(data.education && data.education.length > 0);
  const hasSkills = Boolean(data.skills && data.skills.length > 0);

  // If user hasn't filled name and at least one core section, treat as empty for preview
  return !hasName && !hasExp && !hasEdu && !hasSkills && !hasSummary;
}

/**
 * Returns either user data or demo data to ensure a template preview is never blank
 */
export function getTemplatePreviewData(userData) {
  if (isResumeDataEmpty(userData)) {
    return DEMO_RESUME_DATA;
  }

  // If user has some data, complement any completely missing sections with demo data so the preview looks complete
  return {
    ...DEMO_RESUME_DATA,
    ...userData,
    name: userData.name?.trim() ? userData.name : DEMO_RESUME_DATA.name,
    targetJobRole: userData.targetJobRole?.trim()
      ? userData.targetJobRole
      : DEMO_RESUME_DATA.targetJobRole,
    contact: {
      ...DEMO_RESUME_DATA.contact,
      ...(userData.contact || {}),
    },
    summary: userData.summary?.trim()
      ? userData.summary
      : DEMO_RESUME_DATA.summary,
    skills:
      userData.skills && userData.skills.length > 0
        ? userData.skills
        : DEMO_RESUME_DATA.skills,
    experience:
      userData.experience && userData.experience.length > 0
        ? userData.experience
        : DEMO_RESUME_DATA.experience,
    education:
      userData.education && userData.education.length > 0
        ? userData.education
        : DEMO_RESUME_DATA.education,
    projects:
      userData.projects && userData.projects.length > 0
        ? userData.projects
        : DEMO_RESUME_DATA.projects,
  };
}

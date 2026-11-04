import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/common/SEO";
import TemplateSchema from "@/components/common/TemplateSchema";
import {
  TEMPLATES,
  TEMPLATE_COLOR_THEMES,
} from "@/components/editor/templateConfig";
import ExecutiveTemplate from "@/components/templates/ExecutiveTemplate";
import ClassicTemplate from "@/components/templates/ClassicTemplate";
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalTemplate from "@/components/templates/MinimalTemplate";
import ProfessionalTemplate from "@/components/templates/ProfessionalTemplate";
import Professional2Template from "@/components/templates/Professional2Template";
import TechTemplate from "@/components/templates/TechTemplate";
import Creative2Template from "@/components/templates/Creative2Template";
import StrategicLeadershipTemplate from "@/components/templates/StrategicLeadershipTemplate";
import ImpactProTemplate from "@/components/templates/ImpactProTemplate";
import GitHubStyleTemplate from "@/components/templates/GitHubStyleTemplate";
import StructuredPhotoTemplate from "@/components/templates/StructuredPhotoTemplate";
import SiliconValleyTemplate from "@/components/templates/SiliconValleyTemplate";
import LatexAcademicTemplate from "@/components/templates/LatexAcademicTemplate";
import NordicSplitTemplate from "@/components/templates/NordicSplitTemplate";
import {
  TemplatesBanner,
  TemplateCard,
  TemplatePreviewModal,
} from "@/components/templatesGallery";
import { resumeAPI } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Zap,
  FileCheck,
  Award,
} from "lucide-react";

import ProfessionalV2Template from "@/components/templates/ProfessionalV2Template";

// Rich, comprehensive sample resume data for perfect template previews
const sampleResumeData = {
  name: "Alex Morgan",
  title: "Senior Full-Stack Architect & AI Systems Engineer",
  headline: "Senior Full-Stack Architect & AI Systems Engineer",
  targetRole: "Senior Full-Stack Architect & AI Systems Engineer",
  email: "alex.morgan@stanford.edu",
  phone: "+1 (415) 890-2341",
  location: "San Francisco, CA",
  website: "https://alexmorgan.dev",
  linkedin: "https://linkedin.com/in/alexmorgan",
  github: "https://github.com/alexmorgan",
  personalInfo: {
    fullName: "Alex Morgan",
    email: "alex.morgan@stanford.edu",
    phone: "+1 (415) 890-2341",
    location: "San Francisco, CA",
    title: "Senior Full-Stack Architect & AI Systems Engineer",
    website: "https://alexmorgan.dev",
    linkedin: "https://linkedin.com/in/alexmorgan",
    github: "https://github.com/alexmorgan",
  },
  contact: {
    email: "alex.morgan@stanford.edu",
    phone: "+1 (415) 890-2341",
    location: "San Francisco, CA",
    website: "https://alexmorgan.dev",
    linkedin: "https://linkedin.com/in/alexmorgan",
    github: "https://github.com/alexmorgan",
  },
  summary:
    "Engineering leader with 7+ years of experience architecting high-scale distributed cloud systems, modern web apps, and enterprise AI workflows. Scaled platform infrastructure to 2M+ active users, reduced p99 latency by 42%, and driven $3.2M in annual cloud infrastructure efficiencies.",
  skills: [
    {
      category: "Languages & Frameworks",
      items: ["TypeScript", "React", "Node.js", "Python", "Go", "Next.js", "GraphQL"],
    },
    {
      category: "Cloud & Distributed Systems",
      items: ["AWS (EKS, Lambda)", "Docker", "Kubernetes", "PostgreSQL", "Redis", "Kafka", "Terraform"],
    },
    {
      category: "AI & ML Architecture",
      items: ["OpenAI GPT-4o", "LangChain", "Vector Embeddings", "vLLM", "Prompt Engineering"],
    },
  ],
  skillsList: ["TypeScript", "React", "Node.js", "Python", "AWS", "Kubernetes", "PostgreSQL", "Docker", "Redis", "Kafka"],
  experience: [
    {
      position: "Lead Cloud Architect",
      company: "Apex Distributed Labs",
      location: "San Francisco, CA",
      startDate: "2021",
      endDate: "Present",
      description: "Led core infrastructure team responsible for zero-downtime microservices and AI agent orchestration.",
      bullets: [
        "Architected multi-region Kubernetes cluster processing 140M+ daily events with 99.99% service availability",
        "Engineered real-time semantic caching layer in Redis, slashing database read latency by 58% and saving $180K/yr",
        "Spearheaded enterprise LLM agent deployment enabling automated code review for 120+ internal engineers",
      ],
    },
    {
      position: "Senior Systems Engineer",
      company: "Vanguard Cloud Technologies",
      location: "San Jose, CA",
      startDate: "2018",
      endDate: "2021",
      bullets: [
        "Migrated monolithic backend to containerized Go/Node.js microservices, cutting deployment cycle times from 4 hrs to 12 mins",
        "Implemented high-throughput event streaming with Kafka, accommodating a 300% traffic surge across Cyber Week",
        "Mentored 8 mid-level and junior engineers through technical architecture reviews and system design workshops",
      ],
    },
  ],
  education: [
    {
      degree: "Master of Science in Computer Science",
      field: "Computer Science",
      institution: "Stanford University",
      location: "Stanford, CA",
      graduationDate: "2018",
      gpa: "3.94 / 4.0",
      bullets: ["Specialization in Distributed Systems & Machine Intelligence", "Graduate Research Assistant at Stanford AI Lab"],
    },
    {
      degree: "Bachelor of Science in Software Engineering",
      field: "Software Engineering",
      institution: "UC Berkeley",
      location: "Berkeley, CA",
      graduationDate: "2016",
      gpa: "3.88 / 4.0",
      bullets: ["Dean's Honors List (All Semesters)", "President of Association for Computing Machinery (ACM)"],
    },
  ],
  projects: [
    {
      name: "HyperScale Vector Gateway",
      technologies: ["Rust", "Python", "gRPC", "pgvector", "Docker"],
      description: "High-performance vector search proxy delivering sub-8ms retrieval over 10M+ embedded document chunks.",
      url: "https://github.com/alexmorgan/vector-gateway",
      date: "2023",
    },
    {
      name: "PulseStream Monitoring Suite",
      technologies: ["React", "TypeScript", "ClickHouse", "WebSockets"],
      description: "Distributed telemetry dashboard visualizing latency metrics and error budgets across 40+ microservices.",
      url: "https://github.com/alexmorgan/pulsestream",
      date: "2022",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023",
    },
    {
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "Linux Foundation / CNCF",
      date: "2022",
    },
  ],
  achievements: [
    "Published author: 'Low-Latency Sharding Strategies in Cloud-Native Databases' (IEEE Conf, 2021)",
    "Winner of Silicon Valley Global Cloud Hackathon (1st Place out of 280 teams)",
  ],
};

const TEMPLATE_COMPONENTS = {
  "silicon-valley": SiliconValleyTemplate,
  siliconValley: SiliconValleyTemplate,
  "latex-academic": LatexAcademicTemplate,
  latexAcademic: LatexAcademicTemplate,
  "nordic-split": NordicSplitTemplate,
  nordicSplit: NordicSplitTemplate,
  executive: ExecutiveTemplate,
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  "professional-v2": ProfessionalV2Template,
  professionalV2: ProfessionalV2Template,
  "professional-2": Professional2Template,
  professional2: Professional2Template,
  tech: TechTemplate,
  "creative-2": Creative2Template,
  creative2: Creative2Template,
  "strategic-leader": StrategicLeadershipTemplate,
  "strategic-leadership": StrategicLeadershipTemplate,
  "impact-pro": ImpactProTemplate,
  "github-style": GitHubStyleTemplate,
  githubstyle: GitHubStyleTemplate,
  GitHubStyle: GitHubStyleTemplate,
  "structured-photo": StructuredPhotoTemplate,
};

const BASE_TEMPLATE_LIST = [
  {
    id: "silicon-valley",
    name: "Silicon Valley Tech Lead",
    component: SiliconValleyTemplate,
    category: "Tech",
    atsScore: 99,
    badge: "FLAGSHIP 2026",
    description:
      "Stripe & Linear-inspired high-craft developer layout with ATS-safe metric badges and domain skill capsules.",
    features: ["Developer Typography", "Metric Highlighting", "Skill Capsules", "Commit Rail"],
    colors: ["#4f46e5", "#059669", "#1e293b", "#18181b"],
  },
  {
    id: "latex-academic",
    name: "Stanford / LaTeX Academic Pro",
    component: LatexAcademicTemplate,
    category: "Academic",
    atsScore: 99,
    badge: "98% ATS GRADE",
    description:
      "Mathematical precision with classic academic serif typography, fine hairline rules, and publication metrics.",
    features: ["LaTeX Typography", "Hairline Rules", "Research Metrics", "1-Page Fit"],
    colors: ["#002147", "#8c1515", "#005a9c", "#065f46"],
  },
  {
    id: "nordic-split",
    name: "Nordic Two-Column Architect",
    component: NordicSplitTemplate,
    category: "Leadership",
    atsScore: 99,
    badge: "NEW FLAGSHIP",
    description:
      "Asymmetric 32/68 split layout with stylish left sidebar rail for skills & credentials and spacious right body.",
    features: ["Split-Rail Layout", "Skills Pills", "Impact Metrics", "Single-Flow ATS"],
    colors: ["#1d4ed8", "#047857", "#1e293b", "#0f766e"],
  },
  {
    id: "executive",
    name: "The Wall Street / Ivy League",
    component: ExecutiveTemplate,
    category: "Leadership",
    atsScore: 99,
    badge: "EXECUTIVE",
    description:
      "Dignified Ivy League aesthetic with centered masthead, Oxford double-rules, small-caps headers, and deal metric highlighting.",
    features: ["Ivy League Serif", "Oxford Double-Rule", "Deal Metrics", "1-Page Fit"],
    colors: ["#1e3a8a", "#065f46", "#1e293b", "#111827"],
  },
  {
    id: "classic",
    name: "The Open-Source Architect",
    component: ClassicTemplate,
    category: "Tech",
    atsScore: 99,
    badge: "ATS 99%",
    description:
      "Developer-centric, markdown-inspired layout with commit-style bullet points, repo badges, and 1-page auto-density.",
    features: ["Markdown Aesthetic", "Repo Metrics", "Commit-Style Bullets", "1-Page Fit"],
    colors: ["#0969da", "#16a34a", "#d97706", "#24292f"],
  },
  {
    id: "modern",
    name: "Linear / Vercel Minimalist",
    component: ModernTemplate,
    category: "Tech",
    atsScore: 98,
    badge: "MINIMALIST",
    description:
      "Precision engineering aesthetic with monospaced metadata, sleek timeline rail, and inline tech pills.",
    features: ["Monospaced Meta", "Timeline Rail", "Tech Pills", "1-Page Fit"],
    colors: ["#5e6ad2", "#059669", "#334155", "#000000"],
  },
  {
    id: "minimal",
    name: "The Swiss Minimalist",
    component: MinimalTemplate,
    category: "Minimal",
    atsScore: 99,
    badge: "SWISS CLEAN",
    description:
      "Ultra-clean Swiss typography, hairline dividers, space-efficient 2-line metadata, and guaranteed 1-page fit.",
    features: ["Swiss Typography", "Hairline Dividers", "Deduplicated Bullets", "1-Page Fit"],
    colors: ["#4338ca", "#047857", "#1e293b", "#09090b"],
  },
  {
    id: "professional",
    name: "Professional Elite",
    component: ProfessionalTemplate,
    category: "Professional",
    atsScore: 97,
    description:
      "Balanced and structured layout ideal for corporate, consulting, and enterprise roles.",
    features: ["Corporate Standard", "Clean Sections", "Balanced Spacing"],
    colors: ["#0284c7", "#0d9488", "#4f46e5", "#be185d"],
  },
  {
    id: "professional-v2",
    name: "Professional V2",
    component: ProfessionalV2Template,
    category: "Professional",
    atsScore: 96,
    badge: "TRENDING",
    description:
      "Refined modern professional format with structured metric callouts, KPI highlights, and project grids.",
    features: ["Metric Callouts", "KPI Cards", "Structured Projects", "High ATS"],
    colors: ["#1d4ed8", "#047857", "#831843", "#1e293b"],
  },
  {
    id: "professional-2",
    name: "Executive Minimalist",
    component: Professional2Template,
    category: "Professional",
    atsScore: 96,
    description:
      "Clean single-column executive design focusing on career milestones and leadership highlights.",
    features: ["Executive Format", "Single Column", "Timeline Highlights"],
    colors: ["#1e293b", "#0f766e", "#1d4ed8", "#991b1b"],
  },
  {
    id: "tech",
    name: "Developer Tech Stack",
    component: TechTemplate,
    category: "Tech",
    atsScore: 95,
    description:
      "Terminal-inspired modern format emphasizing tech stacks, cloud tools, and GitHub repositories.",
    features: ["Tech Stack Focus", "Developer Style", "Skills Grid"],
    colors: ["#10b981", "#06b6d4", "#6366f1", "#ec4899"],
  },
  {
    id: "creative2",
    name: "Creative 2.0 Editorial",
    component: Creative2Template,
    category: "Creative",
    atsScore: 94,
    description:
      "Vibrant modern creative template with dynamic layouts, aesthetic flair, and 95+ ATS-optimized structure.",
    features: ["Dynamic Layout", "Portfolio Elements", "Visual Appeal"],
    colors: ["#8b5cf6", "#ec4899", "#ffffff"],
  },
  {
    id: "strategic-leader",
    name: "Strategic Leadership",
    component: StrategicLeadershipTemplate,
    category: "Leadership",
    atsScore: 97,
    description:
      "Leadership-focused layout emphasizing strategic impact, P&L ownership, and executive team scaling.",
    features: ["Impact-Driven", "Two-Column Layout", "Achievement Focus"],
    colors: ["#0d7377", "#6b46c1", "#9b2c2c", "#2c5282"],
  },
  {
    id: "impact-pro",
    name: "Impact Pro",
    component: ImpactProTemplate,
    category: "Professional",
    atsScore: 98,
    badge: "TOP RATED",
    description:
      "Bold results-driven template highlighting quantifiable revenue growth and ROI metrics.",
    features: ["Metrics-First", "Bold Design", "Results-Focused"],
    colors: ["#047857", "#1e40af", "#7e22ce", "#c2410c"],
  },
  {
    id: "github-style",
    name: "GitHub Style",
    component: GitHubStyleTemplate,
    category: "Tech",
    atsScore: 92,
    description:
      "Clean GitHub-style resume optimized for open-source contributors, tech leads, and developers.",
    features: ["GitHub Format", "Developer Friendly", "Clean Layout"],
    colors: ["#000000", "#1a237e", "#ff9933", "#1b5e20"],
  },
  {
    id: "structured-photo",
    name: "Structured Photo Pro",
    component: StructuredPhotoTemplate,
    category: "Creative",
    atsScore: 90,
    description:
      "A structured, elegant template with distinctive section layouts and international standard CV typography.",
    features: ["Dual Column", "Elegant", "Modern Typography"],
    colors: ["#2f678e", "#e05c5c", "#ffffff"],
  },
];

const CATEGORIES = ["All", "Professional", "Tech", "Leadership", "Academic", "Creative", "Minimal"];

const normalizeTplId = (id) =>
  (id || "")
    .toLowerCase()
    .replace(/[-_\s]/g, "");

export default function Templates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const templateParam = searchParams.get("template");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activePreviewTemplate, setActivePreviewTemplate] = useState(null);
  const [selectedColorTheme, setSelectedColorTheme] = useState(null);
  const [templatesList, setTemplatesList] = useState(BASE_TEMPLATE_LIST);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Sync category param
  useEffect(() => {
    if (categoryParam) {
      const matched = CATEGORIES.find(
        (c) => c.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matched) setSelectedCategory(matched);
    }
  }, [categoryParam]);

  // Fetch dynamic templates & SEO from backend with safe merge
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await resumeAPI.getPublicTemplates();
        const serverTemplates = res.data?.data || [];
        if (serverTemplates.length > 0) {
          // Merge server metadata with complete client template components
          const merged = BASE_TEMPLATE_LIST.map((clientBase) => {
            const serverMatch = serverTemplates.find(
              (st) =>
                normalizeTplId(st.templateId) === normalizeTplId(clientBase.id) ||
                st.name?.toLowerCase().trim() === clientBase.name.toLowerCase().trim()
            );

            if (!serverMatch) return clientBase;

            return {
              ...clientBase,
              atsScore: serverMatch.atsScore ?? clientBase.atsScore,
              tier: serverMatch.tier || clientBase.tier || "free",
              badge: serverMatch.badge || clientBase.badge,
              description: serverMatch.description || clientBase.description,
              features: serverMatch.tags || clientBase.features,
              seo: serverMatch.seo || {},
            };
          });

          // Also include any extra unique templates from server
          serverTemplates.forEach((st) => {
            const alreadyPresent = merged.some(
              (m) =>
                normalizeTplId(m.id) === normalizeTplId(st.templateId) ||
                m.name?.toLowerCase().trim() === st.name?.toLowerCase().trim()
            );
            if (alreadyPresent) return;
            const comp =
              TEMPLATE_COMPONENTS[st.templateId] ||
              TEMPLATE_COMPONENTS[normalizeTplId(st.templateId)];
            if (comp) {
              merged.push({
                id: st.templateId,
                name: st.name,
                component: comp,
                category: st.category || "Professional",
                atsScore: st.atsScore || 95,
                tier: st.tier || "free",
                badge: st.badge || "",
                description: st.description || "",
                features: st.tags || ["ATS-Compliant"],
                colors: ["#1d4ed8", "#047857", "#1e293b"],
                seo: st.seo || {},
              });
            }
          });

          setTemplatesList(merged);

          // Handle query param for template
          if (templateParam) {
            const target = merged.find(
              (m) =>
                normalizeTplId(m.id) === normalizeTplId(templateParam)
            );
            if (target) {
              setActivePreviewTemplate(target);
            }
          }
        }
      } catch (err) {
        console.warn("Using baseline template catalog:", err.message);
      }
    };

    fetchTemplates();
  }, [templateParam]);


  const filteredTemplates =
    selectedCategory === "All"
      ? templatesList
      : templatesList.filter(
          (t) =>
            t.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  const handleOpenPreview = (template, initialColorTheme = null) => {
    setActivePreviewTemplate(template);
    const themes =
      TEMPLATE_COLOR_THEMES[template.id] ||
      TEMPLATE_COLOR_THEMES[normalizeTplId(template.id)];
    if (initialColorTheme) {
      setSelectedColorTheme(initialColorTheme);
    } else if (themes && themes.length > 0) {
      setSelectedColorTheme(themes[0].id);
    } else {
      setSelectedColorTheme(null);
    }
  };

  const handleUseTemplate = (templateId, colorTheme = null) => {
    localStorage.setItem("selectedTemplate", templateId);
    sessionStorage.setItem("templatePreSelected", templateId);
    const themeToSave = colorTheme || selectedColorTheme;
    if (themeToSave) {
      localStorage.setItem("selectedColorTheme", themeToSave);
    }
    const blankResumeData = {
      name: "",
      selectedTheme: themeToSave || undefined,
      colorTheme: themeToSave || undefined,
      contact: {
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: "",
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      achievements: [],
      customSections: [],
    };

    if (!user) {
      navigate("/register", {
        state: {
          from: {
            pathname: "/editor",
            state: {
              resumeData: blankResumeData,
              isNewResume: true,
              templateSelected: true,
              selectedTemplate: templateId,
              fromTemplates: true,
            },
          },
          message: "Create your free account to customize and download this template.",
        },
      });
      return;
    }

    navigate("/editor", {
      state: {
        resumeData: blankResumeData,
        isNewResume: true,
        templateSelected: true,
        selectedTemplate: templateId,
        fromTemplates: true,
      },
    });
  };

  // Check if a specific template is currently previewed or requested via URL
  const currentTemplate =
    activePreviewTemplate ||
    (templateParam
      ? templatesList.find(
          (m) =>
            m.id === templateParam ||
            m.id.toLowerCase() === templateParam.toLowerCase()
        )
      : null);

  // Dynamic High-CTR Meta Tags tailored for top Google Ranking
  const dynamicMetaTitle = currentTemplate
    ? currentTemplate.seo?.title ||
      `${currentTemplate.name} ATS Resume Template (${currentTemplate.atsScore || 98}% Pass Rate) | SmartNShine`
    : selectedCategory === "All"
    ? "Professional Resume Templates (98% ATS Pass Rate) | Free & Pro | SmartNShine"
    : `${selectedCategory} Resume Templates - ATS-Optimized Professional Format | SmartNShine`;

  const dynamicMetaDescription = currentTemplate
    ? currentTemplate.seo?.description ||
      `Preview and use the ${currentTemplate.name} ATS resume template. Designed for ${currentTemplate.category} roles with 1-click PDF export.`
    : selectedCategory === "All"
    ? "Build an interview-ready resume with 12+ top-rated ATS resume templates. Engineered for Taleo, Workday & Greenhouse. Instant PDF download & real-time ATS scoring."
    : `Explore top ${selectedCategory.toLowerCase()} ATS resume templates. High recruiter callback rate, clean single & two-column formats, and 1-click PDF download.`;

  const dynamicMetaImage = currentTemplate
    ? `https://www.smartnshine.in/templates/${String(currentTemplate.id || "classic").replace("-2", "2")}.webp`
    : "https://www.smartnshine.in/social-preview.png";

  const dynamicImageAlt = currentTemplate
    ? `${currentTemplate.name} ATS Resume Template Preview - SmartNShine`
    : "SmartNShine - The AI Career Platform. Resumes & Portfolios built to win.";

  const dynamicKeywords =
    "resume, professional resume, ATS resume templates, free resume templates, modern CV format, ATS resume maker, executive resume template, software engineer resume format, download resume PDF";

  // Google Rich Snippet FAQs for public page
  const pageFaqs = [
    {
      question: "Why do SmartNShine resume templates score 95+ on ATS systems?",
      answer:
        "Our resume templates use clean HTML5/CSS structured hierarchy, standard font typography, and zero unreadable nested tables, ensuring 95+ scoring and high readability across Taleo, Workday, and Greenhouse ATS scanners.",
    },
    {
      question: "Can I customize colors, fonts, and section ordering?",
      answer:
        "Yes! Every template features multiple color schemes, flexible typography scaling, and drag-and-drop section reordering with real-time live preview.",
    },
    {
      question: "Is there a free resume template available for freshers?",
      answer:
        "Yes, our Classic and Minimal Starter templates are 100% free with unlimited edits, AI assistance, and instant high-resolution PDF downloads.",
    },
    {
      question: "Which resume format is best for senior professionals and tech roles?",
      answer:
        "For Tech roles, the Developer Tech and GitHub Style templates highlight repositories and skills matrices. For leadership roles, Strategic Leadership and Impact Pro focus on quantifiable metrics and revenue achievements.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Dynamic SEO Meta Tags */}
      <SEO
        title={dynamicMetaTitle}
        description={dynamicMetaDescription}
        keywords={dynamicKeywords}
        image={dynamicMetaImage}
        imageAlt={dynamicImageAlt}
        url={
          currentTemplate
            ? `https://www.smartnshine.in/templates?template=${encodeURIComponent(currentTemplate.id)}`
            : `https://www.smartnshine.in/templates${
                selectedCategory !== "All"
                  ? `?category=${selectedCategory.toLowerCase()}`
                  : ""
              }`
        }
      />

      {/* Dynamic Schema.org JSON-LD (ItemList, FAQPage, Breadcrumbs, Product) */}
      <TemplateSchema
        templates={filteredTemplates}
        activeCategory={selectedCategory}
        activeTemplate={activePreviewTemplate}
        customFaqs={pageFaqs}
      />

      <div className="workspace-container py-6 sm:py-10 space-y-10">
        {/* Top Hero Banner with Category Filters */}
        <TemplatesBanner
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          setSelectedCategory={(cat) => {
            setSelectedCategory(cat);
            if (cat === "All") {
              searchParams.delete("category");
            } else {
              searchParams.set("category", cat.toLowerCase());
            }
            setSearchParams(searchParams);
          }}
          totalTemplates={templatesList.length}
        />

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              sampleResumeData={sampleResumeData}
              onOpenPreview={handleOpenPreview}
              onUseTemplate={handleUseTemplate}
            />
          ))}
        </div>

        {/* HIGH-VALUE SEO ON-PAGE SECTION (Search Intent Optimization) */}
        <section className="mt-16 pt-12 border-t border-gray-200 dark:border-white/10 space-y-12">
          {/* Key Advantages Grid */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-xs font-bold border border-blue-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>Engineered for 98%+ ATS Compatibility</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Why Top Recruiters Prefer SmartNShine ATS Templates
            </h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Over 75% of resumes get rejected by automated applicant tracking systems before a human ever reads them. Our templates are designed specifically to pass Taleo, Greenhouse, and Workday filters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Machine-Readable Semantic Layout
              </h3>
              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                Standard headers, single/clean multi-column grids, and zero complex graphic artifacts that corrupt resume text extractors.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Instant PDF & Color Customization
              </h3>
              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                Export vector-crisp PDF documents tailored for enterprise job boards with curated color palettes that match your industry.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-2xl border border-gray-200 dark:border-white/10 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Built-in AI Bullet Optimization
              </h3>
              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                Pair your chosen template with our GPT-4o AI engine to enhance bullet points, add action verbs, and match job descriptions.
              </p>
            </div>
          </div>

          {/* Interactive FAQ Section (Matches FAQPage Schema) */}
          <div className="max-w-3xl mx-auto space-y-6 pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Frequently Asked Questions About Resume Templates
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Everything you need to know about ATS compliance, formatting, and downloads
              </p>
            </div>

            <div className="space-y-3">
              {pageFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-blue-600 dark:text-cyan-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-gray-600 dark:text-zinc-300 leading-relaxed border-t border-gray-100 dark:border-white/5 animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Fullscreen Interactive Preview Modal */}
      <TemplatePreviewModal
        template={activePreviewTemplate}
        sampleResumeData={sampleResumeData}
        selectedColorTheme={selectedColorTheme}
        setSelectedColorTheme={setSelectedColorTheme}
        colorThemes={
          activePreviewTemplate
            ? TEMPLATE_COLOR_THEMES[activePreviewTemplate.id] || []
            : []
        }
        onClose={() => setActivePreviewTemplate(null)}
        onApply={handleUseTemplate}
      />
    </div>
  );
}

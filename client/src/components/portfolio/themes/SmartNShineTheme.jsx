import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDown,
  Sun,
  Moon,
  Menu,
  X,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  ChevronUp,
  Check,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import "@/styles/smartnshine-theme.css";
import { resolveImageUrl } from "@/utils/imageUrlResolver";

/* Social Icon Resolver */
const resolveSocialIcon = (type = "", name = "") => {
  const query = `${type} ${name}`.toLowerCase();
  if (query.includes("git")) return Github;
  if (query.includes("link")) return Linkedin;
  if (query.includes("twit") || query.includes(" x")) return Twitter;
  if (query.includes("mail")) return Mail;
  return ExternalLink;
};

export default function SmartNShineTheme({
  data = {},
  isDarkMode: propDarkMode,
  toggleDarkMode: propToggleDarkMode,
  accentColor: propAccentColor,
}) {
  const [localDarkMode, setLocalDarkMode] = useState(false);
  const isDark = propDarkMode !== undefined ? propDarkMode : localDarkMode;
  const toggleDark =
    propToggleDarkMode || (() => setLocalDarkMode((prev) => !prev));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // 1. Data Destructuring
  const {
    profile = {},
    sections = {},
    skills: rawSkills = [],
    projects: rawProjects = [],
    experience: rawExperience = [],
    education: rawEducation = [],
    certifications: rawCertifications = [],
    achievements: rawAchievements = [],
    customSections: rawCustomSections = [],
    links: rawLinks = [],
    actions = {},
    themeAccent,
  } = data || {};

  // 2. Profile Resolution (Pure User Data)
  const name = profile?.name || "Portfolio";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SN";

  const rawTitle = profile?.title || profile?.professionalTitle || profile?.role || "";
  const rawTagline = profile?.tagline || "";
  const role = rawTitle || (rawTagline.length <= 50 ? rawTagline : "");
  const bio = profile?.about || profile?.bio || profile?.summary || (rawTagline.length > 50 ? rawTagline : "");
  const location = profile?.location || data?.contact?.location || "";
  const email = profile?.email || data?.contact?.email || "";
  const phone = profile?.phone || profile?.mobile || profile?.contactNumber || profile?.phoneNumber || data?.contact?.phone || "";
  const profileImage = resolveImageUrl(profile?.profileImage || profile?.heroImage || "");
  const resumeUrl = actions?.resumeDownloadUrl || profile?.resumeUrl || "";
  const availabilityStatus = profile?.availabilityStatus || (profile?.isAvailable ? "Available for opportunities" : "");
  
  // Punchy editorial headline (never a long multi-sentence summary)
  const headline = (() => {
    if (profile?.headline) return profile.headline;
    if (profile?.heroHeadline) return profile.heroHeadline;
    if (rawTagline && rawTagline.length <= 55 && !rawTagline.includes(".")) {
      return rawTagline;
    }
    return "I build digital products that make complex things feel simple.";
  })();
  
  const editorialQuote = profile?.quote || profile?.editorialQuote || "";
  const currentYear = new Date().getFullYear();

  // 3. Projects Normalization
  const projectsList = useMemo(() => {
    if (Array.isArray(rawProjects) && rawProjects.length > 0) {
      return rawProjects.map((p, idx) => ({
        id: p.id || p._id || `proj-${idx}`,
        number: idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`,
        category: p.category || (p.featured ? "FEATURED / PRODUCT" : "PROJECT"),
        title: p.title || p.name || "Untitled Project",
        description:
          p.shortDescription ||
          p.description ||
          p.longDescription ||
          "",
        longDescription: p.longDescription || "",
        problem: p.problem || "",
        approach: p.solution || p.approach || "",
        result: p.impact || p.result || "",
        year: p.year || (p.duration ? p.duration.split("-")[0].trim() : ""),
        technologies: Array.isArray(p.technologies)
          ? p.technologies
          : typeof p.technologies === "string"
          ? p.technologies.split(",").map((s) => s.trim())
          : [],
        liveUrl: p.links?.live || p.liveUrl || p.projectUrl || p.demoUrl || "",
        githubUrl: p.links?.github || p.githubUrl || p.repoUrl || "",
        caseStudyUrl: p.links?.caseStudy || p.caseStudyUrl || "",
        image: resolveImageUrl(p.images?.[0]?.url || p.image || p.thumbnail || ""),
        featured: Boolean(p.featured) || idx === 0,
        role: p.role || "",
      }));
    }
    return [];
  }, [rawProjects]);

  // Featured Project (First project or designated featured)
  const featuredProject = useMemo(() => {
    return projectsList.find((p) => p.featured) || projectsList[0] || null;
  }, [projectsList]);

  // Standard Projects List
  const standardProjectsList = useMemo(() => {
    return projectsList;
  }, [projectsList]);

  // 4. Experience Normalization
  const experienceList = useMemo(() => {
    if (Array.isArray(rawExperience) && rawExperience.length > 0) {
      return rawExperience.map((exp, idx) => {
        const rawBullets =
          Array.isArray(exp.contributions) && exp.contributions.length > 0
            ? exp.contributions
            : Array.isArray(exp.bullets) && exp.bullets.length > 0
            ? exp.bullets
            : Array.isArray(exp.highlights) && exp.highlights.length > 0
            ? exp.highlights
            : Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0
            ? exp.responsibilities
            : typeof exp.description === "string" && (exp.description.includes("\n") || exp.description.includes("•"))
            ? exp.description.split(/[\n•]/).map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean)
            : [];

        const desc =
          typeof exp.description === "string" && !exp.description.includes("\n") && !exp.description.includes("•")
            ? exp.description
            : exp.summary || (rawBullets.length === 0 && typeof exp.description === "string" ? exp.description : "");

        return {
          id: idx,
          year:
            exp.dateRange ||
            `${exp.startDate || ""} ${exp.startDate && (exp.endDate || exp.current) ? "—" : ""} ${exp.current ? "Present" : exp.endDate || ""}`.trim() ||
            exp.year ||
            "",
          role: exp.role || exp.title || exp.position || "Senior Software Engineer",
          company: exp.company || exp.organization || "",
          location: exp.location || "",
          description: desc,
          contributions: rawBullets,
        };
      });
    }
    // Fallback sample experience if none provided (e.g. template preview)
    return (experienceTimeline || []).map((item, idx) => ({
      id: idx,
      year: item.year || "",
      role: item.role || "",
      company: item.company || "",
      location: item.location || "",
      description: item.description || "",
      contributions: item.contributions || [],
    }));
  }, [rawExperience]);

  // 5. Education Normalization
  const educationList = useMemo(() => {
    if (Array.isArray(rawEducation) && rawEducation.length > 0) {
      return rawEducation.map((edu, idx) => ({
        id: idx,
        degree: edu.degree || edu.fieldOfStudy || edu.major || "",
        institution: edu.institution || edu.school || edu.university || "",
        gpa: edu.gpa || edu.cgpa || edu.grade || edu.percentage || edu.score || "",
        location: edu.location || "",
        year: edu.dateRange || `${edu.startDate || ""} ${edu.startDate && edu.endDate ? "—" : ""} ${edu.endDate || ""}`.trim() || edu.year || "",
      }));
    }
    if (personalInfo.education) {
      return [{
        id: 0,
        degree: personalInfo.education.degree || "B.S. in Computer Science",
        institution: personalInfo.education.institution || "Institute of Technology",
        gpa: personalInfo.education.gpa || personalInfo.education.cgpa || "3.9 / 4.0",
        location: personalInfo.location || "San Francisco, CA",
        year: personalInfo.education.year || "2020 — 2024",
      }];
    }
    return [];
  }, [rawEducation]);

  // 6. Skills Categorization into Swiss Index
  const categorizedSkills = useMemo(() => {
    if (Array.isArray(rawSkills) && rawSkills.length > 0) {
      // If structured with categories already
      if (typeof rawSkills[0] === "object" && rawSkills[0].category) {
        return rawSkills.map((c) => ({
          category: (c.category || "SKILLS").toUpperCase(),
          items: (c.skills || c.items || []).map((s) =>
            typeof s === "string" ? s : s.name
          ).filter(Boolean),
        })).filter((c) => c.items.length > 0);
      }

      // Flat list categorization
      const flat = rawSkills
        .map((s) => (typeof s === "string" ? s : s.name || ""))
        .filter(Boolean);

      if (flat.length === 0) return [];

      const devKeywords = ["react", "next", "vue", "angular", "typescript", "javascript", "node", "python", "go", "graphql", "api", "tailwind", "html", "css", "sql", "postgres", "mongodb", "rust", "c++", "java", "php", "backend", "frontend", "full stack"];
      const designKeywords = ["figma", "ui", "ux", "design", "wireframing", "prototyping", "systems", "typography", "animation", "photoshop", "illustrator"];
      const aiKeywords = ["ai", "llm", "llms", "gpt", "rag", "agents", "langchain", "prompt", "automation", "openai", "claude", "machine learning", "nlp", "tensorflow", "pytorch"];

      const devItems = [];
      const designItems = [];
      const aiItems = [];
      const toolItems = [];

      flat.forEach((skill) => {
        const lower = skill.toLowerCase();
        if (aiKeywords.some((k) => lower.includes(k))) {
          aiItems.push(skill);
        } else if (designKeywords.some((k) => lower.includes(k))) {
          designItems.push(skill);
        } else if (devKeywords.some((k) => lower.includes(k))) {
          devItems.push(skill);
        } else {
          toolItems.push(skill);
        }
      });

      const categories = [];
      if (devItems.length > 0) categories.push({ category: "DEVELOPMENT", items: devItems });
      if (designItems.length > 0) categories.push({ category: "DESIGN", items: designItems });
      if (aiItems.length > 0) categories.push({ category: "AI & INTELLIGENCE", items: aiItems });
      if (toolItems.length > 0) categories.push({ category: "TOOLS & INFRASTRUCTURE", items: toolItems });

      if (categories.length === 0) {
        categories.push({ category: "CORE EXPERTISE", items: flat });
      }
      return categories;
    }

    return [];
  }, [rawSkills]);

  // 7. Achievements Normalization
  const achievementsList = useMemo(() => {
    if (Array.isArray(rawAchievements) && rawAchievements.length > 0) {
      return rawAchievements
        .map((a) => (typeof a === "string" ? a : a.title || a.name || a.description || ""))
        .filter(Boolean);
    }
    return [];
  }, [rawAchievements]);



  // 8. Social Links
  const socialLinksList = useMemo(() => {
    if (Array.isArray(rawLinks) && rawLinks.length > 0) {
      return rawLinks.filter((l) => l.url && l.url !== "#").map((l) => ({
        name: l.label || l.type || "Link",
        url: l.url,
        type: l.type || "",
      }));
    }
    if (Array.isArray(profile?.socialLinks) && profile.socialLinks.length > 0) {
      return profile.socialLinks.filter((l) => l.url && l.url !== "#").map((l) => ({
        name: l.name || l.label || l.type || "Link",
        url: l.url,
        type: l.type || "",
      }));
    }
    return [];
  }, [rawLinks, profile]);

  // Section Visibility Flags
  const showAbout = sections?.showAbout !== false && (Boolean(bio) || educationList.length > 0 || Boolean(role) || Boolean(location));
  const showProjects = sections?.showProjects !== false && projectsList.length > 0;
  const showSkills = sections?.showSkills !== false && categorizedSkills.length > 0;
  const showExperience = sections?.showExperience !== false && experienceList.length > 0;
  const showContact = sections?.showContact !== false;
  const showCertifications = sections?.showCertifications !== false && Array.isArray(rawCertifications) && rawCertifications.length > 0;
  const showCustomSections = sections?.showCustomSections !== false && Array.isArray(rawCustomSections) && rawCustomSections.length > 0;

  // Active Accent Color
  const activeAccent = propAccentColor || themeAccent || "#b8943f";

  // Scroll listener for compact header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse move listener for floating project preview
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Smooth scroll helper
  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (id === "contact") {
      if (email) {
        window.location.href = `mailto:${email}`;
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
  };

  // Contact click handler
  const handleContactClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (actions?.onContactClick) {
      actions.onContactClick();
    }
    scrollTo("contact");
  };

  // Copy helpers
  const handleCopyEmail = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleCopyPhone = () => {
    if (phone) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      toast.success("Phone number copied to clipboard");
      setTimeout(() => setCopiedPhone(false), 2500);
    }
  };

  // Open project modal
  const handleOpenProject = (project, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setSelectedProject(project);
    if (actions?.onProjectClick) {
      actions.onProjectClick(project);
    }
  };

  return (
    <div
      className={`smartnshine-theme ${isDark ? "dark-mode" : ""}`}
      style={{ "--sns-gold": activeAccent }}
    >
      {/* ─── 5. HEADER (Minimal Editorial Navigation) ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-3.5 bg-[var(--sns-bg)]/90 backdrop-blur-md border-b border-[var(--sns-border)]"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="sns-container flex items-center justify-between">
          {/* Left: Name / Monogram */}
          <button
            onClick={() => scrollTo("hero")}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <span className="sns-serif text-xl sm:text-2xl font-normal tracking-tight text-[var(--sns-text-primary)]">
              {initials[0]}
              <span className="text-[var(--sns-gold)] mx-0.5">·</span>
              {initials[1] || initials[0]}
            </span>
            <span className="text-xs font-mono tracking-widest uppercase text-[var(--sns-text-secondary)] opacity-75 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
              {name}
            </span>
          </button>

          {/* Center: Clean Minimal Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest uppercase text-[var(--sns-text-secondary)]">
            {showProjects && (
              <button
                onClick={() => scrollTo("work")}
                className="sns-underline-anim hover:text-[var(--sns-text-primary)] transition-colors py-1 cursor-pointer"
              >
                Work
              </button>
            )}
            {showExperience && (
              <button
                onClick={() => scrollTo("experience")}
                className="sns-underline-anim hover:text-[var(--sns-text-primary)] transition-colors py-1 cursor-pointer"
              >
                Experience
              </button>
            )}
            {showSkills && (
              <button
                onClick={() => scrollTo("skills")}
                className="sns-underline-anim hover:text-[var(--sns-text-primary)] transition-colors py-1 cursor-pointer"
              >
                Skills
              </button>
            )}
            {showContact && (
              <button
                onClick={handleContactClick}
                className="sns-underline-anim hover:text-[var(--sns-text-primary)] transition-colors py-1 cursor-pointer"
              >
                Contact
              </button>
            )}
          </nav>

          {/* Far Right: Theme Toggle + Let's Talk CTA */}
          <div className="flex items-center gap-3.5">
            {/* Minimal Theme Toggle: ☼ / ◐ */}
            <button
              onClick={toggleDark}
              aria-label="Toggle light/dark theme"
              className="sns-theme-toggle"
              title={isDark ? "Switch to Warm Ivory Light Mode" : "Switch to Deep Graphite Dark Mode"}
            >
              {isDark ? (
                <span className="text-amber-300">☼</span>
              ) : (
                <span className="text-[var(--sns-text-secondary)]">◐</span>
              )}
            </button>

            {/* Let's Talk CTA */}
            {showContact && (
              <button
                type="button"
                onClick={handleContactClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-xs border border-[var(--sns-border)] hover:border-[var(--sns-gold)] text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] transition-all duration-300 cursor-pointer"
              >
                Let's talk
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--sns-gold)]" />
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--sns-text-primary)] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[var(--sns-border)] bg-[var(--sns-bg)] px-6 py-8 flex flex-col gap-6"
            >
              {showProjects && (
                <button
                  onClick={() => scrollTo("work")}
                  className="sns-serif text-2xl text-left text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)]"
                >
                  Work
                </button>
              )}
              {showExperience && (
                <button
                  onClick={() => scrollTo("experience")}
                  className="sns-serif text-2xl text-left text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)]"
                >
                  Experience
                </button>
              )}
              {showSkills && (
                <button
                  onClick={() => scrollTo("skills")}
                  className="sns-serif text-2xl text-left text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)]"
                >
                  Skills
                </button>
              )}
              {showContact && (
                <button
                  onClick={handleContactClick}
                  className="sns-serif text-2xl text-left text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)]"
                >
                  Contact
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ─── 6. HERO SECTION ─── */}
        <section
          id="hero"
          className="relative min-h-[85vh] sm:min-h-[88vh] flex flex-col justify-center pt-28 sm:pt-32 pb-12 sm:pb-16 overflow-hidden"
        >
          <div className="sns-container w-full">
            {/* Top Row: Small Metadata & Live Availability Status */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-between gap-4 mb-8 sm:mb-10 pb-4 border-b border-[var(--sns-border)]"
            >
              <div className="flex items-center gap-3">
                <span className="sns-meta text-[var(--sns-gold)]">PORTFOLIO / {currentYear}</span>
                <span className="w-6 h-[1px] bg-[var(--sns-border-gold)]" />
                <span className="sns-meta text-[var(--sns-text-muted)]">SN — 026</span>
                {role && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--sns-border-gold)] hidden sm:inline-block" />
                    <span className="sns-meta text-[var(--sns-text-secondary)] hidden sm:inline-block">
                      {role}
                    </span>
                  </>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--sns-text-secondary)]">
                  {availabilityStatus || "Available for Opportunities"}
                </span>
              </div>
            </motion.div>

            {/* Main Hero Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-12">
              {/* Left Column: Name, Large Headline, Bio, Quick Actions & Stack */}
              <div className="lg:col-span-8 space-y-6 sm:space-y-7">
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs sm:text-sm font-mono tracking-widest uppercase text-[var(--sns-gold)] font-medium">
                      {name}
                    </span>
                    {location && (
                      <>
                        <span className="text-[var(--sns-text-muted)] text-xs font-mono">•</span>
                        <span className="text-xs font-mono tracking-wider text-[var(--sns-text-muted)]">
                          {location}
                        </span>
                      </>
                    )}
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className={`sns-headline ${
                      headline.length > 50
                        ? "text-3xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-[1.1]"
                        : "text-4xl sm:text-6xl md:text-6xl lg:text-[4.5rem] xl:text-[5rem] leading-[1.04]"
                    } text-[var(--sns-text-primary)] max-w-3xl tracking-tight`}
                  >
                    {headline}
                  </motion.h1>
                </div>

                {/* Refined Short Bio / Editorial Lead */}
                {bio && (
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-sm sm:text-base md:text-lg font-light text-[var(--sns-text-secondary)] max-w-2xl leading-relaxed"
                  >
                    {bio}
                  </motion.p>
                )}

                {/* Quick Interactive Actions & Socials */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1"
                >
                  {showProjects && (
                    <button
                      onClick={() => scrollTo("work")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono tracking-widest uppercase bg-[var(--sns-text-primary)] text-[var(--sns-bg)] hover:bg-[var(--sns-gold)] hover:text-black transition-all duration-300 rounded-xs shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>Explore Work</span>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {resumeUrl && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-widest uppercase border border-[var(--sns-border)] hover:border-[var(--sns-gold)] text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] transition-all duration-300 rounded-xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </a>
                  )}

                  {showContact && (
                    <button
                      onClick={handleContactClick}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-widest uppercase border border-[var(--sns-border)] hover:border-[var(--sns-gold)] text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] transition-all duration-300 rounded-xs cursor-pointer active:scale-95"
                    >
                      <span>Get In Touch</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Social Links Row */}
                  {socialLinksList.length > 0 && (
                    <div className="flex items-center gap-2 pl-2 border-l border-[var(--sns-border)]">
                      {socialLinksList.slice(0, 4).map((link, idx) => {
                        const Icon = resolveSocialIcon(link.type, link.name);
                        return (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[var(--sns-text-muted)] hover:text-[var(--sns-gold)] transition-colors"
                            aria-label={link.name}
                            title={link.name}
                          >
                            <Icon className="w-4 h-4" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* Core Stack Tags */}
                {rawSkills && rawSkills.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-wrap items-center gap-2 pt-1"
                  >
                    <span className="sns-meta text-[10px] text-[var(--sns-text-muted)] mr-1">
                      CORE STACK —
                    </span>
                    {(Array.isArray(rawSkills) ? rawSkills : [])
                      .slice(0, 6)
                      .map((skill, sIdx) => {
                        const sName = typeof skill === "string" ? skill : skill?.name || "";
                        if (!sName) return null;
                        return (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 text-[11px] font-mono text-[var(--sns-text-secondary)] border border-[var(--sns-border)] bg-[var(--sns-bg-surface)]/60 rounded-xs"
                          >
                            {sName}
                          </span>
                        );
                      })}
                  </motion.div>
                )}
              </div>

              {/* Right Column: 7. HERO IMAGE (Clean Natural Color Portrait or Monogram Fallback) */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="w-full max-w-[320px] sm:max-w-[340px] relative"
                >
                  {profileImage ? (
                    <div className="sns-hero-portrait relative aspect-[4/5] border border-[var(--sns-border)] bg-[var(--sns-bg-surface)] shadow-2xl shadow-black/20 rounded-xs overflow-hidden">
                      <img
                        src={profileImage}
                        alt={name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  ) : (
                    /* Minimal Typography-First Editorial Fallback */
                    <div className="aspect-[4/5] rounded-xs border border-[var(--sns-border-gold)] bg-[var(--sns-bg-surface)] p-6 flex flex-col justify-between shadow-2xl shadow-black/20">
                      <div className="flex items-center justify-between">
                        <span className="sns-meta text-[var(--sns-gold)]">SMARTNSHINE / MINIMAL</span>
                        <span className="sns-serif text-sm text-[var(--sns-gold)]">✦</span>
                      </div>
                      <div className="text-center my-auto space-y-2">
                        <span className="sns-serif text-6xl sm:text-7xl text-[var(--sns-text-primary)] block font-light">
                          {initials}
                        </span>
                        {role && (
                          <span className="text-xs font-mono uppercase tracking-widest text-[var(--sns-text-muted)] block">
                            {role}
                          </span>
                        )}
                      </div>
                      <div className="pt-3 border-t border-[var(--sns-border)] flex items-center justify-between text-[10px] font-mono text-[var(--sns-text-muted)]">
                        <span>EDITION / {currentYear}</span>
                        {location && <span>{location.split(",")[0]}</span>}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Bottom Metadata Row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 pt-6 border-t border-[var(--sns-border)] items-center"
            >
              {location && (
                <div className="lg:col-span-4">
                  <span className="sns-meta block text-[10px] text-[var(--sns-text-muted)] mb-1">
                    BASED IN —
                  </span>
                  <span className="text-xs font-medium text-[var(--sns-text-primary)]">
                    {location}
                  </span>
                </div>
              )}

              {role && (
                <div className={location ? "lg:col-span-5" : "lg:col-span-9"}>
                  <span className="sns-meta block text-[10px] text-[var(--sns-text-muted)] mb-1">
                    FOCUS —
                  </span>
                  <span className="text-xs font-medium text-[var(--sns-text-primary)]">
                    {role}
                  </span>
                </div>
              )}

              <div className={`${!location && !role ? "lg:col-span-12" : "lg:col-span-3"} flex justify-start sm:justify-end ml-auto`}>
                <button
                  onClick={() => scrollTo(showProjects ? "work" : showExperience ? "experience" : showSkills ? "skills" : "contact")}
                  className="sns-meta text-[var(--sns-text-muted)] hover:text-[var(--sns-gold)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>SCROLL TO EXPLORE</span>
                  <ArrowDown className="w-3 h-3 text-[var(--sns-gold)]" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 10. FEATURED PROJECT (Special Spotlight Treatment) ─── */}
        {showProjects && featuredProject && (
          <section className="sns-section-pad-sm border-t border-[var(--sns-border)] bg-[var(--sns-bg-subtle)]">
            <div className="sns-container">
              <div className="mb-8">
                <span className="sns-meta text-[var(--sns-gold)]">FEATURED PROJECT / 01</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Large Project Image Showcase */}
                <div
                  onClick={(e) => handleOpenProject(featuredProject, e)}
                  className="lg:col-span-7 cursor-pointer"
                >
                  <div className="sns-featured-frame aspect-[16/10] rounded-xs">
                    {featuredProject.image ? (
                      <img
                        src={featuredProject.image}
                        alt={featuredProject.title}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[var(--sns-bg-surface-elevated)] to-[var(--sns-bg-surface)]">
                        <span className="sns-serif text-5xl sm:text-7xl text-[var(--sns-gold)] opacity-60 mb-2">
                          {featuredProject.title.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="sns-meta text-[var(--sns-text-muted)]">
                          {featuredProject.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editorial Metadata & Description */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <span className="sns-meta text-[var(--sns-text-muted)] block mb-1">
                      {featuredProject.category} {featuredProject.year ? `· ${featuredProject.year}` : ""}
                    </span>
                    <h2
                      onClick={(e) => handleOpenProject(featuredProject, e)}
                      className="sns-subheading text-3xl sm:text-4xl text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] transition-colors cursor-pointer"
                    >
                      {featuredProject.title}
                    </h2>
                  </div>

                  {featuredProject.description && (
                    <p className="text-sm sm:text-base text-[var(--sns-text-secondary)] font-light leading-relaxed">
                      {featuredProject.description}
                    </p>
                  )}

                  {/* Metadata Matrix: STACK & YEAR */}
                  {(featuredProject.technologies.length > 0 || featuredProject.year || featuredProject.role) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-[var(--sns-border)]">
                      {featuredProject.role && (
                        <div>
                          <span className="sns-meta block text-[9px] text-[var(--sns-text-muted)] mb-0.5">
                            ROLE
                          </span>
                          <span className="text-xs font-medium text-[var(--sns-text-primary)]">
                            {featuredProject.role}
                          </span>
                        </div>
                      )}
                      {featuredProject.technologies.length > 0 && (
                        <div className={featuredProject.role ? "" : "col-span-2"}>
                          <span className="sns-meta block text-[9px] text-[var(--sns-text-muted)] mb-0.5">
                            STACK
                          </span>
                          <span className="text-xs font-medium text-[var(--sns-text-primary)] truncate block">
                            {featuredProject.technologies.slice(0, 3).join(", ")}
                          </span>
                        </div>
                      )}
                      {featuredProject.year && (
                        <div>
                          <span className="sns-meta block text-[9px] text-[var(--sns-text-muted)] mb-0.5">
                            YEAR
                          </span>
                          <span className="text-xs font-medium text-[var(--sns-text-primary)]">
                            {featuredProject.year}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="pt-2 flex items-center gap-6">
                    <button
                      onClick={(e) => handleOpenProject(featuredProject, e)}
                      className="sns-meta text-xs font-semibold text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] inline-flex items-center gap-1.5 sns-underline-anim py-1 cursor-pointer"
                    >
                      VIEW CASE STUDY
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--sns-gold)]" />
                    </button>

                    {featuredProject.liveUrl && (
                      <a
                        href={featuredProject.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sns-meta text-xs text-[var(--sns-text-muted)] hover:text-[var(--sns-text-primary)] inline-flex items-center gap-1 transition-colors"
                      >
                        Live Demo
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── 8. SELECTED WORK (Editorial Project List & 9. Project Hover) ─── */}
        {showProjects && (
          <section id="work" className="sns-section-pad border-t border-[var(--sns-border)]">
            <div className="sns-container">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 pb-6 border-b border-[var(--sns-border)]">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-2">CATALOGUE</span>
                  <h2 className="sns-subheading text-4xl sm:text-5xl md:text-6xl text-[var(--sns-text-primary)]">
                    Selected Work
                  </h2>
                </div>
                <span className="sns-meta text-[var(--sns-text-muted)] mt-4 sm:mt-0">
                  {projectsList.length} {projectsList.length === 1 ? "PROJECT" : "PROJECTS"} / {currentYear} ARCHIVE
                </span>
              </div>

              {/* Editorial Project List */}
              <div className="border-t border-[var(--sns-border)]">
                {standardProjectsList.map((project, idx) => (
                  <div
                    key={project.id || idx}
                    onMouseEnter={() => setHoveredProject(project)}
                    onMouseLeave={() => setHoveredProject(null)}
                    onClick={(e) => handleOpenProject(project, e)}
                    className="sns-project-row py-8 sm:py-10 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center cursor-pointer"
                  >
                    {/* 01 Number */}
                    <div className="md:col-span-1">
                      <span className="sns-mono text-xs font-semibold text-[var(--sns-gold)]">
                        {project.number}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="md:col-span-5 space-y-1">
                      <h3 className="sns-row-title sns-serif text-2xl sm:text-3xl text-[var(--sns-text-primary)]">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-xs sm:text-sm text-[var(--sns-text-secondary)] font-light leading-relaxed line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Category Tags */}
                    <div className="md:col-span-3">
                      <span className="sns-meta text-[10px] text-[var(--sns-text-muted)]">
                        {project.category}
                      </span>
                    </div>

                    {/* Year */}
                    <div className="md:col-span-1">
                      {project.year && (
                        <span className="sns-meta text-[11px] text-[var(--sns-text-muted)]">
                          {project.year}
                        </span>
                      )}
                    </div>

                    {/* CTA Arrow */}
                    <div className="md:col-span-2 flex items-center md:justify-end gap-2 text-xs font-mono tracking-wider uppercase text-[var(--sns-text-secondary)]">
                      <span className="sns-row-arrow inline-flex items-center gap-1 text-[var(--sns-text-primary)]">
                        VIEW PROJECT
                        <ArrowUpRight className="w-3.5 h-3.5 text-[var(--sns-gold)]" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 9. FLOATING IMAGE PREVIEW (On Desktop Project Hover) ─── */}
        <AnimatePresence>
          {hoveredProject && hoveredProject.image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                top: mousePos.y + 20,
                left: mousePos.x + 20,
              }}
              className="sns-floating-preview hidden lg:block"
            >
              <img
                src={hoveredProject.image}
                alt={hoveredProject.title}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 14. HONORS & RECOGNITIONS (Rendered Only If User Has Real Achievements) ─── */}
        {achievementsList.length > 0 && (
          <section className="sns-section-pad-sm border-t border-[var(--sns-border)] bg-[var(--sns-bg)]">
            <div className="sns-container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[var(--sns-border)]">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-1">DISTINCTIONS</span>
                  <h2 className="sns-subheading text-3xl sm:text-4xl text-[var(--sns-text-primary)]">
                    Honors &amp; Recognitions
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementsList.map((ach, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-6 rounded-xs border border-[var(--sns-border)] bg-[var(--sns-bg-subtle)] space-y-2"
                  >
                    <span className="sns-mono text-[10px] text-[var(--sns-gold)] font-bold block">
                      HONOR 0{aIdx + 1}
                    </span>
                    <p className="sns-serif text-xl text-[var(--sns-text-primary)]">
                      {ach}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}



        {/* ─── 15. CASE STUDY PREVIEW (Storytelling - Rendered Only If Real Problem/Approach/Result Exists) ─── */}
        {showProjects && featuredProject && (featuredProject.problem || featuredProject.approach || featuredProject.result) && (
          <section className="sns-section-pad border-t border-[var(--sns-border)] bg-[var(--sns-bg)]">
            <div className="sns-container">
              <div className="max-w-3xl mb-14">
                <span className="sns-meta text-[var(--sns-gold)] block mb-2">CASE STUDY METHODOLOGY</span>
                <h2 className="sns-subheading text-3xl sm:text-4xl md:text-5xl text-[var(--sns-text-primary)]">
                  Deconstructing the Craft
                </h2>
                <p className="text-xs font-mono text-[var(--sns-text-muted)] mt-2">
                  CASE / {featuredProject.title.toUpperCase()}
                </p>
              </div>

              {/* 3-Part Editorial Breakdown with Thin Dividers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 pt-8 border-t border-[var(--sns-border)]">
                {featuredProject.problem && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--sns-border-gold)]">
                      <span className="sns-mono text-xs text-[var(--sns-gold)]">01</span>
                      <span className="sns-meta text-xs text-[var(--sns-text-primary)]">THE PROBLEM</span>
                    </div>
                    <p className="text-sm text-[var(--sns-text-secondary)] font-light leading-relaxed">
                      {featuredProject.problem}
                    </p>
                  </div>
                )}

                {featuredProject.approach && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--sns-border-gold)]">
                      <span className="sns-mono text-xs text-[var(--sns-gold)]">02</span>
                      <span className="sns-meta text-xs text-[var(--sns-text-primary)]">THE APPROACH</span>
                    </div>
                    <p className="text-sm text-[var(--sns-text-secondary)] font-light leading-relaxed">
                      {featuredProject.approach}
                    </p>
                  </div>
                )}

                {featuredProject.result && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--sns-border-gold)]">
                      <span className="sns-mono text-xs text-[var(--sns-gold)]">03</span>
                      <span className="sns-meta text-xs text-[var(--sns-text-primary)]">THE RESULT</span>
                    </div>
                    <p className="text-sm text-[var(--sns-text-secondary)] font-light leading-relaxed">
                      {featuredProject.result}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── 12. EXPERIENCE (Minimalist Career Timeline) ─── */}
        {showExperience && (
          <section id="experience" className="sns-section-pad border-t border-[var(--sns-border)] bg-[var(--sns-bg-subtle)]">
            <div className="sns-container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 pb-6 border-b border-[var(--sns-border)]">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-2">CAREER TRAJECTORY</span>
                  <h2 className="sns-subheading text-4xl sm:text-5xl md:text-6xl text-[var(--sns-text-primary)]">
                    Experience
                  </h2>
                </div>
                <span className="sns-meta text-[var(--sns-text-muted)] mt-4 sm:mt-0">
                  {experienceList.length} {experienceList.length === 1 ? "CHAPTER" : "CHAPTERS"}
                </span>
              </div>

              {/* Timeline Entries with Thin Horizontal Rules */}
              <div className="divide-y divide-[var(--sns-border)] border-t border-[var(--sns-border)]">
                {experienceList.map((item) => (
                  <div
                    key={item.id}
                    className="py-10 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start group"
                  >
                    <div className="md:col-span-3">
                      {item.year && (
                        <span className="sns-mono text-xs font-semibold text-[var(--sns-gold)]">
                          {item.year}
                        </span>
                      )}
                      {item.location && (
                        <span className="block text-xs text-[var(--sns-text-muted)] font-light mt-1">
                          {item.location}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <h3 className="sns-serif text-2xl sm:text-3xl text-[var(--sns-text-primary)] group-hover:text-[var(--sns-gold)] transition-colors">
                        {item.role}
                      </h3>
                      {item.company && (
                        <p className="sns-meta text-xs text-[var(--sns-text-secondary)]">
                          {item.company}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-5 space-y-3">
                      {item.description && (
                        <p className="text-sm text-[var(--sns-text-secondary)] font-light leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.contributions.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {item.contributions.map((c, cIdx) => (
                            <li
                              key={cIdx}
                              className="text-xs text-[var(--sns-text-muted)] flex items-start gap-2 font-light"
                            >
                              <span className="text-[var(--sns-gold)]">―</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 13. SKILLS (Categorized Swiss Index) ─── */}
        {showSkills && (
          <section id="skills" className="sns-section-pad border-t border-[var(--sns-border)] bg-[var(--sns-bg)]">
            <div className="sns-container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 pb-6 border-b border-[var(--sns-border)]">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-2">INDEX</span>
                  <h2 className="sns-subheading text-4xl sm:text-5xl md:text-6xl text-[var(--sns-text-primary)]">
                    Skills & Disciplines
                  </h2>
                </div>
                <span className="sns-meta text-[var(--sns-text-muted)] mt-4 sm:mt-0">
                  TECHNICAL CRAFT
                </span>
              </div>

              {/* Categorized Columns with Thin Dividers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {categorizedSkills.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4 p-5 rounded-2xl bg-[var(--sns-bg-subtle)] border border-[var(--sns-border)]">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--sns-border-gold)]">
                      <span className="sns-meta text-xs text-[var(--sns-gold)] font-semibold">
                        {group.category}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--sns-text-muted)]">
                        {group.items?.length || 0} SKILLS
                      </span>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                      {group.items.map((skill, sIdx) => (
                        <li
                          key={sIdx}
                          className="sns-serif text-sm sm:text-base text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] hover:translate-x-0.5 transition-all duration-200 cursor-default flex items-center justify-between border-b border-[var(--sns-border)] pb-1.5 gap-1"
                        >
                          <span className="truncate">{skill}</span>
                          <span className="text-[9px] font-mono text-[var(--sns-text-muted)] opacity-50 shrink-0">
                            {sIdx + 1 < 10 ? `0${sIdx + 1}` : `${sIdx + 1}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 14. ACADEMIC QUALIFICATIONS / EDUCATION ─── */}
        {educationList.length > 0 && (
          <section id="education" className="sns-section-pad-sm border-t border-[var(--sns-border)] bg-[var(--sns-bg)]">
            <div className="sns-container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-6 border-b border-[var(--sns-border)]">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-1">ACADEMIC BACKGROUND</span>
                  <h2 className="sns-subheading text-3xl sm:text-4xl text-[var(--sns-text-primary)]">
                    Education &amp; Qualifications
                  </h2>
                </div>
                <span className="sns-meta text-[var(--sns-text-muted)] mt-4 sm:mt-0">
                  {educationList.length} {educationList.length === 1 ? "DEGREE" : "DEGREES"}
                </span>
              </div>

              <div className="divide-y divide-[var(--sns-border)] border-t border-[var(--sns-border)]">
                {educationList.map((edu, idx) => (
                  <div key={idx} className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-3">
                      <span className="sns-mono text-xs text-[var(--sns-gold)] font-semibold block">
                        {edu.year || `DEGREE 0${idx + 1}`}
                      </span>
                      {edu.location && (
                        <span className="text-[11px] text-[var(--sns-text-muted)] font-light block mt-0.5">
                          {edu.location}
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="sns-serif text-2xl text-[var(--sns-text-primary)]">
                          {edu.degree}
                        </h4>
                        {edu.gpa && (
                          <span className="sns-mono text-[10px] px-2 py-0.5 rounded border border-[var(--sns-gold)]/40 bg-[var(--sns-gold)]/10 text-[var(--sns-gold)] font-medium">
                            CGPA / GRADE: {edu.gpa}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-4 text-xs text-[var(--sns-text-muted)] md:text-right font-light">
                      {edu.institution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 9.5 CERTIFICATIONS (If Present) ─── */}
        {showCertifications && (
          <section id="certifications" className="sns-section-pad-sm border-t border-[var(--sns-border)] bg-[var(--sns-bg-subtle)]">
            <div className="sns-container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-6 border-b border-[var(--sns-border)]">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-1">CREDENTIALS</span>
                  <h2 className="sns-subheading text-3xl sm:text-4xl text-[var(--sns-text-primary)]">
                    Certifications &amp; Accreditations
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rawCertifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-xs border border-[var(--sns-border)] bg-[var(--sns-bg)] space-y-3"
                  >
                    <Award className="w-5 h-5 text-[var(--sns-gold)]" />
                    <h4 className="sns-serif text-xl text-[var(--sns-text-primary)]">
                      {cert.name || cert.title}
                    </h4>
                    {(cert.issuer || cert.issueDate) && (
                      <p className="text-xs text-[var(--sns-text-muted)]">
                        {cert.issuer ? `Issued by ${cert.issuer}` : ""} {cert.issueDate ? `· ${cert.issueDate}` : ""}
                      </p>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sns-meta text-[11px] text-[var(--sns-gold)] inline-flex items-center gap-1 hover:underline pt-2"
                      >
                        Verify Credential
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 9.6 CUSTOM SECTIONS (If Defined by User) ─── */}
        {showCustomSections && (
          <section className="sns-section-pad-sm border-t border-[var(--sns-border)] bg-[var(--sns-bg)]">
            <div className="sns-container space-y-12">
              {rawCustomSections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-6">
                  <div className="pb-4 border-b border-[var(--sns-border)]">
                    <span className="sns-meta text-[var(--sns-gold)] block mb-1">ADDITIONAL SECTION</span>
                    <h3 className="sns-subheading text-3xl sm:text-4xl text-[var(--sns-text-primary)]">
                      {sec.title || sec.name}
                    </h3>
                  </div>

                  {sec.content && (
                    <p className="text-base text-[var(--sns-text-secondary)] font-light leading-relaxed max-w-3xl">
                      {sec.content}
                    </p>
                  )}

                  {Array.isArray(sec.items) && sec.items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sec.items.map((item, itemIdx) => {
                        const isObj = item && typeof item === "object";
                        const title = isObj ? item.title || item.name || "" : (typeof item === "string" ? item : "");
                        const subtitle = isObj ? item.subtitle || item.organization || item.issuer || item.publisher || "" : "";
                        const date = isObj ? item.date || "" : "";
                        const link = isObj ? item.link || item.url || "" : "";
                        const desc = isObj ? item.description || "" : "";
                        const image = isObj ? item.image || item.imageUrl || item.thumbnail || "" : "";
                        const bullets = isObj && Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];

                        return (
                          <div
                            key={isObj ? item.id || itemIdx : itemIdx}
                            className="p-6 rounded-xs border border-[var(--sns-border)] bg-[var(--sns-bg-subtle)] space-y-2"
                          >
                            {image && (
                              <img
                                src={image}
                                alt={title || "Entry"}
                                className="w-full h-36 object-cover rounded-xs border border-[var(--sns-border)] mb-2"
                                loading="lazy"
                              />
                            )}
                            <div className="flex justify-between items-baseline gap-2 flex-wrap">
                              {title && (
                                <h4 className="sns-serif text-xl text-[var(--sns-text-primary)]">
                                  {title}
                                </h4>
                              )}
                              {date && (
                                <span className="text-xs text-[var(--sns-text-muted)] font-mono">
                                  {date}
                                </span>
                              )}
                            </div>
                            {subtitle && (
                              <p className="text-xs text-[var(--sns-text-secondary)] font-medium">
                                {subtitle}
                              </p>
                            )}
                            {link && (
                              <a
                                href={link.startsWith("http") ? link : `https://${link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--sns-primary)] underline block"
                              >
                                View Link →
                              </a>
                            )}
                            {desc && (
                              <p className="text-xs text-[var(--sns-text-secondary)] font-light leading-relaxed">
                                {desc}
                              </p>
                            )}
                            {bullets.length > 0 && (
                              <ul className="list-disc pl-4 text-xs text-[var(--sns-text-secondary)] space-y-1">
                                {bullets.map((b, bIdx) => (
                                  <li key={bIdx}>{typeof b === "string" ? b : b?.text || String(b)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 18. CONTACT SECTION (Scale-Driven Typography) ─── */}
        {showContact && (
          <section id="contact" className="sns-section-pad border-t border-[var(--sns-border)] bg-[var(--sns-bg-subtle)]">
            <div className="sns-container">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-7 space-y-8">
                  <span className="sns-meta text-[var(--sns-gold)] block">CONTACT</span>

                  <h2 className="sns-headline text-4xl sm:text-6xl md:text-7xl text-[var(--sns-text-primary)]">
                    Have something worth building?
                  </h2>

                  <p className="text-base sm:text-lg text-[var(--sns-text-secondary)] font-light leading-relaxed max-w-xl">
                    Feel free to reach out to discuss technical projects, product collaboration, or engineering opportunities.
                  </p>

                  {email && (
                    <div className="pt-4">
                      <a
                        href={`mailto:${email}`}
                        className="sns-cta-large"
                      >
                        <span>LET'S TALK</span>
                        <span className="sns-cta-arrow">→</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 space-y-8 lg:pt-14">
                  {/* Direct Email */}
                  {email && (
                    <div className="space-y-2 pb-6 border-b border-[var(--sns-border)]">
                      <span className="sns-meta text-[10px] text-[var(--sns-gold)] block">
                        DIRECT EMAIL
                      </span>
                      <div className="flex items-center justify-between gap-3">
                        <a
                          href={`mailto:${email}`}
                          className="sns-serif text-xl sm:text-2xl text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] transition-colors truncate"
                        >
                          {email}
                        </a>
                        <button
                          onClick={handleCopyEmail}
                          className="p-2 rounded-xs border border-[var(--sns-border)] hover:border-[var(--sns-gold)] text-[var(--sns-text-muted)] hover:text-[var(--sns-gold)] transition-colors cursor-pointer flex-shrink-0"
                          title="Copy email to clipboard"
                        >
                          {copiedEmail ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Direct Phone */}
                  {phone && (
                    <div className="space-y-2 pb-6 border-b border-[var(--sns-border)]">
                      <span className="sns-meta text-[10px] text-[var(--sns-gold)] block">
                        DIRECT TELEPHONE
                      </span>
                      <div className="flex items-center justify-between gap-3">
                        <a
                          href={`tel:${phone.replace(/\s+/g, "")}`}
                          className="sns-serif text-xl sm:text-2xl text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] transition-colors truncate"
                        >
                          {phone}
                        </a>
                        <button
                          onClick={handleCopyPhone}
                          className="p-2 rounded-xs border border-[var(--sns-border)] hover:border-[var(--sns-gold)] text-[var(--sns-text-muted)] hover:text-[var(--sns-gold)] transition-colors cursor-pointer flex-shrink-0"
                          title="Copy phone to clipboard"
                        >
                          {copiedPhone ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Online Presence Links */}
                  {socialLinksList.length > 0 && (
                    <div className="space-y-3">
                      <span className="sns-meta text-[10px] text-[var(--sns-text-muted)] block">
                        ONLINE PRESENCE
                      </span>
                      <div className="flex flex-wrap gap-4">
                        {socialLinksList.map((social, sIdx) => {
                          const IconComp = resolveSocialIcon(social.type, social.name);
                          return (
                            <a
                              key={sIdx}
                              href={social.url}
                              target="_blank"
                              rel="noreferrer"
                              className="sns-meta text-xs text-[var(--sns-text-primary)] hover:text-[var(--sns-gold)] inline-flex items-center gap-1.5 sns-underline-anim py-1"
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{social.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ─── 19. FOOTER & 20. SMARTNSHINE BRAND LAYER ─── */}
      <footer className="border-t border-[var(--sns-border)] bg-[var(--sns-bg)] py-12">
        <div className="sns-container space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[var(--sns-border)]">
            <div className="space-y-1">
              <span className="sns-serif text-xl font-normal text-[var(--sns-text-primary)]">
                {name}
              </span>
              <p className="text-xs text-[var(--sns-text-muted)] font-light">
                DESIGNED &amp; BUILT BY {name.toUpperCase()}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <span className="sns-meta text-[var(--sns-text-muted)]">
                © {currentYear} ALL RIGHTS RESERVED
              </span>
              <button
                onClick={() => scrollTo("hero")}
                className="sns-meta text-[var(--sns-text-secondary)] hover:text-[var(--sns-gold)] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>TOP</span>
                <ChevronUp className="w-3.5 h-3.5 text-[var(--sns-gold)]" />
              </button>
            </div>
          </div>

          {/* Micro-Branding Signature */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[var(--sns-text-muted)]">
            <span>SMARTNSHINE / MINIMAL EDITION</span>
            <span>A SMARTNSHINE TEMPLATE · DIGITAL CRAFT</span>
          </div>
        </div>
      </footer>

      {/* ─── CASE STUDY & PROJECT DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xs border border-[var(--sns-border-gold)] bg-[var(--sns-bg)] p-6 sm:p-10 shadow-2xl"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-2 rounded-xs border border-[var(--sns-border)] hover:border-[var(--sns-gold)] text-[var(--sns-text-muted)] hover:text-[var(--sns-gold)] transition-colors cursor-pointer"
                aria-label="Close project details"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-8">
                <div>
                  <span className="sns-meta text-[var(--sns-gold)] block mb-1">
                    {selectedProject.category} {selectedProject.year ? `· ${selectedProject.year}` : ""}
                  </span>
                  <h3 className="sns-subheading text-3xl sm:text-4xl text-[var(--sns-text-primary)]">
                    {selectedProject.title}
                  </h3>
                </div>

                {selectedProject.image && (
                  <div className="rounded-xs overflow-hidden border border-[var(--sns-border)] aspect-video bg-[var(--sns-bg-surface)]">
                    <img
                      src={selectedProject.image}
                      alt={selectedProject.title}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4 text-sm sm:text-base text-[var(--sns-text-secondary)] font-light leading-relaxed">
                  {selectedProject.longDescription || selectedProject.description ? (
                    <p>{selectedProject.longDescription || selectedProject.description}</p>
                  ) : null}

                  {(selectedProject.problem || selectedProject.approach || selectedProject.result) && (
                    <div className="pt-4 grid grid-cols-1 gap-6 border-t border-[var(--sns-border)]">
                      {selectedProject.problem && (
                        <div className="space-y-1">
                          <span className="sns-meta text-xs text-[var(--sns-gold)] block">
                            THE PROBLEM
                          </span>
                          <p className="text-sm text-[var(--sns-text-secondary)] font-light">
                            {selectedProject.problem}
                          </p>
                        </div>
                      )}
                      {selectedProject.approach && (
                        <div className="space-y-1">
                          <span className="sns-meta text-xs text-[var(--sns-gold)] block">
                            THE APPROACH
                          </span>
                          <p className="text-sm text-[var(--sns-text-secondary)] font-light">
                            {selectedProject.approach}
                          </p>
                        </div>
                      )}
                      {selectedProject.result && (
                        <div className="space-y-1">
                          <span className="sns-meta text-xs text-[var(--sns-gold)] block">
                            THE RESULT
                          </span>
                          <p className="text-sm text-[var(--sns-text-secondary)] font-light">
                            {selectedProject.result}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tech Badges & Actions */}
                <div className="pt-6 border-t border-[var(--sns-border)] flex flex-wrap items-center justify-between gap-4">
                  {selectedProject.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-xs border border-[var(--sns-border)] bg-[var(--sns-bg-subtle)] text-[var(--sns-text-secondary)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 ml-auto">
                    {selectedProject.liveUrl && (
                      <a
                        href={selectedProject.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sns-meta text-xs font-semibold px-4 py-2 rounded-xs bg-[var(--sns-gold)] text-white hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                      >
                        Live Demo
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {selectedProject.githubUrl && (
                      <a
                        href={selectedProject.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sns-meta text-xs font-semibold px-4 py-2 rounded-xs border border-[var(--sns-border)] text-[var(--sns-text-primary)] hover:border-[var(--sns-gold)] transition-colors inline-flex items-center gap-1.5"
                      >
                        <Github className="w-3.5 h-3.5" />
                        Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

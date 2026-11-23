import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Download,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Layers,
  Code,
  FolderGit2,
  X,
  Copy,
  Check,
  Zap,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const hasItems = (arr) => Array.isArray(arr) && arr.length > 0;

/* ─── Social icon resolver ─── */
const getSocialIcon = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("git")) return Github;
  if (t.includes("link")) return Linkedin;
  if (t.includes("mail")) return Mail;
  return Globe;
};

/* ─── Magnetic Button / Link with Spring Physics ─── */
const GlassMagneticButton = ({
  children,
  onClick,
  href,
  download,
  target,
  rel,
  className = "",
  style = {},
  strength = 0.32,
  title,
  type = "button",
  ...props
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (clientX - centerX) * strength;
    const deltaY = (clientY - centerY) * strength;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      ref={ref}
      href={href}
      download={download}
      target={href ? target || (href.startsWith("http") ? "_blank" : undefined) : undefined}
      rel={href ? rel || (href.startsWith("http") ? "noreferrer" : undefined) : undefined}
      type={href ? undefined : type}
      title={title}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 220, damping: 14, mass: 0.12 }}
      style={{ display: "inline-flex", ...style }}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

/* ─── Interactive 3D Tilt Card Component ─── */
const GlassTiltCard = ({
  children,
  className = "",
  style = {},
  onClick,
  glowAccent = false,
  ...props
}) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.4 }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
        ...style,
      }}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 dark:border-white/10 bg-white/65 dark:bg-slate-900/55 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-all duration-300 ${
        glowAccent
          ? "hover:border-[var(--pt-accent)] hover:shadow-2xl hover:shadow-[var(--pt-accent-dim)]"
          : "hover:border-white/80 dark:hover:border-white/20 hover:bg-white/80 dark:hover:bg-slate-900/70"
      } ${className}`}
      {...props}
    >
      {/* Dynamic Specular Light Glare */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          opacity: glarePosition.opacity,
        }}
      />
      {children}
    </motion.div>
  );
};

/* ─── Glass Badge / Pill ─── */
const GlassPill = ({ children, className = "", icon: Icon, accent = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 border ${
      accent
        ? "bg-[var(--pt-accent-dim)] border-[var(--pt-accent)] text-[var(--pt-accent)] shadow-xs"
        : "bg-white/60 dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
    } ${className}`}
  >
    {Icon && <Icon className="w-3 h-3 opacity-80" />}
    {children}
  </span>
);

/* ─── Main Glassmorphism Theme Component ─── */
export default function GlassmorphismTheme({
  data,
  isDarkMode,
  toggleDarkMode,
  accentColor,
}) {
  const {
    profile = {},
    sections = {},
    skills = [],
    projects = [],
    experience = [],
    education = [],
    certifications = [],
    achievements = [],
    customSections = [],
    links = [],
    actions = {},
    settings = {},
  } = data || {};

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse ambient follower
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  }, []);

  const handleCopyEmail = () => {
    if (profile.email) {
      navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      toast.success("Email copied to clipboard!");
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const currentAccent = accentColor || "var(--pt-accent, #06b6d4)";

  // Total calculated stats for quick glass counters
  const totalProjects = projects.length;
  const totalSkills = skills.reduce(
    (acc, curr) => acc + (Array.isArray(curr.items) ? curr.items.length : 1),
    0
  );
  const totalRoles = experience.length;

  return (
    <div className="relative min-h-screen font-sans selection:bg-[var(--pt-accent)] selection:text-white pb-24 overflow-x-hidden">
      {/* ─── Ambient Glowing Aurora Background Orbs ─── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Top-Right Aurora Orb */}
        <div
          className="pt-aurora-orb absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full opacity-45 dark:opacity-35 blur-[90px]"
          style={{
            background: `radial-gradient(circle, ${currentAccent} 0%, var(--pt-accent-secondary, #8b5cf6) 70%, transparent 100%)`,
          }}
        />

        {/* Center-Left Aurora Orb */}
        <div
          className="pt-aurora-orb absolute top-[35%] -left-48 h-[550px] w-[550px] rounded-full opacity-35 dark:opacity-25 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, #06b6d4 60%, transparent 100%)",
            animationDelay: "-5s",
          }}
        />

        {/* Bottom-Right Aurora Orb */}
        <div
          className="pt-aurora-orb absolute top-[70%] -right-40 h-[600px] w-[600px] rounded-full opacity-30 dark:opacity-20 blur-[110px]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, #ec4899 70%, transparent 100%)",
            animationDelay: "-10s",
          }}
        />

        {/* Interactive Mouse Ambient Backlight */}
        <div
          className="fixed pointer-events-none w-[360px] h-[360px] rounded-full blur-[100px] opacity-20 dark:opacity-25 transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${mousePos.x - 180}px, ${mousePos.y - 180}px)`,
            background: `radial-gradient(circle, ${currentAccent} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ─── Container ─── */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-16 sm:space-y-24">
        
        {/* =========================================================================
            HERO SECTION - Glass Profile Deck
            ========================================================================= */}
        <section id="hero" className="relative pt-4">
          <GlassTiltCard className="p-6 sm:p-10 lg:p-14" glowAccent={true}>
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-8 lg:gap-12">
              
              {/* Profile Bio & Headline */}
              <div className="flex-1 text-center lg:text-left space-y-5 flex flex-col justify-center">
                
                {/* Availability status badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md w-fit mx-auto lg:mx-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Available for high-impact opportunities</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                    Hi, I'm{" "}
                    <span
                      style={{ color: currentAccent }}
                    >
                      {profile.name || "Portfolio"}
                    </span>
                  </h1>

                  {profile.title && (
                    <p className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                      {profile.title}
                    </p>
                  )}
                </div>

                {profile.tagline && (
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {profile.tagline}
                  </p>
                )}

                {/* Location & Contact Meta */}
                {profile.location && (
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4" style={{ color: currentAccent }} />
                    <span>{profile.location}</span>
                  </div>
                )}

                {/* Magnetic Glass Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  {profile.email && profile.showEmail && (
                    <GlassMagneticButton
                      href={`mailto:${profile.email}`}
                      onClick={actions.onContactClick}
                      className="group items-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl font-bold text-sm !text-white shadow-lg border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: currentAccent,
                        color: "#ffffff",
                      }}
                    >
                      <Mail className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
                      <span className="text-white">Get in touch</span>
                      <ArrowUpRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </GlassMagneticButton>
                  )}

                  {settings.showResumeDownload !== false &&
                    (actions.resumeDownloadUrl ? (
                      <GlassMagneticButton
                        href={actions.resumeDownloadUrl}
                        download={true}
                        onClick={actions.onResumeClick}
                        className="items-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl font-bold text-sm text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs transition-all duration-300"
                      >
                        <Download className="w-4 h-4" style={{ color: currentAccent }} />
                        <span>Download CV</span>
                      </GlassMagneticButton>
                    ) : (
                      <GlassMagneticButton
                        onClick={actions.onResumeClick}
                        className="items-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl font-bold text-sm text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs transition-all duration-300"
                      >
                        <Download className="w-4 h-4" style={{ color: currentAccent }} />
                        <span>Download CV</span>
                      </GlassMagneticButton>
                    ))}

                  {profile.email && (
                    <GlassMagneticButton
                      onClick={handleCopyEmail}
                      title="Copy email to clipboard"
                      className="items-center gap-2 px-4 py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-white/10 backdrop-blur-md transition-all"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 opacity-70" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </GlassMagneticButton>
                  )}
                </div>

                {/* Magnetic Social Links Dock */}
                {hasItems(links) && (
                  <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                    {links.map((link) => {
                      const Icon = getSocialIcon(link.type);
                      return (
                        <GlassMagneticButton
                          key={`${link.type}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          strength={0.25}
                          className="group items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 backdrop-blur-md transition-all duration-200"
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: currentAccent }} />
                          <span className="capitalize">{link.label || link.type}</span>
                        </GlassMagneticButton>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Profile Image (Photo Mode) OR Glass Code Terminal (No-Photo Mode) */}
              {profile.profileImage ? (
                <div className="w-full max-w-[260px] sm:max-w-[280px] lg:w-64 xl:w-72 flex flex-col justify-between gap-3 self-stretch shrink-0">
                  <div className="relative group w-full flex-1 rounded-3xl overflow-hidden border-2 border-white/60 dark:border-white/15 shadow-2xl backdrop-blur-md">
                    {/* Glowing halo behind avatar */}
                    <div
                      className="absolute -inset-2 rounded-3xl opacity-30 blur-xl transition-all duration-500 group-hover:opacity-60"
                      style={{
                        background: currentAccent,
                      }}
                    />

                    <img
                      src={profile.profileImage}
                      alt={profile.name || "Profile"}
                      className="relative w-full h-full object-cover rounded-[1.35rem] transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Quick Glass Stats Card */}
                  {(totalProjects > 0 || totalSkills > 0 || totalRoles > 0) && (
                    <div className="grid grid-cols-3 gap-1.5 w-full p-2 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 backdrop-blur-md shadow-sm text-center">
                      {totalProjects > 0 && (
                        <div className="p-1">
                          <span className="block text-base font-black text-slate-900 dark:text-white">
                            {totalProjects}+
                          </span>
                          <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Projects
                          </span>
                        </div>
                      )}
                      {totalSkills > 0 && (
                        <div className="p-1 border-x border-slate-200/60 dark:border-white/10">
                          <span className="block text-base font-black text-slate-900 dark:text-white">
                            {totalSkills}+
                          </span>
                          <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Skills
                          </span>
                        </div>
                      )}
                      {totalRoles > 0 && (
                        <div className="p-1">
                          <span className="block text-base font-black text-slate-900 dark:text-white">
                            {totalRoles}
                          </span>
                          <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Roles
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* No-Photo Mode: Frosted Code Terminal & Metric Bento */
                <div className="w-full lg:max-w-sm space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl p-5 shadow-lg space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans font-bold">engineer.config.ts</span>
                    </div>
                    <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p><span className="text-indigo-600 dark:text-indigo-400">const</span> developer = &#123;</p>
                      <p className="pl-4">name: <span className="text-emerald-600 dark:text-emerald-400">"{profile.name || "Developer"}"</span>,</p>
                      {profile.title && <p className="pl-4">role: <span className="text-cyan-600 dark:text-cyan-400">"{profile.title}"</span>,</p>}
                      {profile.location && <p className="pl-4">location: <span className="text-amber-600 dark:text-amber-400">"{profile.location}"</span>,</p>}
                      <p className="pl-4">status: <span className="text-emerald-500 font-bold">"Open to collaborate"</span></p>
                      <p>&#125;;</p>
                    </div>
                  </div>

                  {/* Quick Glass Stats */}
                  {(totalProjects > 0 || totalSkills > 0 || totalRoles > 0) && (
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 backdrop-blur-md shadow-sm text-center">
                      {totalProjects > 0 && (
                        <div className="p-1.5">
                          <span className="block text-lg font-black text-slate-900 dark:text-white">
                            {totalProjects}+
                          </span>
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Projects
                          </span>
                        </div>
                      )}
                      {totalSkills > 0 && (
                        <div className="p-1.5 border-x border-slate-200/60 dark:border-white/10">
                          <span className="block text-lg font-black text-slate-900 dark:text-white">
                            {totalSkills}+
                          </span>
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Skills
                          </span>
                        </div>
                      )}
                      {totalRoles > 0 && (
                        <div className="p-1.5">
                          <span className="block text-lg font-black text-slate-900 dark:text-white">
                            {totalRoles}
                          </span>
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Roles
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </GlassTiltCard>
        </section>

        {/* =========================================================================
            ABOUT SECTION
            ========================================================================= */}
        {sections.showAbout !== false && profile.about && (
          <section id="about" className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: currentAccent }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--pt-accent)]">
                  Overview
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  About Me
                </h2>
              </div>
            </div>

            <GlassTiltCard className="p-6 sm:p-8 space-y-4">
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.about}
              </p>
            </GlassTiltCard>
          </section>
        )}

        {/* =========================================================================
            SKILLS SECTION - Glass Categorized Matrix
            ========================================================================= */}
        {sections.showSkills !== false && hasItems(skills) && (
          <section id="skills" className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: currentAccent }}
              >
                <Code className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--pt-accent)]">
                  Capabilities
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Skills & Technologies
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {skills.map((group, idx) => {
                const categoryTitle =
                  typeof group === "string" ? "Core Technologies" : group.category || "Skillset";
                const skillItems =
                  typeof group === "string"
                    ? [group]
                    : Array.isArray(group.items)
                    ? group.items
                    : [];

                return (
                  <GlassTiltCard key={`${categoryTitle}-${idx}`} className="p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        <Terminal className="w-4 h-4 text-[var(--pt-accent)] shrink-0" />
                        <span className="truncate">{categoryTitle}</span>
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {skillItems.length} items
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                      {skillItems.map((skill) => (
                        <span
                          key={skill}
                          className="pt-glass-shimmer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/70 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-white/80 dark:border-white/10 backdrop-blur-md shadow-2xs hover:border-[var(--pt-accent)] hover:text-[var(--pt-accent)] transition-all cursor-default truncate"
                          title={skill}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: currentAccent }}
                          />
                          <span className="truncate">{skill}</span>
                        </span>
                      ))}
                    </div>
                  </GlassTiltCard>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================================
            PROJECTS SECTION - Glass Bento Showcase
            ========================================================================= */}
        {sections.showProjects !== false && hasItems(projects) && (
          <section id="projects" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ background: currentAccent }}
                >
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--pt-accent)]">
                    Portfolio
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Featured Projects
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const hasDetails =
                  project.longDescription ||
                  project.problem ||
                  project.solution ||
                  project.impact ||
                  (project.highlights && project.highlights.length > 0);

                return (
                  <GlassTiltCard
                    key={project.id || project.title}
                    className="flex flex-col justify-between p-6 sm:p-8 group cursor-pointer"
                    glowAccent={true}
                    onClick={() => {
                      if (actions.onProjectClick) actions.onProjectClick(project);
                      setSelectedProject(project);
                    }}
                  >
                    <div className="space-y-4">
                      
                      {/* Top Bar: Featured Pill & Magnetic External Link Actions */}
                      <div className="flex items-center justify-between gap-2">
                        {project.featured ? (
                          <GlassPill accent={true} icon={Sparkles}>
                            Featured
                          </GlassPill>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            Project
                          </span>
                        )}

                        {/* Magnetic Project Action Links */}
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.links?.github && (
                            <GlassMagneticButton
                              href={project.links.github}
                              target="_blank"
                              rel="noreferrer"
                              title="Source Code"
                              strength={0.35}
                              className="p-2.5 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-white/60 dark:border-white/15 backdrop-blur-md text-slate-700 dark:text-slate-200 transition-all"
                            >
                              <Github className="w-4 h-4" />
                            </GlassMagneticButton>
                          )}
                          {project.links?.live && (
                            <GlassMagneticButton
                              href={project.links.live}
                              target="_blank"
                              rel="noreferrer"
                              title="Live Demo"
                              strength={0.35}
                              className="p-2.5 rounded-xl bg-[var(--pt-accent-dim)] hover:bg-[var(--pt-accent)] text-[var(--pt-accent)] hover:text-white border border-[var(--pt-accent)] backdrop-blur-md transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </GlassMagneticButton>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[var(--pt-accent)] transition-colors flex items-center justify-between">
                          <span>{project.title}</span>
                          <ChevronRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      {/* Tech Stack Chips */}
                      {hasItems(project.technologies) && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {project.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/10 backdrop-blur-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA to view details if available */}
                    {hasDetails && (
                      <div className="pt-5 mt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[var(--pt-accent)]">
                        <span>Click for case study & architecture</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    )}
                  </GlassTiltCard>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================================
            EXPERIENCE SECTION - Glass Timeline
            ========================================================================= */}
        {sections.showExperience !== false && hasItems(experience) && (
          <section id="experience" className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: currentAccent }}
              >
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--pt-accent)]">
                  Career
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Work Experience
                </h2>
              </div>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[var(--pt-accent)] before:via-violet-500/40 before:to-transparent">
              {experience.map((exp, idx) => (
                <div key={`${exp.company}-${idx}`} className="relative group">
                  {/* Glowing Timeline Node */}
                  <span
                    className="absolute -left-6 sm:-left-8 top-6 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: currentAccent }}
                  />

                  <GlassTiltCard className="p-6 sm:p-7 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {exp.role || exp.title}
                        </h3>
                        <p className="text-sm font-bold text-[var(--pt-accent)]">
                          {exp.company}
                          {exp.location && (
                            <span className="text-slate-400 font-normal"> • {exp.location}</span>
                          )}
                        </p>
                      </div>

                      {exp.dateRange && (
                        <GlassPill className="self-start sm:self-auto font-bold">
                          {exp.dateRange}
                        </GlassPill>
                      )}
                    </div>

                    {exp.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {exp.description}
                      </p>
                    )}

                    {hasItems(exp.highlights) && (
                      <ul className="space-y-1.5 pt-2">
                        {exp.highlights.map((point, pIdx) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[var(--pt-accent)] shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassTiltCard>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            EDUCATION & CERTIFICATIONS - Dual Glass Grid
            ========================================================================= */}
        {( (sections.showEducation !== false && hasItems(education)) ||
           (sections.showCertifications !== false && hasItems(certifications)) ) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Education */}
            {sections.showEducation !== false && hasItems(education) && (
              <section id="education" className="space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ background: currentAccent }}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Education
                  </h2>
                </div>

                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <GlassTiltCard key={`${edu.institution || edu.school}-${idx}`} className="p-5 sm:p-6 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                          {edu.degree} {edu.field && `in ${edu.field}`}
                        </h3>
                        {edu.dateRange && (
                          <span className="text-xs font-bold text-slate-400 shrink-0">
                            {edu.dateRange}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[var(--pt-accent)]">
                        {edu.institution || edu.school}
                      </p>
                      {(edu.gpa || edu.grade || edu.cgpa) && (
                        <div className="pt-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 dark:bg-white/5 border border-white/20 text-[var(--pt-accent)]">
                            CGPA / Grade: {edu.gpa || edu.grade || edu.cgpa}
                          </span>
                        </div>
                      )}
                      {edu.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {edu.description}
                        </p>
                      )}
                    </GlassTiltCard>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {sections.showCertifications !== false && hasItems(certifications) && (
              <section id="certifications" className="space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ background: currentAccent }}
                  >
                    <Award className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Certifications
                  </h2>
                </div>

                <div className="space-y-4">
                  {certifications.map((cert, idx) => {
                    const title = typeof cert === "string" ? cert : cert.name || cert.title;
                    const issuer = typeof cert === "object" ? cert.issuer : null;
                    const date = typeof cert === "object" ? cert.date || cert.issueDate : null;

                    return (
                      <GlassTiltCard key={`${title}-${idx}`} className="p-5 sm:p-6 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {title}
                          </h3>
                          {date && (
                            <span className="text-xs font-bold text-slate-400 shrink-0">
                              {date}
                            </span>
                          )}
                        </div>
                        {issuer && (
                          <p className="text-sm font-semibold text-[var(--pt-accent)]">
                            {issuer}
                          </p>
                        )}
                      </GlassTiltCard>
                    );
                  })}
                </div>
              </section>
            )}

          </div>
        )}

        {/* =========================================================================
            ACHIEVEMENTS & CUSTOM SECTIONS
            ========================================================================= */}
        {sections.showAchievements !== false && hasItems(achievements) && (
          <section id="achievements" className="space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ background: currentAccent }}
              >
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Achievements & Honors
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((item, idx) => {
                const text = typeof item === "string" ? item : item.title || item.description;
                return (
                  <GlassTiltCard key={idx} className="p-5 flex items-start gap-3">
                    <Award className="w-5 h-5 text-[var(--pt-accent)] shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {text}
                    </p>
                  </GlassTiltCard>
                );
              })}
            </div>
          </section>
        )}

        {/* Custom Sections */}
        {sections.showCustomSections !== false && hasItems(customSections) && (
          <div className="space-y-8">
            {customSections.map((sec, idx) => (
              <section key={sec.id || idx} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ background: currentAccent }}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {sec.title || "Additional Information"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(sec.items || []).map((item, iIdx) => {
                    const isObj = item && typeof item === "object";
                    const title = isObj ? item.title || item.name || "" : (typeof item === "string" ? item : "");
                    const subtitle = isObj ? item.subtitle || item.organization || item.issuer || item.publisher || "" : "";
                    const date = isObj ? item.date || "" : "";
                    const link = isObj ? item.link || item.url || "" : "";
                    const desc = isObj ? item.description || "" : "";
                    const image = isObj ? item.image || item.imageUrl || item.thumbnail || "" : "";
                    const bullets = isObj && Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];

                    return (
                      <GlassTiltCard key={isObj ? item.id || iIdx : iIdx} className="p-5">
                        <div className="space-y-1.5">
                          {image && (
                            <img
                              src={image}
                              alt={title || "Entry"}
                              className="w-full h-32 object-cover rounded-xl border border-white/20 mb-2"
                              loading="lazy"
                            />
                          )}
                          <div className="flex justify-between items-baseline gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {title && (
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                  {title}
                                </h4>
                              )}
                              {subtitle && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  · {subtitle}
                                </span>
                              )}
                              {link && (
                                <a
                                  href={link.startsWith("http") ? link : `https://${link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  [link]
                                </a>
                              )}
                            </div>
                            {date && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                {date}
                              </span>
                            )}
                          </div>
                          {desc && (
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {desc}
                            </p>
                          )}
                          {bullets.length > 0 && (
                            <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                              {bullets.map((b, bIdx) => (
                                <li key={bIdx}>{typeof b === "string" ? b : b?.text || String(b)}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </GlassTiltCard>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* =========================================================================
            CONTACT SECTION - Frosted Glass Communications Hub
            ========================================================================= */}
        {sections.showContact !== false && (profile.email || profile.phone) && (
          <section id="contact" className="space-y-6 pt-6">
            <GlassTiltCard className="p-8 sm:p-12 text-center space-y-6" glowAccent={true}>
              <div className="space-y-2 max-w-xl mx-auto">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--pt-accent)]">
                  Connect
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Let's Build Something Exceptional
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Feel free to reach out for engineering roles, collaborations, or technical consultations.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {profile.email && (
                  <GlassMagneticButton
                    href={`mailto:${profile.email}`}
                    onClick={actions.onContactClick}
                    className="items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm !text-white shadow-xl border border-white/20 hover:scale-105 active:scale-95 transition-all"
                    style={{
                      backgroundColor: currentAccent,
                      color: "#ffffff",
                    }}
                  >
                    <Mail className="w-4 h-4 text-white" />
                    <span className="text-white">{profile.email}</span>
                  </GlassMagneticButton>
                )}

                {profile.phone && profile.showPhone && (
                  <GlassMagneticButton
                    href={`tel:${profile.phone}`}
                    onClick={actions.onContactClick}
                    className="items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4" style={{ color: currentAccent }} />
                    <span>{profile.phone}</span>
                  </GlassMagneticButton>
                )}
              </div>
            </GlassTiltCard>
          </section>
        )}

      </div>

      {/* =========================================================================
          PROJECT DETAIL MODAL (Frosted Glass Lightbox)
          ========================================================================= */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md"
            />

            {/* Modal Glass Container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/70 dark:border-white/15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 z-10"
            >
              {/* Magnetic Close Button */}
              <GlassMagneticButton
                onClick={() => setSelectedProject(null)}
                strength={0.4}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </GlassMagneticButton>

              <div className="space-y-2 pr-8">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--pt-accent)]">
                  Case Study
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedProject.title}
                </h3>
              </div>

              {/* Technologies */}
              {hasItems(selectedProject.technologies) && (
                <div className="flex flex-wrap gap-2">
                  {selectedProject.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-[var(--pt-accent-dim)] text-[var(--pt-accent)] border border-[var(--pt-accent)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Descriptions & Insights */}
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedProject.longDescription ? (
                  <p className="whitespace-pre-line">{selectedProject.longDescription}</p>
                ) : (
                  <p>{selectedProject.description}</p>
                )}

                {selectedProject.problem && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <h4 className="font-bold text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">
                      The Challenge
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {selectedProject.problem}
                    </p>
                  </div>
                )}

                {selectedProject.solution && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">
                      The Solution & Architecture
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {selectedProject.solution}
                    </p>
                  </div>
                )}

                {selectedProject.impact && (
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                    <h4 className="font-bold text-cyan-600 dark:text-cyan-400 text-xs uppercase tracking-wider">
                      Impact & Results
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {selectedProject.impact}
                    </p>
                  </div>
                )}

                {hasItems(selectedProject.highlights) && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Key Highlights
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedProject.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                          <CheckCircle2 className="w-4 h-4 text-[var(--pt-accent)] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60 dark:border-white/10">
                {selectedProject.links?.live && (
                  <GlassMagneticButton
                    href={selectedProject.links.live}
                    target="_blank"
                    rel="noreferrer"
                    className="items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all"
                    style={{ background: currentAccent }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Live Application</span>
                  </GlassMagneticButton>
                )}
                {selectedProject.links?.github && (
                  <GlassMagneticButton
                    href={selectedProject.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                  >
                    <Github className="w-4 h-4" />
                    <span>View Repository</span>
                  </GlassMagneticButton>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

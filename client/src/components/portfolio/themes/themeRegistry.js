import MinimalDeveloperTheme from "./MinimalDeveloperTheme";
import ModernFresherTheme from "./ModernFresherTheme";
import ProfessionalCorporateTheme from "./ProfessionalCorporateTheme";
import CyberDevTheme from "./CyberDevTheme";
import CreativeTheme from "./CreativeTheme";
import TechPortfolioTheme from "./TechPortfolioTheme";
import GlassmorphismTheme from "./GlassmorphismTheme";
import SmartNShineTheme from "./SmartNShineTheme";
import NeomorphicTheme from "./NeomorphicTheme";
import LiquidGlassTheme from "./LiquidGlassTheme";
import RetroFuturisticTheme from "./RetroFuturisticTheme";
import MagazineTheme from "./MagazineTheme";
import SwissArchitecturalTheme from "./SwissArchitecturalTheme";
import SmartNShineKineticTheme from "./SmartNShineKineticTheme";

export const portfolioThemes = {
  kinetic: {
    id: "kinetic",
    name: "SmartNShine Kinetic",
    category: "Interactive Motion",
    badge: "New Flagship",
    defaultMode: "light",
    subtitle: "Scroll × Transformation × Spatial Motion × Generative Atmosphere.",
    description: "6-phase scroll-driven 3D kinetic object transformation, dual atmospheric generative canvas shaders, continuous visual project gallery, and ultra-thin kinetic lines.",
    tags: ["Interactive Motion", "Scroll Transformation", "Generative Shaders", "Spatial 3D", "Kinetic"],
    component: SmartNShineKineticTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#2563eb", "#38bdf8", "#6366f1", "#06b6d4", "#10b981", "#f43f5e"],
  },
  swissArchitectural: {
    id: "swissArchitectural",
    name: "Swiss Architectural",
    category: "Minimalist",
    badge: "New Minimal II",
    defaultMode: "light",
    subtitle: "Architectural Minimalism × Contemporary Swiss Design × Condensed Typography × Cobalt Accent.",
    description: "Rigid editorial grid, monumental condensed typography, monochrome paper & ink palette, muted cobalt blue accents, architectural index rows, and floating blueprint reveals.",
    tags: ["Architectural", "Swiss Minimal", "Condensed Typography", "Cobalt Blue", "Grid System"],
    component: SwissArchitecturalTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#2251ff", "#3b82f6", "#000000", "#10b981", "#ff4500", "#6366f1"],
  },
  magazine: {
    id: "magazine",
    name: "Magazine Editorial",
    category: "Editorial",
    badge: "New Signature",
    defaultMode: "light",
    subtitle: "Monocle × Kinfolk × Contemporary Digital Publication × Portfolio Monograph.",
    description: "High-fashion editorial magazine architecture. 12-column asymmetric grid, monumental typography, cover story hero, feature spreads, floating hover archive, and Day/Night editions.",
    tags: ["Magazine", "Editorial", "Typography", "Art Direction", "Day & Night"],
    component: MagazineTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#b8943f", "#c9a853", "#6b1d2f", "#1e3d2f", "#2c3e50", "#8c6239"],
  },
  retroFuturistic: {
    id: "retroFuturistic",
    name: "Retro-Futuristic OS",
    category: "Retro-Futurism",
    badge: "New Flagship",
    defaultMode: "dark",
    subtitle: "80s/90s Computing × CRT HUD × Modern Editorial Architecture.",
    description: "What someone in 1995 imagined the internet of 2035 would look like. Phosphor CRT monitor frames, diagnostic telemetry, interactive command prompt, and system logs.",
    tags: ["Retro-Futuristic", "CRT Display", "System HUD", "Monospace", "Dark & Light"],
    component: RetroFuturisticTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#00ff66", "#ffb000", "#00f0ff", "#ff6b35", "#d4af37", "#a855f7"],
  },
  smartnshine: {
    id: "smartnshine",
    name: "SmartNShine Minimal",
    category: "Minimalist",
    badge: "Signature",
    defaultMode: "light",
    subtitle: "Modern Minimalism × Editorial Precision × Quiet Luxury × Digital Craft.",
    description: "Swiss precision typography, editorial composition, quiet luxury warm/dark palette, interactive project archive, case study storytelling, and SmartNShine craftsmanship signature.",
    tags: ["Minimalist", "Editorial", "Quiet Luxury", "Digital Craft", "Swiss Precision"],
    component: SmartNShineTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#b8943f", "#c5a059", "#2c3e50", "#1e3d2f", "#6b1d2f", "#10b981"],
  },
  liquidGlass: {
    id: "liquidGlass",
    name: "Liquid Glass Spatial",
    category: "Spatial Glass",
    badge: "Spatial 3D",
    defaultMode: "dark",
    subtitle: "Liquid Glass × Spatial UI × Editorial Typography × Subtle Luxury.",
    description: "Layered translucent glass surfaces floating above slow ambient fluid light. Refraction highlights, floating stats, and spatial gallery layouts.",
    tags: ["Liquid Glass", "Spatial UI", "Subtle Luxury", "Translucent", "Dark & Light"],
    component: LiquidGlassTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#b89047", "#e6be58", "#38bdf8", "#818cf8", "#34d399", "#f43f5e"],
  },
  neomorphic: {
    id: "neomorphic",
    name: "Tactile Neomorphic",
    category: "Neumorphic",
    badge: "New Flagship",
    defaultMode: "light",
    subtitle: "Modern Neumorphism × Soft 3D Surfaces × Editorial Typography.",
    description: "Physical hardware precision translated into digital software. Soft tactile raised/inset surfaces, control-board capabilities, and champagne gold accents.",
    tags: ["Neumorphism", "Soft 3D", "Tactile", "Editorial", "Dark & Light"],
    component: NeomorphicTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#b89047", "#d4af37", "#10b981", "#3b82f6", "#f43f5e", "#06b6d4"],
  },
  glassmorphism: {
    id: "glassmorphism",
    name: "Aura Glass",
    category: "Glassmorphism",
    badge: "Popular",
    defaultMode: "dark",
    subtitle: "Ultra-sleek frosted glassmorphism with ambient glowing aurora.",
    description: "Translucent frosted glass cards, dynamic floating gradients, and glowing iridescent highlights.",
    tags: ["Glassmorphism", "Aurora Glow", "Dark & Light", "Modern"],
    component: GlassmorphismTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#06b6d4", "#8b5cf6", "#10b981", "#f43f5e", "#3b82f6", "#f59e0b"],
  },
  minimalDeveloper: {
    id: "minimalDeveloper",
    name: "Minimal Developer",
    category: "Developer",
    badge: "Minimalist",
    defaultMode: "light",
    subtitle: "High-signal technical layout for software engineers.",
    description: "Ultra clean monospace accents, zero fluff, instant access to GitHub repositories and live deployments.",
    tags: ["Minimalist", "Software Engineer", "High Signal"],
    component: MinimalDeveloperTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
  },
  cyberDev: {
    id: "cyberDev",
    name: "Cyber Dev",
    category: "Developer",
    badge: "Cyberpunk",
    defaultMode: "dark",
    subtitle: "Neon dark-mode terminal & hacker aesthetic.",
    description: "High-contrast glowing neon borders, terminal command prompts, and high-energy developer aesthetics.",
    tags: ["Cyberpunk", "Dark Mode", "Terminal", "Neon"],
    component: CyberDevTheme,
    allowedTiers: ["one-time", "pro"],
    accentPresets: ["#00ff88", "#00d4ff", "#ff006e", "#ffbe0b", "#fb5607"],
  },
  modernFresher: {
    id: "modernFresher",
    name: "Modern Fresher",
    category: "Fresher",
    badge: "Fresher Pick",
    defaultMode: "light",
    subtitle: "Education, skills, and project-forward layout for early career roles.",
    description: "Vibrant visual hierarchy showcasing university achievements, coursework, and personal projects.",
    tags: ["Early Career", "Graduate", "Projects", "Vibrant"],
    component: ModernFresherTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#ec4899"],
  },
  techPortfolio: {
    id: "techPortfolio",
    name: "Tech Portfolio",
    category: "Developer",
    badge: "Tech Clean",
    defaultMode: "dark",
    subtitle: "Futuristic glassmorphism & code-first layout for developers.",
    description: "Structured architecture, interactive tech stack cards, and prominent live project showcases.",
    tags: ["Full Stack", "Developer", "Interactive", "Clean"],
    component: TechPortfolioTheme,
    allowedTiers: ["free", "one-time", "pro"],
    accentPresets: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
  },
  professionalCorporate: {
    id: "professionalCorporate",
    name: "Professional Corporate",
    category: "Corporate",
    badge: "Executive",
    defaultMode: "light",
    subtitle: "Experience-led layout for business leaders, PMs, and executives.",
    description: "Sophisticated corporate styling emphasizing career trajectory, quantifiable metrics, and leadership impact.",
    tags: ["Executive", "Product Manager", "Leadership", "Business"],
    component: ProfessionalCorporateTheme,
    allowedTiers: ["one-time", "pro"],
    accentPresets: ["#1c1917", "#1e3a5f", "#374151", "#4a5568", "#2d3748"],
  },
  creative: {
    id: "creative",
    name: "Creative Canvas",
    category: "Creative",
    badge: "Design",
    defaultMode: "dark",
    subtitle: "Expressive layout with bold typography & vibrant accents for designers.",
    description: "Asymmetric grid, rich media showcases, and artistic styling for UI/UX designers and artists.",
    tags: ["Design", "UI/UX", "Artistic", "Bold"],
    component: CreativeTheme,
    allowedTiers: ["one-time", "pro"],
    accentPresets: ["#7c3aed", "#db2777", "#ea580c", "#0284c7", "#059669"],
  },
};

export const getPortfolioTheme = (themeId) => {
  return (
    portfolioThemes[themeId] ||
    portfolioThemes.smartnshine ||
    portfolioThemes.glassmorphism ||
    portfolioThemes.minimalDeveloper
  );
};

export const portfolioThemeList = Object.values(portfolioThemes);


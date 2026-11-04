import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "@/styles/portfolio-template.css";
import PortfolioTemplateNavbar from "@/components/portfolio/template/PortfolioTemplateNavbar";
import HeroSection from "@/components/portfolio/template/HeroSection";
import TechStackSection from "@/components/portfolio/template/TechStackSection";
import AboutSection from "@/components/portfolio/template/AboutSection";
import ServicesSection from "@/components/portfolio/template/ServicesSection";
import ExperienceSection from "@/components/portfolio/template/ExperienceSection";
import ProjectsSection from "@/components/portfolio/template/ProjectsSection";
import SkillsSection from "@/components/portfolio/template/SkillsSection";
import AchievementsSection from "@/components/portfolio/template/AchievementsSection";
import ContactSection from "@/components/portfolio/template/ContactSection";
import PortfolioFooter from "@/components/portfolio/template/PortfolioFooter";
import { seoConfig, personalInfo } from "@/data/techPortfolioData";

const TechPortfolioTemplate = () => {
  // Handle smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    const links = document.querySelectorAll("a[href^='#']");
    links.forEach((link) => link.addEventListener("click", handleAnchorClick));

    return () => {
      links.forEach((link) =>
        link.removeEventListener("click", handleAnchorClick)
      );
    };
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (prefersReducedMotion.matches) {
      document.documentElement.style.scrollBehavior = "auto";
    }

    const handleMotionPreference = (e) => {
      if (e.matches) {
        document.documentElement.style.scrollBehavior = "auto";
      } else {
        document.documentElement.style.scrollBehavior = "smooth";
      }
    };

    prefersReducedMotion.addEventListener("change", handleMotionPreference);
    return () =>
      prefersReducedMotion.removeEventListener("change", handleMotionPreference);
  }, []);

  return (
    <>
      <Helmet>
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords.join(", ")} />
        <meta name="author" content={personalInfo.name} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:image" content={seoConfig.ogImage || "https://www.smartnshine.in/social-preview.png"} />
        <meta property="og:url" content="https://www.smartnshine.in/tech-portfolio" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        <meta name="twitter:image" content={seoConfig.ogImage || "https://www.smartnshine.in/social-preview.png"} />
        <meta name="twitter:creator" content={seoConfig.twitterHandle || "@smartnshine"} />

        {/* Canonical */}
        <link rel="canonical" href="https://www.smartnshine.in/tech-portfolio" />

        {/* Theme Color */}
        <meta name="theme-color" content="#000000" />

        {/* Structured Data JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": seoConfig.title,
            "description": seoConfig.description,
            "url": "https://www.smartnshine.in/tech-portfolio",
            "mainEntity": {
              "@type": "Person",
              "name": personalInfo.name,
              "jobTitle": personalInfo.title,
              "description": personalInfo.bio
            }
          })}
        </script>
      </Helmet>

      <div className="bg-black text-white overflow-x-hidden">
        {/* Navigation */}
        <PortfolioTemplateNavbar isDarkMode={true} />

        {/* Main Content */}
        <main className="relative">
          {/* Hero Section */}
          <HeroSection />

          {/* Tech Stack Section */}
          <section className="bg-gradient-to-b from-black/50 to-black py-20">
            <TechStackSection />
          </section>

          {/* About Section */}
          <section className="bg-gradient-to-b from-black to-black/50 py-20">
            <AboutSection />
          </section>

          {/* Services Section */}
          <section className="bg-gradient-to-b from-black/50 to-black py-20">
            <ServicesSection />
          </section>

          {/* Experience Section */}
          <section className="bg-gradient-to-b from-black to-black/50 py-20">
            <ExperienceSection />
          </section>

          {/* Projects Section */}
          <section className="bg-gradient-to-b from-black/50 to-black py-20">
            <ProjectsSection />
          </section>

          {/* Skills Section */}
          <section className="bg-gradient-to-b from-black to-black/50 py-20">
            <SkillsSection />
          </section>

          {/* Achievements Section */}
          <section className="bg-gradient-to-b from-black/50 to-black py-20">
            <AchievementsSection />
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-b from-black to-black/50 py-20">
            <ContactSection />
          </section>
        </main>

        {/* Footer */}
        <PortfolioFooter />
      </div>
    </>
  );
};

export default TechPortfolioTemplate;

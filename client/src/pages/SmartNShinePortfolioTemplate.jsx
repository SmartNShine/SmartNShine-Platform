import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import SmartNShineTheme from "@/components/portfolio/themes/SmartNShineTheme";
import { seoConfig, personalInfo } from "@/data/smartNShinePortfolioData";

export default function SmartNShinePortfolioTemplate() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync with user's system preference or storage
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

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
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:url" content="https://smartnshine.in/smartnshine-portfolio" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        <meta name="twitter:image" content={seoConfig.ogImage} />

        {/* Theme color meta tag */}
        <meta name="theme-color" content={isDarkMode ? "#141311" : "#f7f4ef"} />
      </Helmet>

      <SmartNShineTheme
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </>
  );
}

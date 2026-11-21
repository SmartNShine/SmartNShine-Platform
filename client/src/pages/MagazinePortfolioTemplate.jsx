import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import MagazineTheme from "@/components/portfolio/themes/MagazineTheme";
import { magazineData } from "@/data/magazinePortfolioData";

export default function MagazinePortfolioTemplate() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        <title>{magazineData.seoConfig.title}</title>
        <meta name="description" content={magazineData.seoConfig.description} />
        <meta name="keywords" content={magazineData.seoConfig.keywords.join(", ")} />
        <meta name="author" content={magazineData.profile.name} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={magazineData.seoConfig.title} />
        <meta property="og:description" content={magazineData.seoConfig.description} />
        <meta property="og:image" content={magazineData.seoConfig.ogImage} />
        <meta property="og:url" content="https://smartnshine.in/magazine-portfolio" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={magazineData.seoConfig.title} />
        <meta name="twitter:description" content={magazineData.seoConfig.description} />
        <meta name="twitter:image" content={magazineData.seoConfig.ogImage} />

        {/* Theme color meta tag */}
        <meta name="theme-color" content={isDarkMode ? "#0e0e0d" : "#f8f5ee"} />
      </Helmet>

      <MagazineTheme
        data={{}}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </>
  );
}

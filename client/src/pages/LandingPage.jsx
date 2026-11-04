import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import SEO from "../components/common/SEO";
import LandingNavbar from "../components/landing-v2/LandingNavbar";
import EvilChartsLandingMatrix from "../components/landing-v2/EvilChartsLandingMatrix";
import FAQSchema from "../components/common/FAQSchema";
import { SYSTEM_FAQS } from "../components/landing-v2/faqData";

// Lazy-load below-the-fold sections
const PainPointsBentoSection = lazy(() => import("../components/landing-v2/PainPointsBentoSection"));
const PlayfulColorfulBento = lazy(() => import("../components/landing-v2/PlayfulColorfulBento"));
const ScrollablePortfoliosSection = lazy(() => import("../components/landing-v2/ScrollablePortfoliosSection"));
const HowItWorksSection = lazy(() => import("../components/landing-v2/HowItWorksSection"));
const ScrollSplitCardsSection = lazy(() => import("../components/landing-v2/ScrollSplitCardsSection"));
const TestimonialsHomeSection = lazy(() => import("../components/home/TestimonialsHomeSection"));
const PricingSection = lazy(() => import("../components/landing-v2/PricingSection"));
const FAQSection = lazy(() => import("../components/landing-v2/FAQSection"));
const FinalCTABanner = lazy(() => import("../components/landing-v2/FinalCTABanner"));
const Footer = lazy(() => import("../components/layout/Footer"));

import SmoothLandingSection from "../components/landing-v2/SmoothLandingSection";

export default function LandingPage() {
  // Stagger pre-warming of below-the-fold chunks sequentially during idle time so main thread never hitches
  useEffect(() => {
    const chunkLoaders = [
      () => import("../components/landing-v2/PainPointsBentoSection"),
      () => import("../components/landing-v2/PlayfulColorfulBento"),
      () => import("../components/landing-v2/ScrollablePortfoliosSection"),
      () => import("../components/landing-v2/HowItWorksSection"),
      () => import("../components/landing-v2/ScrollSplitCardsSection"),
      () => import("../components/home/TestimonialsHomeSection"),
      () => import("../components/landing-v2/PricingSection"),
      () => import("../components/landing-v2/FAQSection"),
      () => import("../components/landing-v2/FinalCTABanner"),
      () => import("../components/layout/Footer"),
    ];

    let timerId;
    let index = 0;

    const loadNext = () => {
      if (index < chunkLoaders.length) {
        chunkLoaders[index]();
        index++;
        timerId = setTimeout(loadNext, 75);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(() => loadNext(), { timeout: 800 });
      return () => {
        window.cancelIdleCallback(handle);
        clearTimeout(timerId);
      };
    } else {
      timerId = setTimeout(loadNext, 350);
      return () => clearTimeout(timerId);
    }
  }, []);

  return (
    <>
      <SEO
        title="SmartNShine - #1 ATS Resume Builder, Developer Portfolio Maker & AI Interview Platform"
        description="Build 98%+ pass rate ATS resumes, generate stunning interactive developer portfolios from GitHub, check real-time ATS scores, and practice AI voice mock interviews. Free templates & instant export."
        keywords="ATS resume builder, free developer portfolio builder, portfolio maker, ATS score checker, Taleo resume checker, Workday resume format, software engineer portfolio, modern resume templates, AI bullet optimizer, free resume maker PDF, AI mock interview, GitHub portfolio generator"
        url="https://www.smartnshine.in/"
      />
      <FAQSchema faqs={SYSTEM_FAQS} />

      {/* 0. Sleek Floating Glassmorphic Top Navbar (Above the fold - Instant) */}
      <LandingNavbar />

      {/* 1. Hero Section Matrix (Above the fold - Instant) */}
      <EvilChartsLandingMatrix />

      {/* 2. Four Roadblocks Solved (Pain-Point Bento Grid) */}
      <SmoothLandingSection minHeight={850}>
        <PainPointsBentoSection />
      </SmoothLandingSection>

      {/* 3. Colorful Bento Grid — Platform Capabilities */}
      <SmoothLandingSection minHeight={850}>
        <PlayfulColorfulBento />
      </SmoothLandingSection>

      {/* 4. Live Scrollable Web Portfolios Showcase */}
      <SmoothLandingSection minHeight={750}>
        <ScrollablePortfoliosSection />
      </SmoothLandingSection>

      {/* 5. How It Works — 3-step visual flow */}
      <SmoothLandingSection minHeight={600}>
        <HowItWorksSection />
      </SmoothLandingSection>

      {/* 6. Interactive Scroll-Split Cards: 1 Web Portfolio ➔ 3 ATS Resumes */}
      <SmoothLandingSection minHeight={850}>
        <ScrollSplitCardsSection />
      </SmoothLandingSection>

      {/* 7. Testimonials — Real Social Proof */}
      <SmoothLandingSection minHeight={650}>
        <TestimonialsHomeSection />
      </SmoothLandingSection>

      {/* 8. Pricing — Real Tiers with Live Data */}
      <SmoothLandingSection minHeight={800} id="pricing">
        <PricingSection />
      </SmoothLandingSection>

      {/* 9. FAQ Accordion */}
      <SmoothLandingSection minHeight={650} id="faq">
        <FAQSection />
      </SmoothLandingSection>

      {/* 10. Final CTA Banner */}
      <SmoothLandingSection minHeight={450}>
        <FinalCTABanner />
      </SmoothLandingSection>

      {/* 11. Global Footer */}
      <SmoothLandingSection minHeight={350}>
        <Footer />
      </SmoothLandingSection>
    </>
  );
}

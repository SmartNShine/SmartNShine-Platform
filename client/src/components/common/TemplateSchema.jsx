import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";

export default function TemplateSchema({
  templates = [],
  activeCategory = "All",
  activeTemplate = null,
  customFaqs = [],
}) {
  const baseUrl = "https://www.smartnshine.in";

  // Standard high-intent Google FAQ Schema
  const defaultFaqs = [
    {
      question: "What is an ATS-compliant resume template?",
      answer:
        "An ATS-compliant resume template is formatted specifically to be parsed accurately by Applicant Tracking Systems (like Workday, Taleo, and Greenhouse) without missing text, unreadable tables, or graphic obstructions.",
    },
    {
      question: "Which resume template is best for professional job applications?",
      answer:
        "Clean single-column templates like Classic, Minimal, and Professional Elite offer the highest ATS pass rates (98%+) by clearly structuring work experience, core skills, and quantifiable achievements.",
    },
    {
      question: "Can I download and export ATS resumes in PDF format for free?",
      answer:
        "Yes, SmartNShine allows instant PDF resume generation with selectable color themes, automated section ordering, and real-time ATS score feedback.",
    },
    {
      question: "How do I choose between a 1-page vs 2-page resume template?",
      answer:
        "For candidates with less than 5 years of experience, a concise 1-page ATS template is recommended. For Senior Engineers, Managers, and Executives with extensive achievements, a structured 2-page template is optimal.",
    },
  ];

  const faqsToUse =
    customFaqs && customFaqs.length > 0
      ? customFaqs
      : activeTemplate?.seo?.faqItems?.length > 0
      ? activeTemplate.seo.faqItems
      : defaultFaqs;

  // 1. FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsToUse.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // 2. BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resume Templates",
        item: `${baseUrl}/templates`,
      },
      ...(activeCategory !== "All"
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: `${activeCategory} Resume Templates`,
              item: `${baseUrl}/templates?category=${activeCategory.toLowerCase()}`,
            },
          ]
        : []),
      ...(activeTemplate
        ? [
            {
              "@type": "ListItem",
              position: activeCategory !== "All" ? 4 : 3,
              name: `${activeTemplate.name} Resume Template`,
              item: `${baseUrl}/templates?template=${activeTemplate.templateId || activeTemplate.id}`,
            },
          ]
        : []),
    ],
  };

  // 3. ItemList Schema for Templates
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      activeCategory === "All"
        ? "Top ATS-Optimized Professional Resume Templates"
        : `${activeCategory} Professional Resume Templates`,
    description:
      "Collection of industry-standard, ATS-compliant resume formats engineered for high recruiter response rates.",
    numberOfItems: templates.length,
    itemListElement: templates.map((tpl, index) => {
      const templateIdentifier = String(tpl?.templateId || tpl?.id || "classic");
      const imgPath = `${baseUrl}/templates/${templateIdentifier.replace("-2", "2")}.webp`;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: `${tpl.name} ATS Resume Template`,
        description:
          tpl.description ||
          `High-impact ATS compliant ${tpl.category || "professional"} resume template with ${tpl.atsScore || 98}% compatibility.`,
        url: `${baseUrl}/templates?template=${tpl.templateId || tpl.id}`,
        image: {
          "@type": "ImageObject",
          contentUrl: imgPath,
          thumbnailUrl: imgPath,
          name: `Free ATS-Friendly ${tpl.name} Resume Template`,
          caption: `Free downloadable ATS-compliant ${tpl.name} resume template in PDF and Word format (${tpl.atsScore || 98}% pass score)`,
          encodingFormat: "image/webp",
          width: 600,
          height: 850,
        },
      };
    }),
  };

  // 4. Product / WebApplication Rating Schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: activeTemplate
      ? `${activeTemplate.name} ATS Resume Template`
      : "SmartNShine Professional ATS Resume Builder",
    operatingSystem: "All Web Browsers, Desktop & Mobile",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "199",
      offerCount: "3",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "12850",
      bestRating: "5",
      worstRating: "1",
    },
    creator: {
      "@type": "Organization",
      name: "SmartNShine",
      url: baseUrl,
    },
  };

  return (
    <Helmet>
      {/* FAQ Schema */}
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* Breadcrumbs Schema */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      {/* ItemList Templates Schema */}
      <script type="application/ld+json">
        {JSON.stringify(itemListSchema)}
      </script>

      {/* Product / Software Application Schema */}
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
}

TemplateSchema.propTypes = {
  templates: PropTypes.array,
  activeCategory: PropTypes.string,
  activeTemplate: PropTypes.object,
  customFaqs: PropTypes.array,
};

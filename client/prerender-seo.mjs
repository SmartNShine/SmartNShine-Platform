import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "dist");
const indexHtmlPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexHtmlPath)) {
  console.error("prerender-seo: index.html not found in dist. Run vite build first.");
  process.exit(1);
}

const templateHtml = fs.readFileSync(indexHtmlPath, "utf-8");

const routes = [
  {
    path: "templates",
    canonical: "https://www.smartnshine.in/templates",
    title: "Professional ATS Resume Templates - 98% Recruiter Pass Rate | SmartNShine",
    description: "Browse top-rated professional ATS resume templates for software engineers, executives, and freshers. Free templates & instant export."
  },
  {
    path: "tech-portfolio",
    canonical: "https://www.smartnshine.in/tech-portfolio",
    title: "Free 3D Interactive Developer Portfolio Builder - GitHub Synced | SmartNShine",
    description: "Generate a dark-mode interactive tech portfolio from your GitHub repositories and projects in 60 seconds."
  },
  {
    path: "smartnshine-portfolio",
    canonical: "https://www.smartnshine.in/smartnshine-portfolio",
    title: "SmartNShine Executive Personal Brand Portfolio Template | SmartNShine",
    description: "Clean executive developer portfolio template showcasing technical architecture, high-impact projects, and system achievements."
  },
  {
    path: "magazine-portfolio",
    canonical: "https://www.smartnshine.in/magazine-portfolio",
    title: "Editorial Magazine Portfolio Template for Creatives & Writers | SmartNShine",
    description: "Editorial high-craft magazine style portfolio layout designed for designers, technical writers, and creative technologists."
  },
  {
    path: "ats-analyzer",
    canonical: "https://www.smartnshine.in/ats-analyzer",
    title: "Free ATS Resume Checker & Compatibility Analyzer | SmartNShine",
    description: "Scan your resume against any job description for instant keyword gaps and ATS score breakdown."
  },
  {
    path: "careers",
    canonical: "https://www.smartnshine.in/careers",
    title: "Careers at SmartNShine - Join Our Team | SmartNShine",
    description: "Explore job openings and career opportunities at SmartNShine. Help build the future of AI career acceleration."
  },
  {
    path: "contact",
    canonical: "https://www.smartnshine.in/contact",
    title: "Contact Us & Support | SmartNShine",
    description: "Get in touch with the SmartNShine team for support, enterprise inquiries, partnership opportunities, or feedback."
  },
  {
    path: "pricing",
    canonical: "https://www.smartnshine.in/pricing",
    title: "Transparent Pricing - Resume Builder & AI Interview | SmartNShine",
    description: "Simple, transparent pricing. Free ATS resume builder, free developer portfolio maker, and premium AI interview preparation."
  }
];

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

let generatedCount = 0;

for (const route of routes) {
  let html = templateHtml;

  // Replace Title tag
  html = html.replace(
    /<title\s+data-rh="true">[\s\S]*?<\/title>/i,
    `<title data-rh="true">\n      ${escapeHtml(route.title)}\n    </title>`
  );

  // Replace name="title"
  html = html.replace(
    /<meta\s+data-rh="true"\s+name="title"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" name="title" content="${escapeHtml(route.title)}" />`
  );

  // Replace name="description"
  html = html.replace(
    /<meta\s+data-rh="true"\s+name="description"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" name="description" content="${escapeHtml(route.description)}" />`
  );

  // Replace canonical link
  html = html.replace(
    /<link\s+data-rh="true"\s+rel="canonical"\s+href="[\s\S]*?"\s*\/>/i,
    `<link data-rh="true" rel="canonical" href="${route.canonical}" />`
  );

  // Replace og:url
  html = html.replace(
    /<meta\s+data-rh="true"\s+property="og:url"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" property="og:url" content="${route.canonical}" />`
  );

  // Replace og:title
  html = html.replace(
    /<meta\s+data-rh="true"\s+property="og:title"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" property="og:title" content="${escapeHtml(route.title)}" />`
  );

  // Replace og:description
  html = html.replace(
    /<meta\s+data-rh="true"\s+property="og:description"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(route.description)}" />`
  );

  // Replace twitter:url
  html = html.replace(
    /<meta\s+data-rh="true"\s+name="twitter:url"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" name="twitter:url" content="${route.canonical}" />`
  );

  // Replace twitter:title
  html = html.replace(
    /<meta\s+data-rh="true"\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(route.title)}" />`
  );

  // Replace twitter:description
  html = html.replace(
    /<meta\s+data-rh="true"\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/>/i,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(route.description)}" />`
  );

  // Write route.html
  const flatHtmlPath = path.join(distDir, `${route.path}.html`);
  fs.writeFileSync(flatHtmlPath, html, "utf-8");

  // Write route/index.html
  const routeDir = path.join(distDir, route.path);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  const nestedHtmlPath = path.join(routeDir, "index.html");
  fs.writeFileSync(nestedHtmlPath, html, "utf-8");

  generatedCount++;
}

console.log(`prerender-seo: successfully generated ${generatedCount} static route shells with exact canonicals and metadata.`);

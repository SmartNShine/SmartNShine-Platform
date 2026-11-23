import { resolveImageUrl } from "@/utils/imageUrlResolver";

const hasItems = (items) => Array.isArray(items) && items.length > 0;

const DEFAULT_SECTION_ORDER = [
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certifications",
  "achievements",
  "customSections",
  "contact",
];

const normalizeSections = (sections = {}) => ({
  showAbout: sections.showAbout !== false,
  showSkills: sections.showSkills !== false,
  showProjects: sections.showProjects !== false,
  showExperience: sections.showExperience !== false,
  showEducation: sections.showEducation !== false,
  showCertifications: sections.showCertifications !== false,
  showAchievements: sections.showAchievements !== false,
  showCustomSections: sections.showCustomSections !== false,
  showContact: sections.showContact !== false,
});

const getDateRange = (item = {}) => {
  const start = item.startDate || "";
  const end = item.current ? "Present" : item.endDate || "";

  return [start, end].filter(Boolean).join(" - ");
};

const pickArray = (primary, fallback) => {
  if (Array.isArray(primary) && primary.length > 0) return primary;
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  return primary || fallback || [];
};

export const categorizeSkillsSmartly = (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) return [];

  let allSkillStrings = [];
  let existingCategories = [];

  skills.forEach((entry) => {
    if (typeof entry === "string" && entry.trim()) {
      allSkillStrings.push(entry.trim());
    } else if (entry && typeof entry === "object") {
      const cat = (entry.category || entry.name || "").trim();
      const items = Array.isArray(entry.items)
        ? entry.items
        : Array.isArray(entry.skills)
        ? entry.skills
        : typeof entry.skills === "string"
        ? entry.skills.split(",")
        : [];

      const cleanItems = items
        .flatMap((it) => (typeof it === "string" ? it.split(",") : [it?.name || String(it)]))
        .map((x) => (typeof x === "string" ? x.trim() : String(x).trim()))
        .filter(Boolean);

      if (cat && cleanItems.length > 0) {
        existingCategories.push({ category: cat, items: cleanItems });
      }
      cleanItems.forEach((it) => allSkillStrings.push(it));
    }
  });

  const isGenericCategory = (cat) =>
    !cat ||
    ["skills", "technical skills", "capabilities", "core technologies", "general", "other", "key skills"].includes(
      cat.toLowerCase().trim()
    );

  // If user already provided 2+ distinct non-generic categories, preserve them
  if (
    existingCategories.length >= 2 &&
    existingCategories.some((c) => !isGenericCategory(c.category))
  ) {
    return existingCategories;
  }

  // Domain classification rules
  const rules = [
    {
      category: "Languages & Core",
      patterns: [
        /\bjava\b/i, /\bjavascript\b/i, /\bjs\b/i, /\btypescript\b/i, /\bts\b/i,
        /\bpython\b/i, /\bc\+\+\b/i, /\bc#\b/i, /\bgolang\b/i, /\bgo\b/i,
        /\brust\b/i, /\bruby\b/i, /\bphp\b/i, /\bswift\b/i, /\bkotlin\b/i,
        /\bdart\b/i, /\bscala\b/i, /\br\b/i, /\bperl\b/i, /\bshell\b/i, /\bbash\b/i
      ],
    },
    {
      category: "Frontend & UI Architecture",
      patterns: [
        /\breact/i, /\bnext(\.js)?\b/i, /\bvue/i, /\bangular/i, /\bsvelte/i,
        /\bhtml/i, /\bcss/i, /\btailwind/i, /\bbootstrap/i, /\bredux/i,
        /\bmobx/i, /\bsass\b/i, /\bscss\b/i, /\bui\b/i, /\bux\b/i,
        /\bresponsive design/i, /\bweb design/i, /\bfigma/i, /\bmaterial ui/i,
        /\bmui\b/i, /\bchakra/i, /\bvite\b/i, /\bwebpack\b/i, /\bfrontend/i
      ],
    },
    {
      category: "Backend & APIs",
      patterns: [
        /\bnode(\.js)?\b/i, /\bexpress(\.js)?\b/i, /\bnest(\.js)?\b/i,
        /\bdjango/i, /\bflask/i, /\bfastapi/i, /\bspring/i, /\blaravel/i,
        /\brest/i, /\bapi/i, /\bgraphql/i, /\bgrpc/i,
        /\bsocket\.io/i, /\bwebsocket/i, /\bjwt/i, /\bauth/i, /\bmicroservices/i,
        /\bbackend/i
      ],
    },
    {
      category: "Databases & Cloud",
      patterns: [
        /\bsql\b/i, /\bmysql/i, /\bpostgres/i, /\bmongodb/i, /\bmongo/i,
        /\bredis/i, /\bsqlite/i, /\bprisma/i, /\btypeorm/i, /\bhibernate/i,
        /\bdatabase/i, /\bdbms\b/i, /\baws\b/i, /\bazure\b/i, /\bgcp\b/i,
        /\bcloud/i, /\bfirebase/i, /\bsupabase/i, /\bcloudflare/i
      ],
    },
    {
      category: "DevOps & Infrastructure",
      patterns: [
        /\bdocker/i, /\bkubernetes/i, /\bk8s/i, /\blinux/i, /\bubuntu/i,
        /\bnginx/i, /\bapache/i, /\bci\/cd/i, /\bdevops/i, /\bgithub actions/i,
        /\bjenkins/i, /\bterraform/i, /\bansible/i, /\bvps/i, /\bdeployment/i,
        /\bserver/i, /\bkafka/i, /\brabbitmq/i
      ],
    },
    {
      category: "CS Concepts & Tools",
      patterns: [
        /\bdata struct/i, /\balgorithm/i, /\bdsa\b/i, /\boop\b/i,
        /\bobject-oriented/i, /\boperating sys/i, /\bcomputer net/i,
        /\bnetworking/i, /\bsystem design/i, /\bcore concept/i,
        /\bgit\b/i, /\bgithub\b/i, /\bgitlab/i, /\bvs code\b/i, /\bvscode\b/i,
        /\bpostman/i, /\bnpm\b/i, /\byarn\b/i, /\bpnpm\b/i, /\bjira\b/i,
        /\bagile\b/i, /\btest/i, /\bjest\b/i, /\bcypress\b/i
      ],
    },
  ];

  const categorized = {};
  rules.forEach((r) => {
    categorized[r.category] = [];
  });
  const unclassified = [];

  const seen = new Set();
  allSkillStrings.forEach((skill) => {
    const sLower = skill.toLowerCase();
    if (seen.has(sLower)) return;
    seen.add(sLower);

    let placed = false;
    for (const rule of rules) {
      if (rule.patterns.some((p) => p.test(skill))) {
        categorized[rule.category].push(skill);
        placed = true;
        break;
      }
    }
    if (!placed) {
      unclassified.push(skill);
    }
  });

  if (unclassified.length > 0) {
    if (categorized["CS Concepts & Tools"].length > 0) {
      categorized["CS Concepts & Tools"].push(...unclassified);
    } else {
      categorized["Specialized Tools & Systems"] = unclassified;
    }
  }

  const result = Object.entries(categorized)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      category,
      items,
    }));

  return result.length > 0 ? result : [{ category: "Core Capabilities", items: allSkillStrings }];
};

const normalizeSkills = (skills = []) => {
  return categorizeSkillsSmartly(skills);
};

const normalizeProject = (project = {}) => {
  const liveUrl =
    project.links?.live ||
    project.liveUrl ||
    project.projectUrl ||
    project.demoUrl ||
    project.websiteUrl ||
    project.link ||
    project.url ||
    "";
  const githubUrl =
    project.links?.github ||
    project.githubUrl ||
    project.repoUrl ||
    project.repo ||
    project.github ||
    project.sourceCode ||
    "";
  const caseStudyUrl = project.links?.caseStudy || project.caseStudyUrl || "";

  const rawBullets =
    Array.isArray(project.bullets) && project.bullets.length > 0
      ? project.bullets
      : Array.isArray(project.highlights) && project.highlights.length > 0
      ? project.highlights
      : typeof project.description === "string" &&
        project.description.includes("\n")
      ? project.description
          .split("\n")
          .map((s) => s.replace(/^[-•*]\s*/, "").trim())
          .filter(Boolean)
      : [];

  return {
    ...project,
    id: project._id || project.id || project.title || project.name,
    title: project.title || project.name || "Untitled Project",
    description:
      project.shortDescription ||
      project.description ||
      project.longDescription ||
      rawBullets[0] ||
      "",
    longDescription:
      project.longDescription ||
      (rawBullets.length > 0 ? rawBullets.join("\n") : project.description || ""),
    problem: project.problem || "",
    solution: project.solution || "",
    impact: project.impact || "",
    technologies: Array.isArray(project.technologies)
      ? project.technologies
      : typeof project.technologies === "string"
      ? project.technologies.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    highlights: rawBullets,
    bullets: rawBullets,
    featured: Boolean(project.featured),
    links: {
      ...(project.links || {}),
      live: liveUrl,
      github: githubUrl,
      caseStudy: caseStudyUrl,
    },
    liveUrl,
    githubUrl,
    caseStudyUrl,
    image: (() => {
      const coverFromImages = Array.isArray(project.images)
        ? project.images.find((img) => img?.isCover && img?.url)?.url ||
          project.images.find((img) => img?.url)?.url
        : "";
      const uploaded = resolveImageUrl(
        coverFromImages || project.image || project.thumbnail || ""
      );
      if (uploaded) return uploaded;
      // Only fall back to live-site screenshot when no cover image exists.
      return liveUrl
        ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=1280`
        : "";
    })(),
    websitePreviewUrl: liveUrl
      ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=1280`
      : "",
    images: (project.images || []).map((img) =>
      typeof img === "string"
        ? { url: resolveImageUrl(img), alt: "", isCover: false }
        : { ...img, url: resolveImageUrl(img.url) }
    ),
  };
};

export const adaptPortfolioData = ({
  portfolio = {},
  resume = {},
  projects = [],
  mode = "public",
  onContactClick,
  onProjectClick,
  onResumeClick,
  resumeDownloadUrl,
} = {}) => {
  const sections = normalizeSections(portfolio.sections);
  const sectionOrder = [
    ...new Set([
      ...(Array.isArray(portfolio.sectionOrder) ? portfolio.sectionOrder : []),
      ...DEFAULT_SECTION_ORDER,
    ]),
  ].filter((section) => DEFAULT_SECTION_ORDER.includes(section));

  const candidateProjects =
    Array.isArray(projects) && projects.length > 0
      ? projects
      : Array.isArray(portfolio.projects) && portfolio.projects.length > 0
      ? portfolio.projects
      : Array.isArray(resume?.projects) && resume.projects.length > 0
      ? resume.projects
      : [];

  const visibleProjects = candidateProjects
    .filter((project) => project.visible !== false)
    .map(normalizeProject);

  const featuredProjects = visibleProjects.filter(
    (project) => project.featured
  );

  const rawSkills = pickArray(portfolio.skills, resume?.skills);
  const normalizedSkills = normalizeSkills(rawSkills);

  return {
    mode,
    portfolio,
    sections,
    sectionOrder,
    themeId: portfolio.themeId || "minimalDeveloper",
    themeAccent: portfolio.themeAccent || "",
    settings: portfolio.settings || {},
    profile: {
      name: resume?.name || portfolio.title || "Portfolio",
      title:
        portfolio.professionalTitle ||
        resume?.resumeTitle ||
        resume?.experience?.[0]?.title ||
        "",
      tagline: portfolio.tagline || resume?.summary || "",
      about: portfolio.about || resume?.summary || "",
      location: portfolio.location || resume?.contact?.location || "",
      email: portfolio.contact?.email || resume?.contact?.email || "",
      phone: portfolio.contact?.phone || resume?.contact?.phone || "",
      showEmail: portfolio.contact?.showEmail !== false,
      showPhone: Boolean(portfolio.contact?.showPhone),
      profileImage: resolveImageUrl(
        portfolio.profileImage || resume?.photo || ""
      ),
      heroImage: resolveImageUrl(portfolio.heroImage || ""),
    },
    links: (portfolio.socialLinks || []).filter((link) => link?.url),
    skills: normalizedSkills,
    projects: visibleProjects,
    featuredProjects: hasItems(featuredProjects)
      ? featuredProjects
      : visibleProjects.slice(0, 3),
    experience: pickArray(portfolio.experience, resume?.experience).map(
      (item) => {
        const rawBullets =
          Array.isArray(item.bullets) && item.bullets.length > 0
            ? item.bullets
            : Array.isArray(item.highlights) && item.highlights.length > 0
            ? item.highlights
            : Array.isArray(item.responsibilities) &&
              item.responsibilities.length > 0
            ? item.responsibilities
            : Array.isArray(item.contributions) &&
              item.contributions.length > 0
            ? item.contributions
            : typeof item.description === "string" &&
              item.description.includes("\n")
            ? item.description
                .split("\n")
                .map((s) => s.replace(/^[-•*]\s*/, "").trim())
                .filter(Boolean)
            : [];

        return {
          ...item,
          bullets: rawBullets,
          highlights: rawBullets,
          contributions: rawBullets,
          dateRange: getDateRange(item),
        };
      }
    ),
    education: pickArray(portfolio.education, resume?.education).map(
      (item) => ({
        ...item,
        institution:
          item.institution || item.school || item.university || "",
        degree:
          item.degree || item.fieldOfStudy || item.major || item.field || "",
        gpa:
          item.gpa ||
          item.cgpa ||
          item.grade ||
          item.percentage ||
          item.score ||
          "",
        grade:
          item.grade ||
          item.gpa ||
          item.cgpa ||
          item.percentage ||
          item.score ||
          "",
        cgpa:
          item.cgpa ||
          item.gpa ||
          item.grade ||
          item.percentage ||
          item.score ||
          "",
        location: item.location || "",
        dateRange: getDateRange(item) || item.year || item.dateRange || "",
      })
    ),
    certifications: pickArray(
      portfolio.certifications,
      resume?.certifications
    ),
    achievements: pickArray(portfolio.achievements, resume?.achievements),
    customSections: pickArray(
      portfolio.customSections,
      resume?.customSections
    ).map((section, sectionIndex) => {
      const items = Array.isArray(section?.items)
        ? section.items.map((item, itemIndex) => {
            if (typeof item === "string") {
              return {
                id: `custom-item-${sectionIndex}-${itemIndex}`,
                title: item,
                subtitle: "",
                date: "",
                link: "",
                description: "",
                image: "",
                bullets: [],
              };
            }

            if (!item || typeof item !== "object") return item;

            return {
              ...item,
              id: item.id || `custom-item-${sectionIndex}-${itemIndex}`,
              title: item.title || item.name || "",
              subtitle:
                item.subtitle ||
                item.organization ||
                item.issuer ||
                item.publisher ||
                "",
              date: item.date || "",
              link: item.link || item.url || "",
              description: item.description || "",
              image: resolveImageUrl(
                item.image || item.imageUrl || item.thumbnail || ""
              ),
              bullets: Array.isArray(item.bullets)
                ? item.bullets
                    .map((b) => (typeof b === "string" ? b : b?.text || ""))
                    .filter(Boolean)
                : [],
            };
          })
        : [];

      return {
        ...section,
        id: section?.id || `custom-${sectionIndex}`,
        title: section?.title || "",
        content: section?.content || "",
        items,
      };
    }),
    actions: {
      onContactClick,
      onProjectClick,
      onResumeClick,
      resumeDownloadUrl,
    },
  };
};

export default adaptPortfolioData;

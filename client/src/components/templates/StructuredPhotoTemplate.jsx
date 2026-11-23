import {forwardRef, useEffect, useMemo, useRef} from "react";
import { getResumeSocialLinks } from "@/utils/resumeSocialLinks";
import {formatEducationDegreeAndField} from "./templateUtils";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Instagram,
  ExternalLink,
} from "lucide-react";

const COLOR_THEMES = {
  coral: {
    primary: "#2f678e",
    heading: "#1f2433",
    accent: "#e05c5c",
    chipBg: "#9db5c9",
    chipText: "#f8fbff",
    marker: "#e05c5c",
    border: "#cfd9e2",
    text: "#1a1a2e",
    textMuted: "#4a5568",
    background: "#ffffff",
  },
  terracotta: {
    primary: "#2f678e",
    heading: "#1f2433",
    accent: "#d9694f",
    chipBg: "#9db5c9",
    chipText: "#f8fbff",
    marker: "#d9694f",
    border: "#cfd9e2",
    text: "#1f2230",
    textMuted: "#4b5563",
    background: "#ffffff",
  },
  rose: {
    primary: "#2f678e",
    heading: "#1f2433",
    accent: "#db5d74",
    chipBg: "#9db5c9",
    chipText: "#f8fbff",
    marker: "#db5d74",
    border: "#cfd9e2",
    text: "#1a1f2c",
    textMuted: "#4c5564",
    background: "#ffffff",
  },
};

const FIXED_LEFT_SECTIONS = ["experience", "projects"];
const FIXED_RIGHT_SECTIONS = ["hardSkills", "softSkills"];
const FLEX_LEFT_SECTIONS = ["education", "achievements", "customSections"];
const FLEX_RIGHT_SECTIONS = [];

const StructuredPhotoTemplate = forwardRef(({resumeData, onPageUsageChange}, ref) => {
  const containerRef = useRef(null);
  const lastHeightRef = useRef(0);
  const onPageUsageChangeRef = useRef(onPageUsageChange);
  onPageUsageChangeRef.current = onPageUsageChange;
  const data = resumeData || {};

  useEffect(() => {
    if (!containerRef.current || !onPageUsageChangeRef.current) return;
    const currentHeight = containerRef.current.scrollHeight;
    if (Math.abs(lastHeightRef.current - currentHeight) < 2) return;
    lastHeightRef.current = currentHeight;

    const maxHeight = 1123;
    const isOverflowing = currentHeight > maxHeight;
    const overflowPercentage = isOverflowing
      ? Math.round(((currentHeight - maxHeight) / maxHeight) * 100)
      : 0;

    onPageUsageChangeRef.current({
      isOverflowing,
      currentHeight,
      maxHeight,
      overflowPercentage,
      percentage: Math.round((currentHeight / maxHeight) * 100),
      templateName: "StructuredPhotoTemplate",
    });
  }, [resumeData]);

  const theme =
    COLOR_THEMES[data?.selectedTheme || data?.colorTheme] || COLOR_THEMES.coral;

  const skills = Array.isArray(data.skills) ? data.skills : [];
  const hardSkills = skills.filter(
    (group) => !/soft/i.test(group?.category || "")
  );
  const softSkills = skills.filter((group) => /soft/i.test(group?.category || ""));
  const allSoftSkillItems = softSkills.flatMap((group) =>
    Array.isArray(group?.items) ? group.items : []
  );

  const name =
    data?.name || data?.personalInfo?.name || data?.personalInfo?.fullName || "Your Name";
  const title =
    data?.title || data?.jobTitle || data?.personalInfo?.title || "Professional Title";
  const contact = data?.contact || data?.personalInfo?.contact || {};

  const dense = useMemo(() => {
    if (data?.density === "compact" || data?.density === "high") return true;
    if (data?.density === "spacious" || data?.density === "low") return false;

    let score = 0;
    score += (data?.experience?.length || 0) * 3;
    score += (data?.projects?.length || 0) * 2;
    score += (data?.education?.length || 0) * 1.5;
    score += (data?.achievements?.length || 0) * 1;
    score += (skills.length || 0) * 1.2;
    if ((data?.summary || "").length > 260) score += 2;
    return score >= 22;
  }, [data, skills.length]);

  const sectionGap = dense ? "9px" : "12px";
  const itemGap = dense ? "6px" : "9px";

  const sectionTitleStyle = {
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: theme.heading || theme.text,
    margin: "0 0 6px 0",
  };

  const contactItems = [
    {
      key: "email",
      label: contact.email,
      icon: Mail,
      href: contact.email ? `mailto:${contact.email}` : null,
    },
    {key: "phone", label: contact.phone, icon: Phone, href: null},
    {key: "location", label: contact.location, icon: MapPin, href: null},
    {
      key: "portfolio",
      label: contact.portfolio || contact.website,
      icon: Globe,
      href: contact.portfolio || contact.website
        ? (contact.portfolio || contact.website).startsWith("http")
          ? contact.portfolio || contact.website
          : `https://${contact.portfolio || contact.website}`
        : null,
    },
    {
      key: "linkedin",
      label: contact.linkedin,
      icon: Linkedin,
      href: contact.linkedin
        ? contact.linkedin.startsWith("http")
          ? contact.linkedin
          : `https://${contact.linkedin}`
        : null,
    },
    {
      key: "instagram",
      label: contact.instagram,
      icon: Instagram,
      href: contact.instagram
        ? contact.instagram.startsWith("http")
          ? contact.instagram
          : `https://${contact.instagram}`
        : null,
    },
    ...getResumeSocialLinks(contact).map((link) => ({ ...link, key: link.href })),
  ].filter((item) => item.label);

  const renderBullets = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <ul
        style={{
          margin: "4px 0 0 16px",
          padding: 0,
          lineHeight: "1.35",
          fontSize: "11.5px",
        }}
      >
        {items.map((item, index) => (
          <li key={index} style={{marginBottom: dense ? "2px" : "3px"}}>
            {item}
          </li>
        ))}
      </ul>
    );
  };

  const renderExperience = () => {
    if (!Array.isArray(data.experience) || data.experience.length === 0) return null;

    return (
      <section style={{marginBottom: sectionGap}}>
        <h2 style={sectionTitleStyle}>Work Experience</h2>
        {data.experience.map((exp, index) => (
          <div key={index} style={{marginBottom: itemGap, position: "relative"}}>
            <div>
                <div style={{fontSize: "13px", fontWeight: 700, color: theme.primary}}>
                  {exp.title || "Role"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.heading || theme.text,
                    marginBottom: "1px",
                  }}
                >
                  <span style={{fontWeight: 500}}>{exp.company || "Company"}</span>{" "}
                  {(exp.companyUrl || exp.link) && (
                    <a
                      href={exp.companyUrl || exp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{color: theme.accent, verticalAlign: "middle"}}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div style={{fontSize: "11px", fontStyle: "italic", color: theme.accent}}>
                  {exp.startDate || ""}
                  {exp.startDate || exp.endDate ? " - " : ""}
                  {exp.current ? "Present" : exp.endDate || ""}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontStyle: "italic",
                    color: theme.accent,
                    marginTop: "1px",
                  }}
                >
                  Achievements
                </div>
                {renderBullets(exp.bullets || exp.achievements || [])}
            </div>
          </div>
        ))}
      </section>
    );
  };

  const renderEducation = () => {
    if (!Array.isArray(data.education) || data.education.length === 0) return null;

    return (
      <section style={{marginBottom: sectionGap}}>
        <h2 style={sectionTitleStyle}>Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} style={{marginBottom: itemGap, position: "relative"}}>
            <div>
                <div
                  style={{fontSize: "13px", fontWeight: 700, color: theme.heading || theme.text}}
                >
                  {formatEducationDegreeAndField(edu) || "Degree"}
                </div>
                <div style={{fontSize: "12px", color: theme.heading || theme.text}}>
                  {edu.institution || "Institution"}
                </div>
                <div style={{fontSize: "11px", fontStyle: "italic", color: theme.accent}}>
                  {edu.startDate || ""}
                  {edu.startDate || edu.endDate ? " - " : ""}
                  {edu.endDate || ""}
                </div>
            </div>
          </div>
        ))}
      </section>
    );
  };

  const renderProjects = () => {
    if (!Array.isArray(data.projects) || data.projects.length === 0) return null;

    return (
      <section style={{marginBottom: sectionGap}}>
        <h2 style={sectionTitleStyle}>Projects</h2>
        {data.projects.map((project, index) => (
          <div key={index} style={{marginBottom: itemGap}}>
            <div
              style={{fontSize: "13px", fontWeight: 700, color: theme.heading || theme.text}}
            >
              {project.name || "Project"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
              {(project.link || project.url || project.liveUrl) && (
                <a
                  href={(project.link || project.url || project.liveUrl).startsWith("http") ? (project.link || project.url || project.liveUrl) : `https://${project.link || project.url || project.liveUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: theme.accent,
                    fontSize: "11px",
                    textDecoration: "underline",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {(project.link || project.url || project.liveUrl).replace(/^https?:\/\//, "")}
                  <ExternalLink size={12} />
                </a>
              )}
              {(project.github || project.githubUrl) && (
                <a
                  href={(project.github || project.githubUrl).startsWith("http") ? (project.github || project.githubUrl) : `https://${project.github || project.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: theme.accent,
                    fontSize: "11px",
                    textDecoration: "underline",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {(project.github || project.githubUrl).replace(/^https?:\/\/(www\.)?github\.com\//i, "gh/").replace(/^https?:\/\//, "")}
                  <Github size={12} />
                </a>
              )}
            </div>
            {project.technologies && (
              <div style={{fontSize: "11px", color: theme.textMuted, marginTop: "1px"}}>
                {Array.isArray(project.technologies)
                  ? project.technologies.join(", ")
                  : project.technologies}
              </div>
            )}
            {renderBullets(project.bullets || [])}
          </div>
        ))}
      </section>
    );
  };

  const renderAchievements = () => {
    if (!Array.isArray(data.achievements) || data.achievements.length === 0) return null;

    return (
      <section style={{marginBottom: sectionGap}}>
        <h2 style={sectionTitleStyle}>Achievements</h2>
        {renderBullets(
          data.achievements.map((item) =>
            typeof item === "string" ? item : item.title || item.description || "Achievement"
          )
        )}
      </section>
    );
  };

  const renderSkillChips = (groups, fallbackTitle) => {
    if (!Array.isArray(groups) || groups.length === 0) return null;

    const chips = groups.flatMap((group) => {
      const items = Array.isArray(group.items) ? group.items : [];
      return items.map((item) => ({
        label: item,
        group: group.category || fallbackTitle,
      }));
    });

    if (chips.length === 0) return null;

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
        }}
      >
        {chips.map((chip, index) => (
          <span
            key={`${chip.label}-${index}`}
            style={{
              backgroundColor: theme.chipBg,
              color: theme.chipText,
              fontSize: "11px",
              borderRadius: "6px",
              padding: dense ? "2px 7px" : "3px 8px",
              lineHeight: 1.2,
            }}
          >
            {chip.label}
          </span>
        ))}
      </div>
    );
  };

  function hasSectionContent(sectionId) {
    if (sectionId === "experience") {
      return Array.isArray(data.experience) && data.experience.length > 0;
    }
    if (sectionId === "projects") {
      return Array.isArray(data.projects) && data.projects.length > 0;
    }
    if (sectionId === "education") {
      return Array.isArray(data.education) && data.education.length > 0;
    }
    if (sectionId === "achievements") {
      return Array.isArray(data.achievements) && data.achievements.length > 0;
    }
    if (sectionId === "hardSkills") {
      return hardSkills.some((group) => Array.isArray(group?.items) && group.items.length > 0);
    }
    if (sectionId === "softSkills") {
      return allSoftSkillItems.length > 0;
    }
    if (sectionId === "customSections") {
      return Array.isArray(data.customSections) && data.customSections.length > 0;
    }
    return false;
  }

  function estimateSectionHeight(sectionId) {
    if (sectionId === "experience") {
      return (data.experience || []).reduce(
        (sum, exp) => sum + 70 + (exp?.bullets?.length || 0) * 20,
        0
      );
    }
    if (sectionId === "projects") {
      return (data.projects || []).reduce(
        (sum, project) => sum + 60 + (project?.bullets?.length || 0) * 18,
        0
      );
    }
    if (sectionId === "education") {
      return (data.education?.length || 0) * 70;
    }
    if (sectionId === "achievements") {
      return 40 + (data.achievements?.length || 0) * 18;
    }
    if (sectionId === "hardSkills") {
      const total = hardSkills.reduce(
        (sum, group) => sum + (group?.items?.length || 0),
        0
      );
      return 70 + total * 10;
    }
    if (sectionId === "softSkills") {
      return 60 + allSoftSkillItems.length * 12;
    }
    if (sectionId === "customSections") {
      return (data.customSections || []).reduce(
        (sum, sec) => sum + 40 + (sec?.items?.length || 1) * 25,
        0
      );
    }
    return 0;
  }

  const columnPlan = useMemo(() => {
    const leftSectionIds = FIXED_LEFT_SECTIONS.filter(hasSectionContent);
    const rightSectionIds = FIXED_RIGHT_SECTIONS.filter(hasSectionContent);

    let leftHeight = leftSectionIds.reduce(
      (sum, sectionId) => sum + estimateSectionHeight(sectionId),
      0
    );
    let rightHeight = rightSectionIds.reduce(
      (sum, sectionId) => sum + estimateSectionHeight(sectionId),
      0
    );

    const flexSections = [
      ...FLEX_LEFT_SECTIONS.map((id) => ({id, preferred: "left"})),
      ...FLEX_RIGHT_SECTIONS.map((id) => ({id, preferred: "right"})),
    ];

    flexSections.forEach(({id, preferred}) => {
      if (!hasSectionContent(id)) return;

      const weight = estimateSectionHeight(id);
      const leftLead = leftHeight - rightHeight;
      const rightLead = rightHeight - leftHeight;

      let placeOnLeft = preferred === "left";

      if (preferred === "left" && leftLead > 130) {
        placeOnLeft = false;
      }

      if (preferred === "right" && rightLead > 130) {
        placeOnLeft = true;
      }

      if (Math.abs(leftHeight - rightHeight) > 220) {
        placeOnLeft = leftHeight < rightHeight;
      }

      if (placeOnLeft) {
        leftSectionIds.push(id);
        leftHeight += weight;
      } else {
        rightSectionIds.push(id);
        rightHeight += weight;
      }
    });

    return {leftSectionIds, rightSectionIds};
  }, [data, hardSkills, allSoftSkillItems, contact.website]);

  const renderSectionById = (sectionId) => {
    if (sectionId === "experience") return renderExperience();
    if (sectionId === "education") return renderEducation();
    if (sectionId === "projects") return renderProjects();
    if (sectionId === "achievements") return renderAchievements();

    if (sectionId === "hardSkills") {
      const chips = renderSkillChips(hardSkills, "Hard Skills");
      if (!chips) return null;
      return (
        <section key="hardSkills" style={{marginBottom: sectionGap}}>
          <h2 style={sectionTitleStyle}>Hard Skills</h2>
          {chips}
        </section>
      );
    }

    if (sectionId === "softSkills") {
      const softGroups =
        allSoftSkillItems.length > 0
          ? [{category: "Soft Skills", items: allSoftSkillItems}]
          : [];
      const chips = renderSkillChips(softGroups, "Soft Skills");
      if (!chips) return null;
      return (
        <section key="softSkills" style={{marginBottom: sectionGap}}>
          <h2 style={sectionTitleStyle}>Soft Skills</h2>
          {chips}
        </section>
      );
    }

    if (sectionId === "customSections" && data.customSections?.length > 0) {
      return (
        <div key="customSections">
          {data.customSections.map((sec, sIdx) => {
            const items = Array.isArray(sec.items) ? sec.items : [];
            return (
              <section key={sIdx} style={{ marginBottom: sectionGap }}>
                <h2 style={sectionTitleStyle}>{sec.title || "Additional Information"}</h2>
                {sec.content && (
                  <p style={{ margin: "0 0 6px 0", fontSize: "11.5px", color: theme.text, lineHeight: 1.4 }}>
                    {sec.content}
                  </p>
                )}
                {items.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {items.map((rawItem, iIdx) => {
                      const isStructured = rawItem && typeof rawItem === "object";
                      const itemTitle = isStructured ? (rawItem.title || rawItem.name || "") : rawItem;
                      const subtitle = isStructured ? (rawItem.subtitle || rawItem.organization || rawItem.issuer || rawItem.publisher || "") : "";
                      const date = isStructured ? (rawItem.date || "") : "";
                      const link = isStructured ? (rawItem.link || rawItem.url || "") : "";
                      const description = isStructured ? (rawItem.description || "") : "";
                      const bullets = isStructured && Array.isArray(rawItem.bullets) ? rawItem.bullets.filter(Boolean) : [];

                      if (!isStructured || (!subtitle && !date && !link && bullets.length === 0 && !description)) {
                        return (
                          <ul key={iIdx} style={{ margin: "2px 0 0 0", paddingLeft: "16px", listStyleType: "disc" }}>
                            <li style={{ fontSize: "11.5px", color: theme.text, lineHeight: 1.4 }}>
                              {typeof itemTitle === "string" ? itemTitle : ""}
                            </li>
                          </ul>
                        );
                      }

                      return (
                        <div key={iIdx} style={{ marginBottom: "3px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                              {itemTitle && (
                                <span style={{ fontWeight: 700, fontSize: "11.5px", color: theme.primary }}>
                                  {itemTitle}
                                </span>
                              )}
                              {subtitle && (
                                <span style={{ fontSize: "11px", color: theme.accent, fontStyle: "italic" }}>
                                  · {subtitle}
                                </span>
                              )}
                              {link && (
                                <a
                                  href={link.startsWith("http") ? link : `https://${link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: "10.5px", color: theme.primary, textDecoration: "underline" }}
                                >
                                  [link]
                                </a>
                              )}
                            </div>
                            {date && (
                              <span style={{ fontSize: "10.5px", color: theme.textMuted || "#666", whiteSpace: "nowrap" }}>
                                {date}
                              </span>
                            )}
                          </div>
                          {description && (
                            <p style={{ margin: "1px 0 2px 0", fontSize: "11px", color: theme.text, lineHeight: 1.35 }}>
                              {description}
                            </p>
                          )}
                          {bullets.length > 0 && (
                            <ul style={{ margin: "1px 0 0 0", paddingLeft: "16px", listStyleType: "disc" }}>
                              {bullets.map((b, bIdx) => (
                                <li key={bIdx} style={{ fontSize: "11px", color: theme.text, lineHeight: 1.35, marginBottom: "1px" }}>
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="resume-preview"
      style={{
        padding: dense ? "0.36in" : "0.45in",
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: '"Lato", "Avenir Next", "Segoe UI", "Calibri", sans-serif',
        lineHeight: 1.5,
      }}
    >
      <header
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "12px",
          alignItems: "start",
          marginBottom: sectionGap,
        }}
      >
        <div>
          <h1
            style={{
              margin: "0",
              fontSize: dense ? "23px" : "26px",
              lineHeight: 1.1,
              color: theme.primary,
              fontWeight: 800,
            }}
          >
            {name}
          </h1>
          <div
            style={{
              marginTop: "4px",
              fontSize: dense ? "16px" : "18px",
              color: theme.accent,
              fontWeight: 500,
            }}
          >
            {title}
          </div>
          {data.summary && (
            <p
              style={{
                margin: "7px 0 0 0",
                fontSize: "11.5px",
                color: theme.text,
                maxWidth: "92%",
                lineHeight: 1.38,
              }}
            >
              {data.summary}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: dense ? "2px" : "4px",
            fontSize: "11px",
          }}
        >
          {contactItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  color: theme.heading || theme.text,
                }}
              >
                <span>{item.label}</span>
                <Icon size={13} color={theme.accent} strokeWidth={2} />
              </span>
            );

            if (!item.href) {
              return <div key={item.key}>{content}</div>;
            }

            return (
              <a
                key={item.key}
                href={item.href}
                target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                style={{textDecoration: "none"}}
              >
                {content}
              </a>
            );
          })}
        </div>
      </header>

      <div style={{borderTop: `1px solid ${theme.primary}`, marginBottom: sectionGap}} />

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "62% 38%",
          gap: dense ? "12px" : "16px",
          alignItems: "start",
        }}
      >
        <div>
          {columnPlan.leftSectionIds.map((sectionId) => (
            <div key={`left-${sectionId}`}>{renderSectionById(sectionId)}</div>
          ))}
        </div>

        <div>
          {columnPlan.rightSectionIds.map((sectionId) => (
            <div key={`right-${sectionId}`}>{renderSectionById(sectionId)}</div>
          ))}
        </div>
      </main>
    </div>
  );
});

StructuredPhotoTemplate.displayName = "StructuredPhotoTemplate";

export default StructuredPhotoTemplate;

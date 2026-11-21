import React, { forwardRef, useRef, useEffect, useState, useMemo } from "react";
import {
  isDescriptionDuplicatedInBullets,
  formatEducationDegreeAndField,
  cleanBulletText,
} from "./templateUtils";

/**
 * Professional2Template - Premium ATS-Optimized Resume Template
 *
 * Key Features:
 * - 95%+ ATS Compatibility Score
 * - Clean, scannable layout with optimal white space
 * - Dynamic content density (3 modes: low, medium, high)
 * - Page overflow tracking and warnings
 * - 6 professional color themes
 * - All resume sections supported
 * - Inline styles for consistent rendering
 * - Proper bullet point formatting
 * - Contact information prominence
 * - Section headers with visual hierarchy
 */

const Professional2Template = forwardRef((props, ref) => {
  const { resumeData, scale = 1, onPageUsageChange } = props;
  const contentRef = useRef(null);
  const [pages, setPages] = useState([]);

  // Color Themes - Professional ATS-friendly palettes
  const colorThemes = {
    royalSapphire: {
      primary: "#1d4ed8",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#1d4ed8",
    },
    emeraldPrestige: {
      primary: "#047857",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#047857",
    },
    cabernetBurgundy: {
      primary: "#831843",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#831843",
    },
    nordicTeal: {
      primary: "#0f766e",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#0f766e",
    },
    titaniumSlate: {
      primary: "#1e293b",
      text: "#1e293b",
      textLight: "#475569",
      textMuted: "#64748b",
      border: "#cbd5e1",
      linkColor: "#1e293b",
    },
    warmTerracotta: {
      primary: "#c2410c",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#c2410c",
    },
    navy: {
      primary: "#1e3a8a",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#2563eb",
    },
    burgundy: {
      primary: "#7f1d1d",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#991b1b",
    },
    forest: {
      primary: "#14532d",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#15803d",
    },
    charcoal: {
      primary: "#1f2937",
      text: "#111827",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#374151",
    },
    slate: {
      primary: "#334155",
      text: "#1e293b",
      textLight: "#475569",
      textMuted: "#64748b",
      border: "#cbd5e1",
      linkColor: "#475569",
    },
    teal: {
      primary: "#115e59",
      text: "#1f2937",
      textLight: "#4b5563",
      textMuted: "#6b7280",
      border: "#cbd5e1",
      linkColor: "#0f766e",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.selectedTheme] ||
    colorThemes[resumeData?.colorTheme] ||
    colorThemes.royalSapphire ||
    colorThemes.navy;

  // Calculate content density for dynamic styling - Memoized to prevent recalculation on every render
  const contentDensity = useMemo(() => {
    if (resumeData?.density === "compact" || resumeData?.density === "high") return 35;
    if (resumeData?.density === "spacious" || resumeData?.density === "low") return 10;
    if (resumeData?.density === "medium") return 20;

    let score = 0;

    // Experience scoring (3 points + 1 per bullet)
    if (resumeData?.experience?.length > 0) {
      resumeData.experience.forEach((exp) => {
        score += 3;
        if (exp.bullets?.length > 0) {
          score += exp.bullets.length;
        }
        if (exp.description) score += 2;
        if (exp.achievements?.length > 0) {
          score += exp.achievements.length;
        }
      });
    }

    // Projects scoring (2 points + bullets)
    if (resumeData?.projects?.length > 0) {
      resumeData.projects.forEach((proj) => {
        score += 2;
        if (proj.bullets?.length > 0) {
          score += proj.bullets.length;
        }
        if (proj.description) score += 1;
      });
    }

    // Other sections
    if (resumeData?.education?.length > 0) {
      score += resumeData.education.length * 2;
    }
    if (resumeData?.skills?.length > 0) {
      score += resumeData.skills.length * 1.5;
    }
    if (resumeData?.certifications?.length > 0) {
      score += resumeData.certifications.length;
    }
    if (resumeData?.achievements?.length > 0) {
      score += resumeData.achievements.length;
    }
    if (resumeData?.languages?.length > 0) {
      score += resumeData.languages.length * 0.5;
    }
    if (resumeData?.volunteer?.length > 0) {
      score += resumeData.volunteer.length * 1.5;
    }
    if (resumeData?.customSections?.length > 0) {
      resumeData.customSections.forEach((sec) => {
        score += 2;
        if (sec.items?.length > 0) {
          score += sec.items.length * 1.5;
          sec.items.forEach((item) => {
            if (item?.bullets?.length > 0) {
              score += item.bullets.length;
            }
          });
        }
      });
    }
    if (resumeData?.summary && resumeData.summary.length > 150) {
      score += 3;
    } else if (resumeData?.summary) {
      score += 2;
    }

    return score;
  }, [resumeData]);

  // Dynamic styles based on content density
  const getDynamicStyles = () => {
    // LOW DENSITY: < 15 points (spacious layout)
    if (contentDensity < 15) {
      return {
        // Page margins - further reduced
        pageMarginTop: "22px",
        pageMarginBottom: "22px",
        pageMarginLeft: "36px",
        pageMarginRight: "36px",

        // Header - larger font
        nameSize: "38px",
        nameMarginBottom: "6px",
        contactSize: "12px",
        contactGap: "10px",
        contactMarginBottom: "14px",

        // Section headings - larger font
        sectionHeadingSize: "18px",
        sectionHeadingMarginBottom: "7px",
        sectionHeadingPaddingBottom: "3px",
        sectionMarginBottom: "14px",

        // Summary - larger font
        summarySize: "12px",
        summaryLineHeight: "1.4",

        // Experience - larger font
        experienceTitleSize: "14px",
        experienceCompanySize: "13px",
        experienceDateSize: "11.5px",
        experienceLocationSize: "11.5px",
        experienceMarginBottom: "11px",
        experienceBulletSize: "12px",
        experienceBulletMarginBottom: "2.5px",
        experienceBulletLineHeight: "1.4",

        // Projects - larger font
        projectTitleSize: "13.5px",
        projectTechSize: "11.5px",
        projectLinkSize: "11px",
        projectMarginBottom: "10px",
        projectBulletSize: "12px",
        projectBulletMarginBottom: "2.5px",
        projectBulletLineHeight: "1.4",
        projectTechMarginBottom: "3px",

        // Education - larger font
        educationDegreeSize: "13.5px",
        educationInstitutionSize: "12.5px",
        educationDateSize: "11.5px",
        educationMarginBottom: "10px",
        educationGpaSize: "11.5px",

        // Skills - larger font
        skillCategorySize: "12.5px",
        skillItemSize: "12px",
        skillMarginBottom: "8px",

        // Certifications - larger font
        certificationNameSize: "12.5px",
        certificationIssuerSize: "11.5px",
        certificationMarginBottom: "7px",

        // Other sections - larger font
        itemMarginBottom: "7px",
        itemTitleSize: "12.5px",
        itemDetailSize: "11.5px",
      };
    }
    // MEDIUM DENSITY: 15-30 points (balanced)
    else if (contentDensity < 30) {
      return {
        pageMarginTop: "18px",
        pageMarginBottom: "18px",
        pageMarginLeft: "32px",
        pageMarginRight: "32px",

        nameSize: "34px",
        nameMarginBottom: "5px",
        contactSize: "11.5px",
        contactGap: "8px",
        contactMarginBottom: "11px",

        sectionHeadingSize: "17px",
        sectionHeadingMarginBottom: "6px",
        sectionHeadingPaddingBottom: "2px",
        sectionMarginBottom: "11px",

        summarySize: "11.5px",
        summaryLineHeight: "1.35",

        experienceTitleSize: "13.5px",
        experienceCompanySize: "12.5px",
        experienceDateSize: "11px",
        experienceLocationSize: "11px",
        experienceMarginBottom: "9px",
        experienceBulletSize: "11.5px",
        experienceBulletMarginBottom: "2px",
        experienceBulletLineHeight: "1.35",

        projectTitleSize: "13px",
        projectTechSize: "11px",
        projectLinkSize: "10.5px",
        projectMarginBottom: "8px",
        projectBulletSize: "11.5px",
        projectBulletMarginBottom: "2px",
        projectBulletLineHeight: "1.35",
        projectTechMarginBottom: "3px",

        educationDegreeSize: "13px",
        educationInstitutionSize: "12px",
        educationDateSize: "11px",
        educationMarginBottom: "8px",
        educationGpaSize: "11px",

        skillCategorySize: "12px",
        skillItemSize: "11.5px",
        skillMarginBottom: "7px",

        certificationNameSize: "12px",
        certificationIssuerSize: "11px",
        certificationMarginBottom: "6px",

        itemMarginBottom: "6px",
        itemTitleSize: "12px",
        itemDetailSize: "11px",
      };
    }
    // HIGH DENSITY: 30+ points (compact)
    else {
      return {
        pageMarginTop: "16px",
        pageMarginBottom: "16px",
        pageMarginLeft: "28px",
        pageMarginRight: "28px",

        nameSize: "30px",
        nameMarginBottom: "4px",
        contactSize: "11px",
        contactGap: "8px",
        contactMarginBottom: "9px",

        sectionHeadingSize: "16px",
        sectionHeadingMarginBottom: "5px",
        sectionHeadingPaddingBottom: "2px",
        sectionMarginBottom: "9px",

        summarySize: "11px",
        summaryLineHeight: "1.3",

        experienceTitleSize: "13px",
        experienceCompanySize: "12px",
        experienceDateSize: "10.5px",
        experienceLocationSize: "10.5px",
        experienceMarginBottom: "7px",
        experienceBulletSize: "11px",
        experienceBulletMarginBottom: "2px",
        experienceBulletLineHeight: "1.3",

        projectTitleSize: "12.5px",
        projectTechSize: "10.5px",
        projectLinkSize: "10px",
        projectMarginBottom: "6px",
        projectBulletSize: "11px",
        projectBulletMarginBottom: "2px",
        projectBulletLineHeight: "1.3",
        projectTechMarginBottom: "2.5px",

        educationDegreeSize: "12.5px",
        educationInstitutionSize: "11.5px",
        educationDateSize: "10.5px",
        educationMarginBottom: "6px",
        educationGpaSize: "10.5px",

        skillCategorySize: "11.5px",
        skillItemSize: "11px",
        skillMarginBottom: "6px",

        certificationNameSize: "11.5px",
        certificationIssuerSize: "10.5px",
        certificationMarginBottom: "5px",

        itemMarginBottom: "5px",
        itemTitleSize: "11.5px",
        itemDetailSize: "10.5px",
      };
    }
  };

  const dynamicStyles = getDynamicStyles();
  const lastHeightRef = useRef(0);
  const onPageUsageChangeRef = useRef(onPageUsageChange);
  onPageUsageChangeRef.current = onPageUsageChange;

  // Page tracking for overflow detection
  useEffect(() => {
    if (contentRef.current && onPageUsageChangeRef.current) {
      const currentHeight = contentRef.current.scrollHeight;
      if (Math.abs(lastHeightRef.current - currentHeight) < 2) return;
      lastHeightRef.current = currentHeight;

      const maxHeight = 1123; // A4 standard 297mm @ 96dpi (matches template minHeight)
      const isOverflowing = currentHeight > maxHeight;
      const overflowPercentage = isOverflowing
        ? Math.round(((currentHeight - maxHeight) / maxHeight) * 100)
        : 0;

      const usageInfo = {
        isOverflowing,
        currentHeight,
        maxHeight,
        overflowPercentage,
        percentage: Math.round((currentHeight / maxHeight) * 100), // Allow > 100% for overflow
        templateName: "Professional2Template",
      };

      // Pass data to parent component if callback provided
      onPageUsageChangeRef.current(usageInfo);

      // Update pages array for internal tracking
      const numPages = Math.ceil(currentHeight / maxHeight);
      setPages((prev) => {
        if (prev.length === numPages) return prev;
        const pageArray = [];
        for (let i = 1; i <= numPages; i++) {
          pageArray.push(i);
        }
        return pageArray;
      });
    }
  }, [resumeData]);

  // Section titles with custom labels
  const getSectionTitle = (sectionKey) => {
    const customTitles = resumeData?.sectionTitles || {};
    const defaultTitles = {
      summary: "Professional Summary",
      experience: "Professional Experience",
      projects: "Projects",
      education: "Education",
      skills: "Skills & Expertise",
      certifications: "Certifications",
      achievements: "Achievements",
      languages: "Languages",
      volunteer: "Volunteer Experience",
    };
    return customTitles[sectionKey] || defaultTitles[sectionKey];
  };

  // Render section wrapper
  const defaultOrder = [
    "summary",
    "experience",
    "projects",
    "education",
    "skills",
    "certifications",
    "achievements",
    "languages",
    "volunteer",
    "customSections",
  ];
  const baseOrder =
    resumeData?.sectionOrder && resumeData.sectionOrder.length > 0
      ? resumeData.sectionOrder.filter(
        (id) => !["score", "personal", "recommendations"].includes(id)
      )
      : defaultOrder;
  const order =
    resumeData?.customSections &&
      resumeData.customSections.length > 0 &&
      !baseOrder.includes("customSections")
      ? [...baseOrder, "customSections"]
      : baseOrder;

  const renderSection = (key, content) => {
    return {
      key,
      order: order.indexOf(key) !== -1 ? order.indexOf(key) : 999,
      content,
    };
  };

  // Base styles
  const sectionStyle = {
    marginBottom: dynamicStyles.sectionMarginBottom,
  };

  const sectionHeaderStyle = {
    fontSize: dynamicStyles.sectionHeadingSize,
    fontWeight: "700",
    color: selectedTheme.primary,
    marginBottom: dynamicStyles.sectionHeadingMarginBottom,
    paddingBottom: dynamicStyles.sectionHeadingPaddingBottom,
    borderBottom: `2px solid ${selectedTheme.border}`,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  // Build sections array
  const sections = [];

  // Summary Section
  if (resumeData?.summary) {
    sections.push(
      renderSection(
        "summary",
        <section key="summary" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("summary")}</h2>
          <p
            style={{
              fontSize: dynamicStyles.summarySize,
              lineHeight: dynamicStyles.summaryLineHeight,
              color: selectedTheme.text,
              textAlign: "justify",
            }}
          >
            {resumeData.summary}
          </p>
        </section>
      )
    );
  }

  // Experience Section
  if (resumeData?.experience && resumeData.experience.length > 0) {
    sections.push(
      renderSection(
        "experience",
        <section key="experience" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("experience")}</h2>
          {resumeData.experience.map((exp, index) => (
            <div
              key={index}
              style={{ marginBottom: dynamicStyles.experienceMarginBottom }}
            >
              {/* Title and Company */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  marginBottom: "4px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: dynamicStyles.experienceTitleSize,
                      fontWeight: "700",
                      color: selectedTheme.primary,
                    }}
                  >
                    {exp.position || exp.title}
                  </div>
                  <div
                    style={{
                      fontSize: dynamicStyles.experienceCompanySize,
                      fontWeight: "600",
                      color: selectedTheme.text,
                      marginTop: "2px",
                    }}
                  >
                    {exp.company}
                  </div>
                </div>

                {/* Date and Location */}
                <div
                  style={{
                    textAlign: "right",
                    fontSize: dynamicStyles.experienceDateSize,
                    color: selectedTheme.textMuted,
                  }}
                >
                  <div style={{ fontWeight: "600" }}>
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </div>
                  {exp.location && (
                    <div
                      style={{
                        fontSize: dynamicStyles.experienceLocationSize,
                        marginTop: "2px",
                      }}
                    >
                      {exp.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {exp.description &&
                (!exp.bullets?.length ||
                  !isDescriptionDuplicatedInBullets(exp.description, exp.bullets)) && (
                  <p
                    style={{
                      fontSize: dynamicStyles.experienceBulletSize,
                      lineHeight: dynamicStyles.experienceBulletLineHeight,
                      color: selectedTheme.text,
                      marginTop: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    {exp.description}
                  </p>
                )}

              {/* Bullets */}
              {exp.bullets && exp.bullets.length > 0 && (
                <ul
                  style={{
                    marginTop: "6px",
                    marginLeft: "20px",
                    listStyleType: "disc",
                    listStylePosition: "outside",
                  }}
                >
                  {exp.bullets
                    .filter((bullet) => bullet && bullet.trim())
                    .map((bullet, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: dynamicStyles.experienceBulletSize,
                          lineHeight: dynamicStyles.experienceBulletLineHeight,
                          marginBottom:
                            dynamicStyles.experienceBulletMarginBottom,
                          color: selectedTheme.text,
                        }}
                      >
                        {cleanBulletText(bullet) || bullet}
                      </li>
                    ))}
                </ul>
              )}

              {/* Achievements */}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul
                  style={{
                    marginTop: "6px",
                    marginLeft: "20px",
                    listStyleType: "disc",
                    listStylePosition: "outside",
                  }}
                >
                  {exp.achievements
                    .filter(
                      (achievement) =>
                        achievement &&
                        (typeof achievement === "string"
                          ? achievement.trim()
                          : achievement.title || achievement.description)
                    )
                    .map((achievement, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: dynamicStyles.experienceBulletSize,
                          lineHeight: dynamicStyles.experienceBulletLineHeight,
                          marginBottom:
                            dynamicStyles.experienceBulletMarginBottom,
                          color: selectedTheme.text,
                        }}
                      >
                        {typeof achievement === "string"
                          ? cleanBulletText(achievement) || achievement
                          : achievement.title || achievement.description || ""}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )
    );
  }

  // Projects Section
  if (resumeData?.projects && resumeData.projects.length > 0) {
    sections.push(
      renderSection(
        "projects",
        <section key="projects" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("projects")}</h2>
          {resumeData.projects.map((project, index) => (
            <div
              key={index}
              style={{ marginBottom: dynamicStyles.projectMarginBottom }}
            >
              {/* Project Name and Link */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: dynamicStyles.projectTitleSize,
                    fontWeight: "700",
                    color: selectedTheme.primary,
                  }}
                >
                  {project.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {(project.link || project.liveUrl) && (
                    <a
                      href={(project.link || project.liveUrl).startsWith("http") ? (project.link || project.liveUrl) : `https://${project.link || project.liveUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: dynamicStyles.projectLinkSize,
                        color: selectedTheme.linkColor,
                        textDecoration: "underline",
                      }}
                    >
                      🔗 Live Demo
                    </a>
                  )}
                  {(project.github || project.githubUrl) && (
                    <a
                      href={(project.github || project.githubUrl).startsWith("http") ? (project.github || project.githubUrl) : `https://${project.github || project.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: dynamicStyles.projectLinkSize,
                        color: selectedTheme.linkColor,
                        textDecoration: "underline",
                      }}
                    >
                      💻 GitHub
                    </a>
                  )}
                </div>
              </div>

              {/* Technologies */}
              {project.technologies && (
                <div
                  style={{
                    fontSize: dynamicStyles.projectTechSize,
                    color: selectedTheme.textMuted,
                    fontStyle: "italic",
                    marginBottom: dynamicStyles.projectTechMarginBottom,
                  }}
                >
                  <strong>Technologies:</strong>{" "}
                  {Array.isArray(project.technologies)
                    ? project.technologies.join(" • ")
                    : project.technologies}
                </div>
              )}

              {/* Description */}
              {project.description &&
                (!project.bullets?.length ||
                  !isDescriptionDuplicatedInBullets(project.description, project.bullets)) && (
                  <p
                    style={{
                      fontSize: dynamicStyles.projectBulletSize,
                      lineHeight: dynamicStyles.projectBulletLineHeight,
                      color: selectedTheme.text,
                      marginTop: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {project.description}
                  </p>
                )}

              {/* Bullets */}
              {project.bullets && project.bullets.length > 0 && (
                <ul
                  style={{
                    marginTop: "4px",
                    marginLeft: "20px",
                    listStyleType: "disc",
                    listStylePosition: "outside",
                  }}
                >
                  {project.bullets
                    .filter((bullet) => bullet && bullet.trim())
                    .map((bullet, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: dynamicStyles.projectBulletSize,
                          lineHeight: dynamicStyles.projectBulletLineHeight,
                          marginBottom: dynamicStyles.projectBulletMarginBottom,
                          color: selectedTheme.text,
                        }}
                      >
                        {cleanBulletText(bullet) || bullet}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )
    );
  }

  // Education Section
  if (resumeData?.education && resumeData.education.length > 0) {
    sections.push(
      renderSection(
        "education",
        <section key="education" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("education")}</h2>
          {resumeData.education.map((edu, index) => (
            <div
              key={index}
              style={{ marginBottom: dynamicStyles.educationMarginBottom }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: dynamicStyles.educationDegreeSize,
                      fontWeight: "700",
                      color: selectedTheme.primary,
                    }}
                  >
                    {formatEducationDegreeAndField(edu)}
                  </div>
                  <div
                    style={{
                      fontSize: dynamicStyles.educationInstitutionSize,
                      fontWeight: "600",
                      color: selectedTheme.text,
                      marginTop: "2px",
                    }}
                  >
                    {edu.institution}
                    {edu.location && `, ${edu.location}`}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontSize: dynamicStyles.educationDateSize,
                    color: selectedTheme.textMuted,
                  }}
                >
                  <div style={{ fontWeight: "600" }}>{edu.graduationDate}</div>
                  {edu.gpa && (
                    <div
                      style={{
                        fontSize: dynamicStyles.educationGpaSize,
                        marginTop: "2px",
                      }}
                    >
                      GPA: {edu.gpa}
                    </div>
                  )}
                </div>
              </div>

              {/* Education bullets/honors */}
              {edu.bullets && edu.bullets.length > 0 && (
                <ul
                  style={{
                    marginTop: "4px",
                    marginLeft: "20px",
                    listStyleType: "disc",
                    listStylePosition: "outside",
                  }}
                >
                  {edu.bullets
                    .filter((bullet) => bullet && bullet.trim())
                    .map((bullet, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: dynamicStyles.educationInstitutionSize,
                          color: selectedTheme.text,
                          marginBottom: "3px",
                        }}
                      >
                        {cleanBulletText(bullet) || bullet}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )
    );
  }

  // Skills Section
  if (resumeData?.skills && resumeData.skills.length > 0) {
    sections.push(
      renderSection(
        "skills",
        <section key="skills" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("skills")}</h2>
          {resumeData.skills.map((skillGroup, index) => (
            <div
              key={index}
              style={{ marginBottom: dynamicStyles.skillMarginBottom }}
            >
              {skillGroup.category && (
                <span
                  style={{
                    fontSize: dynamicStyles.skillCategorySize,
                    fontWeight: "700",
                    color: selectedTheme.primary,
                  }}
                >
                  {skillGroup.category}:{" "}
                </span>
              )}
              <span
                style={{
                  fontSize: dynamicStyles.skillItemSize,
                  color: selectedTheme.text,
                }}
              >
                {Array.isArray(skillGroup.items)
                  ? skillGroup.items.join(" • ")
                  : skillGroup.items}
              </span>
            </div>
          ))}
        </section>
      )
    );
  }

  // Certifications Section
  if (resumeData?.certifications && resumeData.certifications.length > 0) {
    sections.push(
      renderSection(
        "certifications",
        <section key="certifications" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>
            {getSectionTitle("certifications")}
          </h2>
          {resumeData.certifications.map((cert, index) => {
            const certName = typeof cert === "string" ? cert : (cert?.name || cert?.title || "");
            const certDate = typeof cert === "object" ? cert?.date : "";
            const certIssuer = typeof cert === "object" ? (cert?.issuer || cert?.authority) : "";
            const certCredId = typeof cert === "object" ? cert?.credentialId : "";

            return (
              <div
                key={index}
                style={{ marginBottom: dynamicStyles.certificationMarginBottom }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: dynamicStyles.certificationNameSize,
                      fontWeight: "700",
                      color: selectedTheme.primary,
                    }}
                  >
                    {certName || (typeof cert === "string" ? cert : cert?.name || cert?.title || cert?.issuer || "Certification")}
                  </div>
                  {certDate && (
                    <div
                      style={{
                        fontSize: dynamicStyles.certificationIssuerSize,
                        color: selectedTheme.textMuted,
                        fontWeight: "600",
                      }}
                    >
                      {certDate}
                    </div>
                  )}
                </div>
                {certIssuer && (
                  <div
                    style={{
                      fontSize: dynamicStyles.certificationIssuerSize,
                      color: selectedTheme.textLight,
                      marginTop: "2px",
                    }}
                  >
                    {certIssuer}
                    {certCredId && ` • ID: ${certCredId}`}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )
    );
  }

  // Achievements Section
  if (resumeData?.achievements && resumeData.achievements.length > 0) {
    sections.push(
      renderSection(
        "achievements",
        <section key="achievements" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("achievements")}</h2>
          <ul
            style={{
              marginLeft: "20px",
              listStyleType: "disc",
              listStylePosition: "outside",
            }}
          >
            {resumeData.achievements.map((achievement, index) => (
              <li
                key={index}
                style={{
                  fontSize: dynamicStyles.itemTitleSize,
                  color: selectedTheme.text,
                  marginBottom: dynamicStyles.itemMarginBottom,
                }}
              >
                {typeof achievement === "string"
                  ? cleanBulletText(achievement) || achievement
                  : achievement.title || achievement.description || achievement.name || ""}
              </li>
            ))}
          </ul>
        </section>
      )
    );
  }

  // Languages Section
  if (resumeData?.languages && resumeData.languages.length > 0) {
    sections.push(
      renderSection(
        "languages",
        <section key="languages" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("languages")}</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            {resumeData.languages.map((lang, index) => (
              <div key={index}>
                <span
                  style={{
                    fontSize: dynamicStyles.itemTitleSize,
                    fontWeight: "700",
                    color: selectedTheme.primary,
                  }}
                >
                  {lang.language || lang.name}
                </span>
                {(lang.proficiency || lang.level) && (
                  <span
                    style={{
                      fontSize: dynamicStyles.itemDetailSize,
                      color: selectedTheme.textLight,
                      marginLeft: "6px",
                    }}
                  >
                    ({lang.proficiency || lang.level})
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )
    );
  }

  // Volunteer Experience Section
  if (resumeData?.volunteer && resumeData.volunteer.length > 0) {
    sections.push(
      renderSection(
        "volunteer",
        <section key="volunteer" style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>{getSectionTitle("volunteer")}</h2>
          {resumeData.volunteer.map((vol, index) => (
            <div
              key={index}
              style={{ marginBottom: dynamicStyles.experienceMarginBottom }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: dynamicStyles.experienceTitleSize,
                      fontWeight: "700",
                      color: selectedTheme.primary,
                    }}
                  >
                    {vol.position || vol.role}
                  </div>
                  <div
                    style={{
                      fontSize: dynamicStyles.experienceCompanySize,
                      fontWeight: "600",
                      color: selectedTheme.text,
                      marginTop: "2px",
                    }}
                  >
                    {vol.organization}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: dynamicStyles.experienceDateSize,
                    color: selectedTheme.textMuted,
                    fontWeight: "600",
                  }}
                >
                  {vol.startDate} - {vol.current ? "Present" : vol.endDate}
                </div>
              </div>

              {vol.description && (
                <p
                  style={{
                    fontSize: dynamicStyles.experienceBulletSize,
                    lineHeight: dynamicStyles.experienceBulletLineHeight,
                    color: selectedTheme.text,
                    marginTop: "4px",
                  }}
                >
                  {vol.description}
                </p>
              )}

              {vol.bullets && vol.bullets.length > 0 && (
                <ul
                  style={{
                    marginTop: "4px",
                    marginLeft: "20px",
                    listStyleType: "disc",
                    listStylePosition: "outside",
                  }}
                >
                  {vol.bullets
                    .filter((bullet) => bullet && bullet.trim())
                    .map((bullet, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: dynamicStyles.experienceBulletSize,
                          lineHeight: dynamicStyles.experienceBulletLineHeight,
                          marginBottom:
                            dynamicStyles.experienceBulletMarginBottom,
                          color: selectedTheme.text,
                        }}
                      >
                        {cleanBulletText(bullet) || bullet}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )
    );
  }

  // Custom Sections
  if (resumeData?.customSections && resumeData.customSections.length > 0) {
      sections.push(
        renderSection(
          "customSections",
          <div key="customSections">
            {resumeData.customSections.map((sec, sIdx) => {
              const items = Array.isArray(sec.items) ? sec.items : [];
              return (
                <section key={sec.id || `custom-${sIdx}`} style={sectionStyle}>
                  <h2 style={sectionHeaderStyle}>{sec.title || "Additional Information"}</h2>
                  {sec.content && (
                    <p
                      style={{
                        fontSize: dynamicStyles.experienceTitleSize,
                        color: selectedTheme.textLight,
                        lineHeight: "1.4",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {sec.content}
                    </p>
                  )}
                  {items.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: dynamicStyles.itemMarginBottom }}>
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
                            <ul
                              key={iIdx}
                              style={{
                                margin: "2px 0 0 0",
                                marginLeft: "20px",
                                listStyleType: "disc",
                                listStylePosition: "outside",
                              }}
                            >
                              <li
                                style={{
                                  fontSize: dynamicStyles.itemTitleSize,
                                  color: selectedTheme.textLight,
                                  lineHeight: "1.4",
                                }}
                              >
                                {typeof itemTitle === "string" ? cleanBulletText(itemTitle) || itemTitle : ""}
                              </li>
                            </ul>
                          );
                        }

                        return (
                          <div key={iIdx} style={{ marginBottom: "4px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                flexWrap: "wrap",
                                gap: "4px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                                {itemTitle && (
                                  <span
                                    style={{
                                      fontSize: dynamicStyles.itemTitleSize,
                                      fontWeight: "700",
                                      color: selectedTheme.primary,
                                    }}
                                  >
                                    {itemTitle}
                                  </span>
                                )}
                                {subtitle && (
                                  <span
                                    style={{
                                      fontSize: dynamicStyles.experienceCompanySize,
                                      fontWeight: "600",
                                      color: selectedTheme.text,
                                    }}
                                  >
                                    · {subtitle}
                                  </span>
                                )}
                                {link && (
                                  <a
                                    href={link.startsWith("http") ? link : `https://${link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: dynamicStyles.itemDetailSize,
                                      color: selectedTheme.primary,
                                      textDecoration: "underline",
                                    }}
                                  >
                                    [link]
                                  </a>
                                )}
                              </div>
                              {date && (
                                <span
                                  style={{
                                    fontSize: dynamicStyles.experienceDateSize,
                                    color: selectedTheme.textMuted,
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {date}
                                </span>
                              )}
                            </div>
                            {description &&
                              (!bullets.length ||
                                !isDescriptionDuplicatedInBullets(description, bullets)) && (
                                <p
                                  style={{
                                    fontSize: dynamicStyles.itemDetailSize,
                                    color: selectedTheme.textLight,
                                    margin: "2px 0 3px 0",
                                    lineHeight: "1.35",
                                  }}
                                >
                                  {description}
                                </p>
                              )}
                            {bullets.length > 0 && (
                              <ul
                                style={{
                                  marginTop: "2px",
                                  marginBottom: 0,
                                  marginLeft: "20px",
                                  listStyleType: "disc",
                                  listStylePosition: "outside",
                                }}
                              >
                                {bullets.map((b, bIdx) => (
                                  <li
                                    key={bIdx}
                                    style={{
                                      fontSize: dynamicStyles.itemDetailSize,
                                      color: selectedTheme.textLight,
                                      lineHeight: "1.35",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {cleanBulletText(b) || b}
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
        )
      );
  }

    // Sort sections by custom order
    const sortedSections = sections
      .sort((a, b) => a.order - b.order)
      .map((s) => s.content);

    return (
      <div
        ref={ref}
        style={{
          width: "794px", // A4 width at 96 DPI (8.27 inches) // A4 height at 96 DPI (11.69 inches)
          backgroundColor: "#ffffff",
          color: selectedTheme.text,
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: `${dynamicStyles.pageMarginTop} ${dynamicStyles.pageMarginRight} ${dynamicStyles.pageMarginBottom} ${dynamicStyles.pageMarginLeft}`,
          }}
        >
          {/* Header */}
          <header style={{ marginBottom: dynamicStyles.contactMarginBottom }}>
            {/* Name */}
            <h1
              style={{
                fontSize: dynamicStyles.nameSize,
                fontWeight: "800",
                color: selectedTheme.primary,
                marginBottom: dynamicStyles.nameMarginBottom,
                textAlign: "center",
                letterSpacing: "0.5px",
              }}
            >
              {resumeData?.name || "Your Name"}
            </h1>

            {/* Contact Information */}
            {resumeData?.contact && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: dynamicStyles.contactGap,
                  fontSize: dynamicStyles.contactSize,
                  color: selectedTheme.textLight,
                }}
              >
                {resumeData.contact.email && (
                  <span>
                    <a
                      href={`mailto:${resumeData.contact.email}`}
                      style={{ color: selectedTheme.textLight }}
                    >
                      {resumeData.contact.email}
                    </a>
                  </span>
                )}
                {resumeData.contact.phone && (
                  <span>{resumeData.contact.phone}</span>
                )}
                {resumeData.contact.location && (
                  <span>{resumeData.contact.location}</span>
                )}
                {resumeData.contact.linkedin && (
                  <span>
                    <a
                      href={
                        resumeData.contact.linkedin.startsWith("http")
                          ? resumeData.contact.linkedin
                          : `https://${resumeData.contact.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: selectedTheme.linkColor }}
                    >
                      LinkedIn
                    </a>
                  </span>
                )}
                {resumeData.contact.github && (
                  <span>
                    <a
                      href={
                        resumeData.contact.github.startsWith("http")
                          ? resumeData.contact.github
                          : `https://${resumeData.contact.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: selectedTheme.linkColor }}
                    >
                      GitHub
                    </a>
                  </span>
                )}
                {resumeData.contact.portfolio && (
                  <span>
                    <a
                      href={
                        resumeData.contact.portfolio.startsWith("http")
                          ? resumeData.contact.portfolio
                          : `https://${resumeData.contact.portfolio}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: selectedTheme.linkColor }}
                    >
                      Portfolio
                    </a>
                  </span>
                )}
                {resumeData.contact.website && !resumeData.contact.portfolio && (
                  <span>
                    <a
                      href={
                        resumeData.contact.website.startsWith("http")
                          ? resumeData.contact.website
                          : `https://${resumeData.contact.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: selectedTheme.linkColor }}
                    >
                      Website
                    </a>
                  </span>
                )}
              </div>
            )}
          </header>

          {/* Sections */}
          {sortedSections}
        </div>
      </div>
    );
  });

Professional2Template.displayName = "Professional2Template";

export default Professional2Template;

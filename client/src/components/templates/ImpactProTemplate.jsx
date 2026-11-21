import React, {forwardRef, useRef, useEffect, useState} from "react";
import {isDescriptionDuplicatedInBullets, formatEducationDegreeAndField} from "./templateUtils";

/**
 * ImpactProTemplate - Results-Driven Resume Template with Dynamic Features
 *
 * Key Features:
 * - 98% ATS Compatibility Score
 * - Minimal border margins for maximum content space
 * - Compact section headings with small background bars
 * - Dynamic content density (3 modes: low, medium, high)
 * - Page overflow tracking and warnings
 * - 4 bold color themes (emerald, blue, purple, orange)
 * - All resume sections supported
 * - Inline styles for consistent rendering
 * - Metrics-first approach for achievements
 * - Two-column skills layout for space efficiency
 */

const ImpactProTemplate = forwardRef((props, ref) => {
  const {resumeData, scale = 1, onPageUsageChange} = props;
  const contentRef = useRef(null);
  const [pages, setPages] = useState([]);

  // Color Themes - Bold, results-driven palettes
  const colorThemes = {
    emerald: {
      primary: "#047857",
      secondary: "#059669",
      accent: "#10b981",
      light: "#d1fae5",
      text: "#1e293b",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#cbd5e1",
      linkColor: "#059669",
    },
    blue: {
      primary: "#1e40af",
      secondary: "#2563eb",
      accent: "#3b82f6",
      light: "#dbeafe",
      text: "#1e293b",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#cbd5e1",
      linkColor: "#2563eb",
    },
    purple: {
      primary: "#7e22ce",
      secondary: "#9333ea",
      accent: "#a855f7",
      light: "#f3e8ff",
      text: "#1e293b",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#cbd5e1",
      linkColor: "#9333ea",
    },
    orange: {
      primary: "#c2410c",
      secondary: "#ea580c",
      accent: "#f97316",
      light: "#ffedd5",
      text: "#1e293b",
      textLight: "#334155",
      textMuted: "#64748b",
      border: "#cbd5e1",
      linkColor: "#ea580c",
    },
  };

  const selectedTheme =
    colorThemes[resumeData?.colorTheme] || colorThemes.emerald;

  // Calculate content density for dynamic styling
  const calculateContentDensity = () => {
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
    if (resumeData?.summary && resumeData.summary.length > 150) {
      score += 3;
    } else if (resumeData?.summary) {
      score += 2;
    }

    return score;
  };

  const contentDensity = calculateContentDensity();

  // Dynamic styles based on content density
  const getDynamicStyles = () => {
    // LOW DENSITY: < 15 points (spacious layout)
    if (contentDensity < 15) {
      return {
        // Page margins - minimal borders
        pageMarginTop: "18px",
        pageMarginBottom: "18px",
        pageMarginLeft: "28px",
        pageMarginRight: "28px",

        // Header - compact
        nameSize: "33px",
        nameMarginBottom: "5px",
        contactSize: "12px",
        contactGap: "10px",
        contactMarginBottom: "12px",
        headerBorderWidth: "3px",

        // Section headings - small background
        sectionHeadingSize: "17.5px",
        sectionHeadingMarginBottom: "7px",
        sectionHeadingPaddingV: "4px",
        sectionHeadingPaddingH: "10px",
        sectionMarginBottom: "13px",

        // Summary
        summarySize: "12.5px",
        summaryLineHeight: "1.45",

        // Experience
        experienceTitleSize: "14.5px",
        experienceCompanySize: "13.5px",
        experienceDateSize: "12px",
        experienceLocationSize: "12px",
        experienceMarginBottom: "10px",
        experienceBulletSize: "12px",
        experienceBulletMarginBottom: "2.5px",
        experienceBulletLineHeight: "1.45",

        // Projects
        projectTitleSize: "14px",
        projectTechSize: "11.5px",
        projectLinkSize: "11px",
        projectMarginBottom: "9px",
        projectBulletSize: "12px",
        projectBulletMarginBottom: "2.5px",
        projectBulletLineHeight: "1.45",
        projectTechMarginBottom: "3px",

        // Education
        educationDegreeSize: "14px",
        educationInstitutionSize: "13px",
        educationDateSize: "12px",
        educationMarginBottom: "9px",
        educationGpaSize: "12px",

        // Skills
        skillCategorySize: "13px",
        skillItemSize: "12px",
        skillMarginBottom: "7px",

        // Certifications
        certificationNameSize: "13px",
        certificationIssuerSize: "12px",
        certificationMarginBottom: "7px",

        // Other items
        itemMarginBottom: "7px",
        itemTitleSize: "13px",
        itemDetailSize: "12px",
      };
    }
    // MEDIUM DENSITY: 15-30 points (balanced)
    else if (contentDensity < 30) {
      return {
        pageMarginTop: "16px",
        pageMarginBottom: "16px",
        pageMarginLeft: "26px",
        pageMarginRight: "26px",

        nameSize: "30px",
        nameMarginBottom: "4px",
        contactSize: "11.5px",
        contactGap: "8px",
        contactMarginBottom: "10px",
        headerBorderWidth: "2.5px",

        sectionHeadingSize: "16.5px",
        sectionHeadingMarginBottom: "6px",
        sectionHeadingPaddingV: "3px",
        sectionHeadingPaddingH: "9px",
        sectionMarginBottom: "11px",

        summarySize: "12px",
        summaryLineHeight: "1.4",

        experienceTitleSize: "14px",
        experienceCompanySize: "13px",
        experienceDateSize: "11.5px",
        experienceLocationSize: "11.5px",
        experienceMarginBottom: "9px",
        experienceBulletSize: "11.5px",
        experienceBulletMarginBottom: "2px",
        experienceBulletLineHeight: "1.4",

        projectTitleSize: "13.5px",
        projectTechSize: "11px",
        projectLinkSize: "10.5px",
        projectMarginBottom: "8px",
        projectBulletSize: "11.5px",
        projectBulletMarginBottom: "2px",
        projectBulletLineHeight: "1.4",
        projectTechMarginBottom: "2.5px",

        educationDegreeSize: "13.5px",
        educationInstitutionSize: "12.5px",
        educationDateSize: "11.5px",
        educationMarginBottom: "8px",
        educationGpaSize: "11.5px",

        skillCategorySize: "12.5px",
        skillItemSize: "11.5px",
        skillMarginBottom: "6px",

        certificationNameSize: "12.5px",
        certificationIssuerSize: "11.5px",
        certificationMarginBottom: "6px",

        itemMarginBottom: "6px",
        itemTitleSize: "12.5px",
        itemDetailSize: "11.5px",
      };
    }
    // HIGH DENSITY: 30+ points (compact)
    else {
      return {
        pageMarginTop: "14px",
        pageMarginBottom: "14px",
        pageMarginLeft: "24px",
        pageMarginRight: "24px",

        nameSize: "28px",
        nameMarginBottom: "3px",
        contactSize: "11px",
        contactGap: "7px",
        contactMarginBottom: "9px",
        headerBorderWidth: "2px",

        sectionHeadingSize: "15.5px",
        sectionHeadingMarginBottom: "5px",
        sectionHeadingPaddingV: "2.5px",
        sectionHeadingPaddingH: "8px",
        sectionMarginBottom: "9px",

        summarySize: "11.5px",
        summaryLineHeight: "1.35",

        experienceTitleSize: "13.5px",
        experienceCompanySize: "12.5px",
        experienceDateSize: "11px",
        experienceLocationSize: "11px",
        experienceMarginBottom: "7px",
        experienceBulletSize: "11px",
        experienceBulletMarginBottom: "2px",
        experienceBulletLineHeight: "1.35",

        projectTitleSize: "13px",
        projectTechSize: "10.5px",
        projectLinkSize: "10px",
        projectMarginBottom: "7px",
        projectBulletSize: "11px",
        projectBulletMarginBottom: "2px",
        projectBulletLineHeight: "1.35",
        projectTechMarginBottom: "2px",

        educationDegreeSize: "13px",
        educationInstitutionSize: "12px",
        educationDateSize: "11px",
        educationMarginBottom: "7px",
        educationGpaSize: "11px",

        skillCategorySize: "12px",
        skillItemSize: "11px",
        skillMarginBottom: "5px",

        certificationNameSize: "12px",
        certificationIssuerSize: "11px",
        certificationMarginBottom: "5px",

        itemMarginBottom: "5px",
        itemTitleSize: "12px",
        itemDetailSize: "11px",
      };
    }
  };

  const dynamicStyles = getDynamicStyles();
  const lastHeightRef = useRef(0);
  const onPageUsageChangeRef = useRef(onPageUsageChange);
  onPageUsageChangeRef.current = onPageUsageChange;

  // Page tracking for overflow detection
  useEffect(() => {
    if (!contentRef.current || !onPageUsageChangeRef.current) return;

    const updatePageUsage = () => {
      const element = contentRef.current;
      if (!element || !onPageUsageChangeRef.current) return;

      const currentHeight = element.scrollHeight;
      if (Math.abs(lastHeightRef.current - currentHeight) < 2) return;
      lastHeightRef.current = currentHeight;

      const maxHeight = 1123; // A4 standard 297mm @ 96dpi (matches template minHeight)

      const percentage = Math.round((currentHeight / maxHeight) * 100);
      const isOverflowing = currentHeight > maxHeight;
      const overflowPercentage = isOverflowing
        ? Math.round(((currentHeight - maxHeight) / maxHeight) * 100)
        : 0;

      onPageUsageChangeRef.current({
        isOverflowing,
        currentHeight,
        maxHeight,
        percentage,
        overflowPercentage,
        templateName: "Impact Pro",
      });
    };

    // Initial check
    updatePageUsage();

    // Re-check after a short delay to account for font loading
    const timer = setTimeout(updatePageUsage, 100);

    // Observe size changes
    const resizeObserver = new ResizeObserver(updatePageUsage);
    resizeObserver.observe(contentRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [resumeData]);

  // Default section order
  const DEFAULT_SECTION_ORDER = [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "languages",
    "volunteer",
    "customSections",
  ];

  const baseOrder =
    resumeData.sectionOrder && resumeData.sectionOrder.length > 0
      ? resumeData.sectionOrder.filter(
          (id) => !["score", "personal", "recommendations"].includes(id)
        )
      : DEFAULT_SECTION_ORDER;

  const sectionOrder =
    resumeData.customSections && resumeData.customSections.length > 0 && !baseOrder.includes("customSections")
      ? [...baseOrder, "customSections"]
      : baseOrder;

  // Render section helper function
  const renderSection = (sectionId) => {
    const sections = {
      summary: resumeData.summary && (
        <section
          key="summary"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Professional Summary
          </div>
          <p
            style={{
              fontSize: dynamicStyles.summarySize,
              lineHeight: dynamicStyles.summaryLineHeight,
              color: selectedTheme.textLight,
              margin: "0",
            }}
          >
            {resumeData.summary}
          </p>
        </section>
      ),

      skills: resumeData.skills && resumeData.skills.length > 0 && (
        <section
          key="skills"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Core Skills
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px 18px",
              columnGap: "18px",
            }}
          >
            {resumeData.skills.map((skillGroup, index) => (
              <div
                key={index}
                style={{
                  marginBottom: dynamicStyles.skillMarginBottom,
                  breakInside: "avoid",
                }}
              >
                <div
                  style={{
                    fontSize: dynamicStyles.skillCategorySize,
                    fontWeight: "700",
                    color: selectedTheme.primary,
                    marginBottom: "3px",
                  }}
                >
                  {skillGroup.category}
                </div>
                <div
                  style={{
                    fontSize: dynamicStyles.skillItemSize,
                    color: selectedTheme.textLight,
                    lineHeight: "1.5",
                  }}
                >
                  {Array.isArray(skillGroup.items)
                    ? skillGroup.items.join(" • ")
                    : skillGroup.items}
                </div>
              </div>
            ))}
          </div>
        </section>
      ),

      experience: resumeData.experience && resumeData.experience.length > 0 && (
        <section
          key="experience"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Professional Experience
          </div>
          <div>
            {resumeData.experience.map((exp, index) => (
              <div
                key={index}
                style={{
                  marginBottom: dynamicStyles.experienceMarginBottom,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "2px",
                  }}
                >
                  <div style={{flex: 1}}>
                    <div
                      style={{
                        fontSize: dynamicStyles.experienceTitleSize,
                        fontWeight: "700",
                        color: selectedTheme.text,
                      }}
                    >
                      {exp.position}
                    </div>
                    <div
                      style={{
                        fontSize: dynamicStyles.experienceCompanySize,
                        fontWeight: "600",
                        color: selectedTheme.primary,
                        marginTop: "1px",
                      }}
                    >
                      {exp.company}
                      {exp.location && ` • ${exp.location}`}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: dynamicStyles.experienceDateSize,
                      color: selectedTheme.textMuted,
                      whiteSpace: "nowrap",
                      marginLeft: "15px",
                      fontWeight: "500",
                    }}
                  >
                    {exp.startDate} - {exp.endDate || "Present"}
                  </div>
                </div>
                {exp.description &&
                  (!exp.bullets?.length ||
                    !isDescriptionDuplicatedInBullets(exp.description, exp.bullets)) && (
                  <p
                    style={{
                      fontSize: dynamicStyles.experienceBulletSize,
                      lineHeight: dynamicStyles.experienceBulletLineHeight,
                      color: selectedTheme.textLight,
                      marginTop: "3px",
                      marginBottom: "3px",
                    }}
                  >
                    {exp.description}
                  </p>
                )}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul
                    style={{
                      marginTop: "3px",
                      marginBottom: "0",
                      paddingLeft: "0",
                      listStyleType: "none",
                    }}
                  >
                    {exp.bullets
                      .filter((bullet) => bullet && bullet.trim())
                      .map((bullet, bulletIndex) => (
                        <li
                          key={bulletIndex}
                          style={{
                            fontSize: dynamicStyles.experienceBulletSize,
                            lineHeight:
                              dynamicStyles.experienceBulletLineHeight,
                            color: selectedTheme.textLight,
                            marginBottom:
                              dynamicStyles.experienceBulletMarginBottom,
                            marginLeft: "18px",
                            listStyleType: "disc",
                            listStylePosition: "outside",
                            display: "list-item",
                          }}
                        >
                          {bullet}
                        </li>
                      ))}
                  </ul>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul
                    style={{
                      marginTop: "3px",
                      marginBottom: "0",
                      paddingLeft: "0",
                      listStyleType: "none",
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
                      .map((achievement, achIndex) => (
                        <li
                          key={achIndex}
                          style={{
                            fontSize: dynamicStyles.experienceBulletSize,
                            lineHeight:
                              dynamicStyles.experienceBulletLineHeight,
                            color: selectedTheme.textLight,
                            marginBottom:
                              dynamicStyles.experienceBulletMarginBottom,
                            marginLeft: "18px",
                            listStyleType: "disc",
                            listStylePosition: "outside",
                            display: "list-item",
                          }}
                        >
                          {achievement}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      projects: resumeData.projects && resumeData.projects.length > 0 && (
        <section
          key="projects"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Key Projects
          </div>
          <div>
            {resumeData.projects.map((project, index) => (
              <div
                key={index}
                style={{
                  marginBottom: dynamicStyles.projectMarginBottom,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "2px",
                  }}
                >
                  <div style={{flex: 1}}>
                    <div
                      style={{
                        fontSize: dynamicStyles.projectTitleSize,
                        fontWeight: "700",
                        color: selectedTheme.text,
                      }}
                    >
                      {project.name}
                      {(project.link || project.url || project.liveUrl) && (
                        <span
                          style={{
                            fontSize: dynamicStyles.projectLinkSize,
                            color: selectedTheme.linkColor,
                            marginLeft: "8px",
                            fontWeight: "normal",
                          }}
                        >
                          [Live: {project.link || project.url || project.liveUrl}]
                        </span>
                      )}
                      {(project.github || project.githubUrl) && (
                        <span
                          style={{
                            fontSize: dynamicStyles.projectLinkSize,
                            color: selectedTheme.linkColor,
                            marginLeft: "8px",
                            fontWeight: "normal",
                          }}
                        >
                          [GitHub: {project.github || project.githubUrl}]
                        </span>
                      )}
                    </div>
                    {project.technologies &&
                      project.technologies.length > 0 && (
                        <div
                          style={{
                            fontSize: dynamicStyles.projectTechSize,
                            color: selectedTheme.primary,
                            marginTop: "2px",
                            fontWeight: "600",
                          }}
                        >
                          {Array.isArray(project.technologies)
                            ? project.technologies.join(" • ")
                            : project.technologies}
                        </div>
                      )}
                  </div>
                  {project.date && (
                    <div
                      style={{
                        fontSize: dynamicStyles.experienceDateSize,
                        color: selectedTheme.textMuted,
                        whiteSpace: "nowrap",
                        marginLeft: "15px",
                        fontWeight: "500",
                      }}
                    >
                      {project.date}
                    </div>
                  )}
                </div>
                {project.description &&
                  (!project.bullets?.length ||
                    !isDescriptionDuplicatedInBullets(project.description, project.bullets)) && (
                  <p
                    style={{
                      fontSize: dynamicStyles.projectBulletSize,
                      lineHeight: dynamicStyles.projectBulletLineHeight,
                      color: selectedTheme.textLight,
                      marginTop: dynamicStyles.projectTechMarginBottom,
                      marginBottom: "3px",
                    }}
                  >
                    {project.description}
                  </p>
                )}
                {project.bullets && project.bullets.length > 0 && (
                  <ul
                    style={{
                      marginTop: dynamicStyles.projectTechMarginBottom,
                      marginBottom: "0",
                      paddingLeft: "0",
                      listStyleType: "none",
                    }}
                  >
                    {project.bullets
                      .filter((bullet) => bullet && bullet.trim())
                      .map((bullet, bulletIndex) => (
                        <li
                          key={bulletIndex}
                          style={{
                            fontSize: dynamicStyles.projectBulletSize,
                            lineHeight: dynamicStyles.projectBulletLineHeight,
                            color: selectedTheme.textLight,
                            marginBottom:
                              dynamicStyles.projectBulletMarginBottom,
                            marginLeft: "18px",
                            listStyleType: "disc",
                            listStylePosition: "outside",
                            display: "list-item",
                          }}
                        >
                          {bullet}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      education: resumeData.education && resumeData.education.length > 0 && (
        <section
          key="education"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Education
          </div>
          <div>
            {resumeData.education.map((edu, index) => (
              <div
                key={index}
                style={{
                  marginBottom: dynamicStyles.educationMarginBottom,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{flex: 1}}>
                    <div
                      style={{
                        fontSize: dynamicStyles.educationDegreeSize,
                        fontWeight: "700",
                        color: selectedTheme.text,
                      }}
                    >
                      {formatEducationDegreeAndField(edu)}
                    </div>
                    <div
                      style={{
                        fontSize: dynamicStyles.educationInstitutionSize,
                        color: selectedTheme.primary,
                        marginTop: "1px",
                        fontWeight: "600",
                      }}
                    >
                      {edu.institution}
                      {edu.location && ` • ${edu.location}`}
                    </div>
                    {edu.gpa && (
                      <div
                        style={{
                          fontSize: dynamicStyles.educationGpaSize,
                          color: selectedTheme.textLight,
                          marginTop: "2px",
                        }}
                      >
                        GPA: {edu.gpa}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: dynamicStyles.educationDateSize,
                      color: selectedTheme.textMuted,
                      whiteSpace: "nowrap",
                      marginLeft: "15px",
                      fontWeight: "500",
                    }}
                  >
                    {edu.graduationDate}
                  </div>
                </div>
                {edu.bullets && edu.bullets.length > 0 && (
                  <ul
                    style={{
                      marginTop: "3px",
                      marginBottom: "0",
                      paddingLeft: "0",
                      listStyleType: "none",
                    }}
                  >
                    {edu.bullets
                      .filter((bullet) => bullet && bullet.trim())
                      .map((bullet, bulletIndex) => (
                        <li
                          key={bulletIndex}
                          style={{
                            fontSize: dynamicStyles.projectBulletSize,
                            lineHeight: dynamicStyles.projectBulletLineHeight,
                            color: selectedTheme.textLight,
                            marginBottom:
                              dynamicStyles.projectBulletMarginBottom,
                            marginLeft: "18px",
                            listStyleType: "disc",
                            listStylePosition: "outside",
                            display: "list-item",
                          }}
                        >
                          {bullet}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      certifications: resumeData.certifications &&
        resumeData.certifications.length > 0 && (
          <section
            key="certifications"
            style={{marginBottom: dynamicStyles.sectionMarginBottom}}
          >
            <div
              style={{
                display: "inline-block",
                backgroundColor: selectedTheme.primary,
                color: "#ffffff",
                fontSize: dynamicStyles.sectionHeadingSize,
                fontWeight: "bold",
                marginBottom: dynamicStyles.sectionHeadingMarginBottom,
                padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Certifications
            </div>
            <div>
              {resumeData.certifications.map((cert, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: dynamicStyles.certificationMarginBottom,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{flex: 1}}>
                      <div
                        style={{
                          fontSize: dynamicStyles.certificationNameSize,
                          fontWeight: "700",
                          color: selectedTheme.text,
                        }}
                      >
                        {typeof cert === "string"
                          ? cert
                          : cert.name || cert.title || cert.issuer || "Certification"}
                      </div>
                      <div
                        style={{
                          fontSize: dynamicStyles.certificationIssuerSize,
                          color: selectedTheme.primary,
                          marginTop: "1px",
                          fontWeight: "600",
                        }}
                      >
                        {cert.issuer}
                      </div>
                    </div>
                    {cert.date && (
                      <div
                        style={{
                          fontSize: dynamicStyles.certificationIssuerSize,
                          color: selectedTheme.textMuted,
                          whiteSpace: "nowrap",
                          marginLeft: "15px",
                          fontWeight: "500",
                        }}
                      >
                        {cert.date}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ),

      achievements: resumeData.achievements &&
        resumeData.achievements.length > 0 && (
          <section
            key="achievements"
            style={{marginBottom: dynamicStyles.sectionMarginBottom}}
          >
            <div
              style={{
                display: "inline-block",
                backgroundColor: selectedTheme.primary,
                color: "#ffffff",
                fontSize: dynamicStyles.sectionHeadingSize,
                fontWeight: "bold",
                marginBottom: dynamicStyles.sectionHeadingMarginBottom,
                padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Key Achievements
            </div>
            <ul
              style={{
                marginTop: "3px",
                marginBottom: "0",
                paddingLeft: "0",
                listStyleType: "none",
              }}
            >
              {resumeData.achievements
                .filter(
                  (achievement) =>
                    achievement &&
                    (typeof achievement === "string"
                      ? achievement.trim()
                      : achievement.title || achievement.description)
                )
                .map((achievement, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: dynamicStyles.itemTitleSize,
                      lineHeight: "1.5",
                      color: selectedTheme.textLight,
                      marginBottom: dynamicStyles.itemMarginBottom,
                      marginLeft: "18px",
                      listStyleType: "disc",
                      listStylePosition: "outside",
                      display: "list-item",
                    }}
                  >
                    {achievement}
                  </li>
                ))}
            </ul>
          </section>
        ),

      languages: resumeData.languages && resumeData.languages.length > 0 && (
        <section
          key="languages"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Languages
          </div>
          <div>
            {resumeData.languages.map((lang, index) => (
              <div
                key={index}
                style={{
                  marginBottom: dynamicStyles.itemMarginBottom,
                }}
              >
                <span
                  style={{
                    fontSize: dynamicStyles.itemTitleSize,
                    fontWeight: "700",
                    color: selectedTheme.text,
                  }}
                >
                  {lang.language}
                </span>
                {lang.proficiency && (
                  <span
                    style={{
                      fontSize: dynamicStyles.itemDetailSize,
                      color: selectedTheme.textLight,
                      marginLeft: "8px",
                    }}
                  >
                    — {lang.proficiency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      volunteer: resumeData.volunteer && resumeData.volunteer.length > 0 && (
        <section
          key="volunteer"
          style={{marginBottom: dynamicStyles.sectionMarginBottom}}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: selectedTheme.primary,
              color: "#ffffff",
              fontSize: dynamicStyles.sectionHeadingSize,
              fontWeight: "bold",
              marginBottom: dynamicStyles.sectionHeadingMarginBottom,
              padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Volunteer Experience
          </div>
          <div>
            {resumeData.volunteer.map((vol, index) => (
              <div
                key={index}
                style={{
                  marginBottom: dynamicStyles.itemMarginBottom,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{flex: 1}}>
                    <div
                      style={{
                        fontSize: dynamicStyles.itemTitleSize,
                        fontWeight: "700",
                        color: selectedTheme.text,
                      }}
                    >
                      {vol.role}
                    </div>
                    <div
                      style={{
                        fontSize: dynamicStyles.itemDetailSize,
                        color: selectedTheme.primary,
                        marginTop: "1px",
                        fontWeight: "600",
                      }}
                    >
                      {vol.organization}
                    </div>
                  </div>
                  {vol.date && (
                    <div
                      style={{
                        fontSize: dynamicStyles.itemDetailSize,
                        color: selectedTheme.textMuted,
                        whiteSpace: "nowrap",
                        marginLeft: "15px",
                        fontWeight: "500",
                      }}
                    >
                      {vol.date}
                    </div>
                  )}
                </div>
                {vol.description && (
                  <p
                    style={{
                      fontSize: dynamicStyles.itemDetailSize,
                      lineHeight: "1.5",
                      color: selectedTheme.textLight,
                      marginTop: "3px",
                      marginBottom: "0",
                    }}
                  >
                    {vol.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ),

      customSections: resumeData.customSections &&
        resumeData.customSections.length > 0 && (
          <section
            key="customSections"
            style={{ marginBottom: dynamicStyles.sectionMarginBottom }}
          >
            {resumeData.customSections.map((sec, sIdx) => {
              const items = Array.isArray(sec.items) ? sec.items : [];
              return (
                <div key={sIdx} style={{ marginBottom: dynamicStyles.sectionMarginBottom }}>
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor: selectedTheme.primary,
                      color: "#ffffff",
                      fontSize: dynamicStyles.sectionHeadingSize,
                      fontWeight: "bold",
                      marginBottom: dynamicStyles.sectionHeadingMarginBottom,
                      padding: `${dynamicStyles.sectionHeadingPaddingV} ${dynamicStyles.sectionHeadingPaddingH}`,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {sec.title || "Additional Information"}
                  </div>
                  {sec.content && (
                    <p
                      style={{
                        fontSize: dynamicStyles.summarySize,
                        lineHeight: dynamicStyles.summaryLineHeight,
                        color: selectedTheme.textLight,
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
                                marginTop: "2px",
                                marginBottom: "0",
                                paddingLeft: "0",
                                listStyleType: "none",
                              }}
                            >
                              <li
                                style={{
                                  fontSize: dynamicStyles.itemTitleSize,
                                  lineHeight: "1.5",
                                  color: selectedTheme.textLight,
                                  marginLeft: "18px",
                                  listStyleType: "disc",
                                  listStylePosition: "outside",
                                  display: "list-item",
                                }}
                              >
                                {typeof itemTitle === "string" ? itemTitle : ""}
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
                                gap: "6px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                                {itemTitle && (
                                  <span
                                    style={{
                                      fontSize: dynamicStyles.itemTitleSize,
                                      fontWeight: "700",
                                      color: selectedTheme.text,
                                    }}
                                  >
                                    {itemTitle}
                                  </span>
                                )}
                                {subtitle && (
                                  <span
                                    style={{
                                      fontSize: dynamicStyles.certificationIssuerSize,
                                      color: selectedTheme.primary,
                                      fontWeight: "600",
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
                                      fontSize: dynamicStyles.projectLinkSize,
                                      color: selectedTheme.linkColor || selectedTheme.primary,
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
                                    fontWeight: "500",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {date}
                                </span>
                              )}
                            </div>
                            {description && (
                              <p
                                style={{
                                  fontSize: dynamicStyles.projectBulletSize,
                                  lineHeight: dynamicStyles.projectBulletLineHeight,
                                  color: selectedTheme.textLight,
                                  margin: "2px 0 3px 0",
                                }}
                              >
                                {description}
                              </p>
                            )}
                            {bullets.length > 0 && (
                              <ul
                                style={{
                                  marginTop: "2px",
                                  marginBottom: "0",
                                  paddingLeft: "0",
                                  listStyleType: "none",
                                }}
                              >
                                {bullets.map((b, bIdx) => (
                                  <li
                                    key={bIdx}
                                    style={{
                                      fontSize: dynamicStyles.projectBulletSize,
                                      lineHeight: dynamicStyles.projectBulletLineHeight,
                                      color: selectedTheme.textLight,
                                      marginBottom: dynamicStyles.projectBulletMarginBottom,
                                      marginLeft: "18px",
                                      listStyleType: "disc",
                                      listStylePosition: "outside",
                                      display: "list-item",
                                    }}
                                  >
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
                </div>
              );
            })}
          </section>
        ),
    };

    return sections[sectionId];
  };

  return (
    <div
      ref={ref}
      style={{
        width: "210mm",
        backgroundColor: "#ffffff",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: selectedTheme.text,
        padding: `${dynamicStyles.pageMarginTop} ${dynamicStyles.pageMarginRight} ${dynamicStyles.pageMarginBottom} ${dynamicStyles.pageMarginLeft}`,
        boxSizing: "border-box",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: "relative",
      }}
    >
      <div ref={contentRef}>
        {/* Header Section */}
        <header
          style={{
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: `${dynamicStyles.headerBorderWidth} solid ${selectedTheme.primary}`,
          }}
        >
          <h1
            style={{
              fontSize: dynamicStyles.nameSize,
              fontWeight: "800",
              margin: "0 0 " + dynamicStyles.nameMarginBottom + " 0",
              color: selectedTheme.primary,
              letterSpacing: "0.3px",
            }}
          >
            {resumeData.name || "Your Name"}
          </h1>

          {/* Contact Information */}
          {resumeData.contact && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: dynamicStyles.contactGap,
                fontSize: dynamicStyles.contactSize,
                color: selectedTheme.textLight,
                fontWeight: "500",
              }}
            >
              {resumeData.contact.email && (
                <span>{resumeData.contact.email}</span>
              )}
              {resumeData.contact.phone && (
                <>
                  <span style={{color: selectedTheme.border}}>•</span>
                  <span>{resumeData.contact.phone}</span>
                </>
              )}
              {resumeData.contact.location && (
                <>
                  <span style={{color: selectedTheme.border}}>•</span>
                  <span>{resumeData.contact.location}</span>
                </>
              )}
              {resumeData.contact.linkedin && (
                <>
                  <span style={{color: selectedTheme.border}}>•</span>
                  <span>{resumeData.contact.linkedin}</span>
                </>
              )}
              {resumeData.contact.github && (
                <>
                  <span style={{color: selectedTheme.border}}>•</span>
                  <span>{resumeData.contact.github}</span>
                </>
              )}
              {(resumeData.contact.portfolio || resumeData.contact.website) && (
                <>
                  <span style={{color: selectedTheme.border}}>•</span>
                  <span>{resumeData.contact.portfolio || resumeData.contact.website}</span>
                </>
              )}
            </div>
          )}
        </header>

        {/* Dynamic Sections */}
        {sectionOrder.map((sectionId) => renderSection(sectionId))}
      </div>
    </div>
  );
});

ImpactProTemplate.displayName = "ImpactProTemplate";

export default ImpactProTemplate;

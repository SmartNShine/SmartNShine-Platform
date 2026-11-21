/**
 * Normalize portfolio custom sections for MongoDB (strings + structured resume items).
 */
export function normalizePortfolioCustomSections(sections) {
  if (!Array.isArray(sections)) return [];

  return sections.map((section, sectionIndex) => {
    const rawItems = Array.isArray(section?.items) ? section.items : [];

    const items = rawItems.map((item, itemIndex) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object" && !Array.isArray(item)) {
        const bullets = Array.isArray(item.bullets)
          ? item.bullets
              .map((bullet) => {
                if (typeof bullet === "string") return bullet.trim();
                if (bullet && typeof bullet === "object") {
                  return String(bullet.text || bullet.content || bullet.value || "").trim();
                }
                return "";
              })
              .filter(Boolean)
          : [];

        return {
          id: String(item.id || `item-${sectionIndex}-${itemIndex}`),
          title: String(item.title || item.name || "").trim(),
          subtitle: String(
            item.subtitle ||
              item.organization ||
              item.issuer ||
              item.publisher ||
              ""
          ).trim(),
          date: String(item.date || "").trim(),
          link: String(item.link || item.url || "").trim(),
          description: String(item.description || "").trim(),
          bullets,
        };
      }

      return String(item ?? "").trim();
    });

    return {
      id: String(section?.id || `custom-${sectionIndex}-${Date.now()}`),
      title: String(section?.title || "").trim(),
      content: String(section?.content || "").trim(),
      items,
    };
  });
}
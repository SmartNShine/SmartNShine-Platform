/**
 * Normalize portfolio custom sections for MongoDB (strings + structured resume items).
 */
export function normalizePortfolioCustomSections(sections) {
  if (!Array.isArray(sections)) {
    if (typeof sections === "string") {
      try {
        const parsed = JSON.parse(sections);
        if (Array.isArray(parsed)) return normalizePortfolioCustomSections(parsed);
      } catch {
        return [];
      }
    }
    return [];
  }

  return sections.map((section, sectionIndex) => {
    let rawItems = section?.items;
    if (typeof rawItems === "string") {
      try {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) {
          rawItems = parsed;
        } else {
          rawItems = [rawItems];
        }
      } catch {
        rawItems = rawItems.trim() ? [rawItems.trim()] : [];
      }
    } else if (!Array.isArray(rawItems)) {
      rawItems = [];
    }

    const items = rawItems.map((item, itemIndex) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              item = parsed;
            } else {
              return trimmed;
            }
          } catch {
            return trimmed;
          }
        } else {
          return trimmed;
        }
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
          image: String(
            item.image || item.imageUrl || item.thumbnail || ""
          ).trim(),
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

import { Plus, Trash2, Layers } from "lucide-react";
import PortfolioPanel from "../PortfolioPanel";
import ProjectCoverImageField from "./ProjectCoverImageField";

const blankItem = () => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  subtitle: "",
  date: "",
  link: "",
  description: "",
  bullets: [],
  image: "",
});

const normalizeItem = (item, index = 0) => {
  if (typeof item === "string") {
    return {
      id: `legacy-${index}`,
      title: item,
      subtitle: "",
      date: "",
      link: "",
      description: "",
      bullets: [],
      image: "",
    };
  }

  if (!item || typeof item !== "object") {
    return blankItem();
  }

  return {
    id: item.id || `item-${index}`,
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
    bullets: Array.isArray(item.bullets)
      ? item.bullets.map((b) => (typeof b === "string" ? b : b?.text || ""))
      : [],
    image: item.image || item.imageUrl || item.thumbnail || "",
  };
};

export default function CustomSectionsPanel({
  sections = [],
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  forceState,
  forceVersion,
}) {
  const updateItem = (sectionIndex, itemIndex, updates) => {
    const section = sections[sectionIndex] || {};
    const items = (section.items || []).map((item, idx) =>
      idx === itemIndex
        ? { ...normalizeItem(item, idx), ...updates }
        : normalizeItem(item, idx)
    );
    onUpdateSection(sectionIndex, { items });
  };

  const addItem = (sectionIndex) => {
    const section = sections[sectionIndex] || {};
    const items = [
      ...(section.items || []).map((item, idx) => normalizeItem(item, idx)),
      blankItem(),
    ];
    onUpdateSection(sectionIndex, { items });
  };

  const removeItem = (sectionIndex, itemIndex) => {
    const section = sections[sectionIndex] || {};
    const items = (section.items || [])
      .map((item, idx) => normalizeItem(item, idx))
      .filter((_, idx) => idx !== itemIndex);
    onUpdateSection(sectionIndex, { items });
  };

  return (
    <PortfolioPanel
      id="section-custom"
      title="Custom Sections"
      description="Build rich sections — certifications, publications, hackathons, volunteering — with images and links."
      icon={Layers}
      badge={`${sections.length} custom`}
      defaultOpen={true}
      forceState={forceState}
      forceVersion={forceVersion}
      actions={
        <button
          type="button"
          onClick={() =>
            onAddSection({
              id: `custom-${Date.now()}`,
              title: "",
              content: "",
              items: [blankItem()],
            })
          }
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      }
    >
      <div className="space-y-4 sm:space-y-5">
        {sections.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 py-2">
            No custom sections yet. Add one for certifications badges, publications, or any extra portfolio block.
          </p>
        ) : (
          sections.map((section, sectionIndex) => {
            const items = (section.items || []).map((item, idx) =>
              normalizeItem(item, idx)
            );

            return (
              <div
                key={section.id || `custom-section-${sectionIndex}`}
                className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/[0.1] p-4 sm:p-6 bg-white dark:bg-zinc-950 space-y-4 shadow-xs"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                      Section title
                    </label>
                    <input
                      value={section.title || ""}
                      onChange={(e) =>
                        onUpdateSection(sectionIndex, { title: e.target.value })
                      }
                      placeholder="e.g. Certifications, Publications, Hackathons"
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm sm:text-base font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                      Intro (optional)
                    </label>
                    <textarea
                      value={section.content || ""}
                      onChange={(e) =>
                        onUpdateSection(sectionIndex, {
                          content: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Short intro for this section..."
                      className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm leading-relaxed"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                      Entries ({items.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => addItem(sectionIndex)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add entry
                    </button>
                  </div>

                  {items.map((item, itemIndex) => (
                    <div
                      key={item.id || `item-${sectionIndex}-${itemIndex}`}
                      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-zinc-900/50 p-3.5 sm:p-4 space-y-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                            Title / name
                          </label>
                          <input
                            value={item.title}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, {
                                title: e.target.value,
                              })
                            }
                            placeholder="e.g. AWS Solutions Architect"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                            Subtitle / issuer
                          </label>
                          <input
                            value={item.subtitle}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, {
                                subtitle: e.target.value,
                              })
                            }
                            placeholder="e.g. Amazon Web Services"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                            Date
                          </label>
                          <input
                            value={item.date}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, {
                                date: e.target.value,
                              })
                            }
                            placeholder="e.g. Mar 2025"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                            Link / credential URL
                          </label>
                          <input
                            value={item.link}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, {
                                link: e.target.value,
                              })
                            }
                            placeholder="https://..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                            Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, {
                                description: e.target.value,
                              })
                            }
                            rows={2}
                            placeholder="What this entry is about..."
                            className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm leading-relaxed"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 block">
                            Highlights (1 per line)
                          </label>
                          <textarea
                            value={(item.bullets || []).join("\n")}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, {
                                // Preserve spaces and blank lines while typing. The
                                // server normalizes these lines when saving.
                                bullets: e.target.value.split("\n"),
                              })
                            }
                            rows={3}
                            placeholder="Key points..."
                            className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-sm leading-relaxed"
                          />
                        </div>

                        <ProjectCoverImageField
                          images={
                            item.image
                              ? [
                                  {
                                    url: item.image,
                                    alt: item.title || "Entry image",
                                    isCover: true,
                                  },
                                ]
                              : []
                          }
                          onChange={(nextImages) =>
                            updateItem(sectionIndex, itemIndex, {
                              image: nextImages?.[0]?.url || "",
                            })
                          }
                          title="Entry image / badge"
                          hint="Upload a certificate badge, publication cover, or event photo."
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(sectionIndex, itemIndex)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove entry
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveSection(sectionIndex)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove section</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </PortfolioPanel>
  );
}

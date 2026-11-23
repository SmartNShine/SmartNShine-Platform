import { Link, Plus, Trash2 } from "lucide-react";
import { getResumeSocialLink } from "@/utils/resumeSocialLinks";

export default function SocialLinksFields({ contact, updateContact }) {
  const links = Array.isArray(contact?.socialLinks) ? contact.socialLinks : [];

  const changeLink = (index, value) => {
    updateContact(
      "socialLinks",
      links.map((link, linkIndex) => (linkIndex === index ? value : link))
    );
  };

  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Social links
      </legend>
      {links.map((url, index) => {
        const Icon = getResumeSocialLink(url)?.icon || Link;

        return (
          <div key={index} className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              aria-label={`Social link ${index + 1} URL`}
              placeholder={index === 0 ? "leetcode.com/u/yourname" : "Profile URL"}
              className="input-field min-w-0"
              maxLength={500}
              value={url}
              onChange={(event) => changeLink(index, event.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              aria-label={`Remove social link ${index + 1}`}
              onClick={() => updateContact("socialLinks", links.filter((_, linkIndex) => linkIndex !== index))}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
        onClick={() => updateContact("socialLinks", [...links, ""])}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add social link
      </button>
    </fieldset>
  );
}

import { Check, Circle, AlertCircle } from "lucide-react";
import { getPublishChecklist, isPublishReady } from "./editorSteps";

export default function PublishChecklist({ form }) {
  const items = getPublishChecklist(form);
  const ready = isPublishReady(form);

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 ${
        ready
          ? "border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30"
          : "border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-center gap-2">
        {ready ? (
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
          {ready ? "Ready to publish" : "Complete before publishing"}
        </h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-zinc-300"
          >
            {item.ok ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            )}
            <span className={item.ok ? "opacity-70 line-through" : ""}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-500 dark:text-zinc-400">
        Publishing saves your latest edits first, then goes live at your public
        URL.
      </p>
    </div>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Compact dropdown for the interview setup form (listbox pattern).
 * Options: { value, label, description?, meta?, icon? }.
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Enter selects, Esc closes.
 */
export const SelectMenu = ({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  icon: FieldIcon,
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon || FieldIcon;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openMenu = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  };

  const choose = (option) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      {label && (
        <span id={`${id}-label`} className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      )}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={label ? `${id}-label ${id}-value` : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3 text-left text-sm transition-[border-color,box-shadow] duration-150 dark:bg-white/[0.03] ${
          open
            ? "border-blue-500 ring-4 ring-blue-500/10 dark:border-sky-400/60 dark:ring-sky-400/10"
            : "border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
        } focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {SelectedIcon && <SelectedIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />}
        <span id={`${id}-value`} className={`min-w-0 flex-1 truncate ${selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
          {selected?.label || placeholder}
        </span>
        {selected?.meta && <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">{selected.meta}</span>}
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:bg-[#15171F] dark:shadow-black/40"
        >
          {options.map((option, index) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(option)}
                className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 ${
                  index === active ? "bg-zinc-100 dark:bg-white/[0.06]" : ""
                } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {OptionIcon && (
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-blue-600 text-white dark:bg-sky-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300"
                  }`}>
                    <OptionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                    {option.meta && <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">{option.meta}</span>}
                  </span>
                  {option.description && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{option.description}</span>
                  )}
                </span>
                {isSelected && <Check className="mt-1 h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SelectMenu;

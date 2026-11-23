import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "./StudioIcons";

const TONES = {
  danger: {
    badge: "bg-rose-500/12 text-rose-300 ring-rose-400/25",
    confirm: "bg-rose-500 text-white hover:bg-rose-400 focus-visible:outline-rose-300",
  },
  caution: {
    badge: "bg-amber-400/12 text-amber-200 ring-amber-300/25",
    confirm: "bg-amber-300 text-neutral-950 hover:bg-amber-200 focus-visible:outline-amber-200",
  },
};

/**
 * Confirmation dialog for the dark interview studio. The safe action is focused
 * by default so Enter never ends or skips by accident; Esc and the backdrop cancel.
 */
export const StudioDialog = ({
  open,
  tone = "danger",
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep going",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);
  const styles = TONES[tone] || TONES.danger;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape" && !loading) onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, loading, onCancel]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-[#05060A]/70 backdrop-blur-md"
            onClick={() => !loading && onCancel?.()}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#11131B]/95 p-6 text-neutral-100 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ${styles.badge}`}>
              {icon}
            </div>
            <h2 id={titleId} className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
            <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-neutral-400">{description}</p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 transition-[background-color,transform] duration-150 hover:bg-neutral-200 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`h-11 rounded-full px-5 text-sm font-semibold transition-[background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${styles.confirm}`}
              >
                {loading ? "Please wait…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StudioDialog;

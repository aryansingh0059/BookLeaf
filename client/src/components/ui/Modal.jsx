import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { wobblyMd } from "../../theme/wobbly.js";

/**
 * Use for modal content that needs focus containment, Escape handling, and an accessible title.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  closeOnOverlay = true,
  className = "",
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const getFocusable = () =>
      dialog?.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    getFocusable()[0]?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event) {
      if (dialog && !dialog.contains(event.target)) {
        const first = getFocusable()[0];
        (first ?? dialog).focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-pencil/50 p-4"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        style={{ borderRadius: wobblyMd }}
        className={`relative my-auto w-full max-w-lg border-2 border-pencil bg-white p-6 pt-8 text-pencil shadow-hard-lg focus-visible:outline-none ${className}`}
      >
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 -translate-y-1/2 -rotate-2 bg-muted/90"
        />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-heading text-3xl leading-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-2 text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-12 w-12 shrink-0 place-items-center border-2 border-dashed border-pencil bg-white text-pencil hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/40"
            style={{ borderRadius: wobblyMd }}
          >
            <X aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

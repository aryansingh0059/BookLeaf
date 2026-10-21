import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { wobbly } from "../../theme/wobbly.js";

/**
 * Use for a labelled single-line field; bind the visible label to its generated or supplied id.
 */
export function Input({
  id,
  label,
  helperText,
  error,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5 font-body text-lg text-pencil">
      {label && (
        <label htmlFor={inputId} className="font-bold">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [helperId, errorId].filter(Boolean).join(" ") || undefined
        }
        style={{ borderRadius: wobbly, ...props.style }}
        className={`min-h-12 w-full border-2 bg-white px-4 py-2 font-body text-lg text-pencil placeholder:text-pencil/70 focus-visible:border-ink-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/40 ${error ? "border-accent" : "border-pencil"} ${className}`}
      />
      {helperText && (
        <p id={helperId} className="text-lg leading-relaxed text-pencil/70">
          {helperText}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-lg font-bold leading-relaxed text-[#b91c1c]"
        >
          <CircleAlert
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            strokeWidth={2.5}
          />
          {error}
        </p>
      )}
    </div>
  );
}

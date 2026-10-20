import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { wobbly } from '../../theme/wobbly.js';

/**
 * Use for a labelled choice field; provide options as children and bind its visible label.
 */
export function Select({ id, label, helperText, error, className = '', children, ...props }) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5 font-body text-lg text-pencil">
      {label && <label htmlFor={selectId} className="font-bold">{label}</label>}
      <select
        {...props}
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={[helperId, errorId].filter(Boolean).join(' ') || undefined}
        style={{ borderRadius: wobbly, ...props.style }}
        className={`min-h-12 w-full border-2 bg-white px-4 py-2 font-body text-lg text-pencil focus-visible:border-ink-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/20 ${error ? 'border-accent' : 'border-pencil'} ${className}`}
      >
        {children}
      </select>
      {helperText && <p id={helperId} className="text-base leading-relaxed text-pencil/70">{helperText}</p>}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-base font-bold leading-relaxed text-[#b91c1c]">
          <CircleAlert aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          {error}
        </p>
      )}
    </div>
  );
}

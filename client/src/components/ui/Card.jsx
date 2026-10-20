import { wobblyMd } from '../../theme/wobbly.js';

/**
 * Use for paper/post-it surfaces. Keep tilt for decorative summaries only; never tilt dense data or forms.
 */
export function Card({
  children,
  className = '',
  padding = 'p-6',
  decoration = 'none',
  tone = 'paper',
  tilt = 0,
  ...props
}) {
  const safeTilt = Math.max(-2, Math.min(2, Number(tilt) || 0));

  return (
    <section
      {...props}
      style={{ borderRadius: wobblyMd, '--ui-card-tilt': `${safeTilt}deg`, ...props.style }}
      className={`ui-card-tilt relative border-2 border-pencil ${padding} shadow-[3px_3px_0_0_rgba(45,45,45,0.1)] ${tone === 'postit' ? 'bg-postit' : 'bg-white'} ${className}`}
    >
      {decoration === 'tape' && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-4 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-2 bg-muted/80"
        />
      )}
      {decoration === 'tack' && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pencil bg-accent shadow-hard-sm"
        />
      )}
      {children}
    </section>
  );
}

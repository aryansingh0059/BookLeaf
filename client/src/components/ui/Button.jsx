import { LoaderCircle } from 'lucide-react';
import { wobbly } from '../../theme/wobbly.js';

const variants = {
  primary: 'border-[3px] border-pencil bg-white text-pencil shadow-hard hover:bg-accent hover:text-white hover:shadow-hard-sm',
  secondary: 'border-2 border-pencil bg-muted text-pencil shadow-hard hover:bg-ink-blue hover:text-white hover:shadow-hard-sm',
  danger: 'border-[3px] border-accent bg-white text-pencil shadow-hard hover:bg-accent hover:text-white hover:shadow-hard-sm',
  ghost: 'border-2 border-dashed border-pencil bg-transparent text-pencil hover:border-ink-blue hover:text-ink-blue',
};

/**
 * Use for primary actions, secondary actions, destructive actions, or dashed quiet actions.
 * Pass loading to show a spinner and disable interaction while an action is in progress.
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{ borderRadius: wobbly }}
      className={`inline-flex min-h-12 items-center justify-center gap-2 px-5 py-2 font-body text-xl font-bold motion-safe:transition-transform motion-safe:duration-100 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-blue/20 disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted disabled:text-pencil/50 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0 ${variants[variant] ?? variants.primary} ${className}`}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" strokeWidth={2.5} />}
      {children}
    </button>
  );
}

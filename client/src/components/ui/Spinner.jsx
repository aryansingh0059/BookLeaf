/**
 * Use while work is in progress; provide a label for announced status or omit it for decoration.
 */
export function Spinner({ label, size = 32, className = '' }) {
  return (
    <svg
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      role={label ? 'status' : undefined}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`text-ink-blue motion-safe:animate-spin ${className}`}
      style={{ animationDuration: '1.2s' }}
      fill="none"
    >
      <path d="M24 5.5c10.1-.4 18.3 7.8 18.2 18.4-.1 10.6-8 18.4-18.3 18.3C13.6 42.1 5.7 34.4 5.8 24 5.9 13.8 13.7 5.8 24 5.5Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="72 28" />
      <path d="M23.5 9c8.7-.2 15.2 6.6 15.3 15.1.1 8.8-6.4 15.2-14.9 15.1-8.6-.1-15-6.4-14.9-15 .1-8.3 6.1-15 14.5-15.2Z" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="38 62" />
    </svg>
  );
}

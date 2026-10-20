import { wobblySoft } from '../../theme/wobbly.js';

/**
 * Use dashed placeholders to represent content that is loading; set circle for avatar-shaped placeholders.
 */
export function Skeleton({ className = '', lines = 1, circle = false }) {
  if (circle) {
    return (
      <span
        aria-hidden="true"
        style={{ borderRadius: wobblySoft }}
        className={`block h-12 w-12 border-2 border-dashed border-muted bg-white ${className}`}
      />
    );
  }

  return (
    <span aria-hidden="true" className={`flex w-full flex-col gap-3 ${className}`}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <span
          key={index}
          style={{ borderRadius: wobblySoft, width: index === lines - 1 && lines > 1 ? '72%' : '100%' }}
          className="block h-5 border-2 border-dashed border-muted bg-white"
        />
      ))}
    </span>
  );
}

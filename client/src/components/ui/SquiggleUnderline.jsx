/**
 * Use under a short heading or nav label as decoration; it is hidden from assistive technology.
 */
export function SquiggleUnderline({ children, color = '#ff4d4d', className = '' }) {
  return (
    <span className={`relative inline-block pb-2 ${className}`}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 160 12"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-2 w-full"
      >
        <path d="M2 7c12-8 18 6 30 0s18-5 28 0 18 4 29-1 19-5 29 1 18 4 26-1 12-4 14-3" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

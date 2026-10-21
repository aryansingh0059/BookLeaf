import { wobblyAlt } from "../../theme/wobbly.js";

/**
 * Use as a compact post-it label above a section heading.
 */
export function SectionTag({ children, className = "", ...props }) {
  return (
    <span
      {...props}
      style={{ borderRadius: wobblyAlt, ...props.style }}
      className={`inline-flex items-center border-2 border-pencil bg-postit px-3 py-1 font-body text-lg font-bold text-pencil ${className}`}
    >
      {children}
    </span>
  );
}

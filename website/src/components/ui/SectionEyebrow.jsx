/**
 * Neon-green uppercase label with a small vertical bar accent — matches
 * the "| SECTION NAME" pattern used throughout the TraderAscend app.
 */
export default function SectionEyebrow({ children, className = '', as: Tag = 'div' }) {
  return (
    <Tag
      className={`inline-flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.22em] text-neon ${className}`}
    >
      <span className="w-[3px] h-3.5 bg-neon rounded-full" />
      {children}
    </Tag>
  );
}

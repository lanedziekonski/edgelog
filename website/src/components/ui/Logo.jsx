import { Link } from 'react-router-dom';

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 group ${className}`}
      aria-label="TraderAscend home"
    >
      <span className="relative w-7 h-7 flex items-center justify-center">
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <path
            d="M4 22 L16 8 L28 22"
            stroke="#00ff41"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M4 28 L16 14 L28 28"
            stroke="#00ff41"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            opacity="0.5"
          />
        </svg>
        <span className="absolute inset-0 rounded-full bg-neon/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <span className="font-display font-semibold text-lg tracking-tight">
        <span className="text-neon glow-text">Trade</span>
        <span className="text-ink">Ascend</span>
      </span>
    </Link>
  );
}

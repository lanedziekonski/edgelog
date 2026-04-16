export default function GridBackground({ className = '', intensity = 0.08, fade = true }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,65,${intensity}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,${intensity}) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: fade
            ? 'radial-gradient(ellipse 80% 60% at center, black 30%, transparent 80%)'
            : undefined,
          WebkitMaskImage: fade
            ? 'radial-gradient(ellipse 80% 60% at center, black 30%, transparent 80%)'
            : undefined,
          animation: 'gridShift 28s linear infinite',
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(0,255,65,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

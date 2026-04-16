import FadeUp from '../effects/FadeUp';

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center items-center mx-auto';
  return (
    <FadeUp className={`flex flex-col ${alignment} max-w-3xl ${className}`}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="h-px w-8 bg-neon" />
          <span className="text-neon text-xs font-mono uppercase tracking-[0.2em]">
            {eyebrow}
          </span>
          <span className="h-px w-8 bg-neon" />
        </div>
      )}
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted max-w-2xl text-balance">{subtitle}</p>
      )}
    </FadeUp>
  );
}

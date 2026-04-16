import SectionHeading from '../ui/SectionHeading';
import FadeUp from '../effects/FadeUp';
import { Star } from 'lucide-react';
import { testimonials, stats } from '../../data/testimonials';

export default function SocialProof() {
  return (
    <section className="relative py-24 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="Social proof"
          title="Traders who actually use it"
          subtitle="Real reviews from real traders running real money. No paid placements."
        />

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.08}>
              <article className="h-full rounded-xl border border-border bg-panel/50 p-6 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-neon text-neon" />
                  ))}
                </div>
                <blockquote className="text-ink/90 leading-relaxed flex-1">
                  "{t.quote}"
                </blockquote>
                <footer className="mt-6 flex items-center gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-full border border-neon/40 text-neon font-mono font-semibold text-sm bg-black/40">
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted">{t.title}</div>
                  </div>
                </footer>
              </article>
            </FadeUp>
          ))}
        </div>

        {/* Stats bar */}
        <FadeUp delay={0.2} className="mt-16">
          <div className="rounded-xl border border-border bg-gradient-to-b from-panel to-black/40 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
            {stats.map((s) => (
              <div key={s.label} className="px-6 py-8 text-center">
                <div className="text-3xl md:text-4xl font-bold text-neon glow-text font-display">
                  {s.value}
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted font-mono">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

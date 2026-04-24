import { ArrowRight } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import FadeUp from '../effects/FadeUp';
import Button from '../ui/Button';
import { tiers } from '../../data/pricing';

export default function PricingTeaser() {
  return (
    <section className="relative py-24 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans that scale with you"
          subtitle="Start free. Upgrade when you're ready for CSV import, AI plans, or daily coaching."
        />

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, i) => (
            <FadeUp key={t.id} delay={i * 0.06}>
              <div
                className={`relative h-full rounded-xl border p-6 flex flex-col gap-3 ${
                  t.popular
                    ? 'border-neon/60 bg-panel shadow-neon-soft'
                    : 'border-border bg-panel/40'
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em] bg-neon text-black rounded">
                    Most popular
                  </span>
                )}
                <div className="text-xs font-mono uppercase tracking-[0.18em] text-neon">
                  {t.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${t.monthly}</span>
                  <span className="text-xs text-muted font-mono">/mo</span>
                </div>
                <p className="text-sm text-muted">{t.tagline}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3} className="mt-12 text-center">
          <Button to="/pricing" variant="primary" size="lg">
            See Full Pricing <ArrowRight className="w-5 h-5" />
          </Button>
        </FadeUp>
      </div>
    </section>
  );
}

import { ArrowRight } from 'lucide-react';
import Button from './Button';
import FadeUp from '../effects/FadeUp';

export default function CTABanner({
  title = 'Ready to find your edge?',
  subtitle = 'Start your free TraderAscend account in under 30 seconds. No credit card required.',
  ctaLabel = 'Start Free',
  ctaTo = '/preview',
  hideSecondary = false,
}) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden border-y border-border">
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(0,255,65,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,65,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <FadeUp className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
          {title}
        </h2>
        <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto text-balance">
          {subtitle}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button to={ctaTo} variant="primary" size="lg">
            {ctaLabel} <ArrowRight className="w-5 h-5" />
          </Button>
          {!hideSecondary && (
            <Button to="/pricing" variant="ghost" size="lg">
              See Pricing
            </Button>
          )}
        </div>
      </FadeUp>
    </section>
  );
}

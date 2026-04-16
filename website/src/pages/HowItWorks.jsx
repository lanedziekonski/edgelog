import SectionHeading from '../components/ui/SectionHeading';
import StepRow from '../components/how-it-works/StepRow';
import CTABanner from '../components/ui/CTABanner';
import GridBackground from '../components/effects/GridBackground';
import { steps } from '../data/steps';

export default function HowItWorks() {
  return (
    <>
      <section className="relative pt-20 md:pt-28 pb-16 overflow-hidden border-b border-border">
        <GridBackground intensity={0.05} />
        <div className="relative max-w-7xl mx-auto px-6">
          <SectionHeading
            eyebrow="How It Works"
            title="Six steps from signup to consistent edge"
            subtitle="No setup wizards. No 30-minute onboarding. Be journaling your first trade in five minutes."
          />
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-24 md:gap-32">
          {steps.map((s, i) => (
            <StepRow key={s.n} step={s} index={i} total={steps.length} />
          ))}
        </div>
      </section>

      <CTABanner
        title="Five minutes from now, you'll be journaling."
        subtitle="Create your free TradeAscend account and skip the setup overhead."
        ctaLabel="Start Your Free Account"
      />
    </>
  );
}

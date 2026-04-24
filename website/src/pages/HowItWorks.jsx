import PageHeading from '../components/ui/PageHeading';
import StepRow from '../components/how-it-works/StepRow';
import CTABanner from '../components/ui/CTABanner';
import GridBackground from '../components/effects/GridBackground';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import { steps } from '../data/steps';

export default function HowItWorks() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackground intensity={0.05} />
        <AmbientOrbs />
        <div className="relative max-w-7xl mx-auto px-6">
          <PageHeading
            eyebrow="How It Works"
            title="Five steps from signup to your first journaled trade."
            subtitle="No setup wizards. No credit card. Be journaling your first trade in five minutes — completely free."
            watermark="PROCESS"
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
        subtitle="Create your free TraderAscend account and skip the setup overhead."
        ctaLabel="Start Your Free Account"
      />
    </>
  );
}

import { useState } from 'react';
import PageHeading from '../components/ui/PageHeading';
import SectionHeading from '../components/ui/SectionHeading';
import BillingToggle from '../components/pricing/BillingToggle';
import PricingCard from '../components/pricing/PricingCard';
import PricingFAQ from '../components/pricing/PricingFAQ';
import CTABanner from '../components/ui/CTABanner';
import GridBackground from '../components/effects/GridBackground';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import FadeUp from '../components/effects/FadeUp';
import { tiers } from '../data/pricing';

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackground intensity={0.05} />
        <AmbientOrbs />
        <div className="relative max-w-7xl mx-auto px-6">
          <PageHeading
            eyebrow="Pricing"
            title="Pick a plan that fits your edge."
            subtitle="Free forever for manual journaling. Unlock broker linking, AI plans, and the AI Coach when you're ready."
            watermark="PRICING"
          />
          <FadeUp delay={0.2} className="mt-4 pb-10 flex justify-center">
            <BillingToggle value={billing} onChange={setBilling} />
          </FadeUp>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => (
              <FadeUp key={tier.id} delay={i * 0.06}>
                <PricingCard tier={tier} billing={billing} />
              </FadeUp>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted">
            All plans include unlimited trade history, secure cloud storage, and free
            updates.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            subtitle="Can't find what you're looking for? Email hello@traderascend.com — we usually reply within a few hours."
            className="mb-14"
          />
          <PricingFAQ />
        </div>
      </section>

      <CTABanner
        title="Try Pro free for 7 days"
        subtitle="Get the AI Trading Plan Builder, full broker integrations, and pattern detection. No card upfront."
        ctaLabel="Start 7-Day Trial"
      />
    </>
  );
}

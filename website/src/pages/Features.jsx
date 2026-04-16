import PageHeading from '../components/ui/PageHeading';
import FeatureDetailRow from '../components/features/FeatureDetailRow';
import CTABanner from '../components/ui/CTABanner';
import GridBackground from '../components/effects/GridBackground';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import { detailedFeatures } from '../data/features';

export default function Features() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackground intensity={0.05} />
        <AmbientOrbs />
        <div className="relative max-w-7xl mx-auto px-6">
          <PageHeading
            eyebrow="Features"
            title="Built for traders who refuse to plateau."
            subtitle="Every feature exists because we, the team, needed it ourselves. No fluff. No bloat. Just the journal you wished existed."
            watermark="FEATURES"
          />
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-24 md:gap-32">
          {detailedFeatures.map((f, i) => (
            <FeatureDetailRow key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      <CTABanner
        title="Stop journaling in spreadsheets."
        subtitle="Get every TradeAscend feature. Start with Free, upgrade when you outgrow it."
        ctaLabel="Start Free"
      />
    </>
  );
}

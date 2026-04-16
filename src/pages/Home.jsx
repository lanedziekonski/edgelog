import Hero from '../components/home/Hero';
import FeaturesGrid from '../components/home/FeaturesGrid';
import SocialProof from '../components/home/SocialProof';
import PricingTeaser from '../components/home/PricingTeaser';
import CTABanner from '../components/ui/CTABanner';

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesGrid />
      <SocialProof />
      <PricingTeaser />
      <CTABanner />
    </>
  );
}

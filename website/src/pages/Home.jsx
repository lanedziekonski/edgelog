import Hero from '../components/home/Hero';
import TradeTicker from '../components/home/TradeTicker';
import FeaturesGrid from '../components/home/FeaturesGrid';
import LivePreview from '../components/home/LivePreview';
import StatsBand from '../components/home/StatsBand';
import SocialProof from '../components/home/SocialProof';
import PricingTeaser from '../components/home/PricingTeaser';
import CTABanner from '../components/ui/CTABanner';

export default function Home() {
  return (
    <>
      <Hero />
      <TradeTicker />
      <FeaturesGrid />
      <LivePreview />
      <StatsBand />
      <SocialProof />
      <PricingTeaser />
      <CTABanner />
    </>
  );
}

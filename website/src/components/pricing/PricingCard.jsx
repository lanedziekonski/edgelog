import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function PricingCard({ tier, billing }) {
  const price = billing === 'annual' ? tier.annual : tier.monthly;
  const isPaid = price > 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={`relative h-full rounded-2xl border p-7 flex flex-col ${
        tier.popular
          ? 'border-neon bg-gradient-to-b from-panel to-black shadow-neon'
          : 'border-border bg-panel/60 hover:border-border-bright hover:shadow-neon-soft'
      } transition-all`}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] bg-neon text-black rounded-full shadow-neon">
          Most Popular
        </span>
      )}

      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold tracking-tight">{tier.name}</h3>
        {tier.popular && (
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neon">
            ★ recommended
          </span>
        )}
      </div>
      <p className="text-sm text-muted mt-1.5">{tier.tagline}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight">${price}</span>
        <span className="text-sm text-muted font-mono">/mo</span>
      </div>
      <div className="mt-1 h-5 text-xs text-muted font-mono">
        {billing === 'annual' && isPaid && 'billed annually'}
        {billing === 'monthly' && isPaid && 'billed monthly'}
      </div>

      <div className="my-6 h-px bg-border" />

      <ul className="space-y-3 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span
              className={`grid place-items-center w-4 h-4 mt-0.5 rounded-full flex-none ${
                tier.popular ? 'bg-neon/20 text-neon' : 'text-neon'
              }`}
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span className="text-ink/85">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          to="/preview"
          variant={tier.popular ? 'primary' : 'ghost'}
          size="md"
          className="w-full"
        >
          {tier.cta} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

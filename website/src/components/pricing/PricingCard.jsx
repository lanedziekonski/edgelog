import { motion } from 'framer-motion';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

const motionProps = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 24 },
};

export default function PricingCard({ tier, billing, onSubscribe, loading, error }) {
  const price  = billing === 'annual' ? tier.annual : tier.monthly;
  const isPaid = price > 0;

  const btnBase =
    'inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-md border tracking-tight transition-all duration-200 select-none';
  const btnVariant = tier.popular
    ? `${btnBase} bg-neon text-black border-neon hover:shadow-neon hover:bg-neon/90`
    : `${btnBase} bg-transparent text-neon border-neon hover:bg-neon/10 hover:shadow-neon-soft`;

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
        {billing === 'annual' && isPaid && `billed $${tier.annualTotal}/yr`}
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
        {isPaid ? (
          <>
            <motion.button
              type="button"
              onClick={() => onSubscribe?.(tier.id)}
              disabled={loading}
              {...(loading ? {} : motionProps)}
              className={`${btnVariant} ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Starting…</>
                : <>{tier.cta}<ArrowRight className="w-4 h-4" /></>}
            </motion.button>
            {error && (
              <p className="mt-2 text-xs text-center" style={{ color: '#ff6b6b' }}>{error}</p>
            )}
          </>
        ) : (
          <Button to="/signup" variant="ghost" size="md" className="w-full">
            {tier.cta} <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

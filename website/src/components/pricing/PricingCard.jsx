import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const APP_URL = 'https://app.traderascend.com';

export default function PricingCard({ tier, billing }) {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const price = billing === 'annual' ? tier.annual : tier.monthly;
  const isPaid = price > 0;
  const billingParam = billing === 'annual' ? 'yearly' : 'monthly';

  const handleCta = () => {
    if (token) {
      // Already logged in on website — hand off to app with token
      if (tier.id === 'free') {
        window.location.href = `${APP_URL}/dashboard?token=${encodeURIComponent(token)}`;
      } else {
        window.location.href = `${APP_URL}/pricing?token=${encodeURIComponent(token)}&plan=${tier.id}&billing=${billingParam}`;
      }
    } else {
      // Not logged in — save plan intent and send to signup
      sessionStorage.setItem('pending_plan_redirect', JSON.stringify({ plan: tier.id, billing: billingParam }));
      navigate('/signup');
    }
  };

  const ctaBase =
    'inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-md border tracking-tight transition-all duration-200 select-none cursor-pointer';
  const ctaClass = tier.popular
    ? `${ctaBase} bg-neon text-black border-neon hover:shadow-neon hover:bg-neon/90`
    : `${ctaBase} bg-transparent text-neon border-neon hover:bg-neon/10 hover:shadow-neon-soft`;

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
        <button onClick={handleCta} className={ctaClass}>
          {tier.cta} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

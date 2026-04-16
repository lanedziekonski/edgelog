import { motion } from 'framer-motion';

export default function BillingToggle({ value, onChange }) {
  const isAnnual = value === 'annual';
  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative inline-flex items-center p-1 rounded-full border border-border bg-panel/60">
        {['monthly', 'annual'].map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="relative px-5 py-2 text-sm font-medium rounded-full transition-colors z-10"
              style={{ color: active ? '#000' : '#888' }}
            >
              {active && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 bg-neon rounded-full shadow-neon-soft"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {opt === 'monthly' ? 'Monthly' : 'Annual'}
            </button>
          );
        })}
      </div>
      <span
        className={`text-xs font-mono uppercase tracking-[0.18em] px-2 py-1 rounded border transition-colors ${
          isAnnual
            ? 'border-neon/60 text-neon bg-neon/10'
            : 'border-border text-muted'
        }`}
      >
        Save 20%
      </span>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { faq } from '../../data/pricing';

export default function PricingFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-3">
        {faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className={`rounded-xl border transition-colors ${
                isOpen ? 'border-neon/40 bg-panel/80' : 'border-border bg-panel/30'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full text-left px-5 py-5 flex items-center justify-between gap-4"
                aria-expanded={isOpen}
              >
                <span className="font-semibold tracking-tight">{item.q}</span>
                <span
                  className={`grid place-items-center w-7 h-7 rounded-full border flex-none transition-colors ${
                    isOpen
                      ? 'border-neon text-neon bg-neon/10'
                      : 'border-border text-muted'
                  }`}
                >
                  {isOpen ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-muted leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

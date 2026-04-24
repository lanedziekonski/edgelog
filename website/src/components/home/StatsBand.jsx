import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionEyebrow from '../ui/SectionEyebrow';

const STATS = [
  { value: 10_000, suffix: '+', label: 'Trades Logged', eyebrow: 'Volume' },
  { value: 95, suffix: '%', label: 'Improve R:R in 30 Days', eyebrow: 'Outcome' },
  { value: 5, suffix: '', label: 'CSV Broker Formats', eyebrow: 'Coverage' },
  { value: 24, suffix: '/7', label: 'AI Coaching', eyebrow: 'Always On' },
];

/**
 * Animated counter — scrolls up to the target value when in view.
 */
function Counter({ to, suffix = '', duration = 1.6 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let rafId;
    const tick = (now) => {
      const elapsed = (now - start) / 1000;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(eased * to));
      if (t < 1) rafId = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsBand() {
  return (
    <section className="relative py-24 md:py-32 border-y border-border bg-gradient-to-b from-black via-panel/20 to-black overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,255,65,0.1) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-14">
          <SectionEyebrow>Trusted by Traders</SectionEyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance max-w-3xl">
            Built to turn effort into <span className="text-neon glow-text">edge</span>.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border bg-panel/60 backdrop-blur p-6 md:p-8 text-center"
            >
              <div className="text-[10px] text-neon font-mono uppercase tracking-[0.2em]">
                {s.eyebrow}
              </div>
              <div className="mt-3 text-5xl md:text-6xl font-bold tracking-tight text-ink">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

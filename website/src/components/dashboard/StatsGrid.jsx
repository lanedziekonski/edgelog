import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import useCountUp from '../../hooks/useCountUp';
import { STATS_GRID } from '../../data/mockDashboard';
import SectionEyebrow from '../ui/SectionEyebrow';

export default function StatsGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref}>
      <SectionEyebrow>Performance</SectionEyebrow>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Core Metrics</h2>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {STATS_GRID.map((s, i) => (
          <StatCell key={s.label} {...s} inView={inView} delay={i * 0.05} />
        ))}
      </div>
    </section>
  );
}

function StatCell({ label, value, prefix = '', suffix = '', sub, positive, raw, inView, delay }) {
  const numeric = typeof value === 'number' ? value : 0;
  const count = useCountUp(numeric, { duration: 1200, start: inView });
  const display = raw ? value : `${prefix}${count.toLocaleString('en-US')}${suffix}`;
  const tone = positive ? 'text-neon' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-panel/50 px-4 py-4 backdrop-blur-sm hover:border-neon/30 transition-colors"
    >
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-2 text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${tone}`}>
        {display}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted font-mono">{sub}</div>}
    </motion.div>
  );
}

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, Flame, TrendingUp, Calendar } from 'lucide-react';
import useCountUp from '../../hooks/useCountUp';
import { HERO_STATS } from '../../data/mockDashboard';

const ICONS = [TrendingUp, ArrowUpRight, Calendar, Flame];

export default function HeroStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
    >
      {HERO_STATS.map((s, i) => (
        <HeroTile key={s.label} {...s} Icon={ICONS[i]} inView={inView} delay={i * 0.07} />
      ))}
    </div>
  );
}

function HeroTile({ label, value, prefix = '', positive, raw, Icon, inView, delay }) {
  const numeric = typeof value === 'number' ? value : 0;
  const count = useCountUp(numeric, { duration: 1200, start: inView });
  const display = raw
    ? value
    : `${prefix}${count.toLocaleString('en-US')}`;

  const tone = positive ? 'text-neon' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative rounded-2xl border border-border bg-panel/60 backdrop-blur-sm p-5 md:p-6 overflow-hidden"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 0%, rgba(0,255,65,0.1) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-[10px] md:text-[11px] text-muted font-mono uppercase tracking-[0.2em]">
          {label}
        </span>
        <Icon className="w-4 h-4 text-neon/50 group-hover:text-neon transition-colors" />
      </div>

      <div className={`relative mt-3 md:mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums ${tone}`}>
        {display}
      </div>
    </motion.div>
  );
}

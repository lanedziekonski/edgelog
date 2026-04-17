import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Trophy } from 'lucide-react';
import SectionEyebrow from '../ui/SectionEyebrow';
import { SETUP_PERFORMANCE } from '../../data/mockDashboard';

export default function SetupPerformance() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const best = [...SETUP_PERFORMANCE].sort((a, b) => b.pl - a.pl)[0];

  return (
    <section ref={ref}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Setup Performance</SectionEyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Your Playbook</h2>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-muted">
          <Trophy className="w-3.5 h-3.5 text-neon" />
          Best: <span className="text-neon">{best.name}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {SETUP_PERFORMANCE.map((s, i) => (
          <SetupRow key={s.name} setup={s} inView={inView} index={i} />
        ))}
      </div>
    </section>
  );
}

function SetupRow({ setup, inView, index }) {
  const maxTrades = 40;
  const pct = Math.min(100, (setup.trades / maxTrades) * 100);
  const isLoss = setup.pl < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08 }}
      whileHover={{ scale: 1.005 }}
      className="relative rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-5 py-4 overflow-hidden group"
    >
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-ink">{setup.name}</span>
            <span className="text-[10px] text-muted font-mono">
              {setup.trades} trades · {setup.winRate}% win
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${pct}%` } : {}}
              transition={{ duration: 1.2, delay: 0.4 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${isLoss ? 'bg-red-500' : 'bg-neon'}`}
              style={{
                boxShadow: isLoss
                  ? '0 0 10px rgba(239,68,68,0.4)'
                  : '0 0 10px rgba(0,255,65,0.4)',
              }}
            />
          </div>
        </div>

        <div className="text-right">
          <div className={`font-mono font-bold text-lg tabular-nums ${isLoss ? 'text-red-400' : 'text-neon'}`}>
            {isLoss ? '-' : '+'}${Math.abs(setup.pl).toLocaleString('en-US')}
          </div>
          <div className="text-[10px] text-muted font-mono">
            {Math.round(setup.trades * (setup.winRate / 100))}W / {setup.trades - Math.round(setup.trades * (setup.winRate / 100))}L
          </div>
        </div>
      </div>
    </motion.div>
  );
}

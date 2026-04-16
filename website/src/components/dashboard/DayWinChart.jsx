import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import SectionEyebrow from '../ui/SectionEyebrow';
import { DAY_WIN } from '../../data/mockDashboard';

export default function DayWinChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const max = Math.max(...DAY_WIN.map((d) => d.rate));

  return (
    <section ref={ref}>
      <SectionEyebrow>Day Win %</SectionEyebrow>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">By Day of Week</h2>

      <div className="mt-6 rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-5 md:p-6">
        <div className="flex items-end justify-between gap-3 h-44">
          {DAY_WIN.map((d, i) => {
            const heightPct = (d.rate / 100) * 100;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end relative">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={inView ? { height: `${heightPct}%`, opacity: 1 } : {}}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-t-md relative group"
                    style={{
                      background: d.rate >= 60
                        ? 'linear-gradient(180deg, #00ff41 0%, #00cc34 100%)'
                        : d.rate >= 50
                        ? 'linear-gradient(180deg, #888 0%, #444 100%)'
                        : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                      boxShadow: d.rate >= 60 ? '0 0 20px rgba(0,255,65,0.25)' : 'none',
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="px-2 py-1 rounded bg-panel border border-border text-xs font-mono whitespace-nowrap">
                        {d.wins}W / {d.losses}L
                      </div>
                    </div>
                  </motion.div>
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className={`text-sm font-mono font-bold ${d.rate >= 60 ? 'text-neon' : d.rate >= 50 ? 'text-muted' : 'text-red-400'}`}
                >
                  {d.rate}%
                </motion.span>
                <span className="text-[10px] text-muted font-mono uppercase tracking-wider">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

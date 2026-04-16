import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import SectionEyebrow from '../ui/SectionEyebrow';
import { MONTHLY_PNL } from '../../data/mockDashboard';

export default function MonthlyPnL() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [hovered, setHovered] = useState(null);

  const data = MONTHLY_PNL;
  const max = Math.max(...data.map((d) => Math.abs(d.pl)));

  return (
    <section ref={ref}>
      <SectionEyebrow>Monthly P&L</SectionEyebrow>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Last 12 Months</h2>

      <div className="mt-6 rounded-2xl border border-border bg-panel/50 backdrop-blur-sm p-5 md:p-6">
        {/* Bar chart */}
        <div className="flex items-center gap-2 md:gap-3 h-48 relative">
          {/* Zero axis */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />

          {data.map((m, i) => {
            const heightPct = (Math.abs(m.pl) / max) * 50; // Max 50% of container height
            const positive = m.pl >= 0;
            const active = hovered === i;

            return (
              <div
                key={m.month}
                className="flex-1 h-full flex flex-col justify-center items-center relative cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="w-full flex items-end justify-center relative" style={{ height: '50%' }}>
                  {positive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={inView ? { height: `${heightPct}%`, opacity: 1 } : {}}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute bottom-0 w-[70%] rounded-t-md"
                      style={{
                        background: 'linear-gradient(180deg, #00ff41 0%, #00a828 100%)',
                        boxShadow: active ? '0 0 20px rgba(0,255,65,0.5)' : '0 0 8px rgba(0,255,65,0.2)',
                      }}
                    />
                  )}
                </div>
                <div className="w-full flex items-start justify-center relative" style={{ height: '50%' }}>
                  {!positive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={inView ? { height: `${heightPct}%`, opacity: 1 } : {}}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-0 w-[70%] rounded-b-md"
                      style={{
                        background: 'linear-gradient(0deg, #ef4444 0%, #991b1b 100%)',
                        boxShadow: active ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 8px rgba(239,68,68,0.2)',
                      }}
                    />
                  )}
                </div>

                {/* Hover tooltip */}
                {active && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-panel border border-border shadow-neon-soft z-10 whitespace-nowrap"
                  >
                    <div className="text-[10px] text-muted font-mono uppercase">{m.month}</div>
                    <div className={`text-sm font-mono font-bold ${positive ? 'text-neon' : 'text-red-400'}`}>
                      {positive ? '+' : '-'}${Math.abs(m.pl).toLocaleString('en-US')}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex items-center gap-2 md:gap-3 mt-3">
          {data.map((m, i) => (
            <div key={m.month} className="flex-1 text-center">
              <span className={`text-[9px] md:text-[10px] font-mono uppercase tracking-wider ${hovered === i ? 'text-neon' : 'text-muted'}`}>
                {m.month}
              </span>
            </div>
          ))}
        </div>

        {/* Latest month detail table */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-5 gap-2 text-[10px] text-muted font-mono uppercase tracking-[0.18em] pb-3 border-b border-border/50">
            <span>Month</span>
            <span className="text-right">P&L</span>
            <span className="text-right">Days</span>
            <span className="text-right">Trades</span>
            <span className="text-right">Win%</span>
          </div>
          {data.slice(-3).reverse().map((m, i) => (
            <motion.div
              key={m.month}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1 + i * 0.1 }}
              className="grid grid-cols-5 gap-2 py-3 border-b border-border/30 last:border-0 text-sm font-mono"
            >
              <span className="text-ink">{m.month}</span>
              <span className={`text-right font-bold ${m.pl >= 0 ? 'text-neon' : 'text-red-400'}`}>
                {m.pl >= 0 ? '+' : '-'}${Math.abs(m.pl).toLocaleString('en-US')}
              </span>
              <span className="text-right text-muted">{m.days}d</span>
              <span className="text-right text-muted">{m.trades}</span>
              <span className={`text-right ${m.winRate >= 60 ? 'text-neon' : m.winRate >= 50 ? 'text-muted' : 'text-red-400'}`}>
                {m.winRate}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

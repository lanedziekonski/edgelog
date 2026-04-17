import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import useCountUp from '../../hooks/useCountUp';
import { STAT_CLUSTER } from '../../data/mockDashboard';

export default function StatCluster() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3">
      <ClusterTile
        Icon={TrendingUp}
        label="Best Day"
        value={STAT_CLUSTER.bestDay}
        format={(v) => `+$${v.toLocaleString('en-US')}`}
        tone="neon"
        inView={inView}
        delay={0}
      />
      <ClusterTile
        Icon={TrendingDown}
        label="Worst Day"
        value={STAT_CLUSTER.worstDay}
        format={(v) => `-$${Math.abs(v).toLocaleString('en-US')}`}
        tone="red"
        inView={inView}
        delay={0.1}
      />
      <ClusterTile
        Icon={Calendar}
        label="Green Days"
        value={STAT_CLUSTER.greenDays}
        format={(v) => `${v}/${STAT_CLUSTER.totalDays}`}
        tone="neon"
        inView={inView}
        delay={0.2}
      />
    </div>
  );
}

function ClusterTile({ Icon, label, value, format, tone, inView, delay }) {
  const count = useCountUp(Math.abs(value), { duration: 1400, start: inView });
  const display = format(value < 0 ? -count : count);
  const color = tone === 'red' ? 'text-red-400' : 'text-neon';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4 text-center md:text-left"
    >
      <Icon className={`w-4 h-4 ${color} mb-2 mx-auto md:mx-0`} />
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.18em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>
        {display}
      </div>
    </motion.div>
  );
}

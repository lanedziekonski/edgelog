import { motion } from 'framer-motion';

/**
 * Compact stat tile matching the app dashboard style:
 * uppercase label, big display value, optional delta chip.
 */
export default function StatTile({ label, value, delta, positive, tone, className = '' }) {
  const deltaColor =
    tone === 'red'
      ? 'text-red-400'
      : tone === 'muted'
      ? 'text-muted'
      : positive
      ? 'text-neon'
      : 'text-red-400';

  const valueColor = tone === 'red' ? 'text-red-400' : 'text-ink';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border border-border bg-panel/60 backdrop-blur px-4 py-4 ${className}`}
    >
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.18em]">
        {label}
      </div>
      <div className={`mt-2 text-2xl md:text-3xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </div>
      {delta && (
        <div className={`text-xs font-mono mt-1.5 ${deltaColor}`}>{delta}</div>
      )}
    </motion.div>
  );
}

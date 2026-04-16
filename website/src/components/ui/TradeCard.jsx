import { motion } from 'framer-motion';

/**
 * Journal-style trade card with colored left border, symbol + side badge,
 * meta line, P&L on the right. Matches the app's journal aesthetic.
 */
export default function TradeCard({
  symbol,
  side = 'LONG',
  setup = 'ORB',
  contracts = '1ct',
  pl,
  account = 'Alpha',
  win = true,
  delay = 0,
}) {
  const borderColor = win ? 'border-l-neon' : 'border-l-red-500';
  const plColor = win ? 'text-neon' : 'text-red-400';
  const sideColor = side === 'LONG' ? 'text-neon border-neon/40 bg-neon/10' : 'text-red-400 border-red-500/40 bg-red-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 2 }}
      className={`rounded-xl border border-border border-l-[3px] ${borderColor} bg-panel/70 backdrop-blur px-5 py-4 flex items-center justify-between`}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold text-lg tracking-tight text-ink">{symbol}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${sideColor}`}>
            {side}
          </span>
        </div>
        <div className="text-xs text-muted font-mono">
          {setup} · {contracts}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`font-mono font-bold text-lg ${plColor}`}>{pl}</span>
        <span className="text-[11px] text-muted font-mono">{account}</span>
      </div>
    </motion.div>
  );
}

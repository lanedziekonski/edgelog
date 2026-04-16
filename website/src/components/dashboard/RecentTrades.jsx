import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionEyebrow from '../ui/SectionEyebrow';
import { RECENT_TRADES } from '../../data/mockDashboard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
];

export default function RecentTrades() {
  const [filter, setFilter] = useState('all');

  const trades = RECENT_TRADES.filter((t) => {
    if (filter === 'wins') return t.pl >= 0;
    if (filter === 'losses') return t.pl < 0;
    return true;
  });

  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Recent Trades</SectionEyebrow>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Last 8 Trades</h2>
        </div>

        <div className="inline-flex gap-1.5 p-1 rounded-full border border-border bg-panel/60">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`relative px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                filter === f.id ? 'text-black' : 'text-muted hover:text-ink'
              }`}
            >
              {filter === f.id && (
                <motion.span
                  layoutId="trade-filter-pill"
                  className="absolute inset-0 rounded-full bg-neon"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-panel/40 backdrop-blur-sm overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[90px_80px_1fr_90px_120px] gap-4 px-5 py-3 border-b border-border text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
          <span>Date</span>
          <span>Symbol</span>
          <span>Setup</span>
          <span>Account</span>
          <span className="text-right">P&L</span>
        </div>

        <AnimatePresence initial={false}>
          {trades.map((t, i) => (
            <TradeRow key={`${t.date}-${t.symbol}-${i}`} trade={t} index={i} />
          ))}
        </AnimatePresence>

        {trades.length === 0 && (
          <div className="px-5 py-10 text-center text-muted font-mono text-sm">
            No trades match this filter.
          </div>
        )}
      </div>
    </section>
  );
}

function TradeRow({ trade, index }) {
  const win = trade.pl >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.02)' }}
      className="grid grid-cols-[1fr_auto] md:grid-cols-[90px_80px_1fr_90px_120px] gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center"
    >
      {/* Mobile: condensed */}
      <div className="md:hidden flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-ink">{trade.symbol}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${
            trade.side === 'LONG'
              ? 'text-neon border-neon/40 bg-neon/10'
              : 'text-red-400 border-red-500/40 bg-red-500/10'
          }`}>
            {trade.side}
          </span>
        </div>
        <span className="text-xs text-muted font-mono truncate">
          {trade.date} · {trade.setup} · {trade.qty}
        </span>
      </div>
      <div className="md:hidden text-right">
        <span className={`font-mono font-bold ${win ? 'text-neon' : 'text-red-400'}`}>
          {win ? '+' : ''}${Math.abs(trade.pl).toLocaleString('en-US')}
        </span>
      </div>

      {/* Desktop: full row */}
      <span className="hidden md:block text-sm text-muted font-mono">{trade.date}</span>
      <div className="hidden md:flex items-center gap-2">
        <span className="font-mono font-bold text-ink">{trade.symbol}</span>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase ${
          trade.side === 'LONG'
            ? 'text-neon border-neon/40 bg-neon/10'
            : 'text-red-400 border-red-500/40 bg-red-500/10'
        }`}>
          {trade.side}
        </span>
        <span className="text-sm text-muted font-mono">{trade.setup} · {trade.qty}</span>
      </div>
      <span className="hidden md:block text-sm text-muted font-mono">{trade.account}</span>
      <span className={`hidden md:block text-right font-mono font-bold ${win ? 'text-neon' : 'text-red-400'}`}>
        {win ? '+' : ''}${Math.abs(trade.pl).toLocaleString('en-US')}
      </span>
    </motion.div>
  );
}

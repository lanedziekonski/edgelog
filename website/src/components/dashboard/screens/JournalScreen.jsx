import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import { JOURNAL_TRADES } from '../../../data/mockDashboard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
  { id: 'broke', label: 'Broke Rules' },
];

export default function JournalScreen() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return JOURNAL_TRADES.filter((t) => {
      if (filter === 'wins' && t.pl < 0) return false;
      if (filter === 'losses' && t.pl >= 0) return false;
      if (filter === 'broke' && t.rulesClean) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!t.symbol.toLowerCase().includes(q) && !t.setup.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [filter, query]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Journal</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
            {JOURNAL_TRADES.length} trades
          </h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-neon text-black font-semibold hover:shadow-neon transition-shadow"
        >
          <Plus className="w-4 h-4" /> Log Trade
        </motion.button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search symbol, setup…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-panel/60 backdrop-blur text-sm focus:outline-none focus:border-neon/50 transition-colors"
          />
        </div>

        <div className="inline-flex gap-1 p-1 rounded-full border border-border bg-panel/60">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`relative px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
                filter === f.id ? 'text-black' : 'text-muted hover:text-ink'
              }`}
            >
              {filter === f.id && (
                <motion.span
                  layoutId="journal-filter-pill"
                  className="absolute inset-0 rounded-full bg-neon"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grouped trade list */}
      <div className="space-y-8">
        {grouped.map(([date, trades], di) => {
          const dayPl = trades.reduce((a, t) => a + t.pl, 0);
          const dayPositive = dayPl >= 0;
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: di * 0.05 }}
              className="space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
                  {date}
                </span>
                <span className={`text-sm font-mono font-bold ${dayPositive ? 'text-neon' : 'text-red-400'}`}>
                  {dayPositive ? '+' : '-'}${Math.abs(dayPl).toLocaleString('en-US')}
                </span>
              </div>

              {trades.map((t, i) => (
                <TradeRow key={`${date}-${i}`} trade={t} index={i} />
              ))}
            </motion.div>
          );
        })}

        {grouped.length === 0 && (
          <div className="py-16 text-center">
            <Filter className="w-8 h-8 text-muted mx-auto mb-3" />
            <div className="text-muted font-mono text-sm">No trades match this filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade, index }) {
  const win = trade.pl >= 0;
  const borderColor = win ? 'border-l-neon' : 'border-l-red-500';
  const plColor = win ? 'text-neon' : 'text-red-400';
  const sideColor =
    trade.side === 'LONG'
      ? 'text-neon border-neon/40 bg-neon/10'
      : 'text-red-400 border-red-500/40 bg-red-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.03 }}
      whileHover={{ x: 3 }}
      className={`rounded-xl border border-border border-l-[3px] ${borderColor} bg-panel/60 backdrop-blur px-4 md:px-5 py-3.5 md:py-4 flex items-center justify-between gap-3`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-ink text-base md:text-lg">{trade.symbol}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${sideColor}`}>
            {trade.side}
          </span>
          {!trade.rulesClean && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono uppercase tracking-wider">
              Rule Break
            </span>
          )}
        </div>
        <div className="text-xs text-muted font-mono truncate">
          {trade.setup} · {trade.qty}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className={`font-mono font-bold text-base md:text-lg ${plColor}`}>
          {win ? '+' : '-'}${Math.abs(trade.pl).toLocaleString('en-US')}
        </span>
        <span className="text-[11px] text-muted font-mono">{trade.account}</span>
      </div>
    </motion.div>
  );
}

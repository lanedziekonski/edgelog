import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  Target,
  Trash2,
} from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import Modal from '../../ui/Modal';
import { JOURNAL_TRADES } from '../../../data/mockDashboard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
  { id: 'broke', label: 'Broke Rules' },
];

const SETUPS = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High'];
const ACCOUNTS = ['Apex', 'FTMO', 'tastytrade'];
const SIDES = ['LONG', 'SHORT'];

export default function JournalScreen() {
  const [trades, setTrades] = useState(JOURNAL_TRADES);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [detailTrade, setDetailTrade] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filter === 'wins' && t.pl < 0) return false;
      if (filter === 'losses' && t.pl >= 0) return false;
      if (filter === 'broke' && t.rulesClean) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!t.symbol.toLowerCase().includes(q) && !t.setup.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [trades, filter, query]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((t, idx) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push({ ...t, _idx: idx });
    });
    return Object.entries(groups);
  }, [filtered]);

  const handleAdd = (newTrade) => {
    setTrades((prev) => [newTrade, ...prev]);
    setAddOpen(false);
  };

  const handleDelete = (tradeToDelete) => {
    setTrades((prev) => prev.filter((t) => t !== tradeToDelete));
    setDetailTrade(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Journal</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
            {trades.length} trades
          </h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-neon text-black font-semibold hover:shadow-neon transition-shadow"
        >
          <Plus className="w-4 h-4" /> Log Trade
        </motion.button>
      </div>

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

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {grouped.map(([date, dayTrades], di) => {
            const dayPl = dayTrades.reduce((a, t) => a + t.pl, 0);
            const dayPositive = dayPl >= 0;
            return (
              <motion.div
                key={date}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, delay: di * 0.04 }}
                className="space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
                    {date}
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      dayPositive ? 'text-neon' : 'text-red-400'
                    }`}
                  >
                    {dayPositive ? '+' : '-'}${Math.abs(dayPl).toLocaleString('en-US')}
                  </span>
                </div>

                {dayTrades.map((t, i) => (
                  <TradeRow
                    key={`${date}-${t._idx}`}
                    trade={t}
                    index={i}
                    onClick={() => setDetailTrade(t)}
                  />
                ))}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {grouped.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <Filter className="w-8 h-8 text-muted mx-auto mb-3" />
            <div className="text-muted font-mono text-sm">No trades match this filter.</div>
          </motion.div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detailTrade}
        onClose={() => setDetailTrade(null)}
        subtitle={detailTrade?.date}
        title={detailTrade ? `${detailTrade.symbol} · ${detailTrade.setup}` : ''}
        size="md"
      >
        {detailTrade && <TradeDetail trade={detailTrade} onDelete={handleDelete} />}
      </Modal>

      {/* Add trade modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        subtitle="New Entry"
        title="Log a Trade"
        size="md"
      >
        <AddTradeForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}

function TradeRow({ trade, index, onClick }) {
  const win = trade.pl >= 0;
  const borderColor = win ? 'border-l-neon' : 'border-l-red-500';
  const plColor = win ? 'text-neon' : 'text-red-400';
  const sideColor =
    trade.side === 'LONG'
      ? 'text-neon border-neon/40 bg-neon/10'
      : 'text-red-400 border-red-500/40 bg-red-500/10';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.03 }}
      whileHover={{ x: 4, borderColor: 'rgba(0,255,65,0.4)' }}
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-border border-l-[3px] ${borderColor} bg-panel/60 backdrop-blur px-4 md:px-5 py-3.5 md:py-4 flex items-center justify-between gap-3 hover:shadow-neon-soft transition-shadow`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-ink text-base md:text-lg">
            {trade.symbol}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${sideColor}`}
          >
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
    </motion.button>
  );
}

function TradeDetail({ trade, onDelete }) {
  const win = trade.pl >= 0;
  // Derive plausible entry / exit prices for the mock preview
  const entry = 15_000 + Math.abs(trade.pl) * 0.2;
  const exit = trade.side === 'LONG' ? entry + trade.pl / 10 : entry - trade.pl / 10;
  const rr = win ? (2 + Math.random() * 1.2).toFixed(2) : (0.4 + Math.random() * 0.5).toFixed(2);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-bg/60 p-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted">P&L</div>
          <div
            className={`mt-1 text-4xl md:text-5xl font-bold tabular-nums ${
              win ? 'text-neon glow-text' : 'text-red-400'
            }`}
          >
            {win ? '+' : '-'}${Math.abs(trade.pl).toLocaleString('en-US')}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest ${
            win ? 'text-neon' : 'text-red-400'
          }`}
        >
          {win ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {win ? 'Winner' : 'Loss'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Field label="Side" value={trade.side} tone={trade.side === 'LONG' ? 'neon' : 'red'} />
        <Field label="Setup" value={trade.setup} />
        <Field label="Quantity" value={trade.qty} />
        <Field label="Account" value={trade.account} />
        <Field label="Entry" value={`$${entry.toFixed(2)}`} />
        <Field label="Exit" value={`$${exit.toFixed(2)}`} />
        <Field label="R:R" value={`${rr}R`} tone="neon" />
        <Field
          label="Rules"
          value={trade.rulesClean ? 'Clean' : 'Broken'}
          tone={trade.rulesClean ? 'neon' : 'amber'}
        />
      </div>

      <div className="rounded-xl border border-border bg-bg/40 p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-2">
          <Target className="w-3.5 h-3.5" />
          Plan Adherence
        </div>
        <p className="text-sm text-ink/90 leading-relaxed">
          {trade.rulesClean
            ? `Setup fired on plan. Entry confirmed with volume, stop placed below structure, and target hit cleanly for a ${rr}R result.`
            : `Entered outside the setup window. Review the session rules — tightening the window usually improves win rate on ${trade.setup} trades.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
        <Tag Icon={Clock} label={trade.setup.split(' ')[0]} />
        <Tag Icon={Shield} label={trade.rulesClean ? 'On-plan' : 'Rule break'} />
        <Tag Icon={Target} label={`${rr}R`} />
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <button
          onClick={() => onDelete(trade)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete trade
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, tone = 'ink' }) {
  const color =
    tone === 'neon'
      ? 'text-neon'
      : tone === 'red'
      ? 'text-red-400'
      : tone === 'amber'
      ? 'text-amber-400'
      : 'text-ink';
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className={`mt-0.5 text-sm font-mono font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Tag({ Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-bg/40 text-muted">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function AddTradeForm({ onSubmit, onCancel }) {
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const defaultDate = `${months[today.getMonth()]} ${today.getDate()}`;

  const [form, setForm] = useState({
    date: defaultDate,
    symbol: 'MNQ',
    side: 'LONG',
    setup: SETUPS[0],
    qty: '2ct',
    account: ACCOUNTS[0],
    pl: '',
    rulesClean: true,
  });

  const valid = form.symbol && form.pl !== '' && !Number.isNaN(Number(form.pl));

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      setup: form.setup,
      qty: form.qty || '1ct',
      account: form.account,
      pl: Number(form.pl),
      rulesClean: form.rulesClean,
    });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" value={form.date} onChange={set('date')} placeholder="Apr 16" />
        <Input label="Symbol" value={form.symbol} onChange={set('symbol')} placeholder="MNQ" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Side" value={form.side} onChange={set('side')} options={SIDES} />
        <Input label="Quantity" value={form.qty} onChange={set('qty')} placeholder="2ct" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Setup" value={form.setup} onChange={set('setup')} options={SETUPS} />
        <Select label="Account" value={form.account} onChange={set('account')} options={ACCOUNTS} />
      </div>

      <Input
        label="Net P&L ($)"
        value={form.pl}
        onChange={set('pl')}
        placeholder="425 or -188"
        type="number"
      />

      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-bg/40 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.rulesClean}
          onChange={(e) => setForm((f) => ({ ...f, rulesClean: e.target.checked }))}
          className="w-4 h-4 accent-neon"
        />
        <span className="text-sm">Trade followed all plan rules</span>
      </label>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <motion.button
          type="submit"
          disabled={!valid}
          whileHover={valid ? { scale: 1.02 } : undefined}
          whileTap={valid ? { scale: 0.98 } : undefined}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
            valid
              ? 'bg-neon text-black hover:shadow-neon'
              : 'bg-panel text-muted border border-border cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" /> Save Trade
        </motion.button>
      </div>
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg/60 text-sm focus:outline-none focus:border-neon/50 transition-colors"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-1.5">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg/60 text-sm focus:outline-none focus:border-neon/50 transition-colors"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

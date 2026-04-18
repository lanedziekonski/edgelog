import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  Upload,
  Image as ImageIcon,
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

function withIds(trades) {
  return trades.map((t, i) => ({ ...t, id: `t-${Date.now()}-${i}` }));
}

export default function JournalScreen() {
  const [trades, setTrades] = useState(() => withIds(JOURNAL_TRADES));
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const viewingTrade = viewingId ? trades.find((t) => t.id === viewingId) : null;
  const editingTrade = editingId ? trades.find((t) => t.id === editingId) : null;

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
    const withId = { ...newTrade, id: `t-${Date.now()}` };
    setTrades((prev) => [withId, ...prev]);
    setAddOpen(false);
  };

  const handleDelete = (id) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    setEditingId(null);
    setViewingId(null);
  };

  const handleUploadScreenshot = (id, dataUrl) => {
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, screenshot: dataUrl } : t)));
  };

  const handleRemoveScreenshot = (id) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, screenshot: undefined } : t)),
    );
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
                    key={t.id}
                    trade={t}
                    index={i}
                    onView={() => setViewingId(t.id)}
                    onEdit={() => setEditingId(t.id)}
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

      {/* Screenshot view popup */}
      <Modal
        open={!!viewingTrade}
        onClose={() => setViewingId(null)}
        subtitle={viewingTrade?.date}
        title={viewingTrade ? `${viewingTrade.symbol} · ${viewingTrade.setup}` : ''}
        size="lg"
      >
        {viewingTrade && (
          <TradeScreenshotView
            trade={viewingTrade}
            onEdit={() => {
              setViewingId(null);
              setEditingId(viewingTrade.id);
            }}
          />
        )}
      </Modal>

      {/* Edit trade modal (screenshot upload + delete) */}
      <Modal
        open={!!editingTrade}
        onClose={() => setEditingId(null)}
        subtitle="Edit"
        title={editingTrade ? `${editingTrade.symbol} · ${editingTrade.setup}` : ''}
        size="md"
      >
        {editingTrade && (
          <EditTradeForm
            trade={editingTrade}
            onUpload={(dataUrl) => handleUploadScreenshot(editingTrade.id, dataUrl)}
            onRemove={() => handleRemoveScreenshot(editingTrade.id)}
            onDelete={() => handleDelete(editingTrade.id)}
            onDone={() => setEditingId(null)}
          />
        )}
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

function TradeRow({ trade, index, onView, onEdit }) {
  const win = trade.pl >= 0;
  const borderColor = win ? 'border-l-neon' : 'border-l-red-500';
  const plColor = win ? 'text-neon' : 'text-red-400';
  const sideColor =
    trade.side === 'LONG'
      ? 'text-neon border-neon/40 bg-neon/10'
      : 'text-red-400 border-red-500/40 bg-red-500/10';

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
    }
  };

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.03 }}
      whileHover={{ x: 4, borderColor: 'rgba(0,255,65,0.4)' }}
      onClick={onView}
      onKeyDown={handleKey}
      className={`group cursor-pointer rounded-xl border border-border border-l-[3px] ${borderColor} bg-panel/60 backdrop-blur px-4 md:px-5 py-3.5 md:py-4 flex items-center justify-between gap-3 hover:shadow-neon-soft transition-shadow focus:outline-none focus:ring-2 focus:ring-neon/40`}
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
          {trade.screenshot && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded border border-neon/40 bg-neon/10 text-neon font-mono uppercase tracking-wider inline-flex items-center gap-1"
              aria-label="Has screenshot"
            >
              <ImageIcon className="w-3 h-3" /> Shot
            </span>
          )}
        </div>
        <div className="text-xs text-muted font-mono truncate">
          {trade.setup} · {trade.qty}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-end gap-0.5">
          <span className={`font-mono font-bold text-base md:text-lg ${plColor}`}>
            {win ? '+' : '-'}${Math.abs(trade.pl).toLocaleString('en-US')}
          </span>
          <span className="text-[11px] text-muted font-mono">{trade.account}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit trade"
          className="p-2 rounded-lg border border-border text-muted hover:text-neon hover:border-neon/40 transition-colors opacity-70 group-hover:opacity-100"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function TradeScreenshotView({ trade, onEdit }) {
  const win = trade.pl >= 0;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`font-mono font-bold text-2xl md:text-3xl tabular-nums ${
            win ? 'text-neon' : 'text-red-400'
          }`}
        >
          {win ? '+' : '-'}${Math.abs(trade.pl).toLocaleString('en-US')}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-panel/60 text-sm text-muted hover:text-neon hover:border-neon/40 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </motion.button>
      </div>

      {trade.screenshot ? (
        <div className="rounded-xl border border-border bg-black overflow-hidden">
          <img
            src={trade.screenshot}
            alt={`${trade.symbol} trade screenshot`}
            className="w-full max-h-[65vh] object-contain"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-bg/40 py-14 px-6 text-center">
          <ImageIcon className="w-10 h-10 text-muted mx-auto mb-3 opacity-60" />
          <div className="text-sm text-ink/80">No screenshot uploaded</div>
          <div className="text-xs text-muted mt-1">
            Tap <span className="text-neon font-mono">Edit</span> to upload one.
          </div>
        </div>
      )}
    </div>
  );
}

function EditTradeForm({ trade, onUpload, onRemove, onDelete, onDone }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpload(ev.target.result);
      setUploading(false);
      e.target.value = '';
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-2">
          Screenshot
        </div>
        {trade.screenshot ? (
          <div className="rounded-xl border border-border bg-black overflow-hidden">
            <img
              src={trade.screenshot}
              alt=""
              className="w-full max-h-[50vh] object-contain"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-bg/40 py-10 px-6 text-center">
            <ImageIcon className="w-8 h-8 text-muted mx-auto mb-2 opacity-60" />
            <div className="text-xs text-muted">No screenshot uploaded yet</div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <div className="flex gap-2">
        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          whileHover={{ scale: uploading ? 1 : 1.02 }}
          whileTap={{ scale: uploading ? 1 : 0.98 }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-neon text-black font-semibold hover:shadow-neon transition-shadow disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          {uploading
            ? 'Uploading…'
            : trade.screenshot
            ? 'Replace Screenshot'
            : 'Upload Screenshot'}
        </motion.button>
        {trade.screenshot && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove screenshot"
            className="px-3.5 py-2.5 rounded-full border border-border text-muted hover:text-red-400 hover:border-red-500/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete trade
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          Done
        </button>
      </div>
    </div>
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

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, ChevronDown, ChevronUp, X, Pencil, Upload, FileText, Camera, Loader as LoaderIcon, ImageOff } from 'lucide-react';
import { useTrades, fmtPnl } from '../hooks/useTrades';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountFilter } from '../context/AccountFilterContext';

const G = '#00ff41';
const SETUPS = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High', 'Other'];
const DIRECTIONS = ['LONG', 'SHORT'];
const FILTERS = ['all', 'wins', 'losses', 'rule breaks'];

const EMPTY_FORM = {
  symbol: '',
  date: new Date().toISOString().split('T')[0],
  direction: 'LONG',
  setup: 'ORB',
  pnl: '',
  quantity: '1',
  account: '',
  entryPrice: '',
  exitPrice: '',
  stopPrice: '',
  entryTime: '',
  exitTime: '',
  emotionBefore: 'Calm',
  emotionAfter: 'Neutral',
  notes: '',
  followedPlan: true,
};

const EMOTIONS_BEFORE = ['Calm', 'Confident', 'Anxious', 'Excited', 'Frustrated', 'Tired', 'Focused', 'Distracted'];
const EMOTIONS_AFTER = ['Neutral', 'Satisfied', 'Disappointed', 'Relieved', 'Angry', 'Happy', 'Regretful', 'Proud'];

export default function AppJournal() {
  const { trades, loading, reload, addTrade, deleteTrade, updateTrade, importCsv } = useTrades();
  const { accounts } = useAccounts();
  const { selectedAccountId } = useAccountFilter();
  const [filter, setFilter]   = useState('all');
  const [query, setQuery]     = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [err, setErr]         = useState('');
  const [editingTrade, setEditingTrade] = useState(null);
  const [csvOpen, setCsvOpen]           = useState(false);
  const [csvFile, setCsvFile]           = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvErr, setCsvErr]             = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(null);
  const [deletingScreenshot, setDeletingScreenshot]   = useState(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('addTrade') === '1') {
      const date = searchParams.get('date');
      if (date) setForm(f => ({ ...f, date }));
      setAddOpen(true);
    }
  }, []);

  const openEdit = (t) => {
    setEditingTrade(t);
    setForm({
      symbol: t.symbol || '',
      date: t.date || new Date().toISOString().split('T')[0],
      direction: t.side || t.direction || 'LONG',
      setup: t.setup || 'ORB',
      pnl: String(t.pnl ?? ''),
      quantity: String(t.quantity ?? '1'),
      account: t.account || '',
      entryPrice: t.entryPrice != null ? String(t.entryPrice) : '',
      exitPrice: t.exitPrice != null ? String(t.exitPrice) : '',
      stopPrice: t.stopPrice != null ? String(t.stopPrice) : '',
      entryTime: t.entryTime || '',
      exitTime: t.exitTime || '',
      emotionBefore: t.emotionBefore || 'Calm',
      emotionAfter: t.emotionAfter || 'Neutral',
      notes: t.notes || '',
      followedPlan: !!t.followedPlan,
    });
    setErr('');
    setAddOpen(true);
  };

  const closeModal = () => { setAddOpen(false); setEditingTrade(null); setForm(EMPTY_FORM); setErr(''); };

  const handleScreenshotUpload = async (tradeId, file) => {
    if (!file) return;
    setUploadingScreenshot(tradeId);
    try {
      const token = localStorage.getItem('traderascend_token');
      const fd = new FormData();
      fd.append('screenshot', file);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com'}/api/trades/${tradeId}/screenshot`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      reload();
    } catch (e) { console.error('Screenshot upload failed:', e); }
    finally { setUploadingScreenshot(null); }
  };

  const handleScreenshotDelete = async (tradeId) => {
    setDeletingScreenshot(tradeId);
    try {
      const token = localStorage.getItem('traderascend_token');
      await fetch(
        `${import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com'}/api/trades/${tradeId}/screenshot`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      reload();
    } catch (e) { console.error('Screenshot delete failed:', e); }
    finally { setDeletingScreenshot(null); }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvErr('');
    try {
      await importCsv(csvFile);
      setCsvOpen(false);
      setCsvFile(null);
    } catch (e) {
      setCsvErr(e.message || 'Import failed');
    } finally {
      setCsvImporting(false);
    }
  };

  const filtered = useMemo(() => {
    const selectedAccount = selectedAccountId ? accounts.find(a => String(a.id) === String(selectedAccountId)) : null;
    const selectedAccountName = selectedAccount?.name;
    const sorted = [...trades].sort((a, b) => b.date?.localeCompare(a.date) || 0);
    return sorted.filter(t => {
      if (selectedAccountId && t.account !== selectedAccountName) return false;
      if (filter === 'wins'        && t.pnl < 0) return false;
      if (filter === 'losses'      && t.pnl >= 0) return false;
      if (filter === 'rule breaks' && t.followedPlan) return false;
      if (query) {
        const q = query.toLowerCase();
        return (t.symbol?.toLowerCase().includes(q) || t.setup?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [trades, accounts, selectedAccountId, filter, query]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(t => { (g[t.date] = g[t.date] || []).push(t); });
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.symbol.trim()) { setErr('Symbol is required'); return; }
    const pnlNum = parseFloat(form.pnl);
    if (isNaN(pnlNum)) { setErr('P&L must be a number'); return; }
    setSaving(true);
    const payload = {
      ...form,
      symbol: form.symbol.toUpperCase(),
      pnl: pnlNum,
      quantity: Number(form.quantity) || 1,
      entry_price: form.entryPrice ? parseFloat(form.entryPrice) : null,
      exit_price: form.exitPrice ? parseFloat(form.exitPrice) : null,
      stop_price: form.stopPrice ? parseFloat(form.stopPrice) : null,
      entry_time: form.entryTime || '',
      exit_time: form.exitTime || '',
      emotion_before: form.emotionBefore,
      emotion_after: form.emotionAfter,
      side: form.direction,
    };
    try {
      if (editingTrade) {
        await updateTrade(editingTrade.id, payload);
      } else {
        await addTrade(payload);
      }
      closeModal();
    } catch (e) {
      setErr(e.message || (editingTrade ? 'Failed to update trade' : 'Failed to add trade'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>Journal</p>
          <h1 className="text-3xl font-bold tracking-tight">{trades.length} trade{trades.length !== 1 ? 's' : ''}</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setCsvFile(null); setCsvErr(''); setCsvOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', background: 'transparent' }}
          >
            <Upload className="w-4 h-4" /> Import CSV
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditingTrade(null); setForm(EMPTY_FORM); setErr(''); setAddOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm"
            style={{ background: G, color: '#000' }}
          >
            <Plus className="w-4 h-4" /> Add Trade
          </motion.button>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg overflow-hidden border border-white/[0.08]" style={{ background: '#0d0d0d' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-mono capitalize transition-colors"
              style={{
                background: filter === f ? `${G}20` : 'transparent',
                color: filter === f ? G : 'rgba(255,255,255,0.4)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search symbol, setup…"
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
        </div>
      </div>

      {/* Trade list */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No trades match your filters</p>
          {trades.length === 0 && (
            <button onClick={() => setAddOpen(true)} className="text-sm font-medium hover:underline" style={{ color: G }}>
              Log your first trade →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dayTrades]) => {
            const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{date}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: dayPnl >= 0 ? G : '#ff4d4d' }}>{fmtPnl(dayPnl)}</span>
                </div>
                <div className="space-y-1.5">
                  {dayTrades.map(t => (
                    <TradeRow
                      key={t.id}
                      trade={t}
                      expanded={expanded === t.id}
                      onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                      onDelete={deleteTrade}
                      onEdit={openEdit}
                      onUploadScreenshot={handleScreenshotUpload}
                      onDeleteScreenshot={handleScreenshotDelete}
                      uploadingScreenshot={uploadingScreenshot}
                      deletingScreenshot={deletingScreenshot}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSV import modal */}
      <AnimatePresence>
        {csvOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) { setCsvOpen(false); setCsvFile(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Import Trades from CSV</h2>
                <button onClick={() => { setCsvOpen(false); setCsvFile(null); }} style={{ color: 'rgba(255,255,255,0.4)' }}><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Upload a CSV file exported from your broker. Columns: <span style={{ color: G }}>date, symbol, direction, pnl, setup, notes</span> (and optional: entry_price, exit_price, stop_price, quantity, account).
              </p>
              {csvErr && <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,60,60,0.1)', color: '#ff6b6b' }}>{csvErr}</div>}
              <label
                className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-colors"
                style={{ border: `2px dashed ${csvFile ? G : 'rgba(255,255,255,0.12)'}`, background: csvFile ? `${G}08` : 'rgba(255,255,255,0.02)', padding: '28px 16px' }}
              >
                <Upload className="w-8 h-8" style={{ color: csvFile ? G : 'rgba(255,255,255,0.25)' }} />
                {csvFile
                  ? <span className="text-sm font-medium" style={{ color: G }}>{csvFile.name}</span>
                  : <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Click to select a CSV file</span>
                }
                <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files[0]) setCsvFile(e.target.files[0]); }} />
              </label>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => { setCsvOpen(false); setCsvFile(null); }} className="flex-1 py-2.5 rounded-lg text-sm border" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  disabled={!csvFile || csvImporting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: !csvFile || csvImporting ? `${G}40` : G, color: '#000', cursor: !csvFile || csvImporting ? 'not-allowed' : 'pointer' }}
                >
                  {csvImporting ? 'Importing…' : 'Import Trades'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add trade modal */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl p-6"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{editingTrade ? 'Edit Trade' : 'Log Trade'}</h2>
                <button onClick={closeModal} style={{ color: 'rgba(255,255,255,0.4)' }}><X className="w-5 h-5" /></button>
              </div>
              {err && <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,60,60,0.1)', color: '#ff6b6b' }}>{err}</div>}
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Symbol">
                    <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} placeholder="NQ" className="input-field" />
                  </Field>
                  <Field label="Date">
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
                  </Field>
                  <Field label="Direction">
                    <Select value={form.direction} onChange={v => setForm(f => ({ ...f, direction: v }))} options={DIRECTIONS} />
                  </Field>
                  <Field label="Setup">
                    <Select value={form.setup} onChange={v => setForm(f => ({ ...f, setup: v }))} options={SETUPS} />
                  </Field>
                  <Field label="P&L ($)">
                    <input type="number" step="0.01" value={form.pnl} onChange={e => setForm(f => ({ ...f, pnl: e.target.value }))} placeholder="425.00" className="input-field" />
                  </Field>
                  <Field label="Qty / Contracts">
                    <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="input-field" />
                  </Field>
                  <Field label="Account (optional)" className="col-span-2">
                    <input value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} placeholder="Apex, FTMO…" className="input-field" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Entry Price ($)">
                    <input type="number" step="0.01" value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))} placeholder="4285.00" className="input-field" />
                  </Field>
                  <Field label="Exit Price ($)">
                    <input type="number" step="0.01" value={form.exitPrice} onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))} placeholder="4310.00" className="input-field" />
                  </Field>
                  <Field label="Stop Price ($)">
                    <input type="number" step="0.01" value={form.stopPrice} onChange={e => setForm(f => ({ ...f, stopPrice: e.target.value }))} placeholder="4270.00" className="input-field" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Entry Time">
                    <input type="time" value={form.entryTime} onChange={e => setForm(f => ({ ...f, entryTime: e.target.value }))} className="input-field" />
                  </Field>
                  <Field label="Exit Time">
                    <input type="time" value={form.exitTime} onChange={e => setForm(f => ({ ...f, exitTime: e.target.value }))} className="input-field" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Emotion Before">
                    <Select value={form.emotionBefore} onChange={v => setForm(f => ({ ...f, emotionBefore: v }))} options={EMOTIONS_BEFORE} />
                  </Field>
                  <Field label="Emotion After">
                    <Select value={form.emotionAfter} onChange={v => setForm(f => ({ ...f, emotionAfter: v }))} options={EMOTIONS_AFTER} />
                  </Field>
                </div>
                <Field label="Notes (optional)">
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What happened…" rows={2} className="input-field resize-none" />
                </Field>
                {editingTrade && (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Screenshot
                    </label>
                    {editingTrade.screenshotUrl ? (
                      <div>
                        <img src={editingTrade.screenshotUrl} alt="screenshot" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'contain', background: '#000', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }} />
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Screenshot attached — manage from trade row</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1px dashed rgba(0,255,65,0.25)', color: 'rgba(255,255,255,0.4)' }}>
                        <Camera size={14} style={{ color: '#00ff41', flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>Save trade first, then upload screenshot from trade row</span>
                      </div>
                    )}
                  </div>
                )}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, followedPlan: !f.followedPlan }))}
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: form.followedPlan ? G : 'transparent', border: `2px solid ${form.followedPlan ? G : 'rgba(255,255,255,0.25)'}` }}
                  >
                    {form.followedPlan && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.5 6.5L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Followed my trading plan</span>
                </label>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-lg text-sm border transition-colors" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all" style={{ background: saving ? `${G}70` : G, color: '#000' }}>
                    {saving ? 'Saving…' : editingTrade ? 'Update Trade' : 'Save Trade'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TradeRow({ trade: t, expanded, onToggle, onDelete, onEdit, onUploadScreenshot, onDeleteScreenshot, uploadingScreenshot, deletingScreenshot }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={onToggle}>
        <span className="font-semibold" style={{ color: t.pnl > 0 ? G : t.pnl < 0 ? '#ff4d4d' : undefined }}>{t.symbol}</span>
        {t.side && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
              background: t.side === 'LONG' ? `${G}18` : 'rgba(255,77,77,0.12)',
              color: t.side === 'LONG' ? G : '#ff6b6b',
            }}>
            {t.side}
          </span>
        )}
        <span className="text-sm hidden sm:block" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.setup}</span>
        {!t.followedPlan && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ background: 'rgba(255,165,0,0.12)', color: '#ffaa33' }}>Rule Break</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono font-bold" style={{ color: t.pnl >= 0 ? G : '#ff4d4d' }}>{fmtPnl(t.pnl)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="grid grid-cols-3 gap-3 pt-3">
                <Info label="Qty" value={t.quantity ?? '—'} />
                <Info label="Account" value={t.account || '—'} />
                <Info
                  label="Plan"
                  value={t.followedPlan == null ? '—' : t.followedPlan ? 'Followed' : 'Not Followed'}
                  valueColor={t.followedPlan == null ? undefined : t.followedPlan ? G : '#ffaa33'}
                />
              </div>
              {(t.entryPrice != null || t.exitPrice != null || t.stopPrice != null) && (
                <div className="grid grid-cols-4 gap-3">
                  <Info label="Entry $" value={t.entryPrice != null ? `$${t.entryPrice}` : '—'} />
                  <Info label="Exit $" value={t.exitPrice != null ? `$${t.exitPrice}` : '—'} />
                  <Info label="Stop $" value={t.stopPrice != null ? `$${t.stopPrice}` : '—'} />
                  <Info label="Actual R:R" value={(() => {
                    const entry = t.entryPrice, exit = t.exitPrice, stop = t.stopPrice;
                    if (stop == null || entry == null || exit == null) return '—';
                    const isLong = (t.side || t.direction || '').toUpperCase() === 'LONG';
                    const reward = isLong ? exit - entry : entry - exit;
                    const risk   = isLong ? entry - stop : stop - entry;
                    if (risk <= 0) return '—';
                    return `${(reward / risk).toFixed(1)}R`;
                  })()} />
                </div>
              )}
              {(t.entryTime || t.exitTime || t.emotionBefore || t.emotionAfter) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {t.entryTime && <Info label="Entry Time" value={t.entryTime} />}
                  {t.exitTime && <Info label="Exit Time" value={t.exitTime} />}
                  {t.emotionBefore && <Info label="Mood Before" value={t.emotionBefore} />}
                  {t.emotionAfter && <Info label="Mood After" value={t.emotionAfter} />}
                </div>
              )}
              {t.notes && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)' }}>{t.notes}</p>}

              {/* Screenshot section */}
              <div>
                {t.screenshotUrl ? (
                  <div>
                    <img
                      src={t.screenshotUrl}
                      alt="Trade screenshot"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', maxHeight: 400, objectFit: 'contain', background: '#000', cursor: 'pointer', display: 'block' }}
                      onClick={() => window.open(t.screenshotUrl, '_blank')}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        onClick={() => onDeleteScreenshot(t.id)}
                        disabled={deletingScreenshot === t.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,77,77,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                      >
                        {deletingScreenshot === t.id
                          ? <span style={{ fontSize: 11 }}>Removing…</span>
                          : <><ImageOff size={12} /> Remove screenshot</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px dashed rgba(0,255,65,0.25)', cursor: uploadingScreenshot === t.id ? 'default' : 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                    {uploadingScreenshot === t.id ? (
                      <>
                        <LoaderIcon size={14} style={{ color: '#00ff41', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 12 }}>Uploading…</span>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </>
                    ) : (
                      <>
                        <Camera size={14} style={{ color: '#00ff41', flexShrink: 0 }} />
                        <span style={{ fontSize: 12 }}>Add screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) onUploadScreenshot(t.id, file);
                            e.target.value = '';
                          }}
                        />
                      </>
                    )}
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => onEdit(t)} className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => onDelete(t.id)} className="flex items-center gap-1.5 text-xs transition-colors hover:text-red-400" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Info({ label, value, valueColor }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: valueColor || 'rgba(255,255,255,0.7)' }}>{value}</p>
    </div>
  );
}

function PageLoader() {
  return <div className="flex items-center justify-center h-48"><p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading trades…</p></div>;
}

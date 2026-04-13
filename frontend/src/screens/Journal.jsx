import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtPnl, todayStr } from '../hooks/useTrades';
import { useAuth } from '../context/AuthContext';
import { useAccountFilter } from '../context/AccountFilterContext';
import AccountSelector from '../components/AccountSelector';
import { api } from '../services/api';

const G = '#00ff41';
const R = '#ff2d2d';

const SETUPS = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High'];
const EMOTIONS_BEFORE = ['Calm', 'Focused', 'Confident', 'Anxious', 'Frustrated', 'Overconfident', 'Fear', 'FOMO', 'Revenge', 'Neutral'];
const EMOTIONS_AFTER  = ['Calm', 'Focused', 'Confident', 'Anxious', 'Frustrated', 'Overconfident', 'Fear', 'FOMO', 'Revenge', 'Neutral', 'Satisfied', 'Regret', 'Excited'];

const emptyForm = () => ({
  date: todayStr(),
  symbol: '',
  setup: 'ORB',
  account: '',
  pnl: '',
  side: 'Long',
  quantity: '',
  entryPrice: '',
  exitPrice: '',
  stopPrice: '',
  entryTime: '',
  exitTime: '',
  emotionBefore: 'Calm',
  emotionAfter: 'Satisfied',
  followedPlan: true,
  notes: '',
});

export default function Journal({ trades, addTrade, deleteTrade, patchTrade, accounts = [], focusTradeId, onFocusConsumed }) {
  const { selectedAccountId } = useAccountFilter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const accountFilteredTrades = selectedAccountId
    ? trades.filter(t => t.accountId === selectedAccountId || (!t.accountId && accounts.find(a => a.id === selectedAccountId)?.name === t.account))
    : trades;

  const filtered = accountFilteredTrades.filter(t => {
    if (filter === 'wins') return t.pnl > 0;
    if (filter === 'losses') return t.pnl < 0;
    if (filter === 'broke-rules') return !t.followedPlan;
    return true;
  });

  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleSubmit = () => {
    if (!form.symbol || form.pnl === '') return;
    addTrade({
      ...form,
      pnl:        parseFloat(form.pnl),
      quantity:   form.quantity   ? parseInt(form.quantity)     : null,
      entryPrice: form.entryPrice ? parseFloat(form.entryPrice) : null,
      exitPrice:  form.exitPrice  ? parseFloat(form.exitPrice)  : null,
      stopPrice:  form.stopPrice  ? parseFloat(form.stopPrice)  : null,
    });
    setShowForm(false);
    setForm(emptyForm());
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#080c08', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 52, fontWeight: 900, color: G,
            letterSpacing: 4, userSelect: 'none', pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          JOURNAL
        </motion.div>

        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
          Journal
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {accountFilteredTrades.length} trades
          </div>
          <AccountSelector accounts={accounts} />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {[['all', 'All'], ['wins', 'Wins'], ['losses', 'Losses'], ['broke-rules', 'Broke Rules']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                fontFamily: "'Barlow', sans-serif",
                border: filter === val ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.12)',
                background: filter === val ? `${G}18` : 'transparent',
                color: filter === val ? G : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 20px' }}
        >
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>📋</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            No trades yet
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Tap + to log your first trade</div>
        </motion.div>
      )}

      {/* Trade groups */}
      <div style={{ padding: '16px 16px 100px' }}>
        {sortedDates.map((date, groupIdx) => {
          const dayTrades = grouped[date];
          const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
          const label = date === todayStr() ? 'Today' : formatDateLabel(date);
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.05, duration: 0.3 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: dayPnl >= 0 ? G : R }}>
                  {fmtPnl(dayPnl)}
                </div>
              </div>
              {dayTrades.map((trade, tradeIdx) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIdx * 0.05 + tradeIdx * 0.04, duration: 0.25 }}
                >
                  <TradeCard
                    trade={trade}
                    onDelete={() => setDeleteConfirm(trade.id)}
                    onUpdate={patchTrade}
                    isFocused={trade.id === focusTradeId}
                    onFocusConsumed={onFocusConsumed}
                  />
                </motion.div>
              ))}
            </motion.div>
          );
        })}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: G, color: '#000',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 300, lineHeight: 1,
          boxShadow: `0 0 24px ${G}60`,
          zIndex: 100,
        }}
      >
        +
      </motion.button>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}
              style={{ background: '#0d1a0d', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="modal-handle" />
              <div className="modal-title">Delete Trade?</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 20, fontSize: 14 }}>
                This action cannot be undone.
              </p>
              <button
                className="btn-primary"
                style={{ background: R, marginBottom: 10, boxShadow: `0 0 16px ${R}40` }}
                onClick={() => { deleteTrade(deleteConfirm); setDeleteConfirm(null); }}
              >
                Delete
              </button>
              <button className="btn-ghost" style={{ width: '100%', textAlign: 'center' }} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}
              style={{ background: '#0d1a0d', border: '1px solid rgba(0,255,65,0.1)' }}
            >
              <div className="modal-handle" />
              <div className="modal-title" style={{ color: '#fff' }}>Log Trade</div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Symbol</label>
                  <input
                    placeholder="NQ, ES…"
                    value={form.symbol}
                    onChange={e => set('symbol', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Date</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Setup</label>
                  <select value={form.setup} onChange={e => set('setup', e.target.value)}>
                    {SETUPS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Account</label>
                  <input
                    placeholder="e.g. Tradeify, My Apex…"
                    value={form.account}
                    onChange={e => set('account', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">P&amp;L ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 350 or -180"
                  value={form.pnl}
                  onChange={e => set('pnl', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Entry Time</label>
                  <input type="time" value={form.entryTime} onChange={e => set('entryTime', e.target.value)} />
                </div>
                <div className="form-field">
                  <label className="form-label">Exit Time</label>
                  <input type="time" value={form.exitTime} onChange={e => set('exitTime', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Side</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Long', 'Short'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('side', s)}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                          fontFamily: "'Barlow', sans-serif", cursor: 'pointer',
                          background: form.side === s ? (s === 'Long' ? G : R) : 'rgba(255,255,255,0.05)',
                          color: form.side === s ? '#000' : 'rgba(255,255,255,0.4)',
                          border: form.side === s ? `1px solid ${s === 'Long' ? G : R}` : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Contracts</label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    min="1"
                    value={form.quantity}
                    onChange={e => set('quantity', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Entry Price</label>
                  <input
                    type="number"
                    placeholder="e.g. 17842"
                    step="0.01"
                    value={form.entryPrice}
                    onChange={e => set('entryPrice', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Exit Price</label>
                  <input
                    type="number"
                    placeholder="e.g. 17891"
                    step="0.01"
                    value={form.exitPrice}
                    onChange={e => set('exitPrice', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Stop Price <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional, for R:R)</span></label>
                <input
                  type="number"
                  placeholder="e.g. 17800"
                  step="0.01"
                  value={form.stopPrice}
                  onChange={e => set('stopPrice', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Emotion Before</label>
                  <select value={form.emotionBefore} onChange={e => set('emotionBefore', e.target.value)}>
                    {EMOTIONS_BEFORE.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Emotion After</label>
                  <select value={form.emotionAfter} onChange={e => set('emotionAfter', e.target.value)}>
                    {EMOTIONS_AFTER.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <div className="toggle-row" style={{ paddingTop: 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Followed the Plan</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Did you stick to your rules?</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={form.followedPlan}
                      onChange={e => set('followedPlan', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Notes</label>
                <textarea
                  placeholder="What happened? Any lessons learned?"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!form.symbol || form.pnl === ''}
                style={{
                  opacity: (!form.symbol || form.pnl === '') ? 0.4 : 1,
                  boxShadow: (!form.symbol || form.pnl === '') ? 'none' : `0 0 20px ${G}40`,
                }}
              >
                Log Trade
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TradeCard ──────────────────────────────────────────────────────────────

function TradeCard({ trade, onDelete, onUpdate, isFocused, onFocusConsumed }) {
  const { token } = useAuth();
  const cardRef    = useRef(null);
  const screenshotRef = useRef(null);
  const [expanded,  setExpanded]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [highlight, setHighlight] = useState(false);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(trade.screenshotUrl || null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // R:R calculation
  const rr = useMemo(() => {
    if (trade.entryPrice == null || trade.exitPrice == null) return null;
    if (trade.stopPrice != null) {
      // Proper R:R using stop price
      const reward = trade.side === 'Short'
        ? trade.entryPrice - trade.exitPrice
        : trade.exitPrice - trade.entryPrice;
      const risk = trade.side === 'Short'
        ? trade.stopPrice - trade.entryPrice
        : trade.entryPrice - trade.stopPrice;
      if (risk <= 0) return null;
      return reward / risk;
    }
    return null;
  }, [trade.entryPrice, trade.exitPrice, trade.stopPrice, trade.side]);

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !token) return;
    setScreenshotUploading(true);
    try {
      const data = await api.uploadScreenshot(token, trade.id, file);
      setScreenshotUrl(data.screenshotUrl);
    } catch (err) {
      console.error('Screenshot upload failed:', err);
    } finally {
      setScreenshotUploading(false);
      e.target.value = '';
    }
  };

  // screenshot URL base (dev vs prod)
  const screenshotFullUrl = screenshotUrl
    ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${screenshotUrl}` : `https://edgelog.onrender.com${screenshotUrl}`)
    : null;

  // Editable copies — sync when trade object updates (e.g. after save)
  const [editNotes,        setEditNotes]        = useState(trade.notes         || '');
  const [editEmoBefore,    setEditEmoBefore]    = useState(trade.emotionBefore || '');
  const [editEmoAfter,     setEditEmoAfter]     = useState(trade.emotionAfter  || '');
  const [editFollowedPlan, setEditFollowedPlan] = useState(trade.followedPlan  ?? true);

  useEffect(() => {
    setEditNotes(trade.notes         || '');
    setEditEmoBefore(trade.emotionBefore || '');
    setEditEmoAfter(trade.emotionAfter   || '');
    setEditFollowedPlan(trade.followedPlan ?? true);
  }, [trade.notes, trade.emotionBefore, trade.emotionAfter, trade.followedPlan]);

  // Focus/highlight from Calendar navigation
  useEffect(() => {
    if (!isFocused) return;
    setExpanded(true);
    setHighlight(true);
    setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    const t = setTimeout(() => {
      setHighlight(false);
      onFocusConsumed?.();
    }, 2200);
    return () => clearTimeout(t);
  }, [isFocused]); // eslint-disable-line react-hooks/exhaustive-deps

  const isWin       = trade.pnl > 0;
  const accentColor = isWin ? G : R;

  const handleExpand = () => {
    if (editing) return;
    setExpanded(v => !v);
  };

  const startEdit = (e) => {
    e.stopPropagation();
    setEditing(true);
    setSaveErr('');
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditNotes(trade.notes         || '');
    setEditEmoBefore(trade.emotionBefore || '');
    setEditEmoAfter(trade.emotionAfter   || '');
    setEditFollowedPlan(trade.followedPlan ?? true);
    setEditing(false);
    setSaveErr('');
  };

  const saveEdit = async (e) => {
    e.stopPropagation();
    setSaving(true);
    setSaveErr('');
    try {
      await onUpdate(trade.id, {
        emotionBefore: editEmoBefore,
        emotionAfter:  editEmoAfter,
        notes:         editNotes,
        followedPlan:  editFollowedPlan,
      });
      setEditing(false);
    } catch (err) {
      setSaveErr(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      onClick={handleExpand}
      style={{
        background: '#111811',
        borderRadius: 10,
        marginBottom: 8,
        border: highlight ? `1px solid ${G}` : `1px solid rgba(255,255,255,0.06)`,
        borderLeft: `3px solid ${accentColor}`,
        cursor: editing ? 'default' : 'pointer',
        overflow: 'hidden',
        boxShadow: highlight ? `0 0 20px ${G}50, 0 0 6px ${G}30` : 'none',
        transition: 'border 0.3s, box-shadow 0.3s',
      }}
      transition={{ layout: { duration: 0.25, ease: 'easeInOut' } }}
    >
      {/* Summary row — always visible */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px', color: '#fff' }}>
                  {trade.symbol}
                </div>
                {trade.side && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: trade.side === 'Long' ? `${G}20` : `${R}20`,
                    color: trade.side === 'Long' ? G : R,
                    border: `1px solid ${trade.side === 'Long' ? G : R}40`,
                  }}>
                    {trade.side.toUpperCase()}
                  </span>
                )}
                {!trade.followedPlan && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: `${R}20`, color: R, border: `1px solid ${R}40`,
                    letterSpacing: '0.3px', textTransform: 'uppercase',
                  }}>
                    Broke Rules
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {trade.setup}{trade.quantity != null ? ` · ${trade.quantity}ct` : ''}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {screenshotUrl && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: accentColor }}>
                {fmtPnl(trade.pnl)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{trade.account}</div>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 14px 14px' }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── VIEW MODE ── */}
              {!editing && (
                <div>
                  {/* Symbol header: large base + front-month format */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                        {symbolBase(trade.symbol)}
                      </div>
                      <div style={{ fontSize: 12, color: G, fontFamily: 'monospace', marginTop: 1, letterSpacing: '0.5px' }}>
                        {fmtSymbol(trade.symbol)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: accentColor, lineHeight: 1 }}>
                        {fmtPnl(trade.pnl)}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{trade.date}</div>
                    </div>
                  </div>

                  {/* Badges: side + contracts */}
                  {(trade.side || trade.quantity != null) && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {trade.side && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                          background: trade.side === 'Long' ? `${G}20` : `${R}20`,
                          color: trade.side === 'Long' ? G : R,
                          border: `1px solid ${trade.side === 'Long' ? G : R}40`,
                        }}>
                          {trade.side}
                        </span>
                      )}
                      {trade.quantity != null && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          {trade.quantity} contract{trade.quantity !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Entry → Exit prices */}
                  {(trade.entryPrice != null || trade.exitPrice != null) && (
                    <div style={{ background: '#0d1a0d', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                      {trade.entryPrice != null && (
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Entry</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            {trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                      {trade.entryPrice != null && trade.exitPrice != null && (
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, lineHeight: 1 }}>→</div>
                      )}
                      {trade.exitPrice != null && (
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Exit</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            {trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Setup + time row */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Detail label="Setup" value={trade.setup} />
                    {(trade.entryTime || trade.exitTime) && (
                      <Detail label="Time" value={`${trade.entryTime || '—'}${trade.exitTime ? ` → ${trade.exitTime}` : ''}`} />
                    )}
                  </div>

                  {/* Followed plan */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan: </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: trade.followedPlan ? G : R }}>
                      {trade.followedPlan ? 'Followed' : 'Broke rules'}
                    </span>
                  </div>

                  {/* Emotions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Before</div>
                      <div style={{ fontSize: 13, color: trade.emotionBefore ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', fontStyle: trade.emotionBefore ? 'normal' : 'italic' }}>
                        {trade.emotionBefore || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>After</div>
                      <div style={{ fontSize: 13, color: trade.emotionAfter ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', fontStyle: trade.emotionAfter ? 'normal' : 'italic' }}>
                        {trade.emotionAfter || 'Not set'}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Notes</div>
                    {trade.notes ? (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{trade.notes}"
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                        No notes yet
                      </div>
                    )}
                  </div>

                  {/* R:R ratio */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Actual R:R</div>
                    {rr !== null ? (
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: rr >= 1 ? G : 'rgba(255,255,255,0.5)' }}>
                        {rr.toFixed(2)}R
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                        {trade.stopPrice != null ? 'Invalid stop' : 'N/A — no stop price'}
                      </div>
                    )}
                  </div>

                  {/* Screenshot */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Screenshot</div>
                    {screenshotUrl && (
                      <div
                        onClick={() => setLightboxOpen(true)}
                        style={{ marginBottom: 8, cursor: 'zoom-in', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }}
                      >
                        <img
                          src={screenshotFullUrl}
                          alt="Trade screenshot"
                          style={{ display: 'block', maxWidth: '100%', maxHeight: 160, objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div>
                      <input
                        ref={screenshotRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleScreenshotUpload}
                      />
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => screenshotRef.current?.click()}
                        disabled={screenshotUploading}
                        style={{
                          fontSize: 12, fontWeight: 700,
                          color: 'rgba(255,255,255,0.55)',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 7, padding: '5px 12px',
                          cursor: screenshotUploading ? 'default' : 'pointer',
                          fontFamily: "'Barlow', sans-serif",
                          opacity: screenshotUploading ? 0.5 : 1,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        {screenshotUploading ? 'Uploading…' : screenshotUrl ? 'Replace Screenshot' : 'Add Screenshot'}
                      </motion.button>
                    </div>
                  </div>

                  {/* Lightbox */}
                  <AnimatePresence>
                    {lightboxOpen && screenshotFullUrl && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxOpen(false)}
                        style={{
                          position: 'fixed', inset: 0, zIndex: 9999,
                          background: 'rgba(0,0,0,0.92)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 16,
                        }}
                      >
                        <motion.img
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                          src={screenshotFullUrl}
                          alt="Trade screenshot"
                          style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          onClick={() => setLightboxOpen(false)}
                          style={{
                            position: 'absolute', top: 20, right: 20,
                            background: 'rgba(255,255,255,0.12)', border: 'none',
                            borderRadius: '50%', width: 36, height: 36,
                            color: '#fff', fontSize: 18, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={startEdit}
                      style={{
                        fontSize: 12, fontWeight: 700,
                        color: G, background: `${G}14`,
                        border: `1px solid ${G}40`,
                        borderRadius: 7, padding: '5px 14px',
                        cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                        letterSpacing: '0.3px',
                      }}
                    >
                      Edit
                    </motion.button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      style={{
                        fontSize: 12, color: R, background: 'none',
                        border: 'none', padding: 0, cursor: 'pointer',
                        fontFamily: "'Barlow', sans-serif",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* ── EDIT MODE ── */}
              {editing && (
                <div onClick={e => e.stopPropagation()}>
                  {/* Followed plan toggle */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>
                      Followed Plan?
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[true, false].map(val => (
                        <button
                          key={String(val)}
                          onClick={() => setEditFollowedPlan(val)}
                          style={{
                            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                            fontFamily: "'Barlow', sans-serif", cursor: 'pointer',
                            background: editFollowedPlan === val ? (val ? G : R) : 'rgba(255,255,255,0.05)',
                            color: editFollowedPlan === val ? '#000' : 'rgba(255,255,255,0.4)',
                            border: editFollowedPlan === val
                              ? `1px solid ${val ? G : R}`
                              : '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emotion before */}
                  <EmotionPicker
                    label="Emotion Before"
                    options={EMOTIONS_BEFORE}
                    value={editEmoBefore}
                    onChange={setEditEmoBefore}
                  />

                  {/* Emotion after */}
                  <EmotionPicker
                    label="Emotion After"
                    options={EMOTIONS_AFTER}
                    value={editEmoAfter}
                    onChange={setEditEmoAfter}
                  />

                  {/* Notes textarea */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>
                      Notes
                    </div>
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="What happened? Any lessons learned?"
                      rows={3}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#111811', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8, padding: '10px 12px',
                        fontSize: 13, color: '#fff', fontFamily: "'Barlow', sans-serif",
                        lineHeight: 1.5, resize: 'vertical', outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => { e.target.style.borderColor = `${G}70`; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    />
                  </div>

                  {/* Error */}
                  {saveErr && (
                    <div style={{ fontSize: 12, color: R, marginBottom: 10 }}>{saveErr}</div>
                  )}

                  {/* Save / Cancel */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={saveEdit}
                      disabled={saving}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8,
                        background: G, color: '#000', border: 'none',
                        fontWeight: 700, fontSize: 14, fontFamily: "'Barlow', sans-serif",
                        cursor: saving ? 'default' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        boxShadow: `0 0 16px ${G}40`,
                      }}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={cancelEdit}
                      disabled={saving}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8,
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: 600, fontSize: 14, fontFamily: "'Barlow', sans-serif",
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Emotion pill picker ────────────────────────────────────────────────────

function EmotionPicker({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(active ? '' : opt)}
              style={{
                padding: '4px 11px', borderRadius: 20, fontSize: 12,
                fontFamily: "'Barlow', sans-serif", fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                background: active ? G : 'rgba(255,255,255,0.05)',
                color: active ? '#000' : 'rgba(255,255,255,0.55)',
                border: active ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.12s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Symbol helpers ─────────────────────────────────────────────────────────

const FUTURES_ROOTS = new Set(['ES','MES','NQ','MNQ','YM','MYM','RTY','M2K','CL','GC','SI','ZB','ZN','ZF']);
const CONTRACT_MONTH_RE = /[FGHJKMNQUVXZ]\d{1,2}$/;

function symbolBase(raw) {
  if (!raw) return '';
  const s = raw.toUpperCase().replace(/^\//, '');
  return s.replace(CONTRACT_MONTH_RE, '') || s;
}

function fmtSymbol(raw) {
  if (!raw) return '';
  const base = symbolBase(raw);
  return FUTURES_ROOTS.has(base) ? `${base}1!` : base;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Detail({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}: </span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{value}</span>
    </div>
  );
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtPnl, todayStr } from '../hooks/useTrades';

const G = '#00ff41';
const R = '#ff2d2d';

const SETUPS = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High'];
const EMOTIONS_BEFORE = ['Calm', 'Confident', 'Anxious', 'FOMO', 'Frustrated'];
const EMOTIONS_AFTER = ['Satisfied', 'Neutral', 'Frustrated', 'Regret', 'Excited'];

const emptyForm = () => ({
  date: todayStr(),
  symbol: '',
  setup: 'ORB',
  account: '',
  pnl: '',
  entryTime: '',
  exitTime: '',
  emotionBefore: 'Calm',
  emotionAfter: 'Satisfied',
  followedPlan: true,
  notes: '',
});

export default function Journal({ trades, addTrade, deleteTrade }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = trades.filter(t => {
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
    addTrade({ ...form, pnl: parseFloat(form.pnl) });
    setShowForm(false);
    setForm(emptyForm());
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#080c08', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Ghost text */}
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
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, marginBottom: 14 }}>
          {trades.length} trades logged
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
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 16, fontWeight: 700,
                  color: dayPnl >= 0 ? G : R,
                }}>
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
                  <TradeCard trade={trade} onDelete={() => setDeleteConfirm(trade.id)} />
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

function TradeCard({ trade, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isWin = trade.pnl > 0;
  const accentColor = isWin ? G : R;

  return (
    <motion.div
      layout
      onClick={() => setExpanded(e => !e)}
      style={{
        background: '#111811',
        borderRadius: 10,
        marginBottom: 8,
        border: `1px solid rgba(255,255,255,0.06)`,
        borderLeft: `3px solid ${accentColor}`,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      whileHover={{ borderColor: `${accentColor}50` }}
      transition={{ layout: { duration: 0.25, ease: 'easeInOut' } }}
    >
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px', color: '#fff' }}>
                {trade.symbol}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{trade.setup}</div>
            </div>
            {!trade.followedPlan && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                background: `${R}20`, color: R, border: `1px solid ${R}40`,
                letterSpacing: '0.3px', textTransform: 'uppercase',
              }}>
                Broke Rules
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: accentColor }}>
              {fmtPnl(trade.pnl)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{trade.account}</div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 10 }}>
                  <Detail label="Entry" value={trade.entryTime || '—'} />
                  <Detail label="Exit" value={trade.exitTime || '—'} />
                  <Detail label="Before" value={trade.emotionBefore} />
                  <Detail label="After" value={trade.emotionAfter} />
                </div>
                {trade.notes && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
                    "{trade.notes}"
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(); }}
                  style={{
                    fontSize: 12, color: R, background: 'none', border: 'none',
                    padding: 0, cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                  }}
                >
                  Delete trade
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

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

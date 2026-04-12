import React, { useState } from 'react';
import { fmtPnl, todayStr } from '../hooks/useTrades';

const SETUPS = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High'];
const ACCOUNTS = ['Apex Funded', 'FTMO', 'tastytrade'];
const EMOTIONS_BEFORE = ['Calm', 'Confident', 'Anxious', 'FOMO', 'Frustrated'];
const EMOTIONS_AFTER = ['Satisfied', 'Neutral', 'Frustrated', 'Regret', 'Excited'];

const emptyForm = () => ({
  date: todayStr(),
  symbol: '',
  setup: 'ORB',
  account: 'Apex Funded',
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
    <div>
      <div className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="screen-title">Journal</div>
            <div className="screen-subtitle">{trades.length} trades logged</div>
          </div>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {[['all', 'All'], ['wins', 'Wins'], ['losses', 'Losses'], ['broke-rules', 'Broke Rules']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Barlow', sans-serif",
                border: filter === val ? '1px solid var(--green)' : '1px solid var(--border)',
                background: filter === val ? 'var(--green-dim)' : 'transparent',
                color: filter === val ? 'var(--green)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600 }}>No trades yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Tap + to log your first trade</div>
        </div>
      )}

      {sortedDates.map(date => {
        const dayTrades = grouped[date];
        const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
        const label = date === todayStr() ? 'Today' : formatDateLabel(date);
        return (
          <div key={date} className="section" style={{ paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {label}
              </div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: dayPnl >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
                {fmtPnl(dayPnl)}
              </div>
            </div>
            {dayTrades.map(trade => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onDelete={() => setDeleteConfirm(trade.id)}
              />
            ))}
          </div>
        );
      })}

      {/* FAB */}
      <button className="fab" onClick={() => setShowForm(true)}>
        <span style={{ lineHeight: 1, marginTop: -1 }}>+</span>
      </button>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Delete Trade?</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              This action cannot be undone.
            </p>
            <button
              className="btn-primary"
              style={{ background: 'var(--red)', marginBottom: 10 }}
              onClick={() => { deleteTrade(deleteConfirm); setDeleteConfirm(null); }}
            >
              Delete
            </button>
            <button className="btn-ghost" style={{ width: '100%', textAlign: 'center' }} onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Trade Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Log Trade</div>

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
                <select value={form.account} onChange={e => set('account', e.target.value)}>
                  {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
                </select>
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
              style={{ opacity: (!form.symbol || form.pnl === '') ? 0.4 : 1 }}
            >
              Log Trade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TradeCard({ trade, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isWin = trade.pnl > 0;

  return (
    <div
      className="card"
      style={{
        marginBottom: 8,
        borderLeft: `3px solid ${isWin ? 'var(--green)' : 'var(--red)'}`,
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px' }}>
              {trade.symbol}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{trade.setup}</div>
          </div>
          {!trade.followedPlan && (
            <span className="badge badge-red" style={{ fontSize: 10 }}>Broke Rules</span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: isWin ? 'var(--green)' : 'var(--red)',
          }}>
            {fmtPnl(trade.pnl)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{trade.account}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 10 }}>
            <Detail label="Entry" value={trade.entryTime || '—'} />
            <Detail label="Exit" value={trade.exitTime || '—'} />
            <Detail label="Before" value={trade.emotionBefore} />
            <Detail label="After" value={trade.emotionAfter} />
          </div>
          {trade.notes && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 10 }}>
              "{trade.notes}"
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              fontSize: 12,
              color: 'var(--red)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'Barlow', sans-serif",
            }}
          >
            Delete trade
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}: </span>
      <span style={{ fontSize: 12, color: 'var(--text)' }}>{value}</span>
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

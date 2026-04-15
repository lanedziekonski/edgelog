import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtPnl, todayStr } from '../hooks/useTrades';
import BrokerageSync from '../components/BrokerageSync';

const GOLD = '#f0a500';

const G = '#00ff41';
const R = '#ff2d2d';

function accountColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const hues = [160, 200, 260, 30, 340, 180, 45];
  return `hsl(${hues[h % hues.length]}, 70%, 55%)`;
}

const ACCOUNT_TYPES = [
  { value: 'prop',  label: 'Prop Firm' },
  { value: 'live',  label: 'Live Brokerage' },
  { value: 'paper', label: 'Paper Trading' },
];

const emptyForm = () => ({
  name: '',
  type: 'prop',
  phase: 'evaluation',
  startingBalance: '',
  dailyLossLimit: '',
  maxDrawdown: '',
  profitTarget: '',
});

export default function Accounts({
  trades, accounts, accountsLoading,
  createAccount, updateAccount, updateAccountBalance, deleteAccount, reloadAccounts,
}) {
  const today = todayStr();
  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState(emptyForm());
  const [creating, setCreating]           = useState(false);
  const [createErr, setCreateErr]         = useState('');
  const [importingFor, setImportingFor]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId]         = useState(null);
  const [updateBalanceFor, setUpdateBalanceFor] = useState(null); // account object or null

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) { setCreateErr('Account name is required'); return; }
    setCreating(true);
    setCreateErr('');
    try {
      await createAccount({
        name:            form.name.trim(),
        type:            form.type,
        phase:           form.type === 'prop' ? form.phase : null,
        startingBalance: form.startingBalance ? parseFloat(form.startingBalance) : 0,
        dailyLossLimit:  form.dailyLossLimit  ? parseFloat(form.dailyLossLimit)  : null,
        maxDrawdown:     form.maxDrawdown      ? parseFloat(form.maxDrawdown)     : null,
        profitTarget:    form.profitTarget     ? parseFloat(form.profitTarget)    : null,
      });
      setForm(emptyForm());
      setShowCreate(false);
    } catch (err) {
      setCreateErr(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (id, data) => {
    await updateAccount(id, data);
    setEditingId(null);
  };

  const handleSaveBalance = async (id, balance) => {
    await updateAccountBalance(id, balance);
    setUpdateBalanceFor(null);
  };

  const handleDelete = async (id) => {
    try { await deleteAccount(id); } catch (_) {}
    setDeleteConfirm(null);
  };

  const handleImportDone = () => {
    reloadAccounts();
    setImportingFor(null);
  };

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
            letterSpacing: 4, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          }}
        >
          ACCOUNTS
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
              Accounts
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, marginBottom: 16 }}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => { setShowCreate(v => !v); setCreateErr(''); }}
            style={{
              padding: '7px 12px', borderRadius: 8, marginTop: 2,
              background: showCreate ? G : 'transparent',
              border: `1px solid ${showCreate ? G : 'rgba(255,255,255,0.15)'}`,
              color: showCreate ? '#000' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
          >
            + New Account
          </motion.button>
        </div>
      </div>

      {/* Create Account Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden', padding: '0 16px 4px' }}
          >
            <div style={{ background: '#0d1a0d', border: `1px solid ${G}25`, borderRadius: 14, padding: 16, marginBottom: 4 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                New Account
              </div>

              {/* Name + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                    Account Name *
                  </div>
                  <input
                    placeholder="e.g. Apex $100K, My Tastytrade"
                    value={form.name}
                    onChange={e => setF('name', e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#111811', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, padding: '9px 11px', fontSize: 13,
                      color: '#fff', fontFamily: 'Barlow', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = `${G}70`}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                    Type
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ACCOUNT_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setF('type', value)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          fontFamily: 'Barlow', cursor: 'pointer',
                          background: form.type === value ? `${G}20` : 'rgba(255,255,255,0.04)',
                          color: form.type === value ? G : 'rgba(255,255,255,0.4)',
                          border: form.type === value ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.12s', whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phase — prop firm only */}
              {form.type === 'prop' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                    Account Phase
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { value: 'evaluation', label: 'Evaluation', color: GOLD },
                      { value: 'funded',     label: 'Funded',     color: G    },
                    ].map(({ value, label, color }) => (
                      <button
                        key={value}
                        onClick={() => setF('phase', value)}
                        style={{
                          flex: 1, padding: '9px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          fontFamily: 'Barlow', cursor: 'pointer',
                          background: form.phase === value ? `${color}20` : 'rgba(255,255,255,0.04)',
                          color: form.phase === value ? color : 'rgba(255,255,255,0.4)',
                          border: form.phase === value ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.12s',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Balance */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
                  Starting Balance ($)
                </div>
                <input
                  type="number" placeholder="e.g. 100000"
                  value={form.startingBalance}
                  onChange={e => setF('startingBalance', e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#111811', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '9px 11px', fontSize: 13,
                    color: '#fff', fontFamily: 'Barlow', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = `${G}70`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>

              {/* Optional limits */}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                Optional limits
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { key: 'dailyLossLimit', label: 'Daily Loss Limit' },
                  { key: 'maxDrawdown',    label: 'Max Drawdown' },
                  { key: 'profitTarget',   label: 'Profit Target' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{label}</div>
                    <input
                      type="number" placeholder="$"
                      value={form[key]}
                      onChange={e => setF(key, e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#111811', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 7, padding: '7px 8px', fontSize: 12,
                        color: '#fff', fontFamily: 'Barlow', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = `${G}60`}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                ))}
              </div>

              {createErr && (
                <div style={{ fontSize: 12, color: R, marginBottom: 10 }}>{createErr}</div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8,
                    background: G, color: '#000', border: 'none',
                    fontWeight: 700, fontSize: 14, cursor: creating ? 'default' : 'pointer',
                    fontFamily: 'Barlow', opacity: creating ? 0.6 : 1,
                    boxShadow: `0 0 16px ${G}40`,
                  }}
                >
                  {creating ? 'Creating…' : 'Create Account'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setShowCreate(false); setForm(emptyForm()); setCreateErr(''); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'Barlow',
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account list */}
      <div style={{ padding: '4px 16px 80px' }}>
        {accountsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Loading accounts…
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '50px 32px' }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
              background: `${G}10`, border: `1px solid ${G}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#fff' }}>
              No accounts yet
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
              Tap <strong style={{ color: 'rgba(255,255,255,0.8)' }}>+ New Account</strong> to create your first trading account, then import trades into it.
            </div>
          </motion.div>
        ) : (
          accounts.map((account, i) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              {editingId === account.id ? (
                <EditAccountCard
                  account={account}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <AccountCard
                  account={account}
                  trades={trades}
                  today={today}
                  importing={importingFor === account.id}
                  onStartImport={() => setImportingFor(account.id)}
                  onCancelImport={() => setImportingFor(null)}
                  onImportDone={handleImportDone}
                  onDeleteRequest={() => setDeleteConfirm(account.id)}
                  onEditRequest={() => setEditingId(account.id)}
                  onUpdateBalanceRequest={() => setUpdateBalanceFor(account)}
                />
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Delete confirm modal */}
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
              <div className="modal-title">Delete Account?</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
                The account will be removed. Imported trades will remain in your journal.
              </p>
              <button
                className="btn-primary"
                style={{ background: R, marginBottom: 10, boxShadow: `0 0 16px ${R}40` }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete Account
              </button>
              <button className="btn-ghost" style={{ width: '100%', textAlign: 'center' }} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Balance modal */}
      <AnimatePresence>
        {updateBalanceFor && (
          <UpdateBalanceModal
            account={updateBalanceFor}
            onSave={handleSaveBalance}
            onCancel={() => setUpdateBalanceFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AccountCard ────────────────────────────────────────────────────────────

function formatBalanceDate(dateStr) {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AccountCard({ account, trades, today, importing, onStartImport, onCancelImport, onImportDone, onDeleteRequest, onEditRequest, onUpdateBalanceRequest }) {
  const color = accountColor(account.name);

  // Match trades by account_id (preferred) or account name (backwards compat)
  const acctTrades  = trades.filter(t => t.accountId === account.id || (!t.accountId && t.account === account.name));
  const todayTrades = acctTrades.filter(t => t.date === today);
  const totalPnl    = acctTrades.reduce((s, t) => s + t.pnl, 0);
  const dailyPnl    = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const wins        = acctTrades.filter(t => t.pnl > 0).length;
  const winRate     = acctTrades.length > 0 ? Math.round((wins / acctTrades.length) * 100) : 0;
  const tradeCount  = todayTrades.length;

  // P&L vs starting balance
  const balance      = (account.startingBalance || 0) + totalPnl;
  const pnlPct       = account.startingBalance > 0
    ? ((totalPnl / account.startingBalance) * 100).toFixed(1)
    : null;

  const typeLabel = { prop: 'Prop Firm', live: 'Live', paper: 'Paper' }[account.type] || account.type;

  // ── Payout tracker (prop accounts with profit target)
  const profitTarget  = account.profitTarget || 0;
  const payoutPct     = profitTarget > 0 ? Math.min(100, (totalPnl / profitTarget) * 100) : 0;
  const payoutEligible = profitTarget > 0 && totalPnl >= profitTarget;
  const nearTarget     = payoutPct >= 90 && !payoutEligible;

  // ── Days to payout estimate
  const tradingDays = useMemo(() => {
    const byDate = {};
    acctTrades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
    return Object.values(byDate);
  }, [acctTrades]);
  const avgDailyPnl = tradingDays.length > 0
    ? tradingDays.reduce((s, v) => s + v, 0) / tradingDays.length
    : 0;
  const remaining = profitTarget - totalPnl;
  const daysEstimate = avgDailyPnl > 0 && remaining > 0
    ? Math.ceil(remaining / avgDailyPnl)
    : null;

  // ── Violation alerts
  const dailyLossUsed  = -Math.min(dailyPnl, 0);
  const drawdownUsed   = Math.max(0, -totalPnl);  // simplified: loss from starting
  const dailyPct  = account.dailyLossLimit > 0 ? dailyLossUsed / account.dailyLossLimit : 0;
  const ddPct     = account.maxDrawdown    > 0 ? drawdownUsed  / account.maxDrawdown    : 0;

  const violations = [];
  if (account.dailyLossLimit > 0) {
    const rem = account.dailyLossLimit - dailyLossUsed;
    if (dailyPct >= 0.9)
      violations.push({ level: 'critical', msg: `🚨 Near daily loss limit — $${rem.toFixed(0)} remaining. Stop trading.` });
    else if (dailyPct >= 0.7)
      violations.push({ level: 'warning', msg: `⚠ Approaching daily loss limit — $${rem.toFixed(0)} remaining` });
  }
  if (account.maxDrawdown > 0) {
    const rem = account.maxDrawdown - drawdownUsed;
    if (ddPct >= 0.9)
      violations.push({ level: 'critical', msg: `🚨 Near max drawdown limit — $${rem.toFixed(0)} remaining. Stop trading.` });
    else if (ddPct >= 0.7)
      violations.push({ level: 'warning', msg: `⚠ Approaching max drawdown — $${rem.toFixed(0)} remaining` });
  }

  return (
    <div style={{
      background: '#111811', border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `4px solid ${color}`, borderRadius: 12,
      marginBottom: 14, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.5px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {account.name}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${color}18`, color, border: `1px solid ${color}40`, flexShrink: 0, letterSpacing: '0.3px' }}>
                {typeLabel}
              </span>
              {account.type === 'prop' && account.phase && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: account.phase === 'funded' ? `${G}18` : `${GOLD}18`,
                  color: account.phase === 'funded' ? G : GOLD,
                  border: `1px solid ${account.phase === 'funded' ? `${G}40` : `${GOLD}40`}`,
                }}>
                  {account.phase === 'funded' ? 'FUNDED' : 'EVAL'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {acctTrades.length} trade{acctTrades.length !== 1 ? 's' : ''} · {winRate}% win rate
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, marginLeft: 12 }}>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onEditRequest}
              style={{
                backgroundColor: '#00ff41',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 3, alignSelf: 'flex-end',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </motion.button>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: totalPnl >= 0 ? G : R, lineHeight: 1 }}>
              {fmtPnl(totalPnl)}
            </div>
            {pnlPct !== null && (
              <div style={{ fontSize: 11, color: totalPnl >= 0 ? `${G}80` : `${R}80`, marginTop: 1 }}>
                {totalPnl >= 0 ? '+' : ''}{pnlPct}%
              </div>
            )}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>all-time P&L</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <StatCell label="Today"        value={fmtPnl(dailyPnl)}  positive={dailyPnl >= 0} />
          <StatCell label="Trades Today" value={String(tradeCount)} positive={tradeCount < 3} warn={tradeCount >= 3} />
          <StatCell label="Win Rate"     value={`${winRate}%`}      positive={winRate >= 50} />
        </div>

        {/* Violation alerts */}
        <AnimatePresence>
          {violations.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              style={{
                background: v.level === 'critical' ? 'rgba(255,45,45,0.1)' : 'rgba(240,165,0,0.1)',
                border: `1px solid ${v.level === 'critical' ? 'rgba(255,45,45,0.4)' : 'rgba(240,165,0,0.4)'}`,
                borderRadius: 8, padding: '8px 12px', marginBottom: 10,
                fontSize: 12, fontWeight: 600,
                color: v.level === 'critical' ? R : GOLD,
                lineHeight: 1.4,
              }}
            >
              {v.msg}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Balance row if starting balance set */}
        {account.startingBalance > 0 && (() => {
          const displayBalance  = account.manualBalance != null ? account.manualBalance : balance;
          const commissionsPaid = account.manualBalance != null
            ? (account.startingBalance + totalPnl) - account.manualBalance : null;
          const showFees = commissionsPaid !== null && commissionsPaid > 0.01;
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Balance</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: displayBalance >= account.startingBalance ? G : R }}>
                    ${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  {account.manualBalance != null && account.balanceLastUpdated && (
                    <div style={{ fontSize: 10, color: `${G}70`, marginTop: 2 }}>
                      ↑ Updated {formatBalanceDate(account.balanceLastUpdated)}
                    </div>
                  )}
                  {showFees && (
                    <div style={{ fontSize: 11, color: GOLD, marginTop: 3 }}>
                      Commissions paid: −${commissionsPaid.toFixed(2)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {account.dailyLossLimit && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Daily Limit</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: dailyPct >= 0.9 ? R : dailyPct >= 0.7 ? GOLD : 'rgba(255,255,255,0.6)' }}>
                        ${account.dailyLossLimit.toLocaleString()}
                      </div>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={onUpdateBalanceRequest}
                    style={{
                      background: 'transparent', border: '1px solid rgba(0,255,65,0.35)',
                      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                      color: G, fontSize: 11, fontFamily: 'Barlow', fontWeight: 600,
                    }}
                  >
                    Update Balance
                  </motion.button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Eval Progress tracker — prop evaluation accounts */}
        {account.type === 'prop' && account.phase !== 'funded' && (
          <div style={{
            background: '#0d1a0d', borderRadius: 10, padding: '12px 14px', marginBottom: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Eval Progress
            </div>
            {profitTarget > 0 ? (
              <>
                {/* Progress bar */}
                <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(payoutPct, 100)}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: GOLD,
                      boxShadow: `0 0 8px ${GOLD}60`,
                    }}
                  />
                </div>

                {/* Amount + percentage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ fontWeight: 700, color: totalPnl >= 0 ? GOLD : R }}>
                      ${Math.max(0, totalPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                    {' '}of ${profitTarget.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>
                    {Math.round(Math.max(0, payoutPct))}%
                  </div>
                </div>

                {/* Days estimate */}
                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                  {payoutPct >= 100
                    ? <span style={{ color: GOLD, fontWeight: 600 }}>Eval target reached 🎉</span>
                    : daysEstimate !== null
                      ? <>Est. <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{daysEstimate} trading day{daysEstimate !== 1 ? 's' : ''}</span> to pass</>
                      : avgDailyPnl <= 0
                        ? 'Increase daily performance to estimate passing time'
                        : null
                  }
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                Set a profit target in Edit to track eval progress
              </div>
            )}
          </div>
        )}

        {/* Payout tracker — funded prop accounts with profit target */}
        {account.type === 'prop' && account.phase === 'funded' && profitTarget > 0 && (
          <div style={{
            background: '#0d1a0d', borderRadius: 10, padding: '12px 14px', marginBottom: 12,
            border: payoutEligible ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Payout Progress
              </div>
              {payoutEligible && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: `${G}20`, color: G, border: `1px solid ${G}50`,
                  letterSpacing: '0.3px',
                }}>
                  Payout Eligible ✓
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(payoutPct, 100)}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: '100%', borderRadius: 3,
                  background: payoutEligible ? G : nearTarget ? GOLD : G,
                  boxShadow: `0 0 8px ${payoutEligible ? G : nearTarget ? GOLD : G}60`,
                }}
              />
            </div>

            {/* Amount + percentage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontWeight: 700, color: totalPnl >= 0 ? G : R }}>
                  ${Math.max(0, totalPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                {' '}of ${profitTarget.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: nearTarget ? GOLD : payoutEligible ? G : 'rgba(255,255,255,0.5)' }}>
                {Math.round(Math.max(0, payoutPct))}%
              </div>
            </div>

            {/* Days estimate */}
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
              {payoutEligible
                ? <span style={{ color: G, fontWeight: 600 }}>Ready for payout 🎉</span>
                : daysEstimate !== null
                  ? <>At your current pace — <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{daysEstimate} trading day{daysEstimate !== 1 ? 's' : ''}</span> to payout</>
                  : avgDailyPnl <= 0
                    ? 'Increase daily performance to estimate payout'
                    : null
              }
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={importing ? onCancelImport : onStartImport}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
              fontFamily: 'Barlow', cursor: 'pointer',
              background: importing ? `${G}25` : 'transparent',
              color: importing ? G : 'rgba(255,255,255,0.55)',
              border: importing ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {importing ? 'Cancel Import' : 'Import Trades'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onDeleteRequest}
            style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12,
              fontFamily: 'Barlow', cursor: 'pointer',
              background: 'transparent', color: `${R}80`,
              border: '1px solid rgba(255,45,45,0.2)',
            }}
          >
            ✕
          </motion.button>
        </div>
      </div>

      {/* Inline import panel */}
      <AnimatePresence>
        {importing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(0,255,65,0.1)', padding: '14px', background: '#0a150a' }}>
              <div style={{ fontSize: 11, color: `${G}80`, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                Importing into: {account.name}
              </div>
              <BrokerageSync
                preselectedAccountId={account.id}
                preselectedAccountName={account.name}
                onTradesImported={onImportDone}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── EditAccountCard ────────────────────────────────────────────────────────

function EditAccountCard({ account, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:            account.name,
    type:            account.type,
    phase:           account.phase || 'evaluation',
    startingBalance: account.startingBalance ? String(account.startingBalance) : '',
    dailyLossLimit:  account.dailyLossLimit  ? String(account.dailyLossLimit)  : '',
    maxDrawdown:     account.maxDrawdown      ? String(account.maxDrawdown)     : '',
    profitTarget:    account.profitTarget     ? String(account.profitTarget)    : '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('Account name is required'); return; }
    setSaving(true); setErr('');
    try {
      await onSave(account.id, {
        name:            form.name.trim(),
        type:            form.type,
        phase:           form.type === 'prop' ? form.phase : null,
        startingBalance: form.startingBalance ? parseFloat(form.startingBalance) : 0,
        dailyLossLimit:  form.dailyLossLimit  ? parseFloat(form.dailyLossLimit)  : null,
        maxDrawdown:     form.maxDrawdown      ? parseFloat(form.maxDrawdown)     : null,
        profitTarget:    form.profitTarget     ? parseFloat(form.profitTarget)    : null,
      });
    } catch (e) {
      setErr(e.message || 'Failed to save'); setSaving(false);
    }
  };

  return (
    <div style={{ background: '#0d1a0d', border: `1px solid ${G}25`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
        Edit Account
      </div>

      {/* Name + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Account Name *</div>
          <input
            value={form.name}
            onChange={e => setF('name', e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: '#111811', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 11px', fontSize: 13, color: '#fff', fontFamily: 'Barlow', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = `${G}70`}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Type</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ACCOUNT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setF('type', value)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  fontFamily: 'Barlow', cursor: 'pointer',
                  background: form.type === value ? `${G}20` : 'rgba(255,255,255,0.04)',
                  color: form.type === value ? G : 'rgba(255,255,255,0.4)',
                  border: form.type === value ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.12s', whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Phase — prop firm only */}
      {form.type === 'prop' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Account Phase</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { value: 'evaluation', label: 'Evaluation', color: GOLD },
              { value: 'funded',     label: 'Funded',     color: G    },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setF('phase', value)}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  fontFamily: 'Barlow', cursor: 'pointer',
                  background: form.phase === value ? `${color}20` : 'rgba(255,255,255,0.04)',
                  color: form.phase === value ? color : 'rgba(255,255,255,0.4)',
                  border: form.phase === value ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Starting Balance */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Starting Balance ($)</div>
        <input
          type="number" placeholder="e.g. 100000"
          value={form.startingBalance}
          onChange={e => setF('startingBalance', e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', background: '#111811', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 11px', fontSize: 13, color: '#fff', fontFamily: 'Barlow', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = `${G}70`}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
      </div>

      {/* Optional limits */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Optional limits</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { key: 'dailyLossLimit', label: 'Daily Loss Limit' },
          { key: 'maxDrawdown',    label: 'Max Drawdown' },
          { key: 'profitTarget',   label: 'Profit Target' },
        ].map(({ key, label }) => (
          <div key={key}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{label}</div>
            <input
              type="number" placeholder="$"
              value={form[key]}
              onChange={e => setF(key, e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: '#111811', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 8px', fontSize: 12, color: '#fff', fontFamily: 'Barlow', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = `${G}60`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        ))}
      </div>

      {err && <div style={{ fontSize: 12, color: R, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={saving}
          style={{ flex: 1, padding: '10px', borderRadius: 8, background: G, color: '#000', border: 'none', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', fontFamily: 'Barlow', opacity: saving ? 0.6 : 1, boxShadow: `0 0 16px ${G}40` }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow' }}
        >
          Cancel
        </motion.button>
      </div>
    </div>
  );
}

// ── UpdateBalanceModal ─────────────────────────────────────────────────────

function UpdateBalanceModal({ account, onSave, onCancel }) {
  const calcBalance = account.startingBalance + 0; // will be overridden by trades in parent, pass as prop if needed
  const initial = account.manualBalance != null
    ? String(account.manualBalance)
    : account.startingBalance ? String(account.startingBalance) : '';
  const [value, setValue]   = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || value === '') { setErr('Enter a valid balance'); return; }
    setSaving(true); setErr('');
    try { await onSave(account.id, num); }
    catch (e) { setErr(e.message || 'Failed to save'); setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay" onClick={onCancel}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="modal-sheet" onClick={e => e.stopPropagation()}
        style={{ background: '#0d0d0d', border: `1px solid ${G}30` }}
      >
        <div className="modal-handle" />
        <div className="modal-title">Update Account Balance</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          Enter your current balance directly from your broker dashboard for the most accurate tracking.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Current Balance ($)
          </div>
          <input
            type="number" placeholder="e.g. 101500"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111811', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '11px 13px', fontSize: 18,
              color: '#fff', fontFamily: 'Barlow', outline: 'none',
              fontWeight: 700,
            }}
            onFocus={e => e.target.style.borderColor = `${G}70`}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {err && <div style={{ fontSize: 12, color: R, marginBottom: 10 }}>{err}</div>}

        {account.balanceLastUpdated && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
            Last updated: {new Date(account.balanceLastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '13px', borderRadius: 8, marginBottom: 12,
            background: G, color: '#000', border: 'none',
            fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer',
            fontFamily: 'Barlow', opacity: saving ? 0.6 : 1,
            boxShadow: `0 0 20px ${G}40`,
          }}
        >
          {saving ? 'Saving…' : 'Save Balance'}
        </button>
        <button
          onClick={onCancel}
          style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow', padding: '6px' }}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

function StatCell({ label, value, positive, warn }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: warn ? R : positive ? G : R }}>
        {value}
      </div>
    </div>
  );
}

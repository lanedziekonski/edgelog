import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtPnl, todayStr } from '../hooks/useTrades';
import BrokerageSync from '../components/BrokerageSync';

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
  startingBalance: '',
  dailyLossLimit: '',
  maxDrawdown: '',
  profitTarget: '',
});

export default function Accounts({
  trades, accounts, accountsLoading,
  createAccount, deleteAccount, reloadAccounts,
}) {
  const today = todayStr();
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm]                 = useState(emptyForm());
  const [creating, setCreating]         = useState(false);
  const [createErr, setCreateErr]       = useState('');
  const [importingFor, setImportingFor] = useState(null); // account.id or null
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) { setCreateErr('Account name is required'); return; }
    setCreating(true);
    setCreateErr('');
    try {
      await createAccount({
        name:            form.name.trim(),
        type:            form.type,
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
              <AccountCard
                account={account}
                trades={trades}
                today={today}
                importing={importingFor === account.id}
                onStartImport={() => setImportingFor(account.id)}
                onCancelImport={() => setImportingFor(null)}
                onImportDone={handleImportDone}
                onDeleteRequest={() => setDeleteConfirm(account.id)}
              />
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
    </div>
  );
}

// ── AccountCard ────────────────────────────────────────────────────────────

function AccountCard({ account, trades, today, importing, onStartImport, onCancelImport, onImportDone, onDeleteRequest }) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.5px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {account.name}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${color}18`, color, border: `1px solid ${color}40`, flexShrink: 0, letterSpacing: '0.3px' }}>
                {typeLabel}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {acctTrades.length} trade{acctTrades.length !== 1 ? 's' : ''} · {winRate}% win rate
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
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

        {/* Balance row if starting balance set */}
        {account.startingBalance > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Balance</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: balance >= account.startingBalance ? G : R }}>
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            {account.dailyLossLimit && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Daily Limit</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: dailyPnl <= -account.dailyLossLimit ? R : 'rgba(255,255,255,0.6)' }}>
                  ${account.dailyLossLimit.toLocaleString()}
                </div>
              </div>
            )}
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

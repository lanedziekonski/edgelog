import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Trash2, X, Upload, RefreshCw, Check } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useTrades, fmtPnl } from '../hooks/useTrades';

const G = '#00ff41';
const R = '#ff4d4d';
const GOLD = '#ffaa33';
const ACCOUNT_TYPES = ['prop', 'live', 'paper'];
const PHASES = ['evaluation', 'funded'];
const BROKERS = ['tradovate', 'ibkr', 'thinkorswim', 'tradestation', 'webull'];
const EMPTY_FORM = {
  name: '', type: 'prop', phase: 'evaluation',
  startingBalance: '', manualBalance: '',
  profitTarget: '', maxDrawdown: '', dailyLossLimit: '',
};

const inp = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none', fontFamily: 'inherit',
};

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export default function AppAccounts() {
  const { accounts, loading, createAccount, deleteAccount, updateAccountBalance, reload } = useAccounts();
  const { trades } = useTrades();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvBroker, setCsvBroker] = useState('tradovate');
  const [editingBalance, setEditingBalance] = useState(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [savingBalance, setSavingBalance] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const accountStats = useMemo(() => {
    const map = {};
    accounts.forEach(acc => {
      const accTrades = trades.filter(t =>
        t.accountId === acc.id || (!t.accountId && t.account === acc.name)
      );
      const todayTrades = accTrades.filter(t => t.date === today);
      const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
      const totalPnl = accTrades.reduce((s, t) => s + t.pnl, 0);
      map[acc.id] = { totalTrades: accTrades.length, todayPnl, totalPnl };
    });
    return map;
  }, [accounts, trades, today]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) { setErr('Account name is required'); return; }
    setSaving(true);
    try {
      const created = await createAccount({
        name: form.name.trim(),
        type: form.type,
        phase: form.phase,
        starting_balance: parseFloat(form.startingBalance) || 0,
        manual_balance: form.manualBalance ? parseFloat(form.manualBalance) : null,
        profit_target: form.profitTarget ? parseFloat(form.profitTarget) : null,
        max_drawdown: form.maxDrawdown ? parseFloat(form.maxDrawdown) : null,
        daily_loss_limit: form.dailyLossLimit ? parseFloat(form.dailyLossLimit) : null,
      });
      if (csvFile && created?.id) {
        try {
          const fd = new FormData();
          fd.append('file', csvFile);
          fd.append('broker', csvBroker);
          fd.append('accountId', created.id);
          const token = localStorage.getItem('tradeascend_token');
          await fetch(`${import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com'}/api/trades/import`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
          });
        } catch (e) { console.error('CSV import failed', e); }
      }
      setAddOpen(false);
      setForm(EMPTY_FORM);
      setCsvFile(null);
    } catch (e) { setErr(e.message || 'Failed to create account'); }
    finally { setSaving(false); }
  };

  const openEdit = (acc) => {
    setEditingAcc(acc);
    setEditForm({
      name: acc.name || '',
      type: acc.type || 'prop',
      phase: acc.phase || 'evaluation',
      startingBalance: acc.startingBalance?.toString() || '',
      manualBalance: acc.balance?.toString() || '',
      profitTarget: acc.profitTarget?.toString() || '',
      maxDrawdown: acc.maxDrawdown?.toString() || '',
      dailyLossLimit: acc.dailyLossLimit?.toString() || '',
    });
    setEditErr('');
    setEditOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditErr('');
    if (!editForm.name.trim()) { setEditErr('Account name is required'); return; }
    setEditSaving(true);
    try {
      const token = localStorage.getItem('tradeascend_token');
      const API = (import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com') + '/api';
      const res = await fetch(`${API}/accounts/${editingAcc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name.trim(),
          type: editForm.type,
          phase: editForm.phase,
          starting_balance: parseFloat(editForm.startingBalance) || 0,
          manual_balance: editForm.manualBalance ? parseFloat(editForm.manualBalance) : null,
          profit_target: editForm.profitTarget ? parseFloat(editForm.profitTarget) : null,
          max_drawdown: editForm.maxDrawdown ? parseFloat(editForm.maxDrawdown) : null,
          daily_loss_limit: editForm.dailyLossLimit ? parseFloat(editForm.dailyLossLimit) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      await reload();
      setEditOpen(false);
      setEditingAcc(null);
    } catch (e) { setEditErr(e.message || 'Failed to update account'); }
    finally { setEditSaving(false); }
  };

  const handleSaveBalance = async (accId) => {
    const val = parseFloat(balanceInput);
    if (isNaN(val)) return;
    setSavingBalance(true);
    try {
      await updateAccountBalance(accId, val);
      setEditingBalance(null);
      setBalanceInput('');
    } catch (e) { console.error(e); }
    finally { setSavingBalance(false); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Loading…</p></div>;

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Accounts</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</h1>
          {accounts.length > 0 && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Total balance: <span style={{ color: G, fontWeight: 700 }}>${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          )}
        </div>
        <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: G, color: '#000', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Wallet size={40} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>No accounts yet</p>
          <button onClick={() => setAddOpen(true)} style={{ fontSize: 13, color: G, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Add your first account →</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {accounts.map((acc, i) => {
            const stats = accountStats[acc.id] || {};
            const balance = acc.balance || 0;
            const starting = acc.startingBalance || balance;
            const pl = balance - starting;
            const plPct = starting > 0 ? (pl / starting) * 100 : 0;
            const profitGain = Math.max(0, balance - starting);
            const profitPct = acc.profitTarget > 0 ? Math.min((profitGain / acc.profitTarget) * 100, 100) : 0;
            const drawdownUsed = Math.max(0, starting - balance);
            const drawdownPct = acc.maxDrawdown > 0 ? Math.min((drawdownUsed / acc.maxDrawdown) * 100, 100) : 0;
            const todayLoss = Math.max(0, -stats.todayPnl);
            const dailyUsedPct = acc.dailyLossLimit > 0 ? Math.min((todayLoss / acc.dailyLossLimit) * 100, 100) : 0;
            const isEditingBal = editingBalance === acc.id;

            return (
              <motion.div key={acc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ borderRadius: 16, padding: 20, background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{acc.name}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: 20, background: acc.type === 'prop' ? `${G}18` : 'rgba(255,255,255,0.07)', color: acc.type === 'prop' ? G : 'rgba(255,255,255,0.5)' }}>
                        {acc.type || 'prop'}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                        {acc.phase || 'evaluation'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(acc)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }} title="Edit account">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deleteAccount(acc.id)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)' }} title="Delete account">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Current Balance</p>
                  {isEditingBal ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number" step="0.01" value={balanceInput}
                        onChange={e => setBalanceInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveBalance(acc.id)}
                        placeholder={balance.toFixed(2)}
                        autoFocus
                        style={{ ...inp, flex: 1, fontSize: 16, fontWeight: 700, borderColor: `${G}50` }}
                      />
                      <button onClick={() => handleSaveBalance(acc.id)} disabled={savingBalance} style={{ padding: '8px 12px', borderRadius: 8, background: G, color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingBalance(null)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: pl >= 0 ? G : R, margin: 0 }}>
                        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <button onClick={() => { setEditingBalance(acc.id); setBalanceInput(balance.toFixed(2)); }}
                        style={{ padding: 5, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} title="Update balance">
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: 12, fontFamily: 'monospace', color: pl >= 0 ? G : R, marginTop: 4 }}>
                    {pl >= 0 ? '+' : ''}${Math.abs(pl).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
                    <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>from ${starting.toLocaleString('en-US', { maximumFractionDigits: 0 })} start</span>
                  </p>
                  {acc.balanceLastUpdated && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2, fontFamily: 'monospace' }}>
                      Updated {new Date(acc.balanceLastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Trade stats for this account */}
                {stats.totalTrades > 0 && (
                  <div style={{ display: 'flex', gap: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Trades</p>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{stats.totalTrades}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Total P&L</p>
                      <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: stats.totalPnl >= 0 ? G : R }}>{fmtPnl(stats.totalPnl)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Today</p>
                      <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: stats.todayPnl >= 0 ? G : R }}>{fmtPnl(stats.todayPnl)}</p>
                    </div>
                  </div>
                )}

                {/* Profit Target */}
                {acc.profitTarget > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>Profit Target</p>
                      <p style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: profitPct >= 100 ? G : 'rgba(255,255,255,0.6)' }}>
                        ${profitGain.toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${acc.profitTarget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${profitPct}%`, background: G, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{profitPct.toFixed(1)}% complete</p>
                  </div>
                )}

                {/* Max Drawdown */}
                {acc.maxDrawdown > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>Max Drawdown</p>
                      <p style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: drawdownPct >= 90 ? R : drawdownPct >= 70 ? GOLD : 'rgba(255,255,255,0.6)' }}>
                        ${drawdownUsed.toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${acc.maxDrawdown.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${drawdownPct}%`, background: drawdownPct >= 90 ? R : drawdownPct >= 70 ? GOLD : G, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                      ${(acc.maxDrawdown - drawdownUsed).toLocaleString('en-US', { maximumFractionDigits: 0 })} remaining
                    </p>
                    {drawdownPct >= 90 && <p style={{ fontSize: 11, color: R, fontWeight: 700, marginTop: 4 }}>🚨 Near max drawdown — stop trading</p>}
                    {drawdownPct >= 70 && drawdownPct < 90 && <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginTop: 4 }}>⚠ Approaching max drawdown</p>}
                  </div>
                )}

                {/* Daily Loss Limit */}
                {acc.dailyLossLimit > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>Daily Loss Limit</p>
                      <p style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: dailyUsedPct >= 90 ? R : dailyUsedPct >= 70 ? GOLD : 'rgba(255,255,255,0.6)' }}>
                        ${todayLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${acc.dailyLossLimit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${dailyUsedPct}%`, background: dailyUsedPct >= 90 ? R : dailyUsedPct >= 70 ? GOLD : G, transition: 'width 0.4s ease' }} />
                    </div>
                    {dailyUsedPct >= 90 && <p style={{ fontSize: 11, color: R, fontWeight: 700, marginTop: 4 }}>🚨 Near daily loss limit — stop trading</p>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: 20, padding: 24, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Add Account</h2>
                <button onClick={() => setAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={20} /></button>
              </div>
              {err && <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,60,60,0.1)', color: '#ff6b6b', fontSize: 13 }}>{err}</div>}
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Account Name">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Apex $100K" style={inp} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Type">
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Phase">
                    <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                      {PHASES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Starting Balance ($)">
                    <input type="number" step="0.01" value={form.startingBalance} onChange={e => setForm(f => ({ ...f, startingBalance: e.target.value }))} placeholder="100000" style={inp} />
                  </Field>
                  <Field label="Current Balance ($)">
                    <input type="number" step="0.01" value={form.manualBalance} onChange={e => setForm(f => ({ ...f, manualBalance: e.target.value }))} placeholder="100000" style={inp} />
                  </Field>
                </div>
                <Field label="Profit Target ($)">
                  <input type="number" step="0.01" value={form.profitTarget} onChange={e => setForm(f => ({ ...f, profitTarget: e.target.value }))} placeholder="10000" style={inp} />
                </Field>
                <Field label="Max Drawdown ($)">
                  <input type="number" step="0.01" value={form.maxDrawdown} onChange={e => setForm(f => ({ ...f, maxDrawdown: e.target.value }))} placeholder="5000" style={inp} />
                </Field>
                <Field label="Daily Loss Limit ($)">
                  <input type="number" step="0.01" value={form.dailyLossLimit} onChange={e => setForm(f => ({ ...f, dailyLossLimit: e.target.value }))} placeholder="1000" style={inp} />
                </Field>

                {/* CSV Import */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                  <p style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Import Trades from CSV (optional)</p>
                  <Field label="Broker">
                    <select value={csvBroker} onChange={e => setCsvBroker(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                      {BROKERS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                    </select>
                  </Field>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1px dashed rgba(0,255,65,0.3)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', marginTop: 10 }}>
                    <Upload size={16} style={{ color: G, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{csvFile ? csvFile.name : 'Choose CSV file…'}</span>
                    <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setCsvFile(e.target.files[0])} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setAddOpen(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: saving ? `${G}70` : G, color: '#000', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                    {saving ? 'Saving…' : 'Add Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {editOpen && editingAcc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) setEditOpen(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: 20, padding: 24, background: '#0d0d0d', border: '1px solid rgba(0,255,65,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Edit Account</h2>
                <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={20} /></button>
              </div>
              {editErr && <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,60,60,0.1)', color: '#ff6b6b', fontSize: 13 }}>{editErr}</div>}
              <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Account Name">
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Apex $100K" style={inp} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Type">
                    <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Phase">
                    <select value={editForm.phase} onChange={e => setEditForm(f => ({ ...f, phase: e.target.value }))} style={{ ...inp, appearance: 'none' }}>
                      {PHASES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Starting Balance ($)">
                    <input type="number" step="0.01" value={editForm.startingBalance} onChange={e => setEditForm(f => ({ ...f, startingBalance: e.target.value }))} placeholder="100000" style={inp} />
                  </Field>
                  <Field label="Current Balance ($)">
                    <input type="number" step="0.01" value={editForm.manualBalance} onChange={e => setEditForm(f => ({ ...f, manualBalance: e.target.value }))} placeholder="100000" style={inp} />
                  </Field>
                </div>
                <Field label="Profit Target ($)">
                  <input type="number" step="0.01" value={editForm.profitTarget} onChange={e => setEditForm(f => ({ ...f, profitTarget: e.target.value }))} placeholder="10000" style={inp} />
                </Field>
                <Field label="Max Drawdown ($)">
                  <input type="number" step="0.01" value={editForm.maxDrawdown} onChange={e => setEditForm(f => ({ ...f, maxDrawdown: e.target.value }))} placeholder="5000" style={inp} />
                </Field>
                <Field label="Daily Loss Limit ($)">
                  <input type="number" step="0.01" value={editForm.dailyLossLimit} onChange={e => setEditForm(f => ({ ...f, dailyLossLimit: e.target.value }))} placeholder="1000" style={inp} />
                </Field>
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setEditOpen(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                  <button type="submit" disabled={editSaving} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: editSaving ? 'rgba(0,255,65,0.4)' : '#00ff41', color: '#000', border: 'none', cursor: editSaving ? 'default' : 'pointer', fontSize: 14, fontWeight: 700 }}>
                    {editSaving ? 'Saving…' : 'Save Changes'}
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

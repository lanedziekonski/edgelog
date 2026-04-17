import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Trash2, X, Upload } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';

const G = '#00ff41';
const ACCOUNT_TYPES = ['Funded', 'Evaluation', 'Live', 'Paper'];
const EMPTY_FORM = { name: '', accountType: 'Live', balance: '', startingBalance: '', profitTarget: '', maxDrawdown: '', dailyLossLimit: '', phase: 'evaluation' };
const BROKERS = ['tradovate', 'ibkr', 'thinkorswim', 'tradestation', 'webull'];

export default function AppAccounts() {
  const { accounts, loading, createAccount, deleteAccount } = useAccounts();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvBroker, setCsvBroker] = useState('tradovate');

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) { setErr('Account name is required'); return; }
    setSaving(true);
    try {
      await createAccount({
        name: form.name.trim(),
        accountType: form.accountType,
        balance: parseFloat(form.balance) || 0,
        startingBalance: parseFloat(form.startingBalance) || parseFloat(form.balance) || 0,
        profit_target: parseFloat(form.profitTarget) || null,
        max_drawdown: parseFloat(form.maxDrawdown) || null,
        daily_loss_limit: parseFloat(form.dailyLossLimit) || null,
        phase: form.phase || 'evaluation',
      });
      if (csvFile) {
        try {
          const formData = new FormData();
          formData.append('file', csvFile);
          formData.append('broker', csvBroker);
          const token = localStorage.getItem('tradeascend_token');
          await fetch(`${import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com'}/trades/import`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
        } catch (e) { console.error('CSV import failed', e); }
      }
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      setErr(e.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p></div>;

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>Accounts</p>
          <h1 className="text-3xl font-bold tracking-tight">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</h1>
          {accounts.length > 0 && (
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Total balance: <span style={{ color: G }}>
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm"
          style={{ background: G, color: '#000' }}
        >
          <Plus className="w-4 h-4" /> Add Account
        </motion.button>
      </div>

      {/* Account cards */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Wallet className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No accounts yet</p>
          <button onClick={() => setAddOpen(true)} className="text-sm font-medium hover:underline" style={{ color: G }}>
            Add your first account →
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => {
            const balance = acc.balance || 0;
            const starting = acc.startingBalance || balance;
            const pl = balance - starting;
            const plPct = starting > 0 ? (pl / starting) * 100 : 0;

            const profitGain = balance - starting;
            const profitPct = acc.profitTarget > 0 ? Math.min((profitGain / acc.profitTarget) * 100, 100) : 0;

            const drawdownUsed = Math.max(0, starting - balance);
            const drawdownPct = acc.maxDrawdown > 0 ? Math.min((drawdownUsed / acc.maxDrawdown) * 100, 100) : 0;

            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-5 flex flex-col gap-4"
                style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-base leading-tight">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: acc.accountType === 'Funded' ? `${G}18` : 'rgba(255,255,255,0.07)', color: acc.accountType === 'Funded' ? G : 'rgba(255,255,255,0.5)' }}>
                        {acc.accountType || 'Live'}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                        {acc.phase || 'Evaluation'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteAccount(acc.id)}
                    className="p-1.5 rounded-lg transition-colors hover:text-red-400 hover:bg-red-500/[0.06]"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Current Balance</p>
                  <p className="text-3xl font-bold font-mono" style={{ color: pl >= 0 ? G : '#ff4d4d' }}>
                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-mono mt-1" style={{ color: pl >= 0 ? G : '#ff4d4d' }}>
                    {pl >= 0 ? '+' : ''}${Math.abs(pl).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
                    <span className="ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>from ${starting.toLocaleString('en-US', { maximumFractionDigits: 0 })} start</span>
                  </p>
                </div>

                {/* Profit Target tracker */}
                {acc.profitTarget > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Profit Target</p>
                      <p className="text-xs font-mono font-bold" style={{ color: profitPct >= 100 ? G : 'rgba(255,255,255,0.6)' }}>
                        ${profitGain.toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${acc.profitTarget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${profitPct}%`, background: G }} />
                    </div>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{profitPct.toFixed(1)}% to target</p>
                  </div>
                )}

                {/* Max Drawdown tracker */}
                {acc.maxDrawdown > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Max Drawdown</p>
                      <p className="text-xs font-mono font-bold" style={{ color: drawdownPct >= 90 ? '#ff4d4d' : drawdownPct >= 70 ? '#ffaa33' : 'rgba(255,255,255,0.6)' }}>
                        ${drawdownUsed.toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${acc.maxDrawdown.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${drawdownPct}%`, background: drawdownPct >= 90 ? '#ff4d4d' : drawdownPct >= 70 ? '#ffaa33' : G }} />
                    </div>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      ${(acc.maxDrawdown - drawdownUsed).toLocaleString('en-US', { maximumFractionDigits: 0 })} remaining
                    </p>
                  </div>
                )}

                {/* Daily Loss Limit */}
                {acc.dailyLossLimit > 0 && (
                  <div className="rounded-lg px-3 py-2.5 flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Daily Loss Limit</p>
                    <p className="text-sm font-mono font-bold" style={{ color: '#ffaa33' }}>
                      ${acc.dailyLossLimit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Add Account</h2>
                <button onClick={() => setAddOpen(false)} style={{ color: 'rgba(255,255,255,0.4)' }}><X className="w-5 h-5" /></button>
              </div>
              {err && <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,60,60,0.1)', color: '#ff6b6b' }}>{err}</div>}
              <form onSubmit={handleAdd} className="space-y-4">
                <ModalField label="Account Name">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Apex $100K" className="modal-input" />
                </ModalField>
                <ModalField label="Type">
                  <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))} className="modal-input appearance-none">
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </ModalField>
                <div className="grid grid-cols-2 gap-3">
                  <ModalField label="Starting Balance ($)">
                    <input type="number" step="0.01" value={form.startingBalance} onChange={e => setForm(f => ({ ...f, startingBalance: e.target.value }))} placeholder="100000" className="modal-input" />
                  </ModalField>
                  <ModalField label="Current Balance ($)">
                    <input type="number" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="100000" className="modal-input" />
                  </ModalField>
                </div>
                <ModalField label="Profit Target ($)">
                  <input type="number" step="0.01" value={form.profitTarget || ''} onChange={e => setForm(f => ({ ...f, profitTarget: e.target.value }))} placeholder="10000" className="modal-input" />
                </ModalField>
                <ModalField label="Max Drawdown ($)">
                  <input type="number" step="0.01" value={form.maxDrawdown || ''} onChange={e => setForm(f => ({ ...f, maxDrawdown: e.target.value }))} placeholder="5000" className="modal-input" />
                </ModalField>
                <ModalField label="Daily Loss Limit ($)">
                  <input type="number" step="0.01" value={form.dailyLossLimit || ''} onChange={e => setForm(f => ({ ...f, dailyLossLimit: e.target.value }))} placeholder="1000" className="modal-input" />
                </ModalField>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 4 }}>
                  <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Import Trades from CSV (optional)</p>
                  <ModalField label="Broker">
                    <select value={csvBroker} onChange={e => setCsvBroker(e.target.value)} className="modal-input appearance-none">
                      {BROKERS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                    </select>
                  </ModalField>
                  <div className="mt-3">
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors" style={{ border: '1px dashed rgba(0,255,65,0.3)', color: 'rgba(255,255,255,0.5)' }}>
                      <Upload className="w-4 h-4 flex-shrink-0" style={{ color: G }} />
                      <span className="text-sm">{csvFile ? csvFile.name : 'Choose CSV file…'}</span>
                      <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm border" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: saving ? `${G}70` : G, color: '#000' }}>
                    {saving ? 'Saving…' : 'Add Account'}
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

function ModalField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</label>
      {children}
    </div>
  );
}

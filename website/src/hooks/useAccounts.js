import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'https://edgelog.onrender.com/api';

export function useAccounts() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback((showLoading = true) => {
    if (!token) { setAccounts([]); setLoading(false); return; }
    if (showLoading) setLoading(true);
    fetch(`${API}/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data.map(a => ({
        ...a,
        id: a.id,
        name: a.name,
        accountType: a.type || 'Live',
        type: a.type || 'prop',
        phase: a.phase || 'evaluation',
        startingBalance: parseFloat(a.starting_balance) || 0,
        balance: a.manual_balance != null ? parseFloat(a.manual_balance) : parseFloat(a.starting_balance) || 0,
        dailyLossLimit: a.daily_loss_limit != null ? parseFloat(a.daily_loss_limit) : null,
        maxDrawdown: a.max_drawdown != null ? parseFloat(a.max_drawdown) : null,
        profitTarget: a.profit_target != null ? parseFloat(a.profit_target) : null,
        balanceLastUpdated: a.balance_last_updated || null,
      })) : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const createAccount = useCallback(async (data) => {
    const res = await fetch(`${API}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const acc = await res.json();
    if (!res.ok) throw new Error(acc.error || 'Failed');
    setAccounts(prev => [...prev, acc]);
    return acc;
  }, [token]);

  const deleteAccount = useCallback(async (id) => {
    await fetch(`${API}/accounts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, [token]);

  const updateAccountBalance = useCallback(async (id, balance) => {
    const res = await fetch(`${API}/accounts/${id}/balance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ balance }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    setAccounts(prev => prev.map(a => a.id === id ? {
      ...a,
      balance: balance,
      manualBalance: balance,
      balanceLastUpdated: new Date().toISOString(),
    } : a));
    return data;
  }, [token]);

  return { accounts, loading, reload: load, createAccount, deleteAccount, updateAccountBalance };
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'https://edgelog.onrender.com/api';

export function useAccounts() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    if (!token) { setAccounts([]); setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

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

  return { accounts, loading, reload: load, createAccount, deleteAccount };
}

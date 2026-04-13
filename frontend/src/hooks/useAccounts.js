import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function useAccounts() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const reload = useCallback(() => {
    if (!token) { setAccounts([]); setAccountsLoading(false); return; }
    setAccountsLoading(true);
    api.getAccounts(token)
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const createAccount = useCallback(async (data) => {
    const acc = await api.createAccount(token, data);
    setAccounts(prev => [...prev, acc]);
    return acc;
  }, [token]);

  const deleteAccount = useCallback(async (id) => {
    await api.deleteAccount(token, id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, [token]);

  return { accounts, accountsLoading, createAccount, deleteAccount, reloadAccounts: reload };
}

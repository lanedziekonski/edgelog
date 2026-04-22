import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'traderascend_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // On mount, validate stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me(token)
      .then(data => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await api.register(email, password, name);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  // Re-fetch user to sync plan after Stripe redirect
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.me(token);
      setUser(data.user);
      // Re-sign token with new plan — server handles this on next me() call,
      // but we need to refetch a fresh token on plan change.
      // For simplicity, we'll just update the local user object.
    } catch { /* ignore */ }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Plan access hierarchy
const PLAN_ORDER = ['free', 'trader', 'pro', 'elite'];

export function hasAccess(userPlan, requiredPlan) {
  return PLAN_ORDER.indexOf(userPlan || 'free') >= PLAN_ORDER.indexOf(requiredPlan);
}

export const PLANS = {
  free:   { name: 'Free',   price: 0,     annualPrice: 0,      annualPerMonth: 0,     color: '#888888' },
  trader: { name: 'Trader', price: 9.99,  annualPrice: 89.91,  annualPerMonth: 7.49,  color: '#6c63ff', annualSavings: 25 },
  pro:    { name: 'Pro',    price: 24.99, annualPrice: 224.91, annualPerMonth: 18.74, color: '#f0a500', annualSavings: 25 },
  elite:  { name: 'Elite',  price: 49.99, annualPrice: 449.91, annualPerMonth: 37.49, color: '#00f07a', annualSavings: 25 },
};

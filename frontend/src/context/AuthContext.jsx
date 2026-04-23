import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'traderascend_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // On mount: check for ?token= in URL (cross-subdomain handoff from website),
  // then validate whichever token we have (URL token takes priority over localStorage).
  useEffect(() => {
    // 1. Extract URL token and strip it from the URL immediately so it never
    //    lingers in browser history or gets accidentally shared.
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken  = urlParams.get('token') || null;
    if (urlToken) {
      urlParams.delete('token');
      const newSearch = urlParams.toString();
      const newUrl    = window.location.pathname +
                        (newSearch ? `?${newSearch}` : '') +
                        window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }

    // Snapshot the localStorage token so the async closure below doesn't
    // capture stale state from potential future renders.
    const storedToken = token;

    async function init() {
      // 2. Try URL token first (it's fresher — came straight from the website's signup).
      if (urlToken) {
        try {
          const data = await api.me(urlToken);
          localStorage.setItem(TOKEN_KEY, urlToken);
          setToken(urlToken);
          setUser(data.user);
          console.log('[Auth] Logged in via URL token for user:', data.user.email);
          return; // done — skip localStorage check
        } catch {
          // URL token is invalid/expired — fall through to try localStorage token.
        }
      }

      // 3. Fall back to localStorage token (existing behavior).
      if (!storedToken) { setLoading(false); return; }
      try {
        const data = await api.me(storedToken);
        setUser(data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    }

    init().finally(() => setLoading(false));
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

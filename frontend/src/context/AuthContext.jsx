import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'traderascend_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tracks whether the token on this mount came from a URL param.
  // Set synchronously inside the token useState initializer below so we
  // can log correctly in the useEffect without another URL read.
  const urlTokenRef = useRef(null);

  // Initialize token SYNCHRONOUSLY during render (before any effects run).
  //
  // Why here and not in useEffect?
  // React runs child effects BEFORE parent effects. AppInner (a child of
  // AuthProvider) has a useEffect that cleans the /pricing URL to "/",
  // stripping ALL query params — including ?token=. If we waited for a
  // useEffect to read ?token=, AppInner's effect would already have wiped
  // it from the URL. A useState initializer runs during the render phase,
  // which happens before any effects fire, guaranteeing we read the token
  // before any cleanup effect can destroy it.
  const [token, setToken] = useState(() => {
    const params   = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || null;

    if (urlToken) {
      // Strip ?token= immediately but keep other params (?plan=, ?billing=, ?ref=).
      params.delete('token');
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
      );
      // Persist so the useEffect validator (and anything that reads
      // localStorage directly) picks it up automatically.
      localStorage.setItem(TOKEN_KEY, urlToken);
      urlTokenRef.current = true;
      return urlToken;
    }

    return localStorage.getItem(TOKEN_KEY);
  });

  // Validate whichever token we have (URL-sourced or localStorage) once on mount.
  useEffect(() => {
    console.log('[Auth] Initial mount: checking URL for token...');

    if (urlTokenRef.current) {
      console.log('[Auth] URL token found, validating...');
    } else if (token) {
      console.log('[Auth] No URL token, falling back to localStorage');
    } else {
      console.log('[Auth] No valid auth, user is logged out');
      setLoading(false);
      return;
    }

    api.me(token)
      .then(data => {
        setUser(data.user);
        if (urlTokenRef.current) {
          console.log('[Auth] URL token valid, logging in user', data.user.email);
        }
      })
      .catch(() => {
        console.log('[Auth] No valid auth, user is logged out');
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

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function useTrades() {
  const { token } = useAuth();
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);

  useEffect(() => {
    if (!token) { setTrades([]); setTradesLoading(false); return; }
    setTradesLoading(true);
    api.getTrades(token)
      .then(setTrades)
      .catch(() => setTrades([]))
      .finally(() => setTradesLoading(false));
  }, [token]);

  const addTrade = useCallback(async (trade) => {
    const newTrade = await api.createTrade(token, trade);
    setTrades(prev => [newTrade, ...prev]);
    return newTrade;
  }, [token]);

  const deleteTrade = useCallback(async (id) => {
    await api.deleteTrade(token, id);
    setTrades(prev => prev.filter(t => t.id !== id));
  }, [token]);

  const updateTrade = useCallback(async (id, updates) => {
    const updated = await api.updateTrade(token, id, updates);
    setTrades(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, [token]);

  const patchTrade = useCallback(async (id, fields) => {
    const updated = await api.patchTrade(token, id, fields);
    setTrades(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, [token]);

  return { trades, tradesLoading, addTrade, deleteTrade, updateTrade, patchTrade };
}

export function calcStats(trades) {
  if (!trades.length) return {
    totalPnl: 0, winRate: 0, totalTrades: 0, ruleScore: 0,
    wins: 0, losses: 0, bySetup: {}, avgWin: 0, avgLoss: 0,
  };

  const wins   = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const totalPnl   = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate    = (wins.length / trades.length) * 100;
  const ruleScore  = (trades.filter(t => t.followedPlan).length / trades.length) * 100;
  const avgWin  = wins.length   ? wins.reduce((s, t)   => s + t.pnl, 0) / wins.length   : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;

  const SETUPS = ['ORB', 'VWAP Reclaim', 'Bull Flag', 'Gap Fill', 'Fade High'];
  const bySetup = {};
  SETUPS.forEach(s => {
    const st = trades.filter(t => t.setup === s);
    const sw = st.filter(t => t.pnl > 0);
    bySetup[s] = {
      total: st.length,
      wins: sw.length,
      winRate: st.length ? (sw.length / st.length) * 100 : 0,
      pnl: st.reduce((sum, t) => sum + t.pnl, 0),
    };
  });

  return { totalPnl, winRate, totalTrades: trades.length, ruleScore, wins: wins.length, losses: losses.length, bySetup, avgWin, avgLoss };
}

export function calcDetailedStats(trades) {
  const base = calcStats(trades);

  // Profit factor
  const grossWins   = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLosses > 0 ? +(grossWins / grossLosses).toFixed(2) : (grossWins > 0 ? 999 : 0);

  // Daily buckets
  const byDate = {};
  trades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
  const dayValues = Object.values(byDate);
  const tradingDays = dayValues.length;
  const winDays     = dayValues.filter(v => v > 0).length;
  const lossDays    = dayValues.filter(v => v < 0).length;
  const bestDay     = dayValues.length ? Math.max(...dayValues) : 0;
  const worstDay    = dayValues.length ? Math.min(...dayValues) : 0;

  // Current streak (most-recent trades first)
  const sorted = [...trades].sort((a, b) =>
    b.date !== a.date ? b.date.localeCompare(a.date) : (b.id > a.id ? 1 : -1)
  );
  let streak = 0, streakType = null;
  for (const t of sorted) {
    const type = t.pnl > 0 ? 'win' : 'loss';
    if (!streakType) { streakType = type; streak = 1; }
    else if (type === streakType) streak++;
    else break;
  }

  // Best/worst setups by total P&L
  const setupEntries = Object.entries(base.bySetup)
    .filter(([, v]) => v.total > 0)
    .sort(([, a], [, b]) => b.pnl - a.pnl);
  const bestSetup  = setupEntries[0]  ? { name: setupEntries[0][0],  ...setupEntries[0][1]  } : null;
  const worstSetup = setupEntries.length > 1
    ? { name: setupEntries[setupEntries.length - 1][0], ...setupEntries[setupEntries.length - 1][1] }
    : null;

  return { ...base, profitFactor, tradingDays, winDays, lossDays, bestDay, worstDay, streak, streakType, bestSetup, worstSetup };
}

export function buildEquityCurve(trades) {
  if (!trades.length) return [];
  const byDate = {};
  trades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
  let cum = 0;
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      cum += pnl;
      const d = new Date(date + 'T00:00:00');
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(cum),
        daily: Math.round(pnl),
      };
    });
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function fmtPnl(val) {
  const abs = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return val >= 0 ? `+$${abs}` : `-$${abs}`;
}

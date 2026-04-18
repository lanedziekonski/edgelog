import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'https://edgelog.onrender.com/api';

export function useTrades() {
  const { token } = useAuth();
  const [trades, setTrades]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) { setTrades([]); setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/trades`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setTrades(Array.isArray(data) ? data : []))
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const addTrade = useCallback(async (trade) => {
    const res = await fetch(`${API}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(trade),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add trade');
    setTrades(prev => [data, ...prev]);
    return data;
  }, [token]);

  const deleteTrade = useCallback(async (id) => {
    await fetch(`${API}/trades/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTrades(prev => prev.filter(t => t.id !== id));
  }, [token]);

  const updateTrade = useCallback(async (id, updates) => {
    const res = await fetch(`${API}/trades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update trade');
    setTrades(prev => prev.map(t => t.id === id ? data : t));
    return data;
  }, [token]);

  return { trades, loading, reload: load, addTrade, deleteTrade, updateTrade };
}

export function calcStats(trades) {
  if (!trades.length) return {
    totalPnl: 0, winRate: 0, totalTrades: 0, wins: 0, losses: 0,
    avgWin: 0, avgLoss: 0, profitFactor: 0, ruleScore: 0,
    streak: 0, streakType: null, bestDay: 0, worstDay: 0,
    tradingDays: 0, winDays: 0, bySetup: {}, bestSetup: null,
  };
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = (wins.length / trades.length) * 100;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const grossWins = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : (grossWins > 0 ? 99 : 0);
  const ruleScore = trades.filter(t => t.followedPlan).length / trades.length * 100;
  const byDate = {};
  trades.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.pnl; });
  const dayPnls = Object.values(byDate);
  const bestDay = dayPnls.length ? Math.max(...dayPnls) : 0;
  const worstDay = dayPnls.length ? Math.min(...dayPnls) : 0;
  const tradingDays = Object.keys(byDate).length;
  const winDays = dayPnls.filter(p => p > 0).length;
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || 0);
  let streak = 0, streakType = null;
  if (sorted.length) {
    const last = sorted[sorted.length - 1];
    streakType = last.pnl > 0 ? 'win' : 'loss';
    for (let i = sorted.length - 1; i >= 0; i--) {
      const isWin = sorted[i].pnl > 0;
      if ((streakType === 'win') === isWin) streak++;
      else break;
    }
  }
  const bySetup = {};
  trades.forEach(t => {
    if (!t.setup) return;
    if (!bySetup[t.setup]) bySetup[t.setup] = { total: 0, wins: 0, pnl: 0, winRate: 0 };
    bySetup[t.setup].total++;
    bySetup[t.setup].pnl += t.pnl;
    if (t.pnl > 0) bySetup[t.setup].wins++;
  });
  Object.values(bySetup).forEach(s => { s.winRate = s.total ? (s.wins / s.total) * 100 : 0; });
  const bestSetup = Object.entries(bySetup).filter(([, v]) => v.total >= 2).sort(([, a], [, b]) => b.pnl - a.pnl)[0];
  return {
    totalPnl, winRate, totalTrades: trades.length, wins: wins.length, losses: losses.length,
    avgWin, avgLoss, profitFactor, ruleScore, streak, streakType,
    bestDay, worstDay, tradingDays, winDays, bySetup,
    bestSetup: bestSetup ? { name: bestSetup[0], ...bestSetup[1] } : null,
  };
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
      return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Math.round(cum) };
    });
}

export function fmtPnl(val) {
  const abs = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return val >= 0 ? `+$${abs}` : `-$${abs}`;
}

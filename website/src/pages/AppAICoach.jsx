import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTrades, fmtPnl } from '../hooks/useTrades';

const G = '#00ff41';
const R = '#ff2d2d';
const API = (import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com') + '/api';

const PRE_SUGGESTIONS = [
  "What should I focus on today?",
  "Help me set my intentions for the session",
  "Review my risk parameters before I start",
  "I'm feeling anxious — help me get in the right mindset",
];
const POST_SUGGESTIONS = [
  "Review my trades from today",
  "Did I follow my plan today?",
  "What patterns do you see in my performance?",
  "Help me identify emotional mistakes",
];

function getSessionDate() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(8, 0, 0, 0);
  const d = now < cutoff ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function detectPeriod() {
  try {
    const estStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const est = new Date(estStr);
    const totalMins = est.getHours() * 60 + est.getMinutes();
    return totalMins < 9 * 60 + 30 ? 'pre_market' : 'post_market';
  } catch { return 'pre_market'; }
}

function calcStats(trades) {
  if (!trades.length) return { totalPnl: 0, winRate: 0, ruleScore: 0 };
  const wins = trades.filter(t => t.pnl > 0).length;
  const followed = trades.filter(t => t.followedPlan).length;
  return {
    totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
    winRate: (wins / trades.length) * 100,
    ruleScore: (followed / trades.length) * 100,
  };
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function call(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${endpoint}`, { ...options, headers }).then(r => r.json().then(d => { if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d; }));
}

const EMPTY_PERIOD_DATA = () => ({ sessions: [{ number: 1, messages: [] }], currentNumber: 1 });

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: G, animation: `coachBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      <style>{`@keyframes coachBounce{0%,80%,100%{transform:scale(0.7);opacity:.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function CtxItem({ label, value, positive }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: `${G}80` }}>{label}: </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: positive === undefined ? 'rgba(255,255,255,0.85)' : positive ? G : R }}>{value}</span>
    </div>
  );
}

export default function AppAICoach() {
  const { token } = useAuth();
  const { trades } = useTrades();
  const [period, setPeriod] = useState(() => detectPeriod());
  const [allSessions, setAllSessions] = useState({ pre_market: EMPTY_PERIOD_DATA(), post_market: EMPTY_PERIOD_DATA() });
  const [periodLoading, setPeriodLoading] = useState({ pre_market: true, post_market: true });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const [sessionDate] = useState(() => getSessionDate());
  const today = todayStr();
  const todayTrades = trades.filter(t => t.date === today);
  const todayStats = calcStats(todayTrades);
  const allStats = calcStats(trades);
  const periodData = allSessions[period];
  const sessions = periodData.sessions;
  const currentSessionNumber = periodData.currentNumber;
  const messages = sessions.find(s => s.number === currentSessionNumber)?.messages || [];
  const sessionLoading = periodLoading[period];

  useEffect(() => {
    if (!token) { setPeriodLoading({ pre_market: false, post_market: false }); return; }
    const loadPeriod = async (p) => {
      try {
        const data = await call(`/coach/sessions/${sessionDate}?period=${p}`, {}, token);
        if (Array.isArray(data) && data.length > 0) {
          const loaded = data.map(s => ({ number: s.session_number, messages: s.messages }));
          setAllSessions(prev => ({ ...prev, [p]: { sessions: loaded, currentNumber: loaded[loaded.length - 1].number } }));
        }
      } catch {}
      finally { setPeriodLoading(prev => ({ ...prev, [p]: false })); }
    };
    loadPeriod('pre_market');
    loadPeriod('post_market');
  }, [token, sessionDate]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setInput(''); setError(null); }, [period]);

  const buildContext = () => {
    const parts = [
      `Today's trades: ${todayTrades.length}`,
      `Today's P&L: ${fmtPnl(todayStats.totalPnl)}`,
      `All-time win rate: ${Math.round(allStats.winRate)}%`,
      `Rule following score: ${Math.round(allStats.ruleScore)}%`,
    ];
    if (todayTrades.length > 0) {
      parts.push(`Today's trade details: ${todayTrades.map(t => `${t.symbol} ${t.setup} ${fmtPnl(t.pnl)} (followed plan: ${t.followedPlan}, emotion before: ${t.emotionBefore})`).join('; ')}`);
    }
    return parts.join('. ');
  };

  const updateCurrentSession = (updater) => {
    setAllSessions(prev => ({ ...prev, [period]: { ...prev[period], sessions: prev[period].sessions.map(s => s.number === currentSessionNumber ? { ...s, messages: updater(s.messages) } : s) } }));
  };

  const setCurrentSessionNumber = (n) => {
    setAllSessions(prev => ({ ...prev, [period]: { ...prev[period], currentNumber: n } }));
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput(''); setError(null);
    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    updateCurrentSession(() => newMessages);
    setLoading(true);
    call('/coach/session', { method: 'POST', body: JSON.stringify({ date: sessionDate, role: 'user', content: userText, session_number: currentSessionNumber, period }) }, token).catch(() => {});
    try {
      const data = await call('/chat', { method: 'POST', body: JSON.stringify({ messages: newMessages, period, context: buildContext() }) }, token);
      const assistantMsg = { role: 'assistant', content: data.content };
      updateCurrentSession(msgs => [...msgs, assistantMsg]);
      call('/coach/session', { method: 'POST', body: JSON.stringify({ date: sessionDate, role: 'assistant', content: data.content, session_number: currentSessionNumber, period }) }, token).catch(() => {});
    } catch (err) { setError(err.message); updateCurrentSession(msgs => msgs.slice(0, -1)); }
    finally { setLoading(false); }
  };

  const handleNewSession = () => {
    const nextNumber = sessions.length > 0 ? Math.max(...sessions.map(s => s.number)) + 1 : 1;
    setAllSessions(prev => ({ ...prev, [period]: { sessions: [...prev[period].sessions, { number: nextNumber, messages: [] }], currentNumber: nextNumber } }));
    setError(null);
  };

  const suggestions = period === 'pre_market' ? PRE_SUGGESTIONS : POST_SUGGESTIONS;
  const sessionLabel = (() => { const d = new Date(sessionDate + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); })();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>AI Coach</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Daily Coaching</h1>
            <p style={{ fontSize: 13, color: `${G}80`, marginTop: 2 }}>{sessionLabel}</p>
          </div>
          <button onClick={handleNewSession} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
            + New Session
          </button>
        </div>

        {/* Period Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
          {[['pre_market', 'Pre-Market'], ['post_market', 'Post-Market']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', background: period === val ? G : 'transparent', color: period === val ? '#000' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s', boxShadow: period === val ? `0 0 12px ${G}50` : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', textAlign: 'center', letterSpacing: '0.4px' }}>
          AI Coach provides performance coaching only — not financial advice.
        </p>

        {/* Session tabs */}
        {sessions.length > 1 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
            {sessions.map(s => (
              <button key={s.number} onClick={() => setCurrentSessionNumber(s.number)} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: currentSessionNumber === s.number ? `${G}18` : 'rgba(255,255,255,0.05)', color: currentSessionNumber === s.number ? G : 'rgba(255,255,255,0.35)', border: `1px solid ${currentSessionNumber === s.number ? `${G}40` : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}>
                Session {s.number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', borderRadius: 16, background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
          {sessionLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><TypingDots /></div>
          ) : messages.length === 0 ? (
            <div>
              {/* Context card */}
              <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: `${G}0a`, border: `1px solid ${G}20`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: G, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>Session Context</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  <CtxItem label="Today's trades" value={`${todayTrades.length}`} />
                  <CtxItem label="Today's P&L" value={fmtPnl(todayStats.totalPnl)} positive={todayStats.totalPnl >= 0} />
                  <CtxItem label="Win rate" value={`${Math.round(allStats.winRate)}%`} positive={allStats.winRate >= 50} />
                  <CtxItem label="Rule score" value={`${Math.round(allStats.ruleScore)}%`} positive={allStats.ruleScore >= 80} />
                </div>
              </motion.div>

              {/* Intro */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{period === 'pre_market' ? 'Pre-Market Check-In' : 'Post-Market Review'}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{period === 'pre_market' ? "Let's prepare for today's session. I know your plan inside out." : "Let's review how today went and what to take forward."}</p>
              </div>

              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {suggestions.map((s, i) => (
                  <motion.button key={`${period}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} onClick={() => sendMessage(s)}
                    style={{ textAlign: 'left', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'rgba(255,255,255,0.75)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 }}>
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : null}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={`${period}-${currentSessionNumber}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12, alignItems: 'flex-end', gap: 8 }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${G}18`, border: `1px solid ${G}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
                )}
                <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? `${G}18` : 'rgba(255,255,255,0.04)', color: msg.role === 'user' ? G : '#e0e0e0', fontSize: 14, lineHeight: 1.8, border: msg.role === 'user' ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.08)', fontWeight: msg.role === 'user' ? 600 : 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12, alignItems: 'flex-end', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${G}18`, border: `1px solid ${G}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
              <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}><TypingDots /></div>
            </div>
          )}

          {error && <div style={{ margin: '8px 0', padding: '10px 14px', background: `${R}15`, border: `1px solid ${R}40`, borderRadius: 10, fontSize: 13, color: R }}>Error: {error}</div>}
          <div ref={bottomRef} style={{ height: 8 }} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            value={input}
            rows={1}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={period === 'pre_market' ? 'Ask your coach before the session…' : 'Review your session with your coach…'}
            style={{ flex: 1, resize: 'none', minHeight: 42, maxHeight: 120, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none', overflowY: 'hidden', lineHeight: 1.5, fontFamily: 'inherit' }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{ width: 42, height: 42, borderRadius: 10, background: input.trim() && !loading ? G : 'rgba(255,255,255,0.07)', color: input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', boxShadow: input.trim() && !loading ? `0 0 16px ${G}50` : 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

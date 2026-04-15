import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calcStats, fmtPnl, todayStr } from '../hooks/useTrades';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const G = '#00ff41';
const R = '#ff2d2d';

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

// Returns the trading-day date: if before 8AM use yesterday, otherwise today
function getSessionDate() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(8, 0, 0, 0);
  const d = now < cutoff ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Auto-detect period based on current time in EST:
// before 9:30 AM → pre_market, otherwise → post_market
function detectPeriod() {
  try {
    const estStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const est = new Date(estStr);
    const totalMins = est.getHours() * 60 + est.getMinutes();
    return totalMins < 9 * 60 + 30 ? 'pre_market' : 'post_market';
  } catch {
    return 'pre_market';
  }
}

const EMPTY_PERIOD_DATA = () => ({ sessions: [{ number: 1, messages: [] }], currentNumber: 1 });

export default function AICoach({ trades }) {
  const { token } = useAuth();

  // 'pre_market' | 'post_market' — drives both the toggle UI and data isolation
  const [period, setPeriod] = useState(() => detectPeriod());

  // All sessions data keyed by period — loaded on mount for both periods
  const [allSessions, setAllSessions] = useState({
    pre_market:  EMPTY_PERIOD_DATA(),
    post_market: EMPTY_PERIOD_DATA(),
  });
  const [periodLoading, setPeriodLoading] = useState({ pre_market: true, post_market: true });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Stable session date for today (8AM cutoff), computed once on mount
  const [sessionDate] = useState(() => getSessionDate());

  const today = todayStr();
  const todayTrades = trades.filter(t => t.date === today);
  const todayStats  = calcStats(todayTrades);
  const allStats    = calcStats(trades);

  // Derived from active period
  const periodData      = allSessions[period];
  const sessions        = periodData.sessions;
  const currentSessionNumber = periodData.currentNumber;
  const messages        = sessions.find(s => s.number === currentSessionNumber)?.messages || [];
  const sessionLoading  = periodLoading[period];

  // Load both periods on mount
  useEffect(() => {
    if (!token) {
      setPeriodLoading({ pre_market: false, post_market: false });
      return;
    }
    const loadPeriod = async (p) => {
      try {
        const data = await api.getCoachSessions(token, sessionDate, p);
        if (Array.isArray(data) && data.length > 0) {
          const loaded = data.map(s => ({ number: s.session_number, messages: s.messages }));
          setAllSessions(prev => ({
            ...prev,
            [p]: { sessions: loaded, currentNumber: loaded[loaded.length - 1].number },
          }));
        }
        // else keep EMPTY_PERIOD_DATA defaults
      } catch {
        // keep defaults
      } finally {
        setPeriodLoading(prev => ({ ...prev, [p]: false }));
      }
    };
    loadPeriod('pre_market');
    loadPeriod('post_market');
  }, [token, sessionDate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear input and error when switching periods
  useEffect(() => {
    setInput('');
    setError(null);
  }, [period]);

  const buildContext = () => {
    const parts = [
      `Today's trades: ${todayTrades.length}`,
      `Today's P&L: ${fmtPnl(todayStats.totalPnl)}`,
      `All-time win rate: ${Math.round(allStats.winRate)}%`,
      `Rule following score: ${Math.round(allStats.ruleScore)}%`,
    ];
    if (todayTrades.length > 0) {
      const tradeList = todayTrades.map(t =>
        `${t.symbol} ${t.setup} ${fmtPnl(t.pnl)} (followed plan: ${t.followedPlan}, emotion before: ${t.emotionBefore})`
      ).join('; ');
      parts.push(`Today's trade details: ${tradeList}`);
    }
    return parts.join('. ');
  };

  const updateCurrentSession = (updater) => {
    setAllSessions(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        sessions: prev[period].sessions.map(s =>
          s.number === currentSessionNumber ? { ...s, messages: updater(s.messages) } : s
        ),
      },
    }));
  };

  const setCurrentSessionNumber = (n) => {
    setAllSessions(prev => ({ ...prev, [period]: { ...prev[period], currentNumber: n } }));
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    updateCurrentSession(() => newMessages);
    setLoading(true);

    api.saveCoachMessage(token, sessionDate, 'user', userText, currentSessionNumber, period).catch(() => {});

    try {
      const data = await api.chat(token, newMessages, period, buildContext());
      const assistantMsg = { role: 'assistant', content: data.content };
      updateCurrentSession(msgs => [...msgs, assistantMsg]);
      api.saveCoachMessage(token, sessionDate, 'assistant', data.content, currentSessionNumber, period).catch(() => {});
    } catch (err) {
      setError(err.message);
      updateCurrentSession(msgs => msgs.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Creates a new session tab under the current period — DB messages persist
  const handleNewSession = () => {
    const nextNumber = sessions.length > 0
      ? Math.max(...sessions.map(s => s.number)) + 1
      : 1;
    setAllSessions(prev => ({
      ...prev,
      [period]: {
        sessions: [...prev[period].sessions, { number: nextNumber, messages: [] }],
        currentNumber: nextNumber,
      },
    }));
    setError(null);
  };

  const suggestions = period === 'pre_market' ? PRE_SUGGESTIONS : POST_SUGGESTIONS;

  // Format session date for display
  const sessionLabel = (() => {
    const d = new Date(sessionDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#080c08' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 44, fontWeight: 900, color: G,
            letterSpacing: 3, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          }}
        >
          AI COACH
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
              AI Coach
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
              Powered by Claude · <span style={{ color: `${G}80` }}>{sessionLabel}</span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleNewSession}
            style={{
              fontSize: 12, color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'Barlow',
            }}
          >
            + New Session
          </motion.button>
        </div>

        {/* Period Toggle — Pre-Market / Post-Market */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10, padding: 3, marginTop: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 10,
        }}>
          {[['pre_market', 'Pre-Market'], ['post_market', 'Post-Market']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.5px', textTransform: 'uppercase',
                background: period === val ? G : 'transparent',
                color: period === val ? '#000' : 'rgba(255,255,255,0.4)',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                boxShadow: period === val ? `0 0 12px ${G}50` : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.4px', lineHeight: 1.5,
          paddingBottom: 8, textAlign: 'center',
        }}>
          AI Coach provides performance coaching only — not financial advice.
        </div>
      </div>

      {/* Session Tabs — only shown when current period has 2+ sessions */}
      {sessions.length > 1 && (
        <div style={{ display: 'flex', gap: 5, padding: '0 16px 8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {sessions.map(s => (
            <button
              key={s.number}
              onClick={() => setCurrentSessionNumber(s.number)}
              style={{
                padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: currentSessionNumber === s.number ? `${G}18` : 'rgba(255,255,255,0.05)',
                color: currentSessionNumber === s.number ? G : 'rgba(255,255,255,0.35)',
                border: `1px solid ${currentSessionNumber === s.number ? `${G}40` : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', fontFamily: 'Barlow',
              }}
            >
              Session {s.number}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
        {sessionLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <TypingDots />
          </div>
        ) : messages.length === 0 ? (
          <div>
            {/* Context card */}
            <motion.div
              key={period}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: `${G}0a`, border: `1px solid ${G}20`,
                borderRadius: 12, padding: '12px 14px', marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 11, color: G, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>
                Session Context
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                <CtxItem label="Today's trades" value={`${todayTrades.length}`} />
                <CtxItem label="Today's P&L" value={fmtPnl(todayStats.totalPnl)} positive={todayStats.totalPnl >= 0} />
                <CtxItem label="Win rate" value={`${Math.round(allStats.winRate)}%`} positive={allStats.winRate >= 50} />
                <CtxItem label="Rule score" value={`${Math.round(allStats.ruleScore)}%`} positive={allStats.ruleScore >= 80} />
              </div>
            </motion.div>

            {/* Intro */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 32, marginBottom: 8 }}
              >
                ⚡
              </motion.div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#fff' }}>
                {period === 'pre_market' ? 'Pre-Market Check-In' : 'Post-Market Review'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {period === 'pre_market'
                  ? "Let's prepare for today's session. I know your plan inside out."
                  : "Let's review how today went and what to take forward."}
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {suggestions.map((s, i) => (
                <motion.button
                  key={`${period}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  whileHover={{ borderColor: `${G}50`, background: `${G}08` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(s)}
                  style={{
                    textAlign: 'left', padding: '11px 14px',
                    background: '#111811',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, color: 'rgba(255,255,255,0.75)',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow',
                    transition: 'border-color 0.15s, background 0.15s',
                    lineHeight: 1.4,
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={`${period}-${currentSessionNumber}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: `${G}18`,
                  border: `1px solid ${G}30`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, flexShrink: 0,
                }}>
                  ⚡
                </div>
              )}
              <div style={{
                maxWidth: '82%', padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? `${G}22` : '#111811',
                color: msg.role === 'user' ? G : '#e0e0e0',
                fontSize: 15, lineHeight: 1.8,
                fontFamily: "'Barlow', sans-serif",
                border: msg.role === 'user' ? `1px solid ${G}40` : '1px solid rgba(255,255,255,0.1)',
                fontWeight: msg.role === 'user' ? 600 : 400,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10, alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: `${G}18`,
              border: `1px solid ${G}30`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, flexShrink: 0,
            }}>
              ⚡
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
              background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            margin: '8px 0', padding: '10px 14px',
            background: `${R}15`, border: `1px solid ${R}40`,
            borderRadius: 10, fontSize: 13, color: R,
          }}>
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: '#0a120a',
        display: 'flex', gap: 8, alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={period === 'pre_market' ? 'Ask your coach before the session…' : 'Review your session with your coach…'}
          rows={1}
          style={{
            flex: 1, resize: 'none', minHeight: 42, maxHeight: 120,
            background: '#111811',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '10px 12px',
            fontSize: 14, color: '#fff', fontFamily: 'Barlow',
            outline: 'none', overflowY: 'hidden', lineHeight: 1.5,
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 42, height: 42, borderRadius: 10,
            background: input.trim() && !loading ? G : 'rgba(255,255,255,0.07)',
            color: input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            border: 'none',
            boxShadow: input.trim() && !loading ? `0 0 16px ${G}50` : 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

function CtxItem({ label, value, positive }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: `${G}80` }}>{label}: </span>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: positive === undefined ? 'rgba(255,255,255,0.85)' : positive ? G : R,
      }}>
        {value}
      </span>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: G,
            animation: `coachBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes coachBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

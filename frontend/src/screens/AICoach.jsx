import React, { useState, useRef, useEffect } from 'react';
import { calcStats, fmtPnl, todayStr } from '../hooks/useTrades';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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

export default function AICoach({ trades }) {
  const { token } = useAuth();
  const [mode, setMode] = useState('premarket');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const today = todayStr();
  const todayTrades = trades.filter(t => t.date === today);
  const todayStats = calcStats(todayTrades);
  const allStats = calcStats(trades);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const parts = [
      `Today's trades: ${todayTrades.length}/3`,
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

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const data = await api.chat(token, newMessages, mode, buildContext());
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => prev.slice(0, -1));
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

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const suggestions = mode === 'premarket' ? PRE_SUGGESTIONS : POST_SUGGESTIONS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="screen-title">AI Coach</div>
            <div className="screen-subtitle">Powered by Claude</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                fontFamily: 'Barlow',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--card)',
          borderRadius: 10,
          padding: 3,
          marginTop: 12,
          border: '1px solid var(--border)',
        }}>
          {[['premarket', 'Pre-Market'], ['postmarket', 'Post-Market']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setMode(val); clearChat(); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                background: mode === val ? 'var(--green)' : 'transparent',
                color: mode === val ? '#000' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <div>
            {/* Context card */}
            <div className="card" style={{
              marginBottom: 16,
              background: 'var(--green-dim)',
              border: '1px solid rgba(0,240,122,0.15)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>
                Session Context
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                <CtxItem label="Today's trades" value={`${todayTrades.length}/3`} />
                <CtxItem label="Today's P&L" value={fmtPnl(todayStats.totalPnl)} positive={todayStats.totalPnl >= 0} />
                <CtxItem label="Win rate" value={`${Math.round(allStats.winRate)}%`} positive={allStats.winRate >= 50} />
                <CtxItem label="Rule score" value={`${Math.round(allStats.ruleScore)}%`} positive={allStats.ruleScore >= 80} />
              </div>
            </div>

            {/* Intro text */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{mode === 'premarket' ? '🌅' : '📊'}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                {mode === 'premarket' ? 'Pre-Market Check-In' : 'Post-Market Review'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {mode === 'premarket'
                  ? "Let's prepare for today's session. I know your plan inside out."
                  : "Let's review how today went and what to take forward."}
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'Barlow',
                    transition: 'border-color 0.15s, background 0.15s',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'var(--green-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--green)' : 'var(--card)',
              color: msg.role === 'user' ? '#000' : 'var(--text)',
              fontSize: 14,
              lineHeight: 1.6,
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontWeight: msg.role === 'user' ? 600 : 400,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px 16px 16px 4px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            margin: '8px 0',
            padding: '10px 14px',
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--red)',
          }}>
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
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
          placeholder="Ask your coach…"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            minHeight: 42,
            maxHeight: 120,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 14,
            color: 'var(--text)',
            fontFamily: 'Barlow',
            outline: 'none',
            overflowY: 'auto',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: input.trim() && !loading ? 'var(--green)' : 'var(--border)',
            color: input.trim() && !loading ? '#000' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            fontFamily: 'Barlow',
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function CtxItem({ label, value, positive }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'rgba(0,240,122,0.6)' }}>{label}: </span>
      <span style={{
        fontSize: 12,
        fontWeight: 700,
        color: positive === undefined ? 'var(--text)' : positive ? 'var(--green)' : 'var(--red)',
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
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--text-secondary)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const G = '#00ff41';
const GOLD = '#f0a500';
const PLAN_MARKER = '=== YOUR TRADING PLAN ===';

// ── Plan renderer ──────────────────────────────────────────────────────────────
function PlanRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let key = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { elements.push(<div key={key++} style={{ height: 10 }} />); continue; }

    // Section header: **SECTION NAME**
    const headerMatch = line.match(/^\*\*(.+)\*\*$/);
    if (headerMatch) {
      elements.push(
        <div key={key++} style={{
          fontSize: 13, fontWeight: 800, color: GOLD,
          letterSpacing: '1px', textTransform: 'uppercase',
          marginTop: 18, marginBottom: 6,
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {headerMatch[1]}
        </div>
      );
      continue;
    }

    // Numbered rule: 1. text
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
          <span style={{
            minWidth: 22, height: 22, borderRadius: 6,
            background: `${GOLD}20`, border: `1px solid ${GOLD}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: GOLD, flexShrink: 0, marginTop: 1,
          }}>
            {numMatch[1]}
          </span>
          <span style={{ fontSize: 14, color: '#ddd', lineHeight: 1.6, fontFamily: 'Barlow' }}>
            {numMatch[2]}
          </span>
        </div>
      );
      continue;
    }

    // Bullet: - text
    const bulletMatch = line.match(/^[-•]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start', paddingLeft: 4 }}>
          <span style={{ color: `${GOLD}80`, fontSize: 12, marginTop: 3, flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontFamily: 'Barlow' }}>
            {bulletMatch[1]}
          </span>
        </div>
      );
      continue;
    }

    // Plain text
    elements.push(
      <div key={key++} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: 'Barlow', marginBottom: 4 }}>
        {line}
      </div>
    );
  }

  return <div>{elements}</div>;
}

// ── Typing dots ────────────────────────────────────────────────────────────────
function PlanTypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: GOLD,
          animation: `planBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes planBounce { 0%,80%,100%{transform:scale(0.7);opacity:.35} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

// ── Pencil icon ────────────────────────────────────────────────────────────────
function PencilIcon({ size = 16, color = G }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TradingPlan() {
  const { token } = useAuth();

  // view: 'loading' | 'empty' | 'chat' | 'plan'
  const [view, setView] = useState('loading');
  const [messages, setMessages] = useState([]);
  const [savedPlan, setSavedPlan] = useState(null);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Load history + saved plan on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [msgsData, planData] = await Promise.all([
          api.getTradingPlanMessages(token),
          api.getTradingPlan(token),
        ]);

        if (planData?.plan_content) {
          setSavedPlan(planData.plan_content);
          setView('plan');
          return;
        }

        if (Array.isArray(msgsData) && msgsData.length > 0) {
          setMessages(msgsData);
          setView('chat');
        } else {
          setView('empty');
        }
      } catch {
        setView('empty');
      }
    })();
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startBuilding = async () => {
    setView('chat');
    const greeting = {
      role: 'assistant',
      content: "Hey, I'm your trading plan coach. I'm going to help you build a complete, custom trading plan based entirely on your own strategy — no templates.\n\nLet's start from the beginning: describe your trading strategy in your own words. What does a typical trade look like for you?",
    };
    setMessages([greeting]);
    try {
      await api.saveTradingPlanMessage(token, greeting.role, greeting.content);
    } catch { /* non-fatal */ }
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || aiLoading) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', content: userText };
    const next = [...messages, userMsg];
    setMessages(next);
    setAiLoading(true);

    try {
      await api.saveTradingPlanMessage(token, 'user', userText);
    } catch { /* non-fatal */ }

    try {
      const data = await api.planChat(token, next);
      const assistantMsg = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);

      try {
        await api.saveTradingPlanMessage(token, 'assistant', data.content);
      } catch { /* non-fatal */ }

      // Detect completed plan
      if (data.content.includes(PLAN_MARKER)) {
        const planContent = data.content.split(PLAN_MARKER).slice(1).join(PLAN_MARKER).trim();
        try {
          await api.saveTradingPlan(token, planContent);
          setSavedPlan(planContent);
          // Brief delay so user sees the final message before switching views
          setTimeout(() => setView('plan'), 1800);
        } catch { /* non-fatal */ }
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditRules = async () => {
    setView('chat');
    const editMsg = {
      role: 'assistant',
      content: "Let's update your plan. What would you like to change? You can tell me to add rules, remove rules, adjust your risk parameters, or update any section of your plan.",
    };
    setMessages(prev => [...prev, editMsg]);
    try {
      await api.saveTradingPlanMessage(token, editMsg.role, editMsg.content);
    } catch { /* non-fatal */ }
  };

  // ── Render: loading ──────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div style={{ background: '#080c08', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PlanTypingDots />
      </div>
    );
  }

  return (
    <div style={{ background: '#080c08', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 40, fontWeight: 900, color: GOLD,
            letterSpacing: 3, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          }}
        >
          TRADING PLAN
        </motion.div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
              Trading Plan
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
              Your rules. Your edge.
            </div>
          </div>
          {view === 'plan' && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleEditRules}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${G}60`,
                color: G, fontSize: 13, fontWeight: 700,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.5px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <PencilIcon size={13} color={G} />
              EDIT RULES
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Empty state ── */}
        {view === 'empty' && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 60px' }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 48, marginBottom: 20 }}
            >
              📋
            </motion.div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 }}>
              No Trading Plan Yet
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, textAlign: 'center', marginBottom: 28, maxWidth: 280 }}>
              Your AI coach will interview you about your strategy and build a custom plan tailored to how you trade.
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startBuilding}
              style={{
                padding: '12px 28px', borderRadius: 10,
                background: GOLD, color: '#000',
                fontSize: 15, fontWeight: 800,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '1px', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer',
                boxShadow: `0 0 20px ${GOLD}50`,
              }}
            >
              Start Building
            </motion.button>
          </motion.div>
        )}

        {/* ── Chat view ── */}
        {view === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px 16px', minHeight: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI Plan Builder
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}44` }}>
                  PRO
                </span>
                {savedPlan && (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setView('plan')}
                    style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, padding: '4px 9px',
                      cursor: 'pointer', fontFamily: 'Barlow',
                    }}
                  >
                    View Plan
                  </motion.button>
                )}
              </div>
            </div>

            <div style={{ background: '#111811', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', scrollbarWidth: 'none', minHeight: 0 }}>
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}
                    >
                      <div style={{
                        maxWidth: '88%',
                        padding: '14px 18px',
                        borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: m.role === 'user' ? GOLD : '#0d1a0d',
                        color: m.role === 'user' ? '#000' : '#e0e0e0',
                        fontSize: 15, lineHeight: 1.8,
                        fontWeight: m.role === 'user' ? 600 : 400,
                        fontFamily: "'Barlow', sans-serif",
                        border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {aiLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                    <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#0d1a0d', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <PlanTypingDots />
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ fontSize: 12, color: '#ff2d2d', marginBottom: 10 }}>{error}</div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Describe your strategy, answer questions…"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '8px 11px', fontSize: 13, color: '#fff',
                    fontFamily: 'Barlow', outline: 'none',
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || aiLoading}
                  style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0, border: 'none',
                    background: input.trim() && !aiLoading ? GOLD : 'rgba(255,255,255,0.08)',
                    color: input.trim() && !aiLoading ? '#000' : 'rgba(255,255,255,0.25)',
                    cursor: input.trim() && !aiLoading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Plan view ── */}
        {view === 'plan' && savedPlan && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px', scrollbarWidth: 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Your Trading Plan
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}44` }}>
                PRO
              </span>
            </div>

            <div style={{
              background: '#111811',
              border: `1px solid ${GOLD}20`,
              borderRadius: 12,
              padding: '18px 16px',
            }}>
              <PlanRenderer content={savedPlan} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

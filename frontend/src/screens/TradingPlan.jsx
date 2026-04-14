import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const G = '#00ff41';
const GOLD = '#f0a500';

export default function TradingPlan() {
  const { token } = useAuth();
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput]       = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState('');
  const bottomRef = useRef(null);

  // Kick off the interview with a greeting on first load
  useEffect(() => {
    if (token && aiMessages.length === 0) {
      setAiMessages([{
        role: 'assistant',
        content: "Hey, I'm your trading plan coach. I'm going to help you build a complete, custom trading plan based entirely on your own strategy — no templates.\n\nLet's start from the beginning: describe your trading strategy in your own words. What does a typical trade look like for you?",
      }]);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  const sendAiMessage = async (text) => {
    const userText = (text || aiInput).trim();
    if (!userText || aiLoading) return;
    setAiInput('');
    setAiError('');
    const userMsg = { role: 'user', content: userText };
    const next = [...aiMessages, userMsg];
    setAiMessages(next);
    setAiLoading(true);
    try {
      const data = await api.planChat(token, next);
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      setAiError(err.message);
      setAiMessages(prev => prev.slice(0, -1));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ background: '#080c08', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', position: 'relative', overflow: 'hidden' }}>
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
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
          Trading Plan
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
          Your rules. Your edge.
        </div>
      </div>

      {/* AI Plan Builder */}
      <div style={{ padding: '0 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            AI Plan Builder
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}44` }}>
            PRO
          </span>
        </div>

        <div style={{ background: '#111811', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 0', maxHeight: 400, overflowY: 'auto', scrollbarWidth: 'none' }}>
            <AnimatePresence>
              {aiMessages.map((m, i) => (
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

            {aiError && (
              <div style={{ fontSize: 12, color: '#ff2d2d', marginBottom: 10 }}>{aiError}</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
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
              onClick={() => sendAiMessage()}
              disabled={!aiInput.trim() || aiLoading}
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0, border: 'none',
                background: aiInput.trim() && !aiLoading ? GOLD : 'rgba(255,255,255,0.08)',
                color: aiInput.trim() && !aiLoading ? '#000' : 'rgba(255,255,255,0.25)',
                cursor: aiInput.trim() && !aiLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
}

function PlanTypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: GOLD,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.35; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

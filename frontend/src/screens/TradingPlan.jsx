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
          <div style={{ padding: '14px 14px 0', maxHeight: 340, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {aiMessages.length === 0 && (
              <div style={{ paddingBottom: 14 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>
                  Build and refine your trading plan with AI. Ask about setups, risk frameworks, or psychology rules.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    'Help me define entry criteria for a breakout setup',
                    'What risk rules should I add to my plan?',
                    'How do I build a pre-market routine?',
                  ].map((s, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ borderColor: `${GOLD}60`, background: `${GOLD}0a` }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => sendAiMessage(s)}
                      style={{
                        textAlign: 'left', padding: '10px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, color: 'rgba(255,255,255,0.75)',
                        fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow', lineHeight: 1.4,
                        transition: 'all 0.15s',
                      }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {aiMessages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}
                >
                  <div style={{
                    maxWidth: '85%', padding: '9px 12px',
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.role === 'user' ? GOLD : '#0d1a0d',
                    color: m.role === 'user' ? '#000' : 'rgba(255,255,255,0.85)',
                    fontSize: 13, lineHeight: 1.55, fontWeight: m.role === 'user' ? 600 : 400,
                    border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
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
              placeholder="Ask about your trading plan…"
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

        {/* Empty state */}
        {aiMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ textAlign: 'center', padding: '40px 32px 20px' }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
              background: `${GOLD}12`, border: `1px solid ${GOLD}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#fff' }}>
              Your plan is a blank canvas
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
              Use the AI Plan Builder above to define your setups, risk rules, and trading psychology — or build it manually.
            </div>
          </motion.div>
        )}
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

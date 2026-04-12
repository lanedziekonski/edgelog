import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
    <div>
      <div className="screen-header">
        <div className="screen-title">Trading Plan</div>
        <div className="screen-subtitle">Your rules. Your edge.</div>
      </div>

      {/* AI Plan Builder */}
      <div className="section" style={{ paddingTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>AI Plan Builder</div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f0a50022', color: '#f0a500', border: '1px solid #f0a50044' }}>PRO</span>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 0', maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {aiMessages.length === 0 && (
              <div style={{ paddingBottom: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                  Build and refine your trading plan with AI. Ask about setups, risk frameworks, or psychology rules.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Help me define entry criteria for a breakout setup',
                    'What risk rules should I add to my plan?',
                    'How do I build a pre-market routine?',
                  ].map((s, i) => (
                    <button key={i} onClick={() => sendAiMessage(s)} style={{
                      textAlign: 'left', padding: '9px 12px', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
                      fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow', lineHeight: 1.4,
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {aiMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 12px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? '#f0a500' : 'var(--surface)',
                  color: m.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: 13, lineHeight: 1.55, fontWeight: m.role === 'user' ? 600 : 400,
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 18, letterSpacing: 4, color: 'var(--text-secondary)' }}>···</span>
                </div>
              </div>
            )}
            {aiError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{aiError}</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface)' }}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
              placeholder="Ask about your trading plan…"
              style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: 'var(--text)', fontFamily: 'Barlow', outline: 'none' }}
            />
            <button
              onClick={() => sendAiMessage()}
              disabled={!aiInput.trim() || aiLoading}
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0, border: 'none',
                background: aiInput.trim() && !aiLoading ? '#f0a500' : 'var(--border)',
                color: aiInput.trim() && !aiLoading ? '#000' : 'var(--text-muted)',
                cursor: aiInput.trim() && !aiLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Empty state — shown until user builds their plan via AI */}
      {aiMessages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 32px 60px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: '#f0a50015', border: '1px solid #f0a50030',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Your plan is a blank canvas
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
            Use the AI Plan Builder above to define your setups, risk rules, and trading psychology — or build it manually.
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const G  = '#00ff41';
const R  = '#ff2d2d';
const BG = '#080c08';

const PLAN_MARKER = '=== YOUR TRADING PLAN ===';

// ── Plan detection ─────────────────────────────────────────────────────────────
function detectPlan(text) {
  if (text.includes(PLAN_MARKER)) return true;
  if (text.length < 400) return false;
  const lower = text.toLowerCase();
  const hasKeywords = lower.includes('plan') || lower.includes('rules') ||
    lower.includes('strategy') || lower.includes('risk') || lower.includes('setup');
  const numberedRules  = (text.match(/^\d+\./gm)   || []).length >= 3;
  const bulletRules    = (text.match(/^[-•›]/gm)   || []).length >= 3;
  const sectionHeaders = (text.match(/^\*\*/gm)    || []).length >= 2;
  return hasKeywords && (numberedRules || bulletRules || sectionHeaders);
}

function extractPlan(text) {
  if (text.includes(PLAN_MARKER)) {
    return text.split(PLAN_MARKER).slice(1).join(PLAN_MARKER).trim();
  }
  return text.trim();
}

// ── Plan renderer ──────────────────────────────────────────────────────────────
function PlanRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let key = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { elements.push(<div key={key++} style={{ height: 8 }} />); continue; }

    const headerMatch = line.match(/^\*\*(.+)\*\*$/) || line.match(/^#{1,3}\s+(.+)$/);
    if (headerMatch) {
      elements.push(
        <div key={key++} style={{
          fontSize: 12, fontWeight: 800, color: G,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          marginTop: 20, marginBottom: 8,
          fontFamily: "'Barlow Condensed', sans-serif",
          borderBottom: `1px solid ${G}20`, paddingBottom: 5,
        }}>
          {headerMatch[1]}
        </div>
      );
      continue;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
          <span style={{
            minWidth: 22, height: 22, borderRadius: 6,
            background: `${G}18`, border: `1px solid ${G}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: G, flexShrink: 0, marginTop: 2,
          }}>
            {numMatch[1]}
          </span>
          <span style={{ fontSize: 15, color: '#e8e8e8', lineHeight: 1.8, fontFamily: "'Barlow', sans-serif" }}>
            {numMatch[2]}
          </span>
        </div>
      );
      continue;
    }

    const bulletMatch = line.match(/^[-•›]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start', paddingLeft: 4 }}>
          <span style={{ color: G, fontSize: 14, marginTop: 2, flexShrink: 0, fontWeight: 700 }}>›</span>
          <span style={{ fontSize: 15, color: '#e8e8e8', lineHeight: 1.8, fontFamily: "'Barlow', sans-serif" }}>
            {bulletMatch[1]}
          </span>
        </div>
      );
      continue;
    }

    if (line === PLAN_MARKER.trim()) continue;
    elements.push(
      <div key={key++} style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontFamily: "'Barlow', sans-serif", marginBottom: 4 }}>
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
          width: 6, height: 6, borderRadius: '50%', background: G,
          animation: `planBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes planBounce{0%,80%,100%{transform:scale(0.7);opacity:.35}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9000,
            background: toast.type === 'success' ? '#0d1a0d' : '#1a0d0d',
            border: `1px solid ${toast.type === 'success' ? G : R}60`,
            color: toast.type === 'success' ? G : R,
            padding: '10px 18px', borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.5px',
            boxShadow: `0 4px 20px ${toast.type === 'success' ? G : R}20`,
            whiteSpace: 'nowrap',
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Reset confirmation modal ───────────────────────────────────────────────────
function ResetModal({ onCancel, onConfirm }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1a0d', border: `1px solid ${R}40`,
          borderRadius: 16, padding: '24px 20px',
          maxWidth: 320, width: '100%',
        }}
      >
        <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 10 }}>
          Reset Trading Plan?
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, textAlign: 'center', marginBottom: 24, fontFamily: "'Barlow', sans-serif" }}>
          This will permanently delete your current rules and conversation history. You will need to build a new plan from scratch.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onCancel}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'transparent', border: `1px solid ${G}60`, color: G, fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px', cursor: 'pointer' }}>
            CANCEL
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: R, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px', cursor: 'pointer', boxShadow: `0 0 16px ${R}40` }}>
            YES, RESET
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TradingPlan() {
  const { token } = useAuth();

  const [view, setView]           = useState('loading');
  const [messages, setMessages]   = useState([]);
  const [savedPlan, setSavedPlan] = useState(null);
  const [input, setInput]         = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast]         = useState(null);
  const bottomRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Mount: load plan + history ──
  useEffect(() => {
    if (!token) return;
    (async () => {
      console.log('[TradingPlan] Checking for saved plan...');
      try {
        const [msgsData, planData] = await Promise.all([
          api.getTradingPlanMessages(token),
          api.getTradingPlan(token),
        ]);

        if (planData?.plan_content) {
          console.log('[TradingPlan] Saved plan found, going to plan view');
          setSavedPlan(planData.plan_content);
          setView('plan');
          return;
        }

        console.log('[TradingPlan] No saved plan found');
        if (Array.isArray(msgsData) && msgsData.length > 0) {
          console.log(`[TradingPlan] Loaded ${msgsData.length} messages from history`);
          setMessages(msgsData);
          setView('chat');
        } else {
          setView('empty');
        }
      } catch (err) {
        console.error('[TradingPlan] Mount load error:', err);
        setView('empty');
      }
    })();
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Save plan helper ──
  const savePlan = useCallback(async (content) => {
    setSaving(true);
    console.log('[TradingPlan] Saving plan, length:', content.length);
    try {
      const result = await api.saveTradingPlan(token, content);
      console.log('[TradingPlan] Plan saved OK:', result);
      const planContent = result?.plan_content || content;
      setSavedPlan(planContent);
      showToast('Plan saved ✓', 'success');
      setView('plan');
    } catch (err) {
      console.error('[TradingPlan] Save failed:', err);
      showToast('Failed to save plan — try again', 'error');
    } finally {
      setSaving(false);
    }
  }, [token, showToast]);

  // ── Start building ──
  const startBuilding = async () => {
    const greeting = {
      role: 'assistant',
      content: "Let's build your personalized trading plan. First, tell me about your trading strategy — what is your overall approach to the markets? For example, do you trade momentum, reversals, breakouts, scalping, swing trading, or something else? Describe how you like to trade in your own words.",
    };
    setMessages([greeting]);
    setView('chat');
    try { await api.saveTradingPlanMessage(token, greeting.role, greeting.content); } catch { /* non-fatal */ }
  };

  // ── Send message ──
  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || aiLoading) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', content: userText };
    const next = [...messages, userMsg];
    setMessages(next);
    setAiLoading(true);

    try { await api.saveTradingPlanMessage(token, 'user', userText); } catch { /* non-fatal */ }

    try {
      const data = await api.planChat(token, next);
      const assistantMsg = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);
      try { await api.saveTradingPlanMessage(token, 'assistant', data.content); } catch { /* non-fatal */ }

      // Auto-detect completed plan
      if (detectPlan(data.content)) {
        console.log('[TradingPlan] Plan detected in response, auto-saving...');
        const planContent = extractPlan(data.content);
        await savePlan(planContent);
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setAiLoading(false);
    }
  };

  // ── Edit rules ──
  const handleEditRules = async () => {
    if (messages.length === 0) {
      try {
        const msgsData = await api.getTradingPlanMessages(token);
        if (Array.isArray(msgsData)) setMessages(msgsData);
      } catch { /* non-fatal */ }
    }
    setView('chat');
    const editMsg = {
      role: 'assistant',
      content: savedPlan
        ? `The user wants to update their trading plan. Here is their current plan:\n\n${savedPlan}\n\nWhat would you like to change? You can add rules, remove rules, adjust risk parameters, or update any section.`
        : "Let's update your plan. What would you like to change?",
    };
    setMessages(prev => [...prev, editMsg]);
    try { await api.saveTradingPlanMessage(token, editMsg.role, editMsg.content); } catch { /* non-fatal */ }
  };

  // ── Reset ──
  const handleReset = async () => {
    setShowReset(false);
    try { await api.resetTradingPlan(token); } catch { /* non-fatal */ }
    setSavedPlan(null);
    setMessages([]);
    setView('empty');
  };

  // ── Loading ──
  if (view === 'loading') {
    return (
      <div style={{ background: BG, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PlanTypingDots />
      </div>
    );
  }

  // Which message (if any) should show the manual save button?
  // Show on the last assistant message if it's long enough and no plan saved yet
  const lastAssistantIdx = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);
  const lastAssistantMsg = lastAssistantIdx >= 0 ? messages[lastAssistantIdx] : null;
  const showSaveButton = !savedPlan &&
    !aiLoading &&
    lastAssistantMsg &&
    lastAssistantMsg.content.length > 400;

  return (
    <div style={{ background: BG, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 40, fontWeight: 900, color: G,
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <motion.button whileTap={{ scale: 0.93 }} onClick={handleEditRules}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: `1px solid ${G}60`, color: G, fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px', cursor: 'pointer' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                EDIT
              </motion.button>
              <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowReset(true)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'transparent', border: `1px solid ${R}60`, color: R, fontSize: 12, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px', cursor: 'pointer' }}>
                RESET
              </motion.button>
            </div>
          )}

          {view === 'chat' && savedPlan && (
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setView('plan')}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'Barlow' }}>
              View Plan
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Empty state ── */}
        {view === 'empty' && (
          <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 60px' }}>
            <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 52, marginBottom: 20 }}>
              📋
            </motion.div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 }}>
              Build Your Trading Plan
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, textAlign: 'center', marginBottom: 30, maxWidth: 280, fontFamily: "'Barlow', sans-serif" }}>
              Your AI coach will interview you about your strategy and create a personalized rulebook you can reference every session.
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={startBuilding}
              style={{ padding: '13px 32px', borderRadius: 12, background: G, color: '#000', fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none', cursor: 'pointer', boxShadow: `0 0 24px ${G}45` }}>
              Start Building
            </motion.button>
          </motion.div>
        )}

        {/* ── Chat view ── */}
        {view === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px 16px', minHeight: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
              AI Plan Builder
            </div>

            <div style={{ background: '#0d1a0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', scrollbarWidth: 'none', minHeight: 0 }}>
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                      style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '88%', padding: '12px 16px',
                          borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: m.role === 'user' ? `${G}22` : '#111811',
                          color: m.role === 'user' ? G : '#e0e0e0',
                          fontSize: 15, lineHeight: 1.8,
                          fontWeight: m.role === 'user' ? 600 : 400,
                          fontFamily: "'Barlow', sans-serif",
                          border: m.role === 'user' ? `1px solid ${G}40` : '1px solid rgba(255,255,255,0.1)',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {m.content}
                        </div>
                      </div>

                      {/* Manual save button — shown below the last assistant message if long enough */}
                      {m.role === 'assistant' && i === lastAssistantIdx && showSaveButton && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => savePlan(extractPlan(m.content))}
                            disabled={saving}
                            style={{
                              padding: '9px 16px', borderRadius: 8,
                              background: saving ? 'rgba(0,255,65,0.3)' : G,
                              color: '#000', border: 'none',
                              fontSize: 13, fontWeight: 800,
                              fontFamily: "'Barlow Condensed', sans-serif",
                              letterSpacing: '0.5px', cursor: saving ? 'default' : 'pointer',
                              boxShadow: `0 0 14px ${G}40`,
                            }}
                          >
                            {saving ? 'Saving…' : '✓ Save as My Trading Plan'}
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {aiLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                    <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#111811', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <PlanTypingDots />
                    </div>
                  </div>
                )}
                {error && <div style={{ fontSize: 12, color: R, marginBottom: 10 }}>{error}</div>}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                <textarea
                  value={input}
                  rows={1}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Describe your strategy, answer questions…"
                  style={{ flex: 1, resize: 'none', minHeight: 36, maxHeight: 120, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#fff', fontFamily: 'Barlow', outline: 'none', lineHeight: 1.5, overflowY: 'hidden' }}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage()} disabled={!input.trim() || aiLoading}
                  style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, border: 'none', background: input.trim() && !aiLoading ? G : 'rgba(255,255,255,0.08)', color: input.trim() && !aiLoading ? '#000' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !aiLoading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Plan view ── */}
        {view === 'plan' && savedPlan && (
          <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px', scrollbarWidth: 'none' }}>
            <div style={{ background: '#0d1a0d', border: `1px solid ${G}20`, borderRadius: 14, padding: '20px 18px' }}>
              <PlanRenderer content={savedPlan} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Reset modal */}
      <AnimatePresence>
        {showReset && <ResetModal onCancel={() => setShowReset(false)} onConfirm={handleReset} />}
      </AnimatePresence>

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}

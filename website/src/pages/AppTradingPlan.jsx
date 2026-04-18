import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const G = '#00ff41';
const R = '#ff2d2d';
const API = (import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com') + '/api';
const PLAN_MARKER = '=== YOUR TRADING PLAN ===';

function detectPlan(text) {
  if (text.includes(PLAN_MARKER)) return true;
  if (text.length < 400) return false;
  const lower = text.toLowerCase();
  const hasKeywords = lower.includes('plan') || lower.includes('rules') || lower.includes('strategy') || lower.includes('risk') || lower.includes('setup');
  const numberedRules = (text.match(/^\d+\./gm) || []).length >= 3;
  const bulletRules = (text.match(/^[-•›]/gm) || []).length >= 3;
  const sectionHeaders = (text.match(/^\*\*/gm) || []).length >= 2;
  return hasKeywords && (numberedRules || bulletRules || sectionHeaders);
}

function extractPlan(text) {
  if (text.includes(PLAN_MARKER)) return text.split(PLAN_MARKER).slice(1).join(PLAN_MARKER).trim();
  return text.trim();
}

function call(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${endpoint}`, { ...options, headers }).then(r => r.json().then(d => { if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d; }));
}

function renderLines(lines) {
  const elements = [];
  let key = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { elements.push(<div key={key++} style={{ height: 6 }} />); continue; }
    if (line === PLAN_MARKER.trim()) continue;
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(<div key={key++} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}><span style={{ minWidth: 22, height: 22, borderRadius: 6, background: `${G}18`, border: `1px solid ${G}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: G, flexShrink: 0, marginTop: 2 }}>{numMatch[1]}</span><span style={{ fontSize: 14, color: '#e0e0e0', lineHeight: 1.75 }}>{numMatch[2]}</span></div>);
      continue;
    }
    const bulletMatch = line.match(/^[-•›]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(<div key={key++} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start', paddingLeft: 2 }}><span style={{ color: G, fontSize: 13, marginTop: 3, flexShrink: 0, fontWeight: 700 }}>›</span><span style={{ fontSize: 14, color: '#e0e0e0', lineHeight: 1.75 }}>{bulletMatch[1]}</span></div>);
      continue;
    }
    const boldMatch = line.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      elements.push(<div key={key++} style={{ fontSize: 13, fontWeight: 800, color: G, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, marginTop: 10 }}>{boldMatch[1]}</div>);
      continue;
    }
    elements.push(<div key={key++} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 4 }}>{line}</div>);
  }
  return <>{elements}</>;
}

function parsePlanSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = { title: null, lines: [] };
  for (const raw of lines) {
    const line = raw.trim();
    const hm = line.match(/^\*\*(.+)\*\*$/) || line.match(/^#{1,3}\s+(.+)$/);
    if (hm) {
      if (current.title !== null || current.lines.some(l => l.trim())) sections.push(current);
      current = { title: hm[1], lines: [] };
    } else { current.lines.push(raw); }
  }
  if (current.title !== null || current.lines.some(l => l.trim())) sections.push(current);
  return sections;
}

function AccordionSection({ title, isOpen, onToggle, children }) {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 6, border: isOpen ? `1px solid ${G}28` : '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 12px 13px', background: isOpen ? 'rgba(0,255,65,0.06)' : 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', borderLeft: `3px solid ${isOpen ? G : 'transparent'}` }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: isOpen ? G : 'rgba(255,255,255,0.55)', textAlign: 'left' }}>{title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ fontSize: 10, color: isOpen ? G : 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 10 }}>▼</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 14px', background: 'rgba(0,255,65,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanRenderer({ content }) {
  const sections = parsePlanSections(content);
  const hasTitledSections = sections.some(s => s.title !== null);
  const [openSections, setOpenSections] = useState(() => new Set());
  const toggle = (idx) => setOpenSections(prev => { const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next; });
  if (!hasTitledSections) return <div>{renderLines(content.split('\n'))}</div>;
  return (
    <div>
      {sections.map((section, idx) => {
        if (section.title === null) {
          const introLines = section.lines.filter(l => l.trim() && l.trim() !== PLAN_MARKER.trim());
          if (!introLines.length) return null;
          return <div key={idx} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{renderLines(section.lines)}</div>;
        }
        return <AccordionSection key={idx} title={section.title} isOpen={openSections.has(idx)} onToggle={() => toggle(idx)}>{renderLines(section.lines)}</AccordionSection>;
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: G, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.7);opacity:.35}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

export default function AppTradingPlan() {
  const { token } = useAuth();
  const [view, setView] = useState('loading');
  const [messages, setMessages] = useState([]);
  const [savedPlan, setSavedPlan] = useState(null);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState(null);
  const bottomRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [msgsData, planData] = await Promise.all([
          call('/trading-plan/messages', {}, token),
          call('/trading-plan/plan', {}, token),
        ]);
        if (planData?.plan_content) { setSavedPlan(planData.plan_content); setView('plan'); return; }
        if (Array.isArray(msgsData) && msgsData.length > 0) { setMessages(msgsData); setView('chat'); }
        else setView('empty');
      } catch { setView('empty'); }
    })();
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const savePlan = useCallback(async (content) => {
    setSaving(true);
    try {
      const result = await call('/trading-plan/plan', { method: 'POST', body: JSON.stringify({ planContent: content }) }, token);
      setSavedPlan(result?.plan_content || content);
      showToast('Plan saved ✓', 'success');
      setView('plan');
    } catch { showToast('Failed to save plan', 'error'); }
    finally { setSaving(false); }
  }, [token, showToast]);

  const startBuilding = async () => {
    const greeting = { role: 'assistant', content: "Let's build your personalized trading plan. First, tell me about your trading strategy — what is your overall approach to the markets? For example, do you trade momentum, reversals, breakouts, scalping, swing trading, or something else? Describe how you like to trade in your own words." };
    setMessages([greeting]);
    setView('chat');
    try { await call('/trading-plan/messages', { method: 'POST', body: JSON.stringify({ role: greeting.role, content: greeting.content }) }, token); } catch {}
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
    try { await call('/trading-plan/messages', { method: 'POST', body: JSON.stringify({ role: 'user', content: userText }) }, token); } catch {}
    try {
      const data = await call('/plan-chat', { method: 'POST', body: JSON.stringify({ messages: next }) }, token);
      const assistantMsg = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);
      try { await call('/trading-plan/messages', { method: 'POST', body: JSON.stringify({ role: 'assistant', content: data.content }) }, token); } catch {}
      if (detectPlan(data.content)) await savePlan(extractPlan(data.content));
    } catch (err) { setError(err.message); setMessages(prev => prev.slice(0, -1)); }
    finally { setAiLoading(false); }
  };

  const handleEditRules = async () => {
    if (messages.length === 0) {
      try { const msgsData = await call('/trading-plan/messages', {}, token); if (Array.isArray(msgsData)) setMessages(msgsData); } catch {}
    }
    setView('chat');
    const editMsg = { role: 'assistant', content: savedPlan ? `The user wants to update their trading plan. Here is their current plan:\n\n${savedPlan}\n\nWhat would you like to change? You can add rules, remove rules, adjust risk parameters, or update any section.` : "Let's update your plan. What would you like to change?" };
    setMessages(prev => [...prev, editMsg]);
    try { await call('/trading-plan/messages', { method: 'POST', body: JSON.stringify({ role: editMsg.role, content: editMsg.content }) }, token); } catch {}
  };

  const handleReset = async () => {
    setShowReset(false);
    try { await call('/trading-plan', { method: 'DELETE' }, token); } catch {}
    setSavedPlan(null); setMessages([]); setView('empty');
  };

  const lastAssistantIdx = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);
  const lastAssistantMsg = lastAssistantIdx >= 0 ? messages[lastAssistantIdx] : null;
  const showSaveButton = !savedPlan && !aiLoading && lastAssistantMsg && lastAssistantMsg.content.length > 400;

  if (view === 'loading') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><TypingDots /></div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: G, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Trading Plan</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Your Playbook</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Your rules. Your edge.</p>
        </div>
        {view === 'plan' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleEditRules} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${G}60`, color: G, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer' }}>
              ✏️ EDIT
            </button>
            <button onClick={() => setShowReset(true)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${R}60`, color: R, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer' }}>
              RESET
            </button>
          </div>
        )}
        {view === 'chat' && savedPlan && (
          <button onClick={() => setView('plan')} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
            ← View Plan
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Empty state */}
        {view === 'empty' && (
          <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>📋</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Build Your Trading Plan</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 360, marginBottom: 32 }}>
              Your AI coach will interview you about your strategy and create a personalized rulebook you can reference every session.
            </p>
            <button onClick={startBuilding} style={{ padding: '14px 36px', borderRadius: 12, background: G, color: '#000', fontSize: 15, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none', cursor: 'pointer', boxShadow: `0 0 24px ${G}45` }}>
              Start Building
            </button>
          </motion.div>
        )}

        {/* Chat view */}
        {view === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', height: 600 }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? `${G}18` : 'rgba(255,255,255,0.04)', color: m.role === 'user' ? G : '#e0e0e0', fontSize: 14, lineHeight: 1.75, border: m.role === 'user' ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.08)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {m.content}
                        </div>
                      </div>
                      {m.role === 'assistant' && i === lastAssistantIdx && showSaveButton && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
                          <button onClick={() => savePlan(extractPlan(m.content))} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, background: saving ? `${G}50` : G, color: '#000', border: 'none', fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer', boxShadow: `0 0 14px ${G}40` }}>
                            {saving ? 'Saving…' : '✓ Save as My Trading Plan'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {aiLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
                    <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}><TypingDots /></div>
                  </div>
                )}
                {error && <div style={{ fontSize: 12, color: R, marginBottom: 10 }}>{error}</div>}
                <div ref={bottomRef} />
              </div>
              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', background: 'rgba(0,0,0,0.3)' }}>
                <textarea
                  value={input}
                  rows={1}
                  onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Describe your strategy, answer questions…"
                  style={{ flex: 1, resize: 'none', minHeight: 40, maxHeight: 120, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#fff', outline: 'none', lineHeight: 1.5, overflowY: 'hidden', fontFamily: 'inherit' }}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || aiLoading} style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, border: 'none', background: input.trim() && !aiLoading ? G : 'rgba(255,255,255,0.08)', color: input.trim() && !aiLoading ? '#000' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !aiLoading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plan view */}
        {view === 'plan' && savedPlan && (
          <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ background: 'rgba(10,10,10,0.85)', border: `1px solid ${G}20`, borderRadius: 16, padding: '24px 20px', backdropFilter: 'blur(12px)' }}>
              <PlanRenderer content={savedPlan} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset modal */}
      <AnimatePresence>
        {showReset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }} onClick={() => setShowReset(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} onClick={e => e.stopPropagation()} style={{ background: '#0d1a0d', border: `1px solid ${R}40`, borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Reset Trading Plan?</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 24 }}>This will permanently delete your current rules and conversation history. You will need to build a new plan from scratch.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowReset(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'transparent', border: `1px solid ${G}60`, color: G, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
                <button onClick={handleReset} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: R, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>YES, RESET</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9000, background: toast.type === 'success' ? '#0d1a0d' : '#1a0d0d', border: `1px solid ${toast.type === 'success' ? G : R}60`, color: toast.type === 'success' ? G : R, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: `0 4px 20px rgba(0,0,0,0.5)`, whiteSpace: 'nowrap' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

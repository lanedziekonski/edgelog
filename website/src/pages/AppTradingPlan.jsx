import { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Edit3, Check, X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com';
const G = '#00ff41';

export default function AppTradingPlan() {
  const { token } = useAuth();
  const [plan, setPlan] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [view, setView] = useState('plan'); // 'plan' or 'chat'
  const messagesEndRef = useRef(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { fetchPlan(); fetchMessages(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`${API}/trading-plan`, { headers });
      const data = await res.json();
      setPlan(data.plan || null);
      setEditedContent(data.plan?.plan_content || '');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/trading-plan/messages`, { headers });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await fetch(`${API}/trading-plan/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      if (data.reply) setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.planSaved) fetchPlan();
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const savePlanEdit = async () => {
    try {
      await fetch(`${API}/trading-plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan_content: editedContent }),
      });
      setPlan(prev => ({ ...prev, plan_content: editedContent }));
      setEditingPlan(false);
    } catch (e) { console.error(e); }
  };

  const resetPlan = async () => {
    try {
      await fetch(`${API}/trading-plan`, { method: 'DELETE', headers });
      await fetch(`${API}/trading-plan/messages`, { method: 'DELETE', headers });
      setPlan(null);
      setMessages([]);
      setShowResetConfirm(false);
      setView('chat');
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-5 h-5 animate-spin" style={{ color: G }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>AI Plan Builder</p>
          <h1 className="text-3xl font-bold tracking-tight">Trading Plan</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {plan ? 'Your AI-built trading plan' : 'Chat with AI to build your personalized trading plan'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {plan && (
            <>
              <button
                onClick={() => setView(view === 'plan' ? 'chat' : 'plan')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors"
                style={{ background: 'rgba(0,255,65,0.08)', color: G, border: '1px solid rgba(0,255,65,0.2)' }}
              >
                {view === 'plan' ? 'Open AI Chat' : 'View Plan'}
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors"
                style={{ background: 'rgba(255,77,77,0.08)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' }}
              >
                <RefreshCw className="w-4 h-4" /> Reset Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reset confirm */}
      {showResetConfirm && (
        <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>This will delete your plan and all chat history. Are you sure?</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={resetPlan} className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold" style={{ background: '#ff4d4d', color: '#000' }}>Yes, Reset</button>
            <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Plan view */}
      {plan && view === 'plan' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <p className="font-mono font-bold" style={{ color: G }}>Your Plan</p>
            {!editingPlan ? (
              <button
                onClick={() => { setEditingPlan(true); setEditedContent(plan.plan_content); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                style={{ background: 'rgba(0,255,65,0.08)', color: G, border: '1px solid rgba(0,255,65,0.2)' }}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Plan
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={savePlanEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold" style={{ background: G, color: '#000' }}>
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => setEditingPlan(false)} className="p-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {editingPlan ? (
              <textarea
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                className="w-full rounded-xl p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,65,0.3)', color: 'rgba(255,255,255,0.85)', minHeight: 400 }}
                autoFocus
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {plan.plan_content}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat view */}
      {(!plan || view === 'chat') && (
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', height: 600 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center pt-16">
                <p className="text-2xl font-bold mb-2">Build Your Trading Plan</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Answer a few questions and the AI will create your personalized trading plan.
                </p>
                <p className="text-xs mt-4 font-mono" style={{ color: G }}>Start by telling me what markets you trade...</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? 'rgba(0,255,65,0.12)' : 'rgba(255,255,255,0.05)',
                    border: msg.role === 'user' ? '1px solid rgba(0,255,65,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Loader className="w-4 h-4 animate-spin" style={{ color: G }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="p-3 rounded-xl transition-colors"
                style={{ background: input.trim() ? G : 'rgba(255,255,255,0.05)', color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

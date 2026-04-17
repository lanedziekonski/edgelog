import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Plus, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrades } from '../hooks/useTrades';

const G = '#00ff41';
const API = 'https://edgelog.onrender.com/api';

const QUICK_PROMPTS = [
  'Review my recent trades',
  'What patterns do you see in my losses?',
  'Am I following my trading plan?',
  'What should I focus on tomorrow?',
];

const INITIAL_MSG = {
  role: 'coach',
  content: "Hey! I'm your AI Trading Coach. I have access to your trading journal and can help you find patterns, improve discipline, and sharpen your edge. What would you like to work on today?",
  time: '',
};

export default function AppAICoach() {
  const { user, token } = useAuth();
  const { trades } = useTrades();
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const endRef = useRef(null);

  const isElite = user?.plan === 'elite';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  const send = async (text) => {
    if (!text.trim() || typing || !isElite) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const userMsg = { role: 'user', content: text, time: now };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);

    // Build context from recent trades
    const recentTrades = [...trades]
      .sort((a, b) => b.date?.localeCompare(a.date) || 0)
      .slice(0, 20)
      .map(t => `${t.date} ${t.symbol} ${t.direction} ${t.setup} P&L:$${t.pnl} rules:${t.followedPlan ? 'clean' : 'broken'}`)
      .join('\n');

    const apiMessages = messages
      .filter(m => m.role !== 'coach' || m !== INITIAL_MSG)
      .concat(userMsg)
      .map(m => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.content }));

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: apiMessages,
          period: 'post_market',
          context: recentTrades ? `Recent trades:\n${recentTrades}` : '',
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || data.content || "I'm having trouble connecting right now. Please try again.";
      setMessages(m => [...m, { role: 'coach', content: reply, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }]);
    } catch {
      setMessages(m => [...m, { role: 'coach', content: "Connection error — please try again in a moment.", time: now }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)', maxHeight: 820 }}>
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>AI Coach</p>
          <h1 className="text-3xl font-bold tracking-tight">Daily Review</h1>
        </div>
        {isElite && (
          <button
            onClick={() => setMessages([INITIAL_MSG])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-mono transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        )}
      </div>

      {!isElite ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${G}15`, border: `1px solid ${G}40` }}>
            <Lock className="w-6 h-6" style={{ color: G }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Elite Plan Required</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Upgrade to Elite to unlock daily AI coaching sessions
            </p>
          </div>
          <a
            href="/pricing"
            className="px-6 py-2.5 rounded-lg font-semibold text-sm"
            style={{ background: G, color: '#000' }}
          >
            View Plans
          </a>
        </div>
      ) : (
        <div className="flex-1 rounded-2xl border flex flex-col overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            {messages.map((m, i) => <Message key={i} message={m} index={i} />)}
            {typing && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                <CoachAvatar />
                <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 md:px-6 pt-2 pb-3 flex gap-2 overflow-x-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-mono rounded-full border transition-colors hover:border-[#00ff41]/40 hover:text-[#00ff41] whitespace-nowrap"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 p-3 md:p-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your coach…"
              disabled={typing}
              className="flex-1 px-4 py-3 rounded-full text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <motion.button
              type="submit"
              disabled={typing || !input.trim()}
              whileHover={!typing ? { scale: 1.05 } : {}}
              whileTap={!typing ? { scale: 0.95 } : {}}
              className="p-3 rounded-full transition-all"
              style={{ background: G, color: '#000', opacity: typing || !input.trim() ? 0.6 : 1 }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      )}
    </div>
  );
}

function CoachAvatar() {
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${G}40`, background: `${G}15` }}>
      <Sparkles className="w-4 h-4" style={{ color: G }} />
    </div>
  );
}

function Message({ message: m, index }) {
  const isCoach = m.role === 'coach';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
      className={`flex items-start gap-3 ${isCoach ? '' : 'flex-row-reverse'}`}
    >
      {isCoach ? (
        <CoachAvatar />
      ) : (
        <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}>
          You
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col ${isCoach ? 'items-start' : 'items-end'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={isCoach
            ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderTopLeftRadius: 4 }
            : { background: `${G}e0`, color: '#000', fontWeight: 500, borderTopRightRadius: 4 }
          }
        >
          {m.content}
        </div>
        {m.time && <span className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>{m.time}</span>}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
      ))}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Plus } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import { COACH_CONVERSATION } from '../../../data/mockDashboard';

const QUICK_PROMPTS = [
  'Review today\'s trades',
  'Spot patterns in my losses',
  'Am I following my plan?',
  'What should I work on tomorrow?',
];

export default function CoachScreen() {
  const [messages, setMessages] = useState(COACH_CONVERSATION);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  const send = (text) => {
    if (!text.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setMessages((m) => [...m, { role: 'user', content: text, time }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          role: 'coach',
          content:
            "That's a great question. In the full app, I'd analyze your trade history, setup performance, and rule adherence to give you a specific, data-backed answer. This is a preview — log your real trades to unlock personalized coaching.",
          time,
        },
      ]);
    }, 1400);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[820px]">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4">
        <div>
          <SectionEyebrow>AI Coach</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Daily Review</h1>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-neon/40 hover:bg-neon/5 transition-colors text-sm font-mono">
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {/* Chat container */}
      <div className="flex-1 rounded-2xl border border-border bg-panel/40 backdrop-blur-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
          {messages.map((m, i) => (
            <Message key={i} message={m} index={i} />
          ))}

          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <CoachAvatar />
              <div className="px-4 py-3 rounded-2xl bg-panel/80 border border-border">
                <TypingDots />
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 md:px-6 pt-2 pb-3 border-t border-border flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-mono rounded-full border border-border hover:border-neon/40 hover:text-neon transition-colors whitespace-nowrap"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 p-3 md:p-4 border-t border-border"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach…"
            className="flex-1 px-4 py-3 rounded-full border border-border bg-bg/60 text-sm focus:outline-none focus:border-neon/50 transition-colors"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-neon text-black hover:shadow-neon transition-shadow"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full border border-neon/40 bg-neon/10 flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-neon" />
    </div>
  );
}

function Message({ message, index }) {
  const isCoach = message.role === 'coach';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className={`flex items-start gap-3 ${isCoach ? '' : 'flex-row-reverse'}`}
    >
      {isCoach ? (
        <CoachAvatar />
      ) : (
        <div className="flex-shrink-0 w-9 h-9 rounded-full border border-border bg-panel flex items-center justify-center text-xs font-mono font-bold">
          You
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col ${isCoach ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isCoach
              ? 'bg-panel/80 border border-border text-ink rounded-tl-sm'
              : 'bg-neon/90 text-black rounded-tr-sm font-medium'
          }`}
        >
          {message.content}
        </div>
        <span className="mt-1 text-[10px] text-muted font-mono uppercase tracking-wider">
          {message.time}
        </span>
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="w-1.5 h-1.5 rounded-full bg-neon"
        />
      ))}
    </div>
  );
}

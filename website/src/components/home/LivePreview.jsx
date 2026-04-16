import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, FileText, Calendar, MessageSquare, Target } from 'lucide-react';
import SectionEyebrow from '../ui/SectionEyebrow';
import TradeCard from '../ui/TradeCard';
import MockDashboard from '../ui/MockDashboard';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { id: 'journal', label: 'Journal', Icon: FileText },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'coach', label: 'AI Coach', Icon: MessageSquare },
  { id: 'plan', label: 'Trading Plan', Icon: Target },
];

export default function LivePreview() {
  const [tab, setTab] = useState('dashboard');

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <SectionEyebrow>Live Preview</SectionEyebrow>
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance max-w-3xl">
            See it in action.
          </h2>
          <p className="mt-4 text-lg text-muted max-w-2xl text-balance">
            A complete trading command center — every screen designed for clarity under pressure.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-neon/60 text-neon bg-neon/5'
                  : 'border-border text-muted hover:text-ink hover:border-border-bright'
              }`}
            >
              {tab === id && (
                <motion.span
                  layoutId="tab-pill-bg"
                  className="absolute inset-0 rounded-full bg-neon/5 ring-1 ring-neon/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative w-4 h-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <div className="relative">
          <div
            className="absolute -inset-8 pointer-events-none opacity-50 blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,255,65,0.2) 0%, transparent 70%)',
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {tab === 'dashboard' && <MockDashboard />}
              {tab === 'journal' && <JournalPreview />}
              {tab === 'calendar' && <CalendarPreview />}
              {tab === 'coach' && <CoachPreview />}
              {tab === 'plan' && <PlanPreview />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function PanelFrame({ title, children }) {
  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-2xl border border-border bg-panel/85 backdrop-blur shadow-neon-soft overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-black/60">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-neon" />
        <span className="ml-3 text-xs text-muted font-mono">traderascend / {title}</span>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
}

function JournalPreview() {
  return (
    <PanelFrame title="journal">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Journal</h3>
          <p className="text-sm text-muted font-mono mt-1">28 trades · April 2026</p>
        </div>
        <div className="hidden md:flex gap-2">
          {['All', 'Wins', 'Losses', 'Broke Rules'].map((f, i) => (
            <span
              key={f}
              className={`px-3 py-1.5 rounded-full text-xs font-mono ${
                i === 0
                  ? 'border border-neon/60 text-neon bg-neon/5'
                  : 'border border-border text-muted'
              }`}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
          Fri, Apr 10
        </span>
        <span className="text-sm text-neon font-mono font-bold">+$675</span>
      </div>
      <div className="space-y-3">
        <TradeCard symbol="ES" side="LONG" setup="ORB" contracts="1ct" pl="+$338" account="Alpha" win delay={0.05} />
        <TradeCard symbol="NQ" side="LONG" setup="VWAP" contracts="1ct" pl="+$337" account="Alpha" win delay={0.1} />
      </div>

      <div className="mt-6 mb-4 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
          Thu, Apr 9
        </span>
        <span className="text-sm text-red-400 font-mono font-bold">-$264</span>
      </div>
      <div className="space-y-3">
        <TradeCard symbol="MNQ" side="SHORT" setup="ORB" contracts="3ct" pl="-$51" account="Alpha" win={false} delay={0.15} />
        <TradeCard symbol="MNQ" side="LONG" setup="ORB" contracts="3ct" pl="-$81" account="Alpha" win={false} delay={0.2} />
        <TradeCard symbol="MES" side="SHORT" setup="FOMO" contracts="2ct" pl="-$132" account="Alpha" win={false} delay={0.25} />
      </div>
    </PanelFrame>
  );
}

function CalendarPreview() {
  const days = Array.from({ length: 35 }, (_, i) => {
    const dim = [2, 5, 12, 15, 20, 26, 28, 29, 30].includes(i);
    const win = [3, 6, 13, 16, 21, 27, 31].includes(i);
    const loss = [4, 7, 14, 22, 32].includes(i);
    return { dim, win, loss, date: i - 2 };
  });
  return (
    <PanelFrame title="calendar">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Calendar</h3>
          <p className="text-sm text-muted font-mono mt-1">April 2026 · +$4,280 net</p>
        </div>
        <div className="text-xs font-mono text-muted">18 green · 4 red days</div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.012 }}
            className={`aspect-square rounded-lg border flex flex-col justify-between p-2 ${
              d.win
                ? 'border-neon/40 bg-neon/10'
                : d.loss
                ? 'border-red-500/30 bg-red-500/10'
                : 'border-border bg-panel/40'
            }`}
          >
            <span className={`text-xs font-mono ${d.dim ? 'text-muted/50' : 'text-ink'}`}>
              {d.date > 0 && d.date <= 30 ? d.date : ''}
            </span>
            {d.win && <span className="text-[10px] font-mono font-bold text-neon">+</span>}
            {d.loss && <span className="text-[10px] font-mono font-bold text-red-400">-</span>}
          </motion.div>
        ))}
      </div>
    </PanelFrame>
  );
}

function CoachPreview() {
  const messages = [
    { role: 'coach', text: 'I noticed you took 4 trades yesterday — your plan caps at 3. What was going through your head on trade #4?' },
    { role: 'user', text: 'I saw another setup and didn\'t want to miss it.' },
    { role: 'coach', text: 'Classic FOMO signal. That fourth trade lost $120, wiping out the day. Next time, screenshot the setup and review it after close instead.' },
  ];
  return (
    <PanelFrame title="ai-coach">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">AI Coach</h3>
          <p className="text-sm text-muted font-mono mt-1">Post-market session · Apr 9</p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-neon">
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
          online
        </div>
      </div>
      <div className="space-y-4 max-w-3xl mx-auto">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'bg-neon/10 border border-neon/30 text-ink'
                  : 'bg-panel/80 border border-border text-muted'
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 max-w-3xl mx-auto">
        <div className="rounded-full border border-border bg-black/60 flex items-center gap-3 px-4 py-3">
          <span className="text-sm text-muted flex-1">Ask your coach anything…</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neon">Send</span>
        </div>
      </div>
    </PanelFrame>
  );
}

function PlanPreview() {
  const rules = [
    { rule: 'Never take more than 3 trades per session', hit: true },
    { rule: 'Stop trading after 2 consecutive losses', hit: true },
    { rule: 'Only trade 9:30-11:00 ET and 2:00-3:30 ET', hit: true },
    { rule: 'Min 2:1 R:R on every setup', hit: false },
    { rule: 'Screenshot every trade within 60s of entry', hit: true },
  ];
  return (
    <PanelFrame title="trading-plan">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Trading Plan</h3>
          <p className="text-sm text-muted font-mono mt-1">ORB Strategy · Futures · Last updated 2d ago</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted">Rule Score</div>
          <div className="text-3xl font-bold text-neon">92%</div>
        </div>
      </div>
      <div className="space-y-3">
        {rules.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-panel/60 px-5 py-4"
          >
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                r.hit ? 'border-neon bg-neon/20' : 'border-red-500/60 bg-red-500/10'
              }`}
            >
              {r.hit && <span className="w-2 h-2 rounded-full bg-neon" />}
            </span>
            <span className={`text-sm ${r.hit ? 'text-ink' : 'text-red-300'}`}>{r.rule}</span>
          </motion.div>
        ))}
      </div>
    </PanelFrame>
  );
}

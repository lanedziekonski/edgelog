import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Check,
  Target,
  Shield,
  Sunrise,
  Moon,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import Modal from '../../ui/Modal';
import { TRADING_PLAN } from '../../../data/mockDashboard';

export default function PlanScreen() {
  const [plan, setPlan] = useState(() => deepClone(TRADING_PLAN));
  const [editOpen, setEditOpen] = useState(false);
  const [activeSetup, setActiveSetup] = useState(null);

  const toggleSetup = (name) => {
    setPlan((p) => ({
      ...p,
      setups: p.setups.map((s) => (s.name === name ? { ...s, enabled: !s.enabled } : s)),
    }));
  };

  const toggleRisk = (index) => {
    setPlan((p) => ({
      ...p,
      riskRules: p.riskRules.map((r, i) => (i === index ? { ...r, done: !r.done } : r)),
    }));
  };

  const toggleRoutine = (bucket, index) => {
    setPlan((p) => ({
      ...p,
      routine: {
        ...p.routine,
        [bucket]: p.routine[bucket].map((r, i) => (i === index ? { ...r, done: !r.done } : r)),
      },
    }));
  };

  const addRule = (text) => {
    if (!text.trim()) return;
    setPlan((p) => ({
      ...p,
      riskRules: [...p.riskRules, { text: text.trim(), done: false }],
    }));
  };

  const deleteRule = (index) => {
    setPlan((p) => ({
      ...p,
      riskRules: p.riskRules.filter((_, i) => i !== index),
    }));
  };

  const enabledSetups = useMemo(() => plan.setups.filter((s) => s.enabled).length, [plan.setups]);
  const preMarketDone = useMemo(
    () => plan.routine.preMarket.filter((r) => r.done).length,
    [plan.routine.preMarket],
  );
  const postMarketDone = useMemo(
    () => plan.routine.postMarket.filter((r) => r.done).length,
    [plan.routine.postMarket],
  );
  const riskScore = useMemo(() => {
    const done = plan.riskRules.filter((r) => r.done).length;
    return plan.riskRules.length ? Math.round((done / plan.riskRules.length) * 100) : 0;
  }, [plan.riskRules]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Trading Plan</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Your Playbook</h1>
          <p className="mt-2 text-muted text-sm max-w-xl">
            The rules that keep you disciplined. Reviewed weekly, enforced daily.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border hover:border-neon/40 hover:bg-neon/5 transition-colors text-sm font-mono"
        >
          <Edit3 className="w-4 h-4" /> Edit Plan
        </motion.button>
      </div>

      {/* Adherence strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreTile label="Rule Score" value={`${riskScore}%`} tone={riskScore >= 90 ? 'neon' : riskScore >= 60 ? 'amber' : 'red'} />
        <ScoreTile label="Setups Active" value={`${enabledSetups} / ${plan.setups.length}`} tone="neon" />
        <ScoreTile label="Pre-Market" value={`${preMarketDone} / ${plan.routine.preMarket.length}`} tone="neon" />
        <ScoreTile label="Post-Market" value={`${postMarketDone} / ${plan.routine.postMarket.length}`} tone="neon" />
      </div>

      <Section title="Setups" Icon={Target} count={`${enabledSetups} active`}>
        <div className="space-y-2.5">
          {plan.setups.map((s, i) => (
            <SetupRow
              key={s.name}
              setup={s}
              index={i}
              onToggle={() => toggleSetup(s.name)}
              onClick={() => setActiveSetup(s)}
            />
          ))}
        </div>
      </Section>

      <Section title="Risk Rules" Icon={Shield} count={`${riskScore}% clean`}>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {plan.riskRules.map((rule, i) => (
              <RuleRow
                key={`risk-${rule.text}-${i}`}
                rule={rule}
                index={i}
                onToggle={() => toggleRisk(i)}
                onDelete={() => deleteRule(i)}
              />
            ))}
          </AnimatePresence>
        </ul>
        <AddRuleInput onAdd={addRule} />
      </Section>

      <Section
        title="Pre-Market Routine"
        Icon={Sunrise}
        count={`${preMarketDone} / ${plan.routine.preMarket.length}`}
      >
        <ul className="space-y-2">
          {plan.routine.preMarket.map((r, i) => (
            <RuleRow
              key={`pre-${i}`}
              rule={r}
              index={i}
              onToggle={() => toggleRoutine('preMarket', i)}
            />
          ))}
        </ul>
      </Section>

      <Section
        title="Post-Market Review"
        Icon={Moon}
        count={`${postMarketDone} / ${plan.routine.postMarket.length}`}
      >
        <ul className="space-y-2">
          {plan.routine.postMarket.map((r, i) => (
            <RuleRow
              key={`post-${i}`}
              rule={r}
              index={i}
              onToggle={() => toggleRoutine('postMarket', i)}
            />
          ))}
        </ul>
      </Section>

      <Modal
        open={!!activeSetup}
        onClose={() => setActiveSetup(null)}
        subtitle={activeSetup?.session}
        title={activeSetup?.name || ''}
        size="md"
      >
        {activeSetup && <SetupDetail setup={activeSetup} />}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        subtitle="Playbook"
        title="Edit Your Plan"
        size="md"
      >
        <EditPlanInfo onClose={() => setEditOpen(false)} />
      </Modal>
    </div>
  );
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function ScoreTile({ label, value, tone = 'muted' }) {
  const color =
    tone === 'neon'
      ? 'text-neon'
      : tone === 'amber'
      ? 'text-amber-400'
      : tone === 'red'
      ? 'text-red-400'
      : 'text-ink';
  return (
    <div className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4">
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Section({ title, Icon, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-panel/50 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-neon" />
          <h3 className="font-bold tracking-tight text-lg">{title}</h3>
          <span className="text-xs font-mono text-muted uppercase tracking-wider ml-1">
            {count}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SetupRow({ setup, index, onToggle, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.04 }}
      className={`rounded-xl border bg-bg/40 px-4 py-3.5 transition-colors ${
        setup.enabled ? 'border-border' : 'border-border/40 opacity-70'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onClick}
          className="flex items-center gap-2.5 flex-wrap text-left group/label"
        >
          <span className="font-mono font-bold text-ink group-hover/label:text-neon transition-colors">
            {setup.name}
          </span>
          {!setup.enabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted font-mono uppercase tracking-wider">
              Paused
            </span>
          )}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted font-mono uppercase tracking-wider hidden md:inline">
            {setup.session}
          </span>
          <Toggle active={setup.enabled} onChange={onToggle} />
        </div>
      </div>
      <button
        onClick={onClick}
        className="mt-2 w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono text-left"
      >
        <span className="text-muted">
          <span className="text-neon">Entry:</span> {setup.entry}
        </span>
        <span className="text-muted">
          <span className="text-red-400">Stop:</span> {setup.stop}
        </span>
        <span className="text-muted">
          <span className="text-neon">Target:</span> {setup.target}
        </span>
      </button>
    </motion.div>
  );
}

function Toggle({ active, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full border transition-colors flex-shrink-0 ${
        active ? 'border-neon/50 bg-neon/20' : 'border-border bg-bg/70'
      }`}
    >
      <motion.span
        animate={{ x: active ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-4 h-4 rounded-full ${
          active ? 'bg-neon shadow-neon-soft' : 'bg-muted'
        }`}
      />
    </button>
  );
}

function RuleRow({ rule, index, onToggle, onDelete }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: 0.02 + index * 0.03 }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
    >
      <button
        onClick={onToggle}
        aria-checked={rule.done}
        role="checkbox"
        className={`
          flex items-center justify-center w-5 h-5 rounded border transition-all flex-shrink-0
          ${rule.done
            ? 'bg-neon border-neon shadow-neon-soft'
            : 'bg-transparent border-border hover:border-neon/60'}
        `}
      >
        <AnimatePresence>
          {rule.done && (
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <button
        onClick={onToggle}
        className={`flex-1 text-sm text-left transition-colors ${
          rule.done ? 'text-ink' : 'text-muted hover:text-ink'
        }`}
      >
        <span className={rule.done ? 'opacity-80' : ''}>{rule.text}</span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-red-400 transition-all"
          aria-label="Delete rule"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.li>
  );
}

function AddRuleInput({ onAdd }) {
  const [val, setVal] = useState('');
  const submit = (e) => {
    e.preventDefault();
    onAdd(val);
    setVal('');
  };
  return (
    <form onSubmit={submit} className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add a new rule…"
        className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg/40 text-sm focus:outline-none focus:border-neon/50 transition-colors"
      />
      <motion.button
        type="submit"
        whileTap={{ scale: 0.94 }}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neon/40 bg-neon/10 text-neon hover:bg-neon/20 transition-colors text-sm font-mono uppercase tracking-wider"
        disabled={!val.trim()}
      >
        <Plus className="w-3.5 h-3.5" />
        Add
      </motion.button>
    </form>
  );
}

function SetupDetail({ setup }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
            setup.enabled
              ? 'border border-neon/40 bg-neon/10 text-neon'
              : 'border border-border text-muted'
          }`}
        >
          {setup.enabled ? 'Active' : 'Paused'}
        </span>
        <span className="text-xs text-muted font-mono">{setup.session}</span>
      </div>

      <div className="space-y-2.5">
        <DetailRow label="Entry" value={setup.entry} tone="neon" />
        <DetailRow label="Stop" value={setup.stop} tone="red" />
        <DetailRow label="Target" value={setup.target} tone="neon" />
      </div>

      <div className="rounded-xl border border-border bg-bg/40 p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-2">
          Playbook Note
        </div>
        <p className="text-sm text-ink/90 leading-relaxed">
          Take this setup only when market conditions match {setup.session.toLowerCase()}. If any of
          the conditions are unclear, skip the trade and record the miss in your journal.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, tone }) {
  const color = tone === 'red' ? 'text-red-400' : 'text-neon';
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border bg-bg/40">
      <span className={`text-[10px] font-mono uppercase tracking-[0.2em] w-14 flex-shrink-0 mt-0.5 ${color}`}>
        {label}
      </span>
      <span className="text-sm text-ink/90">{value}</span>
    </div>
  );
}

function EditPlanInfo({ onClose }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <p>
        Your plan is editable directly on the page — toggle setups on/off, check off rules as you
        complete them, and add new rules inline with the input at the bottom of the Risk Rules
        section.
      </p>
      <ul className="space-y-2 text-muted">
        <li className="flex items-start gap-2">
          <span className="text-neon font-mono">→</span> Flip the toggle next to a setup to pause
          it
        </li>
        <li className="flex items-start gap-2">
          <span className="text-neon font-mono">→</span> Click any checkbox to mark an item
          complete
        </li>
        <li className="flex items-start gap-2">
          <span className="text-neon font-mono">→</span> Hover a rule to reveal the delete option
        </li>
        <li className="flex items-start gap-2">
          <span className="text-neon font-mono">→</span> Click a setup name to open its playbook
          note
        </li>
      </ul>
      <div className="flex justify-end pt-3 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="px-4 py-2 rounded-full bg-neon text-black font-semibold text-sm hover:shadow-neon transition-shadow"
        >
          Got it
        </motion.button>
      </div>
    </div>
  );
}

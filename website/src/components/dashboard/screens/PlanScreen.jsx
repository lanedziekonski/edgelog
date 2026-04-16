import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Target, Shield, Sunrise, Moon, Edit3 } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import { TRADING_PLAN } from '../../../data/mockDashboard';

export default function PlanScreen() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Trading Plan</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
            Your Playbook
          </h1>
          <p className="mt-2 text-muted text-sm max-w-xl">
            The rules that keep you disciplined. Reviewed weekly, enforced daily.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border hover:border-neon/40 hover:bg-neon/5 transition-colors text-sm font-mono"
        >
          <Edit3 className="w-4 h-4" /> Edit Plan
        </motion.button>
      </div>

      {/* Setups */}
      <Section title="Setups" Icon={Target} count={TRADING_PLAN.setups.filter((s) => s.enabled).length}>
        <div className="space-y-2.5">
          {TRADING_PLAN.setups.map((s, i) => (
            <SetupRow key={s.name} setup={s} index={i} />
          ))}
        </div>
      </Section>

      {/* Risk Rules */}
      <Section title="Risk Rules" Icon={Shield} count={TRADING_PLAN.riskRules.length}>
        <ul className="space-y-2">
          {TRADING_PLAN.riskRules.map((rule, i) => (
            <RuleRow key={i} rule={rule} index={i} />
          ))}
        </ul>
      </Section>

      {/* Routine */}
      <Section title="Pre-Market Routine" Icon={Sunrise} count={TRADING_PLAN.routine.preMarket.filter((r) => r.done).length + ' / ' + TRADING_PLAN.routine.preMarket.length}>
        <ul className="space-y-2">
          {TRADING_PLAN.routine.preMarket.map((r, i) => (
            <RuleRow key={i} rule={r} index={i} />
          ))}
        </ul>
      </Section>

      <Section title="Post-Market Review" Icon={Moon} count={TRADING_PLAN.routine.postMarket.filter((r) => r.done).length + ' / ' + TRADING_PLAN.routine.postMarket.length}>
        <ul className="space-y-2">
          {TRADING_PLAN.routine.postMarket.map((r, i) => (
            <RuleRow key={i} rule={r} index={i} />
          ))}
        </ul>
      </Section>
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
          <span className="text-xs font-mono text-muted uppercase tracking-wider ml-1">{count}</span>
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

function SetupRow({ setup, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.04 }}
      className={`rounded-xl border bg-bg/40 px-4 py-3.5 ${
        setup.enabled ? 'border-border hover:border-neon/40' : 'border-border/40 opacity-60'
      } transition-colors`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono font-bold text-ink">{setup.name}</span>
          {!setup.enabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted font-mono uppercase tracking-wider">
              Paused
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
          {setup.session}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono">
        <span className="text-muted">
          <span className="text-neon">Entry:</span> {setup.entry}
        </span>
        <span className="text-muted">
          <span className="text-red-400">Stop:</span> {setup.stop}
        </span>
        <span className="text-muted">
          <span className="text-neon">Target:</span> {setup.target}
        </span>
      </div>
    </motion.div>
  );
}

function RuleRow({ rule, index }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.04 }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
    >
      <span
        className={`
          flex items-center justify-center w-5 h-5 rounded border transition-all
          ${rule.done
            ? 'bg-neon border-neon shadow-neon-soft'
            : 'bg-transparent border-border group-hover:border-neon/40'}
        `}
      >
        {rule.done && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
      </span>
      <span className={`text-sm ${rule.done ? 'text-ink' : 'text-muted'}`}>{rule.text}</span>
    </motion.li>
  );
}

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Plus, TrendingUp, Shield, Target, Calendar } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import useCountUp from '../../../hooks/useCountUp';
import { ACCOUNTS_DATA } from '../../../data/mockDashboard';

export default function AccountsScreen() {
  const totalBalance = ACCOUNTS_DATA.reduce((a, acc) => a + acc.balance, 0);
  const totalPl = ACCOUNTS_DATA.reduce((a, acc) => a + acc.pl, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <SectionEyebrow>Accounts</SectionEyebrow>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
            {ACCOUNTS_DATA.length} active
          </h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neon/40 bg-neon/10 text-neon hover:bg-neon/20 transition-colors font-semibold"
        >
          <Plus className="w-4 h-4" /> Link Account
        </motion.button>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile label="Total Equity" value={`$${totalBalance.toLocaleString('en-US')}`} />
        <SummaryTile label="Combined P&L" value={`+$${totalPl.toLocaleString('en-US')}`} tone="neon" />
      </div>

      {/* Account cards */}
      <div className="space-y-4">
        {ACCOUNTS_DATA.map((acc, i) => (
          <AccountCard key={acc.id} account={acc} index={i} />
        ))}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const color = tone === 'neon' ? 'text-neon' : 'text-ink';
  return (
    <div className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4">
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function AccountCard({ account, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const balance = useCountUp(account.balance, { duration: 1500, start: inView });

  const drawdownPct = account.drawdownMax
    ? (account.drawdownUsed / account.drawdownMax) * 100
    : 0;
  const profitPct = account.profitTarget
    ? (account.pl / account.profitTarget) * 100
    : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border border-border bg-panel/60 backdrop-blur-sm p-5 md:p-6 overflow-hidden group"
    >
      {/* Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(0,255,65,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg md:text-xl font-bold tracking-tight">{account.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted font-mono uppercase tracking-wider">
              {account.size}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em]">
            <span className={`inline-flex items-center gap-1.5 ${account.type === 'Live' ? 'text-neon' : 'text-muted'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${account.type === 'Live' ? 'bg-neon animate-pulseSlow' : 'bg-muted'}`} />
              {account.phase}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">Balance</div>
          <div className="mt-1 text-2xl md:text-3xl font-bold tabular-nums">
            ${balance.toLocaleString('en-US')}
          </div>
          <div className={`text-xs font-mono ${account.pl >= 0 ? 'text-neon' : 'text-red-400'}`}>
            {account.pl >= 0 ? '+' : '-'}${Math.abs(account.pl).toLocaleString('en-US')}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="relative mt-6 space-y-3">
        {account.profitTarget && (
          <Progress
            Icon={Target}
            label="Profit Target"
            value={`$${account.pl.toLocaleString('en-US')} / $${account.profitTarget.toLocaleString('en-US')}`}
            pct={Math.min(100, profitPct)}
            tone="neon"
            inView={inView}
            delay={0.3}
          />
        )}
        {account.drawdownMax && (
          <Progress
            Icon={Shield}
            label="Drawdown Used"
            value={`$${account.drawdownUsed.toLocaleString('en-US')} / $${account.drawdownMax.toLocaleString('en-US')}`}
            pct={drawdownPct}
            tone={drawdownPct > 70 ? 'red' : drawdownPct > 40 ? 'amber' : 'neon'}
            inView={inView}
            delay={0.4}
          />
        )}
      </div>

      {/* Footer meta */}
      <div className="relative mt-5 pt-5 border-t border-border flex items-center gap-5 text-xs font-mono text-muted flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {account.tradingDays} trading days
        </span>
        {account.tradingDaysRequired && (
          <span className="text-neon">
            ({account.tradingDays}/{account.tradingDaysRequired} min complete)
          </span>
        )}
        {account.payoutsReceived && (
          <span className="inline-flex items-center gap-1.5 text-neon">
            <TrendingUp className="w-3.5 h-3.5" />
            {account.payoutsReceived} payouts · ${account.payoutsTotal.toLocaleString('en-US')}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Progress({ Icon, label, value, pct, tone, inView, delay }) {
  const barColor =
    tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-400' : 'bg-neon';
  const shadow =
    tone === 'red'
      ? '0 0 10px rgba(239,68,68,0.4)'
      : tone === 'amber'
      ? '0 0 10px rgba(251,191,36,0.4)'
      : '0 0 10px rgba(0,255,65,0.4)';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted font-mono uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="text-xs font-mono tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${barColor}`}
          style={{ boxShadow: shadow }}
        />
      </div>
    </div>
  );
}

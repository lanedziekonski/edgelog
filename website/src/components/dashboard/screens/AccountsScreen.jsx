import { useState, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  Shield,
  Target,
  Calendar,
  ChevronRight,
  DollarSign,
  Percent,
  Zap,
} from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import Modal from '../../ui/Modal';
import useCountUp from '../../../hooks/useCountUp';
import { ACCOUNTS_DATA, JOURNAL_TRADES } from '../../../data/mockDashboard';

const ACCOUNT_NAME_MAP = {
  apex: 'Apex',
  ftmo: 'FTMO',
  tasty: 'tastytrade',
};

export default function AccountsScreen() {
  const [selected, setSelected] = useState(null);
  const [linkOpen, setLinkOpen] = useState(false);

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
          onClick={() => setLinkOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neon/40 bg-neon/10 text-neon hover:bg-neon/20 transition-colors font-semibold"
        >
          <Plus className="w-4 h-4" /> Link Account
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryTile label="Total Equity" value={`$${totalBalance.toLocaleString('en-US')}`} />
        <SummaryTile
          label="Combined P&L"
          value={`+$${totalPl.toLocaleString('en-US')}`}
          tone="neon"
        />
      </div>

      <div className="space-y-4">
        {ACCOUNTS_DATA.map((acc, i) => (
          <AccountCard
            key={acc.id}
            account={acc}
            index={i}
            onClick={() => setSelected(acc)}
          />
        ))}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        subtitle={selected?.type}
        title={selected?.name || ''}
        size="lg"
      >
        {selected && <AccountDetail account={selected} />}
      </Modal>

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        subtitle="Connect Broker · Coming Soon"
        title="Link an Account"
        size="md"
      >
        <LinkAccountForm onClose={() => setLinkOpen(false)} />
      </Modal>
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

function AccountCard({ account, index, onClick }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const balance = useCountUp(account.balance, { duration: 1500, start: inView });

  const drawdownPct = account.drawdownMax
    ? (account.drawdownUsed / account.drawdownMax) * 100
    : 0;
  const profitPct = account.profitTarget ? (account.pl / account.profitTarget) * 100 : 0;

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="relative w-full text-left rounded-2xl border border-border bg-panel/60 backdrop-blur-sm p-5 md:p-6 overflow-hidden group hover:border-neon/40 transition-colors"
    >
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
            <span
              className={`inline-flex items-center gap-1.5 ${
                account.type === 'Live' ? 'text-neon' : 'text-muted'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  account.type === 'Live' ? 'bg-neon animate-pulseSlow' : 'bg-muted'
                }`}
              />
              {account.phase}
            </span>
          </div>
        </div>

        <div className="text-right flex items-start gap-3">
          <div>
            <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
              Balance
            </div>
            <div className="mt-1 text-2xl md:text-3xl font-bold tabular-nums">
              ${balance.toLocaleString('en-US')}
            </div>
            <div
              className={`text-xs font-mono ${
                account.pl >= 0 ? 'text-neon' : 'text-red-400'
              }`}
            >
              {account.pl >= 0 ? '+' : '-'}${Math.abs(account.pl).toLocaleString('en-US')}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-neon group-hover:translate-x-0.5 transition-all mt-1" />
        </div>
      </div>

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
    </motion.button>
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

function AccountDetail({ account }) {
  const accountTrades = useMemo(() => {
    const name = ACCOUNT_NAME_MAP[account.id];
    return JOURNAL_TRADES.filter((t) => t.account === name);
  }, [account.id]);

  const wins = accountTrades.filter((t) => t.pl >= 0).length;
  const losses = accountTrades.length - wins;
  const winRate = accountTrades.length
    ? Math.round((wins / accountTrades.length) * 100)
    : 0;
  const avgPl = accountTrades.length
    ? Math.round(accountTrades.reduce((a, t) => a + t.pl, 0) / accountTrades.length)
    : 0;

  const growthPct = account.startBalance
    ? ((account.balance - account.startBalance) / account.startBalance) * 100
    : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-bg/60 p-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted">
            Current Balance
          </div>
          <div className="mt-1 text-4xl md:text-5xl font-bold tabular-nums">
            ${account.balance.toLocaleString('en-US')}
          </div>
          <div
            className={`mt-1 text-sm font-mono ${
              account.pl >= 0 ? 'text-neon' : 'text-red-400'
            }`}
          >
            {account.pl >= 0 ? '+' : '-'}${Math.abs(account.pl).toLocaleString('en-US')} (
            {growthPct >= 0 ? '+' : ''}
            {growthPct.toFixed(2)}%)
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted">
            Phase
          </div>
          <div className="mt-1 text-sm font-mono text-neon">{account.phase}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <MiniStat Icon={DollarSign} label="Starting" value={`$${account.startBalance.toLocaleString('en-US')}`} />
        <MiniStat Icon={Percent} label="Win Rate" value={`${winRate}%`} tone="neon" />
        <MiniStat Icon={Zap} label="Avg Trade" value={`${avgPl >= 0 ? '+' : '-'}$${Math.abs(avgPl)}`} tone={avgPl >= 0 ? 'neon' : 'red'} />
        <MiniStat Icon={Calendar} label="Days Traded" value={account.tradingDays} />
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted mb-2.5">
          W / L Breakdown
        </div>
        <div className="flex items-center gap-1.5 h-8 rounded-lg overflow-hidden bg-bg/60">
          {accountTrades.length > 0 ? (
            <>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(wins / accountTrades.length) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-neon/70 flex items-center justify-center text-[10px] font-mono font-bold text-black"
              >
                {wins > 0 && `${wins}W`}
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(losses / accountTrades.length) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-red-500/70 flex items-center justify-center text-[10px] font-mono font-bold text-white"
              >
                {losses > 0 && `${losses}L`}
              </motion.div>
            </>
          ) : (
            <div className="w-full text-center text-muted text-xs font-mono">No trade records</div>
          )}
        </div>
      </div>

      {account.payoutsReceived && (
        <div className="rounded-xl border border-neon/30 bg-neon/5 p-4 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-neon flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neon">
              Payouts Received
            </div>
            <div className="text-sm mt-0.5">
              <span className="font-bold">{account.payoutsReceived}</span> payouts totaling{' '}
              <span className="font-mono font-bold text-neon">
                ${account.payoutsTotal.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      )}

      {accountTrades.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted mb-2.5">
            Recent Trades
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {accountTrades.slice(0, 8).map((t, i) => {
              const win = t.pl >= 0;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25 }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-l-[3px] ${
                    win ? 'border-l-neon' : 'border-l-red-500'
                  } border-border bg-bg/50`}
                >
                  <span className="text-[10px] font-mono text-muted w-12 flex-shrink-0">{t.date}</span>
                  <span className="font-mono font-bold text-sm">{t.symbol}</span>
                  <span className="text-xs text-muted font-mono flex-1 truncate">{t.setup}</span>
                  <span
                    className={`font-mono font-bold text-sm ${win ? 'text-neon' : 'text-red-400'}`}
                  >
                    {win ? '+' : '-'}${Math.abs(t.pl)}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function MiniStat({ Icon, label, value, tone = 'muted' }) {
  const color = tone === 'red' ? 'text-red-400' : tone === 'neon' ? 'text-neon' : 'text-ink';
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted inline-flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`mt-0.5 text-base font-bold font-mono tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function LinkAccountForm({ onClose }) {
  const [provider, setProvider] = useState('Apex');
  const [status, setStatus] = useState('idle');

  const connect = () => {
    setStatus('connecting');
    setTimeout(() => {
      setStatus('done');
      setTimeout(onClose, 900);
    }, 1400);
  };

  const providers = [
    { id: 'Apex', desc: 'Apex Trader Funding · prop firm' },
    { id: 'FTMO', desc: 'FTMO · evaluation + funded' },
    { id: 'TopStep', desc: 'Topstep · futures prop' },
    { id: 'tastytrade', desc: 'tastytrade · live brokerage' },
    { id: 'NinjaTrader', desc: 'NinjaTrader · retail futures' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Pick a broker or prop firm to connect. We pull fills, P&L, and session data read-only.
      </p>

      <ul className="space-y-2">
        {providers.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setProvider(p.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${
                provider === p.id
                  ? 'border-neon/50 bg-neon/5 text-neon'
                  : 'border-border bg-bg/40 hover:border-neon/30'
              }`}
            >
              <div>
                <div className="font-mono font-bold text-sm">{p.id}</div>
                <div className="text-[11px] text-muted font-mono mt-0.5">{p.desc}</div>
              </div>
              {provider === p.id && (
                <span className="w-2 h-2 rounded-full bg-neon animate-pulseSlow" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors"
          disabled={status === 'connecting'}
        >
          Cancel
        </button>
        <motion.button
          onClick={connect}
          disabled={status !== 'idle'}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon text-black font-semibold text-sm hover:shadow-neon transition-shadow disabled:opacity-70"
        >
          {status === 'idle' && <>Connect {provider}</>}
          {status === 'connecting' && (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent"
              />
              Connecting…
            </>
          )}
          {status === 'done' && <>Connected ✓</>}
        </motion.button>
      </div>
    </div>
  );
}

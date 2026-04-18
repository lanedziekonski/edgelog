import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Calendar,
  CreditCard,
  Shield,
  Bell,
  Download,
  LogOut,
  Star,
  Check,
} from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import Modal from '../../ui/Modal';
import useCountUp from '../../../hooks/useCountUp';
import { PROFILE, ACCOUNTS_DATA, JOURNAL_TRADES } from '../../../data/mockDashboard';

export default function ProfileScreen() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const initials = PROFILE.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const pl = useCountUp(PROFILE.allTimeStats.pl, { duration: 1600, start: inView });
  const trades = useCountUp(PROFILE.allTimeStats.tradesLogged, { duration: 1400, start: inView });

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div ref={ref} className="space-y-6">
      <SectionEyebrow>Profile</SectionEyebrow>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl border border-border bg-gradient-to-br from-panel to-bg p-6 md:p-8 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 85% 20%, rgba(0,255,65,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex items-start gap-5 flex-wrap">
          <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-neon/40 bg-neon/10 flex items-center justify-center text-2xl md:text-3xl font-bold text-neon glow-text">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{PROFILE.name}</h1>
            <div className="mt-1 text-muted text-sm font-mono">{PROFILE.handle}</div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {PROFILE.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {PROFILE.memberSince}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 px-3 py-1.5 rounded-full border border-neon/40 bg-neon/10 text-neon font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-neon" />
            {PROFILE.plan} plan
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-3">
          All-Time Performance
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Total P&L" value={`+$${pl.toLocaleString('en-US')}`} tone="neon" />
          <StatBox label="Trades Logged" value={trades.toLocaleString('en-US')} />
          <StatBox label="Win Rate" value={`${PROFILE.allTimeStats.winRate}%`} tone="neon" />
          <StatBox label="Active Days" value={PROFILE.allTimeStats.days} />
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-3">
          Linked Accounts
        </div>
        <div className="rounded-2xl border border-border bg-panel/50 backdrop-blur-sm divide-y divide-border overflow-hidden">
          {ACCOUNTS_DATA.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted" />
                <div>
                  <div className="text-sm font-mono font-bold">{a.name}</div>
                  <div className="text-xs font-mono text-muted">{a.phase}</div>
                </div>
              </div>
              <div className={`text-sm font-mono font-bold ${a.pl >= 0 ? 'text-neon' : 'text-red-400'}`}>
                {a.pl >= 0 ? '+' : '-'}${Math.abs(a.pl).toLocaleString('en-US')}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-3">Settings</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingRow
            Icon={Bell}
            title="Notifications"
            detail="Daily review reminders, weekly digest"
            onClick={() => setModal('notifications')}
          />
          <SettingRow
            Icon={Shield}
            title="Privacy"
            detail="Control what's shared with AI Coach"
            onClick={() => setModal('privacy')}
          />
          <SettingRow
            Icon={Download}
            title="Export Data"
            detail="Download all trades as CSV or JSON"
            onClick={() => setModal('export')}
          />
          <SettingRow
            Icon={LogOut}
            title="Log Out"
            detail="Sign out of your account"
            danger
            onClick={() => setModal('logout')}
          />
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={modal === 'notifications'}
        onClose={() => setModal(null)}
        subtitle="Settings"
        title="Notifications"
      >
        <NotificationSettings onSaved={() => { setModal(null); flashToast('Notification preferences saved'); }} />
      </Modal>

      <Modal
        open={modal === 'privacy'}
        onClose={() => setModal(null)}
        subtitle="Settings"
        title="Privacy"
      >
        <PrivacySettings onSaved={() => { setModal(null); flashToast('Privacy preferences updated'); }} />
      </Modal>

      <Modal
        open={modal === 'export'}
        onClose={() => setModal(null)}
        subtitle="Data"
        title="Export Trades"
      >
        <ExportTrades onDone={(format) => { setModal(null); flashToast(`Exported ${JOURNAL_TRADES.length} trades as ${format}`); }} />
      </Modal>

      <Modal
        open={modal === 'logout'}
        onClose={() => setModal(null)}
        subtitle="Session"
        title="Log Out?"
        size="sm"
      >
        <LogoutConfirm onCancel={() => setModal(null)} />
      </Modal>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-full border border-neon/40 bg-panel/95 backdrop-blur-md shadow-neon-soft text-sm font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-neon animate-pulseSlow" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, tone }) {
  const color = tone === 'neon' ? 'text-neon' : 'text-ink';
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4"
    >
      <div className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </motion.div>
  );
}

function SettingRow({ Icon, title, detail, danger, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      onClick={onClick}
      className={`
        text-left rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4
        ${danger ? 'hover:border-red-500/40' : 'hover:border-neon/40'}
        transition-colors flex items-start gap-3
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${danger ? 'text-red-400' : 'text-neon'}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted font-mono mt-0.5">{detail}</div>
      </div>
    </motion.button>
  );
}

function NotificationSettings({ onSaved }) {
  const [prefs, setPrefs] = useState({
    dailyReview: true,
    weeklyDigest: true,
    ruleBreakAlerts: true,
    drawdownWarnings: true,
    payoutReminders: false,
    coachInsights: true,
  });

  const items = [
    { key: 'dailyReview', label: 'Daily review reminder', detail: '4:00 PM ET each trading day' },
    { key: 'weeklyDigest', label: 'Weekly digest', detail: 'Sunday night summary of the week' },
    { key: 'ruleBreakAlerts', label: 'Rule break alerts', detail: 'Nudge when a trade violates your plan' },
    { key: 'drawdownWarnings', label: 'Drawdown warnings', detail: 'Alert at 50% / 75% / 90% of max drawdown' },
    { key: 'payoutReminders', label: 'Payout reminders', detail: 'When an account becomes payout-eligible' },
    { key: 'coachInsights', label: 'AI Coach insights', detail: 'New patterns the coach detects in your trades' },
  ];

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((it) => (
          <PrefRow
            key={it.key}
            label={it.label}
            detail={it.detail}
            active={prefs[it.key]}
            onChange={() => setPrefs((p) => ({ ...p, [it.key]: !p[it.key] }))}
          />
        ))}
      </ul>
      <div className="flex justify-end pt-3 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSaved}
          className="px-4 py-2 rounded-full bg-neon text-black font-semibold text-sm hover:shadow-neon transition-shadow"
        >
          Save Preferences
        </motion.button>
      </div>
    </div>
  );
}

function PrivacySettings({ onSaved }) {
  const [prefs, setPrefs] = useState({
    shareTrades: true,
    shareNotes: true,
    sharePsychology: false,
    anonymize: false,
  });

  const items = [
    { key: 'shareTrades', label: 'Share trade data with AI Coach', detail: 'Symbols, sizes, P&L, setups' },
    { key: 'shareNotes', label: 'Share trade notes', detail: 'Let the coach read your journal entries' },
    { key: 'sharePsychology', label: 'Share psychology tags', detail: 'FOMO, revenge, overtrade markers' },
    { key: 'anonymize', label: 'Anonymize in benchmarks', detail: 'Hide your profile in community stats' },
  ];

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((it) => (
          <PrefRow
            key={it.key}
            label={it.label}
            detail={it.detail}
            active={prefs[it.key]}
            onChange={() => setPrefs((p) => ({ ...p, [it.key]: !p[it.key] }))}
          />
        ))}
      </ul>
      <div className="flex justify-end pt-3 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSaved}
          className="px-4 py-2 rounded-full bg-neon text-black font-semibold text-sm hover:shadow-neon transition-shadow"
        >
          Save
        </motion.button>
      </div>
    </div>
  );
}

function PrefRow({ label, detail, active, onChange }) {
  return (
    <li
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border bg-bg/40 hover:bg-bg/60 transition-colors cursor-pointer"
      onClick={onChange}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted font-mono mt-0.5">{detail}</div>
      </div>
      <button
        role="switch"
        aria-checked={active}
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        className={`relative w-10 h-5 rounded-full border flex-shrink-0 transition-colors ${
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
    </li>
  );
}

function ExportTrades({ onDone }) {
  const [format, setFormat] = useState('csv');
  const [status, setStatus] = useState('idle');

  const run = () => {
    setStatus('running');
    setTimeout(() => {
      // Trigger a real download with the mock data
      const blob =
        format === 'csv'
          ? csvFromTrades(JOURNAL_TRADES)
          : new Blob([JSON.stringify(JOURNAL_TRADES, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traderascend-export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('done');
      setTimeout(() => onDone(format.toUpperCase()), 600);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Export your full trade history including setups, P&L, and rule-adherence flags.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {['csv', 'json'].map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-4 rounded-xl border text-left transition-colors ${
              format === f
                ? 'border-neon/50 bg-neon/5'
                : 'border-border bg-bg/40 hover:border-neon/30'
            }`}
          >
            <div className="font-mono font-bold text-sm uppercase">{f}</div>
            <div className="text-[11px] text-muted font-mono mt-1">
              {f === 'csv' ? 'Spreadsheet-friendly' : 'Structured · all fields'}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-bg/40 px-4 py-3 text-xs font-mono text-muted flex items-center justify-between">
        <span>{JOURNAL_TRADES.length} trades · across all accounts</span>
        <span className="text-neon">ready</span>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={run}
          disabled={status !== 'idle'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon text-black font-semibold text-sm hover:shadow-neon transition-shadow disabled:opacity-70"
        >
          {status === 'idle' && <><Download className="w-4 h-4" /> Download {format.toUpperCase()}</>}
          {status === 'running' && (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent"
              />
              Preparing…
            </>
          )}
          {status === 'done' && <><Check className="w-4 h-4" /> Done</>}
        </motion.button>
      </div>
    </div>
  );
}

function csvFromTrades(trades) {
  const header = ['date', 'symbol', 'side', 'setup', 'qty', 'account', 'pl', 'rulesClean'];
  const rows = trades.map((t) => header.map((h) => t[h]).join(','));
  const csv = [header.join(','), ...rows].join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

function LogoutConfirm({ onCancel }) {
  return (
    <div className="space-y-4">
      <p className="text-sm">
        You'll be returned to the marketing site. Any unsaved journal notes will be persisted
        automatically.
      </p>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => (window.location.href = '/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </motion.button>
      </div>
    </div>
  );
}

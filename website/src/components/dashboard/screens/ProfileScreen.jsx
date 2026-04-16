import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mail, Calendar, CreditCard, Shield, Bell, Download, LogOut, Star } from 'lucide-react';
import SectionEyebrow from '../../ui/SectionEyebrow';
import useCountUp from '../../../hooks/useCountUp';
import { PROFILE, ACCOUNTS_DATA } from '../../../data/mockDashboard';

export default function ProfileScreen() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const initials = PROFILE.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const pl = useCountUp(PROFILE.allTimeStats.pl, { duration: 1600, start: inView });
  const trades = useCountUp(PROFILE.allTimeStats.tradesLogged, { duration: 1400, start: inView });

  return (
    <div ref={ref} className="space-y-6">
      <SectionEyebrow>Profile</SectionEyebrow>

      {/* Hero card */}
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

      {/* All-time stats */}
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-3">
          All-Time Performance
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox
            label="Total P&L"
            value={`+$${pl.toLocaleString('en-US')}`}
            tone="neon"
          />
          <StatBox
            label="Trades Logged"
            value={trades.toLocaleString('en-US')}
          />
          <StatBox
            label="Win Rate"
            value={`${PROFILE.allTimeStats.winRate}%`}
            tone="neon"
          />
          <StatBox
            label="Active Days"
            value={PROFILE.allTimeStats.days}
          />
        </div>
      </div>

      {/* Linked accounts */}
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

      {/* Settings grid */}
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-3">Settings</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingRow Icon={Bell} title="Notifications" detail="Daily review reminders, weekly digest" />
          <SettingRow Icon={Shield} title="Privacy" detail="Control what's shared with AI Coach" />
          <SettingRow Icon={Download} title="Export Data" detail="Download all trades as CSV or JSON" />
          <SettingRow Icon={LogOut} title="Exit Demo" detail="Return to the marketing site" danger />
        </div>
      </div>
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

function SettingRow({ Icon, title, detail, danger }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      className={`
        text-left rounded-xl border border-border bg-panel/50 backdrop-blur-sm px-4 py-4
        hover:border-${danger ? 'red-500/40' : 'neon/40'} transition-colors
        flex items-start gap-3
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${danger ? 'text-red-400' : 'text-neon'}`} />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted font-mono mt-0.5">{detail}</div>
      </div>
    </motion.button>
  );
}

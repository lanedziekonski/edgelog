import { useAuth } from '../context/AuthContext';
import { useTrades, calcStats } from '../hooks/useTrades';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ExternalLink } from 'lucide-react';

const G = '#00ff41';

const PLAN_LABELS = {
  free:   { label: 'Free',   color: 'rgba(255,255,255,0.5)',  bg: 'rgba(255,255,255,0.06)' },
  trader: { label: 'Trader', color: '#60a5fa',                bg: 'rgba(96,165,250,0.1)' },
  pro:    { label: 'Pro',    color: G,                        bg: `${G}15` },
  elite:  { label: 'Elite',  color: '#f59e0b',                bg: 'rgba(245,158,11,0.1)' },
};

export default function AppProfile() {
  const { user, logout } = useAuth();
  const { trades }       = useTrades();
  const navigate         = useNavigate();
  const stats = useMemo(() => calcStats(trades), [trades]);

  const plan = PLAN_LABELS[user?.plan] || PLAN_LABELS.free;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>Profile</p>
        <h1 className="text-3xl font-bold tracking-tight">Your Account</h1>
      </div>

      {/* Identity card */}
      <div className="rounded-xl p-6 flex items-start gap-4" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold"
          style={{ background: `${G}20`, border: `1px solid ${G}40`, color: G }}>
          {(user?.name || user?.email || 'T')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xl leading-tight">{user?.name || 'Trader'}</p>
          <p className="text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: plan.bg, color: plan.color }}>
              {plan.label} plan
            </span>
            {user?.plan !== 'elite' && (
              <a href="/pricing" className="text-xs font-medium hover:underline" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Upgrade →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl p-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>All-Time Stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Trades', value: stats.totalTrades },
            { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? G : '#ff4d4d' },
            { label: 'Total P&L', value: `${stats.totalPnl >= 0 ? '+' : '-'}$${Math.abs(stats.totalPnl).toFixed(0)}`, color: stats.totalPnl >= 0 ? G : '#ff4d4d' },
            { label: 'Profit Factor', value: stats.profitFactor >= 99 ? '∞' : stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1 ? G : '#ff4d4d' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color || '#fff' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan info */}
      <div className="rounded-xl p-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Subscription</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold">{plan.label} plan</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {user?.plan === 'free'
                ? 'Upgrade to unlock journals, AI coaching, and more'
                : 'Manage your subscription below'}
            </p>
          </div>
          <a
            href={user?.plan === 'free' ? '/pricing' : 'https://edgelog.onrender.com/api/stripe/create-portal-session'}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:border-white/20"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            {user?.plan === 'free' ? 'View Plans' : (<><ExternalLink className="w-3.5 h-3.5" /> Billing Portal</>)}
          </a>
        </div>
      </div>

      {/* Account settings */}
      <div className="rounded-xl p-6 space-y-3" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Account</p>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <User className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <div className="min-w-0">
            <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Email</p>
            <p className="text-sm truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-red-500/[0.06] text-left"
          style={{ color: '#ff6b6b' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}

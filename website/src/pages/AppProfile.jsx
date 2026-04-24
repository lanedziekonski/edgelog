import { useAuth } from '../context/AuthContext';
import { useTrades, calcStats } from '../hooks/useTrades';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, ExternalLink, Copy, Check, Gift, KeyRound, Loader2, X } from 'lucide-react';
import { createPortalSession } from '../lib/stripe';

const G = '#00ff41';
const API = 'https://edgelog.onrender.com/api';

const PLAN_LABELS = {
  free:   { label: 'Free',   color: 'rgba(255,255,255,0.5)',  bg: 'rgba(255,255,255,0.06)' },
  trader: { label: 'Trader', color: '#60a5fa',                bg: 'rgba(96,165,250,0.1)' },
  pro:    { label: 'Pro',    color: G,                        bg: `${G}15` },
  elite:  { label: 'Elite',  color: '#f59e0b',                bg: 'rgba(245,158,11,0.1)' },
};

export default function AppProfile() {
  const { user, token, logout } = useAuth();
  const { trades }       = useTrades();
  const navigate         = useNavigate();
  const stats = useMemo(() => calcStats(trades), [trades]);

  const [referralCode, setReferralCode]         = useState('');
  const [referralEarnings, setReferralEarnings] = useState({ total: 0, referral_count: 0 });
  const [copied, setCopied]                     = useState(false);

  // Stripe portal
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError]     = useState('');

  // Checkout success banner + refreshed plan
  const [successBanner, setSuccessBanner] = useState(false);
  const [freshPlan, setFreshPlan]         = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/referrals/my-code`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.code) setReferralCode(d.code); })
      .catch(() => {});
    fetch(`${API}/referrals/earnings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.total != null) setReferralEarnings(d); })
      .catch(() => {});
  }, [token]);

  // Detect ?checkout=success and refresh user plan from backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    setSuccessBanner(true);
    window.history.replaceState({}, document.title, '/profile');
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user?.plan) setFreshPlan(data.user.plan); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setPortalError('');
    try {
      await createPortalSession(token);
    } catch (err) {
      const msg = typeof err?.message === 'string' && err.message
        ? err.message
        : 'Unable to open billing portal — please try again';
      setPortalError(msg);
      setPortalLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // Use freshPlan (from post-checkout re-fetch) if available
  const effectivePlan = freshPlan || user?.plan || 'free';
  const plan = PLAN_LABELS[effectivePlan] || PLAN_LABELS.free;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: G }}>Profile</p>
        <h1 className="text-3xl font-bold tracking-tight">Your Account</h1>
      </div>

      {/* Checkout success banner */}
      {successBanner && (
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 rounded-xl"
          style={{ background: `${G}12`, border: `1px solid ${G}40` }}
        >
          <p className="text-sm font-medium" style={{ color: G }}>
            Subscription activated! Welcome to {plan.label}. Your plan is now active.
          </p>
          <button
            onClick={() => setSuccessBanner(false)}
            className="flex-shrink-0 transition-opacity hover:opacity-60"
            style={{ color: G }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            {effectivePlan !== 'elite' && (
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
              {effectivePlan === 'free'
                ? 'Upgrade to unlock AI coaching, broker linking, and more'
                : 'Manage your billing and subscription below'}
            </p>
          </div>
          {effectivePlan === 'free' ? (
            <a
              href="/pricing"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:border-white/20"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
              View Plans
            </a>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:border-white/20"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: portalLoading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
                  cursor: portalLoading ? 'wait' : 'pointer',
                  background: 'transparent',
                }}
              >
                {portalLoading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Opening…</>
                  : <><ExternalLink className="w-3.5 h-3.5" />Billing Portal</>}
              </button>
              {portalError && (
                <p className="text-xs" style={{ color: '#ff6b6b' }}>{portalError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Referral */}
      <div className="rounded-xl p-6 space-y-4" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 flex-shrink-0" style={{ color: G }} />
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Referral Program</p>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Share your code and earn rewards when friends subscribe.</p>
        {referralCode ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2.5 rounded-lg font-mono text-sm tracking-widest" style={{ background: `${G}10`, border: `1px solid ${G}30`, color: G }}>
              {referralCode}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium flex-shrink-0 transition-all"
              style={{ background: copied ? `${G}20` : 'rgba(255,255,255,0.05)', color: copied ? G : 'rgba(255,255,255,0.6)', border: `1px solid ${copied ? `${G}40` : 'rgba(255,255,255,0.1)'}` }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Generating your code…</div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Referrals</p>
            <p className="text-xl font-bold">{referralEarnings.referral_count ?? 0}</p>
          </div>
          <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Earnings</p>
            <p className="text-xl font-bold" style={{ color: G }}>${(referralEarnings.total ?? 0).toFixed(2)}</p>
          </div>
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
        <Link
          to="/forgot-password"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-white/[0.03]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <KeyRound className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Change Password</span>
        </Link>
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

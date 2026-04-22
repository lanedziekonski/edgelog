import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth, PLANS } from '../context/AuthContext';
import { api } from '../services/api';

const G = '#00ff41';

export default function Profile({ onNavigate, onSignUp, onLogin }) {
  const { user, token, logout, refreshUser } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [refCode, setRefCode] = useState(null);
  const [earnings, setEarnings] = useState({ total_earned: 0, referral_count: 0, payment_count: 0, recent: [] });
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!token) return;
    api.getMyReferralCode(token).then(d => setRefCode(d.code)).catch(() => {});
    api.getReferralEarnings(token).then(d => setEarnings(d)).catch(() => {});
  }, [token]);

  const copyCode = () => {
    if (!refCode) return;
    navigator.clipboard.writeText(refCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const plan = PLANS[user?.plan] || PLANS.free;
  const PLAN_ORDER = ['free', 'trader', 'pro', 'elite'];
  const planIdx = PLAN_ORDER.indexOf(user?.plan || 'free');

  const handlePortalClick = async () => {
    setPortalError('');
    setPortalLoading(true);
    try {
      const authToken = localStorage.getItem('traderascend_token');
      if (!authToken) {
        throw new Error('Not authenticated. Please log in again.');
      }
      const API_URL = import.meta.env.VITE_API_URL || 'https://edgelog.onrender.com';
      const res = await fetch(`${API_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error('No active subscription found. Please subscribe to a paid plan first.');
        }
        if (res.status === 503) {
          throw new Error('Stripe is not configured on this server.');
        }
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      if (!data.url) {
        throw new Error('No portal URL returned from server.');
      }
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const FEATURES = [
    { label: 'Trade Journal', plan: 'free' },
    { label: 'Dashboard & Stats', plan: 'free' },
    { label: 'Calendar View', plan: 'free' },
    { label: 'Account Tracking', plan: 'trader' },
    { label: 'AI Plan Builder', plan: 'pro' },
    { label: 'AI Coach', plan: 'elite' },
  ];

  return (
    <div style={{ background: '#080c08', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          animate={{ opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 4, right: 12,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 52, fontWeight: 900, color: G,
            letterSpacing: 4, userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
          }}
        >
          PROFILE
        </motion.div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#fff', lineHeight: 1 }}>
          Profile
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, marginBottom: 16 }}>
          Account &amp; subscription
        </div>
      </div>

      <div style={{ padding: '0 16px 80px' }}>
        {/* Guest sign-up prompt */}
        {!user && onSignUp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: `linear-gradient(135deg, ${G}0d, ${G}05)`,
              border: `1px solid ${G}30`,
              borderRadius: 14, padding: '20px 16px', marginBottom: 14,
              textAlign: 'center',
            }}
          >
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22, fontWeight: 700, letterSpacing: '1px',
              color: '#fff', marginBottom: 6,
            }}>
              Trader<span style={{ color: G }}>Ascend</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18, lineHeight: 1.5 }}>
              Create a free account to save your trades,<br />unlock AI tools, and track your progress.
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onSignUp}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 10,
                background: G, color: '#000', border: 'none',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16, fontWeight: 800, letterSpacing: '1.5px',
                cursor: 'pointer', marginBottom: 10,
                boxShadow: `0 0 20px ${G}40`,
              }}
            >
              CREATE FREE ACCOUNT
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onLogin}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Barlow', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </motion.button>
          </motion.div>
        )}

        {/* Authenticated content */}
        {user && <>
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '16px 16px', marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar with gradient border */}
            <div style={{
              width: 52, height: 52, borderRadius: 26,
              background: `linear-gradient(135deg, ${plan.color}44, ${plan.color}11)`,
              border: `2px solid ${plan.color}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22, fontWeight: 700, color: plan.color,
              flexShrink: 0,
              boxShadow: `0 0 16px ${plan.color}30`,
            }}>
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>
                {user?.name || 'Trader'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: `${plan.color}18`, color: plan.color,
              border: `1px solid ${plan.color}40`,
              letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
            }}>
              {plan.name}
            </span>
          </div>
        </motion.div>

        {/* Plan section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          style={{
            background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
            Your Plan
          </div>

          {/* Plan tier pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {PLAN_ORDER.map((p, i) => {
              const pData = PLANS[p];
              const isActive = p === (user?.plan || 'free');
              const isUnlocked = i <= planIdx;
              return (
                <div
                  key={p}
                  style={{
                    borderRadius: 10, padding: '10px 12px',
                    background: isActive ? `${pData.color}18` : 'rgba(255,255,255,0.03)',
                    border: isActive ? `1px solid ${pData.color}50` : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: isUnlocked ? pData.color : 'rgba(255,255,255,0.25)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.5px' }}>
                    {pData.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: plan.color }}>
              {plan.name} Plan
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onNavigate('pricing')}
              style={{
                padding: '9px 16px', borderRadius: 8,
                background: plan.color, color: '#000',
                fontWeight: 700, fontSize: 13,
                border: 'none', cursor: 'pointer', fontFamily: 'Barlow',
                boxShadow: `0 0 16px ${plan.color}40`,
              }}
            >
              {user?.plan === 'elite' ? 'View Plans' : 'Upgrade'}
            </motion.button>
          </div>
        </motion.div>

        {/* Feature access */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
          style={{
            background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
            Feature Access
          </div>
          {FEATURES.map((f, i) => {
            const fPlanIdx = PLAN_ORDER.indexOf(f.plan);
            const unlocked = planIdx >= fPlanIdx;
            const fPlan = PLANS[f.plan];
            return (
              <div
                key={f.label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingBottom: i < FEATURES.length - 1 ? 10 : 0,
                  marginBottom: i < FEATURES.length - 1 ? 10 : 0,
                  borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: unlocked ? G : 'rgba(255,255,255,0.15)',
                    boxShadow: unlocked ? `0 0 6px ${G}` : 'none',
                  }} />
                  <span style={{ fontSize: 13, color: unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)' }}>
                    {f.label}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: unlocked ? fPlan.color : 'rgba(255,255,255,0.2)',
                  letterSpacing: '0.3px',
                }}>
                  {unlocked ? '✓' : fPlan.name}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Referral Program — only shown if this user has been assigned a code */}
        {refCode && <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17, duration: 0.3 }}
          style={{
            background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>🎁</span>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Referral Program
            </div>
          </div>

          {/* Code box */}
          <div style={{
            background: `${G}07`, border: `1px solid ${G}22`,
            borderRadius: 10, padding: '12px 14px', marginBottom: 12,
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              Your Referral Code
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 24, fontWeight: 800, color: G, letterSpacing: '3px',
              }}>
                {refCode || '———'}
              </span>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={copyCode}
                disabled={!refCode}
                style={{
                  padding: '5px 14px', borderRadius: 7,
                  background: copied ? `${G}20` : 'rgba(255,255,255,0.08)',
                  color: copied ? G : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${copied ? G + '40' : 'rgba(255,255,255,0.12)'}`,
                  fontSize: 12, fontWeight: 700, cursor: refCode ? 'pointer' : 'default',
                  fontFamily: 'Barlow', transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Code'}
              </motion.button>
            </div>
          </div>

          {/* Earnings row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Referral Earnings</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                {earnings.referral_count} referral{earnings.referral_count !== 1 ? 's' : ''}
                {earnings.payment_count > 0 && ` · ${earnings.payment_count} payment${earnings.payment_count !== 1 ? 's' : ''}`}
              </div>
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 26, fontWeight: 800,
              color: earnings.total_earned > 0 ? G : 'rgba(255,255,255,0.25)',
            }}>
              ${(earnings.total_earned || 0).toFixed(2)}
            </div>
          </div>

          {/* Explainer */}
          <div style={{
            fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.65,
            padding: '9px 11px', background: `${G}05`,
            borderRadius: 8, border: `1px solid ${G}10`,
          }}>
            Share your code with other traders — they get <span style={{ color: G, fontWeight: 700 }}>20% off</span> their first 3 months on a monthly plan, or <span style={{ color: G, fontWeight: 700 }}>20% off</span> their entire first year on an annual plan. You earn <span style={{ color: G, fontWeight: 700 }}>15%</span> of whatever they pay during that discounted period.
          </div>
        </motion.div>}

        {/* Billing */}
        {user?.plan !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3 }}
            style={{
              background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
              Billing
            </div>
            {portalError && (
              <div style={{
                background: 'rgba(255,45,45,0.1)', border: '1px solid rgba(255,45,45,0.3)',
                borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#ff2d2d', marginBottom: 12,
              }}>
                {portalError}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
              Manage your subscription, update payment method, download invoices, or cancel via Stripe's secure billing portal.
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handlePortalClick}
              disabled={portalLoading}
              style={{
                width: '100%', padding: '11px', borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600, fontSize: 14, cursor: portalLoading ? 'default' : 'pointer', fontFamily: 'Barlow',
                opacity: portalLoading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{portalLoading ? 'Opening portal…' : 'Manage Subscription'}</span>
              <span style={{ color: G }}>›</span>
            </motion.button>
          </motion.div>
        )}

        {/* Legal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          style={{
            background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
            Legal
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => { window.location.href = href; }}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 8,
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'Barlow',
                  textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <span>{label}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.3 }}
          style={{
            background: '#111811', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
            Account
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={logout}
            style={{
              width: '100%', padding: '11px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(255,45,45,0.35)',
              color: '#ff2d2d', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'Barlow',
            }}
          >
            Sign Out
          </motion.button>
        </motion.div>
        </>}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth, PLANS } from '../context/AuthContext';
import { api } from '../services/api';

const G = '#00ff41';

export default function Profile({ onNavigate }) {
  const { user, token, logout, refreshUser } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  const plan = PLANS[user?.plan] || PLANS.free;
  const PLAN_ORDER = ['free', 'trader', 'pro', 'elite'];
  const planIdx = PLAN_ORDER.indexOf(user?.plan || 'free');

  const handleBillingPortal = async () => {
    setPortalError('');
    setPortalLoading(true);
    try {
      const data = await api.createPortalSession(token);
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err.message.includes('not configured')
        ? 'Stripe is not configured on this server.'
        : err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const FEATURES = [
    { label: 'Trade Journal', plan: 'free' },
    { label: 'Dashboard & Stats', plan: 'free' },
    { label: 'Calendar View', plan: 'trader' },
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
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {pData.price === 0 ? 'Free' : `$${pData.price}/mo`}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: plan.color }}>
                {plan.name} Plan
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
              </div>
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
              whileTap={{ scale: 0.97 }}
              onClick={handleBillingPortal}
              disabled={portalLoading}
              style={{
                width: '100%', padding: '11px', borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Barlow',
                opacity: portalLoading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{portalLoading ? 'Opening portal…' : 'Open Billing Portal'}</span>
              <span style={{ color: G }}>›</span>
            </motion.button>
          </motion.div>
        )}

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.3 }}
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
      </div>
    </div>
  );
}

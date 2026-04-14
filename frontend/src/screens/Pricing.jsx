import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth, PLANS } from '../context/AuthContext';
import { api } from '../services/api';

const G   = '#00ff41';
const BG  = '#080c08';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: 'Start tracking your edge',
    color: '#888888',
    features: [
      { label: 'Unlimited trade journal entries', ok: true },
      { label: 'Dashboard & performance stats', ok: true },
      { label: 'Calendar view', ok: true },
      { label: 'Daily journal (pre/post market)', ok: true },
      { label: 'Account tracking (Apex, FTMO…)', ok: false },
      { label: 'AI Plan Builder', ok: false },
      { label: 'AI Coach sessions', ok: false },
    ],
  },
  {
    id: 'trader',
    name: 'Trader',
    price: 19.99,
    tagline: 'For serious part-time traders',
    color: '#6c63ff',
    features: [
      { label: 'Everything in Free', ok: true },
      { label: 'Account tracking (Apex, FTMO, tastytrade)', ok: true },
      { label: 'Daily loss & drawdown monitoring', ok: true },
      { label: 'Profit target progress', ok: true },
      { label: 'CSV trade import', ok: true },
      { label: 'AI Plan Builder', ok: false },
      { label: 'AI Coach sessions', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49.99,
    tagline: 'Build and refine your edge',
    color: '#f0a500',
    popular: true,
    features: [
      { label: 'Everything in Trader', ok: true },
      { label: 'AI trading plan builder', ok: true },
      { label: 'Guided setup-by-setup rules', ok: true },
      { label: 'Risk & psychology framework', ok: true },
      { label: 'Edit and refine your plan anytime', ok: true },
      { label: 'AI Coach sessions', ok: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99.99,
    tagline: 'Full AI coaching suite',
    color: '#00f07a',
    features: [
      { label: 'Everything in Pro', ok: true },
      { label: 'AI pre-market coaching sessions', ok: true },
      { label: 'AI post-market trade review', ok: true },
      { label: 'Emotional pattern analysis', ok: true },
      { label: 'Rule-following score tracking', ok: true },
      { label: 'Personalised daily coaching', ok: true },
    ],
  },
];

export default function Pricing({ onClose }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState('');

  const currentPlan = user?.plan || 'free';
  const PLAN_ORDER  = ['free', 'trader', 'pro', 'elite'];

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return;
    setError('');
    setLoading(planId);
    try {
      const data = await api.createCheckoutSession(token, planId);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message.includes('not configured')
        ? 'Stripe payments are not yet configured on this server.'
        : err.message);
      setLoading(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: BG,
      overflowY: 'auto', overflowX: 'hidden',
      zIndex: 200, maxWidth: 480, margin: '0 auto',
    }}>
      {/* Grid texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(${G}03 1px, transparent 1px), linear-gradient(90deg, ${G}03 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {/* Top glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${G}0c 0%, transparent 65%)`,
      }} />

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: `${BG}ee`,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid rgba(255,255,255,0.07)`,
        padding: '16px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 24, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fff',
            lineHeight: 1,
          }}>
            Upgrade Your <span style={{ color: G }}>Edge</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.3px' }}>
            Current plan:{' '}
            <span style={{ color: PLANS[currentPlan]?.color || '#888', fontWeight: 700 }}>
              {PLANS[currentPlan]?.name}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, color: 'rgba(255,255,255,0.45)',
            padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Barlow',
            transition: 'border-color 0.15s, color 0.15s',
          }}>
            ✕ Close
          </button>
        )}
      </div>

      <div style={{ padding: '20px 16px 40px', position: 'relative', zIndex: 1 }}>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(255,45,45,0.1)', border: '1px solid rgba(255,45,45,0.35)',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 13, color: '#ff4444', marginBottom: 16, lineHeight: 1.5,
            }}
          >{error}</motion.div>
        )}

        {TIERS.map((tier, idx) => {
          const isCurrent  = tier.id === currentPlan;
          const isDowngrade = PLAN_ORDER.indexOf(tier.id) < PLAN_ORDER.indexOf(currentPlan);
          const isPopular  = tier.popular && !isCurrent;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.3, ease: 'easeOut' }}
              style={{
                background: '#0d140d',
                border: isCurrent
                  ? `2px solid ${tier.color}`
                  : isPopular
                  ? `1px solid ${tier.color}60`
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '20px 18px',
                marginBottom: 14, position: 'relative',
                boxShadow: isCurrent
                  ? `0 0 32px ${tier.color}20`
                  : isPopular
                  ? `0 0 24px ${tier.color}14`
                  : 'none',
              }}
            >
              {/* Badge */}
              {(isCurrent || isPopular) && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: tier.color, color: '#000',
                  fontSize: 10, fontWeight: 800,
                  padding: '3px 14px', borderRadius: 20,
                  letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  boxShadow: `0 0 12px ${tier.color}60`,
                }}>
                  {isCurrent ? '✓ Current Plan' : 'Most Popular'}
                </div>
              )}

              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 24, fontWeight: 800, color: tier.color,
                    letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4,
                  }}>{tier.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{tier.tagline}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {tier.price === 0 ? (
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1,
                    }}>Free</div>
                  ) : (
                    <div style={{ lineHeight: 1 }}>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 30, fontWeight: 800, color: '#fff',
                      }}>${tier.price}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: 18 }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 0',
                    borderBottom: i < tier.features.length - 1
                      ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{
                      fontSize: 13, flexShrink: 0, lineHeight: 1, fontWeight: 700,
                      color: f.ok ? tier.color : 'rgba(255,255,255,0.15)',
                    }}>
                      {f.ok ? '✓' : '✗'}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: f.ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)',
                    }}>{f.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrent ? (
                <div style={{
                  textAlign: 'center', padding: '11px',
                  borderRadius: 10,
                  background: `${tier.color}14`,
                  border: `1px solid ${tier.color}40`,
                  fontSize: 13, fontWeight: 800,
                  color: tier.color, letterSpacing: '0.5px',
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}>✓ Active Plan</div>
              ) : tier.id === 'free' ? (
                isDowngrade && (
                  <div style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.25)',
                    textAlign: 'center', padding: '8px 0',
                  }}>
                    Manage billing in Profile → Billing Portal
                  </div>
                )
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={!!loading}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: 10,
                    background: loading === tier.id
                      ? 'rgba(255,255,255,0.08)'
                      : isPopular
                      ? tier.color
                      : 'transparent',
                    color: isPopular && loading !== tier.id ? '#000' : tier.color,
                    fontWeight: 800, fontSize: 14, border: 'none',
                    cursor: loading ? 'default' : 'pointer',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: '1px', textTransform: 'uppercase',
                    opacity: loading && loading !== tier.id ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                    ...(isPopular && loading !== tier.id
                      ? { boxShadow: `0 0 20px ${tier.color}40` }
                      : { border: `1px solid ${tier.color}50` }),
                  }}
                >
                  {loading === tier.id
                    ? 'Redirecting…'
                    : isDowngrade
                    ? `Downgrade to ${tier.name}`
                    : `Upgrade to ${tier.name} — $${tier.price}/mo`}
                </motion.button>
              )}
            </motion.div>
          );
        })}

        <div style={{
          textAlign: 'center', fontSize: 11,
          color: 'rgba(255,255,255,0.18)', marginTop: 4, lineHeight: 1.8,
          letterSpacing: '0.3px',
        }}>
          All paid plans billed monthly · Cancel anytime<br />
          Secure payments via Stripe
        </div>
      </div>
    </div>
  );
}

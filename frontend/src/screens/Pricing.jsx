import React, { useState } from 'react';
import { useAuth, PLANS } from '../context/AuthContext';
import { api } from '../services/api';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: 'Get started, no card needed',
    color: '#888888',
    features: [
      { label: 'Trade journal (unlimited logs)', included: true },
      { label: 'Dashboard & performance stats', included: true },
      { label: 'Calendar view', included: true },
      { label: 'Account tracking (Apex, FTMO, etc.)', included: false },
      { label: 'AI trading plan builder', included: false },
      { label: 'AI pre-market coaching', included: false },
      { label: 'AI post-market review', included: false },
      { label: 'Emotional & rule-following analysis', included: false },
    ],
  },
  {
    id: 'trader',
    name: 'Trader',
    price: 19.99,
    tagline: 'For serious part-time traders',
    color: '#6c63ff',
    popular: false,
    features: [
      { label: 'Everything in Free', included: true },
      { label: 'Account tracking (Apex, FTMO, tastytrade)', included: true },
      { label: 'Brokerage account sync (auto-import trades)', included: true },
      { label: 'Daily loss & drawdown monitoring', included: true },
      { label: 'Profit target progress tracking', included: true },
      { label: 'AI trading plan builder', included: false },
      { label: 'AI pre-market coaching', included: false },
      { label: 'AI post-market review', included: false },
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
      { label: 'Everything in Trader', included: true },
      { label: 'AI trading plan builder', included: true },
      { label: 'Setup-by-setup guidance', included: true },
      { label: 'Risk & psychology framework builder', included: true },
      { label: 'AI pre-market coaching', included: false },
      { label: 'AI post-market review', included: false },
      { label: 'Emotional tracking analysis', included: false },
      { label: 'Rule-following AI analysis', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99.99,
    tagline: 'Full AI coaching suite',
    color: '#00f07a',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'AI pre-market coaching sessions', included: true },
      { label: 'AI post-market review', included: true },
      { label: 'Emotional pattern analysis', included: true },
      { label: 'Rule-following score analysis', included: true },
      { label: 'Personalised daily coaching', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function Pricing({ onClose }) {
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const currentPlan = user?.plan || 'free';

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return;
    if (planId === currentPlan) return;

    setError('');
    setLoading(planId);

    try {
      const data = await api.createCheckoutSession(token, planId);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message.includes('not configured')
        ? 'Stripe payments are not yet configured on this server. Add your Stripe keys to backend/.env to enable billing.'
        : err.message);
      setLoading(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      overflowY: 'auto',
      overflowX: 'hidden',
      zIndex: 200,
      maxWidth: 480,
      margin: '0 auto',
      paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 24,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Plans & Pricing
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Current plan: <span style={{ color: PLANS[currentPlan]?.color || '#888', fontWeight: 700 }}>
              {PLANS[currentPlan]?.name}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Barlow',
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {error && (
          <div style={{
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--red)',
            marginBottom: 16,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {TIERS.map(tier => {
          const isCurrent = tier.id === currentPlan;
          const isDowngrade = ['free', 'trader', 'pro', 'elite'].indexOf(tier.id) < ['free', 'trader', 'pro', 'elite'].indexOf(currentPlan);

          return (
            <div
              key={tier.id}
              style={{
                background: 'var(--card)',
                border: isCurrent
                  ? `2px solid ${tier.color}`
                  : tier.popular
                  ? `1px solid ${tier.color}55`
                  : '1px solid var(--border)',
                borderRadius: 14,
                padding: '20px 16px',
                marginBottom: 12,
                position: 'relative',
              }}
            >
              {/* Popular badge */}
              {tier.popular && !isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: -11,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: tier.color,
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 20,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: -11,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: tier.color,
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 20,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  ✓ Current Plan
                </div>
              )}

              {/* Plan header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: tier.color,
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    marginBottom: 4,
                  }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tier.tagline}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {tier.price === 0 ? (
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                      Free
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                        ${tier.price}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: 16 }}>
                {tier.features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 0',
                      borderBottom: i < tier.features.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: 13,
                      color: f.included ? tier.color : 'var(--text-muted)',
                      flexShrink: 0,
                      lineHeight: 1,
                    }}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: f.included ? 'var(--text)' : 'var(--text-muted)',
                    }}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrent ? (
                <div style={{
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: 8,
                  background: `${tier.color}18`,
                  border: `1px solid ${tier.color}44`,
                  fontSize: 13,
                  fontWeight: 700,
                  color: tier.color,
                  letterSpacing: '0.3px',
                }}>
                  ✓ Active Plan
                </div>
              ) : tier.id === 'free' ? (
                isDowngrade && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                    Manage billing in Profile → Billing Portal
                  </div>
                )
              ) : (
                <button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={!!loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    background: loading === tier.id ? 'var(--border)' : tier.color,
                    color: '#000',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: loading ? 'default' : 'pointer',
                    fontFamily: 'Barlow',
                    letterSpacing: '0.3px',
                    opacity: loading && loading !== tier.id ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {loading === tier.id
                    ? 'Redirecting to Stripe…'
                    : isDowngrade
                    ? `Downgrade to ${tier.name}`
                    : `Upgrade to ${tier.name} — $${tier.price}/mo`}
                </button>
              )}
            </div>
          );
        })}

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
          All paid plans billed monthly · Cancel anytime · Secure payments via Stripe
        </div>
      </div>
    </div>
  );
}

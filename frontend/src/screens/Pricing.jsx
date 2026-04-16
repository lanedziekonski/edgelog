import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, PLANS } from '../context/AuthContext';
import { api } from '../services/api';

const G   = '#00ff41';
const BG  = '#080c08';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    annualPerMonth: 0,
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
    monthlyPrice: 9.99,
    annualPrice: 89.91,
    annualPerMonth: 7.49,
    annualSavings: 25,
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
    monthlyPrice: 24.99,
    annualPrice: 224.91,
    annualPerMonth: 18.74,
    annualSavings: 25,
    tagline: 'Build and refine your edge',
    color: '#f0a500',
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
    monthlyPrice: 49.99,
    annualPrice: 449.91,
    annualPerMonth: 37.49,
    annualSavings: 25,
    tagline: 'Full AI coaching suite',
    color: '#00f07a',
    popular: true,
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
  const [billing, setBilling]   = useState('monthly');
  const [loading, setLoading]   = useState(null);
  const [error, setError]       = useState('');
  const [refCode, setRefCode]   = useState('');
  const [refLoading, setRefLoading] = useState(false);
  const [refStatus, setRefStatus]   = useState(null); // null | 'valid' | 'invalid' | 'used' | 'own' | 'error'
  const [refMsg, setRefMsg]         = useState('');

  const currentPlan = user?.plan || 'free';
  const PLAN_ORDER  = ['free', 'trader', 'pro', 'elite'];

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return;
    setError('');
    setLoading(planId);
    try {
      const data = await api.createCheckoutSession(token, planId, billing);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message.includes('not configured')
        ? 'Stripe payments are not yet configured on this server.'
        : err.message);
      setLoading(null);
    }
  };

  const handleApplyRef = async () => {
    if (!refCode.trim()) return;
    setRefLoading(true);
    setRefStatus(null);
    try {
      const vData = await api.validateReferralCode(refCode.trim().toUpperCase());
      if (!vData.valid) { setRefStatus('invalid'); setRefMsg('That code doesn\'t exist. Check and try again.'); setRefLoading(false); return; }
      if (!token) { setRefStatus('error'); setRefMsg('Sign in to apply a referral code.'); setRefLoading(false); return; }
      await api.applyReferralCode(token, refCode.trim().toUpperCase(), billing);
      setRefStatus('valid');
      setRefMsg(billing === 'annual'
        ? '20% off your first year has been applied!'
        : '20% off your first 3 months has been applied!');
    } catch (err) {
      if (err.message.includes('own')) { setRefStatus('own'); setRefMsg("You can't use your own referral code."); }
      else if (err.message.includes('already')) { setRefStatus('used'); setRefMsg('You\'ve already used a referral code.'); }
      else { setRefStatus('error'); setRefMsg(err.message); }
    } finally {
      setRefLoading(false);
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
        padding: '14px 16px 12px',
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
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, letterSpacing: '0.3px' }}>
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
          }}>
            ✕ Close
          </button>
        )}
      </div>

      <div style={{ padding: '16px 16px 40px', position: 'relative', zIndex: 1 }}>

        {/* Monthly / Annual toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 50, padding: 3,
          }}>
            {[['monthly', 'Monthly'], ['annual', 'Annual']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setBilling(val)}
                style={{
                  padding: '7px 20px', borderRadius: 50,
                  fontSize: 13, fontWeight: 700,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.8px', textTransform: 'uppercase',
                  background: billing === val ? G : 'transparent',
                  color: billing === val ? '#000' : 'rgba(255,255,255,0.45)',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  boxShadow: billing === val ? `0 0 16px ${G}50` : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {label}
                {val === 'annual' && billing !== 'annual' && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
                    background: `${G}25`, color: G, border: `1px solid ${G}40`,
                    letterSpacing: '0.5px',
                  }}>SAVE 25%</span>
                )}
              </button>
            ))}
          </div>
        </div>

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
          const showPrice  = billing === 'annual' && tier.monthlyPrice > 0;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.28, ease: 'easeOut' }}
              style={{
                background: '#0d140d',
                border: isCurrent
                  ? `2px solid ${tier.color}`
                  : isPopular
                  ? `1.5px solid ${G}70`
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '20px 18px',
                marginBottom: 14, position: 'relative',
                boxShadow: isCurrent
                  ? `0 0 32px ${tier.color}20`
                  : isPopular
                  ? `0 0 30px ${G}18`
                  : 'none',
              }}
            >
              {/* Badge */}
              {(isCurrent || isPopular) && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: isPopular ? G : tier.color, color: '#000',
                  fontSize: 10, fontWeight: 800,
                  padding: '3px 14px', borderRadius: 20,
                  letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  boxShadow: `0 0 14px ${isPopular ? G : tier.color}70`,
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
                  {tier.monthlyPrice === 0 ? (
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1,
                    }}>Free</div>
                  ) : showPrice ? (
                    <div style={{ position: 'relative' }}>
                      {/* Annual savings badge */}
                      {tier.annualSavings && (
                        <div style={{
                          position: 'absolute', top: -20, right: 0,
                          background: `${G}20`, color: G,
                          fontSize: 9, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 20,
                          border: `1px solid ${G}40`, letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                        }}>
                          SAVE {tier.annualSavings}%
                        </div>
                      )}
                      <div style={{ lineHeight: 1 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>only </span>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 30, fontWeight: 800, color: '#fff',
                        }}>${tier.annualPerMonth}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/mo</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                        billed ${tier.annualPrice}/year
                      </div>
                    </div>
                  ) : (
                    <div style={{ lineHeight: 1 }}>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 30, fontWeight: 800, color: '#fff',
                      }}>${tier.monthlyPrice}</span>
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
                      color: f.ok ? G : 'rgba(255,255,255,0.15)',
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
                      ? G
                      : 'transparent',
                    color: isPopular && loading !== tier.id ? '#000' : tier.color,
                    fontWeight: 800, fontSize: 14, border: 'none',
                    cursor: loading ? 'default' : 'pointer',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: '1px', textTransform: 'uppercase',
                    opacity: loading && loading !== tier.id ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                    ...(isPopular && loading !== tier.id
                      ? { boxShadow: `0 0 20px ${G}40` }
                      : { border: `1px solid ${tier.color}50` }),
                  }}
                >
                  {loading === tier.id
                    ? 'Redirecting…'
                    : isDowngrade
                    ? `Downgrade to ${tier.name}`
                    : billing === 'annual'
                    ? `Get ${tier.name} — $${tier.annualPrice}/yr`
                    : `Get ${tier.name} — $${tier.monthlyPrice}/mo`}
                </motion.button>
              )}
            </motion.div>
          );
        })}

        {/* Referral Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          style={{
            background: '#0d140d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '18px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🎁</span>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
              Have a Referral Code?
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, lineHeight: 1.5 }}>
            Get 20% off your first 3 months when you use a friend's code.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: refStatus ? 10 : 0 }}>
            <input
              value={refCode}
              onChange={e => { setRefCode(e.target.value.toUpperCase()); setRefStatus(null); }}
              placeholder="e.g. TAX7K2M1"
              maxLength={10}
              style={{
                flex: 1, background: '#111811',
                border: `1px solid ${refStatus === 'valid' ? G + '60' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8, padding: '10px 12px',
                fontSize: 14, fontWeight: 700,
                color: '#fff', fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '2px', outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && handleApplyRef()}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyRef}
              disabled={refLoading || !refCode.trim() || refStatus === 'valid'}
              style={{
                padding: '10px 18px', borderRadius: 8,
                background: refStatus === 'valid' ? `${G}20` : G,
                color: refStatus === 'valid' ? G : '#000',
                fontWeight: 800, fontSize: 13,
                border: refStatus === 'valid' ? `1px solid ${G}50` : 'none',
                cursor: refLoading || !refCode.trim() || refStatus === 'valid' ? 'default' : 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.5px', flexShrink: 0,
                opacity: refLoading ? 0.6 : 1,
              }}
            >
              {refStatus === 'valid' ? '✓ Applied' : refLoading ? '…' : 'Apply'}
            </motion.button>
          </div>
          <AnimatePresence>
            {refStatus && refMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: 12, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8,
                  background: refStatus === 'valid' ? `${G}12` : 'rgba(255,45,45,0.08)',
                  color: refStatus === 'valid' ? G : '#ff4444',
                  border: `1px solid ${refStatus === 'valid' ? G + '35' : 'rgba(255,45,45,0.3)'}`,
                }}
              >
                {refStatus === 'valid' ? '🎉 ' : '⚠ '}{refMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={{
          textAlign: 'center', fontSize: 11,
          color: 'rgba(255,255,255,0.18)', marginTop: 4, lineHeight: 1.8,
          letterSpacing: '0.3px',
        }}>
          {billing === 'annual' ? 'Annual plans billed once per year' : 'All paid plans billed monthly'} · Cancel anytime<br />
          Secure payments via Stripe
        </div>
      </div>
    </div>
  );
}

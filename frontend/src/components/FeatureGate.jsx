import React from 'react';
import { motion } from 'framer-motion';
import { hasAccess, PLANS } from '../context/AuthContext';

const PLAN_ORDER = ['free', 'trader', 'pro', 'elite'];

export default function FeatureGate({
  requiredPlan,
  userPlan,
  onUpgrade,
  featureName,
  featureDescription,
  featureBullets,
  children,
  inline = false,
}) {
  if (hasAccess(userPlan, requiredPlan)) return children ?? null;

  const plan = PLANS[requiredPlan];

  if (inline) {
    return (
      <div style={{
        background: 'var(--card)',
        border: `1px solid ${plan.color}44`,
        borderRadius: 12,
        padding: '20px 16px',
        textAlign: 'center',
      }}>
        <LockIcon color={plan.color} />
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10, marginBottom: 4 }}>
          {plan.name} Plan Required
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
          {featureDescription || 'Upgrade to unlock this feature.'}
        </div>
        <button
          onClick={onUpgrade}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: plan.color, color: '#000',
            fontWeight: 700, fontSize: 13,
            border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow', letterSpacing: '0.3px',
          }}
        >
          Upgrade to {plan.name}
        </button>
      </div>
    );
  }

  // Full-screen premium lock gate
  return (
    <div style={{ minHeight: '100%', background: '#080c08', display: 'flex', flexDirection: 'column', padding: '0 0 80px', position: 'relative' }}>

      {/* Ambient top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 280,
        background: `radial-gradient(ellipse at 50% -10%, ${plan.color}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px 24px', textAlign: 'center',
      }}>

        {/* Plan tier step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
          {PLAN_ORDER.map((p, i) => {
            const isRequired = p === requiredPlan;
            const isBefore   = PLAN_ORDER.indexOf(p) < PLAN_ORDER.indexOf(requiredPlan);
            const pData      = PLANS[p];
            return (
              <React.Fragment key={p}>
                {i > 0 && (
                  <div style={{
                    width: 28, height: 1,
                    background: isBefore ? `${pData.color}50` : 'rgba(255,255,255,0.08)',
                  }} />
                )}
                <motion.div
                  animate={isRequired
                    ? { boxShadow: [`0 0 0px ${plan.color}00`, `0 0 14px ${plan.color}90`, `0 0 0px ${plan.color}00`] }
                    : {}}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: isRequired ? 13 : 8, height: isRequired ? 13 : 8,
                    borderRadius: '50%', flexShrink: 0,
                    background: isRequired ? pData.color : isBefore ? `${pData.color}50` : 'rgba(255,255,255,0.1)',
                    border: isRequired ? `2px solid ${pData.color}` : 'none',
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Lock icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.05 }}
          style={{
            width: 70, height: 70, borderRadius: 22,
            background: `${plan.color}14`,
            border: `1.5px solid ${plan.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 22,
            boxShadow: `0 0 36px ${plan.color}18`,
          }}
        >
          <LockIcon color={plan.color} size={28} />
        </motion.div>

        {/* Feature name */}
        {featureName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 30, fontWeight: 800,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              color: '#fff', marginBottom: 8, lineHeight: 1,
            }}
          >
            {featureName}
          </motion.div>
        )}

        {/* Plan badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.25 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${plan.color}18`, border: `1px solid ${plan.color}40`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 700,
            color: plan.color, letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: 18,
          }}
        >
          Requires {plan.name} Plan · ${plan.price}/mo
        </motion.div>

        {/* Description */}
        {featureDescription && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17, duration: 0.25 }}
            style={{
              fontSize: 14, color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.65, maxWidth: 300, marginBottom: 24,
            }}
          >
            {featureDescription}
          </motion.div>
        )}

        {/* Feature bullets */}
        {featureBullets && featureBullets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            style={{
              background: '#111811', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '14px 16px',
              width: '100%', maxWidth: 320, marginBottom: 28, textAlign: 'left',
            }}
          >
            {featureBullets.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                paddingBottom: i < featureBullets.length - 1 ? 9 : 0,
                marginBottom: i < featureBullets.length - 1 ? 9 : 0,
                borderBottom: i < featureBullets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: plan.color, boxShadow: `0 0 5px ${plan.color}`,
                }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>{b}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Upgrade CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23, duration: 0.25 }}
          whileTap={{ scale: 0.97 }}
          onClick={onUpgrade}
          style={{
            padding: '14px 0', borderRadius: 12,
            background: plan.color, color: '#000',
            fontWeight: 800, fontSize: 15,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '1.5px', textTransform: 'uppercase',
            boxShadow: `0 4px 28px ${plan.color}45`,
            width: '100%', maxWidth: 320,
          }}
        >
          Upgrade to {plan.name}
        </motion.button>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', marginTop: 12 }}>
          Cancel anytime · Secure payments via Stripe
        </div>
      </div>
    </div>
  );
}

function LockIcon({ color = 'var(--text-secondary)', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

import React from 'react';
import { hasAccess, PLANS } from '../context/AuthContext';

const PLAN_ORDER = ['free', 'trader', 'pro', 'elite'];

export default function FeatureGate({ requiredPlan, userPlan, onUpgrade, children, inline = false }) {
  if (hasAccess(userPlan, requiredPlan)) return children;

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
          Upgrade to unlock this feature.
        </div>
        <button
          onClick={onUpgrade}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: plan.color,
            color: requiredPlan === 'elite' || requiredPlan === 'trader' ? '#000' : '#000',
            fontWeight: 700,
            fontSize: 13,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Barlow',
            letterSpacing: '0.3px',
          }}
        >
          Upgrade to {plan.name}
        </button>
      </div>
    );
  }

  // Full-screen lock overlay for tab-level gating
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 32px',
      textAlign: 'center',
      minHeight: '60vh',
    }}>
      {/* Plan tier dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {PLAN_ORDER.map(p => {
          const isRequired = p === requiredPlan;
          const isPassed = PLAN_ORDER.indexOf(p) <= PLAN_ORDER.indexOf(requiredPlan);
          return (
            <div
              key={p}
              style={{
                width: isRequired ? 10 : 8,
                height: isRequired ? 10 : 8,
                borderRadius: '50%',
                background: isRequired ? PLANS[p].color : isPassed ? `${PLANS[p].color}66` : 'var(--border)',
                transition: 'background 0.2s',
              }}
            />
          );
        })}
      </div>

      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: `${plan.color}18`,
        border: `1.5px solid ${plan.color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <LockIcon color={plan.color} />
      </div>

      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 8,
        letterSpacing: '0.5px',
      }}>
        {plan.name} Plan
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, maxWidth: 260 }}>
        This feature is available on the <strong style={{ color: plan.color }}>{plan.name}</strong> plan
        {plan.price > 0 ? ` — $${plan.price}/mo` : ''}.
      </div>

      <button
        onClick={onUpgrade}
        style={{
          padding: '13px 28px',
          borderRadius: 10,
          background: plan.color,
          color: '#000',
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Barlow',
          letterSpacing: '0.3px',
          boxShadow: `0 4px 20px ${plan.color}40`,
        }}
      >
        Upgrade to {plan.name}
      </button>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
        Cancel anytime
      </div>
    </div>
  );
}

function LockIcon({ color = 'var(--text-secondary)' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

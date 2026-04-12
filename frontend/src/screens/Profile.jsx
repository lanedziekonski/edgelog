import React, { useState } from 'react';
import { useAuth, PLANS } from '../context/AuthContext';
import { api } from '../services/api';

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

  return (
    <div>
      <div className="screen-header">
        <div className="screen-title">Profile</div>
        <div className="screen-subtitle">Account & subscription</div>
      </div>

      {/* User card */}
      <div className="section" style={{ paddingTop: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: `${plan.color}22`,
              border: `2px solid ${plan.color}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: plan.color,
              flexShrink: 0,
            }}>
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Trader'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              background: `${plan.color}22`,
              color: plan.color,
              border: `1px solid ${plan.color}44`,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {plan.name}
            </span>
          </div>
        </div>
      </div>

      {/* Plan progress */}
      <div className="section" style={{ paddingTop: 16 }}>
        <div className="section-label">Your Plan</div>
        <div className="card">
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {PLAN_ORDER.map((p, i) => (
              <div
                key={p}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: i <= planIdx ? PLANS[p].color : 'var(--border)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: plan.color }}>
                {plan.name} Plan
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
              </div>
            </div>
            <button
              onClick={() => onNavigate('pricing')}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: plan.color,
                color: '#000',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Barlow',
              }}
            >
              {user?.plan === 'elite' ? 'View Plans' : 'Upgrade'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature access overview */}
      <div className="section" style={{ paddingTop: 16 }}>
        <div className="section-label">Feature Access</div>
        <div className="card">
          {[
            { label: 'Trade Journal', plan: 'free' },
            { label: 'Dashboard & Stats', plan: 'free' },
            { label: 'Calendar View', plan: 'trader' },
            { label: 'Account Tracking', plan: 'trader' },
            { label: 'AI Plan Builder', plan: 'pro' },
            { label: 'AI Coach', plan: 'elite' },
          ].map((f, i, arr) => {
            const fPlanIdx = PLAN_ORDER.indexOf(f.plan);
            const unlocked = planIdx >= fPlanIdx;
            const fPlan = PLANS[f.plan];
            return (
              <div key={f.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: i < arr.length - 1 ? 10 : 0,
                marginBottom: i < arr.length - 1 ? 10 : 0,
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: unlocked ? 'var(--text)' : 'var(--text-muted)' }}>
                  {f.label}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: unlocked ? fPlan.color : 'var(--text-muted)',
                  letterSpacing: '0.3px',
                }}>
                  {unlocked ? '✓ Unlocked' : fPlan.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing */}
      {user?.plan !== 'free' && (
        <div className="section" style={{ paddingTop: 16 }}>
          <div className="section-label">Billing</div>
          <div className="card">
            {portalError && (
              <div style={{
                background: 'var(--red-dim)',
                border: '1px solid var(--red)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--red)',
                marginBottom: 12,
              }}>
                {portalError}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
              Manage your subscription, update payment method, download invoices, or cancel via Stripe's secure billing portal.
            </div>
            <button
              onClick={handleBillingPortal}
              disabled={portalLoading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'Barlow',
                opacity: portalLoading ? 0.6 : 1,
              }}
            >
              {portalLoading ? 'Opening portal…' : 'Open Billing Portal →'}
            </button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="section" style={{ paddingTop: 16 }}>
        <div className="section-label">Account</div>
        <div className="card">
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'Barlow',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

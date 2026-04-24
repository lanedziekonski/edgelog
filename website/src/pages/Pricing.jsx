import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession, validateReferralCode } from '../lib/stripe';
import PageHeading from '../components/ui/PageHeading';
import SectionHeading from '../components/ui/SectionHeading';
import BillingToggle from '../components/pricing/BillingToggle';
import PricingCard from '../components/pricing/PricingCard';
import PricingFAQ from '../components/pricing/PricingFAQ';
import CTABanner from '../components/ui/CTABanner';
import GridBackground from '../components/effects/GridBackground';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import FadeUp from '../components/effects/FadeUp';
import { tiers } from '../data/pricing';

const G = '#00ff41';

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');

  // Referral state
  const [refInput, setRefInput]     = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [refStatus, setRefStatus]   = useState(null); // null | 'valid' | 'error'
  const [refMsg, setRefMsg]         = useState('');
  const [refLoading, setRefLoading] = useState(false);

  // Checkout state (per-card)
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [errorPlan, setErrorPlan]     = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const { token } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  // Capture resume intent once on mount — navigation state is ephemeral
  const resumeIntent = useRef(location.state?.resumeCheckout || null);
  const hasResumed   = useRef(false);

  // Helper: build referral confirmation message from current billing
  const refConfirmMsg = (b) => b === 'annual'
    ? '✓ Referral code applied — 20% off your first year'
    : '✓ Referral code applied — 20% off your first 3 months';

  // Keep referral message in sync when billing toggle changes
  useEffect(() => {
    if (refStatus === 'valid') setRefMsg(refConfirmMsg(billing));
  }, [billing]); // eslint-disable-line react-hooks/exhaustive-deps

  const doCheckout = useCallback(async (planId, billingValue, refCode) => {
    setLoadingPlan(planId);
    setCheckoutError('');
    setErrorPlan(null);
    try {
      await createCheckoutSession(planId, billingValue, refCode, token);
      // If we reach here the redirect didn't happen (shouldn't occur normally)
    } catch (err) {
      const msg = typeof err?.message === 'string' && err.message
        ? err.message
        : 'Unable to start checkout — please try again';
      setCheckoutError(msg);
      setErrorPlan(planId);
      setLoadingPlan(null);
    }
  }, [token]);

  // Auto-resume checkout after post-auth redirect
  useEffect(() => {
    const intent = resumeIntent.current;
    if (!intent || !token || hasResumed.current) return;
    hasResumed.current = true;
    // Strip navigation state so back-button doesn't re-trigger
    window.history.replaceState({}, document.title, '/pricing');
    const intentBilling = intent.billing || 'monthly';
    setBilling(intentBilling);
    if (intent.referralCode) {
      setRefInput(intent.referralCode);
      setAppliedCode(intent.referralCode);
      setRefStatus('valid');
      setRefMsg(refConfirmMsg(intentBilling));
    }
    doCheckout(intent.plan, intentBilling, intent.referralCode || '');
  }, [token, doCheckout]);

  const handleApplyReferral = async () => {
    const code = refInput.trim();
    if (!code) return;
    setRefLoading(true);
    setRefStatus(null);
    setRefMsg('');
    const result = await validateReferralCode(code, token);
    setRefLoading(false);
    if (result.valid) {
      setAppliedCode(code.toUpperCase());
      setRefStatus('valid');
      setRefMsg(refConfirmMsg(billing));
    } else {
      setAppliedCode('');
      setRefStatus('error');
      setRefMsg(result.error || 'Invalid referral code');
    }
  };

  const handleSubscribe = (planId) => {
    // Not logged in — save intent and gate to signup
    if (!token) {
      sessionStorage.setItem('pending_checkout', JSON.stringify({
        plan: planId,
        billing,
        referralCode: appliedCode,
        ts: Date.now(),
      }));
      navigate('/signup');
      return;
    }
    doCheckout(planId, billing, appliedCode);
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <GridBackground intensity={0.05} />
        <AmbientOrbs />
        <div className="relative max-w-7xl mx-auto px-6">
          <PageHeading
            eyebrow="Pricing"
            title="Pick a plan that fits your edge."
            subtitle="Free forever for manual journaling. Unlock broker linking, AI plans, and the AI Coach when you're ready."
            watermark="PRICING"
          />
          <FadeUp delay={0.2} className="mt-4 pb-10 flex justify-center">
            <BillingToggle value={billing} onChange={setBilling} />
          </FadeUp>
        </div>
      </section>

      {/* Referral code input */}
      <section className="pt-10 pb-0">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp delay={0.05}>
            <div className="max-w-sm mx-auto">
              <p className="text-xs font-mono uppercase tracking-widest mb-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Have a referral code?
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refInput}
                  onChange={e => {
                    setRefInput(e.target.value);
                    // Clear validation when user edits the field
                    if (refStatus) { setRefStatus(null); setRefMsg(''); setAppliedCode(''); }
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyReferral()}
                  placeholder="Enter code (e.g. LANETRADES)"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all font-mono tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${refStatus === 'valid' ? `${G}60` : refStatus === 'error' ? 'rgba(255,60,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyReferral}
                  disabled={refLoading || !refInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium flex-shrink-0 transition-all"
                  style={{
                    background: refLoading || !refInput.trim() ? 'rgba(255,255,255,0.04)' : `${G}15`,
                    border: `1px solid ${refLoading || !refInput.trim() ? 'rgba(255,255,255,0.1)' : `${G}40`}`,
                    color: refLoading || !refInput.trim() ? 'rgba(255,255,255,0.3)' : G,
                    cursor: refLoading || !refInput.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {refLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {refMsg && (
                <p
                  className="mt-2 text-xs text-center font-mono"
                  style={{ color: refStatus === 'valid' ? G : '#ff6b6b' }}
                >
                  {refMsg}
                </p>
              )}
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => (
              <FadeUp key={tier.id} delay={i * 0.06}>
                <PricingCard
                  tier={tier}
                  billing={billing}
                  onSubscribe={handleSubscribe}
                  loading={loadingPlan === tier.id}
                  error={errorPlan === tier.id ? checkoutError : null}
                />
              </FadeUp>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted">
            All plans include unlimited trade history, secure cloud storage, and free
            updates.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            subtitle="Can't find what you're looking for? Email hello@traderascend.com — we usually reply within a few hours."
            className="mb-14"
          />
          <PricingFAQ />
        </div>
      </section>

      <CTABanner
        title="Ready to find your edge?"
        subtitle="AI Trading Plan Builder, live broker integrations, and pattern detection — everything serious traders need, in one tool."
        ctaLabel="Go Pro"
      />
    </>
  );
}

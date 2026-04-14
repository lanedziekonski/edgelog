import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth, hasAccess } from './context/AuthContext';
import { AccountFilterProvider, useAccountFilter } from './context/AccountFilterContext';
import BottomNav from './components/BottomNav';
import FeatureGate from './components/FeatureGate';
import Auth from './screens/Auth';
import Dashboard from './screens/Dashboard';
import Journal from './screens/Journal';
import Calendar from './screens/Calendar';
import Accounts from './screens/Accounts';
import TradingPlan from './screens/TradingPlan';
import AICoach from './screens/AICoach';
import Profile from './screens/Profile';
import Pricing from './screens/Pricing';
import { useTrades } from './hooks/useTrades';
import { useAccounts } from './hooks/useAccounts';

const G = '#00ff41';
const POPUP_KEY = 'ta_signup_popup_shown';

function SignupPopup({ onClose, onSignUp }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 380,
            background: '#0d140d',
            border: `1px solid ${G}30`,
            borderRadius: 20,
            padding: '28px 24px 24px',
            boxShadow: `0 0 60px rgba(0,255,65,0.08), 0 24px 60px rgba(0,0,0,0.7)`,
            position: 'relative',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 16,
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: 22,
              cursor: 'pointer', lineHeight: 1, padding: '2px 6px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
          >×</button>

          {/* Logo */}
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 28, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            Trade<span style={{ color: G }}>Ascend</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 22, lineHeight: 1.4 }}>
            Your AI-powered trading journal. Track every trade, spot every pattern.
          </div>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              'Trade journal with P&L tracking',
              'Calendar view of your performance',
              'AI Plan Builder for your strategy',
              'AI Coach that knows your journal',
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: G, flexShrink: 0,
                  boxShadow: `0 0 6px ${G}`,
                }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <button
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
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'Barlow', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Tab → minimum plan required to access
const TAB_PLANS = {
  dashboard: 'free',
  journal:   'free',
  calendar:  'free',
  accounts:  'trader',
  plan:      'pro',
  coach:     'elite',
  profile:   'free',
  pricing:   'free',
};

function AppInner() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusTradeId, setFocusTradeId]       = useState(null);
  const [pendingTradeDate, setPendingTradeDate] = useState(null);
  const [showAuth, setShowAuth]               = useState(false);
  const [showPopup, setShowPopup]             = useState(false);
  const tradeContext   = useTrades();
  const accountContext = useAccounts();
  const { selectedAccountId } = useAccountFilter();

  // Handle Stripe payment-success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', '/');
    }
    if (window.location.pathname === '/payment-success') {
      window.history.replaceState({}, '', '/');
      setActiveTab('profile');
    }
  }, []);

  // Show sign-up popup once for unauthenticated guests
  useEffect(() => {
    if (!loading && !user && !localStorage.getItem(POPUP_KEY)) {
      const t = setTimeout(() => setShowPopup(true), 800);
      return () => clearTimeout(t);
    }
  }, [loading, user]);

  // Auto-close auth screen once user logs in
  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

  const openAuth = () => {
    setShowPopup(false);
    localStorage.setItem(POPUP_KEY, '1');
    setShowAuth(true);
  };

  const dismissPopup = () => {
    setShowPopup(false);
    localStorage.setItem(POPUP_KEY, '1');
  };

  if (loading) {
    return (
      <div style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '2px',
          color: 'var(--text)',
        }}>
          Trade<span style={{ color: 'var(--green)' }}>Ascend</span>
        </div>
        <div style={{
          width: 32,
          height: 3,
          borderRadius: 2,
          background: 'var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '60%',
            height: '100%',
            background: 'var(--green)',
            animation: 'slide 1s ease-in-out infinite',
            borderRadius: 2,
          }} />
        </div>
        <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
      </div>
    );
  }

  // Guest navigating to Auth full-screen
  if (!user && showAuth) {
    return <Auth onClose={() => setShowAuth(false)} />;
  }

  // Full-page screens that don't use the shell layout
  if (activeTab === 'pricing') {
    return <Pricing onClose={() => setActiveTab('profile')} />;
  }

  const userPlan = user?.plan || 'free';

  const handleNavigate = (tab, tradeId) => {
    setActiveTab(tab);
    if (tradeId) setFocusTradeId(tradeId);
  };

  const renderScreen = () => {
    const required = TAB_PLANS[activeTab] || 'free';

    if (user && !hasAccess(userPlan, required)) {
      return (
        <FeatureGate
          requiredPlan={required}
          userPlan={userPlan}
          onUpgrade={() => setActiveTab('pricing')}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...tradeContext} accounts={accountContext.accounts} />;
      case 'journal':   return <Journal {...tradeContext} accounts={accountContext.accounts} focusTradeId={focusTradeId} onFocusConsumed={() => setFocusTradeId(null)} pendingTradeDate={pendingTradeDate} onPendingTradeDateConsumed={() => setPendingTradeDate(null)} />;
      case 'calendar':  return <Calendar {...tradeContext} accounts={accountContext.accounts} onNavigate={handleNavigate} onLogTrade={(date) => { setPendingTradeDate(date); setActiveTab('journal'); }} />;
      case 'accounts':  return <Accounts {...tradeContext} {...accountContext} />;
      case 'plan':      return <TradingPlan />;
      case 'coach':     return <AICoach {...tradeContext} />;
      case 'profile':   return <Profile onNavigate={handleNavigate} onSignUp={openAuth} />;
      default:          return <Dashboard {...tradeContext} />;
    }
  };

  return (
    <div className="app-shell">
      <div className="screen">
        {renderScreen()}
      </div>
      <BottomNav active={activeTab} onNavigate={handleNavigate} />
      {/* First-visit sign-up popup for guests */}
      {!user && showPopup && (
        <SignupPopup onClose={dismissPopup} onSignUp={openAuth} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AccountFilterProvider>
        <AppInner />
      </AccountFilterProvider>
    </AuthProvider>
  );
}

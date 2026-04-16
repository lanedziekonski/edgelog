import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import taLogo from './assets/ta-mark.png';
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
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import PrivacyPolicy from './screens/PrivacyPolicy';
import TermsOfService from './screens/TermsOfService';
import Admin from './screens/Admin';
import TermsAgreementPopup, { needsTermsAgreement } from './components/TermsAgreementPopup';
import { useTrades } from './hooks/useTrades';
import { useAccounts } from './hooks/useAccounts';

const G = '#00ff41';

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

// Feature gate display info for locked tabs
const FEATURE_INFO = {
  accounts: {
    name: 'Account Tracking',
    description: 'Track all your funded accounts — Apex, FTMO, tastytrade, and more. Monitor daily loss limits, max drawdown, and profit targets in real time.',
    bullets: ['Apex, FTMO & tastytrade tracking', 'Daily loss & drawdown alerts', 'Profit target progress', 'Auto-import trades via CSV'],
  },
  plan: {
    name: 'AI Plan Builder',
    description: 'Build a personalized trading plan with an AI that asks the right questions — covering your strategy, setups, risk rules, and psychology.',
    bullets: ['Guided AI interview to build your plan', 'Setup-by-setup rules & criteria', 'Risk and psychology framework', 'Edit and refine anytime'],
  },
  coach: {
    name: 'AI Coach',
    description: 'Daily AI coaching sessions powered by your actual journal data. Pre-market prep and post-market review — like having a trading coach who knows every trade you\'ve taken.',
    bullets: ['Pre-market preparation sessions', 'Post-market trade reviews', 'Emotional pattern analysis', 'Rule-following score tracking'],
  },
};

function AppInner() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusTradeId, setFocusTradeId]       = useState(null);
  const [pendingTradeDate, setPendingTradeDate] = useState(null);
  const [showTermsGate, setShowTermsGate]     = useState(() => needsTermsAgreement());
  const tradeContext   = useTrades();
  const accountContext = useAccounts();
  const { selectedAccountId } = useAccountFilter();

  // Determine initial auth mode from hash (/#/login, /#/signup, /#/forgot-password)
  const initialAuthMode = window.location.hash === '#/signup' ? 'signup' : 'login';

  const screenRef = useRef(null);

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

  // Terms gate — must agree before seeing anything
  if (showTermsGate) {
    return <TermsAgreementPopup onAccept={() => setShowTermsGate(false)} />;
  }

  if (loading) {
    return (
      <div style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <img
          src={taLogo}
          alt="TraderAscend"
          style={{
            width: 100,
            height: 'auto',
            display: 'block',
          }}
        />
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

  // Auth gate — unauthenticated users always see Auth, no guest browsing
  if (!user) {
    return <Auth initialMode={initialAuthMode} />;
  }

  // Full-page screens that don't use the shell layout
  if (activeTab === 'pricing') {
    return <Pricing onClose={() => setActiveTab('profile')} />;
  }

  const userPlan = user?.plan || 'free';

  const handleNavigate = (tab, tradeId) => {
    setActiveTab(tab);
    if (tradeId) setFocusTradeId(tradeId);
    setTimeout(() => {
      if (screenRef.current) screenRef.current.scrollTop = 0;
    }, 0);
  };

  const renderScreen = () => {
    const required = TAB_PLANS[activeTab] || 'free';

    // Plan-tier gate — logged in but wrong plan
    if (!hasAccess(userPlan, required)) {
      const info = FEATURE_INFO[activeTab] || {};
      return (
        <FeatureGate
          requiredPlan={required}
          userPlan={userPlan}
          featureName={info.name}
          featureDescription={info.description}
          featureBullets={info.bullets}
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
      case 'profile':   return <Profile onNavigate={handleNavigate} />;
      default:          return <Dashboard {...tradeContext} />;
    }
  };

  return (
    <div className="app-shell">
      <div className="screen" ref={screenRef}>
        {renderScreen()}
      </div>
      <BottomNav active={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  const hash = window.location.hash;

  // Path-based full-page routes
  if (path === '/reset-password')   return <ResetPassword />;
  if (path === '/privacy-policy')   return <PrivacyPolicy />;
  if (path === '/terms-of-service') return <TermsOfService />;
  if (path === '/admin')            return <Admin />;

  // Hash-based routes (redirected from /login, /signup, /forgot-password via vercel.json)
  if (path === '/forgot-password' || hash === '#/forgot-password') return <ForgotPassword />;

  return (
    <AuthProvider>
      <AccountFilterProvider>
        <AppInner />
      </AccountFilterProvider>
    </AuthProvider>
  );
}

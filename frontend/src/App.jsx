import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, hasAccess } from './context/AuthContext';
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
  const tradeContext = useTrades();

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
          Edge<span style={{ color: 'var(--green)' }}>Log</span>
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

  if (!user) return <Auth />;

  // Full-page screens that don't use the shell layout
  if (activeTab === 'pricing') {
    return <Pricing onClose={() => setActiveTab('profile')} />;
  }

  const userPlan = user.plan || 'free';

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  const renderScreen = () => {
    const required = TAB_PLANS[activeTab] || 'free';

    if (!hasAccess(userPlan, required)) {
      return (
        <FeatureGate
          requiredPlan={required}
          userPlan={userPlan}
          onUpgrade={() => setActiveTab('pricing')}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...tradeContext} />;
      case 'journal':   return <Journal {...tradeContext} />;
      case 'calendar':  return <Calendar {...tradeContext} />;
      case 'accounts':  return <Accounts {...tradeContext} />;
      case 'plan':      return <TradingPlan />;
      case 'coach':     return <AICoach {...tradeContext} />;
      case 'profile':   return <Profile onNavigate={handleNavigate} />;
      default:          return <Dashboard {...tradeContext} />;
    }
  };

  return (
    <div className="app-shell">
      <div className="screen">
        {renderScreen()}
      </div>
      <BottomNav active={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccountFilterProvider } from './context/AccountFilterContext';

// Marketing layout + pages
import Layout   from './components/layout/Layout';
import Home     from './pages/Home';
import Features from './pages/Features';
import Pricing  from './pages/Pricing';
import About    from './pages/About';
import HowItWorks from './pages/HowItWorks';

// Auth pages
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Legal pages
import PrivacyPolicy  from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// App shell + protected pages
import AppShell      from './components/AppShell';
import AppDashboard  from './pages/AppDashboard';
import AppJournal    from './pages/AppJournal';
import AppCalendar   from './pages/AppCalendar';
import AppAccounts   from './pages/AppAccounts';
import AppTradingPlan from './pages/AppTradingPlan';
import AppAICoach    from './pages/AppAICoach';
import AppProfile    from './pages/AppProfile';

// Legacy mock preview (keep for marketing)
import MockDashboard from './pages/Dashboard';

function PageWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Redirect to /login if not authenticated; redirect to /dashboard if already authed
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c08' }}>
      <div className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Legal pages — full page, no layout wrapper */}
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms"   element={<TermsOfService />} />

        {/* Auth pages (redirect to /dashboard if already logged in) */}
        <Route path="login"            element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="signup"           element={<GuestOnlyRoute><Signup /></GuestOnlyRoute>} />
        <Route path="forgot-password"  element={<ForgotPassword />} />

        {/* Protected app routes — all nested inside AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AppDashboard />} />
          <Route path="journal"   element={<AppJournal />} />
          <Route path="calendar"  element={<AppCalendar />} />
          <Route path="accounts"  element={<AppAccounts />} />
          <Route path="plan"      element={<AppTradingPlan />} />
          <Route path="coach"     element={<AppAICoach />} />
          <Route path="profile"   element={<AppProfile />} />
        </Route>

        {/* Marketing site (public) */}
        <Route element={<Layout />}>
          <Route index element={<PageWrap><Home /></PageWrap>} />
          <Route path="features"     element={<PageWrap><Features /></PageWrap>} />
          <Route path="pricing"      element={<PageWrap><Pricing /></PageWrap>} />
          <Route path="about"        element={<PageWrap><About /></PageWrap>} />
          <Route path="how-it-works" element={<PageWrap><HowItWorks /></PageWrap>} />
          <Route path="preview"      element={<PageWrap><MockDashboard /></PageWrap>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AccountFilterProvider>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </AccountFilterProvider>
  );
}

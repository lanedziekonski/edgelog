import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import Sidebar from '../components/dashboard/Sidebar';
import DashHeader from '../components/dashboard/DashHeader';
import DashboardScreen from '../components/dashboard/screens/DashboardScreen';
import JournalScreen from '../components/dashboard/screens/JournalScreen';
import CalendarScreen from '../components/dashboard/screens/CalendarScreen';
import AccountsScreen from '../components/dashboard/screens/AccountsScreen';
import PlanScreen from '../components/dashboard/screens/PlanScreen';
import CoachScreen from '../components/dashboard/screens/CoachScreen';
import ProfileScreen from '../components/dashboard/screens/ProfileScreen';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import { APP_URL } from '../data/site';

const SCREENS = {
  dashboard: DashboardScreen,
  journal: JournalScreen,
  calendar: CalendarScreen,
  accounts: AccountsScreen,
  plan: PlanScreen,
  coach: CoachScreen,
  profile: ProfileScreen,
};

export default function Dashboard() {
  const [tab, setTab] = useState('dashboard');
  const Screen = SCREENS[tab] ?? DashboardScreen;

  const handleTabChange = (next) => {
    setTab(next);
    // Scroll main content back to top on tab change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg relative">
      <AmbientOrbs />

      <div className="relative flex min-h-screen">
        <Sidebar active={tab} onChange={handleTabChange} />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Demo banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-30 flex items-center justify-between gap-3 pl-16 lg:pl-6 pr-4 md:pr-6 py-2.5 bg-neon/10 border-b border-neon/30 text-xs font-mono uppercase tracking-wider"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-neon transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
            <span className="flex items-center gap-2 text-neon">
              <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulseSlow" />
              Live Demo · Mock Data
            </span>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-muted hover:text-neon transition-colors"
            >
              <span className="hidden sm:inline">Launch App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </motion.div>

          <DashHeader />

          {/* Main screen area */}
          <main className="relative flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-10">
            <div className="max-w-5xl mx-auto w-full">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Screen />
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

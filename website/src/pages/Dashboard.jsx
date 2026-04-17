import { useState } from 'react';
import { motion } from 'framer-motion';

import Sidebar from '../components/dashboard/Sidebar';
import DashHeader from '../components/dashboard/DashHeader';
import DashboardScreen from '../components/dashboard/screens/DashboardScreen';
import JournalScreen from '../components/dashboard/screens/JournalScreen';
import CalendarScreen from '../components/dashboard/screens/CalendarScreen';
import AccountsScreen from '../components/dashboard/screens/AccountsScreen';
import PlanScreen from '../components/dashboard/screens/PlanScreen';
import CoachScreen from '../components/dashboard/screens/CoachScreen';
import ProfileScreen from '../components/dashboard/screens/ProfileScreen';
import AnimatedBackground from '../components/effects/AnimatedBackground';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg relative">
      <AnimatedBackground fixed variant="dashboard" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar active={tab} onChange={handleTabChange} />

        <div className="flex-1 min-w-0 flex flex-col">
          <DashHeader />

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

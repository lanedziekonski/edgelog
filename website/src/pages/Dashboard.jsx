import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import DashHeader from '../components/dashboard/DashHeader';
import HeroStats from '../components/dashboard/HeroStats';
import StatsGrid from '../components/dashboard/StatsGrid';
import EquityCurve from '../components/dashboard/EquityCurve';
import RecentTrades from '../components/dashboard/RecentTrades';
import DayWinChart from '../components/dashboard/DayWinChart';
import SetupPerformance from '../components/dashboard/SetupPerformance';
import StatCluster from '../components/dashboard/StatCluster';
import MonthlyPnL from '../components/dashboard/MonthlyPnL';
import BottomNav from '../components/dashboard/BottomNav';
import AmbientOrbs from '../components/effects/AmbientOrbs';
import { APP_URL } from '../data/site';

export default function Dashboard() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-bg relative overflow-hidden">
      <AmbientOrbs />

      {/* Demo banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-40 flex items-center justify-between gap-3 px-4 md:px-6 py-2.5 bg-neon/10 border-b border-neon/30 text-xs font-mono uppercase tracking-wider"
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

      <main className="relative flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-10 space-y-10 md:space-y-14">
        <HeroStats />
        <StatsGrid />
        <DayWinChart />
        <RecentTrades />
        <EquityCurve />
        <StatCluster />
        <SetupPerformance />
        <MonthlyPnL />

        {/* CTA band */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl border border-neon/30 bg-gradient-to-br from-panel to-black p-8 md:p-12 text-center overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,255,65,0.15) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <h3 className="text-2xl md:text-4xl font-bold tracking-tight">
              Your edge, <span className="text-neon glow-text">visualized.</span>
            </h3>
            <p className="mt-3 max-w-xl mx-auto text-muted">
              This is a live preview with mock data. Log your real trades and watch your
              dashboard tell the real story.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neon text-black font-semibold hover:shadow-neon-strong transition-shadow"
            >
              Start journaling free <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import HeroStats from '../HeroStats';
import StatsGrid from '../StatsGrid';
import EquityCurve from '../EquityCurve';
import RecentTrades from '../RecentTrades';
import DayWinChart from '../DayWinChart';
import SetupPerformance from '../SetupPerformance';
import StatCluster from '../StatCluster';
import MonthlyPnL from '../MonthlyPnL';
import { APP_URL } from '../../../data/site';

export default function DashboardScreen() {
  return (
    <div className="space-y-10 md:space-y-14">
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
    </div>
  );
}

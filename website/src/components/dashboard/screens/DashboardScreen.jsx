import HeroStats from '../HeroStats';
import StatsGrid from '../StatsGrid';
import EquityCurve from '../EquityCurve';
import RecentTrades from '../RecentTrades';
import DayWinChart from '../DayWinChart';
import SetupPerformance from '../SetupPerformance';
import StatCluster from '../StatCluster';
import MonthlyPnL from '../MonthlyPnL';

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
    </div>
  );
}

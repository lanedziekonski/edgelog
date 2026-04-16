// Mock data for the demo dashboard — realistic but made-up numbers.
// Used only for marketing demonstration; no real trades here.

export const ACCOUNTS = [
  { id: 'all', label: 'All Accounts' },
  { id: 'apex', label: 'Apex $100K' },
  { id: 'ftmo', label: 'FTMO $50K' },
  { id: 'tasty', label: 'tastytrade' },
];

export const HERO_STATS = [
  { label: 'Total P&L', value: 14820, prefix: '+$', positive: true },
  { label: 'Today', value: 425, prefix: '+$', positive: true },
  { label: 'This Week', value: 2180, prefix: '+$', positive: true },
  { label: 'Streak', value: '7W', raw: true, positive: true },
];

export const STATS_GRID = [
  { label: 'Win Rate', value: 64, suffix: '%', sub: '54W / 30L of 84', positive: true },
  { label: 'Avg Win', value: 412, prefix: '+$', sub: '3,872 winners', positive: true },
  { label: 'Avg Loss', value: 185, prefix: '-$', sub: '−2,775 losers', positive: false },
  { label: 'Avg R:R', value: '2.2R', raw: true, sub: 'target 2.0R', positive: true },
  { label: 'Profit Factor', value: '2.47', raw: true, sub: 'wins ÷ losses', positive: true },
  { label: 'Rule Score', value: 92, suffix: '%', sub: '78/84 clean', positive: true },
];

export const DAY_WIN = [
  { day: 'MON', wins: 11, losses: 6, rate: 65 },
  { day: 'TUE', wins: 14, losses: 5, rate: 74 },
  { day: 'WED', wins: 9, losses: 8, rate: 53 },
  { day: 'THU', wins: 12, losses: 6, rate: 67 },
  { day: 'FRI', wins: 8, losses: 5, rate: 62 },
];

export const RECENT_TRADES = [
  { date: 'Apr 16', symbol: 'MNQ', side: 'LONG', setup: 'ORB', qty: '2ct', account: 'Apex', pl: 425 },
  { date: 'Apr 15', symbol: 'ES', side: 'SHORT', setup: 'VWAP Reclaim', qty: '1ct', account: 'FTMO', pl: 688 },
  { date: 'Apr 15', symbol: 'NQ', side: 'LONG', setup: 'Bull Flag', qty: '1ct', account: 'Apex', pl: 340 },
  { date: 'Apr 14', symbol: 'MNQ', side: 'LONG', setup: 'ORB', qty: '3ct', account: 'Apex', pl: -188 },
  { date: 'Apr 14', symbol: 'ES', side: 'LONG', setup: 'Gap Fill', qty: '1ct', account: 'FTMO', pl: 212 },
  { date: 'Apr 11', symbol: 'NQ', side: 'SHORT', setup: 'Fade High', qty: '2ct', account: 'Apex', pl: 520 },
  { date: 'Apr 11', symbol: 'MES', side: 'LONG', setup: 'ORB', qty: '4ct', account: 'tastytrade', pl: 95 },
  { date: 'Apr 10', symbol: 'MNQ', side: 'SHORT', setup: 'VWAP Reclaim', qty: '2ct', account: 'Apex', pl: -152 },
];

// Day-by-day equity curve (cumulative P&L over last ~4 weeks)
export const EQUITY_CURVE = [
  { day: 'Mar 18', value: 0 },
  { day: 'Mar 19', value: 240 },
  { day: 'Mar 20', value: 180 },
  { day: 'Mar 21', value: 520 },
  { day: 'Mar 24', value: 680 },
  { day: 'Mar 25', value: 940 },
  { day: 'Mar 26', value: 720 },
  { day: 'Mar 27', value: 1380 },
  { day: 'Mar 28', value: 1820 },
  { day: 'Mar 31', value: 2240 },
  { day: 'Apr 1', value: 2080 },
  { day: 'Apr 2', value: 2680 },
  { day: 'Apr 3', value: 3420 },
  { day: 'Apr 4', value: 3180 },
  { day: 'Apr 7', value: 3920 },
  { day: 'Apr 8', value: 4580 },
  { day: 'Apr 9', value: 5340 },
  { day: 'Apr 10', value: 6120 },
  { day: 'Apr 11', value: 7280 },
  { day: 'Apr 14', value: 8920 },
  { day: 'Apr 15', value: 12390 },
  { day: 'Apr 16', value: 14820 },
];

export const SETUP_PERFORMANCE = [
  { name: 'ORB', trades: 31, winRate: 68, pl: 5240, color: 'neon' },
  { name: 'VWAP Reclaim', trades: 22, winRate: 73, pl: 4180, color: 'neon' },
  { name: 'Bull Flag', trades: 14, winRate: 64, pl: 2380, color: 'neon' },
  { name: 'Gap Fill', trades: 11, winRate: 55, pl: 1420, color: 'neon' },
  { name: 'Fade High', trades: 6, winRate: 33, pl: -420, color: 'red' },
];

export const MONTHLY_PNL = [
  { month: 'May 25', pl: 1240, days: 14, trades: 48, winRate: 58 },
  { month: 'Jun 25', pl: 820, days: 16, trades: 52, winRate: 55 },
  { month: 'Jul 25', pl: 2140, days: 15, trades: 56, winRate: 61 },
  { month: 'Aug 25', pl: -680, days: 13, trades: 44, winRate: 45 },
  { month: 'Sep 25', pl: 3280, days: 17, trades: 68, winRate: 66 },
  { month: 'Oct 25', pl: 4120, days: 18, trades: 72, winRate: 69 },
  { month: 'Nov 25', pl: 1820, days: 15, trades: 54, winRate: 61 },
  { month: 'Dec 25', pl: 2960, days: 14, trades: 50, winRate: 64 },
  { month: 'Jan 26', pl: -1240, days: 16, trades: 58, winRate: 41 },
  { month: 'Feb 26', pl: 5480, days: 17, trades: 66, winRate: 71 },
  { month: 'Mar 26', pl: 6840, days: 18, trades: 74, winRate: 68 },
  { month: 'Apr 26', pl: 14820, days: 10, trades: 84, winRate: 64 },
];

export const STAT_CLUSTER = {
  bestDay: 2180,
  worstDay: -940,
  greenDays: 14,
  totalDays: 18,
};

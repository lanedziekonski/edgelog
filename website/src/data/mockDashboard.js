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

// Journal: expanded trade log (30+ trades, grouped by date in UI)
export const JOURNAL_TRADES = [
  { date: 'Apr 16', symbol: 'MNQ', side: 'LONG', setup: 'ORB', qty: '2ct', account: 'Apex', pl: 425, rulesClean: true },
  { date: 'Apr 16', symbol: 'ES', side: 'LONG', setup: 'VWAP Reclaim', qty: '1ct', account: 'FTMO', pl: 180, rulesClean: true },
  { date: 'Apr 15', symbol: 'ES', side: 'SHORT', setup: 'VWAP Reclaim', qty: '1ct', account: 'FTMO', pl: 688, rulesClean: true },
  { date: 'Apr 15', symbol: 'NQ', side: 'LONG', setup: 'Bull Flag', qty: '1ct', account: 'Apex', pl: 340, rulesClean: true },
  { date: 'Apr 15', symbol: 'MES', side: 'LONG', setup: 'ORB', qty: '3ct', account: 'tastytrade', pl: 220, rulesClean: true },
  { date: 'Apr 14', symbol: 'MNQ', side: 'LONG', setup: 'ORB', qty: '3ct', account: 'Apex', pl: -188, rulesClean: false },
  { date: 'Apr 14', symbol: 'ES', side: 'LONG', setup: 'Gap Fill', qty: '1ct', account: 'FTMO', pl: 212, rulesClean: true },
  { date: 'Apr 11', symbol: 'NQ', side: 'SHORT', setup: 'Fade High', qty: '2ct', account: 'Apex', pl: 520, rulesClean: true },
  { date: 'Apr 11', symbol: 'MES', side: 'LONG', setup: 'ORB', qty: '4ct', account: 'tastytrade', pl: 95, rulesClean: true },
  { date: 'Apr 11', symbol: 'MNQ', side: 'SHORT', setup: 'VWAP Reclaim', qty: '2ct', account: 'Apex', pl: 312, rulesClean: true },
  { date: 'Apr 10', symbol: 'MNQ', side: 'SHORT', setup: 'VWAP Reclaim', qty: '2ct', account: 'Apex', pl: -152, rulesClean: true },
  { date: 'Apr 10', symbol: 'ES', side: 'LONG', setup: 'ORB', qty: '1ct', account: 'FTMO', pl: 425, rulesClean: true },
  { date: 'Apr 9', symbol: 'NQ', side: 'LONG', setup: 'Bull Flag', qty: '1ct', account: 'Apex', pl: 285, rulesClean: true },
  { date: 'Apr 9', symbol: 'MNQ', side: 'SHORT', setup: 'Fade High', qty: '3ct', account: 'Apex', pl: -225, rulesClean: false },
  { date: 'Apr 8', symbol: 'ES', side: 'LONG', setup: 'Gap Fill', qty: '1ct', account: 'FTMO', pl: 176, rulesClean: true },
  { date: 'Apr 8', symbol: 'MES', side: 'LONG', setup: 'ORB', qty: '4ct', account: 'tastytrade', pl: 140, rulesClean: true },
  { date: 'Apr 7', symbol: 'NQ', side: 'SHORT', setup: 'VWAP Reclaim', qty: '2ct', account: 'Apex', pl: 610, rulesClean: true },
  { date: 'Apr 7', symbol: 'MNQ', side: 'LONG', setup: 'ORB', qty: '3ct', account: 'Apex', pl: 240, rulesClean: true },
  { date: 'Apr 4', symbol: 'ES', side: 'SHORT', setup: 'Fade High', qty: '1ct', account: 'FTMO', pl: -144, rulesClean: false },
  { date: 'Apr 4', symbol: 'NQ', side: 'LONG', setup: 'Bull Flag', qty: '1ct', account: 'Apex', pl: 388, rulesClean: true },
];

// Calendar: per-day P&L for April 2026 (mock month)
export const CALENDAR_DAYS = {
  year: 2026,
  month: 3, // April (0-indexed)
  days: {
    1: { pl: 240, trades: 2 },
    2: { pl: 600, trades: 3 },
    3: { pl: 740, trades: 3 },
    4: { pl: 244, trades: 2 },
    7: { pl: 850, trades: 2 },
    8: { pl: 316, trades: 2 },
    9: { pl: 60, trades: 2 },
    10: { pl: 273, trades: 2 },
    11: { pl: 927, trades: 3 },
    14: { pl: 24, trades: 2 },
    15: { pl: 1248, trades: 3 },
    16: { pl: 605, trades: 2 },
  },
};

// Accounts screen data
export const ACCOUNTS_DATA = [
  {
    id: 'apex',
    name: 'Apex Trader Funding',
    size: '$100,000',
    type: 'Funded',
    phase: 'Funded · Payout Active',
    balance: 108420,
    startBalance: 100000,
    pl: 8420,
    drawdownUsed: 1580,
    drawdownMax: 3000,
    tradingDays: 42,
    payoutsReceived: 2,
    payoutsTotal: 16540,
    color: 'neon',
  },
  {
    id: 'ftmo',
    name: 'FTMO Challenge',
    size: '$50,000',
    type: 'Evaluation',
    phase: 'Phase 1 · Day 12/30',
    balance: 53120,
    startBalance: 50000,
    pl: 3120,
    profitTarget: 5000,
    drawdownUsed: 820,
    drawdownMax: 2500,
    tradingDays: 12,
    tradingDaysRequired: 10,
    color: 'cyan',
  },
  {
    id: 'tasty',
    name: 'tastytrade Live',
    size: '$25,000',
    type: 'Live',
    phase: 'Personal Account',
    balance: 28480,
    startBalance: 25000,
    pl: 3480,
    tradingDays: 68,
    color: 'neon',
  },
];

// Trading plan screen data
export const TRADING_PLAN = {
  setups: [
    {
      name: 'Opening Range Breakout (ORB)',
      entry: '5-min range break with volume confirmation',
      stop: 'Below opening range',
      target: '2R minimum',
      session: 'Open · 9:30–10:15 ET',
      enabled: true,
    },
    {
      name: 'VWAP Reclaim',
      entry: 'Price rejects below VWAP, then reclaims with momentum',
      stop: 'Below rejection wick',
      target: 'Prior day high / 2R',
      session: 'Mid-day',
      enabled: true,
    },
    {
      name: 'Bull Flag Continuation',
      entry: 'Break of flag pole with increasing volume',
      stop: 'Below flag low',
      target: 'Measured move',
      session: 'Trend days only',
      enabled: true,
    },
    {
      name: 'Gap Fill Fade',
      entry: 'Fade unfilled gap at first rejection',
      stop: 'Above gap high',
      target: 'Prior close',
      session: 'First 30 min',
      enabled: true,
    },
    {
      name: 'Fade High (Counter-Trend)',
      entry: 'Reject at daily high with divergence',
      stop: 'Above rejection wick',
      target: 'VWAP',
      session: 'Ranging days',
      enabled: false,
    },
  ],
  riskRules: [
    { text: 'Risk no more than 2% of account per trade', done: true },
    { text: 'Maximum 3 trades per day', done: true },
    { text: 'Walk away after 2 consecutive losses', done: true },
    { text: 'No trading in the last 15 minutes of the session', done: true },
    { text: 'No revenge trades — journal the loss, move on', done: true },
    { text: 'No FOMO entries — miss the move, wait for the next setup', done: true },
  ],
  routine: {
    preMarket: [
      { text: 'Review overnight futures + news catalysts', done: true },
      { text: 'Mark key levels on ES + NQ', done: true },
      { text: 'Write daily bias in journal', done: true },
      { text: 'Set alerts for premarket ranges', done: false },
    ],
    postMarket: [
      { text: 'Log all trades with screenshots', done: true },
      { text: 'Score each trade against plan', done: true },
      { text: 'Write one thing I did well, one to improve', done: false },
      { text: 'Prep tomorrow\'s watchlist', done: false },
    ],
  },
};

// AI Coach mock conversation
export const COACH_CONVERSATION = [
  {
    role: 'coach',
    content: "Great session today. Your ORB on MNQ netted +$425 with clean execution — stop was tight and you let the runner go to 2.5R. Let's talk about that second trade.",
    time: '4:12 PM',
  },
  {
    role: 'user',
    content: 'The VWAP reclaim on ES? I exited at 1R because it stalled.',
    time: '4:13 PM',
  },
  {
    role: 'coach',
    content: "That's the right call given your plan — but looking at the 5-min chart, the stall happened at prior day high. Next time, consider leaving a 25% runner above that level with a breakeven stop. No added risk, meaningful upside.",
    time: '4:13 PM',
  },
  {
    role: 'user',
    content: 'Makes sense. Anything on the losing trade?',
    time: '4:14 PM',
  },
  {
    role: 'coach',
    content: "The Apr 14 MNQ loss flagged a rule break — you entered 4 minutes after your cutoff. One data point isn't a pattern, but keep an eye on it. Last 5 trades taken past your window have a 20% win rate vs 68% for on-time entries.",
    time: '4:14 PM',
  },
  {
    role: 'user',
    content: 'Ouch. Fair point.',
    time: '4:15 PM',
  },
  {
    role: 'coach',
    content: "Discipline compounds. You're +$14,820 on the month with a 92% rule-score — that's elite. Ship the journal, review tomorrow's plan, and I'll be here. 🎯",
    time: '4:15 PM',
  },
];

// Profile screen
export const PROFILE = {
  name: 'Carter Peters',
  handle: '@carter',
  email: 'carter@tradeascend.com',
  memberSince: 'Oct 2025',
  plan: 'Pro',
  allTimeStats: {
    tradesLogged: 1284,
    winRate: 62,
    pl: 42180,
    days: 186,
  },
};


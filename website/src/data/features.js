// Home page — 6 hero feature cards
export const homeFeatures = [
  {
    icon: 'BookOpen',
    title: 'Trade Journal',
    description: 'Log every trade manually, via CSV import, or directly from your broker.',
  },
  {
    icon: 'Brain',
    title: 'AI Coach',
    description: 'Daily personalized coaching sessions powered by Claude AI.',
  },
  {
    icon: 'Map',
    title: 'Trading Plan',
    description: 'AI-generated plan tailored to your strategy, edge, and goals.',
  },
  {
    icon: 'CalendarDays',
    title: 'Calendar View',
    description: 'Visualize every trade and journal entry by day, week, and month.',
  },
  {
    icon: 'Wallet',
    title: 'Payout Tracker',
    description: 'Track funded account payouts, violations, and account health.',
  },
  {
    icon: 'Image',
    title: 'Trade Screenshots',
    description: 'Attach setup and execution screenshots to every trade you log.',
  },
];

// Features page — 10 detailed feature blocks
export const detailedFeatures = [
  {
    icon: 'BookOpen',
    eyebrow: 'Logging',
    title: 'Trade Journal',
    description:
      'A frictionless logging experience purpose-built for active traders. Tag setups, mark mistakes, score conviction, and review performance by tag, time of day, or instrument.',
    bullets: ['Manual entry & quick-add', 'Custom tags and setup categories', 'Conviction & emotion scoring'],
    mockType: 'journal',
  },
  {
    icon: 'FileSpreadsheet',
    eyebrow: 'Import',
    title: 'CSV Import',
    description:
      'Drag and drop your broker statement and TraderAscend will auto-detect the format. Five major broker CSVs supported out of the box.',
    bullets: ['Tradovate · IBKR · ThinkorSwim', 'TradeStation · Webull', 'Auto-mapping with override controls'],
    mockType: 'csv',
  },
  {
    icon: 'Link2',
    eyebrow: 'Integration',
    title: 'Broker Account Linking',
    description:
      'Securely connect your live brokerage account and pull executions automatically. No more end-of-day exports.',
    bullets: ['Real-time fill sync', 'Encrypted credentials', 'Multiple linked accounts per user'],
    mockType: 'broker',
  },
  {
    icon: 'Brain',
    eyebrow: 'Intelligence',
    title: 'AI Coach',
    description:
      'A daily AI session that reads your trades, your journal, and your plan — then tells you exactly what to fix tomorrow. Sessions roll over at 8AM local.',
    bullets: ['Daily personalized review', 'Pattern detection across weeks', 'Powered by Claude'],
    mockType: 'coach',
  },
  {
    icon: 'Map',
    eyebrow: 'Strategy',
    title: 'AI Trading Plan Builder',
    description:
      'Answer a structured intake and TraderAscend writes a complete trading plan: edge, criteria, risk rules, and routine. Edit anytime. Reset when your strategy evolves.',
    bullets: ['Saves to your account', 'Editable & versioned', 'Resettable on demand'],
    mockType: 'plan',
  },
  {
    icon: 'LayoutDashboard',
    eyebrow: 'Overview',
    title: 'Cinematic Dashboard',
    description:
      'A 5-section dashboard showing equity curve, monthly P&L, R:R ratio, win rate, and the streaks that actually matter.',
    bullets: ['Monthly P&L chart', 'Live R:R and expectancy', 'Streak & consistency metrics'],
    mockType: 'dashboard',
  },
  {
    icon: 'CalendarDays',
    eyebrow: 'Time',
    title: 'Calendar',
    description:
      'A monthly calendar grid where every cell shows your P&L, your journal entry, and any AI coaching sessions for that day.',
    bullets: ['Day-level P&L heatmap', 'Click-through to entries', 'AI session indicators'],
    mockType: 'calendar',
  },
  {
    icon: 'Wallet',
    eyebrow: 'Funded Accounts',
    title: 'Payout Tracker',
    description:
      'For prop firm traders. Track every payout, every rule violation, and every active funded account in one place.',
    bullets: ['Per-firm payout history', 'Violation log with notes', 'Net withdrawn lifetime stat'],
    mockType: 'payout',
  },
  {
    icon: 'Image',
    eyebrow: 'Visual',
    title: 'Trade Screenshots',
    description:
      'Attach unlimited screenshots to any trade. Setup, entry, exit, post-mortem — all in one place when you review.',
    bullets: ['Drag and drop upload', 'Side-by-side review', 'Permanent cloud storage'],
    mockType: 'screenshot',
  },
  {
    icon: 'Users',
    eyebrow: 'Scale',
    title: 'Multi-Account Support',
    description:
      'Run multiple funded accounts and a personal account? Switch between them with a single click. Keep stats clean and separate.',
    bullets: ['Unlimited accounts on Trader+', 'Account-scoped stats', 'Quick switcher in the nav'],
    mockType: 'accounts',
  },
];

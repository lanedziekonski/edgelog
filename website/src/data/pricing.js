// Annual = 25% off monthly (9 months for 12), displayed as monthly equivalent
const annual = (monthly) => Number((monthly * 0.75).toFixed(2));
const annualTotal = (monthly) => Number((monthly * 9).toFixed(2));

export const tiers = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Manual trade journal only',
    monthly: 0,
    annual: 0,
    annualTotal: 0,
    cta: 'Get Started Free',
    popular: false,
    features: [
      'Manual trade logging',
      'Basic dashboard',
      'Calendar view',
      '1 trading account',
      'Community access',
    ],
  },
  {
    id: 'trader',
    name: 'Trader',
    tagline: 'Broker linking & CSV import',
    monthly: 9.99,
    annual: annual(9.99),
    annualTotal: annualTotal(9.99),
    cta: 'Start Trader',
    popular: false,
    features: [
      'Everything in Free',
      'Broker account linking',
      'CSV import (5 brokers)',
      'Multi-account support',
      'Advanced filters & tags',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'AI Trading Plan Builder',
    monthly: 24.99,
    annual: annual(24.99),
    annualTotal: annualTotal(24.99),
    cta: 'Go Pro',
    popular: false,
    features: [
      'Everything in Trader',
      'AI-generated trading plan',
      'Plan editing & resetting',
      'Pattern detection insights',
      'Weekly performance email',
      'Priority email support',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    tagline: 'Full AI Coaching Suite',
    monthly: 49.99,
    annual: annual(49.99),
    annualTotal: annualTotal(49.99),
    cta: 'Go Elite',
    popular: true,
    features: [
      'Everything in Pro',
      'Daily AI Coach sessions',
      'Trade screenshot analysis',
      'Payout & violation tracker',
      'Funded account dashboard',
    ],
  },
];

export const faq = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings in two clicks — no email required, no fine print. Your data stays with you.',
  },
  {
    q: 'Which brokers do you support?',
    a: 'We currently support Tradovate, Interactive Brokers (IBKR), ThinkorSwim, TradeStation, and Webull via CSV import or direct linking. New brokers are added every month based on user requests.',
  },
  {
    q: 'Is my trading data secure?',
    a: 'Bank-grade encryption at rest and in transit. We never sell, share, or train models on your trade data. Your PnL is yours.',
  },
  {
    q: 'Do you offer a free trial of Pro or Elite?',
    a: 'The Free plan is permanent — no card required. Pro and Elite include a 7-day trial when you upgrade, and you can downgrade back to Free anytime.',
  },
  {
    q: 'What exactly does the AI Coach do?',
    a: 'Each morning the AI Coach reads yesterday\'s trades, your journal entries, and your trading plan. It identifies what worked, what broke your rules, and gives you one specific thing to improve today.',
  },
];

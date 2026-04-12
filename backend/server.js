require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Anthropic = require('@anthropic-ai/sdk');

const { db, stmts, rowToTrade } = require('./database');
const { signToken, requireAuth, requirePlan } = require('./middleware/auth');

const app = express();

// CORS — allow localhost in dev and the deployed frontend URL in prod
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Raw body for Stripe webhooks — must come before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── Stripe (optional — graceful degradation when not configured) ──────────
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_key')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const PLAN_PRICES = {
  trader: process.env.STRIPE_PRICE_TRADER,
  pro:    process.env.STRIPE_PRICE_PRO,
  elite:  process.env.STRIPE_PRICE_ELITE,
};

// ─── Plaid (optional — graceful degradation when not configured) ──────────
let plaidClient = null;
if (process.env.PLAID_CLIENT_ID && !process.env.PLAID_CLIENT_ID.includes('your_')) {
  const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
  const plaidConfig = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  plaidClient = new PlaidApi(plaidConfig);
}

// ─── Anthropic ───────────────────────────────────��────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const COACH_SYSTEM_PROMPT = `You are an AI trading coach embedded in EdgeLog, a personal trading journal app. You know this trader's complete plan:

APPROVED SETUPS:
- ORB (Opening Range Breakout): trade breakout of the first 5 or 15-min candle range
- VWAP Reclaim: price reclaims VWAP after a dip, enter on confirmation
- Bull Flag: consolidation after a strong move, enter on breakout of flag
- Gap Fill: price fills a prior-day gap
- Fade High: fade an overextended move at key resistance (HOD, prior-day high, etc.)

RISK RULES:
- Max 2% account risk per trade
- Max 3 trades per day (hard stop)
- Size down after 1 loss

ACCOUNTS:
- Apex Funded $100K prop: $2,000 daily loss limit, $3,000 max drawdown, $6,000 profit target
- FTMO $50K evaluation: standard FTMO rules
- tastytrade $25K live: personal capital, treat with care

EMOTIONAL DISCIPLINE:
- No FOMO entries — if you missed the setup, let it go
- No revenge trading — a loss is data, not a debt to repay
- Mandatory break after 2 consecutive losses — step away, reset
- Journal every trade including emotional state

PRE-MARKET MODE: Help the trader prepare. Review the plan, identify key levels/catalysts, set daily intentions, mental prep.
POST-MARKET MODE: Review what happened. Assess rule adherence, emotional patterns, what to improve. Be honest but constructive.

Keep responses concise, direct, and actionable. Cite specific rules when relevant.`;

const PLAN_BUILDER_SYSTEM_PROMPT = `You are an expert trading plan architect. Help traders build, refine, and document a structured, rules-based trading plan. You understand:

- Technical setups (ORB, VWAP, flags, gaps, fades, momentum, mean reversion)
- Risk management frameworks (fixed %, ATR-based, max daily loss limits)
- Prop firm rules (Apex, FTMO, TopStep, etc.) and evaluation parameters
- Trading psychology and emotional discipline frameworks
- Trade journaling best practices and performance review processes

Guide the trader to think through and define:
1. Their edge (what setups, what conditions)
2. Risk rules (sizing, max loss, daily limits)
3. Entry/exit criteria for each setup
4. Pre-market routine and market bias process
5. Emotional guardrails and circuit breakers
6. Review and improvement processes

Ask clarifying questions to understand their current situation. Be specific, practical, and structured. Format responses clearly — use numbered lists and headers when building out plan sections.`;

// ─── AUTH ─────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = stmts.insertUser.run(email.toLowerCase().trim(), hash, name || '');
    const userId = result.lastInsertRowid;
    const user = stmts.getUserById.get(userId);
    const token = signToken({ userId: user.id, plan: user.plan });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'An account with this email already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = stmts.getUserByEmail.get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken({ userId: user.id, plan: user.plan });
  res.json({ token, user: safeUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = stmts.getUserById.get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

function safeUser(user) {
  return { id: user.id, email: user.email, name: user.name, plan: user.plan };
}

// ─── TRADES ───────────────────────────────────────────────────────────────

app.get('/api/trades', requireAuth, (req, res) => {
  const rows = stmts.getTrades.all(req.userId);
  res.json(rows.map(rowToTrade));
});

app.post('/api/trades', requireAuth, (req, res) => {
  const t = req.body;
  if (!t.symbol || t.pnl === undefined) return res.status(400).json({ error: 'symbol and pnl are required' });

  const id = `${req.userId}-${Date.now()}`;
  const row = {
    id,
    user_id: req.userId,
    date: t.date || new Date().toISOString().split('T')[0],
    symbol: t.symbol,
    setup: t.setup || 'ORB',
    account: t.account || 'Apex Funded',
    pnl: Number(t.pnl),
    entry_time: t.entryTime || '',
    exit_time: t.exitTime || '',
    emotion_before: t.emotionBefore || 'Calm',
    emotion_after: t.emotionAfter || 'Neutral',
    followed_plan: t.followedPlan ? 1 : 0,
    notes: t.notes || '',
  };

  stmts.insertTrade.run(row);
  res.json(rowToTrade({ ...row }));
});

app.put('/api/trades/:id', requireAuth, (req, res) => {
  const t = req.body;
  const row = {
    id: req.params.id,
    user_id: req.userId,
    date: t.date,
    symbol: t.symbol,
    setup: t.setup,
    account: t.account,
    pnl: Number(t.pnl),
    entry_time: t.entryTime || '',
    exit_time: t.exitTime || '',
    emotion_before: t.emotionBefore || 'Calm',
    emotion_after: t.emotionAfter || 'Neutral',
    followed_plan: t.followedPlan ? 1 : 0,
    notes: t.notes || '',
  };
  const result = stmts.updateTrade.run(row);
  if (result.changes === 0) return res.status(404).json({ error: 'Trade not found' });
  res.json(rowToTrade({ ...row }));
});

app.delete('/api/trades/:id', requireAuth, (req, res) => {
  const result = stmts.deleteTrade.run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Trade not found' });
  res.json({ success: true });
});

// ─── AI COACH (Elite only) ────────────────────────────────────────────────

app.post('/api/chat', requireAuth, requirePlan('elite'), async (req, res) => {
  const { messages, mode, context } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const modeLabel = mode === 'premarket' ? 'PRE-MARKET SESSION' : 'POST-MARKET REVIEW';
  const system = `${COACH_SYSTEM_PROMPT}\n\n--- CURRENT MODE: ${modeLabel} ---${context ? `\n\nTrader context: ${context}` : ''}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages,
    });
    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Failed to reach AI coach' });
  }
});

// ─── AI PLAN BUILDER (Pro+ only) ──────────────────────────────────────────

app.post('/api/plan-chat', requireAuth, requirePlan('pro'), async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: PLAN_BUILDER_SYSTEM_PROMPT,
      messages,
    });
    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Plan builder error:', err.message);
    res.status(500).json({ error: 'Failed to reach AI plan builder' });
  }
});

// ─── STRIPE ───────────────────────────────────────────────────────────────

app.post('/api/stripe/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this server' });

  const { plan } = req.body;
  const priceId = PLAN_PRICES[plan];
  if (!priceId || priceId.includes('price_') && priceId.length < 20) {
    return res.status(400).json({ error: `No Stripe price configured for plan: ${plan}` });
  }

  const user = stmts.getUserById.get(req.userId);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined });
      customerId = customer.id;
      stmts.updateStripeCustomer.run(customerId, req.userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}?payment=cancelled`,
      subscription_data: {
        metadata: { userId: String(req.userId), plan },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/create-portal-session', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this server' });

  const user = stmts.getUserById.get(req.userId);
  if (!user.stripe_customer_id) {
    return res.status(400).json({ error: 'No billing account found' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  if (!stripe) return res.sendStatus(200);

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const PRICE_TO_PLAN = {
    [process.env.STRIPE_PRICE_TRADER]: 'trader',
    [process.env.STRIPE_PRICE_PRO]:    'pro',
    [process.env.STRIPE_PRICE_ELITE]:  'elite',
  };

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = PRICE_TO_PLAN[priceId] || 'trader';
      stmts.updatePlanByCustomerId.run(plan, subscriptionId, customerId);
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const priceId = sub.items.data[0]?.price.id;
    const plan = PRICE_TO_PLAN[priceId] || 'free';
    const status = sub.status;
    const activePlan = ['active', 'trialing'].includes(status) ? plan : 'free';
    stmts.updatePlanByCustomerId.run(activePlan, sub.id, sub.customer);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    stmts.updatePlanByCustomerId.run('free', null, sub.customer);
  }

  res.sendStatus(200);
});

// ─── PLAID / BROKERAGE SYNC ───────────────────────────────────────────────

app.get('/api/plaid/accounts', requireAuth, requirePlan('trader'), (req, res) => {
  res.json(stmts.getLinkedAccounts.all(req.userId));
});

app.post('/api/plaid/create-link-token', requireAuth, requirePlan('trader'), async (req, res) => {
  if (!plaidClient) return res.status(503).json({ error: 'Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to backend/.env to enable brokerage sync.' });
  try {
    const r = await plaidClient.linkTokenCreate({
      user: { client_user_id: String(req.userId) },
      client_name: 'EdgeLog',
      products: ['investments'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: r.data.link_token });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.post('/api/plaid/exchange-token', requireAuth, requirePlan('trader'), async (req, res) => {
  if (!plaidClient) return res.status(503).json({ error: 'Plaid not configured' });
  const { public_token, institution, accounts: plaidAccounts = [] } = req.body;
  if (!public_token) return res.status(400).json({ error: 'public_token required' });
  try {
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeRes.data;
    const toInsert = plaidAccounts.length > 0 ? plaidAccounts : [{ id: '', name: institution?.name || 'Brokerage', subtype: '' }];
    for (const acct of toInsert) {
      stmts.insertLinkedAccount.run({
        user_id: req.userId,
        institution_name: institution?.name || 'Brokerage',
        account_name: acct.name || '',
        account_type: acct.subtype || '',
        plaid_access_token: access_token,
        plaid_item_id: item_id,
        plaid_account_id: acct.id || '',
      });
    }
    const linked = stmts.getLinkedAccounts.all(req.userId);
    // Auto-sync first connected account
    const newAcct = stmts.getLinkedAccountById.get(linked[linked.length - 1].id, req.userId);
    const imported = await doPlaidSync(newAcct);
    res.json({ accounts: stmts.getLinkedAccounts.all(req.userId), imported });
  } catch (err) {
    console.error('Plaid exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.post('/api/plaid/sync/:id', requireAuth, requirePlan('trader'), async (req, res) => {
  if (!plaidClient) return res.status(503).json({ error: 'Plaid not configured' });
  const linked = stmts.getLinkedAccountById.get(req.params.id, req.userId);
  if (!linked) return res.status(404).json({ error: 'Account not found' });
  try {
    const imported = await doPlaidSync(linked);
    res.json({ imported, message: `${imported} new trade(s) imported` });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.delete('/api/plaid/accounts/:id', requireAuth, requirePlan('trader'), (req, res) => {
  stmts.deleteLinkedAccount.run(req.params.id, req.userId);
  res.json({ success: true });
});

async function doPlaidSync(linked) {
  const end   = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const r = await plaidClient.investmentsTransactionsGet({
    access_token: linked.plaid_access_token,
    start_date: start,
    end_date: end,
    options: linked.plaid_account_id ? { account_ids: [linked.plaid_account_id] } : undefined,
  });
  const txns = r.data.investment_transactions || [];
  let imported = 0;
  const batch = db.transaction(() => {
    for (const t of txns) {
      const id = `plaid-${t.investment_transaction_id}`;
      if (stmts.tradeExistsBySource.get(linked.user_id, id)) continue;
      const pnl = t.type === 'sell' ? Math.abs(t.amount) : -Math.abs(t.amount);
      stmts.insertTrade.run({
        id, user_id: linked.user_id,
        date: t.date,
        symbol: t.ticker_symbol || t.name || 'UNKNOWN',
        setup: 'ORB',
        account: linked.account_name || linked.institution_name,
        pnl: Math.round(pnl * 100) / 100,
        entry_time: '', exit_time: '',
        emotion_before: 'Calm', emotion_after: 'Neutral',
        followed_plan: 1,
        notes: `Auto-imported: ${t.type} ${t.quantity || ''} @ $${t.price || ''}`,
        source: 'plaid',
      });
      imported++;
    }
  });
  batch();
  stmts.updateLinkedAccountSynced.run(linked.id);
  return imported;
}

// ─── CSV IMPORT ───────────────────────────────────────────────────────────

app.post('/api/trades/import-csv', requireAuth, requirePlan('trader'), (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'rows array required' });
  let imported = 0, skipped = 0;
  const batch = db.transaction(() => {
    for (const t of rows) {
      if (!t.symbol || t.pnl === undefined || t.pnl === null || isNaN(Number(t.pnl))) { skipped++; continue; }
      const id = `csv-${req.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      stmts.insertTrade.run({
        id, user_id: req.userId,
        date: t.date || new Date().toISOString().split('T')[0],
        symbol: String(t.symbol).toUpperCase().trim(),
        setup: t.setup || 'ORB',
        account: t.account || 'Apex Funded',
        pnl: Number(t.pnl),
        entry_time: t.entryTime || t.entry_time || '',
        exit_time:  t.exitTime  || t.exit_time  || '',
        emotion_before: t.emotionBefore || t.emotion_before || 'Calm',
        emotion_after:  t.emotionAfter  || t.emotion_after  || 'Neutral',
        followed_plan: (t.followedPlan ?? t.followed_plan ?? true) ? 1 : 0,
        notes: t.notes || '',
        source: 'csv',
      });
      imported++;
    }
  });
  batch();
  res.json({ imported, skipped });
});

// ─── MISC ─────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`EdgeLog backend running on http://localhost:${PORT}`));

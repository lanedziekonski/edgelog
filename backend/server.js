require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const Anthropic = require('@anthropic-ai/sdk');

const { pool, initDb, rowToTrade } = require('./database');
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
  plaidClient = new PlaidApi(new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET':    process.env.PLAID_SECRET,
      },
    },
  }));
}

// ─── Anthropic ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────

function safeUser(user) {
  return { id: user.id, email: user.email, name: user.name, plan: user.plan };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *`,
      [email.toLowerCase().trim(), hash, name || '']
    );
    const user = rows[0];
    const token = signToken({ userId: user.id, plan: user.plan });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ userId: user.id, plan: user.plan });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── TRADES ───────────────────────────────────────────────────────────────

app.get('/api/trades', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM trades WHERE user_id = $1 ORDER BY date DESC, created_at DESC`,
      [req.userId]
    );
    res.json(rows.map(rowToTrade));
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

app.post('/api/trades', requireAuth, async (req, res) => {
  const t = req.body;
  if (!t.symbol || t.pnl === undefined) return res.status(400).json({ error: 'symbol and pnl are required' });
  const id = `${req.userId}-${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO trades (id, user_id, date, symbol, setup, account, pnl, entry_time, exit_time,
        emotion_before, emotion_after, followed_plan, notes, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id, req.userId,
        t.date || new Date().toISOString().split('T')[0],
        t.symbol, t.setup || 'ORB', t.account || 'Apex Funded',
        Number(t.pnl), t.entryTime || '', t.exitTime || '',
        t.emotionBefore || 'Calm', t.emotionAfter || 'Neutral',
        t.followedPlan ?? true, t.notes || '', 'manual',
      ]
    );
    const { rows } = await pool.query(`SELECT * FROM trades WHERE id = $1`, [id]);
    res.json(rowToTrade(rows[0]));
  } catch (err) {
    console.error('Insert trade error:', err);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

app.put('/api/trades/:id', requireAuth, async (req, res) => {
  const t = req.body;
  try {
    const result = await pool.query(
      `UPDATE trades SET date=$1, symbol=$2, setup=$3, account=$4, pnl=$5,
        entry_time=$6, exit_time=$7, emotion_before=$8, emotion_after=$9,
        followed_plan=$10, notes=$11
       WHERE id=$12 AND user_id=$13`,
      [
        t.date, t.symbol, t.setup, t.account, Number(t.pnl),
        t.entryTime || '', t.exitTime || '',
        t.emotionBefore || 'Calm', t.emotionAfter || 'Neutral',
        t.followedPlan ?? true, t.notes || '',
        req.params.id, req.userId,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Trade not found' });
    const { rows } = await pool.query(`SELECT * FROM trades WHERE id = $1`, [req.params.id]);
    res.json(rowToTrade(rows[0]));
  } catch (err) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

app.delete('/api/trades/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM trades WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Trade not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trade' });
  }
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
  if (!priceId) return res.status(400).json({ error: `No Stripe price configured for plan: ${plan}` });

  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    const user = rows[0];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined });
      customerId = customer.id;
      await pool.query(`UPDATE users SET stripe_customer_id = $1 WHERE id = $2`, [customerId, req.userId]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${frontendUrl}?payment=cancelled`,
      subscription_data: { metadata: { userId: String(req.userId), plan } },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/create-portal-session', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this server' });
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.userId]);
    const user = rows[0];
    if (!user.stripe_customer_id) return res.status(400).json({ error: 'No billing account found' });
    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripe_customer_id,
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

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const plan = PRICE_TO_PLAN[sub.items.data[0]?.price.id] || 'trader';
        await pool.query(
          `UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3`,
          [plan, session.subscription, session.customer]
        );
      }
    }
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const plan = PRICE_TO_PLAN[sub.items.data[0]?.price.id] || 'free';
      const activePlan = ['active', 'trialing'].includes(sub.status) ? plan : 'free';
      await pool.query(
        `UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3`,
        [activePlan, sub.id, sub.customer]
      );
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await pool.query(
        `UPDATE users SET plan = 'free', stripe_subscription_id = NULL WHERE stripe_customer_id = $1`,
        [sub.customer]
      );
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  res.sendStatus(200);
});

// ─── PLAID / BROKERAGE SYNC ───────────────────────────────────────────────

app.get('/api/plaid/accounts', requireAuth, requirePlan('trader'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, institution_name, account_name, account_type, plaid_account_id, last_synced, created_at
       FROM linked_accounts WHERE user_id = $1`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch linked accounts' });
  }
});

app.post('/api/plaid/create-link-token', requireAuth, requirePlan('trader'), async (req, res) => {
  if (!plaidClient) return res.status(503).json({ error: 'Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to your environment variables.' });
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
      await pool.query(
        `INSERT INTO linked_accounts (user_id, institution_name, account_name, account_type, plaid_access_token, plaid_item_id, plaid_account_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.userId, institution?.name || 'Brokerage', acct.name || '', acct.subtype || '', access_token, item_id, acct.id || '']
      );
    }

    const { rows: linked } = await pool.query(
      `SELECT id, user_id, institution_name, account_name, account_type, plaid_account_id, last_synced, created_at
       FROM linked_accounts WHERE user_id = $1 ORDER BY id DESC`,
      [req.userId]
    );
    const { rows: newAcctRows } = await pool.query(
      `SELECT * FROM linked_accounts WHERE id = $1 AND user_id = $2`,
      [linked[0].id, req.userId]
    );
    const imported = await doPlaidSync(newAcctRows[0]);
    const { rows: finalLinked } = await pool.query(
      `SELECT id, user_id, institution_name, account_name, account_type, plaid_account_id, last_synced, created_at
       FROM linked_accounts WHERE user_id = $1`,
      [req.userId]
    );
    res.json({ accounts: finalLinked, imported });
  } catch (err) {
    console.error('Plaid exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.post('/api/plaid/sync/:id', requireAuth, requirePlan('trader'), async (req, res) => {
  if (!plaidClient) return res.status(503).json({ error: 'Plaid not configured' });
  try {
    const { rows } = await pool.query(
      `SELECT * FROM linked_accounts WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Account not found' });
    const imported = await doPlaidSync(rows[0]);
    res.json({ imported, message: `${imported} new trade(s) imported` });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.delete('/api/plaid/accounts/:id', requireAuth, requirePlan('trader'), async (req, res) => {
  await pool.query(`DELETE FROM linked_accounts WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId]);
  res.json({ success: true });
});

async function doPlaidSync(linked) {
  const end   = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const r = await plaidClient.investmentsTransactionsGet({
    access_token: linked.plaid_access_token,
    start_date: start,
    end_date:   end,
    options: linked.plaid_account_id ? { account_ids: [linked.plaid_account_id] } : undefined,
  });
  const txns = r.data.investment_transactions || [];
  let imported = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of txns) {
      const id = `plaid-${t.investment_transaction_id}`;
      const { rows: existing } = await client.query(
        `SELECT id FROM trades WHERE user_id = $1 AND id = $2`,
        [linked.user_id, id]
      );
      if (existing.length > 0) continue;
      const pnl = t.type === 'sell' ? Math.abs(t.amount) : -Math.abs(t.amount);
      await client.query(
        `INSERT INTO trades (id, user_id, date, symbol, setup, account, pnl, entry_time, exit_time,
          emotion_before, emotion_after, followed_plan, notes, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          id, linked.user_id, t.date,
          t.ticker_symbol || t.name || 'UNKNOWN',
          'ORB', linked.account_name || linked.institution_name,
          Math.round(pnl * 100) / 100,
          '', '', 'Calm', 'Neutral', true,
          `Auto-imported: ${t.type} ${t.quantity || ''} @ $${t.price || ''}`,
          'plaid',
        ]
      );
      imported++;
    }
    await client.query(
      `UPDATE linked_accounts SET last_synced = NOW() WHERE id = $1`,
      [linked.id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return imported;
}

// ─── CSV IMPORT ───────────────────────────────────────────────────────────

app.post('/api/trades/import-csv', requireAuth, requirePlan('trader'), async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'rows array required' });

  let imported = 0, skipped = 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of rows) {
      if (!t.symbol || t.pnl === undefined || t.pnl === null || isNaN(Number(t.pnl))) { skipped++; continue; }
      const id = `csv-${req.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await client.query(
        `INSERT INTO trades (id, user_id, date, symbol, setup, account, pnl, entry_time, exit_time,
          emotion_before, emotion_after, followed_plan, notes, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          id, req.userId,
          t.date || new Date().toISOString().split('T')[0],
          String(t.symbol).toUpperCase().trim(),
          t.setup || 'ORB',
          t.account || 'Apex Funded',
          Number(t.pnl),
          t.entryTime || t.entry_time || '',
          t.exitTime  || t.exit_time  || '',
          t.emotionBefore || t.emotion_before || 'Calm',
          t.emotionAfter  || t.emotion_after  || 'Neutral',
          t.followedPlan  ?? t.followed_plan  ?? true,
          t.notes || '',
          'csv',
        ]
      );
      imported++;
    }
    await client.query('COMMIT');
    res.json({ imported, skipped });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'Import failed' });
  } finally {
    client.release();
  }
});

// ─── MISC ─────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── START ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`EdgeLog backend running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

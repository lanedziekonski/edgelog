require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const multer  = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

// Multer: memory storage — files are streamed to Cloudinary, not saved to disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Cloudinary config (lazy — only fails at request time if env vars are missing)
const cloudinary = require('./config/cloudinary');

const { pool, initDb, rowToTrade, rowToAccount } = require('./database');
const { signToken, requireAuth, requirePlan } = require('./middleware/auth');

const app = express();

// CORS — allow localhost in dev and the deployed frontend URL in prod
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://traderascend.com',
  'https://www.traderascend.com',
  'https://app.traderascend.com',
  'https://edgelog-mu.vercel.app',
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

// ─── Stripe ───────────────────────────────────────────────────────────────
const STRIPE_VARS = {
  STRIPE_SECRET_KEY:           process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET:       process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_TRADER_MONTHLY: process.env.STRIPE_PRICE_TRADER_MONTHLY,
  STRIPE_PRICE_TRADER_YEARLY:  process.env.STRIPE_PRICE_TRADER_YEARLY,
  STRIPE_PRICE_PRO_MONTHLY:    process.env.STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_YEARLY:     process.env.STRIPE_PRICE_PRO_YEARLY,
  STRIPE_PRICE_ELITE_MONTHLY:  process.env.STRIPE_PRICE_ELITE_MONTHLY,
  STRIPE_PRICE_ELITE_YEARLY:   process.env.STRIPE_PRICE_ELITE_YEARLY,
};

// Startup diagnostic — logs SET/MISSING for every Stripe env var (never logs values)
console.log('─── Stripe env var diagnostics ───────────────────────');
Object.entries(STRIPE_VARS).forEach(([key, val]) => {
  console.log(`  ${key}: ${val ? 'SET' : 'MISSING'}`);
});
console.log('──────────────────────────────────────────────────────');

let stripe = null;
if (STRIPE_VARS.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(STRIPE_VARS.STRIPE_SECRET_KEY);
    console.log('Stripe SDK initialised OK');
  } catch (err) {
    console.error('Stripe SDK init failed:', err.message);
  }
} else {
  console.warn('Stripe SDK NOT initialised: STRIPE_SECRET_KEY is missing');
}

const PLAN_PRICES = {
  trader_monthly: process.env.STRIPE_PRICE_TRADER_MONTHLY,
  trader_yearly:  process.env.STRIPE_PRICE_TRADER_YEARLY,
  pro_monthly:    process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly:     process.env.STRIPE_PRICE_PRO_YEARLY,
  elite_monthly:  process.env.STRIPE_PRICE_ELITE_MONTHLY,
  elite_yearly:   process.env.STRIPE_PRICE_ELITE_YEARLY,
};

// ─── Resend (email sending) ──────────────────────────────────────────────────
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Anthropic ────────────────────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('WARNING: ANTHROPIC_API_KEY is not set — AI routes will fail at request time');
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Referral helpers ─────────────────────────────────────────────────────
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TA';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getOrCreateReferralCode(userId) {
  const { rows } = await pool.query(
    'SELECT code FROM referral_codes WHERE user_id = $1', [userId]
  );
  if (rows[0]) return rows[0].code;
  let code, attempts = 0;
  do {
    code = generateReferralCode();
    attempts++;
    if (attempts > 30) throw new Error('Could not generate unique referral code');
    const { rows: exists } = await pool.query(
      'SELECT 1 FROM referral_codes WHERE code = $1', [code]
    );
    if (exists.length === 0) break;
  } while (true);
  await pool.query(
    'INSERT INTO referral_codes (user_id, code) VALUES ($1, $2)', [userId, code]
  );
  return code;
}

const COACH_SYSTEM_PROMPT = `You are an elite trading performance coach inside TraderAscend. Your sole purpose is to help traders improve their skills, discipline, mindset, and consistency — NOT to give financial advice.

STRICT RULES — never break these:
- NEVER tell the user to buy, sell, hold, or exit any specific trade or asset
- NEVER recommend specific stocks, futures, forex pairs, crypto, or any financial instrument
- NEVER give price targets, entry points, exit points, or stop loss levels
- NEVER predict market direction or say what the market "will" do
- NEVER give tax, legal, or investment advice of any kind
- If a user asks for direct financial advice, firmly but kindly redirect them: explain that you are a performance coach, not a financial advisor, and refocus on what they can control — their process, discipline, and execution

WHAT YOU SHOULD DO:
- Analyze the trader's journal entries, trade data, win rate, R:R ratio, drawdowns, and patterns
- Identify psychological patterns: revenge trading, overtrading, cutting winners short, holding losers too long, FOMO, etc.
- Give specific, actionable feedback on their process and habits
- Ask powerful coaching questions to build self-awareness
- Help them build and stick to their trading plan and rules
- Celebrate improvement and consistency, not just profits
- Focus on what the trader can control: execution quality, risk management habits, journaling consistency, emotional discipline
- If they had a losing streak, coach them through it — mindset, routine, reviewing mistakes — not by changing their strategy for them

SESSION ROLES:
- In PRE-MARKET MODE: Help the trader prepare mentally for the session. Ask about their focus, emotional state, and which of their own rules they want to prioritise today. Reinforce discipline before the bell.
- In POST-MARKET MODE: Review what happened. Ask about rule adherence, emotional patterns, and what to carry forward. Be honest, constructive, and data-driven.

GENERAL GUIDELINES:
- Never suggest specific setups or strategies the trader hasn't mentioned themselves
- Always refer back to the trader's own stated rules when coaching
- Ask clarifying questions rather than making assumptions
- Keep responses concise, direct, and actionable
- If the trader hasn't built a plan yet, encourage them to use the Trading Plan tab

TONE: Direct, supportive, data-driven. Like a seasoned trading coach who has seen it all. Firm when needed, encouraging always.`;

const PLAN_BUILDER_SYSTEM_PROMPT = `You are a trading plan coach. Your job is to interview the trader and help them build a fully custom, rules-based trading plan from scratch — based entirely on what they tell you. You make no assumptions about what they trade, how they trade, or what their rules are.

CRITICAL: Ask questions STRICTLY one at a time in this exact order. Never ask two questions at once. Never skip ahead. Never jump to risk management or setups before you fully understand their strategy.

Interview order (one question per message, wait for answer before moving on):
1. Overall strategy — already asked as the opening message. Wait for their answer.
2. Markets & instruments — what do they trade? Stocks, futures, forex, crypto, options? Specific instruments like NQ, ES, AAPL?
3. Entry criteria — what specific conditions must be true before they enter a trade?
4. Exit rules — how do they take profits? Where do they cut losses?
5. Risk management — position size, max loss per day, max trades per day?
6. When NOT to trade — news events, times of day, emotional states, market conditions that keep them out?
7. Emotional rules — how do they handle losing streaks, FOMO, revenge trading urges?

Only after all 7 topics are covered, write the complete trading plan. You MUST begin the plan with the exact marker line on its own line:

=== YOUR TRADING PLAN ===

Then write the plan in clearly labeled sections using this exact format:
**SECTION NAME**
1. Rule one
2. Rule two

Sections to include: Overview, Markets & Instruments, Entry Criteria, Exit Criteria, Risk Management, When NOT to Trade, Emotional Rules.

Rules:
- Only use what the trader explicitly told you — never invent rules or suggest strategies they didn't mention
- Keep each rule concrete and specific — no vague statements
- After outputting the plan, add one short sentence telling the trader their plan is saved and they can tap Edit Rules any time to update it
- If the trader wants to edit an existing plan, ask what they want to change, gather the updates, then rewrite and output the FULL updated plan with the === YOUR TRADING PLAN === marker again`;

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
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);
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

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    // Always return success to prevent email enumeration
    if (!rows[0]) return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
      [token, expires, rows[0].id]
    );

    const frontendUrl = process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
      ? process.env.FRONTEND_URL
      : 'https://traderascend.com';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: 'TraderAscend <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your TraderAscend password',
      html: `<div style="background:#0a0a0a;color:#fff;padding:40px;font-family:sans-serif;"><h2 style="color:#00ff41">Reset Your Password</h2><p>Click the link below to reset your password. It expires in 1 hour.</p><a href="${resetUrl}" style="background:#00ff41;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;margin-top:16px">Reset Password</a></div>`,
    });
    console.log(`[forgot-password] Reset email sent to ${email}`);

    res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
      [token]
    );
    if (!rows[0]) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2`,
      [hash, rows[0].id]
    );
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
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
        emotion_before, emotion_after, followed_plan, notes, source,
        entry_price, exit_price, quantity, side, stop_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        id, req.userId,
        t.date || new Date().toISOString().split('T')[0],
        t.symbol, t.setup || '', t.account || '',
        Number(t.pnl), t.entryTime || '', t.exitTime || '',
        t.emotionBefore || 'Calm', t.emotionAfter || 'Neutral',
        t.followedPlan ?? true, t.notes || '', 'manual',
        t.entryPrice != null ? Number(t.entryPrice) : null,
        t.exitPrice  != null ? Number(t.exitPrice)  : null,
        t.quantity   != null ? parseInt(t.quantity) : null,
        t.side       || null,
        t.stopPrice  != null ? Number(t.stopPrice)  : null,
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
        followed_plan=$10, notes=$11,
        entry_price=$12, exit_price=$13, quantity=$14, side=$15, stop_price=$16
       WHERE id=$17 AND user_id=$18`,
      [
        t.date, t.symbol, t.setup, t.account, Number(t.pnl),
        t.entryTime || '', t.exitTime || '',
        t.emotionBefore || 'Calm', t.emotionAfter || 'Neutral',
        t.followedPlan ?? true, t.notes || '',
        t.entryPrice != null ? Number(t.entryPrice) : null,
        t.exitPrice  != null ? Number(t.exitPrice)  : null,
        t.quantity   != null ? parseInt(t.quantity) : null,
        t.side       || null,
        t.stopPrice  != null ? Number(t.stopPrice)  : null,
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

// Patch only the reflective fields (emotions / notes / followed_plan)
app.patch('/api/trades/:id', requireAuth, async (req, res) => {
  const { emotionBefore, emotionAfter, notes, followedPlan } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trades SET emotion_before=$1, emotion_after=$2, notes=$3, followed_plan=$4
       WHERE id=$5 AND user_id=$6`,
      [
        emotionBefore ?? '',
        emotionAfter  ?? '',
        notes         ?? '',
        followedPlan  ?? true,
        req.params.id, req.userId,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Trade not found' });
    const { rows } = await pool.query(`SELECT * FROM trades WHERE id = $1`, [req.params.id]);
    res.json(rowToTrade(rows[0]));
  } catch (err) {
    console.error('Patch trade error:', err);
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

// ─── USER ACCOUNTS ────────────────────────────────────────────────────────

app.get('/api/accounts', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_accounts WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(rows.map(rowToAccount));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts', requireAuth, async (req, res) => {
  const { name, type, phase, startingBalance, dailyLossLimit, maxDrawdown, profitTarget } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Account name is required' });
  const id = `acct-${req.userId}-${Date.now()}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO user_accounts (id, user_id, name, type, phase, starting_balance, daily_loss_limit, max_drawdown, profit_target)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, req.userId, name.trim(), type || 'prop',
       (type === 'prop' ? (phase || 'evaluation') : null),
       startingBalance || 0,
       dailyLossLimit  || null,
       maxDrawdown     || null,
       profitTarget    || null]
    );
    res.json(rowToAccount(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.put('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const {
      name, type, phase,
      starting_balance, manual_balance,
      profit_target, max_drawdown, daily_loss_limit, min_trading_days,
    } = req.body;

    const result = await pool.query(
      `UPDATE user_accounts SET
        name = $1,
        type = $2,
        phase = $3,
        starting_balance = $4,
        manual_balance = $5,
        balance_last_updated = CASE WHEN $5::numeric IS NOT NULL THEN NOW() ELSE balance_last_updated END,
        profit_target = $6,
        max_drawdown = $7,
        daily_loss_limit = $8,
        min_trading_days = $9
      WHERE id = $10 AND user_id = $11
      RETURNING *`,
      [
        name,
        type || 'prop',
        phase || 'evaluation',
        starting_balance != null ? parseFloat(starting_balance) : null,
        manual_balance != null ? parseFloat(manual_balance) : null,
        profit_target != null ? parseFloat(profit_target) : null,
        max_drawdown != null ? parseFloat(max_drawdown) : null,
        daily_loss_limit != null ? parseFloat(daily_loss_limit) : null,
        min_trading_days != null ? parseInt(min_trading_days) : null,
        req.params.id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const a = result.rows[0];
    res.json({
      id: a.id,
      name: a.name,
      type: a.type,
      phase: a.phase,
      startingBalance: parseFloat(a.starting_balance) || 0,
      manualBalance: a.manual_balance != null ? parseFloat(a.manual_balance) : null,
      balanceLastUpdated: a.balance_last_updated,
      profitTarget: a.profit_target != null ? parseFloat(a.profit_target) : null,
      maxDrawdown: a.max_drawdown != null ? parseFloat(a.max_drawdown) : null,
      dailyLossLimit: a.daily_loss_limit != null ? parseFloat(a.daily_loss_limit) : null,
      minTradingDays: a.min_trading_days != null ? parseInt(a.min_trading_days) : null,
      createdAt: a.created_at,
    });
  } catch (err) {
    console.error('PUT /api/accounts/:id error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

app.patch('/api/accounts/:id/balance', requireAuth, async (req, res) => {
  const { balance } = req.body;
  if (balance === undefined || balance === null || isNaN(parseFloat(balance))) {
    return res.status(400).json({ error: 'Valid balance is required' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE user_accounts
       SET manual_balance=$1, balance_last_updated=NOW()
       WHERE id=$2 AND user_id=$3
       RETURNING *`,
      [parseFloat(balance), req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json(rowToAccount(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM user_accounts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ─── TRADING PLAN ─────────────────────────────────────────────────────────

app.get('/api/trading-plan/messages', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT role, content, created_at FROM trading_plan_messages WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get plan messages error:', err.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

app.post('/api/trading-plan/messages', requireAuth, async (req, res) => {
  const { role, content } = req.body;
  if (!role || !content) return res.status(400).json({ error: 'role and content required' });
  try {
    await pool.query(
      `INSERT INTO trading_plan_messages (user_id, role, content) VALUES ($1, $2, $3)`,
      [req.userId, role, content]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save plan message error:', err.message);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/api/trading-plan/plan', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT plan_content, updated_at FROM trading_plans WHERE user_id = $1`,
      [req.userId]
    );
    const found = !!rows[0];
    console.log(`[trading-plan] GET plan — user ${req.userId} — found: ${found}`);
    res.json(rows[0] || null);
  } catch (err) {
    console.error(`[trading-plan] GET plan FAILED for user ${req.userId}:`, err.message);
    res.status(500).json({ error: 'Failed to load plan' });
  }
});

app.post('/api/trading-plan/plan', requireAuth, async (req, res) => {
  const { planContent } = req.body;
  if (!planContent) return res.status(400).json({ error: 'planContent required' });
  console.log(`[trading-plan] Save attempt — user ${req.userId}, length ${planContent.length}`);
  try {
    const { rows } = await pool.query(
      `INSERT INTO trading_plans (user_id, plan_content)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET plan_content = $2, updated_at = NOW()
       RETURNING plan_content, updated_at`,
      [req.userId, planContent]
    );
    console.log(`[trading-plan] Saved successfully for user ${req.userId}`);
    res.json({ ok: true, plan_content: rows[0].plan_content, updatedAt: rows[0].updated_at });
  } catch (err) {
    console.error(`[trading-plan] Save FAILED for user ${req.userId}:`, err.message);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// Alias: /save maps to the same upsert so both paths work
app.post('/api/trading-plan/save', requireAuth, async (req, res) => {
  const { planContent } = req.body;
  if (!planContent) return res.status(400).json({ error: 'planContent required' });
  console.log(`[trading-plan/save] Save attempt — user ${req.userId}, length ${planContent.length}`);
  try {
    const { rows } = await pool.query(
      `INSERT INTO trading_plans (user_id, plan_content)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET plan_content = $2, updated_at = NOW()
       RETURNING plan_content, updated_at`,
      [req.userId, planContent]
    );
    console.log(`[trading-plan/save] Saved successfully for user ${req.userId}`);
    res.json({ ok: true, plan_content: rows[0].plan_content, updatedAt: rows[0].updated_at });
  } catch (err) {
    console.error(`[trading-plan/save] Save FAILED for user ${req.userId}:`, err.message);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

app.delete('/api/trading-plan', requireAuth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM trading_plans WHERE user_id = $1`, [req.userId]);
    await pool.query(`DELETE FROM trading_plan_messages WHERE user_id = $1`, [req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Reset plan error:', err.message);
    res.status(500).json({ error: 'Failed to reset plan' });
  }
});

// ─── REFERRALS ────────────────────────────────────────────────────────────

app.get('/api/referrals/my-code', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT code FROM referral_codes WHERE user_id = $1', [req.userId]
    );
    res.json({ code: rows[0]?.code || null });
  } catch (err) {
    console.error('Get referral code error:', err.message);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

app.post('/api/referrals/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  try {
    const { rows } = await pool.query(
      `SELECT rc.code, u.name FROM referral_codes rc JOIN users u ON u.id = rc.user_id WHERE UPPER(rc.code) = $1`,
      [code.trim().toUpperCase()]
    );
    if (!rows[0]) return res.json({ valid: false });
    const ownerFirstName = (rows[0].name || '').split(' ')[0] || null;
    res.json({ valid: true, discount_percent: 20, duration_months: 3, ownerFirstName });
  } catch (err) {
    console.error('Validate referral error:', err.message);
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.post('/api/referrals/apply', requireAuth, async (req, res) => {
  const { code, plan_type = 'monthly' } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  const billingType   = plan_type === 'annual' ? 'annual' : 'monthly';
  const durationMonths = billingType === 'annual' ? 12 : 3;
  try {
    const normalized = code.trim().toUpperCase();
    const { rows: codeRows } = await pool.query(
      'SELECT user_id FROM referral_codes WHERE code = $1', [normalized]
    );
    if (!codeRows[0]) return res.status(404).json({ error: 'Invalid referral code' });
    if (codeRows[0].user_id === req.userId) {
      return res.status(400).json({ error: "You can't use your own referral code" });
    }
    const { rows: existing } = await pool.query(
      'SELECT 1 FROM referral_uses WHERE referred_user_id = $1', [req.userId]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'You have already used a referral code' });
    await pool.query(
      `INSERT INTO referral_uses (code, referrer_user_id, referred_user_id, discount_percent, duration_months, plan_type)
       VALUES ($1, $2, $3, 20, $4, $5)`,
      [normalized, codeRows[0].user_id, req.userId, durationMonths, billingType]
    );
    res.json({ ok: true, discount_percent: 20, duration_months: durationMonths, plan_type: billingType });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'You have already used a referral code' });
    console.error('Apply referral error:', err.message);
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
});

app.get('/api/referrals/earnings', requireAuth, async (req, res) => {
  try {
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as referral_count FROM referral_uses WHERE referrer_user_id = $1`,
      [req.userId]
    );
    const { rows: earningsRows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_earned, COUNT(*) as payment_count
       FROM referral_earnings WHERE referrer_user_id = $1`,
      [req.userId]
    );
    const { rows: recentRows } = await pool.query(
      `SELECT re.amount, re.created_at, u.name as referred_name
       FROM referral_earnings re
       JOIN users u ON u.id = re.referred_user_id
       WHERE re.referrer_user_id = $1
       ORDER BY re.created_at DESC LIMIT 5`,
      [req.userId]
    );
    res.json({
      referral_count: parseInt(countRows[0].referral_count),
      total_earned:   parseFloat(earningsRows[0].total_earned),
      payment_count:  parseInt(earningsRows[0].payment_count),
      recent: recentRows.map(r => ({
        amount:       parseFloat(r.amount),
        createdAt:    r.created_at,
        referredName: (r.referred_name || '').split(' ')[0] || 'Trader',
      })),
    });
  } catch (err) {
    console.error('Referral earnings error:', err.message);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
});

// ─── AI COACH SESSIONS ────────────────────────────────────────────────────

// Flat list for all messages on a date (used by Calendar)
app.get('/api/coach/session/:date', requireAuth, async (req, res) => {
  const { date } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT role, content, created_at FROM coach_sessions
       WHERE user_id = $1 AND date = $2
       ORDER BY session_number ASC, created_at ASC`,
      [req.userId, date]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get coach session error:', err.message);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

// Grouped by session_number, filtered by period (used by AI Coach screen)
app.get('/api/coach/sessions/:date', requireAuth, async (req, res) => {
  const { date } = req.params;
  const { period } = req.query; // 'pre_market' | 'post_market'
  if (!period) return res.status(400).json({ error: 'period query param required' });
  try {
    const { rows } = await pool.query(
      `SELECT session_number, role, content FROM coach_sessions
       WHERE user_id = $1 AND date = $2 AND period = $3
       ORDER BY session_number ASC, created_at ASC`,
      [req.userId, date, period]
    );
    const map = {};
    for (const row of rows) {
      const n = row.session_number;
      if (!map[n]) map[n] = [];
      map[n].push({ role: row.role, content: row.content });
    }
    const sessions = Object.keys(map)
      .map(Number).sort((a, b) => a - b)
      .map(n => ({ session_number: n, messages: map[n] }));
    res.json(sessions);
  } catch (err) {
    console.error('Get coach sessions error:', err.message);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

app.post('/api/coach/session', requireAuth, async (req, res) => {
  const { date, role, content, session_number = 1, period = 'pre_market' } = req.body;
  if (!date || !role || !content) return res.status(400).json({ error: 'date, role, content required' });
  try {
    await pool.query(
      `INSERT INTO coach_sessions (user_id, date, role, content, session_number, period) VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, date, role, content, session_number, period]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save coach session error:', err.message);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// ─── AI COACH (Elite only) ────────────────────────────────────────────────

app.post('/api/chat', requireAuth, requirePlan('elite'), async (req, res) => {
  const { messages, period, context } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  const isPreMarket = period === 'pre_market';
  const modeLabel = isPreMarket ? 'PRE-MARKET SESSION' : 'POST-MARKET REVIEW';
  const periodContext = isPreMarket
    ? 'This is a pre-market coaching session. Help the trader prepare mentally and strategically for the trading day ahead. Focus on game planning, mindset, reviewing their trading plan, and setting intentions.'
    : 'This is a post-market coaching session. Help the trader review and reflect on their trading day. Focus on what went well, what to improve, emotional patterns, and lessons learned.';
  // Inject the user's saved trading plan if one exists
  const { rows: planRows } = await pool.query(
    'SELECT plan_content FROM trading_plans WHERE user_id = $1', [req.userId]
  );
  const savedPlan = planRows[0]?.plan_content || null;
  const planSection = savedPlan
    ? `\n\nTHIS TRADER'S TRADING PLAN (reference these specific rules when coaching):\n${savedPlan}`
    : '\n\nNote: This trader has not yet built a trading plan. Encourage them to use the Trading Plan tab to create one.';
  const system = `${COACH_SYSTEM_PROMPT}${planSection}\n\n--- CURRENT MODE: ${modeLabel} ---\n${periodContext}${context ? `\n\nSession context: ${context}` : ''}`;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });
    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Claude API error — status:', err.status, '| type:', err.error?.error?.type, '| message:', err.message);
    if (err.error) console.error('Claude API error body:', JSON.stringify(err.error));
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
      max_tokens: 2048,
      system: PLAN_BUILDER_SYSTEM_PROMPT,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });
    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Plan builder error — status:', err.status, '| type:', err.error?.error?.type, '| message:', err.message);
    if (err.error) console.error('Plan builder error body:', JSON.stringify(err.error));
    res.status(500).json({ error: 'Failed to reach AI plan builder' });
  }
});

// ─── STRIPE ───────────────────────────────────────────────────────────────

app.post('/api/stripe/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripe) {
    const missing = !process.env.STRIPE_SECRET_KEY ? 'STRIPE_SECRET_KEY' : 'Stripe SDK';
    return res.status(503).json({ error: `Stripe not configured: ${missing} is missing` });
  }
  const { plan, billing = 'monthly', referralCode } = req.body;
  const interval = billing === 'yearly' ? 'yearly' : 'monthly';
  const priceKey = `${plan}_${interval}`;
  const priceId = PLAN_PRICES[priceKey];
  if (!priceId) {
    const envVar = `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
    return res.status(400).json({ error: `No Stripe price configured for ${plan}/${interval} — set ${envVar} on Render` });
  }

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

    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${frontendUrl}?payment=cancelled`,
      subscription_data: { metadata: { userId: String(req.userId), plan } },
    };

    // Apply referral discount if a valid, non-self code was provided
    if (referralCode) {
      const normalizedCode = referralCode.trim().toUpperCase();
      const { rows: codeRows } = await pool.query(
        'SELECT user_id FROM referral_codes WHERE UPPER(code) = $1', [normalizedCode]
      );
      if (codeRows[0] && codeRows[0].user_id !== req.userId) {
        const couponId = interval === 'yearly' ? 'referral_yearly_20' : 'referral_monthly_20';
        sessionParams.discounts = [{ coupon: couponId }];
        sessionParams.metadata = {
          referralCode: normalizedCode,
          referrerUserId: String(codeRows[0].user_id),
          billingInterval: interval,
        };
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/create-portal-session', requireAuth, async (req, res) => {
  if (!stripe) {
    const missing = !process.env.STRIPE_SECRET_KEY ? 'STRIPE_SECRET_KEY' : 'Stripe SDK';
    return res.status(503).json({ error: `Stripe not configured: ${missing} is missing` });
  }
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
    [process.env.STRIPE_PRICE_TRADER_MONTHLY]: 'trader',
    [process.env.STRIPE_PRICE_TRADER_YEARLY]:  'trader',
    [process.env.STRIPE_PRICE_PRO_MONTHLY]:    'pro',
    [process.env.STRIPE_PRICE_PRO_YEARLY]:     'pro',
    [process.env.STRIPE_PRICE_ELITE_MONTHLY]:  'elite',
    [process.env.STRIPE_PRICE_ELITE_YEARLY]:   'elite',
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
        // Record referral signup if code was passed through checkout metadata
        const referralCode    = session.metadata?.referralCode;
        const referrerUserId  = session.metadata?.referrerUserId ? parseInt(session.metadata.referrerUserId) : null;
        const billingInterval = session.metadata?.billingInterval || 'monthly';
        if (referralCode && referrerUserId) {
          const { rows: buyerRows } = await pool.query(
            'SELECT id FROM users WHERE stripe_customer_id = $1', [session.customer]
          );
          const referredUserId = buyerRows[0]?.id;
          if (referredUserId && referredUserId !== referrerUserId) {
            const durationMonths = billingInterval === 'yearly' ? 12 : 3;
            await pool.query(
              `INSERT INTO referral_uses (code, referrer_user_id, referred_user_id, discount_percent, duration_months, plan_type)
               VALUES ($1, $2, $3, 20, $4, $5)
               ON CONFLICT (referred_user_id) DO NOTHING`,
              [referralCode, referrerUserId, referredUserId, durationMonths, billingInterval === 'yearly' ? 'annual' : 'monthly']
            );
            await pool.query(
              `UPDATE users SET referred_by_user_id = $1 WHERE id = $2 AND referred_by_user_id IS NULL`,
              [referrerUserId, referredUserId]
            );
          }
        }
      }
    }
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      if (!invoice.subscription) return res.sendStatus(200);
      // Only credit commission when a discount was actually applied to this invoice
      const discountApplied = Array.isArray(invoice.total_discount_amounts) &&
        invoice.total_discount_amounts.some(d => d.amount > 0);
      if (!discountApplied) return res.sendStatus(200);
      const { rows: payerRows } = await pool.query(
        'SELECT id, referred_by_user_id FROM users WHERE stripe_customer_id = $1', [invoice.customer]
      );
      const payer = payerRows[0];
      if (!payer || !payer.referred_by_user_id) return res.sendStatus(200);
      if (payer.referred_by_user_id === payer.id) return res.sendStatus(200); // self-referral guard
      // Commission = 20% of amount paid (Stripe amounts are in cents)
      const commissionAmount = (invoice.amount_paid * 0.20) / 100;
      await pool.query(
        `INSERT INTO referral_earnings (referrer_user_id, referred_user_id, stripe_invoice_id, amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (stripe_invoice_id) DO NOTHING`,
        [payer.referred_by_user_id, payer.id, invoice.id, commissionAmount]
      );
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

// ─── CSV IMPORT ───────────────────────────────────────────────────────────

app.post('/api/trades/import-csv', requireAuth, requirePlan('trader'), async (req, res) => {
  const { rows, accountId } = req.body;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'rows array required' });
  if (!accountId) return res.status(400).json({ error: 'accountId required' });

  // Resolve account name from DB
  const { rows: acctRows } = await pool.query(
    'SELECT name FROM user_accounts WHERE id = $1 AND user_id = $2',
    [accountId, req.userId]
  );
  if (!acctRows.length) return res.status(404).json({ error: 'Account not found' });
  const accountName = acctRows[0].name;

  let imported = 0, skipped = 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of rows) {
      if (!t.symbol || t.pnl === undefined || t.pnl === null || isNaN(Number(t.pnl))) { skipped++; continue; }

      const sym       = String(t.symbol).toUpperCase().trim();
      const entryTime = t.entryTime || t.entry_time || '';
      const exitTime  = t.exitTime  || t.exit_time  || '';
      const pnlNum    = Number(t.pnl);
      const date      = t.date || new Date().toISOString().split('T')[0];

      // Duplicate detection: same account + date + symbol + times + pnl (within $0.01)
      const { rows: dupes } = await client.query(
        `SELECT id FROM trades
         WHERE user_id=$1 AND account_id=$2 AND date=$3 AND symbol=$4
           AND entry_time=$5 AND exit_time=$6 AND ABS(pnl - $7) < 0.01`,
        [req.userId, accountId, date, sym, entryTime, exitTime, pnlNum]
      );
      if (dupes.length > 0) { skipped++; continue; }

      const id = `csv-${req.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await client.query(
        `INSERT INTO trades (id, user_id, date, symbol, setup, account, account_id, pnl,
          entry_time, exit_time, emotion_before, emotion_after, followed_plan, notes, source,
          entry_price, exit_price, quantity, side)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          id, req.userId, date, sym,
          t.setup || '',
          accountName,
          accountId,
          pnlNum,
          entryTime, exitTime,
          '', '', true, t.notes || '', 'csv',
          t.entryPrice != null ? Number(t.entryPrice) : null,
          t.exitPrice  != null ? Number(t.exitPrice)  : null,
          t.quantity   != null ? parseInt(t.quantity) : null,
          t.side       || null,
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

// ─── SCREENSHOT UPLOAD ────────────────────────────────────────────────────

// Helper: upload a buffer to Cloudinary via upload_stream
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

app.post('/api/trades/:id/screenshot', requireAuth, (req, res, next) => {
  upload.single('screenshot')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    return res.status(503).json({ error: 'Screenshot uploads are not configured on this server yet' });
  }
  try {
    // Delete old screenshot from Cloudinary if one exists
    const { rows: existing } = await pool.query(
      `SELECT screenshot_public_id FROM trades WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Trade not found' });
    if (existing[0].screenshot_public_id) {
      await cloudinary.uploader.destroy(existing[0].screenshot_public_id).catch(() => {});
    }

    // Upload new screenshot to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'tradeascend/screenshots',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    // Save URL + public_id to the trade
    await pool.query(
      `UPDATE trades SET screenshot_url = $1, screenshot_public_id = $2 WHERE id = $3 AND user_id = $4`,
      [result.secure_url, result.public_id, req.params.id, req.userId]
    );
    res.json({ screenshotUrl: result.secure_url });
  } catch (err) {
    console.error('Screenshot upload error:', err);
    res.status(500).json({ error: 'Upload failed — check Cloudinary credentials' });
  }
});

app.delete('/api/trades/:id/screenshot', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT screenshot_public_id FROM trades WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Trade not found' });
    if (rows[0].screenshot_public_id) {
      await cloudinary.uploader.destroy(rows[0].screenshot_public_id).catch(() => {});
    }
    await pool.query(
      `UPDATE trades SET screenshot_url = NULL, screenshot_public_id = NULL WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Screenshot delete error:', err);
    res.status(500).json({ error: 'Failed to delete screenshot' });
  }
});

// ─── DAILY JOURNAL ────────────────────────────────────────────────────────

app.get('/api/journal/daily/:date', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM daily_journal WHERE user_id = $1 AND date = $2`,
      [req.userId, req.params.date]
    );
    res.json(rows[0] ? rowToDailyJournal(rows[0]) : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

app.post('/api/journal/daily', requireAuth, async (req, res) => {
  const { date, preMarket, postMarket, mood } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO daily_journal (user_id, date, pre_market, post_market, mood)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date) DO UPDATE
         SET pre_market = $3, post_market = $4, mood = $5, updated_at = NOW()
       RETURNING *`,
      [req.userId, date, preMarket || '', postMarket || '', mood || '']
    );
    res.json(rowToDailyJournal(rows[0]));
  } catch (err) {
    console.error('Daily journal error:', err);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

app.put('/api/journal/daily/:date', requireAuth, async (req, res) => {
  const { preMarket, postMarket, mood } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO daily_journal (user_id, date, pre_market, post_market, mood)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date) DO UPDATE
         SET pre_market = $3, post_market = $4, mood = $5, updated_at = NOW()
       RETURNING *`,
      [req.userId, req.params.date, preMarket || '', postMarket || '', mood || '']
    );
    res.json(rowToDailyJournal(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// Fetch all dates that have journal entries (for calendar indicators)
app.get('/api/journal/daily', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT date, mood FROM daily_journal WHERE user_id = $1 ORDER BY date DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal dates' });
  }
});

function rowToDailyJournal(row) {
  return {
    id: row.id, date: row.date,
    preMarket: row.pre_market || '',
    postMarket: row.post_market || '',
    mood: row.mood || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── ADMIN ────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'tradeascend-jwt-secret';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), ADMIN_JWT_SECRET);
    if (!payload.admin) return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin not configured on this server' });
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ admin: true }, ADMIN_JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.name, u.plan, u.created_at, u.last_login,
             COUNT(t.id)::int AS trade_count
      FROM users u
      LEFT JOIN trades t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows.map(r => ({
      id: r.id,
      email: r.email,
      name: r.name || '',
      plan: r.plan || 'free',
      joinedAt: r.created_at,
      lastLogin: r.last_login || null,
      tradeCount: r.trade_count || 0,
    })));
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/:id/plan', requireAdmin, async (req, res) => {
  const { plan } = req.body;
  const validPlans = ['free', 'trader', 'pro', 'elite'];
  if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
  try {
    const { rows } = await pool.query(
      `UPDATE users SET plan = $1 WHERE id = $2 RETURNING id, email, plan`,
      [plan, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Admin set plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [totalUsers, planCounts, totalTrades, todaySignups, weekSignups] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM users`),
      pool.query(`SELECT plan, COUNT(*)::int AS count FROM users GROUP BY plan`),
      pool.query(`SELECT COUNT(*)::int AS count FROM trades`),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE created_at::date = $1::date`, [today]),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= $1`, [weekAgo]),
    ]);
    const byPlan = {};
    planCounts.rows.forEach(r => { byPlan[r.plan] = r.count; });
    res.json({
      totalUsers: totalUsers.rows[0].count,
      byPlan: {
        free:   byPlan.free   || 0,
        trader: byPlan.trader || 0,
        pro:    byPlan.pro    || 0,
        elite:  byPlan.elite  || 0,
      },
      totalTrades: totalTrades.rows[0].count,
      newToday:    todaySignups.rows[0].count,
      newThisWeek: weekSignups.rows[0].count,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/referrals', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT rc.id, rc.code, rc.created_at, u.email,
             COUNT(ru.id)::int AS use_count,
             COALESCE(SUM(ru.earnings_amount), 0) AS total_earnings
      FROM referral_codes rc
      JOIN users u ON u.id = rc.user_id
      LEFT JOIN referral_uses ru ON ru.code = rc.code
      GROUP BY rc.id, rc.code, rc.created_at, u.email
      ORDER BY rc.created_at DESC
    `);
    res.json(rows.map(r => ({
      id: r.id,
      code: r.code,
      email: r.email,
      createdAt: r.created_at,
      useCount: r.use_count || 0,
      totalEarnings: parseFloat(r.total_earnings) || 0,
    })));
  } catch (err) {
    console.error('Admin referrals error:', err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

app.post('/api/admin/referrals/assign', requireAdmin, async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'email and code are required' });
  try {
    const { rows: users } = await pool.query(
      `SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]
    );
    if (!users[0]) return res.status(404).json({ error: 'No user found with that email' });
    const cleanCode = code.toUpperCase().trim();
    await pool.query(
      `INSERT INTO referral_codes (user_id, code) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET code = $2`,
      [users[0].id, cleanCode]
    );
    res.json({ success: true, code: cleanCode });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That code is already assigned to another user' });
    console.error('Admin assign referral error:', err);
    res.status(500).json({ error: 'Failed to assign referral code' });
  }
});

// ─── MISC ─────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── 404 + GLOBAL ERROR HANDLER ──────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Must have 4 parameters for Express to treat it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`TraderAscend backend running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

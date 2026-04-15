const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  console.log('Connecting to database...');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                     SERIAL PRIMARY KEY,
      email                  TEXT UNIQUE NOT NULL,
      password_hash          TEXT NOT NULL,
      name                   TEXT DEFAULT '',
      plan                   TEXT DEFAULT 'free',
      stripe_customer_id     TEXT,
      stripe_subscription_id TEXT,
      created_at             TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trades (
      id             TEXT PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date           TEXT NOT NULL,
      symbol         TEXT NOT NULL,
      setup          TEXT NOT NULL,
      account        TEXT NOT NULL,
      pnl            DOUBLE PRECISION NOT NULL,
      entry_time     TEXT DEFAULT '',
      exit_time      TEXT DEFAULT '',
      emotion_before TEXT DEFAULT 'Calm',
      emotion_after  TEXT DEFAULT 'Neutral',
      followed_plan  BOOLEAN DEFAULT TRUE,
      notes          TEXT DEFAULT '',
      source         TEXT DEFAULT 'manual',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_accounts (
      id                TEXT PRIMARY KEY,
      user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name              TEXT NOT NULL,
      type              TEXT DEFAULT 'prop',
      starting_balance  NUMERIC DEFAULT 0,
      daily_loss_limit  NUMERIC,
      max_drawdown      NUMERIC,
      profit_target     NUMERIC,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS linked_accounts (
      id                 SERIAL PRIMARY KEY,
      user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution_name   TEXT NOT NULL,
      account_name       TEXT DEFAULT '',
      account_type       TEXT DEFAULT '',
      plaid_access_token TEXT,
      plaid_item_id      TEXT,
      plaid_account_id   TEXT,
      last_synced        TIMESTAMPTZ,
      created_at         TIMESTAMPTZ DEFAULT NOW()
    );
  `);
    // Migrations — safe to run on every boot
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_id TEXT`);
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price NUMERIC`);
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price NUMERIC`);
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS quantity INTEGER`);
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS side TEXT`);
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_price NUMERIC`);
    await pool.query(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot_url TEXT`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_journal (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date        TEXT NOT NULL,
        pre_market  TEXT DEFAULT '',
        post_market TEXT DEFAULT '',
        mood        TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trading_plan_messages (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role       TEXT NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trading_plans (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_content TEXT NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coach_sessions (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date       TEXT NOT NULL,
        role       TEXT NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS coach_sessions_user_date
      ON coach_sessions (user_id, date)
    `);
    await pool.query(`
      ALTER TABLE coach_sessions
      ADD COLUMN IF NOT EXISTS session_number INTEGER NOT NULL DEFAULT 1
    `);
    console.log('Database schema ready — all tables OK including trading_plans, coach_sessions');
  } catch (err) {
    console.error('Schema creation failed:', err.message);
    console.error('Full error:', err);
    throw err;
  }
}

function rowToTrade(row) {
  return {
    id:            row.id,
    date:          row.date,
    symbol:        row.symbol,
    setup:         row.setup,
    account:       row.account,
    accountId:     row.account_id || null,
    pnl:           parseFloat(row.pnl),
    entryTime:     row.entry_time,
    exitTime:      row.exit_time,
    emotionBefore: row.emotion_before,
    emotionAfter:  row.emotion_after,
    followedPlan:  row.followed_plan === true,
    notes:         row.notes,
    source:        row.source || 'manual',
    entryPrice:    row.entry_price  != null ? parseFloat(row.entry_price)  : null,
    exitPrice:     row.exit_price   != null ? parseFloat(row.exit_price)   : null,
    quantity:      row.quantity     != null ? parseInt(row.quantity)       : null,
    side:          row.side         || null,
    stopPrice:     row.stop_price   != null ? parseFloat(row.stop_price)   : null,
    screenshotUrl: row.screenshot_url || null,
  };
}

function rowToAccount(row) {
  return {
    id:              row.id,
    name:            row.name,
    type:            row.type || 'prop',
    startingBalance: parseFloat(row.starting_balance || 0),
    dailyLossLimit:  row.daily_loss_limit != null ? parseFloat(row.daily_loss_limit) : null,
    maxDrawdown:     row.max_drawdown     != null ? parseFloat(row.max_drawdown)     : null,
    profitTarget:    row.profit_target    != null ? parseFloat(row.profit_target)    : null,
    createdAt:       row.created_at,
  };
}

module.exports = { pool, initDb, rowToTrade, rowToAccount };

const { Pool } = require('pg');

// Use SSL for any remote database (anything that isn't localhost / 127.0.0.1)
const isRemote = process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  console.log('Connecting to database...');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('SSL enabled:', isRemote);
  try {
    await pool.query('SELECT 1'); // verify connection before running schema
    console.log('Database connection successful');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Full error:', err);
    throw err;
  }
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
    console.log('Database schema ready');
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
    pnl:           parseFloat(row.pnl),
    entryTime:     row.entry_time,
    exitTime:      row.exit_time,
    emotionBefore: row.emotion_before,
    emotionAfter:  row.emotion_after,
    followedPlan:  row.followed_plan === true,
    notes:         row.notes,
    source:        row.source || 'manual',
  };
}

module.exports = { pool, initDb, rowToTrade };

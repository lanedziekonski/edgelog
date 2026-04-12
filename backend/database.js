const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'edgelog.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password_hash TEXT  NOT NULL,
    name        TEXT    DEFAULT '',
    plan        TEXT    DEFAULT 'free',
    stripe_customer_id    TEXT,
    stripe_subscription_id TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trades (
    id             TEXT    PRIMARY KEY,
    user_id        INTEGER NOT NULL,
    date           TEXT    NOT NULL,
    symbol         TEXT    NOT NULL,
    setup          TEXT    NOT NULL,
    account        TEXT    NOT NULL,
    pnl            REAL    NOT NULL,
    entry_time     TEXT    DEFAULT '',
    exit_time      TEXT    DEFAULT '',
    emotion_before TEXT    DEFAULT 'Calm',
    emotion_after  TEXT    DEFAULT 'Neutral',
    followed_plan  INTEGER DEFAULT 1,
    notes          TEXT    DEFAULT '',
    source         TEXT    DEFAULT 'manual',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS linked_accounts (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    institution_name  TEXT    NOT NULL,
    account_name      TEXT    DEFAULT '',
    account_type      TEXT    DEFAULT '',
    plaid_access_token TEXT,
    plaid_item_id     TEXT,
    plaid_account_id  TEXT,
    last_synced       DATETIME,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migrations — add columns that didn't exist in earlier versions
const migrations = [
  `ALTER TABLE trades ADD COLUMN source TEXT DEFAULT 'manual'`,
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists — ignore */ }
}

// Prepared statements
const stmts = {
  insertUser: db.prepare(
    `INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)`
  ),
  getUserByEmail: db.prepare(`SELECT * FROM users WHERE email = ?`),
  getUserById: db.prepare(`SELECT * FROM users WHERE id = ?`),
  updateStripeCustomer: db.prepare(
    `UPDATE users SET stripe_customer_id = ? WHERE id = ?`
  ),
  updatePlanByCustomerId: db.prepare(
    `UPDATE users SET plan = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?`
  ),
  getUserByCustomerId: db.prepare(
    `SELECT * FROM users WHERE stripe_customer_id = ?`
  ),

  getTrades: db.prepare(
    `SELECT * FROM trades WHERE user_id = ? ORDER BY date DESC, created_at DESC`
  ),
  insertTrade: db.prepare(`
    INSERT INTO trades (id, user_id, date, symbol, setup, account, pnl, entry_time, exit_time, emotion_before, emotion_after, followed_plan, notes, source)
    VALUES (@id, @user_id, @date, @symbol, @setup, @account, @pnl, @entry_time, @exit_time, @emotion_before, @emotion_after, @followed_plan, @notes, @source)
  `),
  deleteTrade: db.prepare(`DELETE FROM trades WHERE id = ? AND user_id = ?`),
  updateTrade: db.prepare(`
    UPDATE trades SET date=@date, symbol=@symbol, setup=@setup, account=@account,
    pnl=@pnl, entry_time=@entry_time, exit_time=@exit_time,
    emotion_before=@emotion_before, emotion_after=@emotion_after,
    followed_plan=@followed_plan, notes=@notes
    WHERE id=@id AND user_id=@user_id
  `),

  // Linked accounts (Plaid)
  getLinkedAccounts: db.prepare(
    `SELECT id, user_id, institution_name, account_name, account_type, plaid_account_id, last_synced, created_at FROM linked_accounts WHERE user_id = ?`
  ),
  insertLinkedAccount: db.prepare(`
    INSERT INTO linked_accounts (user_id, institution_name, account_name, account_type, plaid_access_token, plaid_item_id, plaid_account_id)
    VALUES (@user_id, @institution_name, @account_name, @account_type, @plaid_access_token, @plaid_item_id, @plaid_account_id)
  `),
  getLinkedAccountById: db.prepare(
    `SELECT * FROM linked_accounts WHERE id = ? AND user_id = ?`
  ),
  deleteLinkedAccount: db.prepare(
    `DELETE FROM linked_accounts WHERE id = ? AND user_id = ?`
  ),
  updateLinkedAccountSynced: db.prepare(
    `UPDATE linked_accounts SET last_synced = CURRENT_TIMESTAMP WHERE id = ?`
  ),
  tradeExistsBySource: db.prepare(
    `SELECT id FROM trades WHERE user_id = ? AND id = ?`
  ),
};

function rowToTrade(row) {
  return {
    id: row.id,
    date: row.date,
    symbol: row.symbol,
    setup: row.setup,
    account: row.account,
    pnl: row.pnl,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    emotionBefore: row.emotion_before,
    emotionAfter: row.emotion_after,
    followedPlan: row.followed_plan === 1,
    notes: row.notes,
    source: row.source || 'manual',
  };
}

module.exports = { db, stmts, rowToTrade };

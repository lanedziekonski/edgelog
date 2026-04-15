#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const email = process.argv[2];
const code  = process.argv[3];

if (!email || !code) {
  console.error('Usage: node scripts/assign-referral-code.js <email> <code>');
  console.error('Example: node scripts/assign-referral-code.js creator@example.com TACREATOR');
  process.exit(1);
}

const normalizedCode = code.trim().toUpperCase();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function main() {
  // Look up the user
  const { rows: userRows } = await pool.query(
    'SELECT id, email FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (!userRows.length) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  const user = userRows[0];

  // Check if code is already taken by a different user
  const { rows: codeRows } = await pool.query(
    'SELECT user_id FROM referral_codes WHERE code = $1',
    [normalizedCode]
  );
  if (codeRows.length > 0 && codeRows[0].user_id !== user.id) {
    console.error(`Code "${normalizedCode}" is already assigned to a different user (id: ${codeRows[0].user_id})`);
    process.exit(1);
  }

  // Upsert: assign code to this user (replace if they already had one)
  await pool.query(
    `INSERT INTO referral_codes (user_id, code)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code`,
    [user.id, normalizedCode]
  );

  console.log(`Assigned referral code "${normalizedCode}" to ${user.email} (id: ${user.id})`);
  await pool.end();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

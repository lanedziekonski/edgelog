#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-elite.js <email>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function main() {
  const { rows } = await pool.query('SELECT id, email, plan FROM users WHERE email = $1', [email]);
  if (!rows.length) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  await pool.query('UPDATE users SET plan = $1 WHERE id = $2', ['elite', rows[0].id]);
  const { rows: updated } = await pool.query('SELECT id, email, plan FROM users WHERE id = $1', [rows[0].id]);
  console.log(`Updated: ${updated[0].email} → plan: ${updated[0].plan}`);
  await pool.end();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

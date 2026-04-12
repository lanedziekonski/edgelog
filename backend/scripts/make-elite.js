#!/usr/bin/env node
'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-elite.js <email>');
  process.exit(1);
}

const db = new Database(path.join(__dirname, '..', 'edgelog.db'));

const user = db.prepare('SELECT id, email, plan FROM users WHERE email = ?').get(email);
if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

db.prepare('UPDATE users SET plan = ? WHERE id = ?').run('elite', user.id);

const updated = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(user.id);
console.log(`Updated: ${updated.email} → plan: ${updated.plan}`);

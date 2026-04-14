// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, leave it unset — Vite proxies /api → localhost:3001.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://edgelog.onrender.com/api';

console.log('[api] BASE URL:', BASE, '| VITE_API_URL:', import.meta.env.VITE_API_URL);

async function call(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${BASE}${endpoint}`;
  console.log('[api]', options.method || 'GET', url);
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  register: (email, password, name) =>
    call('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email, password) =>
    call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token) => call('/auth/me', {}, token),

  // Trades
  getTrades: (token) => call('/trades', {}, token),
  createTrade: (token, trade) =>
    call('/trades', { method: 'POST', body: JSON.stringify(trade) }, token),
  updateTrade: (token, id, trade) =>
    call(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(trade) }, token),
  patchTrade: (token, id, fields) =>
    call(`/trades/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }, token),
  deleteTrade: (token, id) =>
    call(`/trades/${id}`, { method: 'DELETE' }, token),

  // AI
  chat: (token, messages, mode, context) =>
    call('/chat', { method: 'POST', body: JSON.stringify({ messages, mode, context }) }, token),
  planChat: (token, messages) =>
    call('/plan-chat', { method: 'POST', body: JSON.stringify({ messages }) }, token),

  // Stripe
  createCheckoutSession: (token, plan) =>
    call('/stripe/create-checkout-session', { method: 'POST', body: JSON.stringify({ plan }) }, token),
  createPortalSession: (token) =>
    call('/stripe/create-portal-session', { method: 'POST' }, token),

  // CSV import
  importCsv: (token, rows, accountId) =>
    call('/trades/import-csv', { method: 'POST', body: JSON.stringify({ rows, accountId }) }, token),

  // User accounts
  getAccounts:   (token)       => call('/accounts', {}, token),
  createAccount: (token, data) => call('/accounts', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteAccount: (token, id)   => call(`/accounts/${id}`, { method: 'DELETE' }, token),

  // Daily journal
  getDailyJournalDates: (token) => call('/journal/daily', {}, token),
  getDailyJournal: (token, date) => call(`/journal/daily/${date}`, {}, token),
  saveDailyJournal: (token, data) =>
    call('/journal/daily', { method: 'POST', body: JSON.stringify(data) }, token),

  // Trading plan
  getTradingPlanMessages: (token) => call('/trading-plan/messages', {}, token),
  saveTradingPlanMessage: (token, role, content) =>
    call('/trading-plan/messages', { method: 'POST', body: JSON.stringify({ role, content }) }, token),
  getTradingPlan: (token) => call('/trading-plan/plan', {}, token),
  saveTradingPlan: (token, planContent) =>
    call('/trading-plan/plan', { method: 'POST', body: JSON.stringify({ planContent }) }, token),
  resetTradingPlan: (token) =>
    call('/trading-plan', { method: 'DELETE' }, token),

  // Screenshot upload (uses FormData, not JSON)
  uploadScreenshot: async (token, tradeId, file) => {
    const BASE_URL = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : 'https://edgelog.onrender.com/api';
    const fd = new FormData();
    fd.append('screenshot', file);
    const res = await fetch(`${BASE_URL}/trades/${tradeId}/screenshot`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  // Plaid / linked accounts
  getLinkedAccounts: (token) => call('/plaid/accounts', {}, token),
  createLinkToken: (token) =>
    call('/plaid/create-link-token', { method: 'POST' }, token),
  exchangePlaidToken: (token, public_token, institution, accounts) =>
    call('/plaid/exchange-token', { method: 'POST', body: JSON.stringify({ public_token, institution, accounts }) }, token),
  syncLinkedAccount: (token, id) =>
    call(`/plaid/sync/${id}`, { method: 'POST' }, token),
  deleteLinkedAccount: (token, id) =>
    call(`/plaid/accounts/${id}`, { method: 'DELETE' }, token),
};

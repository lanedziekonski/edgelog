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
  forgotPassword: (email) =>
    call('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) =>
    call('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

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
  chat: (token, messages, period, context) =>
    call('/chat', { method: 'POST', body: JSON.stringify({ messages, period, context }) }, token),
  planChat: (token, messages) =>
    call('/plan-chat', { method: 'POST', body: JSON.stringify({ messages }) }, token),

  // AI Coach sessions
  // Flat (all messages for a date) — used by Calendar
  getCoachSession: (token, date) => call(`/coach/session/${date}`, {}, token),
  // Grouped by session_number, filtered by period — used by AI Coach screen
  getCoachSessions: (token, date, period) => call(`/coach/sessions/${date}?period=${period}`, {}, token),
  saveCoachMessage: (token, date, role, content, sessionNumber = 1, period = 'pre_market') =>
    call('/coach/session', { method: 'POST', body: JSON.stringify({ date, role, content, session_number: sessionNumber, period }) }, token),

  // Stripe
  createCheckoutSession: (token, plan, billing = 'monthly') =>
    call('/stripe/create-checkout-session', { method: 'POST', body: JSON.stringify({ plan, billing }) }, token),
  createPortalSession: (token) =>
    call('/stripe/create-portal-session', { method: 'POST' }, token),

  // Referrals
  getMyReferralCode: (token) => call('/referrals/my-code', {}, token),
  validateReferralCode: (code) => call('/referrals/validate', { method: 'POST', body: JSON.stringify({ code }) }),
  applyReferralCode: (token, code, billing = 'monthly') =>
    call('/referrals/apply', { method: 'POST', body: JSON.stringify({ code, plan_type: billing }) }, token),
  getReferralEarnings: (token) => call('/referrals/earnings', {}, token),

  // CSV import
  importCsv: (token, rows, accountId) =>
    call('/trades/import-csv', { method: 'POST', body: JSON.stringify({ rows, accountId }) }, token),

  // User accounts
  getAccounts:          (token)           => call('/accounts', {}, token),
  createAccount:        (token, data)     => call('/accounts', { method: 'POST', body: JSON.stringify(data) }, token),
  updateAccount:        (token, id, data) => call(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  updateAccountBalance: (token, id, balance) => call(`/accounts/${id}/balance`, { method: 'PATCH', body: JSON.stringify({ balance }) }, token),
  deleteAccount:        (token, id)       => call(`/accounts/${id}`, { method: 'DELETE' }, token),

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

};

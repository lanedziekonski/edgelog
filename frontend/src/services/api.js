// In production (Vercel), VITE_API_URL points to the Railway backend.
// In development, leave it unset — Vite proxies /api → localhost:3001.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function call(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
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
};

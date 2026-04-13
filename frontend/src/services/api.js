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

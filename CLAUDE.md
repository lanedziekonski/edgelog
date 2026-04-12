# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Two processes must run simultaneously:

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm start          # production
cd backend && npm run dev        # with auto-reload (nodemon)

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

App opens at http://localhost:5173. Vite proxies `/api/*` → `http://localhost:3001`.

## Environment Setup

`backend/.env` requires:
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
JWT_SECRET=change-this-in-production

# Stripe (optional — app works without these, payments just disabled)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TRADER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ELITE=price_...
FRONTEND_URL=http://localhost:5173
```

To receive Stripe webhooks locally:
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

## Architecture

### Backend (`backend/`)
Single-file Express server (`server.js`) with:
- `database.js` — SQLite via `better-sqlite3`. Three tables: `users`, `trades`, `linked_accounts`. New accounts start empty — no seed data. All prepared statements live here; `rowToTrade()` maps snake_case DB columns to camelCase JS.
- `middleware/auth.js` — `requireAuth` (JWT verification), `requirePlan(...plans)` (plan-level gating), `signToken()`.
- Stripe is lazily initialised — only active when `STRIPE_SECRET_KEY` is set and not a placeholder. The app degrades gracefully without it.

**API surface:**
| Method | Path | Auth | Plan |
|--------|------|------|------|
| POST | `/api/auth/register` | — | — |
| POST | `/api/auth/login` | — | — |
| GET | `/api/auth/me` | ✓ | — |
| GET/POST/PUT/DELETE | `/api/trades[/:id]` | ✓ | — |
| POST | `/api/chat` | ✓ | elite |
| POST | `/api/plan-chat` | ✓ | pro |
| POST | `/api/stripe/create-checkout-session` | ✓ | — |
| POST | `/api/stripe/create-portal-session` | ✓ | — |
| POST | `/api/stripe/webhook` | raw body | — |

### Frontend (`frontend/src/`)
Vite + React SPA. No router — tab state is a single `useState` in `App.jsx`.

**Key layers:**
- `context/AuthContext.jsx` — `user`, `token`, `login`, `register`, `logout`, `refreshUser`. Token persisted in `localStorage`. On mount, validates token via `/api/auth/me`.
- `services/api.js` — thin `fetch` wrapper. All API calls go through here with JWT header attached.
- `hooks/useTrades.js` — API-backed trades. Loads on token change. Exposes `{ trades, tradesLoading, addTrade, deleteTrade, updateTrade }`.
- `components/FeatureGate.jsx` — renders a lock screen or inline lock when `userPlan` doesn't meet `requiredPlan`. Accepts `inline` prop for embedded use.

**Feature gate map** (defined in `App.jsx → TAB_PLANS`):
```
free:   dashboard, journal
trader: + calendar, accounts
pro:    + plan (with AI builder)
elite:  + coach
```

**Screens:** Dashboard, Journal, Calendar, Accounts, TradingPlan, AICoach, Profile, Pricing, Auth.
`Pricing` renders full-screen (bypasses the shell layout). `Auth` renders when `user` is null.

### Subscription Tiers
| Plan | Price | Key unlocks |
|------|-------|-------------|
| Free | $0 | Journal + Dashboard |
| Trader | $19.99/mo | Calendar + Account tracking |
| Pro | $49.99/mo | AI Plan Builder (`/api/plan-chat`) |
| Elite | $99.99/mo | AI Coach (`/api/chat`) |

Plan is stored in `users.plan` in SQLite and in the JWT payload. Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) update the plan in the DB.

## Admin Scripts

```bash
# Upgrade any user to Elite tier (for testing all features)
cd backend && node scripts/make-elite.js user@example.com
```

## Trader Domain Context

The backend's `COACH_SYSTEM_PROMPT` and `PLAN_BUILDER_SYSTEM_PROMPT` in `server.js` encode the trader's specific rules. Edit those constants when changing AI behaviour.
- Setups: ORB, VWAP Reclaim, Bull Flag, Gap Fill, Fade High
- Accounts: Apex Funded $100K (prop), FTMO $50K (eval), tastytrade $25K (live)
- Risk rules: max 2% per trade, max 3 trades/day, break after 2 losses, no FOMO, no revenge trading

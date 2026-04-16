# TraderAscend

A personal trading journal web app. Dark-themed, mobile-first, AI-powered.

**Stack:** React + Vite (frontend) · Node.js + Express + SQLite (backend) · Claude AI

---

## Local Development

Two terminals required:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
cp .env.example .env        # fill in ANTHROPIC_API_KEY and JWT_SECRET
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` → `localhost:3001` automatically. No env vars needed for local frontend.

---

## Deployment

### Overview

| Layer    | Platform | Notes |
|----------|----------|-------|
| Backend  | Railway  | Node.js + SQLite with persistent volume |
| Frontend | Vercel   | Static Vite build |

---

## Deploy Backend → Railway

### Step 1 — Create Railway account

Go to **railway.app** → Sign up (free tier available, no credit card required for hobby plan).

### Step 2 — Push code to GitHub

```bash
cd /path/to/tradeascend
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/tradeascend.git
git push -u origin main
```

### Step 3 — Create Railway project

1. In Railway dashboard → **New Project** → **Deploy from GitHub repo**
2. Select your `tradeascend` repository
3. Railway will detect the repo — click **Add Service** → **GitHub Repo**

### Step 4 — Set the root directory

In the service settings:
1. Click your service → **Settings** tab
2. Under **Source** → set **Root Directory** to `backend`
3. Railway will now install and run from the `backend/` folder

### Step 5 — Add a persistent volume (critical for SQLite)

SQLite data must survive redeploys. Without a volume, your database resets every deploy.

1. In your Railway project → **New** → **Volume**
2. Mount path: `/data`
3. Attach it to your backend service

### Step 6 — Set environment variables

In your service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your key) |
| `JWT_SECRET` | Any long random string (e.g. 64 hex chars) |
| `DB_PATH` | `/data/tradeascend.db` |
| `FRONTEND_URL` | Your Vercel URL (set after frontend is deployed — see below) |
| `PORT` | Leave unset — Railway sets this automatically |

Optional (only if using Stripe payments):

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRICE_TRADER` | `price_...` |
| `STRIPE_PRICE_PRO` | `price_...` |
| `STRIPE_PRICE_ELITE` | `price_...` |

### Step 7 — Deploy

Railway deploys automatically on every push to `main`. Watch the deploy logs — it should show:

```
TraderAscend backend running on http://localhost:XXXX
```

### Step 8 — Get your backend URL

In Railway → your service → **Settings** → **Networking** → **Generate Domain**

Your backend URL will look like:
```
https://edgelog-backend-production-xxxx.up.railway.app
```

Test it: `https://YOUR_RAILWAY_URL/api/health` should return `{"status":"ok"}`

---

## Deploy Frontend → Vercel

### Step 1 — Create Vercel account

Go to **vercel.com** → Sign up with GitHub (free, no credit card).

### Step 2 — Import project

1. Vercel dashboard → **Add New Project** → **Import Git Repository**
2. Select your `tradeascend` repo
3. **Important:** Under **Root Directory** → set it to `frontend`
4. Framework preset will auto-detect as **Vite**
5. Build command: `npm run build` (auto-detected)
6. Output directory: `dist` (auto-detected)

### Step 3 — Set environment variables

Under **Environment Variables** before deploying:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL (no trailing slash) |

Example:
```
VITE_API_URL = https://edgelog-backend-production-xxxx.up.railway.app
```

### Step 4 — Deploy

Click **Deploy**. Vercel will build and deploy in ~1 minute.

Your frontend URL will look like:
```
https://edgelog.vercel.app
```
or
```
https://edgelog-yourusername.vercel.app
```

### Step 5 — Update Railway FRONTEND_URL

Go back to Railway → your service → **Variables** → update `FRONTEND_URL` to your Vercel URL.

Railway will redeploy automatically. This is needed for CORS to allow requests from your frontend.

---

## Final URLs

After both are deployed:

- **App (share this):** `https://edgelog.vercel.app`
- **Backend API:** `https://edgelog-backend-production-xxxx.up.railway.app`
- **Health check:** `https://edgelog-backend-production-xxxx.up.railway.app/api/health`

---

## Environment Variables Summary

### Backend (Railway)

```
ANTHROPIC_API_KEY    # Required — Claude AI key
JWT_SECRET           # Required — any long random string
DB_PATH              # Required on Railway — /data/tradeascend.db
FRONTEND_URL         # Required — your Vercel URL (for CORS)
PORT                 # Set by Railway automatically — do not set manually
```

### Frontend (Vercel)

```
VITE_API_URL         # Required — your Railway backend URL (no trailing slash)
```

---

## Admin — Elevate a user to Elite

```bash
cd backend
node scripts/make-elite.js user@example.com
```

---

## Architecture

```
frontend/          React + Vite SPA
  src/
    screens/       Dashboard, Journal, Calendar, Accounts, TradingPlan, AICoach, Profile, Pricing, Auth
    components/    BottomNav, BrokerageSync, FeatureGate
    hooks/         useTrades (API-backed, no localStorage)
    context/       AuthContext (JWT, plan gating)
    services/      api.js (all fetch calls)

backend/
  server.js        Express API (~500 lines)
  database.js      SQLite schema + prepared statements
  middleware/
    auth.js        JWT verify, requireAuth, requirePlan()
  scripts/
    make-elite.js  Admin plan upgrade tool
```

### Subscription tiers

| Plan | Price | Unlocks |
|------|-------|---------|
| Free | $0 | Dashboard + Journal |
| Trader | $19.99/mo | Calendar + Accounts + CSV Import |
| Pro | $49.99/mo | AI Plan Builder |
| Elite | $99.99/mo | AI Coach |

# TradeAscend Marketing Website — Project Rules

## Scope Constraint (MANDATORY)

**You may ONLY work inside the `website/` folder.**

Before making any change, confirm the file path starts with `website/`.  
If it does not → **stop and tell the user instead of making the change yourself.**

### Strictly off-limits
| Folder | Reason |
|--------|--------|
| `frontend/` | Mobile app — do not read, edit, or delete |
| `backend/` | Mobile app server — do not read, edit, or delete |
| Any other root-level file/folder outside `website/` | Out of scope |

---

## Project Context

- **Repo:** https://github.com/lanedziekonski/edgelog.git — `website` branch
- **Live app (mobile):** https://edgelog-mu.vercel.app
- **Backend API:** https://edgelog.onrender.com (set via `website/.env` → `VITE_API_URL`)
- **This folder:** marketing website only — drives signups to the live app

## Tech Stack

- Vite + React 18
- React Router v6
- Tailwind CSS v3
- Framer Motion
- Lucide React

## Deploy

Push to `origin website` branch only. Vercel picks up `website/` automatically.

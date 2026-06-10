# N-Flow — Single Unified Codebase

This repository is now **one application**. The three websites that used to run
separately — **N-Flow**, **HR**, and **Billing** — are all served by this single
Next.js app. You run **one** project; there is no longer anything to start
separately.

## What used to be separate, and where it lives now

| Old standalone project | Old stack            | Now lives at (one app)                     |
| ---------------------- | -------------------- | ------------------------------------------ |
| N-Flow (`frontend`)    | Next.js + Supabase   | this repo root (`/`, `/admin`, `/employee`)|
| HR (`nr-hr-main`)      | Next.js + Turso      | `/admin/hr/*` + `/api/employees`, `/api/payroll`, `/api/pending-candidates`, `/api/config`, `/api/dashboard` |
| Billing (`newrro-billing`) | Vite SPA         | `/admin/billing`                           |

Everything is reachable from the shared sidebar after logging in. Authentication
is unified under Supabase — the old separate HR login (iron-session) and Billing
login screens were replaced by the single N-Flow login. **No features were
removed**; the HR and Billing pages, components, API routes, calculations, PDF
generation, and data logic were all moved into this app unchanged in behaviour.

The two old standalone folders (`nr-hr-main`, `newrro-billing`) were removed
because they were redundant copies — their full functionality already exists
here. The `n-flow-mobile` folder is kept: it is a Capacitor mobile wrapper (not a
website) that simply loads this web app's URL.

## Run it (single project)

```bash
npm install
npm run dev          # development at http://localhost:3000
# or for production:
npm run build
npm start
```

## Environment

Configuration lives in `.env.local` (see `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase auth/data (used by N-Flow + Billing + shared auth).
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — the HR/payroll database. If unset, it
  falls back to the local SQLite file `payroll.db` included here, so HR works out
  of the box for local runs.

## Deployment

Deploy this one project (e.g. Vercel, or `npm run build && npm start` behind any
Node host). One build, one server, one domain — `/admin/hr` and `/admin/billing`
are routes inside it, not separate deployments.

## Mobile (optional)

`n-flow-mobile/` wraps the web app with Capacitor. Point its
`capacitor.config.json` `server.url` at wherever you host this app, then build the
native shell as usual. It is not required to run the websites.

# STRUCTURE
_Last updated: 2026-05-21 | Focus: arch_

## Summary
Standard Next.js 16 App Router layout with `src/` prefix. Feature components live in `src/components/features/`, pure query functions in `src/lib/`, and mutations in `src/actions/`. Supabase Edge Functions and migrations are colocated in `supabase/`.

---

## Directory Tree

```
romma/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.js               # Root layout (SpeedInsights, fonts)
│   │   ├── page.js                 # Public homepage
│   │   ├── globals.css             # CSS custom properties, global classes
│   │   ├── login/
│   │   │   └── page.js             # Login form (Tailwind-styled)
│   │   ├── unidades/               # Public unidades listing
│   │   ├── dashboard/
│   │   │   ├── layout.js           # Dashboard shell (nav/sidebar)
│   │   │   ├── page.js             # Metrics overview
│   │   │   ├── contratos/
│   │   │   │   ├── page.js         # Contratos list
│   │   │   │   └── [id]/
│   │   │   │       └── page.js     # Contrato detail + Parcelas
│   │   │   ├── locatarios/
│   │   │   │   └── page.js         # Locatários list
│   │   │   └── unidades/
│   │   │       └── page.js         # Unidades management
│   │   └── portal/                 # Locatário portal (shell, no pages)
│   │
│   ├── components/
│   │   ├── features/               # Domain feature components (all Client)
│   │   │   ├── Contratos.js        # Legacy
│   │   │   ├── ContratosDesktop.js # Active — Romma 2.0 UI
│   │   │   ├── GestaoEdificios.js  # Edifícios management
│   │   │   ├── Locatarios.js       # Legacy (Tailwind, old patterns)
│   │   │   ├── LocatariosDesktop.js# Active — Romma 2.0 UI
│   │   │   ├── Parcelas.js         # Parcelas detail view
│   │   │   ├── Unidades.js         # Legacy
│   │   │   └── UnidadesDesktop.js  # Active (if exists)
│   │   └── ui/                     # shadcn/ui primitives
│   │
│   ├── actions/                    # Server Actions ('use server')
│   │   ├── contratos.js
│   │   ├── edificios.js
│   │   ├── locatarios.js
│   │   ├── parcelas.js
│   │   └── unidades.js
│   │
│   ├── lib/                        # Utilities and Supabase clients
│   │   ├── auth.js                 # isProprietario() — calls is_proprietario() RPC
│   │   ├── queries-client.js       # Browser queries (uses supabase-browser)
│   │   ├── queries-server.js       # Server queries (uses supabase-server, server-only)
│   │   ├── supabase.js             # Anon singleton
│   │   ├── supabase-browser.js     # createBrowserClient() via @supabase/ssr
│   │   ├── supabase-server.js      # createServer() — cookie-aware async factory
│   │   ├── supabaseAdmin.js        # Service role — server-only
│   │   ├── supabaseJWT.js          # Legacy JWT — server-only, Edge Function only
│   │   └── utils.js                # fmtBRL, fmtData, cn()
│   │
│   ├── hooks/
│   │   └── useUnidadesRealtime.js  # Supabase Realtime subscription
│   │
│   └── proxy.js                    # Next.js 16 middleware (auth + role guard)
│
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   └── gerar-parcelas/
│   │       └── index.ts            # Deno Edge Function
│   └── migrations/                 # 6 SQL migration files
│
├── e2e/                            # Playwright tests
│   ├── global-setup.js
│   ├── seed.mjs
│   ├── fixtures.js
│   ├── helpers.js
│   ├── auth-redirect.spec.js
│   ├── auth-session.spec.js
│   ├── dashboard-smoke.spec.js
│   └── server-actions.spec.js
│
├── docs/                           # TCC documentation
├── public/
├── next.config.mjs
├── jsconfig.json                   # Path aliases: @/* → ./src/*
├── components.json                 # shadcn/ui config
├── playwright.config.js
└── package.json
```

---

## What Lives Where

| Location | Content |
|---|---|
| `src/app/*/page.js` | Thin shells — import one feature component, minimal or no logic |
| `src/components/features/` | All business logic, state, event handlers |
| `src/actions/` | All writes — `'use server'`, use `supabaseAdmin` |
| `src/lib/queries-*.js` | Pure read functions — no hooks, no state |
| `src/lib/supabase*.js` | Client instances only — no business logic |
| `supabase/migrations/` | Schema source of truth — applied in order |
| `e2e/` | Playwright specs + test infrastructure |

---

## Key Config Files

| File | Purpose |
|---|---|
| `next.config.mjs` | Next.js config (Turbopack, React Compiler) |
| `jsconfig.json` | Path alias `@/*` → `./src/*` |
| `components.json` | shadcn/ui: style=`new-york`, baseColor=`neutral`, CSS vars=true |
| `playwright.config.js` | E2E: Chromium only, sequential, `webServer` auto-start |
| `supabase/config.toml` | Local Supabase dev config |
| `.env.example` | Required env vars template |

---

## Entry Points

| Entry | Description |
|---|---|
| `src/app/layout.js` | Root layout — all pages |
| `src/proxy.js` | Runs on every request to protected routes |
| `supabase/functions/gerar-parcelas/index.ts` | Edge Function entry |
| `e2e/global-setup.js` | Test seed entry |

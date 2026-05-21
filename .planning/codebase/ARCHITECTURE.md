# ARCHITECTURE
_Last updated: 2026-05-21 | Focus: arch_

## Summary
Romma uses Next.js 16 App Router with a clear Server/Client component split. The proprietário dashboard is a protected SPA-like area; the public page is server-rendered. All mutations go through Server Actions using the admin Supabase client, bypassing RLS.

---

## High-Level Architecture

```
Browser
  │
  ├── Public pages (SSR)          → Server Components → queries-server.js → supabase-server (anon)
  │     src/app/page.js
  │     src/app/unidades/
  │
  ├── Dashboard (CSR feature components)
  │     src/app/dashboard/*        → Client Components → queries-client.js → supabase-browser (anon)
  │                                → Server Actions   → supabaseAdmin (service role)
  │
  └── Auth
        src/app/login/             → Supabase Auth (email invite only)
        src/proxy.js               → Auth + role guard (Next.js 16 middleware)

Server Actions (src/actions/)
  └── supabaseAdmin → Postgres (bypasses RLS)
  └── supabaseJWT → Edge Function (gerar-parcelas)

Edge Functions (Deno)
  └── supabase/functions/gerar-parcelas/
        └── service role client → Postgres (atomic parcela insert)

Supabase Postgres
  ├── Tables: edificios, unidades, locatarios, contratos, parcelas, proprietarios
  ├── RLS: all tables (bypassed by service role)
  ├── Functions: is_proprietario() — SECURITY DEFINER
  └── pg_cron: status transitions daily at 06:00/06:05 UTC

Realtime
  └── useUnidadesRealtime.js → Supabase Realtime channel → public unidades page
```

---

## Data Flow

### Read (dashboard)
```
Client Component
  → useEffect
  → queries-client.js (e.g. getContratos())
  → supabase-browser (anon, RLS-restricted)
  → Postgres
  → state update → render
```

### Read (public page)
```
page.js (Server Component)
  → await queries-server.js (e.g. getUnidadesDisponiveis())
  → supabase-server (anon, RLS-restricted)
  → Postgres
  → HTML rendered server-side
```

### Write (mutation)
```
Client Component
  → calls Server Action (src/actions/*.js)
  → authGuard() validates session via supabase-server
  → supabaseAdmin writes to Postgres (bypasses RLS)
  → returns { status: 200 } or { status: 5xx, erroMessage: '...' }
  → Client Component re-fetches data
```

### Contract creation with parcelas
```
criarContrato() Server Action
  → supabaseAdmin: INSERT contratos
  → supabaseAdmin: UPDATE unidades SET status = 'alugada'
  → gerarParcelas() Server Action
    → supabaseJWT.functions.invoke('gerar-parcelas', { Authorization: Bearer <jwt> })
    → Deno Edge Function
      → service role client: INSERT parcelas (upsert, idempotent)
```

---

## Auth & Role Architecture

```
Supabase Auth (auth.users)
  ↓
proprietarios table (public.proprietarios)
  ↓
is_proprietario() SECURITY DEFINER function
  ↓
proxy.js checks role → allow dashboard | redirect to /
```

- One proprietário per Romma instance (sole owner model)
- Locatários are invited via `inviteUserByEmail` — they exist in `auth.users` but have no dashboard access
- Role check: `supabase.rpc('is_proprietario')` — not JWT claim-based

---

## Server vs Client Component Split

| Layer | Type | Pattern |
|---|---|---|
| `src/app/*/page.js` | Server Component | Thin shell — imports one feature component |
| `src/app/dashboard/layout.js` | Server Component | Shared nav/sidebar |
| `src/components/features/*.js` | Client Component | Owns all state, data fetching, and event handling |
| `src/hooks/*.js` | Client hooks | `useUnidadesRealtime.js` for Realtime subscription |
| `src/actions/*.js` | Server Actions (`'use server'`) | All mutations |
| `src/lib/queries-*.js` | Pure functions | No hooks/state — called from useEffect or Server Actions |

---

## Route Structure

```
/                           → Public homepage (unidades disponíveis)
/login                      → Auth
/unidades                   → Public unidades listing
/dashboard                  → Proprietário dashboard overview (metrics)
/dashboard/contratos        → Contratos list
/dashboard/contratos/[id]   → Contrato detail + Parcelas
/dashboard/locatarios       → Locatários list
/dashboard/unidades         → Unidades management
/portal                     → Locatário portal (shell — no pages implemented)
```

All `/dashboard/*` routes protected by `src/proxy.js`.

---

## Key Architectural Decisions

1. **Service role for all writes** — simplifies RLS (read-only policies suffice). Trade-off: all auth must be validated in Server Actions manually.
2. **Thin page shells** — all business logic in feature Client Components. Enables fast navigation without SSR for dashboard routes.
3. **Separate query files per context** — `queries-client.js` vs `queries-server.js` prevents server code leaking to browser bundles.
4. **Edge Function for parcela generation** — ensures atomic insert of N parcelas. Trade-off: non-atomic with contract creation (no cross-boundary transaction).
5. **pg_cron for status automation** — parcela status transitions handled server-side daily instead of compute-on-read. Trade-off: status lags up to 24h.

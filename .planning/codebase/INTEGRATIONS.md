# INTEGRATIONS
_Last updated: 2026-05-21 | Focus: tech_

## Summary
Romma integrates with Supabase (Postgres + Auth + Edge Functions + Realtime) via 5 distinct client instances. Server Actions handle all mutations. Edge Function handles parcela generation atomically. pg_cron automates status transitions daily.

---

## Supabase Clients

Five clients — never mix their roles:

| File | Key | Use |
|---|---|---|
| `lib/supabase.js` | anon | General client-side singleton; not cookie-aware |
| `lib/supabase-browser.js` | anon | `queries-client.js` — cookie-aware via `@supabase/ssr` `createBrowserClient()` |
| `lib/supabase-server.js` | anon | Server Components + Server Actions auth checks — reads/writes cookies via `next/headers` |
| `lib/supabaseAdmin.js` | service role | All Server Action writes (bypasses RLS); Auth admin API. Guarded by `server-only`. **Never import in Client Components.** |
| `lib/supabaseJWT.js` | legacy JWT | `functions.invoke()` exclusively. Guarded by `server-only`. |

---

## Query Layer

### `lib/queries-client.js` (browser)
Uses `supabase-browser`. Called from `useEffect` in Client Components.

Key exports: `getUnidades`, `getEdificios`, `getLocatarios`, `getContratos`, `getMetricas`, `getParcelasByContrato`, `getParcelasByContratos`, `getUnidadesDisponiveis`, `getLocatarioByUserId`, `getUnidade`, `getEdificio`, `getContratosByLocatario`, `updateParcelaStatus`, `countRegistros`

### `lib/queries-server.js` (Server Components)
Uses `supabase-server`. Guarded by `server-only`. Called with direct `await` in Server Components.

Key exports: `getUnidades`, `getEdificios`, `getLocatarios`, `getContratos`, `getMetricas`, `getParcelasByContrato`, `getParcelasByContratos`, `getUnidadesDisponiveis`

---

## Server Actions (`src/actions/`)

All actions: validate auth via `authGuard()` → write via `supabaseAdmin` → return `{ status: 200 }` or `{ status: 4xx|500, erroMessage: '...' }`.

### contratos.js
| Function | Description |
|---|---|
| `criarContrato(form)` | Inserts contract, sets unidade status `alugada` |
| `editarContrato(id, form)` | Updates date/status/observacoes |
| `cancelarContrato(id, unidade_id)` | Status `cancelado`, unidade `disponivel`, deletes `futura` parcelas |
| `encerrarContrato(id, unidade_id)` | Status `encerrado`, unidade `disponivel`, deletes `futura` parcelas |
| `gerarParcelas(contratoId)` | Invokes `gerar-parcelas` Edge Function via `supabaseJWT` |

### locatarios.js
| Function | Description |
|---|---|
| `convidarLocatario(email, nome, doc, tel, tipo)` | `inviteUserByEmail` + insert `locatarios`; rolls back auth user on insert failure |
| `editarLocatario(id, form)` | Updates locatario fields |
| `deletarLocatario(id)` | Deletes locatario row |
| `revogarConvite(id)` | Deletes row + `deleteUser` — only if `status_convite = 'pendente'` |

### edificios.js
`criarEdificio`, `editarEdificio`, `deletarEdificio`

### unidades.js
`criarUnidade`, `editarUnidade`, `deletarUnidade`

### parcelas.js
`marcarParcelaComoPaga(id)` — sets `status = 'paga'`, `data_pagamento = today` — only for `pendente`/`vencida`

---

## Edge Function: `gerar-parcelas`

- **Location:** `supabase/functions/gerar-parcelas/index.ts` (Deno)
- **Method:** POST `{ contrato_id: UUID }`
- **Auth:** `Authorization: Bearer <user_access_token>` (user JWT, not service role)
- **Permission check:** Verifies caller in `proprietarios` table
- **CORS:** `http://localhost:3000` + `APP_URL` env var
- **Idempotent:** Upsert with `onConflict: 'contrato_id,numero'`
- **Invocation:** `supabaseJWT.functions.invoke('gerar-parcelas', { body, headers: { Authorization: 'Bearer ' + session.access_token } })`

**Generation logic:**
1. Parcela 1: if `data_inicio + 7d` same month → `fechamento = data_inicio`. If crosses month → `fechamento = 1st of next month`. `vencimento = fechamento + 7d`.
2. Parcelas 2+: `fechamento = 1st of each subsequent month`. Continue until `mes > data_fim`.
3. All created with `status = 'futura'`.

---

## Supabase Auth

- **Provider:** Email (invite flow only — no self-registration)
- **Invite:** `supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: SITE_URL + '/dashboard' })`
- **Session check:** `supabase.auth.getUser()` via `createServer()` — preferred over `getSession()`
- **Role check:** `supabase.rpc('is_proprietario')` → `public.is_proprietario()` Postgres function (SECURITY DEFINER)

---

## `src/proxy.js` (Next.js 16 Middleware)

- Protects `/dashboard/:path*`
- Unauthenticated → redirect `/login`
- Authenticated non-Proprietário → redirect `/`
- Uses `createServerClient` from `@supabase/ssr` with request/response cookie handling

---

## RLS Policy Model

All tables have RLS enabled. Write ops in Server Actions use `supabaseAdmin` (bypasses RLS). RLS protects direct API access.

| Operation | Who |
|---|---|
| SELECT `edificios`, `unidades` | Anyone |
| SELECT `locatarios`, `contratos`, `parcelas` | Authenticated users |
| INSERT/UPDATE/DELETE all tables | Authenticated + `is_proprietario() = true` |

---

## pg_cron Scheduled Jobs (`lifecycle_automation.sql`)

| Job | Schedule | Action |
|---|---|---|
| `atualizar-status-parcelas` | `0 6 * * *` | `futura→pendente` when `fechamento <= today`; `pendente→vencida` when `vencimento < today` |
| `encerrar-contratos-vencidos` | `5 6 * * *` | Sets `contratos.status = 'encerrado'`, `unidades.status = 'disponivel'` for active contracts past `data_fim` |

---

## Realtime

- Used in dashboard + public unidades page (`useUnidadesRealtime.js`)
- **Known limitation:** `disponivel→alugada` UPDATE not propagated (RLS filters event). Card disappears only on refresh. INSERT/DELETE/reverse transitions work.

---

## Migrations

| File | Purpose |
|---|---|
| `20250101000000_initial_schema.sql` | Base schema, ENUMs, initial RLS SELECTs |
| `20260511000000_parcelas_unique_contrato_numero.sql` | Unique index `contrato_id+numero` |
| `20260518000000_proprietarios_rls.sql` | `proprietarios` table, `is_proprietario()`, full RLS write policies |
| `20260518100000_revoke_rls_auto_enable.sql` | Revokes auto-enable |
| `20260520000000_lifecycle_automation.sql` | pg_cron jobs |
| `20260520100000_locatarios_status_convite.sql` | `status_convite` column |

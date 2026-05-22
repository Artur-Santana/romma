# CONCERNS
_Last updated: 2026-05-21 | Focus: concerns_

## Summary
Romma has 5 high-severity issues (mostly security/data integrity), 8 medium (silent errors, performance, UX), and 7 low (stubs, minor gaps). The most critical issues are an authorization bypass in contract termination and non-atomic contract+parcela creation.

---

## HIGH Severity

### 1. Realtime RLS gap — stale inventory on public page
**Location:** `src/hooks/useUnidadesRealtime.js:7`
**Issue:** `disponivel→alugada` UPDATE events filtered by RLS before reaching the browser. Visitors see stale available units until manual refresh.
**Known:** Documented in CLAUDE.md. Reverse (alugada→disponivel), INSERT, DELETE work fine.
**Fix:** Use a Postgres function with `SECURITY DEFINER` to broadcast a custom event, or poll on a short interval for the public page.

### 2. Unvalidated `unidade_id` in contract termination — authorization bypass
**Location:** `src/actions/contratos.js` (`cancelarContrato`, `encerrarContrato`)
**Issue:** Both actions accept a client-supplied `unidade_id` to flip unit status. No cross-check against the contract record. Any authenticated proprietário can set any unit's status to `disponivel`.
**Fix:** Derive `unidade_id` server-side by querying the contract: `SELECT unidade_id FROM contratos WHERE id = $contrato_id`.

### 3. `editarLocatario` passes raw form object to Supabase update
**Location:** `src/actions/locatarios.js`
**Issue:** No field allowlist on the update payload. Client can overwrite `usuario_id`, `status_convite`, or any other column.
**Fix:** Destructure only allowed fields: `{ nome_razao_social, tipo, documento, email, telefone }`.

### 4. `deletarLocatario` has no active-contract guard
**Location:** `src/actions/locatarios.js`
**Issue:** Deleting a locatário with active contracts hits a FK constraint, leaks the DB error message to the client, and leaves the `auth.users` record orphaned (auth user not deleted).
**Fix:** Check for active contracts before deletion; return actionable error. Delete auth user in same transaction or document manual cleanup.

### 5. `criarContrato` + `gerarParcelas` non-atomic
**Location:** `src/actions/contratos.js`, `supabase/functions/gerar-parcelas/index.ts`
**Issue:** If the Edge Function call fails after contract creation, the contract exists and the unit is locked as `alugada` with no payment schedule. No rollback.
**Fix:** Move both operations into a single DB transaction (e.g., a Postgres function called via RPC).

---

## MEDIUM Severity

### 6. Query functions silently swallow errors
**Location:** `src/lib/queries-client.js` (13+ functions), `src/lib/queries-server.js` (8+ functions)
**Issue:** All functions return `null` on Supabase error with no signal to the UI. Users see empty states instead of error messages.
**Fix:** Return `{ data, error }` or throw — let callers decide how to handle.

### 7. `getSession()` used for Edge Function auth instead of `getUser()`
**Location:** `src/lib/supabaseJWT.js`
**Issue:** `getSession()` reads from local storage (unverified). `getUser()` validates against the server.
**Fix:** Use `getUser()` for server-side auth checks.

### 8. Dual maintenance surface — legacy unstyled components
**Location:** `src/components/features/Locatarios.js`, `src/components/features/Unidades.js`
**Issue:** These files use old design system (Tailwind classes, different patterns). New `*Desktop.js` versions exist. Legacy versions still render on some routes.
**Fix:** Migrate remaining routes to Desktop versions; delete legacy files.

### 9. Public page leaks `valor_mensal` for hidden-price units
**Location:** Public unidades query
**Issue:** Query fetches all unit fields including `valor_mensal`, then hides it client-side based on `valor_visivel`. Value is visible in browser dev tools / network tab.
**Fix:** Server-side: return `null` for `valor_mensal` when `valor_visivel = false` via a view or computed column.

### 10. Dashboard MRR computation — O(n²) in-memory joins
**Location:** Dashboard page / component
**Issue:** Computes MRR via multiple in-memory joins across 5 parallel fetches. Will degrade as data grows.
**Fix:** Compute MRR server-side via a SQL query or materialized view.

### 11. `SITE_URL` env var undocumented
**Location:** Invite locatário flow
**Issue:** Required for the invite email redirect URL but not listed in `.env.example`.
**Fix:** Add to `.env.example` with a comment.

### 12. `alert()` used for error feedback
**Location:** `src/components/features/LocatariosDesktop.js`
**Issue:** Browser `alert()` for revoke-invite errors — blocks UI, inconsistent with app UX.
**Fix:** Use toast or inline error state.

### 13. Landing page design inconsistency + mock data
**Location:** `src/app/page.js` (landing)
**Issue:** Uses different component system with hard-coded mock analytics numbers. Misleading to stakeholders.
**Fix:** Either wire to real data or clearly mark as demo.

---

## LOW Severity

### 14. Non-functional "Ver Arquivo →" button stub
**Location:** Contratos detail view
**Issue:** Button renders but navigates nowhere. No document upload feature exists.
**Fix:** Remove button or hide behind a feature flag until implemented.

### 15. `simularAluguel` not labeled as demo
**Location:** Dashboard
**Issue:** Demo/simulation function looks like real feature.
**Fix:** Add visual indicator or move to a clearly labeled demo section.

### 16. `GestaoEdificios` not reachable from nav
**Location:** `src/components/features/GestaoEdificios.js`
**Issue:** Component exists but no nav link routes to it.
**Fix:** Add nav entry or document that it's accessible via direct URL only.

### 17. No `cancelada` parcela status
**Location:** Parcelas domain
**Issue:** When a contract is cancelled, future parcelas are deleted rather than archived to `cancelada` status. Loses audit trail.
**Fix:** Add `cancelada` to ENUM; soft-delete by status update instead of DELETE.

### 18. No server-side CPF/CNPJ validation
**Location:** `src/actions/locatarios.js`
**Issue:** Document format/length not validated server-side. Invalid documents can be stored.
**Fix:** Add digit-count and format validation (CPF: 11 digits, CNPJ: 14 digits).

### 19. Parcelas detail page — overfetching
**Location:** Parcelas detail
**Issue:** Fetches all contratos, locatários, and unidades to find one record — not scoped.
**Fix:** Query by ID directly.

### 20. Edge Function CORS silent fallback
**Location:** `supabase/functions/gerar-parcelas/index.ts`
**Issue:** Falls back to `localhost:3000` silently if `APP_URL` env var unset in production.
**Fix:** Throw on missing `APP_URL` or document the required env var.

---

## Missing Features (implied by domain model)

| Feature | Status |
|---------|--------|
| Tenant portal (`/locatario/*`) | Shell routes exist, no pages |
| Contract renewal flow | Not implemented |
| Payment reversal (mark unpaid) | Not implemented |
| Locatário detail page (`/dashboard/locatarios/[id]`) | Route missing |
| Document upload for contracts | Stub only |

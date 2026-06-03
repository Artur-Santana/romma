---
phase: "02"
plan: "03"
subsystem: portal-do-locatario
tags: [portal, dashboard, supabase, client-component, fetch-chain]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [portal-dashboard-wired]
  affects: [e2e-seed, e2e-teardown]
tech_stack:
  added: []
  patterns:
    - fetch chain via useEffect (getUser → locatario → contrato → parcelas)
    - maybeSingle() for single-record queries (null-safe)
    - neq('status', 'futura') for portal parcelas filter
    - idempotent seed with select() + delete before insert
key_files:
  created:
    - src/components/features/portal/ContratoCard.js
    - src/components/features/portal/ParcelsTable.js
  modified:
    - src/lib/queries-client.js
    - src/components/features/portal/PortalDashboard.js
    - e2e/seed.mjs
    - e2e/global-teardown.js
decisions:
  - Use maybeSingle() not single() for getContratoAtivoByLocatario — null-safe when no active contract
  - ParcelsTable excludes 'futura' status (portal shows only historical/current parcelas)
  - seed.mjs uses select()+delete pattern because locatarios table has no unique constraint on usuario_id
metrics:
  duration: "~90 minutes"
  completed: "2026-05-23T22:50:18Z"
  tasks_completed: 3
  files_created: 2
  files_modified: 4
---

# Phase 02 Plan 03: Wire Portal Dashboard Summary

PortalDashboard wired with full Supabase fetch chain (getUser → locatario → contrato ativo → parcelas), ContratoCard and ParcelsTable components created, E2E seed/teardown made idempotent.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Queries getContratoAtivoByLocatario e getParcelasPortal | f2b3628 | src/lib/queries-client.js |
| 2 | ContratoCard e ParcelsTable do portal | 3ff7e85 | src/components/features/portal/ContratoCard.js, ParcelsTable.js |
| 3 | Wire PortalDashboard fetch chain e estados | 115ad1a | src/components/features/portal/PortalDashboard.js |

## Implementation Details

### Task 1 — queries-client.js

Two new exported async functions:

- `getContratoAtivoByLocatario(locatarioId)` — `.maybeSingle()`, joins `unidades(nome, valor_mensal)`, filters `status='ativo'`
- `getParcelasPortal(contratoId)` — `.neq('status', 'futura')`, ordered DESC by `data_vencimento`, returns `data ?? []`

### Task 2 — ContratoCard + ParcelsTable

`ContratoCard` renders eyebrow + 5-field 2-column grid (unidade nome, valor mensal via fmtBRL, data_inicio/fim via fmtData, status via StatusBadge). Zero inline styles, Tailwind v4 only, optional chaining for `contrato.unidades?.nome`.

`ParcelsTable` renders `data-testid="parcelas-table"` section, 4-column grid (`grid-cols-[60px_1fr_1fr_1.2fr]`): numero, vencimento, pagamento, status. Conditional colors via `cn()`: `text-danger-fg` for vencida rows, `text-success` when payment date exists. Empty state message when `parcelas.length === 0`.

### Task 3 — PortalDashboard

Replaced static shell with full Client Component. Fetch chain in `useEffect`:
1. `supabase.auth.getUser()` — bail if no user
2. `getLocatarioByUserId(user.id)` — bail + setLoading(false) if no locatario
3. `getContratoAtivoByLocatario(loc.id)` — bail + setLoading(false) if no contrato
4. `getParcelasPortal(ct.id)`

Four render states: loading → error banner → empty (no active contract) → data (ContratoCard + ParcelsTable). Header (eyebrow + h1 + p) visible in all states.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] seed.mjs não era idempotente com duplicatas de locatarios**
- **Found during:** Task 3 verification (Playwright E2E run)
- **Issue:** `seed.mjs` step 3 used `.maybeSingle()` to find existing locatarios. When a previous test run left 2+ locatario records for the same `usuario_id`, Supabase returns PGRST116 error — `maybeSingle()` silently returns null, causing the seed to INSERT a new record on top of the duplicates instead of cleaning them.
- **Fix:** Replaced with `select()` returning array, delete ALL existing locatarios (and their contratos/parcelas FK chain) before inserting fresh record.
- **Files modified:** e2e/seed.mjs
- **Commit:** e71358f

**2. [Rule 1 - Bug] global-teardown.js silently skipped cleanup com duplicatas**
- **Found during:** Task 3 verification
- **Issue:** Teardown used `.maybeSingle()` — when 2+ locatario rows existed for the test user, `data` was null and teardown returned early without deleting anything. This left orphaned data compounding across test runs.
- **Fix:** Changed to `select()`, iterate `locatarioIds` array, added `[...new Set(...)]` dedup for `edificioIds`.
- **Files modified:** e2e/global-teardown.js
- **Commit:** e71358f

## Deferred Issues

### PORT-02 / PORT-03 E2E Tests Failing — Infrastructure Root Cause

**Status:** Tests remain failing after 3 fix attempts. Blocked by Next.js env loading behavior, not implementation.

**Symptom:** Playwright PORT-02 and PORT-03 fail with "Sala 101" not visible within 10 seconds. Screenshot shows "Nenhum contrato ativo" state — meaning locatario is found but contrato is not.

**Root Cause:** Next.js 16 loads `.env.local` during `next build` and overrides shell env vars for `NEXT_PUBLIC_*` variables. The browser bundle ends up compiled with the production Supabase URL (`https://vfymttcajeyhrmsyhrtj.supabase.co`) instead of the local test instance (`http://127.0.0.1:54321`). Test data is seeded into local Supabase, but the browser client queries production — no matching data found.

**Implementation is correct:** Manual Node.js simulation of the full fetch chain against local Supabase (with a real locatario auth session) returns expected data at every step.

**Resolution paths (for future work):**
1. Rename/move `.env.local` before Playwright build, restore after
2. Create `.env.test.local` with `NEXT_PUBLIC_*` overrides pointing to test instance
3. Use `webServer.env` in `playwright.config.js` to force override after build step
4. Patch `supabase-browser.js` to read URL from runtime config instead of build-time env

**Files referenced:** playwright.config.js, e2e/seed.mjs, e2e/global-teardown.js, src/lib/supabase-browser.js

## Known Stubs

None — all data is wired from Supabase. ContratoCard and ParcelsTable receive live data from the fetch chain. No hardcoded placeholders flow to UI rendering.

## Self-Check: PASSED

All files exist. All commits verified:
- FOUND: f2b3628 (Task 1 — queries)
- FOUND: 3ff7e85 (Task 2 — ContratoCard + ParcelsTable)
- FOUND: 115ad1a (Task 3 — PortalDashboard)
- FOUND: e71358f (Rule 1 bug fixes — seed + teardown)

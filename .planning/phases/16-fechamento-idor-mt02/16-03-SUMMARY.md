---
phase: 16-fechamento-idor-mt02
plan: "03"
subsystem: tests
tags: [unit-tests, idor, ownership, cross-tenant, regression]
dependency_graph:
  requires: [16-01, 16-02]
  provides: [MT-03-unit-coverage]
  affects: [CI-regression-gate]
tech_stack:
  added: []
  patterns: [vi.hoisted+require, mockResolvedValueOnce-chain, mockImplementationOnce-thenable]
key_files:
  created:
    - test/unit/actions/parcelas.test.js
  modified:
    - test/unit/actions/unidades.test.js
    - test/unit/actions/contratos.test.js
    - test/helpers/supabaseMock.js
decisions:
  - "Added .in() method to supabaseMock builder to support parcelas.js update chain (Rule 3 — blocking fix)"
  - "criarContrato insert uses insert().select().single() so the insert result resolves via single(), not thenable — 3rd single() call, then 1 thenable for unidade status update"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  files_changed: 4
---

# Phase 16 Plan 03: Unit Tests — IDOR Owner Pre-Check Coverage Summary

Unit tests proving the four owner pre-checks from Plans 16-01/16-02 with vitest, mirroring the 15-04 pattern. Each Action covered: happy (owner) + validation error + cross-tenant block + D-08 assertion that `proprietario_id = user.id` filter was applied.

## What Was Built

Extended `unidades.test.js` with a `criarUnidade` describe block (5 cases), extended `contratos.test.js` with `criarContrato` + `editarContrato` describe blocks (5 cases each), and created a new `parcelas.test.js` covering `marcarParcelaComoPaga` (5 cases, 4-hop chain). Full vitest suite exits 0 (47 tests). Playwright `--list` exits 0.

## Tasks

### Task 1: Extend unidades.test.js (criarUnidade) + contratos.test.js (criarContrato, editarContrato)

**Commit:** c3923a9

Files modified:
- `test/helpers/supabaseMock.js` — added `.in()` chain method (Rule 3 auto-fix)
- `test/unit/actions/unidades.test.js` — added `criarUnidade` describe (5 cases)
- `test/unit/actions/contratos.test.js` — added `criarContrato` + `editarContrato` describes (5 cases each)

**criarUnidade flow:** 1 single() (edificios ownership) + 1 insert thenable.
**criarContrato flow:** 2 singles (unidade→edificio) + 1 single for insert result (insert().select().single()) + 1 thenable for unidade status update.
**editarContrato flow:** 3 singles via `setupOwnerSingles()` helper (contrato→unidade→edificio) + 1 update thenable.

### Task 2: Create parcelas.test.js (marcarParcelaComoPaga 4-hop) + full suite gate

**Commit:** 8257354

Files created:
- `test/unit/actions/parcelas.test.js` — 5 cases covering the 4-hop chain

**marcarParcelaComoPaga flow:** 4 singles (parcela→contrato→unidade→edificio ownership) + 1 thenable for update().eq().in() chain.

Gate results:
- `npx vitest run` — 47 tests, 0 failures, exit 0
- `npx playwright test --list` — exit 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `.in()` method to supabaseMock builder**
- **Found during:** Task 2 (before writing parcelas.test.js)
- **Issue:** `supabaseMock.js` builder lacked an `in` method; `marcarParcelaComoPaga` uses `.update().eq().in()` chain — the missing method would break the chain, causing the await to fail or resolve incorrectly.
- **Fix:** Added `in: vi.fn()` to builder and wired `builder.in.mockReturnValue(builder)` in both the initial setup and `resetAll()`.
- **Files modified:** `test/helpers/supabaseMock.js`
- **Commit:** c3923a9

## Coverage Summary

| Action | Hops | Happy | Cross-tenant | Validation | Auth | D-08 |
|--------|------|-------|-------------|------------|------|------|
| criarUnidade | 1 (edificios) | ✅ | ✅ insert not called | ✅ 400 Edifício inválido | ✅ 401 | ✅ eq(proprietario_id) |
| criarContrato | 2 (unidade→edificio) | ✅ | ✅ insert not called | ✅ 400 Unidade inválida | ✅ 401 | ✅ eq(proprietario_id) |
| editarContrato | 3 (contrato→unidade→edificio) | ✅ | ✅ update not called | ✅ 400 ID inválido | ✅ 401 | ✅ eq(proprietario_id) |
| marcarParcelaComoPaga | 4 (parcela→contrato→unidade→edificio) | ✅ | ✅ update not called | ✅ 400 ID inválido | ✅ 401 | ✅ eq(proprietario_id) |

## Known Stubs

None — test files only, no UI/data rendering.

## Threat Flags

No new security surface introduced (test-only plan).

## Self-Check: PASSED

- `test/unit/actions/parcelas.test.js` — EXISTS
- `test/unit/actions/unidades.test.js` — criarUnidade describe added — EXISTS
- `test/unit/actions/contratos.test.js` — criarContrato + editarContrato describes added — EXISTS
- Commit c3923a9 — EXISTS
- Commit 8257354 — EXISTS
- `npx vitest run` — 47 tests, exit 0 — CONFIRMED
- `npx playwright test --list` — exit 0 — CONFIRMED

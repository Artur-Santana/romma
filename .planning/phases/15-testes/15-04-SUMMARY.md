---
phase: 15-testes
plan: "04"
subsystem: testing
tags: [unit-tests, vitest, unidades, contratos, d-08, idor, ownership-precheck]
dependency_graph:
  requires: ["15-01", "15-02", "15-03"]
  provides: ["editarUnidade+deletarUnidade coverage (D-06/D-07/D-08)", "cancelarContrato+encerrarContrato coverage (D-06/D-07/D-08)", "full unit suite gate (TEST-01)"]
  affects: ["test/unit/actions/unidades.test.js", "test/unit/actions/contratos.test.js"]
tech_stack:
  added: []
  patterns: ["vi.hoisted() with require() for createSupabaseMock inside vi.mock factory", "mockResolvedValueOnce sequences for multi-step .single() ownership pre-checks", "then() override via mockImplementationOnce for thenable mutation chains", "supabaseJWT stub to prevent top-level import initialization error"]
key_files:
  created:
    - test/unit/actions/unidades.test.js
    - test/unit/actions/contratos.test.js
  modified: []
decisions:
  - "Mock @/lib/supabaseJWT in contratos.test.js despite gerarParcelas not being under test — contratos.js imports it at top-level, causing supabaseUrl initialization error without the stub"
  - "Used mockResolvedValueOnce sequences (not configureResult) to drive the 2-step unidades ownership pre-check and 3-step contratos ownership pre-check independently per test"
  - "D-08 assertion uses toHaveBeenCalledWith('proprietario_id', mockUser.id) — covers eq() call on the edificios ownership query without over-constraining call order"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-12T21:21:22Z"
  tasks_completed: 3
  files_created: 2
---

# Phase 15 Plan 04: Unit Tests unidades.js + contratos.js Summary

**One-liner:** Unit specs for `editarUnidade`, `deletarUnidade`, `cancelarContrato`, and `encerrarContrato` covering D-06/D-07 (happy + validation + auth guard) and D-08 IDOR regression lock via ownership pre-check assertions; full 27-test suite exits 0.

## What Was Built

Created two unit test files with Vitest total-chain mocking (D-04):

- `test/unit/actions/unidades.test.js` — 10 cases for `editarUnidade` + `deletarUnidade`
- `test/unit/actions/contratos.test.js` — 10 cases for `cancelarContrato` + `encerrarContrato`

Both spec files prove the 2-step (unidades) and 3-step (contratos) ownership pre-checks introduced by the 15-02 IDOR fix. Full 4-file unit suite: 27 tests, exit 0.

## Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Unit spec for editarUnidade + deletarUnidade (unidades.js) | f0917a8 | test/unit/actions/unidades.test.js |
| 2 | Unit spec for cancelarContrato + encerrarContrato (contratos.js) | 72b71bc | test/unit/actions/contratos.test.js |
| 3 | Full unit suite gate — all 4 files green | (no commit — verification only) | — |

## Test Coverage

### unidades.test.js (10 tests)

**editarUnidade (5 tests):**
- Happy path: 2-step ownership pre-check (unidades → edificio_id, edificios → row) → `{ status: 200 }`
- Cross-tenant: edificios ownership returns null → `{ status: 404, erroMessage: 'Unidade não encontrada.' }`, `update` not called
- Validation: `'not-a-uuid'` → `{ status: 400, erroMessage: 'ID inválido.' }`
- Auth guard: null user → `{ status: 401 }`
- D-08: asserts `mockAdmin.eq` was called with `('proprietario_id', mockUser.id)` — IDOR regression lock

**deletarUnidade (5 tests):** Same pattern; asserts `delete` not called on cross-tenant path.

Mock targets: `@/lib/supabase-server` + `@/lib/auth` + `@/lib/supabaseAdmin` via `createSupabaseMock()`.

### contratos.test.js (10 tests)

**cancelarContrato (5 tests):**
- Happy path: 3-step ownership pre-check (contratos → unidade_id, unidades → edificio_id, edificios → row) + 3 mutation thenables → `{ status: 200 }`
- Cross-tenant: edificios ownership returns null → `{ status: 404, erroMessage: 'Contrato não encontrado.' }`, `update` not called
- Validation: `'not-a-uuid'` → `{ status: 400, erroMessage: 'ID inválido.' }`
- Auth guard: null user → `{ status: 401 }`
- D-08: asserts `mockAdmin.eq` was called with `('proprietario_id', mockUser.id)`

**encerrarContrato (5 tests):** Same pattern, same assertions.

Mock targets: `@/lib/supabase-server` + `@/lib/auth` + `@/lib/supabaseAdmin` + `@/lib/supabaseJWT` (stub only).

### Full Suite Gate

```
npm run test:unit → vitest run
 Test Files  4 passed (4)
      Tests  27 passed (27)
   Duration  382ms
```

Exit 0. No cross-file mock leakage.

### Playwright Parse Gate

```
npx playwright test --list
EXIT: 0
```

E2E spec files still parse correctly — no regression from unit test additions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] supabaseJWT top-level import causes initialization error**

- **Found during:** Task 2 (first run of contratos.test.js)
- **Issue:** `contratos.js` imports `@/lib/supabaseJWT` at the module top level. When Vitest loads the action module, the real `supabaseJWT` client tries to initialize with `NEXT_PUBLIC_SUPABASE_URL` (undefined in test env) and throws `"supabaseUrl is required."` — causing the entire test suite to fail before any test runs.
- **Fix:** Added `vi.mock('@/lib/supabaseJWT', () => ({ default: { functions: { invoke: vi.fn() } } }))` stub. The stub is minimal — only the shape used by `gerarParcelas`, which is not under test in this plan.
- **Files modified:** `test/unit/actions/contratos.test.js`
- **Commit:** 72b71bc

## Verification

```
npx vitest run test/unit/actions/unidades.test.js → 10 passed, exit 0
npx vitest run test/unit/actions/contratos.test.js → 10 passed, exit 0
npm run test:unit → 27 passed (4 files), exit 0
npx playwright test --list → exit 0
```

## Known Stubs

None. Tests are complete and assertions are specific.

## Threat Flags

No new threat surface introduced. This plan adds test files only — no production code changes.

## Self-Check: PASSED

- [x] `test/unit/actions/unidades.test.js` exists and contains `proprietario_id`
- [x] `test/unit/actions/contratos.test.js` exists and contains `proprietario_id`
- [x] Commit `f0917a8` exists (unidades.test.js)
- [x] Commit `72b71bc` exists (contratos.test.js)
- [x] `npm run test:unit` exits 0 with 27 tests passing (4 files)
- [x] `npx playwright test --list` exits 0

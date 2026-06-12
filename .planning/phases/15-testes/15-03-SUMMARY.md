---
phase: 15-testes
plan: "03"
subsystem: testing
tags: [unit-tests, vitest, auth, locatarios, d-08, idor]
dependency_graph:
  requires: ["15-01"]
  provides: ["cadastrarProprietario coverage (D-06/D-07)", "revogarConvite coverage (D-06/D-07/D-08)"]
  affects: ["test/unit/actions/auth.test.js", "test/unit/actions/locatarios.test.js"]
tech_stack:
  added: []
  patterns: ["vi.hoisted() for mock vars", "thenable builder via then() override", "sequential mockImplementationOnce for multi-await chains"]
key_files:
  created:
    - test/unit/actions/auth.test.js
    - test/unit/actions/locatarios.test.js
  modified: []
decisions:
  - "Used vi.hoisted() with require() to make createSupabaseMock() available inside vi.mock factory (ESM hoisting constraint)"
  - "Overrode builder.then with vi.fn() + mockImplementationOnce to sequence thenable results for contratos count and delete queries"
  - "D-08 assertion uses expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id) — covers both select and delete filter"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-12T21:15:03Z"
  tasks_completed: 2
  files_created: 2
---

# Phase 15 Plan 03: Unit Tests auth.js + locatarios.js Summary

**One-liner:** Unit specs for `cadastrarProprietario` and `revogarConvite` covering D-06/D-07 (happy + validation + auth guard) and D-08 IDOR regression guard, 7 tests, exit 0.

## What Was Built

Created two unit test files using Vitest with total chain mocking (D-04):

- `test/unit/actions/auth.test.js` — 3 cases for `cadastrarProprietario`
- `test/unit/actions/locatarios.test.js` — 4 cases for `revogarConvite` including D-08

## Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Unit spec for cadastrarProprietario (auth.js) | 5aa8283 | test/unit/actions/auth.test.js |
| 2 | Unit spec for revogarConvite (locatarios.js) incl. D-08 | e3ee878 | test/unit/actions/locatarios.test.js |

## Test Coverage

### auth.test.js (3 tests)
- Happy path: mocked `signUp` → `{ status: 200 }`
- Validation error: empty email/senha → `{ status: 400, erroMessage: 'Email e senha são obrigatórios.' }`
- Supabase error pass-through: signUp returns `{ status: 422, message: '...' }` → `{ status: 422, erroMessage: '...' }`

Mock targets: `next/headers` (cookies) + `@supabase/ssr` (createServerClient). NOT supabaseAdmin (Pitfall 5 avoided).

### locatarios.test.js (4 tests)
- Happy path: pendente locatario, 0 contratos, delete + deleteUser succeed → `{ status: 200 }`
- Validation: `'not-a-uuid'` → `{ status: 400, erroMessage: 'ID inválido.' }`
- Auth guard: null user → `{ status: 401 }`
- D-08: after `revogarConvite(validId)`, asserts `mockAdmin.eq` was called with `('proprietario_id', mockUser.id)` — regression guard for Phase 11 IDOR fix

Mock targets: `@/lib/supabase-server` + `@/lib/auth` + `@/lib/supabaseAdmin` (via `createSupabaseMock()`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted() requires different approach for createSupabaseMock**

- **Found during:** Task 2 (first run of locatarios.test.js)
- **Issue:** Using module-scope `createSupabaseMock()` result inside `vi.mock` factory triggers Vitest hoisting error: "top level variables inside vi.mock factory". PATTERNS.md showed the pattern but it caused a runtime error in this ESM project.
- **Fix:** Moved `createSupabaseMock()` call inside `vi.hoisted()` using `require()`, which runs before module resolution. All 4 tests passed.
- **Files modified:** `test/unit/actions/locatarios.test.js`
- **Commit:** e3ee878

**2. [Rule 1 - Bug] Multi-await chain needs sequential then() overrides**

- **Found during:** Task 2 happy path implementation
- **Issue:** `revogarConvite` performs two thenable awaits in sequence (contratos count → delete). The shared builder's `then()` resolves to the same `_resolve` for both, making it impossible to return different values per call via `configureResult`.
- **Fix:** Override `mockAdmin.then` with a `vi.fn()` + `mockImplementationOnce` pattern for sequential thenable resolution: first call returns `{ count: 0, error: null }`, second returns `{ error: null }`.
- **Files modified:** `test/unit/actions/locatarios.test.js`
- **Commit:** e3ee878

## Verification

```
npx vitest run
 Test Files  2 passed (2)
     Tests  7 passed (7)
  Duration  172ms
```

Exit 0. All success criteria met.

## Known Stubs

None. Tests are complete and assertions are specific.

## Threat Flags

No new threat surface introduced. This plan adds test files only — no production code changes.

## Self-Check: PASSED

- [x] `test/unit/actions/auth.test.js` exists and contains `cadastrarProprietario`
- [x] `test/unit/actions/locatarios.test.js` exists and contains `proprietario_id`
- [x] Commit `5aa8283` exists (auth.test.js)
- [x] Commit `e3ee878` exists (locatarios.test.js)
- [x] `npx vitest run` exits 0 with 7 tests passing

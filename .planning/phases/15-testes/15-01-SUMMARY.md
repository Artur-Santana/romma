---
phase: 15-testes
plan: "01"
subsystem: testing
tags: [vitest, unit-testing, mock-factory, test-infrastructure]
dependency_graph:
  requires: []
  provides: [vitest-runner, supabase-mock-factory, server-only-stub]
  affects: [package.json, test/helpers/]
tech_stack:
  added: [vitest@^4.1.8]
  patterns: [chainable-thenable-builder, server-only-alias-stub, vitest-node-env]
key_files:
  created:
    - vitest.config.mjs
    - test/helpers/server-only-stub.js
    - test/helpers/supabaseMock.js
  modified:
    - package.json
decisions:
  - "vitest.config.mjs (not .js) — ESM-native so import works without transform"
  - "passWithNoTests: true — Vitest 4.x exits 1 when no files found; flag makes scaffold exit 0 before any specs exist"
  - "test/helpers/ (not test/unit/helpers/) — plan frontmatter specifies this path; stub reused across all unit tests"
  - "thenable builder via then() — mandatory for await chain resolution; vi.fn().mockReturnValue(builder) alone leaves await returning builder object, not {data,error}"
metrics:
  duration: "~2.5 min"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 15 Plan 01: Vitest Infrastructure Scaffold Summary

**One-liner:** Vitest 4.x installed with node-env config, @/ alias, server-only stub, and shared chainable thenable Supabase mock factory.

## What Was Built

| Artifact | Purpose |
|----------|---------|
| `vitest.config.mjs` | Vitest config — node environment, globals, `@/` alias mirrors jsconfig, `server-only` aliased to stub |
| `test/helpers/server-only-stub.js` | Empty ESM default export; neutralizes `import 'server-only'` side-effect in test env |
| `test/helpers/supabaseMock.js` | Shared chainable thenable builder factory (D-05) exported as `createSupabaseMock()` |
| `package.json` | Added `"test:unit": "vitest run"` and `"test:unit:watch": "vitest"` scripts |

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install vitest + config + server-only stub | dc4bf8c | vitest.config.mjs, test/helpers/server-only-stub.js, package.json, package-lock.json |
| 2 | Shared Supabase mock factory + test:unit script | 5a3f6eb | test/helpers/supabaseMock.js, package.json |

## Verification Results

- `npm run test:unit` → `vitest run` → exits 0, "No test files found, exiting with code 0"
- `npx vitest run` → exits 0 (passWithNoTests: true handles Vitest 4.x no-files-found behavior)
- Thenable chain `await mockAdmin.from('x').select('*').eq('id','1')` resolves to configured `{data:{ok:1},error:null}`
- `auth.admin.deleteUser`, `auth.admin.inviteUserByEmail`, `auth.signUp` are vi.fn() mocks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vitest 4.x exits 1 with no test files (acceptance criteria requires exit 0)**
- **Found during:** Task 1 verification
- **Issue:** `npx vitest run` with zero test files exits with code 1 in Vitest 4.x (breaking change from 3.x behavior). The plan's acceptance criteria required exit 0.
- **Fix:** Added `passWithNoTests: true` to `vitest.config.mjs` test config. Vitest documents this as the supported opt-in for this behavior.
- **Files modified:** `vitest.config.mjs`
- **Commit:** dc4bf8c

## Known Stubs

None — this plan creates the stub infrastructure itself; no data flows through to a UI.

## Threat Flags

None — test infrastructure only; not bundled in production build. The `server-only` stub is active only under the Vitest alias and never reaches the app bundle.

## Self-Check: PASSED

- [x] `vitest.config.mjs` exists at repo root
- [x] `test/helpers/server-only-stub.js` exists
- [x] `test/helpers/supabaseMock.js` exists and exports `createSupabaseMock`
- [x] `package.json` has `"test:unit": "vitest run"`
- [x] `npm run test:unit` exits 0
- [x] Task commits dc4bf8c and 5a3f6eb present in git log

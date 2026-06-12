---
phase: 13-mobile-responsivo
plan: 01
subsystem: testing
tags: [playwright, e2e, mobile, responsive, nyquist]

# Dependency graph
requires: []
provides:
  - "e2e/mobile-responsive.spec.js — RED Playwright specs for UX-02, UX-03, UX-04 at 375px viewport"
  - "Nyquist Wave 0 gate: objective done-criteria established before any production code changes"
affects: [13-02, 13-03, 13-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "test.use({ viewport }) per describe — viewport override scoped to describe block, not global config"
    - "scrollWidth evaluation via page.evaluate(() => document.documentElement.scrollWidth) for overflow assertion"
    - "VER → button navigation pattern for reaching /dashboard/contratos/[id] without admin client"

key-files:
  created:
    - e2e/mobile-responsive.spec.js
  modified: []

key-decisions:
  - "Viewport 375x812 set per describe via test.use() — keeps playwright.validation.config.js unchanged (shared Desktop Chrome config)"
  - "UX-03 Parcelas route reached via UI navigation (getByRole button VER →) over seeded contrato — no admin client import"
  - "data-testid selectors (mobile-top-bar, mobile-bottom-nav) intentionally absent from production code in Wave 0 — absence is what makes UX-02 RED"

patterns-established:
  - "Nyquist Wave 0 pattern: spec file written before implementation, tests must fail RED before any production changes"

requirements-completed: [UX-02, UX-03, UX-04]

# Metrics
duration: 8min
completed: 2026-06-12
---

# Phase 13 Plan 01: Mobile Responsivo — Wave 0 RED Specs Summary

**Playwright E2E spec with 7 RED tests covering UX-02/03/04 at 375px viewport, establishing objective done-criteria before any production code is touched**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-12T00:00:00Z
- **Completed:** 2026-06-12T00:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `e2e/mobile-responsive.spec.js` with 3 describes and 7 tests in 375x812 viewport
- UX-02: asserts `.romma-sidebar-wrapper` hidden and `[data-testid="mobile-top-bar"]`/`[data-testid="mobile-bottom-nav"]` visible — RED because data-testid attributes don't exist yet
- UX-03: 5 tests (4 dashboard tabs + Parcelas route via "VER →" button) asserting `scrollWidth ≤ 375` — RED because tables overflow at current state
- UX-04: 1 portal test asserting `scrollWidth ≤ 375` — RED because portal padding causes overflow
- `playwright.validation.config.js` remains byte-identical (not touched)
- No production source files modified

## Task Commits

1. **Task 1: Criar e2e/mobile-responsive.spec.js com specs RED para UX-02/03/04** - `ba531ef` (test)

## Files Created/Modified
- `e2e/mobile-responsive.spec.js` — 88-line Playwright spec, 3 describes, 7 RED tests at 375px viewport

## Decisions Made
- Viewport override via `test.use({ viewport: { width: 375, height: 812 } })` per describe block (not global) to keep `playwright.validation.config.js` shared Desktop Chrome config unchanged
- Parcelas route reached through pure UI navigation (`getByRole('button', { name: 'VER →' }).first().click()`) over the persistent seeded contrato — no admin client or seed.mjs import needed
- `data-testid` attributes intentionally absent from `MobileNav.js` at this wave — their absence is what makes UX-02 fail RED; adding them is Plan 13-02's job

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Wave 0 gate complete: objective RED criteria established for UX-02, UX-03, UX-04
- Plan 13-02 can now implement `DashboardShell` + `MobileNav.js` data-testid attributes to make UX-02 green
- Plan 13-03 can implement overflow fixes on `*Desktop.js` and `Parcelas.js` to make UX-03 green
- Plan 13-04 can implement portal responsive fixes to make UX-04 green
- Run `npx playwright test --config=playwright.validation.config.js --grep "UX-02|UX-03|UX-04"` to confirm RED at any time

## Self-Check

- [x] `e2e/mobile-responsive.spec.js` exists at worktree path
- [x] Commit `ba531ef` exists (`test(13-01): add RED specs for UX-02/03/04`)
- [x] 3 describes with UX-02/UX-03/UX-04 labels confirmed
- [x] 3x `viewport: { width: 375` confirmed (one per describe)
- [x] `data-testid="mobile-top-bar"` and `data-testid="mobile-bottom-nav"` present
- [x] 6x `toBeLessThanOrEqual(375)` (5 for UX-03, 1 for UX-04) confirmed
- [x] `VER →` button navigation + `contratos/**` waitForURL confirmed
- [x] No `supabaseAdmin` or `seed.mjs` imports confirmed
- [x] `playwright.validation.config.js` diff quiet (unchanged) confirmed

## Self-Check: PASSED

---
*Phase: 13-mobile-responsivo*
*Completed: 2026-06-12*

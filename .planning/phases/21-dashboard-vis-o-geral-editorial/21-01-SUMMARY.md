---
phase: 21-dashboard-vis-o-geral-editorial
plan: 01
subsystem: ui
tags: [supabase, css, playwright, node-test, aggregation, keyframes]

# Dependency graph
requires:
  - phase: 20-design-system-editorial-interface
    provides: globals.css with v1.5 keyframes (rGrow, rFade, etc.) and CSS token definitions

provides:
  - getParcelasFluxo() query function in queries-server.js (all parcelas, no status filter)
  - Pure aggregation module fluxo.js with buildFluxoWindow + aggregateFluxo
  - @keyframes rGrowY (scaleY 0->1) in globals.css
  - .chart-bar reduced-motion + print animation guards in globals.css
  - Wave-0 E2E scaffold e2e/dashboard-editorial.spec.js (3 RED tests for DASH-04/05/06)

affects:
  - 21-02 (plan 02 consumes getParcelasFluxo, aggregateFluxo, rGrowY, chart-bar class)
  - 21-03 (plan 03 uses same contracts established here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure aggregation module with no imports (fluxo.js pattern)"
    - "Month bucketing via dateStr.slice(0,7) — never new Date() for UTC safety"
    - "TDD RED/GREEN cycle with node:test (node --test *.mjs)"
    - "Math.max(...values, 1) clamp to avoid division by zero in normalization"
    - "peak guard: peakRecebido > 0 && recebido[key] === peakRecebido"

key-files:
  created:
    - src/lib/fluxo.js
    - src/lib/fluxo.test.mjs
    - e2e/dashboard-editorial.spec.js
  modified:
    - src/lib/queries-server.js
    - src/app/globals.css

key-decisions:
  - "aggregateFluxo takes todayStr as arg (not Date.now()) — enables deterministic unit testing"
  - "fluxo.js has no imports and no server-only guard — pure math, testable anywhere"
  - "rGrowY added as separate keyframe (not repurposing rGrow which uses scaleX for horizontal bar)"
  - ".chart-bar class targeted in reduced-motion media query to override inline animation styles"
  - "Month bucketing uses .slice(0,7) on ISO strings to avoid UTC timezone off-by-one"

patterns-established:
  - "Pure utility module pattern: no imports, named exports only, no 'server-only' — mirrors utils.js"
  - "TDD with node:test for pure functions — node --test src/lib/*.test.mjs"
  - "getParcelasFluxo(): no .in() filters — all parcelas needed (paga for recebido, all for previsto)"

requirements-completed: [DASH-05]

# Metrics
duration: 5min
completed: 2026-06-15
---

# Phase 21 Plan 01: Data + Animation + Test Foundation Summary

**Pure cash-flow aggregation module (fluxo.js, 20/20 tests green), getParcelasFluxo() query, rGrowY keyframe with reduced-motion guards, and RED E2E scaffold — all without touching page.js**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-15T20:07:04Z
- **Completed:** 2026-06-15T20:11:50Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- `getParcelasFluxo()` added to queries-server.js — fetches all parcelas (no status/contrato_id filter) for complete historical recebido + previsto aggregation
- `src/lib/fluxo.js` created as a pure module with `buildFluxoWindow` and `aggregateFluxo` — 20/20 node:test unit tests pass covering year rollover, bucketing, normalization, peak selection, and edge cases
- `@keyframes rGrowY` + `.chart-bar` motion guards added to globals.css — vertical bar animations disabled under `prefers-reduced-motion: reduce` and `@media print`
- Wave-0 E2E scaffold `e2e/dashboard-editorial.spec.js` created with 3 RED tests defining DASH-04/05/06 acceptance contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getParcelasFluxo() query** - `670a1fa` (feat)
2. **Task 2: RED — fluxo.test.mjs** - `(test commit before impl)` (test)
3. **Task 2: GREEN — fluxo.js implementation** - `5ae879e` (feat)
4. **Task 3: rGrowY + E2E scaffold** - `59dc229` (feat)

_Note: Task 2 was a TDD task with separate RED (test) and GREEN (impl) commits._

## Files Created/Modified
- `src/lib/queries-server.js` — Added `getParcelasFluxo()` after `getParcelasByContratos`
- `src/lib/fluxo.js` — New pure module: `buildFluxoWindow`, `aggregateFluxo` + internal helpers
- `src/lib/fluxo.test.mjs` — 20 unit tests using node:test + node:assert/strict
- `src/app/globals.css` — Added `@keyframes rGrowY`, `.chart-bar` reduced-motion + print guards
- `e2e/dashboard-editorial.spec.js` — Wave-0 scaffold for DASH-04/05/06 (RED — expected)

## Decisions Made
- `aggregateFluxo` accepts `todayStr` as parameter (not `Date.now()` internally) — enables deterministic unit testing without date mocking
- `fluxo.js` has zero imports and no `'server-only'` guard — pure math functions testable in any Node environment
- `rGrowY` added as a distinct keyframe from `rGrow` — `rGrow` uses `scaleX` (horizontal wipe for loading bar), vertical bars require `scaleY` with `transformOrigin: "bottom"`
- Month bucketing uses `.slice(0, 7)` on ISO strings — avoids `new Date()` UTC timezone off-by-one per project PITFALLS.md convention

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Node.js emits a `[MODULE_TYPELESS_PACKAGE_JSON]` warning when running `node --test src/lib/fluxo.test.mjs` because the project's `package.json` does not declare `"type": "module"`. The `.mjs` extension forces ES module mode for the test file, and `fluxo.js` is auto-detected as ESM. This is a pre-existing condition (the project mixes CommonJS and ESM); no action needed for tests to pass. The warning does not affect test results (20/20 pass).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Plan 02 can import `getParcelasFluxo` from `@/lib/queries-server` immediately
- Plan 02 can import `aggregateFluxo` from `@/lib/fluxo` immediately
- `rGrowY` keyframe and `.chart-bar` class are in globals.css — chart bars can use `animation: rGrowY` with `className="chart-bar"`
- E2E tests in `dashboard-editorial.spec.js` define the exact DOM contract Plan 02/03 must fulfill

---
*Phase: 21-dashboard-vis-o-geral-editorial*
*Completed: 2026-06-15*

---
phase: 17-funda-o-tokens-mobile-modal-fixes-infra
plan: 01
subsystem: css-tokens
tags: [css, design-tokens, animation, vitest]
dependency_graph:
  requires: []
  provides: [v1.5-type-tokens, v1.5-density-tokens, r-helpers, rFade-keyframe, romma-modal-backdrop, animation-retrofit]
  affects: [phases 18-25 (all consume --rt-* and --rd-* tokens)]
tech_stack:
  added: []
  patterns: [CSS custom properties additive :root block, transform-only animation, Vitest source-assertion testing]
key_files:
  created:
    - test/unit/globals/v15-tokens.test.js
  modified:
    - src/app/globals.css
decisions:
  - "Added --font-display: var(--font-display-arch) alias so .r-* classes referencing var(--font-display) resolve correctly without editing the ported classes"
  - "Added --highlight: var(--color-highlight) alias to make .r-eyebrow.gold render with correct color"
  - "Kept rommaFadeIn keyframe intact (rommaUnitOut sibling context) — only changed .romma-page to use rFade"
  - "print + prefers-reduced-motion guards cover both .r-fade and .romma-page in the same media blocks (no duplication)"
metrics:
  duration: ~3 minutes
  completed: "2026-06-13T22:09:39Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 2
  commits: 3
requirements_satisfied: [REFINO-01, REFINO-02, REFINO-04, REFINO-05]
---

# Phase 17 Plan 01: Foundation Tokens, .r-* Helpers & Animation Retrofit Summary

Additive v1.5 CSS token block injected into `globals.css`: 9 type-scale tokens, 9 regular-density tokens, alias/duration tokens, all `.r-*` helper classes, motion keyframes, `.romma-modal-backdrop` utility, and `.romma-page` animation retrofitted from opacity-based `rommaFadeIn...both` to transform-only `rFade` with print and reduced-motion guards. Locked by a 47-assertion Vitest source test.

## Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add v1.5 token block + .r-* helpers + keyframes | 31a410d | src/app/globals.css |
| 2 | Add .romma-modal-backdrop + retrofit .romma-page animation | 54fc34a | src/app/globals.css |
| 3 | Vitest source-assertion test | 28fa15e | test/unit/globals/v15-tokens.test.js |

## What Was Built

### src/app/globals.css (additive section appended)

New `:root` block with:
- 9 `--rt-*` type tokens: metric 40px, title 32px, title-sm 24px, section 20px, subhead 16px, body 14px, data 14px, label 11px, meta 10px
- 9 `--rd-*` density tokens (regular only): gutter 32px, gutter-m 20px, page-y 28px, block 24px, block-sm 16px, panel 20px, cell 20px, row-y 12px, row-x 16px
- `--dur-base: 220ms`, `--dur-fast: 120ms` (required by `.r-*` transitions)
- `--font-display: var(--font-display-arch)` alias
- `--highlight: var(--color-highlight)` alias (required by `.r-eyebrow.gold`)

Helper classes: `.r-metric/.r-title/.r-section/.r-subhead/.r-body/.r-data/.r-label/.r-meta/.r-eyebrow` (+ `.indigo/.warning/.gold` variants), `.r-panel/.r-divtop/.r-divrt`, `.r-rowlink/.r-cell/.r-ghostbtn`, `.r-scroll/.r-noscroll`, `.r-dot`

Keyframes: `rFade`, `rPulse`, `rUnitOut`, `rBar`, `rSheetUp`, `rGrow`

`.r-fade` class + `@media (prefers-reduced-motion: reduce)` and `@media print` guards covering both `.r-fade` and `.romma-page`

`.romma-modal-backdrop` utility: `position: fixed; inset: 0; z-index: 50; background: oklch(0 0 0 / 0.70); display: flex; align-items: center; justify-content: center;`

`.romma-page` retrofit: `rommaFadeIn 320ms var(--ease-crisp) both` → `rFade 320ms var(--ease-crisp)` (transform-only, no fill-mode)

### test/unit/globals/v15-tokens.test.js

47 assertions across 7 describe blocks:
- All 9 `--rt-*` token values
- All 9 `--rd-*` token values
- Alias/duration tokens (4 assertions)
- All `.r-*` helper classes (13 assertions)
- Utilities and keyframes (8 assertions)
- REFINO-05 animation retrofit assertions (3 assertions)
- REFINO-F1 negative guard: `data-density` absent
- Fill-mode bug guard: `.romma-page` + `rommaFadeIn` + `both` pattern absent

## Deviations from Plan

None — plan executed exactly as written.

The `--highlight` alias was explicitly required by the plan (`key_links` frontmatter and task action text). It was added as specified.

## Verification

- `npx vitest run test/unit/globals/v15-tokens.test.js` — PASS (47 assertions, 0 failures)
- `npm run build` — exits 0, all 15 routes compiled successfully
- `grep 'data-density' src/app/globals.css` — no output (REFINO-F1 guard confirmed)

## Known Stubs

None. This plan is CSS infrastructure only — no UI rendering or data connections.

## Threat Flags

None. This plan adds CSS custom properties and utility classes only — no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `src/app/globals.css` — exists and contains `--rt-metric`, `--rd-gutter`, `.romma-modal-backdrop`, `rFade 320ms`
- `test/unit/globals/v15-tokens.test.js` — exists, 47 tests pass
- Commits 31a410d, 54fc34a, 28fa15e all present in git log

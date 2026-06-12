---
phase: 14-anima-es-feedback
plan: "00"
subsystem: toast-infrastructure
tags: [sonner, layout, e2e, toast, phase-gate]
dependency_graph:
  requires: []
  provides: [sonner-installed, toaster-mounted, anim-03-spec]
  affects: [src/app/layout.js, package.json]
tech_stack:
  added: [sonner@2.0.7]
  patterns: [toaster-in-server-component, css-var-theme-override]
key_files:
  created:
    - e2e/toast-feedback.spec.js
  modified:
    - package.json
    - package-lock.json
    - src/app/layout.js
decisions:
  - "sonner installed via npm install — approved in RESEARCH.md Package Legitimacy Audit (Emil Kowalski, ~3M weekly downloads)"
  - "Toaster mounted as last child of <body> in Server Component layout.js — sonner has 'use client' internally, same pattern as SpeedInsights"
  - "E2E spec placed in e2e/ (not tests/ as written in plan) — playwright testDir is ./e2e"
metrics:
  duration: "18min"
  completed: "2026-06-12"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Phase 14 Plan 00: Install Sonner + Mount Toaster + RED E2E Spec Summary

**One-liner:** sonner v2.0.7 installed, single `<Toaster>` mounted in root layout with Obsidian dark theme CSS-var overrides, and RED ANIM-03 phase-gate E2E spec created covering all 5 D-08 toast flows.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install sonner | f9a0e17 | package.json, package-lock.json |
| 2 | Mount Toaster in root layout | dadd930 | src/app/layout.js |
| 3 | RED E2E spec for ANIM-03 | aebe55e | e2e/toast-feedback.spec.js |

---

## What Was Built

**Task 1:** `npm install sonner` — sonner 2.0.7 added to package.json dependencies. No other packages added (D-02 compliance verified — no framer-motion, no tw-animate addition).

**Task 2:** `src/app/layout.js` updated with:
- `import { Toaster } from "sonner"` at top (Server Component — no `'use client'` directive added)
- Single `<Toaster>` mounted as last child inside `<body>`, after `{children}`
- Props: `theme="dark"`, `richColors`, `position="bottom-right"`, `mobileOffset={{ bottom: "80px" }}`
- CSS var overrides via `style` prop: `--normal-bg`, `--normal-text`, `--normal-border`, `--success-bg`, `--success-text`, `--success-border`, `--border-radius: "0px"` mapped to project tokens
- `<SpeedInsights />` intentionally NOT rendered (pre-existing state preserved per PATTERNS.md)
- `npm run build` passes cleanly

**Task 3:** `e2e/toast-feedback.spec.js` — ANIM-03 phase-gate E2E spec covering:
1. `ANIM-03.1` — "Contrato criado" after creating a contract
2. `ANIM-03.2` — "Contrato cancelado" after cancelling via ConfirmDialog
3. `ANIM-03.3` — "Unidade removida" after deleting a unidade
4. `ANIM-03.4` — "Acesso revogado" after revoking a locatário
5. `ANIM-03.5` — "Parcela marcada como paga" after marking a parcela paid

Spec is RED (expected — Wave 1 plans 14-01/02/03 wire the handlers).

---

## Deviations from Plan

### Path Change — E2E spec file location

**Found during:** Task 3 planning/analysis

**Issue:** Plan specifies `tests/toast-feedback.spec.js`, but the project's `playwright.config.js` sets `testDir: './e2e'`. There is no `tests/` directory in the project. A file in `tests/` would never be collected by the Playwright runner, making the phase gate permanently non-functional.

**Fix:** Created `e2e/toast-feedback.spec.js` instead. This is where all existing specs live and where playwright will collect it.

**Rule applied:** Rule 3 (auto-fix blocking issue — wrong path would prevent the spec from ever turning green).

**Files modified:** `e2e/toast-feedback.spec.js` (plan said `tests/toast-feedback.spec.js`)

---

## Known Stubs

None — this plan installs infrastructure only. No data-fetching or rendering stubs introduced.

---

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or schema changes. `sonner` package approved in RESEARCH.md Package Legitimacy Audit.

---

## Self-Check

### Files exist
- [x] `package.json` contains "sonner" — FOUND
- [x] `node_modules/sonner/dist/index.js` — FOUND
- [x] `src/app/layout.js` contains `<Toaster` and `mobileOffset` — FOUND
- [x] `e2e/toast-feedback.spec.js` contains "Parcela marcada como paga" — FOUND

### Commits exist
- [x] f9a0e17 — chore(14-00): install sonner
- [x] dadd930 — feat(14-00): mount Toaster in root layout
- [x] aebe55e — test(14-00): RED E2E spec for ANIM-03

### Build
- [x] `npm run build` exits 0 with Toaster mounted

## Self-Check: PASSED

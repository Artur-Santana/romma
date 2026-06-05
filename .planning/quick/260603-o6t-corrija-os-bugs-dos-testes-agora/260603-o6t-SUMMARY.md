---
phase: quick
plan: 260603-o6t
subsystem: e2e-tests
tags: [bugfix, playwright, auth]
dependency_graph:
  requires: []
  provides: [auth-confirm-tests-fixed]
  affects: [ci-pipeline]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - e2e/auth-confirm.spec.js
decisions:
  - "Used url.href.includes() — correct Playwright API for URL object callbacks"
metrics:
  duration: "2m"
  completed: "2026-06-03"
---

# Phase quick Plan 260603-o6t: Fix auth-confirm.spec.js waitForURL TypeError Summary

**One-liner:** Fixed Playwright waitForURL TypeError by replacing `url.includes()` with `url.href.includes()` on URL objects in both auth-confirm tests.

## What Was Done

Replaced `url.includes()` calls with `url.href.includes()` in `e2e/auth-confirm.spec.js`. Playwright's `waitForURL(callback)` passes a `URL` object to the callback — `URL` objects do not have an `.includes()` method; calling `.href.includes()` accesses the string property first.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix url.includes → url.href.includes in waitForURL callbacks | fa631de | e2e/auth-confirm.spec.js |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- Zero occurrences of bare `url.includes(` in auth-confirm.spec.js
- Four occurrences of `url.href.includes` confirmed (2 per test x 2 tests)
- File is syntactically valid JavaScript

## Self-Check: PASSED

- [x] e2e/auth-confirm.spec.js exists and contains correct fix
- [x] Commit fa631de exists
- [x] No bare url.includes( remaining
- [x] 4 occurrences of url.href.includes confirmed

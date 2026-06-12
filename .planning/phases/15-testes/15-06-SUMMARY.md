---
phase: 15-testes
plan: "06"
subsystem: ci
tags: [ci, github-actions, unit-tests, merge-gate]
dependency_graph:
  requires: ["15-01"]
  provides: ["unit CI job", "D-03 merge gate"]
  affects: [".github/workflows/e2e.yml"]
tech_stack:
  added: []
  patterns: ["parallel GitHub Actions jobs", "lightweight unit job without Supabase"]
key_files:
  modified:
    - .github/workflows/e2e.yml
decisions:
  - "Parallel job (no `needs:`) so unit failures are fast and independent of heavy E2E setup"
  - "Renamed workflow name to 'Tests' to reflect both suites — filename e2e.yml unchanged"
  - "5min timeout for unit vs 25min for e2e — appropriate for mocked test suite"
metrics:
  duration: "~3 minutes"
  completed: "2026-06-12"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 15 Plan 06: CI Unit Job (D-03) Summary

**One-liner:** Parallel `unit` CI job in GitHub Actions running `npm run test:unit` with no Supabase/Playwright — fast merge gate alongside the existing e2e job.

## What Was Built

Added a separate `unit` job to `.github/workflows/e2e.yml` parallel to the existing `e2e` job:

- `runs-on: ubuntu-latest`, `timeout-minutes: 5`
- Steps: `actions/checkout@v4` → `actions/setup-node@v4` (Node 20, npm cache) → `npm ci` → `npm run test:unit`
- No Supabase CLI, no `supabase start`, no `.env.test`, no Playwright install
- No `needs:` dependency — truly parallel execution per D-03 spec
- Both jobs triggered on `on.pull_request: branches: [main]`, making unit failures a required merge-blocking check

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add parallel unit job to e2e.yml | 4baf53b | .github/workflows/e2e.yml |

## Deviations from Plan

None — plan executed exactly as written. Renamed workflow `name:` from "E2E Tests" to "Tests" as permitted by the plan ("discretionary, keep `e2e.yml` filename").

## Verification

- `unit:` job present in YAML — confirmed via node regex check
- `npm run test:unit` in unit job steps — confirmed
- No `supabase start` in unit job section — confirmed
- `e2e:` job intact and unmodified — confirmed
- YAML parses without error via `python3 yaml.safe_load` — confirmed

## Self-Check: PASSED

- `.github/workflows/e2e.yml` exists with unit job: FOUND
- Commit 4baf53b exists: FOUND
- YAML valid: CONFIRMED

---
phase: 20
slug: edif-cios-cards-drill-in
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E only) ^1.60.0 |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test e2e/crud-edificios.spec.js` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/crud-edificios.spec.js`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 0 | EDIF-01/02/03 | — | N/A (read-only presentation) | e2e | `npx playwright test e2e/crud-edificios.spec.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · Planner refines this map.*

---

## Wave 0 Requirements

- [ ] `e2e/crud-edificios.spec.js` — extend with assertions for: 2-col card layout, per-building stats, contiguous occupation bar, accordion toggle, drill-in modal open, `lockEdificio` disabled select.

*Existing Playwright infra covers all phase requirements; only new assertions needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Occupation bar contiguity is visually correct (no gaps, alugadas-first) | EDIF-02 | Pixel-level layout proportions hard to assert in E2E | UAT: visually inspect a building with mixed status units |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

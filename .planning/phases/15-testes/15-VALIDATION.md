---
phase: 15
slug: testes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | vitest (NEW — installed in Wave 0) |
| **Framework (E2E)** | @playwright/test (existing) |
| **Config file** | `vitest.config.mjs` (Wave 0) + `playwright.config.js` (existing) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run test:unit && npm run test:e2e` |
| **Estimated runtime** | unit ~5s · e2e ~2-4 min |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (unit) for unit tasks
- **After every plan wave:** Run full unit suite + affected E2E specs
- **Before `/gsd-verify-work`:** `npx vitest run` green AND `npx playwright test` green
- **Max feedback latency:** ~10 seconds (unit)

---

## Per-Task Verification Map

> Filled/refined by planner. Each TEST-01 unit task → `npx vitest run <spec>`; each TEST-02 E2E task → `npx playwright test <spec>`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 0 | TEST-01 | — | N/A | infra | `npx vitest --version` | ❌ W0 | ⬜ pending |
| 15-0x-xx | 0x | 1 | TEST-01 | T-15-01 (IDOR) | mutação filtra `.eq('proprietario_id', user.id)` | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 15-0x-xx | 0x | 2 | TEST-02 | — | N/A | e2e | `npx playwright test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `vitest.config.mjs` — install framework, configure `environment: 'node'`, alias `@/ → src/`, stub `server-only`
- [ ] `test/helpers/supabaseMock.js` — shared chainable mock factory (`.from().select().eq().single()` thenable)
- [ ] `package.json` script `test:unit` = `vitest run`
- [ ] GitHub Actions: separate `unit` job in existing `e2e.yml`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none expected) | — | All Phase 15 behaviors are themselves automated tests | — |

*All phase deliverables ARE automated verification — meta-validation: run the suites.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers framework install + mock factory + CI job
- [ ] No watch-mode flags (use `vitest run`, not `vitest`)
- [ ] Feedback latency < 10s (unit)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

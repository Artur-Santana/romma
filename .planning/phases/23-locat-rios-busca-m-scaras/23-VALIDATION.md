---
phase: 23
slug: locat-rios-busca-m-scaras
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line` |
| **Full suite command** | `npx playwright test --reporter=line` |
| **Estimated runtime** | ~30 seconds (quick) / ~90 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line`
- **After every plan wave:** Run `npx playwright test --reporter=line`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | LOC-01 | — | N/A | manual | visual diff vs 09-locatarios.png | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | LOC-01 | — | N/A | e2e | `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line` | ✅ | ⬜ pending |
| 23-02-01 | 02 | 1 | LOC-02 | — | strip antes de persistir | e2e | `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line` | ✅ | ⬜ pending |
| 23-02-02 | 02 | 1 | LOC-03 | — | strip antes de persistir | e2e | `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line` | ✅ | ⬜ pending |
| 23-03-01 | 03 | 2 | LOC-04 | — | authGuard + pendente-only guard | e2e | `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line` | ✅ | ⬜ pending |
| 23-03-02 | 03 | 2 | LOC-05 | — | modal confirmação antes de revogar | e2e | `npx playwright test tests/e2e/crud-locatarios.spec.js --reporter=line` | ✅ | ⬜ pending |
| 23-04-01 | 04 | 2 | LOC-06 | — | N/A | manual | testar em 375px viewport | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (Playwright já instalado, `crud-locatarios.spec.js` existe).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cards desktop renderizam corretamente vs screenshot alvo | LOC-01 | Visual diff — sem browser-in-CI | Comparar com `.planning/design/screenshots/desktop/09-locatarios.png` |
| Mobile rows com ações expostas em 375px | LOC-06 | Viewport mobile — verificação visual | DevTools 375px: confirmar ações Reenviar/Revogar/Editar visíveis sem hover |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

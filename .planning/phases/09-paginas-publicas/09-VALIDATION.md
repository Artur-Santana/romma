---
phase: 9
slug: paginas-publicas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-06
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test e2e/public-pages.spec.js` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/public-pages.spec.js`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-T1 | 01 | 1 | LP-01, LP-02, LP-03 | — | N/A | e2e | `npx playwright test e2e/public-pages.spec.js` | ❌ W0 | ⬜ pending |
| 09-02-T1 | 02 | 2 | LP-01, LP-02 | — | N/A | e2e | `npx playwright test e2e/public-pages.spec.js` | ❌ W0 | ⬜ pending |
| 09-02-T2 | 02 | 2 | LP-03 | — | N/A | e2e | `npx playwright test e2e/public-pages.spec.js` | ❌ W0 | ⬜ pending |
| 09-03-T1 | 03 | 2 | PUB-01, PUB-02 | — | N/A | e2e | `npx playwright test e2e/public-pages.spec.js` | ❌ W0 | ⬜ pending |
| 09-03-T2 | 03 | 2 | PUB-03 | — | N/A | automated | `page.evaluate(() => scrollWidth <= clientWidth)` via Playwright | ❌ W0 | ⬜ pending |
| 09-03-T3 | 03 | 2 | PUB-03 | — | N/A | automated | `getBoundingClientRect().height >= 44` via Playwright | ❌ W0 | ⬜ pending |
| 09-04-T1 | 04 | 3 | ALL | — | N/A | e2e | `npx playwright test` | ✅ W0 | ⬜ pending |
| 09-04-T2 | 04 | 3 | AUDIT-01 | — | N/A | manual | Visual audit 375px + desktop | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/public-pages.spec.js` — suite E2E cobrindo LP-01, LP-02, LP-03, PUB-01, PUB-02, PUB-03 (criado em Plano 01, Wave 1)

*Playwright já instalado — sem nova dependência.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auditoria visual landing page + /unidades | AUDIT-01 | Validação visual de credibilidade e layout | Plano 04 Task 2: abrir em 375px e desktop, verificar aparência geral |

---

## Assumptions

- **A1 (LOW confidence):** Links de navegação do Header (`CONTRATOS`, `PORTAIS`, `DASHBOARD`) permanecem como `href="#"`. Aprovado pelo usuário como placeholder pré-TCC. LP-03 critério #3 satisfeito — "permanecem na página, sem 404".

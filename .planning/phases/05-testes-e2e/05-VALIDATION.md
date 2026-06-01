---
phase: 5
slug: testes-e2e
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling durante execução.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.x |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test --reporter=line` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~60–120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --reporter=line`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-T1 | 01 | 0 | TEST-01 | — | N/A | manual | `ls src/app/dashboard/edificios/page.js` | ❌ W0 | ⬜ pending |
| 05-01-T2 | 01 | 0 | TEST-01, TEST-04 | — | N/A | integration | `node e2e/seed.mjs` | ✅ | ⬜ pending |
| 05-01-T3 | 01 | 0 | TEST-01 | — | N/A | integration | `node e2e/global-teardown.js` (dry-run manual) | ✅ | ⬜ pending |
| 05-02-T1 | 02 | 1 | TEST-01 | — | N/A | e2e | `npx playwright test e2e/crud.spec.js` | ❌ W0 | ⬜ pending |
| 05-02-T2 | 02 | 1 | TEST-01 | — | N/A | e2e | `npx playwright test e2e/crud.spec.js` | ❌ W0 | ⬜ pending |
| 05-03-T1 | 03 | 1 | TEST-02 | — | N/A | e2e | `npx playwright test e2e/parcelas.spec.js` | ❌ W0 | ⬜ pending |
| 05-04-T1 | 04 | 1 | TEST-04 | — | N/A | e2e | `npx playwright test e2e/realtime.spec.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/dashboard/edificios/page.js` — rota bloqueante para specs de Edifícios (identificada pelo researcher)
- [ ] `e2e/seed.mjs` — estendido com `"E2E-Sala Disponivel"` (status: disponivel, sem contrato) para TEST-04
- [ ] `e2e/global-teardown.js` — estendido com limpeza por prefixo `"E2E-"` (edificios, unidades, locatarios) e emails `"e2e-"` via admin API
- [ ] `e2e/crud.spec.js` — spec completo TEST-01: Edifícios + Unidades + Locatários + Contratos (Wave 0 stub → Wave 1 implementação)
- [ ] `e2e/parcelas.spec.js` — spec TEST-02: geração de parcelas + marcar como paga
- [ ] `e2e/realtime.spec.js` — spec TEST-04: unidade some de /unidades após criar contrato

*Infraestrutura existente cobre: `playwright.config.js`, `e2e/fixtures.js`, `e2e/helpers.js`, `e2e/dashboard.spec.js`, `e2e/portal.spec.js`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email de convite recebido pelo Locatário | TEST-01 (D-03) | Entrega de email é responsabilidade do Supabase/InBucket, não verificável por Playwright | Checar inbox no InBucket após rodar o spec de Locatários |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

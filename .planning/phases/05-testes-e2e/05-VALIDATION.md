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
| seed-teardown | 01 | 0 | TEST-01 | — | N/A | integration | `node e2e/seed.mjs` | ✅ | ⬜ pending |
| edificios-spec | 01 | 1 | TEST-01 | — | N/A | e2e | `npx playwright test e2e/edificios.spec.js` | ❌ W0 | ⬜ pending |
| unidades-spec | 01 | 1 | TEST-01 | — | N/A | e2e | `npx playwright test e2e/unidades.spec.js` | ❌ W0 | ⬜ pending |
| locatarios-spec | 01 | 1 | TEST-01 | — | N/A | e2e | `npx playwright test e2e/locatarios.spec.js` | ❌ W0 | ⬜ pending |
| contratos-spec | 01 | 2 | TEST-01 | — | N/A | e2e | `npx playwright test e2e/contratos.spec.js` | ❌ W0 | ⬜ pending |
| parcelas-spec | 02 | 2 | TEST-02 | — | N/A | e2e | `npx playwright test e2e/parcelas.spec.js` | ❌ W0 | ⬜ pending |
| realtime-spec | 03 | 3 | TEST-04 | — | N/A | e2e | `npx playwright test e2e/realtime.spec.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/edificios.spec.js` — spec stub para TEST-01 (Edifícios CRUD)
- [ ] `e2e/unidades.spec.js` — spec stub para TEST-01 (Unidades CRUD)
- [ ] `e2e/locatarios.spec.js` — spec stub para TEST-01 (Locatários invite/edit)
- [ ] `e2e/contratos.spec.js` — spec stub para TEST-01 (Contratos criar/encerrar/cancelar)
- [ ] `e2e/parcelas.spec.js` — spec stub para TEST-02 (Parcelas via EF)
- [ ] `e2e/realtime.spec.js` — spec stub para TEST-04 (Realtime flow)
- [ ] Extensão de `e2e/seed.mjs` com unidade "E2E-Sala Disponivel" (D-08)
- [ ] Extensão de `e2e/global-teardown.js` com limpeza por prefixo "E2E-" (D-01)
- [ ] Rota `src/app/dashboard/edificios/page.js` criada (bloqueante identificado por researcher)

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

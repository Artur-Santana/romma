---
phase: 8
slug: bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.60.0 |
| **Config file** | `playwright.config.js` (raiz do projeto) |
| **Quick run command** | `npx playwright test e2e/dashboard-smoke.spec.js --project=chromium` |
| **Full suite command** | `npx playwright test e2e/ --project=chromium` |
| **Estimated runtime** | ~30 seconds (quick) / ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/dashboard-smoke.spec.js --project=chromium`
- **After every plan wave:** Run `npx playwright test e2e/ --project=chromium`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 0 | BUG-01 | T-08-01 | Wave 0: add revogar cenário em e2e/crud.spec.js | e2e | `npx playwright test e2e/crud.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | BUG-01 | T-08-01 | revogarConvite retorna erro amigável se locatário tem contrato ativo | e2e | `npx playwright test e2e/crud.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 0 | BUG-02 | — | Wave 0: add erroDelete/erroEdit cenários em e2e/crud.spec.js | e2e | `npx playwright test e2e/crud.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 1 | BUG-02 | — | Erro de delete não aparece no form de edição e vice-versa | e2e | `npx playwright test e2e/crud.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 0 | BUG-03 | T-08-02 | Wave 0: add aceite de convite + status_convite em auth-confirm.spec.js | e2e | `npx playwright test e2e/auth-confirm.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-03-02 | 03 | 1 | BUG-03 | T-08-02 | status_convite = 'aceito' após verifyOtp bem-sucedido | e2e | `npx playwright test e2e/auth-confirm.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-04-01 | 04 | 0 | BUG-04 | — | Wave 0: add link ← Voltar em dashboard-smoke.spec.js | e2e | `npx playwright test e2e/dashboard-smoke.spec.js --project=chromium` | ✅ | ⬜ pending |
| 08-04-02 | 04 | 1 | BUG-04 | — | Link ← Voltar em /unidades navega para / | e2e | `npx playwright test e2e/dashboard-smoke.spec.js --project=chromium` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/crud.spec.js` — adicionar cenário de revogar convite (BUG-01) e erro delete/edit separados (BUG-02)
- [ ] `e2e/auth-confirm.spec.js` — adicionar cenário de aceite de convite com atualização de status_convite (BUG-03)
- [ ] `e2e/dashboard-smoke.spec.js` — adicionar verificação do link ← Voltar em /unidades (BUG-04)

*Infraestrutura existente cobre todos os requisitos da fase — apenas novos cenários devem ser adicionados.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Badge "Convite pendente" vs "Ativo" exibido corretamente no card | BUG-03 | Requer fluxo de convite real com email | Convidar locatário → verificar badge "Convite pendente" → aceitar via link → recarregar → verificar badge "Ativo" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 13
slug: mobile-responsivo
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-12
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.60.0 |
| **Config file** | `playwright.validation.config.js` (já existe na raiz) |
| **Quick run command** | `npx playwright test --config=playwright.validation.config.js --grep "UX-02"` |
| **Full suite command** | `npx playwright test --config=playwright.validation.config.js` |
| **Estimated runtime** | ~30 segundos |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --config=playwright.validation.config.js --grep "UX-02|UX-03|UX-04"`
- **After every plan wave:** Run `npx playwright test --config=playwright.validation.config.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 0 | UX-02 | — | N/A | E2E | `--grep "UX-02"` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | UX-02 | — | N/A | E2E | `--grep "UX-02"` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | UX-03 (4 abas) | — | N/A | E2E | `--grep "UX-03"` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 2 | UX-03 (rota Parcelas `/dashboard/contratos/[id]`) | — | N/A | E2E | `--grep "UX-03"` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 3 | UX-04 | — | N/A | E2E | `--grep "UX-04"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/mobile-responsive.spec.js` — specs UX-02, UX-03, UX-04 (stubs RED)
- [ ] UX-03 cobre 4 abas + rota de Parcelas `/dashboard/contratos/[id]` (navegação UI sobre o contrato semeado pelo global-setup)
- [ ] Usar `playwright.validation.config.js` existente como base

*Infraestrutura Playwright já instalada — apenas arquivo de spec novo necessário.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Touch targets ≥44px visualmente verificados | UX-03 | `boundingBox()` retorna tamanho lógico; teste manual em emulação mobile do Chrome ou dispositivo físico verifica a superfície de toque real | Inspecionar DevTools em 375px viewport: verificar `height >= 44px` em botões de ação após o fix de UX-03 (plano 13-02) |
| Scroll suave nas tabelas mobile | UX-03 | Comportamento de scroll (momentum/inertia) não é assertion E2E — só `scrollWidth` é automatizável | Testar manualmente em iPhone SE ou Chrome DevTools 375px após o fix de UX-03 (plano 13-02) |

> A rota de Parcelas `/dashboard/contratos/[id]` (overflow horizontal) **é automatizada** no spec — alcançada via UI (botão "VER →") sobre o contrato persistente do seed. Não é mais Manual-Only.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved

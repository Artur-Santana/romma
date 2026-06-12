---
phase: 14
slug: anima-es-feedback
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright v1.60.0 (E2E only) |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test --project=chromium` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~60–120 seconds |

---

## Sampling Rate

- **After every task commit:** Verificação manual no browser (`localhost:3000`) — toast visível, item some com fade-out
- **After every plan wave:** Run `npx playwright test --project=chromium`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-W0 | 00 | 0 | ANIM-03 | — / — | N/A (client-side UI) | e2e smoke (stub) | `npx playwright test tests/toast-feedback.spec.js` | ❌ W0 | ⬜ pending |
| ANIM-01 | — | — | ANIM-01 | — | N/A | manual-only | — (UAT visual) | N/A | ⬜ pending |
| ANIM-02 | — | — | ANIM-02 | — | N/A | manual-only | — (UAT visual) | N/A | ⬜ pending |
| ANIM-03 | — | — | ANIM-03 | — | N/A | e2e smoke | `npx playwright test tests/toast-feedback.spec.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/toast-feedback.spec.js` — cobre ANIM-03: verifica toast Sonner visível após cada ação principal (criar contrato, encerrar, cancelar, revogar, pagar parcela)

*Testes de animação ANIM-01/ANIM-02 são manual-only — CSS transitions de 200ms não são confiáveis via Playwright sem `waitForTimeout` frágil. Nenhum arquivo de teste automatizado necessário para a animação em si; testes E2E existentes verificam regressão funcional (ação completa corretamente).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Encerrar/cancelar contrato → item sai com fade-out ~200ms | ANIM-01 | CSS transition timing não-determinística via E2E | No dashboard, encerrar um contrato ativo → observar fade-out (opacity + scale) ~200ms antes do item sumir; confirmar que não reaparece no reload (filtra ativos) |
| Deletar unidade / revogar acesso → item sai com animação | ANIM-02 | CSS transition timing não-determinística via E2E | Deletar uma unidade e revogar acesso de um locatário → observar animação de saída visível antes da remoção |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (ANIM-03 via toast-feedback.spec.js)
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

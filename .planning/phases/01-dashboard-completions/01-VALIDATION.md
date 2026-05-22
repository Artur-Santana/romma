---
phase: 1
slug: 01-dashboard-completions
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + browser visual validation |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npm run build -- --no-lint` (build check) |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds (build) / ~120 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build -- --no-lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full build + lint must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| shadcn-install | W0 | 0 | VIS-02 | N/A | build | `npm run build` | ⬜ pending |
| dash-metrics | tile-fix | 1 | DASH-01, DASH-02 | N/A | build+visual | `npm run build` | ⬜ pending |
| dash-alert | tile-fix | 1 | DASH-03 | N/A | build+visual | `npm run build` | ⬜ pending |
| contratos-migrate | vis-02 | 2 | VIS-02 | N/A | build | `npm run build` | ⬜ pending |
| parcelas-migrate | vis-02 | 2 | VIS-02 | N/A | build | `npm run build` | ⬜ pending |
| locatarios-migrate | vis-02 | 2 | VIS-02 | N/A | build | `npm run build` | ⬜ pending |
| unidades-migrate | vis-02 | 2 | VIS-02 | N/A | build | `npm run build` | ⬜ pending |
| dashboard-page | vis-02 | 3 | VIS-02 | N/A | build+visual | `npm run build` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npx shadcn@latest add button input select table badge card` — instalar primitivos shadcn antes de qualquer migração

*Nenhum arquivo de teste precisa ser criado — este projeto usa Playwright E2E, não testes unitários para componentes UI.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MRR exibido corretamente em R$ | DASH-01 | Requer dados reais no Supabase | Logar como Proprietário, verificar tile "Contratos Ativos" mostra soma correta |
| Receita Esperada correta | DASH-02 | Requer parcelas pendentes/vencidas reais | Verificar tile "Parcelas Pendentes/Vencidas" mostra soma correta |
| Alerta contratos vencendo | DASH-03 | Requer contratos com data_fim em ≤7 dias | Criar contrato com data_fim próxima e verificar alerta |
| Visual Obsidian Blueprint | VIS-02 | Comparação visual subjetiva | Verificar paleta roxo/dourado, tipografia Manrope/Noto Sans em todas as telas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-21

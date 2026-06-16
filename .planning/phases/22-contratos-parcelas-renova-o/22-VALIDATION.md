---
phase: 22
slug: contratos-parcelas-renova-o
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-16
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + ESLint |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx next build --no-lint` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx next build --no-lint` to catch compile errors
- **After wave completion:** Manual browser check of the modified feature
- **Before final verification:** Full Playwright run if tests exist

---

## Validation Architecture

This phase has UI changes only (no schema changes). Validation focuses on:
1. Build passes without TypeScript/lint errors
2. Visual output matches design screenshots
3. SA `renovarContrato` correctly appends parcelas without overwriting existing data

---

## Wave Validation Gates

### Wave 1 — Contratos cards + busca + arquivo
- `npx next build --no-lint` → zero errors
- Contratos tela abre no browser → cards visíveis no desktop
- Busca filtra por locatário/unidade
- Toggle "Vencendo" filtra corretamente
- Arquivo de encerrados expande ao clicar

### Wave 2 — Parcelas timeline + resumo financeiro
- `npx next build --no-lint` → zero errors
- `/dashboard/contratos/[id]` abre → grade-resumo + resumo financeiro visíveis
- Timeline vertical renderiza todas as parcelas
- Barra de progresso colorida por status
- Registrar pagamento → toast + resumo atualizado ao vivo

### Wave 3 — SA renovarContrato + modal
- `npx next build --no-lint` → zero errors
- Modal renovar abre → opções +6/+12/+24 + campo custom
- Após renovar: `data_fim` atualizada em DB
- Parcelas antigas preservadas; novas parcelas appended com numeração correta
- Datas das novas parcelas sem UTC shift (usar T12:00:00)

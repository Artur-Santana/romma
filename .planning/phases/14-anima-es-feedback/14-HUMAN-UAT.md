---
status: partial
phase: 14-anima-es-feedback
source: [14-VERIFICATION.md]
started: 2026-06-12
updated: 2026-06-12
---

## Current Test

[awaiting human testing]

## Tests

### 1. ANIM-01 — Encerrar contrato (fade-out ~200ms)
expected: No dashboard de Contratos, encerrar um contrato ativo → o card sai da lista com fade-out (opacity → 0 + scale 0.97) em ~200ms antes de sumir; o contrato NÃO reaparece no reload; o subtítulo "X ativos · Y encerrados" atualiza ambas as contagens.
result: [pending]

### 2. ANIM-01 — Cancelar contrato (fade-out ~200ms)
expected: Cancelar um contrato ativo → card sai com fade-out ~200ms; não reaparece no reload (listagem mostra só status='ativo').
result: [pending]

### 3. ANIM-02 — Deletar unidade (animação de saída)
expected: Deletar uma unidade → card sai com animação de saída visível (~200ms) antes da remoção; toast "Unidade removida" aparece.
result: [pending]

### 4. ANIM-02 — Revogar acesso de Locatário (animação de saída)
expected: Em Locatários (LocatariosDesktop, componente montado) → revogar acesso → linha sai com animação de saída ~200ms; toast "Acesso revogado" aparece. (Locatarios.js legacy mobile não está montado em rota — sem efeito visível, esperado per D-05.)
result: [pending]

### 5. ANIM-03 — Suite E2E de toast (live)
expected: `npx playwright test e2e/toast-feedback.spec.js --project=chromium` passa (verde) contra app rodando + Supabase com dados seedados. Cobre toast após criar contrato, encerrar, cancelar, revogar acesso, pagar parcela. CR-01 (seletor "Marcar Paga") já corrigido.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

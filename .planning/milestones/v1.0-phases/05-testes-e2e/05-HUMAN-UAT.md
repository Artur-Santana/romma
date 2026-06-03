---
status: partial
phase: 05-testes-e2e
source: [05-VERIFICATION.md]
started: 2026-05-29T22:00:00Z
updated: 2026-05-29T22:00:00Z
---

## Current Test

[aguardando testes manuais]

## Tests

### 1. Suíte completa verde
expected: `npx playwright test --reporter=line` retorna 14 testes verdes (requer `supabase start` + `supabase functions serve gerar-parcelas` ativos)
result: [pending]

### 2. Idempotência entre runs
expected: executar a suíte duas vezes consecutivas sem reset — segunda run passa sem duplicatas ou conflitos de dados E2E-
result: [pending]

### 3. Dependência de ordem em parcelas.spec.js
expected: Teste 2 (`marcar parcela como paga`) lê `contratoId` criado no Teste 1; serialização do Playwright mantém a dependência estável e `contratoId` nunca é `undefined` no Teste 2
result: [pending]

### 4. Âncora de dois níveis em Contratos (crud.spec.js)
expected: `getByText('E2E-Locatário Contratos').locator('..').locator('..')` alcança a linha correta no DOM renderizado; botão de ação correto é ativado sem falso positivo
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

---
status: passed
phase: 20-edif-cios-cards-drill-in
source: [20-VERIFICATION.md]
started: 2026-06-15
updated: 2026-06-15
---

## Current Test

[complete — aprovado visualmente pelo proprietário em revisão iterativa 2026-06-15]

## Tests

### 1. Cards em 2 colunas (desktop) / 1 coluna (mobile)
expected: Edifícios aparecem em grade de 2 colunas em viewport ≥720px (CSS `minmax(340px, 1fr)`); colapsa para 1 coluna em ~375px sem overflow. Cada card mostra 4 stats (Unidades, Ocupação %, MRR em dourado, Área total).
result: passed

### 2. Barra de ocupação contígua, sem buracos
expected: Em edifício com unidades de status misto, a barra é contígua — alugadas (indigo) à esquerda, disponíveis (cinza) à direita, sem espaços; legenda "X alugada(s) · Y disponíve(is)".
result: passed

### 3. Accordion expande/colapsa
expected: "Ver N unidade(s)" expande a lista inline; clicar de novo colapsa. Botão desabilitado (opacity 0.4) em edifício com 0 unidades.
result: passed

### 4. Drill-in abre modal com edifício travado
expected: Clicar numa linha de unidade abre o `UnifiedUnidadeModal` em modo edição com o select de Edifício desabilitado (mostrando apenas o edifício corrente).
result: passed

### 5. Accordion sobrevive ao salvar no modal
expected: Após salvar uma edição no modal, o accordion permanece aberto e os stats recomputam (o Set `expandidos` não é resetado em `carregarDados`).
result: passed

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Atalho automatizado: rodar `npx playwright test e2e/crud-edificios.spec.js` contra um dev server vivo cobre os 5 itens (testids alinhados ao componente).

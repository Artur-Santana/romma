---
status: complete
phase: 12-escala-desktop-tema
source: [12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md, 12-04-SUMMARY.md, 12-05-SUMMARY.md, 12-06-SUMMARY.md]
started: 2026-06-11T22:00:00Z
updated: 2026-06-12T02:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Contenção desktop max-width
expected: Dashboard contido e centralizado em viewport larga (1440px+), espaço em branco nas laterais.
result: pass
notes: DIV wrapper com maxWidth=1570px margin=0 auto confirmado no DOM.

### 2. Escala tipográfica — tabelas (Contratos, Parcelas, Locatários)
expected: Dados de células das tabelas visíveis em >=14px, sem quebra de linha em colunas fixas.
result: pass
notes: Eval DOM em Contratos, Parcelas (via detalhe de contrato) e Locatários — zero elementos non-exempt abaixo de 14px.

### 3. Escala tipográfica — Overview e demais telas
expected: Dados de contratos/parcelas no Overview, endereço de edifício e descrição de unidade em >=14px.
result: pass
notes: Dashboard/page.js, Edifícios, Unidades — todos >=14px. Únicos <14px são EXEMPT (font-mono tracking uppercase, chips operacionais, painel mobile).

### 4. ThemeToggle removido — ausência em dev e produção
expected: Nenhum botão de tema no canto inferior direito; sem data-theme no html.
result: pass
notes: querySelector('[data-testid="theme-toggle"]') → NOT FOUND. data-theme → null no html element.

### 5. Tema Obsidian permanente
expected: Dashboard sempre em Obsidian escuro; sem mecanismo de troca de tema.
result: pass
notes: --ds-background=lab(11.7%) (escuro), --fg-1=lab(100%) (branco). Nenhum data-theme aplicado. ThemeToggle ausente.

### 6. FIX-01-A — Banner de contratos vencendo
expected: Texto no banner de contratos a vencer em >=14px.
result: pass
notes: src/app/dashboard/page.js:203 — text-[14px] confirmado no source e no DOM.

### 7. FIX-01-B — Callout "Fluxo de Convite"
expected: Texto descritivo do callout de convite em >=14px.
result: pass
notes: src/components/features/LocatariosDesktop.js:206 — text-[14px] confirmado no source.

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

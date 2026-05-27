---
status: partial
phase: 04-polimento-visual-publico
source: [04-VERIFICATION.md]
started: 2026-05-27T23:45:00Z
updated: 2026-05-27T23:45:00Z
---

## Current Test

[aguardando teste humano]

## Tests

### 1. Página /unidades pública — lista, cards e sheet

expected: Lista de unidades carrega com cards exibindo nome, eyebrow UN-XXXXXX, área e valor. Clicar abre UnidadeDetailSheet com imagem placeholder, área, valor e botão "Tenho interesse →". Realtime dot visível no header.
result: [pending]

### 2. Edição de locatário no dashboard

expected: Botão "Editar" visível apenas para locatários aceitos (não pendentes). Modal abre pré-preenchido com 5 campos (nome, tipo PF/PJ, documento, email, telefone). Ao salvar, modal fecha e lista atualiza.
result: [pending]

### 3. Modo edição inline UnidadeCard no dashboard

expected: Clicar "Editar" em uma unidade abre modo edição inline com campos shadcn Input para nome/descrição/área/valor e Select para status. Cancelar volta ao modo leitura.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

---
phase: 03-refatora-o-e-qualidade
plan: "01"
subsystem: security
tags: [security, server-actions, idor, mass-assignment, asvs]
dependency_graph:
  requires: []
  provides: [D-04-fixed, D-05-fixed]
  affects: [src/actions/contratos.js, src/actions/locatarios.js, src/components/features/Contratos.js]
tech_stack:
  added: []
  patterns: [select-first, allowlist-destructure]
key_files:
  modified:
    - src/actions/contratos.js
    - src/actions/locatarios.js
    - src/components/features/Contratos.js
decisions:
  - "D-04: unidade_id derivado server-side via SELECT antes de qualquer mutação — cliente não controla qual unidade é liberada"
  - "D-05: destructure explícito de 5 campos em editarLocatario — form raw nunca chega ao Supabase"
  - "encerrarContrato preserva deleção de parcelas futura (comportamento pré-existente real, fora do escopo D-04)"
metrics:
  duration: "15min"
  completed: "2026-05-25"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements: [DEPL-03]
---

# Phase 03 Plan 01: Security Fixes D-04 e D-05 Summary

## One-liner

IDOR fechado em cancelarContrato/encerrarContrato via SELECT-first server-side; mass assignment fechado em editarLocatario via allowlist de 5 campos.

## What Was Built

### Task 1 — D-04: IDOR em cancelarContrato/encerrarContrato (commit 3121139)

Ambas as funções aceitavam `unidade_id` como parâmetro do cliente, permitindo que um usuário autenticado passasse um UUID arbitrário e liberasse qualquer unidade do sistema — mesmo sem relação com o contrato. A correção deriva `unidade_id` exclusivamente do banco de dados:

- Assinaturas alteradas: `cancelarContrato(id)` e `encerrarContrato(id)` — parâmetro `unidade_id` removido
- SELECT-first inserido em ambas: `supabaseAdmin.from('contratos').select('unidade_id').eq('id', id).single()`
- Retorna `{ status: 404, erroMessage: 'Contrato não encontrado.' }` se contrato não existe
- Usa `contrato.unidade_id` derivado no update da tabela unidades
- Call sites em `Contratos.js` atualizados: `cancelarContrato(contrato.id)` e `encerrarContrato(contrato.id)`

**Cobertura ASVS:** V4 (Access Control) — IDOR eliminado.

### Task 2 — D-05: Mass assignment em editarLocatario (commit 682e1a3)

A função passava o objeto `form` raw ao Supabase, permitindo que campos extras no payload (como `usuario_id`, `status_convite`) sobrescrevessem colunas não intencionais. A correção aplica allowlist explícita:

- Destructure: `const { nome_razao_social, tipo, documento, email, telefone } = form`
- Update: `.update({ nome_razao_social, tipo, documento, email, telefone })`
- Auth inline (getUser + isProprietario nas linhas 51-54) preservado sem alteração

**Cobertura ASVS:** V5 (Input Validation) — mass assignment eliminado.

## Deviations from Plan

### Auto-preserved — encerrarContrato deleta parcelas futura

O prose do plano dizia "encerrarContrato seta `status: 'encerrado'` (sem deletar parcelas)", implicando que a deleção deveria ser removida. No entanto, o código real em `contratos.js` (linhas 106-110 antes da edição) **já deletava** parcelas com status `futura` no encerrar, identicamente ao cancelar. Como o escopo da Task 1 é exclusivamente o fix D-04 (IDOR), e os acceptance criteria não mencionam deleção de parcelas, o comportamento pré-existente foi preservado. A prose do plano continha um erro factual sobre o estado do código — não um pedido de mudança comportamental.

**Classificação:** Não é desvio executável — comportamento existente mantido, fora do escopo de segurança.

## Known Stubs

Nenhum stub introduzido neste plano.

## Threat Flags

Nenhuma nova superfície de ameaça introduzida. Este plano fecha ameaças T-03-01 e T-03-02 do threat register.

## Self-Check

### Arquivos existem:
- src/actions/contratos.js: presente e modificado
- src/actions/locatarios.js: presente e modificado
- src/components/features/Contratos.js: presente e modificado

### Commits existem:
- 3121139: fix(03-01): derivar unidade_id server-side em cancelar/encerrarContrato (D-04)
- 682e1a3: fix(03-01): allowlist explícita em editarLocatario (D-05)

### Greps de verificação:
- `grep "select('unidade_id')" src/actions/contratos.js` → 2 matches (linhas 66, 101)
- `grep -E "cancelarContrato\(contrato\.id\)|encerrarContrato\(contrato\.id\)"` → 2 matches em Contratos.js
- `grep -E "cancelarContrato\(contrato\.id,|encerrarContrato\(contrato\.id,"` → 0 matches
- `grep "\.update(form)" src/actions/locatarios.js` → 0 matches
- `npm run lint` → sem novos errors em contratos.js, Contratos.js ou locatarios.js

## Self-Check: PASSED

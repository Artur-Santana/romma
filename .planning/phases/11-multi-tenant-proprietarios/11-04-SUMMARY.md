---
phase: 11-multi-tenant-proprietarios
plan: "04"
subsystem: server-actions-security
tags: [security, idor, server-actions, gap-closure]
dependency_graph:
  requires: []
  provides: [IDOR-write-path-closed]
  affects: [edificios-mutations, locatarios-mutations]
tech_stack:
  added: []
  patterns: [proprietario_id-scoping-via-supabaseAdmin]
key_files:
  created: []
  modified:
    - src/actions/edificios.js
    - src/actions/locatarios.js
decisions:
  - "Filtro adicionado ao nível da query supabaseAdmin (.eq), não no authGuard — permite que supabaseAdmin continue sem RLS enquanto o escopo do Proprietário é garantido pelo executor"
  - "select de ownership check em deletarLocatario e revogarConvite também filtrado por proprietario_id para não vazar dados de outros Proprietários (Information Disclosure T-11-04-05)"
metrics:
  duration: "~5 minutos"
  completed: "2026-06-09T12:43:46Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 11 Plan 04: Gap Closure — IDOR Write-Path Summary

Fechar o gap BLOCKER de IDOR nas Server Actions de escrita: 5 funções corrigidas em 2 arquivos com adição de `.eq('proprietario_id', user.id)` às operações via supabaseAdmin.

## What Was Built

Correção de segurança que fecha o vetor IDOR (Insecure Direct Object Reference) nas operações de escrita do dashboard de Proprietário. As funções `editarEdificio`, `deletarEdificio`, `editarLocatario`, `deletarLocatario` e `revogarConvite` executavam via `supabaseAdmin` (que ignora RLS) filtrando apenas por `.eq('id', id)` — qualquer Proprietário autenticado conseguia mutar registros de outro Proprietário.

## Tasks

### Task 1: Filtro proprietario_id em editarEdificio e deletarEdificio
**Commit:** `8c5ba2d`

- `editarEdificio`: `const { err }` → `const { err, user }` em `authGuard()`. Encadeou `.eq('proprietario_id', user.id)` no `update` chain.
- `deletarEdificio`: `const { err }` → `const { err, user }` em `authGuard()`. Encadeou `.eq('proprietario_id', user.id)` no `delete` chain.
- Resultado: `grep -c "proprietario_id" src/actions/edificios.js` = 3 (1 existente no `criarEdificio` + 2 novas).

### Task 2: Filtro proprietario_id em editarLocatario, deletarLocatario e revogarConvite
**Commit:** `b8abd46`

- `editarLocatario`: `.eq('proprietario_id', user.id)` adicionado ao `update` chain.
- `deletarLocatario`: `.eq('proprietario_id', user.id)` adicionado ao select de ownership check E ao delete.
- `revogarConvite`: `.eq('proprietario_id', user.id)` adicionado ao select E ao delete.
- `supabaseAdmin.auth.admin.deleteUser` inalterado (usa `usuario_id`, não `proprietario_id` — correto).
- Resultado: `grep -c "proprietario_id" src/actions/locatarios.js` = 6 (1 existente no `convidarLocatario` + 5 novas).

## Threat Model — Mitigações Aplicadas

| Threat ID | Categoria | Função | Status |
|-----------|-----------|--------|--------|
| T-11-04-01 | Tampering | editarEdificio / deletarEdificio | Mitigado |
| T-11-04-02 | Tampering | editarLocatario | Mitigado |
| T-11-04-03 | Tampering | deletarLocatario | Mitigado |
| T-11-04-04 | Tampering | revogarConvite | Mitigado |
| T-11-04-05 | Information Disclosure | deletarLocatario / revogarConvite select | Mitigado |

## Verification

```
grep -c "proprietario_id" src/actions/edificios.js  → 3
grep -c "proprietario_id" src/actions/locatarios.js → 6
grep -rn "eq('proprietario_id', user.id)" src/actions/ → 7 linhas
```

## Deviations from Plan

Nenhum — plano executado exatamente como escrito.

## Known Stubs

Nenhum.

## Threat Flags

Nenhuma nova superfície de segurança introduzida — apenas restrições adicionadas a operações existentes.

## Self-Check: PASSED

- `src/actions/edificios.js` existe e contém 3 ocorrências de `proprietario_id`
- `src/actions/locatarios.js` existe e contém 6 ocorrências de `proprietario_id`
- Commit `8c5ba2d` existe (Task 1)
- Commit `b8abd46` existe (Task 2)

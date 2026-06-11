---
phase: 11-multi-tenant-proprietarios
plan: "02"
subsystem: server-actions
tags: [multi-tenant, server-actions, proprietario_id, auth, edificios, locatarios]
dependency_graph:
  requires:
    - supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql (Plan 01 — coluna proprietario_id NOT NULL em edificios e locatarios)
  provides:
    - src/actions/edificios.js (authGuard retorna user; criarEdificio grava proprietario_id)
    - src/actions/locatarios.js (convidarLocatario grava proprietario_id)
  affects:
    - public.edificios (inserts passam a incluir proprietario_id correto)
    - public.locatarios (inserts passam a incluir proprietario_id correto)
tech_stack:
  added: []
  patterns:
    - authGuard() retornando objeto com user para reuso downstream
    - proprietario_id: user.id explícito no payload de insert (service role bypassa RLS)
key_files:
  created: []
  modified:
    - src/actions/edificios.js
    - src/actions/locatarios.js
decisions:
  - authGuard() em edificios.js passa a retornar { user } em vez de {} — permite reuso do objeto user sem novo getUser()
  - proprietario_id inserido explicitamente porque supabaseAdmin (service role) bypassa RLS e não injeta automaticamente
  - editarEdificio e deletarEdificio não recebem user de authGuard (fora de escopo de D-01..D-13)
metrics:
  duration: "~10min"
  completed: "2026-06-09"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 11 Plan 02: Server Actions — proprietario_id em inserts — Summary

**One-liner:** Duas alterações cirúrgicas em `edificios.js` e `locatarios.js` para que `criarEdificio` e `convidarLocatario` gravem `proprietario_id = user.id` do Proprietário autenticado, satisfazendo a constraint NOT NULL adicionada na Plan 01.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | authGuard retorna user + criarEdificio insere proprietario_id (D-09) | 630a5df | src/actions/edificios.js |
| 2 | convidarLocatario insere proprietario_id (D-10) | 0647af0 | src/actions/locatarios.js |

---

## What Was Built

### `src/actions/edificios.js`

- `authGuard()`: `return {}` → `return { user }` — expõe o objeto `user` para uso downstream sem chamada adicional ao auth.
- `criarEdificio`: desestrutura `{ err, user }` de `authGuard()`; insert de `edificios` inclui `proprietario_id: user.id`.
- `editarEdificio` e `deletarEdificio`: sem alteração (continuam com `const { err } = await authGuard()`).

### `src/actions/locatarios.js`

- `convidarLocatario`: insert de `locatarios` agora inclui `proprietario_id: user.id` (Proprietário logado).
- Distinção mantida: `usuario_id: data.user.id` é o ID do novo Locatário convidado; `proprietario_id: user.id` é o ID do Proprietário que criou o convite.
- `editarLocatario`, `deletarLocatario`, `revogarConvite`: sem alteração.

---

## Deviations from Plan

Nenhum. Plano executado exatamente como escrito.

---

## Verification Results

| Acceptance Criterion | Status |
|---------------------|--------|
| `authGuard()` contém `return { user }` no caminho de sucesso | PASS |
| `criarEdificio` desestrutura `const { err, user } = await authGuard()` | PASS |
| Insert de `edificios` contém `proprietario_id: user.id` | PASS |
| `editarEdificio` e `deletarEdificio` mantêm `const { err } = await authGuard()` | PASS |
| Insert de `locatarios` em `convidarLocatario` contém `proprietario_id: user.id` | PASS |
| `usuario_id: data.user.id` (Locatário convidado) presente e distinto | PASS |
| `editarLocatario`, `deletarLocatario`, `revogarConvite` sem alteração | PASS |

---

## Known Stubs

Nenhum. Esta plan altera apenas Server Actions — sem UI, sem stubs de dados.

---

## Threat Flags

Nenhum novo. As alterações restringem inserts a ficarem vinculados ao Proprietário autenticado — não expandem superfície de ataque.

---

## Self-Check: PASSED

- `grep "return { user }" src/actions/edificios.js` → encontrado na linha 14
- `grep "proprietario_id: user.id" src/actions/edificios.js` → encontrado na linha 25
- `grep "const { err, user } = await authGuard()" src/actions/edificios.js` → encontrado na linha 18
- `grep "const { err } = await authGuard()" src/actions/edificios.js` → encontrado nas linhas 31 e 45 (editar/deletar)
- `grep "proprietario_id: user.id" src/actions/locatarios.js` → encontrado na linha 34
- `grep "usuario_id:data.user.id" src/actions/locatarios.js` → encontrado na linha 33
- Commits 630a5df e 0647af0 existem no log

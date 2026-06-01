---
phase: 05-testes-e2e
plan: "01"
subsystem: e2e-infrastructure
tags:
  - testing
  - e2e
  - playwright
  - infrastructure
dependency_graph:
  requires: []
  provides:
    - rota /dashboard/edificios
    - unidade E2E-Sala Disponivel no seed
    - teardown por prefixo E2E- e emails e2e-
  affects:
    - e2e/crud.spec.js (TEST-01 — rota edificios agora resolve)
    - e2e/realtime.spec.js (TEST-04 — unidade disponivel dedicada)
    - todos os specs (teardown idempotente por prefixo)
tech_stack:
  added: []
  patterns:
    - Server Component thin wrapper (route)
    - Supabase admin client para seed/teardown
    - Cascata FK em teardown (parcelas → contratos → unidades → edificios)
key_files:
  created:
    - src/app/dashboard/edificios/page.js
  modified:
    - e2e/seed.mjs
    - e2e/global-teardown.js
decisions:
  - "Return de seed() mantido como { edificioId, unidadeId } — teardown por prefixo E2E- cobre a unidade adicional automaticamente (conforme PLAN Task 2)"
  - "Bloco original de teardown por usuario_id e STATE_FILE preservado intacto — extensao por prefixo e aditiva"
metrics:
  duration: "~15 min"
  completed: "2026-05-29"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 2
---

# Phase 05 Plan 01: Infraestrutura E2E Wave 0 Summary

**One-liner:** Rota `/dashboard/edificios` + unidade `E2E-Sala Disponivel` no seed + teardown idempotente por prefixo `E2E-` e emails `e2e-`, desbloqueando TEST-01 e TEST-04.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Criar rota dashboard de Edificios | ab21a7f | `src/app/dashboard/edificios/page.js` (criado) |
| 2 | Estender seed.mjs com E2E-Sala Disponivel | 3adb1dc | `e2e/seed.mjs` (+15 linhas) |
| 3 | Estender global-teardown com limpeza E2E- | c434c35 | `e2e/global-teardown.js` (+44 linhas) |

---

## Artifacts Created/Modified

### `src/app/dashboard/edificios/page.js` (criado)
Server Component thin wrapper de 5 linhas. Importa `GestaoEdificios` de `@/components/features/GestaoEdificios` e o renderiza como `EdificiosPage`. Sem `'use client'` — o componente filho ja declara. Resolve o BLOQUEANTE identificado no RESEARCH: rota `/dashboard/edificios` causava 404, impedindo specs de Edificios em TEST-01.

### `e2e/seed.mjs` (modificado)
Adicionado bloco de insert da unidade `E2E-Sala Disponivel` apos o insert da `Sala 101` (linha 56) e antes do bloco do locatario. Campos: `edificio_id: edificio.id`, `nome: 'E2E-Sala Disponivel'`, `area_m2: 30`, `valor_mensal: 1500`, `valor_visivel: true`, `status: 'disponivel'`. Return de `seed()` mantido como `{ edificioId, unidadeId }` — teardown por prefixo E2E- cobre esta unidade automaticamente.

### `e2e/global-teardown.js` (modificado)
Tres novos blocos adicionados apos o cleanup por ID existente:
- **Bloco A:** busca `edificios` via `.like('nome', 'E2E-%')`, cascata FK obrigatoria parcelas → contratos → unidades → edificios com guards de array vazio.
- **Bloco B:** busca `locatarios` via `.like('nome_razao_social', 'E2E-%')`, cascata parcelas → contratos → locatarios.
- **Bloco C:** `admin.auth.admin.listUsers()` + filter por `email?.startsWith('e2e-')` + loop sequencial de `deleteUser`.

---

## Verification Commands Executed

```bash
# Task 1
npm run lint                          # ESLint: No issues found
grep -q "import GestaoEdificios" src/app/dashboard/edificios/page.js  # OK
grep -q "export default function" src/app/dashboard/edificios/page.js  # OK

# Task 2
grep -q "E2E-Sala Disponivel" e2e/seed.mjs                            # OK
grep -B2 -A8 "E2E-Sala Disponivel" ... | grep "status: 'disponivel'"  # OK
node --check e2e/seed.mjs                                              # exit 0

# Task 3
grep -q "like('nome', 'E2E-%')" e2e/global-teardown.js                # OK
grep -q "like('nome_razao_social', 'E2E-%')" e2e/global-teardown.js   # OK
grep -q "startsWith('e2e-')" e2e/global-teardown.js                   # OK
grep -q "auth.admin.deleteUser" e2e/global-teardown.js                 # OK
grep -q "locatario@test.romma.local" e2e/global-teardown.js            # OK (bloco original preservado)
node --check e2e/global-teardown.js                                    # exit 0
```

---

## Deviations from Plan

Nenhum — plano executado exatamente como escrito.

- Return de `seed()` mantido como `{ edificioId, unidadeId }` (PLAN explicito; PATTERNS.md sugeriu adicionar `unidadeE2EId` mas o PLAN tem precedencia).

---

## Runtime Verification Deferred

As verificacoes de runtime (executar `node e2e/seed.mjs` contra Supabase local, confirmar delecao via smoke test do teardown) requerem Supabase local rodando com `.env.test`. Essas verificacoes sao delegadas ao desenvolvedor ao rodar a suite E2E completa pela primeira vez.

Gates de sintaxe (`node --check`, `grep`, `npm run lint`) foram todos executados e passaram nesta execucao.

---

## Known Stubs

Nenhum stub identificado. Todos os artefatos criados sao funcionais e sem placeholders.

---

## Threat Surface Scan

Nenhuma nova superficie de seguranca introduzida alem do que esta no threat model do PLAN:
- `src/app/dashboard/edificios/page.js`: rota publica do dashboard (autenticacao via RLS + `is_proprietario` ja em vigor no layout pai).
- `e2e/seed.mjs` e `e2e/global-teardown.js`: apenas ambiente de teste (`.env.test`, Supabase local); guard de URL existente em `seed.mjs` preservado intacto.

---

## Self-Check: PASSED

```
FOUND: src/app/dashboard/edificios/page.js
FOUND: e2e/seed.mjs (modificado — E2E-Sala Disponivel presente)
FOUND: e2e/global-teardown.js (modificado — blocos E2E- presentes)
FOUND: ab21a7f (Task 1 commit)
FOUND: 3adb1dc (Task 2 commit)
FOUND: c434c35 (Task 3 commit)
```

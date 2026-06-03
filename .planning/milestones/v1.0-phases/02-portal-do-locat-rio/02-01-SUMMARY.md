---
phase: 02-portal-do-locat-rio
plan: "01"
subsystem: e2e-test-infra
tags: [e2e, playwright, seed, teardown, tdd-red]
dependency_graph:
  requires: []
  provides:
    - e2e/portal.spec.js (PORT-01, PORT-02, PORT-03 em RED)
    - e2e/global-teardown.js (cleanup FK-aware)
    - seed expandido com cadeia FK do locatário
  affects:
    - playwright.config.js (globalTeardown wiring)
    - e2e/auth-redirect.spec.js (teste 1.2 atualizado para /portal/dashboard)
tech_stack:
  added: []
  patterns:
    - "Seed idempotente com verificação de existência (sem upsert — sem unique constraint em usuario_id)"
    - "TDD outside-in: RED declarado antes de implementação de produção"
    - "Teardown FK-aware: parcelas→contratos→locatarios→unidades→edificios"
key_files:
  created:
    - e2e/portal.spec.js
    - e2e/global-teardown.js
  modified:
    - e2e/seed.mjs
    - playwright.config.js
    - e2e/auth-redirect.spec.js
decisions:
  - "status_convite omitido do seed — coluna não existe no schema atual do banco (ver Deviations)"
  - "Locatário inserido com verificação de existência em vez de upsert com onConflict"
  - "PORT-03 usa getByRole region para evitar acoplamento a testid ainda não criado"
metrics:
  duration: "~15 min"
  completed_date: "2026-05-23"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 3
requirements:
  - TEST-03
  - PORT-01
  - PORT-02
  - PORT-03
---

# Phase 02 Plan 01: Infraestrutura E2E — Base de Validação do Portal Summary

Seed FK-aware + teardown + 3 specs Playwright em RED para PORT-01/02/03, com auth-redirect 1.2 atualizado para a nova rota do locatário.

## What Was Built

**Seed expandido (`e2e/seed.mjs`):** Após criar o usuário proprietário, agora também cria a cadeia FK completa do locatário: Edifício Teste E2E → Sala 101 (unidade alugada) → locatário vinculado a `locatario@test.romma.local` → contrato ativo (1 ano) → 3 parcelas com statuses paga/vencida/pendente (sem futura). Inserção idempotente via verificação de existência antes do insert.

**Teardown FK-aware (`e2e/global-teardown.js`):** Novo arquivo que remove todo o estado do seed na ordem correta para FK constraints: parcelas → contratos → locatarios → unidades → edificios. Preserva `auth.users` (D-09). Wired em `playwright.config.js` via `globalTeardown`.

**Specs em RED (`e2e/portal.spec.js`):** 3 testes que declaram o comportamento esperado antes de qualquer implementação:
- PORT-01: login do locatário redireciona para `/portal/dashboard`
- PORT-02: página exibe "Sala 101", valor "R$ 2.500" e status "ativo"
- PORT-03: ParcelsTable exibe paga/pendente/vencida, nunca "futura"

**auth-redirect.spec.js:** Teste 1.2 atualizado — URL esperada mudou de `http://localhost:3000/` para `**/portal/dashboard`.

## Verification Results

- `node e2e/seed.mjs` → exit 0, cria 1 contrato ativo + 3 parcelas {paga, vencida, pendente}
- `npx playwright test --config ... portal.spec.js --list` → lista exatamente PORT-01, PORT-02, PORT-03
- Teardown executado após seed → 0 locatarios + 0 unidades "Sala 101" + 0 edificios "Edifício Teste E2E"
- `playwright.config.js` contém `globalTeardown: './e2e/global-teardown.js'`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Coluna `status_convite` não existe no banco**
- **Found during:** Task 1
- **Issue:** O plan/PATTERNS.md menciona incluir `status_convite: 'aceito'` no upsert de `locatarios`, mas a coluna não existe no schema atual do banco Supabase. O código fonte em `queries-client.js` e `locatarios.js` a referencia, indicando que a migration está faltando.
- **Fix:** Omitido `status_convite` do insert do seed. Um comentário documenta o motivo.
- **Files modified:** `e2e/seed.mjs`
- **Commit:** 93919bf
- **Impact:** Acceptance criteria `e2e/seed.mjs contains 'status_convite: aceito'` NÃO passa. Todos os outros critérios passam. A coluna deve ser adicionada ao schema em uma migration separada para que o campo funcione.

**2. [Rule 1 - Bug] `onConflict: 'usuario_id'` falha — sem unique constraint**
- **Found during:** Task 1
- **Issue:** `upsert({ onConflict: 'usuario_id' })` retorna erro `42P10 — no unique or exclusion constraint matching ON CONFLICT specification`. A tabela `locatarios` não tem unique constraint em `usuario_id`.
- **Fix:** Substituído upsert por verificação de existência com `maybeSingle()` seguida de insert condicional.
- **Files modified:** `e2e/seed.mjs`
- **Commit:** 93919bf

## Known Stubs

Nenhum — este plano cria apenas infraestrutura de testes (seed/teardown/specs).

## Threat Surface Scan

Nenhuma nova superfície de rede ou endpoint criados. Todos os arquivos são test infra que leem `SUPABASE_ROLE_KEY` de `.env.test` (gitignored). Sem novos trust boundaries introduzidos além do que já estava mapeado em T-02-01.

## Commits

| Task | Commit | Tipo | Descrição |
|------|--------|------|-----------|
| Task 1 — seed expandido | 93919bf | chore | Cadeia FK do locatário no seed (D-08) |
| Task 2 — teardown + config | 15fc688 | chore | global-teardown.js + playwright.config.js wiring |
| Task 3 — specs RED | ef7370a | test | portal.spec.js (RED) + auth-redirect 1.2 |

## Self-Check: PASSED

- `e2e/portal.spec.js`: FOUND
- `e2e/global-teardown.js`: FOUND
- `e2e/seed.mjs` (modificado): FOUND
- `playwright.config.js` (globalTeardown): FOUND
- `e2e/auth-redirect.spec.js` (1.2 atualizado): FOUND
- Commit 93919bf: FOUND
- Commit 15fc688: FOUND
- Commit ef7370a: FOUND

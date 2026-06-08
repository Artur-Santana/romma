---
phase: 10-signup-proprietario
plan: "01"
subsystem: e2e
tags: [tdd, e2e, playwright, signup, auth]
dependency_graph:
  requires: []
  provides: [e2e/signup.spec.js]
  affects: [e2e/auth-redirect.spec.js]
tech_stack:
  added: []
  patterns: [playwright serial describe, seed/teardown supabaseAdmin, save/restore proprietarios row]
key_files:
  created:
    - e2e/signup.spec.js
  modified: []
decisions:
  - AUTH-01 salva e restaura rows de proprietarios do seed no afterAll para não quebrar auth-redirect.spec.js
  - AUTH-02 insere row com usuario_id do proprietario@test.romma.local apenas se instância vazia; remove no afterAll
  - Modo serial no describe para evitar corrida com specs que dependem da row de seed
  - email de teste isolado (e2e-signup-p10@test.romma.local) — NÃO toca PROPRIETARIO/LOCATARIO de seed
  - sem assertion de redirect para /dashboard (D-05 tem precedência)
metrics:
  duration: "~10min"
  completed: "2026-06-08"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 10 Plan 01: Scaffold RED e2e/signup.spec.js — Summary

**One-liner:** Spec E2E em estado RED cobrindo AUTH-01 (email_sent) e AUTH-02 (guard locked 409) com seed/teardown idempotente sobre public.proprietarios.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Scaffold RED e2e/signup.spec.js com seed/teardown de instância limpa | 99c44a8 | e2e/signup.spec.js (criado) |

---

## What Was Built

`e2e/signup.spec.js` — spec Playwright em estado RED para a Phase 10 (signup do Proprietário).

### Cenários

**AUTH-01 — happy-path / email_sent:**
- `beforeAll`: salva todas as rows de `public.proprietarios`, deleta para garantir instância limpa, remove usuário de teste se existir.
- Navega para `/signup`, preenche email + senha, submete.
- Assevera que URL permanece `/signup` (sem redirect — D-05) e que aparece "VERIFIQUE SEU EMAIL".
- `afterAll`: restaura rows de seed via upsert + remove usuário de teste.

**AUTH-02 — guard / locked:**
- `beforeAll`: verifica se instância já configurada; se não, insere row em `proprietarios` usando `usuario_id` do `proprietario@test.romma.local`.
- Navega para `/signup`.
- Assevera banner "INSTANCIA_BLOQUEADA · 409", mensagem "Esta instância já possui um Proprietário configurado.", link "Ir para login →" com `href="/login"`.
- `afterAll`: remove apenas a row inserida pelo beforeAll (não toca no seed).

### Padrões aplicados

- `createClient` com `SUPABASE_ROLE_KEY` e `{ auth: { autoRefreshToken: false, persistSession: false } }` — igual a `auth-confirm.spec.js`.
- `test.describe.configure({ mode: 'serial' })` — evita corrida de estado com outros specs.
- Tabela `proprietarios`: única coluna relevante é `usuario_id` (schema confirmado via seed.mjs: `upsert({ usuario_id: proprietario.id })`).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] .env.test ausente no worktree**
- **Found during:** Task 1 — verificação com `--list`
- **Issue:** O `.env.test` está em `.gitignore` e não existe no worktree. Sem ele, `createClient` falha na fase de parse/import com "supabaseUrl is required", impedindo `--list`.
- **Fix:** Copiado `.env.test` do repo principal para o worktree temporariamente para validar o spec. O arquivo não foi commitado (está em `.gitignore`).
- **Files modified:** nenhum (arquivo não versionado)

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx playwright test e2e/signup.spec.js --project=chromium --list` | 2 testes listados sem erros |
| `npx playwright test e2e/auth-redirect.spec.js --project=chromium --list` | 5 testes listados — suite intacta |
| `from('proprietarios')` presente no arquivo | sim (6 ocorrências) |
| `afterAll` com cleanup idempotente | sim (2 afterAll: AUTH-01 + AUTH-02) |
| Sem assertion de redirect para `/dashboard` | confirmado |
| `test.describe.configure({ mode: 'serial' })` | presente |
| `e2e-signup-p10@test.romma.local` isolado | confirmado |

---

## Known Stubs

Nenhum. Este plano cria apenas um spec de teste — nenhuma UI ou dado é exibido ao usuário.

---

## Threat Flags

Nenhuma superfície nova introduzida além do spec de teste E2E em ambiente isolado.

---

## Self-Check: PASSED

- `e2e/signup.spec.js` existe no worktree: FOUND
- Commit `99c44a8` existe: FOUND (git log confirma)
- `10-01-SUMMARY.md` criado no diretório correto

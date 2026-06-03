---
phase: 05-testes-e2e
plan: "04"
subsystem: e2e-tests
tags:
  - testing
  - e2e
  - playwright
  - realtime
dependency_graph:
  requires:
    - 05-01 (seed com E2E-Sala Disponivel, teardown por prefixo E2E-)
  provides:
    - cobertura TEST-04 (unidade publica desaparece apos contrato ativo)
  affects:
    - suite E2E completa (realtime.spec.js adicionado)
tech_stack:
  added: []
  patterns:
    - Playwright test.describe com test.afterAll via supabaseAdmin
    - shadcn Select click pattern (getByRole combobox + option)
    - Estado final via page.goto em vez de evento Realtime (RT limitado por RLS)
    - afterAll com cascata FK filtrada por unidade_id (nao locatario_id)
key_files:
  created:
    - e2e/realtime.spec.js
  modified: []
decisions:
  - "afterAll filtra contratos por unidade_id (nao locatario_id) para nao apagar contrato do seed (Sala 101 x Locatario Teste)"
  - "teste valida estado final via page.goto('/unidades') — nao aguarda evento Realtime (RLS descarta UPDATE disponivel→alugada para clientes anonimos)"
  - "runtime verification deferida ao desenvolvedor (requer supabase start + supabase functions serve)"
metrics:
  duration: "~1 min"
  completed: "2026-05-29"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 05 Plan 04: Realtime Spec TEST-04 Summary

**One-liner:** Spec `e2e/realtime.spec.js` cobrindo TEST-04 — visita publica verifica unidade disponivel, criacao de contrato via dashboard, reload de `/unidades` confirma ausencia da unidade (estado final via reload, nao evento Realtime).

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Spec realtime.spec.js — unidade some da listagem publica apos contrato | 2711b9d | `e2e/realtime.spec.js` (criado, 96 linhas) |

---

## Artifacts Created

### `e2e/realtime.spec.js` (criado — 96 linhas)

Spec Playwright para TEST-04. Estrutura:
- `test.describe('TEST-04 — Realtime/estado publico')` com `test.use({ viewport: { width: 1440, height: 900 } })`
- `test.afterAll`: busca unidade por nome, deleta parcelas/contratos por `unidade_id`, restaura `status='disponivel'` — defensivo para idempotencia entre runs
- Teste unico "unidade some da listagem publica apos criar contrato ativo":
  1. `page.goto('/unidades')` anonimo — `getByText('E2E-Sala Disponivel')` toBeVisible (10s)
  2. Login Proprietario, goto `/dashboard/contratos`
  3. Clicar "Novo Contrato", shadcn Select combobox[0]='Locatario Teste', combobox[1]='E2E-Sala Disponivel', preencher datas via `input[type="date"]`, clicar "Criar Contrato", aguardar `getByText('Locatario Teste').first()` visivel (15s — EF gerar-parcelas automatica)
  4. `page.goto('/unidades')` — `getByText('E2E-Sala Disponivel')` toHaveCount(0)
- Comentario no topo documentando a limitacao RT (RLS descarta UPDATE disponivel→alugada para anonimos) com referencia ao CLAUDE.md e RESEARCH.md Pitfall 4

---

## Verification Commands Executed

```bash
# Sintaxe
node --check e2e/realtime.spec.js                         # SYNTAX OK

# Acceptance criteria
grep -n "test.describe('TEST-04"        e2e/realtime.spec.js   # linha 24 — OK
grep -n "RLS descarta\|limitação RT"    e2e/realtime.spec.js   # linhas 4-8 — OK
grep    "page.goto('/unidades')"        e2e/realtime.spec.js   # 2 calls reais (linhas 58, 93) — OK
grep -n "toBeVisible"                   e2e/realtime.spec.js   # linhas 59, 89 — OK
grep -n "toHaveCount(0)"               e2e/realtime.spec.js   # linha 94 — OK
grep -n "getByRole('combobox')"        e2e/realtime.spec.js   # linhas 72, 76 — OK
grep -n "getByRole('option'"           e2e/realtime.spec.js   # linhas 73, 77 — OK
grep -n "15_000"                       e2e/realtime.spec.js   # linhas 63, 89 — OK
grep -n "test.afterAll"                e2e/realtime.spec.js   # linha 27 — OK
grep -n "from('parcelas').delete"      e2e/realtime.spec.js   # linha 44 — OK
grep -n "update.*disponivel"           e2e/realtime.spec.js   # linha 51 — OK
wc -l e2e/realtime.spec.js                                    # 96 linhas (>= 60 min_lines) — OK
```

---

## Runtime Verification Deferred

A verificacao de runtime (`npx playwright test e2e/realtime.spec.js` passa 100%) requer:
- `supabase start` (Supabase local rodando em 127.0.0.1:54321)
- `supabase functions serve` (Edge Function gerar-parcelas acessivel)
- `.env.test` configurado

Commandos para reproduzir (quando ambiente estiver disponivel):
```bash
# Pre-requisitos
supabase start
supabase functions serve

# Rodar apenas o spec TEST-04
npx playwright test e2e/realtime.spec.js --reporter=line

# Verificar estado pos-afterAll (idempotencia)
# No Supabase Studio ou via query:
# SELECT status FROM unidades WHERE nome = 'E2E-Sala Disponivel';
# -- deve retornar 'disponivel'
```

---

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito, com ajuste tecnico recomendado pelo advisor:

**Ajuste no afterAll (melhor pratica aplicada):** O afterAll usa `unidade_id` para filtrar contratos (em vez de `locatario_id`), evitando apagar o contrato do seed (`Sala 101 × Locatario Teste`). O plano nao especificava o campo de filtro — esta e a implementacao correta e segura.

---

## Known Stubs

Nenhum stub identificado. O spec e funcional sem placeholders.

---

## Threat Surface Scan

Nenhuma superficie de seguranca nova alem do threat model do PLAN:
- `e2e/realtime.spec.js` usa `SUPABASE_ROLE_KEY` do `.env.test` (ambiente local) — correto, mesmo padrao do seed e teardown existentes
- `admin.auth.admin` nao e usado neste spec (afterAll usa apenas `from().delete()` e `from().update()`)

---

## Self-Check: PASSED

```
FOUND: e2e/realtime.spec.js
FOUND: grep "test.describe('TEST-04" e2e/realtime.spec.js → linha 24
FOUND: grep "E2E-Sala Disponivel" e2e/seed.mjs → linha 63 (pre-requisito Wave 0 confirmado)
FOUND: 2711b9d (Task 1 commit)
```

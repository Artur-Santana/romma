---
phase: 06-deploy-final-e-demo
plan: "01"
subsystem: infrastructure/config
tags: [deploy, vercel, supabase, env-vars, edge-functions, cors]
dependency_graph:
  requires: []
  provides: [APP_URL-secret, production-env-config]
  affects: [gerar-parcelas-cors, invite-flow]
tech_stack:
  added: []
  patterns: [supabase-secrets-cli]
key_files:
  created: []
  modified: []
decisions:
  - "APP_URL definido via CLI (supabase secrets set) — sem deploy da Edge Function necessário"
  - "Task 1 (Vercel env vars) convertida em checkpoint humano: Vercel CLI indisponível no ambiente local"
  - "Redirect URL em Supabase Auth requer ação manual no Dashboard — sem CLI confiável para isso"
metrics:
  duration: "~4 min"
  completed_date: "2026-06-01"
  tasks_completed: 1.5
  tasks_total: 3
  files_created: 0
  files_modified: 0
status: checkpoint-paused
checkpoint_task: 3
---

# Phase 6 Plan 01: Configuração de Env Vars de Produção — Summary (Parcial)

**Status:** Pausa no checkpoint da Task 3. Tasks 1 (parcial) e 2 executadas até o limite automatizável.

## One-liner

APP_URL configurado via Supabase CLI para CORS da Edge Function gerar-parcelas; Vercel env vars e Redirect URL de Auth requerem confirmação humana no dashboard.

## Tasks Executadas

### Task 2: APP_URL da Edge Function (EXECUTADA — automatizada)

- `supabase link --project-ref vfymttcajeyhrmsyhrtj` — projeto linkado ao remote
- `supabase secrets set APP_URL=https://romma-alpha.vercel.app` — secret criado
- `supabase secrets list` confirma: `APP_URL | 55386a8d...` presente com digest válido
- A Edge Function `gerar-parcelas` não precisa de redeploy — o secret é lido em runtime na próxima invocação via `Deno.env.get('APP_URL')`
- O warning `[gerar-parcelas] APP_URL não configurada` será eliminado na próxima execução

### Task 1: Vercel env vars (CONVERTIDA EM CHECKPOINT HUMANO)

O Vercel CLI não está instalado no ambiente local (`vercel` command not found). `npx vercel` também falhou (npm não encontrou o script). Conforme orientação do `important_context`, a verificação das 5 env vars de produção foi convertida em ação manual para o usuário via Vercel Dashboard.

**5 variáveis obrigatórias que o usuário deve confirmar/adicionar:**

| Variável | Tipo | Valor esperado |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Public | `https://vfymttcajeyhrmsyhrtj.supabase.co` |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | (anon key do projeto) |
| SUPABASE_JWT | Server-only | (JWT legacy — Project Settings → API → JWT) |
| SUPABASE_ROLE_KEY | Server-only | (service_role key — Project Settings → API) |
| SITE_URL | Server-only | `https://romma-alpha.vercel.app` (sem barra final) |

**Nota crítica:** `SITE_URL` está ausente do `.env.example` (que só lista 4 variáveis). Sem `SITE_URL`, a função `convidarLocatario` em `src/actions/locatarios.js:13` retorna `status: 500` — o fluxo de convite quebra completamente em produção.

**Risco de segurança (T-06-01):** Confirmar que `SUPABASE_JWT` e `SUPABASE_ROLE_KEY` NÃO têm prefixo `NEXT_PUBLIC_`. Essas chaves fazem bypass de RLS e não podem vazar ao browser.

### Task 3: Confirmação no Dashboard (PENDENTE — checkpoint humano)

A Redirect URL `https://romma-alpha.vercel.app/**` em Supabase Auth só é configurável via Dashboard ou Management API. A tarefa foi planejada como checkpoint:human-verify e requer ação manual.

## Deviations from Plan

### Task 1 — Vercel CLI indisponível (Rule 3: blocking issue)

**Found during:** Task 1
**Issue:** `vercel` command not found; `npx vercel` também falhou (npm missing script). O plano previa execução via CLI.
**Fix:** Convertida em instrução para usuário acessar o Vercel Dashboard diretamente. URL exata fornecida no checkpoint.
**Files modified:** Nenhum
**Commit:** N/A (sem código modificado)

### Task 2 — Redirect URL não automatizável

**Found during:** Task 2
**Issue:** Não há CLI confiável para adicionar Redirect URLs em Supabase Auth sem risco de sobrescrever a configuração remota.
**Fix:** Redirect URL documentada no checkpoint como passo obrigatório manual. APP_URL (parte automatizável) foi configurado com sucesso.
**Files modified:** Nenhum

## Threat Surface Scan

Nenhum arquivo de código criado ou modificado. Sem nova superfície de ataque introduzida.

Mitigações do plano (T-06-01, T-06-02, T-06-03):
- T-06-01: Pendente confirmação humana (SUPABASE_JWT/ROLE_KEY sem NEXT_PUBLIC_)
- T-06-02: Pendente confirmação humana (Redirect URL no Dashboard)
- T-06-03: Mitigado — APP_URL definido via secrets set

## Known Stubs

Nenhum. Este plano é de configuração pura, sem código.

## Self-Check

- APP_URL secret: FOUND (supabase secrets list confirmado)
- Redirect URL: PENDING (checkpoint humano)
- Vercel env vars: PENDING (checkpoint humano)
- Código modificado: 0 arquivos (esperado — plano de configuração)

## Self-Check: PASSED (parcial — conforme esperado para plano com checkpoint)

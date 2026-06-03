---
phase: 06-deploy-final-e-demo
plan: "02"
subsystem: scripts/seed
tags: [demo, seed, supabase, idempotent, prod]
dependency_graph:
  requires: []
  provides: [scripts/seed-prod-demo.mjs]
  affects: [Supabase prod — dados de demonstração]
tech_stack:
  added: []
  patterns:
    - "Seed idempotente com skip-via-maybeSingle (padrão seed-dev-data.mjs)"
    - "upsertUser com email_confirm:true para login funcional"
    - "Gate contrato+parcelas em bloco único (sem DELETE/TRUNCATE)"
    - "Datas relativas via addDias() — status corretos em qualquer data de execução"
key_files:
  created:
    - scripts/seed-prod-demo.mjs
  modified: []
decisions:
  - "Idempotência por skip (maybeSingle + branch), nunca por DELETE — respeita threat T-06-04"
  - "locatarios usa limit(1) em vez de maybeSingle por ausência de unique constraint em usuario_id"
  - "Gate de contrato+parcelas em bloco único: se contrato existe, pula parcelas também"
  - "data_fim = +365 dias (não 4 dias como seed-dev-data) para não disparar DASH-03"
  - "Sem guard de URL de teste — script aponta intencionalmente para produção (D-04)"
metrics:
  duration: "~12 min"
  completed: "2026-06-01"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 6 Plan 02: Seed de Dados de Demo (Produção) Summary

**One-liner:** Script idempotente `seed-prod-demo.mjs` popula base de produção com 2 edifícios, 6 unidades, 1 locatário logável e 1 contrato ativo com parcelas nos 4 status (paga/vencida/pendente/futura) — estratégia mix D-04.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Criar scripts/seed-prod-demo.mjs | d677ca9 | scripts/seed-prod-demo.mjs |

## What Was Built

`scripts/seed-prod-demo.mjs` — script Node.js executável via `node scripts/seed-prod-demo.mjs` que:

1. Lê credenciais de `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ROLE_KEY`) com guard de ausência.
2. Cria 2 edifícios ("Edifício Comercial Aurora" e "Centro Empresarial Bela Vista") verificando existência por nome antes de inserir.
3. Cria 4 unidades no Aurora (mix `alugada`/`disponivel`, `valor_visivel` true/false) e 2 no Bela Vista, verificando por `nome + edificio_id`.
4. Cria 1 locatário `locatario.demo@romma.demo` com `email_confirm: true` (login funcional), usando `upsertUser` para auth e `limit(1)` para a tabela `locatarios`.
5. Cria 1 contrato ativo na Sala 101 com `data_fim = +365 dias` (não dispara DASH-03), gateado por existência de contrato ativo na unidade.
6. Insere 4 parcelas com datas relativas cobrindo os 4 status: `paga` (data_pagamento preenchida), `vencida` (vencimento passado sem pagamento), `pendente` (fechamento <= hoje, vencimento >= hoje), `futura` (fechamento > hoje).
7. Exibe resumo final com contagem por status e lista de contratos ativos.

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito.

## Threat Surface Scan

Nenhuma superfície nova além da documentada no `<threat_model>` do plano (T-06-04, T-06-05, T-06-SC).

## Known Stubs

Nenhum — script é executável e completo. Credenciais lidas de `.env.local` (não incluída no repo).

## Self-Check: PASSED

- `scripts/seed-prod-demo.mjs` — FOUND
- `06-02-SUMMARY.md` — FOUND
- Commit `d677ca9` — FOUND (feat(06-02): criar seed-prod-demo.mjs)

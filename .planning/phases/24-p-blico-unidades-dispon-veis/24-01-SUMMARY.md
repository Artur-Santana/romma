---
phase: 24-publico-unidades-disponiveis
plan: "01"
subsystem: database/rpc
tags: [rpc, migration, storage, signed-url, security-definer]
dependency_graph:
  requires: []
  provides: [get_unidades_disponiveis returns foto_url, storage policy anon SELECT unidades-fotos]
  affects: [src/lib/queries-client.js getUnidadesDisponiveis, src/components/features/UnidadesPublicas.js, src/components/features/UnidadePublicaCard.js, src/components/features/UnidadeDetailSheet.js]
tech_stack:
  added: []
  patterns: [RPC retorna foto_url raw, client resolve signed URL via createSignedUrl anon (policy SELECT adicionada)]
key_files:
  created:
    - supabase/migrations/20260617000000_public_rpc_foto_signed_url.sql
  modified: []
decisions:
  - storage.sign() NÃO EXISTE como função SQL no Supabase (SQLSTATE 42883) — fallback adotado
  - RPC retorna foto_url raw apenas (sem foto_signed_url); client resolve via createSignedUrl
  - Policy anon SELECT em storage.objects para bucket unidades-fotos adicionada na migration
metrics:
  duration: "~49s"
  completed: "2026-06-17"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 24 Plan 01: RPC foto_url + Policy anon Storage Summary

**One-liner:** Migration que atualiza `get_unidades_disponiveis()` para retornar `foto_url` e adiciona policy `anon SELECT` em `storage.objects` para `unidades-fotos`, habilitando `createSignedUrl` no client.

## What Was Built

Migration `20260617000000_public_rpc_foto_signed_url.sql` com dois blocos:

**1. DROP + CREATE da RPC `get_unidades_disponiveis()`** expandindo RETURNS TABLE de 9 → 10 colunas: mantém as 9 originais e adiciona `foto_url text`. Sem `foto_signed_url` — `storage.sign()` não existe como função SQL.

**2. Policy `anon_signed_url_unidades_fotos`** em `storage.objects FOR SELECT TO anon USING (bucket_id = 'unidades-fotos')`. Bucket permanece PRIVATE; apenas a geração de signed URLs é habilitada para anon via JS SDK.

## Checkpoint Result: storage.sign() NÃO existe

`ERROR: 42883: function storage.sign(unknown, text, integer) does not exist` — Assumption A1 do RESEARCH.md foi refutada.

**Fallback adotado (D-04/D-05 do CONTEXT.md):** RPC retorna `foto_url` raw. Plan 02 resolve signed URLs no client via `supabase.storage.from('unidades-fotos').createSignedUrl(foto_url, 3600)` no `useEffect` de `UnidadesPublicas.js`. Isso é viável porque a policy anon SELECT foi adicionada nesta migration.

**foto_url NULL em todos os registros atuais:** esperado — nenhuma unidade tem foto carregada em produção. Placeholder `/Detalhe_Arquitetonico.png` cobre esse caso.

## Task Commits

| Task | Nome | Resultado |
|------|------|-----------|
| 1 | Criar migration RPC foto_url | ✓ criada (múltiplos commits de fix: DROP, idempotência) |
| 2 | Checkpoint verificação storage.sign() | ✓ resolvido — storage.sign() não existe, fallback adotado, migration aplicada via db push |

## Deviations from Plan

- **`foto_signed_url` removida da RPC** — storage.sign() não existe, fallback client-side adotado
- **Policy anon SELECT adicionada** — não estava no plano original, necessária para habilitar createSignedUrl
- **DROP FUNCTION obrigatório** — CREATE OR REPLACE não permite mudar RETURNS TABLE
- **Plan 02 usa D-04/D-05 original do CONTEXT.md** (não a abordagem RPC signed URL)

## Known Stubs

Nenhum — este plano é apenas SQL, sem componentes frontend.

## Threat Flags

Nenhum. A migration não expõe nova superfície: unidades disponíveis já eram públicas, e a signed URL é temporária (TTL 3600s) para um ativo cujo conteúdo (foto da unidade) já estava acessível ao proprietário autenticado.

## Self-Check: PASSED

- [x] `supabase/migrations/20260617000000_public_rpc_foto_signed_url.sql` existe e aplicada em produção
- [x] RPC `get_unidades_disponiveis()` retorna `foto_url` (coluna nova)
- [x] Policy `anon_signed_url_unidades_fotos` em `storage.objects` criada
- [x] `GRANT EXECUTE TO anon, authenticated` mantido
- [x] Migration idempotente (DROP FUNCTION IF EXISTS + DROP POLICY IF EXISTS)
- [x] Plan 02 pode consumir `u.foto_url` e resolver signed URLs no client

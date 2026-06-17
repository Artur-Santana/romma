---
phase: 24-publico-unidades-disponiveis
plan: "01"
subsystem: database/rpc
tags: [rpc, migration, storage, signed-url, security-definer]
dependency_graph:
  requires: []
  provides: [get_unidades_disponiveis returns foto_url + foto_signed_url]
  affects: [src/lib/queries-client.js getUnidadesDisponiveis, src/components/features/UnidadesPublicas.js, src/components/features/UnidadePublicaCard.js, src/components/features/UnidadeDetailSheet.js]
tech_stack:
  added: []
  patterns: [SECURITY DEFINER RPC para gerar signed URLs server-side para anon, storage.sign() dentro de função SQL para contornar ausência de policy SELECT anon em bucket privado]
key_files:
  created:
    - supabase/migrations/20260617000000_public_rpc_foto_signed_url.sql
  modified: []
decisions:
  - storage.sign() via SECURITY DEFINER para gerar signed URLs no RPC (não client-side) porque anon não tem policy SELECT em storage.objects do bucket privado unidades-fotos
  - CASE em SQL: NULL para foto_url NULL; foto_url direto para paths '/%' (assets públicos); storage.sign() para paths Storage com TTL 3600s
metrics:
  duration: "~49s"
  completed: "2026-06-17"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 24 Plan 01: RPC get_unidades_disponiveis com foto_url + foto_signed_url Summary

**One-liner:** Migration CREATE OR REPLACE de get_unidades_disponiveis() adicionando foto_url e foto_signed_url via storage.sign() SECURITY DEFINER para resolver signed URLs em contexto anon.

## What Was Built

Task 1 criou a migration SQL `20260617000000_public_rpc_foto_signed_url.sql` que faz CREATE OR REPLACE da RPC `get_unidades_disponiveis()` expandindo o RETURNS TABLE de 9 para 11 colunas: mantém as 9 colunas originais e adiciona `foto_url text` e `foto_signed_url text`.

O campo `foto_signed_url` é gerado via expressão CASE dentro da função SECURITY DEFINER (executa como postgres):
- `foto_url IS NULL` → NULL
- `foto_url LIKE '/%'` → retorna foto_url diretamente (assets públicos como `/Detalhe_Arquitetonico.png`)
- ELSE → `(storage.sign('unidades-fotos', u.foto_url, 3600)).signedURL` (URLs assinadas com TTL 3600s)

**Por que SECURITY DEFINER?** O bucket `unidades-fotos` é privado e a única policy SELECT em `storage.objects` é `TO authenticated`. Não existe policy `TO anon`. O cliente anon não pode chamar `createSignedUrl`. A assinatura deve ocorrer dentro do RPC que executa como postgres.

## Task Commits

| Task | Nome | Commit | Arquivos |
|------|------|--------|----------|
| 1 | Criar migration CREATE OR REPLACE da RPC com foto_url + foto_signed_url | 0a85515 | supabase/migrations/20260617000000_public_rpc_foto_signed_url.sql |
| 2 | Checkpoint — aplicar migration e verificar storage.sign() | (bloqueado — aguarda verificação humana) | — |

## Deviations from Plan

None — Task 1 executada exatamente conforme especificado no plano.

## Resultado do storage.sign()

**PENDENTE — aguarda checkpoint humano (Task 2).**

A disponibilidade de `storage.sign()` dentro de funções SQL SECURITY DEFINER no Supabase está marcada como [ASSUMED] no RESEARCH.md (Assumption A1). O plano requer verificação manual após `supabase db push` para confirmar se:
- a migration aplica sem erro
- `foto_signed_url` retorna URLs válidas para unidades com foto em Storage
- ou se o fallback (Server Action `resolverFotoUrls` com supabaseAdmin) é necessário

O resultado desta verificação define o escopo do Plano 02.

## Known Stubs

Nenhum — este plano é apenas SQL, sem componentes frontend.

## Threat Flags

Nenhum. A migration não expõe nova superfície: unidades disponíveis já eram públicas, e a signed URL é temporária (TTL 3600s) para um ativo cujo conteúdo (foto da unidade) já estava acessível ao proprietário autenticado.

## Self-Check: PASSED

- [x] `supabase/migrations/20260617000000_public_rpc_foto_signed_url.sql` existe
- [x] Contém `CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis`
- [x] Contém `foto_signed_url`
- [x] Contém `storage.sign`
- [x] Contém `GRANT EXECUTE ON FUNCTION public.get_unidades_disponiveis() TO anon, authenticated`
- [x] Commit 0a85515 existe em `git log`

---
phase: 17-funda-o-tokens-mobile-modal-fixes-infra
plan: "03"
subsystem: infrastructure
tags: [migration, storage, rls, security, next-config]
dependency_graph:
  requires: []
  provides: [unidades.foto_url, proprietarios.nome, proprietarios.sobrenome, proprietarios.telefone, storage-bucket-unidades-fotos, storage-rls-ownership-chain, next-image-supabase-host]
  affects: [supabase/migrations, next.config.mjs]
tech_stack:
  added: []
  patterns: [SECURITY DEFINER function, storage.foldername ownership chain, remotePatterns no-search-key]
key_files:
  created:
    - supabase/migrations/20260601000000_v15_foundation.sql
  modified:
    - next.config.mjs
decisions:
  - "Private bucket (public=false) enforced via RLS ownership chain rather than bucket-level public access"
  - "search key omitted from remotePatterns to allow signed URL ?token= query params"
  - "DROP POLICY IF EXISTS guards added before each CREATE POLICY for idempotent re-runs"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-13"
  tasks_completed: 3
  files_changed: 2
---

# Phase 17 Plan 03: v15 Foundation — Schema + Storage + Config Summary

**One-liner:** Private Storage bucket `unidades-fotos` with SECURITY DEFINER ownership-chain RLS applied to remote, plus `proprietarios.nome/sobrenome/telefone` and `unidades.foto_url` columns and `next/image` remotePatterns for signed Supabase Storage URLs.

---

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Write 20260601000000_v15_foundation.sql migration | c9cad75 |
| 2 | Add images.remotePatterns to next.config.mjs | 188d194 |
| 3 | [BLOCKING] Apply migration to remote vfymttcajeyhrmsyhrtj | 69465a4 |

---

## What Was Built

### Migration: `supabase/migrations/20260601000000_v15_foundation.sql`

Schema additions (idempotent `ADD COLUMN IF NOT EXISTS`):
- `public.proprietarios`: `nome TEXT`, `sobrenome TEXT`, `telefone TEXT` (all nullable)
- `public.unidades`: `foto_url TEXT` (nullable)

Storage bucket:
- `unidades-fotos` inserted into `storage.buckets` with `public = false` (PRIVATE)
- `ON CONFLICT (id) DO NOTHING` for idempotent re-runs

RLS helper function:
- `public.storage_unidade_owned_by_auth(obj_name TEXT) RETURNS BOOLEAN`
- `LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, storage`
- Extracts `unidade_id` from `storage.foldername(obj_name)[1]::UUID`
- Joins `unidades → edificios` to get `proprietario_id`, compares to `auth.uid()`
- `EXCEPTION WHEN OTHERS THEN RETURN FALSE` guards malformed UUIDs and missing rows
- `REVOKE EXECUTE FROM anon` / `GRANT EXECUTE TO authenticated`

Three RLS policies on `storage.objects` (each with `DROP POLICY IF EXISTS` guard):
- `unidades_fotos_insert_proprietario` (FOR INSERT WITH CHECK)
- `unidades_fotos_select_proprietario` (FOR SELECT USING)
- `unidades_fotos_delete_proprietario` (FOR DELETE USING)
- All gated on `bucket_id = 'unidades-fotos' AND public.storage_unidade_owned_by_auth(storage.objects.name)`

Table grants:
- `GRANT ALL ON public.proprietarios TO service_role, authenticated`
- `GRANT ALL ON public.unidades TO service_role, authenticated`

### Config: `next.config.mjs`

Added `images.remotePatterns` entry:
- `protocol: 'https'`
- `hostname: 'vfymttcajeyhrmsyhrtj.supabase.co'`
- `port: ''`
- `pathname: '/storage/v1/object/**'` (covers both `/public/` and `/sign/` paths)
- `search` key **omitted** — allows any query params including signed URL `?token=`
- `reactCompiler: true` retained
- `npm run build` exits 0

### Remote Apply

- `supabase db push` applied both `20260524000000` and `20260601000000` to project `vfymttcajeyhrmsyhrtj`
- `supabase migration list` confirms `20260601000000` applied on remote
- REST verification: `proprietarios.nome/sobrenome/telefone` and `unidades.foto_url` columns accessible
- Storage API verification: `unidades-fotos` bucket exists with `public: false`

---

## Deviations from Plan

None — plan executed exactly as written. The `DROP POLICY IF EXISTS` notices in db push output ("policy does not exist, skipping") are expected behavior for first-run of new policies.

---

## Threat Mitigations Applied

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-17-01 | Information Disclosure (IDOR SELECT) | SELECT policy requires ownership-chain check; bucket PRIVATE |
| T-17-02 | Tampering (cross-proprietário upload) | INSERT WITH CHECK calls ownership-chain function |
| T-17-03 | Tampering (path injection) | uuid cast guarded by EXCEPTION WHEN OTHERS THEN RETURN FALSE |
| T-17-04 | Elevation of Privilege (search-path injection) | SET search_path = public, storage pinned on SECURITY DEFINER function |

---

## Known Stubs

None. This plan is pure infrastructure (migration + config). No UI components or data-wiring stubs.

---

## Threat Flags

None. No new network endpoints or trust boundaries introduced beyond what is documented in the plan's threat model.

---

## Self-Check

- [x] `supabase/migrations/20260601000000_v15_foundation.sql` exists
- [x] `next.config.mjs` contains `remotePatterns`
- [x] Commits c9cad75, 188d194, 69465a4 exist in git log
- [x] Remote: `proprietarios.nome/sobrenome/telefone` columns confirmed
- [x] Remote: `unidades.foto_url` column confirmed
- [x] Remote: `unidades-fotos` bucket with `public: false` confirmed
- [x] `npm run build` exits 0

## Self-Check: PASSED

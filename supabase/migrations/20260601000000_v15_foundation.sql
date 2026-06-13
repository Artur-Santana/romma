-- supabase/migrations/20260601000000_v15_foundation.sql
-- Phase 17 foundation: schema additions + Storage bucket + RLS
-- Idempotent: ADD COLUMN IF NOT EXISTS, OR REPLACE, ON CONFLICT DO NOTHING, DROP POLICY IF EXISTS

-- ── Schema additions ──────────────────────────────────────────────────────
ALTER TABLE public.proprietarios
  ADD COLUMN IF NOT EXISTS nome      TEXT,
  ADD COLUMN IF NOT EXISTS sobrenome TEXT,
  ADD COLUMN IF NOT EXISTS telefone  TEXT;

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ── Storage bucket (private) ──────────────────────────────────────────────
-- public = false → private bucket; access only via signed URLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('unidades-fotos', 'unidades-fotos', false)
ON CONFLICT (id) DO NOTHING;

-- ── RLS helper function ────────────────────────────────────────────────────
-- SECURITY DEFINER pattern from: 20260518000000_proprietarios_rls.sql lines 16-24
-- Joins storage path → unidade → edificio → proprietario_id; avoids recursive RLS.
-- File path convention: {unidade_id}/{filename}  e.g. "abc-uuid/foto.jpg"
-- storage.foldername(name)[1] = first path segment = unidade_id UUID
-- SET search_path prevents search_path injection (T-17-04)
CREATE OR REPLACE FUNCTION public.storage_unidade_owned_by_auth(obj_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_unidade_id UUID;
  v_prop_id    UUID;
BEGIN
  -- Extract unidade_id from first path segment (T-17-03: uuid cast is guarded by EXCEPTION)
  v_unidade_id := (storage.foldername(obj_name))[1]::UUID;
  -- Verify the authenticated user is the proprietário that owns this unidade
  SELECT e.proprietario_id INTO v_prop_id
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.id = v_unidade_id;
  RETURN v_prop_id = (SELECT auth.uid());
EXCEPTION WHEN OTHERS THEN
  -- Catches malformed UUID, null path segment, or missing row (T-17-03)
  RETURN FALSE;
END;
$$;

-- REVOKE/GRANT pattern from: 20260518000000_proprietarios_rls.sql lines 26-27
REVOKE EXECUTE ON FUNCTION public.storage_unidade_owned_by_auth(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.storage_unidade_owned_by_auth(TEXT) TO authenticated;

-- ── Storage RLS policies ───────────────────────────────────────────────────
-- Policies on storage.objects (not storage.buckets)
-- Policy naming: {bucket_short}_{operation}_{role}
-- Always qualify storage.objects.name to avoid column ambiguity (Pitfall 4 / T-17-01..02)
-- DROP POLICY IF EXISTS guards for idempotent re-runs

DROP POLICY IF EXISTS "unidades_fotos_insert_proprietario" ON storage.objects;
CREATE POLICY "unidades_fotos_insert_proprietario"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'unidades-fotos'
  AND public.storage_unidade_owned_by_auth(storage.objects.name)
);

DROP POLICY IF EXISTS "unidades_fotos_select_proprietario" ON storage.objects;
CREATE POLICY "unidades_fotos_select_proprietario"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'unidades-fotos'
  AND public.storage_unidade_owned_by_auth(storage.objects.name)
);

DROP POLICY IF EXISTS "unidades_fotos_delete_proprietario" ON storage.objects;
CREATE POLICY "unidades_fotos_delete_proprietario"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'unidades-fotos'
  AND public.storage_unidade_owned_by_auth(storage.objects.name)
);

-- Table grants intentionally omitted: proprietarios + unidades already have
-- GRANT ALL TO service_role, authenticated from 20260524000000_grant_table_privileges.sql.
-- Re-granting here was redundant (CR-01). RLS default-deny still gates writes
-- (proprietarios has only a SELECT policy); mutations go through supabaseAdmin (service_role).

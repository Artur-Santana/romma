-- Tabela proprietários (owner check para RLS)
CREATE TABLE IF NOT EXISTS public.proprietarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT proprietarios_usuario_id_unique UNIQUE (usuario_id)
);

ALTER TABLE public.proprietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proprietarios_select_own" ON public.proprietarios
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

-- Função auxiliar: verifica se o usuário autenticado está na tabela proprietarios
-- SECURITY DEFINER necessário para leitura sem loop de RLS
CREATE OR REPLACE FUNCTION public.is_proprietario()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proprietarios WHERE usuario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_proprietario() FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_proprietario() TO authenticated;

-- Dropar todas as policies INSERT/UPDATE/DELETE existentes nas 5 tabelas
-- (usamos bloco dinâmico para não depender dos nomes exatos gerados pelo Supabase)
DO $$
DECLARE
  r RECORD;
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['edificios','unidades','locatarios','contratos','parcelas'])
  LOOP
    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND cmd IN ('INSERT','UPDATE','DELETE')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- ── edificios ──────────────────────────────────────────────────────────────
CREATE POLICY "edificios_insert_proprietario" ON public.edificios
  FOR INSERT TO authenticated WITH CHECK (public.is_proprietario());
CREATE POLICY "edificios_update_proprietario" ON public.edificios
  FOR UPDATE TO authenticated USING (public.is_proprietario());
CREATE POLICY "edificios_delete_proprietario" ON public.edificios
  FOR DELETE TO authenticated USING (public.is_proprietario());

-- ── unidades ───────────────────────────────────────────────────────────────
CREATE POLICY "unidades_insert_proprietario" ON public.unidades
  FOR INSERT TO authenticated WITH CHECK (public.is_proprietario());
CREATE POLICY "unidades_update_proprietario" ON public.unidades
  FOR UPDATE TO authenticated USING (public.is_proprietario());
CREATE POLICY "unidades_delete_proprietario" ON public.unidades
  FOR DELETE TO authenticated USING (public.is_proprietario());

-- ── locatarios ─────────────────────────────────────────────────────────────
CREATE POLICY "locatarios_insert_proprietario" ON public.locatarios
  FOR INSERT TO authenticated WITH CHECK (public.is_proprietario());
CREATE POLICY "locatarios_update_proprietario" ON public.locatarios
  FOR UPDATE TO authenticated USING (public.is_proprietario());
CREATE POLICY "locatarios_delete_proprietario" ON public.locatarios
  FOR DELETE TO authenticated USING (public.is_proprietario());

-- ── contratos ──────────────────────────────────────────────────────────────
CREATE POLICY "contratos_insert_proprietario" ON public.contratos
  FOR INSERT TO authenticated WITH CHECK (public.is_proprietario());
CREATE POLICY "contratos_update_proprietario" ON public.contratos
  FOR UPDATE TO authenticated USING (public.is_proprietario());
CREATE POLICY "contratos_delete_proprietario" ON public.contratos
  FOR DELETE TO authenticated USING (public.is_proprietario());

-- ── parcelas ───────────────────────────────────────────────────────────────
CREATE POLICY "parcelas_insert_proprietario" ON public.parcelas
  FOR INSERT TO authenticated WITH CHECK (public.is_proprietario());
CREATE POLICY "parcelas_update_proprietario" ON public.parcelas
  FOR UPDATE TO authenticated USING (public.is_proprietario());
CREATE POLICY "parcelas_delete_proprietario" ON public.parcelas
  FOR DELETE TO authenticated USING (public.is_proprietario());

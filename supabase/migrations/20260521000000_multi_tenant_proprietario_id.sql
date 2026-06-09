-- Migration: multi-tenant isolamento por proprietario_id
-- Adiciona coluna proprietario_id em edificios e locatarios,
-- popula rows existentes com o Proprietário de seed, aplica NOT NULL,
-- cria funções auxiliares para checks cross-table sem recursão,
-- dropa as 20 policies antigas e cria as 23 novas policies isoladas.
-- Tudo em uma única transação atômica.

BEGIN;

-- ============================================================
-- PASSO 1: Adicionar colunas proprietario_id nullable
-- ============================================================

ALTER TABLE public.edificios
  ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id);

ALTER TABLE public.locatarios
  ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id);

-- ============================================================
-- PASSO 2: Popular rows existentes com o Proprietário de seed
-- (primeiro criado por data, deterministicamente)
-- ============================================================

UPDATE public.edificios
SET proprietario_id = (
  SELECT usuario_id FROM public.proprietarios ORDER BY created_at ASC LIMIT 1
)
WHERE proprietario_id IS NULL;

UPDATE public.locatarios
SET proprietario_id = (
  SELECT usuario_id FROM public.proprietarios ORDER BY created_at ASC LIMIT 1
)
WHERE proprietario_id IS NULL;

-- ============================================================
-- PASSO 3: Aplicar NOT NULL (falha atomicamente se algum NULL)
-- ============================================================

ALTER TABLE public.edificios
  ALTER COLUMN proprietario_id SET NOT NULL;

ALTER TABLE public.locatarios
  ALTER COLUMN proprietario_id SET NOT NULL;

-- ============================================================
-- PASSO 4A: Criar funções auxiliares (cada uma com SET search_path + isolamento de RLS)
-- (evitam recursão de RLS em checks cross-table)
-- ============================================================

-- Verifica se o edifício pertence ao usuário autenticado
-- Usado por: unidades INSERT/UPDATE/DELETE e unidades_select_proprietario
CREATE OR REPLACE FUNCTION public.is_unidade_owner(p_edificio_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edificios e
    WHERE e.id = p_edificio_id AND e.proprietario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_unidade_owner(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_unidade_owner(uuid) TO authenticated;

-- Verifica se a unidade tem contrato ativo do Locatário autenticado
-- Usado por: unidades_select_proprietario (branch portal Locatário)
CREATE OR REPLACE FUNCTION public.is_unidade_do_locatario(p_unidade_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contratos c
    JOIN locatarios l ON l.id = c.locatario_id
    WHERE c.unidade_id = p_unidade_id AND l.usuario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_unidade_do_locatario(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_unidade_do_locatario(uuid) TO authenticated;

-- Verifica se a unidade (via edificio) pertence ao Proprietário autenticado
-- Usado por: contratos SELECT/INSERT/UPDATE/DELETE (branch Proprietário)
CREATE OR REPLACE FUNCTION public.is_contrato_owner(p_unidade_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM unidades u
    JOIN edificios e ON e.id = u.edificio_id
    WHERE u.id = p_unidade_id AND e.proprietario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_contrato_owner(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_contrato_owner(uuid) TO authenticated;

-- Verifica se o locatário do contrato é o usuário autenticado
-- Usado por: contratos_select_proprietario (branch portal Locatário)
CREATE OR REPLACE FUNCTION public.is_contrato_do_locatario(p_locatario_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM locatarios l
    WHERE l.id = p_locatario_id AND l.usuario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_contrato_do_locatario(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_contrato_do_locatario(uuid) TO authenticated;

-- Verifica se o contrato (via unidade → edificio) pertence ao Proprietário autenticado
-- Usado por: parcelas SELECT/INSERT/UPDATE/DELETE (branch Proprietário)
CREATE OR REPLACE FUNCTION public.is_parcela_owner(p_contrato_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contratos c
    JOIN unidades u ON u.id = c.unidade_id
    JOIN edificios e ON e.id = u.edificio_id
    WHERE c.id = p_contrato_id AND e.proprietario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_parcela_owner(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_parcela_owner(uuid) TO authenticated;

-- Verifica se o contrato da parcela tem Locatário que é o usuário autenticado
-- Usado por: parcelas_select_proprietario (branch portal Locatário)
CREATE OR REPLACE FUNCTION public.is_parcela_do_locatario(p_contrato_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contratos c
    JOIN locatarios l ON l.id = c.locatario_id
    WHERE c.id = p_contrato_id AND l.usuario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_parcela_do_locatario(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_parcela_do_locatario(uuid) TO authenticated;

-- ============================================================
-- PASSO 4B: Dropar TODAS as policies existentes nas 5 tabelas
-- (SELECT, INSERT, UPDATE, DELETE — sem filtro de cmd)
-- ============================================================

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
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- PASSO 4C: Criar as 23 novas policies multi-tenant
-- ============================================================

-- ── edificios (4 proprietário + 1 anon = 5 policies) ────────

-- Proprietário: acesso direto via proprietario_id (sem cross-table, sem recursão)
CREATE POLICY "edificios_select_proprietario" ON public.edificios
  FOR SELECT TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "edificios_insert_proprietario" ON public.edificios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = proprietario_id);

CREATE POLICY "edificios_update_proprietario" ON public.edificios
  FOR UPDATE TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "edificios_delete_proprietario" ON public.edificios
  FOR DELETE TO authenticated USING (auth.uid() = proprietario_id);

-- Anon: edifícios precisam ser visíveis na página pública /unidades
-- (getUnidadesDisponiveis embute edificios(nome) via JOIN)
-- NOTA: a policy unidades_select_public (anon) é só status='disponivel' sem back-ref a edificios
-- → sem ciclo de recursão
CREATE POLICY "edificios_select_public" ON public.edificios
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.unidades u
      WHERE u.edificio_id = id AND u.status = 'disponivel'
    )
  );

-- ── unidades (1 anon + 4 autenticado = 5 policies) ──────────

-- Anon: apenas unidades disponíveis (página pública /unidades)
-- Sem cross-table, sem recursão
CREATE POLICY "unidades_select_public" ON public.unidades
  FOR SELECT TO anon USING (status = 'disponivel');

-- Autenticado SELECT: Proprietário vê suas unidades; Locatário vê a unidade do seu contrato
-- is_unidade_owner e is_unidade_do_locatario usam funções isoladas → sem recursão
CREATE POLICY "unidades_select_proprietario" ON public.unidades
  FOR SELECT TO authenticated USING (
    public.is_unidade_owner(edificio_id) OR public.is_unidade_do_locatario(id)
  );

CREATE POLICY "unidades_insert_proprietario" ON public.unidades
  FOR INSERT TO authenticated WITH CHECK (public.is_unidade_owner(edificio_id));

CREATE POLICY "unidades_update_proprietario" ON public.unidades
  FOR UPDATE TO authenticated USING (public.is_unidade_owner(edificio_id));

CREATE POLICY "unidades_delete_proprietario" ON public.unidades
  FOR DELETE TO authenticated USING (public.is_unidade_owner(edificio_id));

-- ── locatarios (5 policies) ──────────────────────────────────

-- Proprietário: acesso direto via proprietario_id (sem cross-table)
CREATE POLICY "locatarios_select_proprietario" ON public.locatarios
  FOR SELECT TO authenticated USING (auth.uid() = proprietario_id);

-- Locatário lê seu próprio registro (portal: getLocatarioByUserId)
CREATE POLICY "locatarios_select_proprio" ON public.locatarios
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY "locatarios_insert_proprietario" ON public.locatarios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = proprietario_id);

CREATE POLICY "locatarios_update_proprietario" ON public.locatarios
  FOR UPDATE TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "locatarios_delete_proprietario" ON public.locatarios
  FOR DELETE TO authenticated USING (auth.uid() = proprietario_id);

-- ── contratos (4 policies) ───────────────────────────────────

-- SELECT: Proprietário (via is_contrato_owner) OU Locatário (via is_contrato_do_locatario)
-- Ambas funções são isoladas → sem recursão RLS
CREATE POLICY "contratos_select_proprietario" ON public.contratos
  FOR SELECT TO authenticated USING (
    public.is_contrato_owner(unidade_id) OR public.is_contrato_do_locatario(locatario_id)
  );

CREATE POLICY "contratos_insert_proprietario" ON public.contratos
  FOR INSERT TO authenticated WITH CHECK (public.is_contrato_owner(unidade_id));

CREATE POLICY "contratos_update_proprietario" ON public.contratos
  FOR UPDATE TO authenticated USING (public.is_contrato_owner(unidade_id));

CREATE POLICY "contratos_delete_proprietario" ON public.contratos
  FOR DELETE TO authenticated USING (public.is_contrato_owner(unidade_id));

-- ── parcelas (4 policies) ────────────────────────────────────

-- SELECT: Proprietário (via is_parcela_owner) OU Locatário (via is_parcela_do_locatario)
-- Ambas funções são isoladas → sem recursão RLS
CREATE POLICY "parcelas_select_proprietario" ON public.parcelas
  FOR SELECT TO authenticated USING (
    public.is_parcela_owner(contrato_id) OR public.is_parcela_do_locatario(contrato_id)
  );

CREATE POLICY "parcelas_insert_proprietario" ON public.parcelas
  FOR INSERT TO authenticated WITH CHECK (public.is_parcela_owner(contrato_id));

CREATE POLICY "parcelas_update_proprietario" ON public.parcelas
  FOR UPDATE TO authenticated USING (public.is_parcela_owner(contrato_id));

CREATE POLICY "parcelas_delete_proprietario" ON public.parcelas
  FOR DELETE TO authenticated USING (public.is_parcela_owner(contrato_id));

COMMIT;

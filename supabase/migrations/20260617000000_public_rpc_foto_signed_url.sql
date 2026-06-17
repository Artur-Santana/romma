-- Migration: adiciona foto_url ao RETURNS TABLE de get_unidades_disponiveis() e abre
-- policy SELECT para anon no bucket unidades-fotos (geração de signed URL no client).
--
-- Contexto:
-- (1) A coluna foto_url foi adicionada à tabela unidades em 20260601000000_v15_foundation.sql
--     (Phase 17), mas a RPC get_unidades_disponiveis() foi definida em
--     20260523000000_fix_unidades_select_public_rpc.sql com apenas 9 colunas, sem foto_url.
--     Cards públicos recebiam foto_url = undefined.
--
-- (2) storage.sign() não existe como função SQL nativa do Supabase/PostgreSQL.
--     A geração de signed URLs ocorre no client via JS SDK.
--     Para anon poder chamar createSignedUrl(), precisa de SELECT policy em storage.objects
--     para o bucket 'unidades-fotos'. O bucket permanece PRIVATE (objetos não acessíveis
--     sem token válido) — apenas a geração de signed URLs é liberada para anon.
--
-- (3) TTL das signed URLs: 3600 segundos (gerenciado no client em UnidadesPublicas.js).
--
-- DROP obrigatório: CREATE OR REPLACE não permite mudar RETURNS TABLE (SQLSTATE 42P13).
DROP FUNCTION IF EXISTS public.get_unidades_disponiveis();

CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis()
RETURNS TABLE (
  id              uuid,
  edificio_id     uuid,
  nome            text,
  descricao       text,
  area_m2         numeric,
  valor_mensal    numeric,
  valor_visivel   boolean,
  status          text,
  edificio_nome   text,
  foto_url        text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.edificio_id,
    u.nome,
    u.descricao,
    u.area_m2,
    u.valor_mensal,
    u.valor_visivel,
    u.status::text,
    e.nome AS edificio_nome,
    u.foto_url
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.status = 'disponivel'
  ORDER BY e.nome, u.nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_unidades_disponiveis() TO anon, authenticated;

-- Policy: permite que anon gere signed URLs para objetos do bucket unidades-fotos.
-- Bucket permanece PRIVATE: objetos só acessíveis via signed URL com token válido.
-- Sem esta policy, createSignedUrl() falha silenciosamente para usuários não autenticados.
DROP POLICY IF EXISTS "anon_signed_url_unidades_fotos" ON storage.objects;
CREATE POLICY "anon_signed_url_unidades_fotos"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'unidades-fotos');

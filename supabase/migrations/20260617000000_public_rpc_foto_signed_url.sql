-- Migration: adiciona foto_url + foto_signed_url ao RETURNS TABLE de get_unidades_disponiveis().
--
-- Contexto:
-- (1) A coluna foto_url foi adicionada à tabela unidades em 20260601000000_v15_foundation.sql
--     (Phase 17), mas a RPC get_unidades_disponiveis() foi definida na migration anterior
--     (20260523000000_fix_unidades_select_public_rpc.sql) com apenas 9 colunas, sem foto_url.
--     Cards públicos recebiam foto_url = undefined em todos os resultados.
--
-- (2) O bucket 'unidades-fotos' é PRIVATE (public = false). A única policy SELECT em
--     storage.objects para esse bucket é TO authenticated (função storage_unidade_owned_by_auth).
--     Não existe policy SELECT TO anon. Portanto, o cliente anon NÃO pode chamar createSignedUrl.
--     A assinatura das URLs precisa ocorrer dentro desta RPC SECURITY DEFINER (executa como
--     postgres, que tem acesso pleno ao storage), usando storage.sign().
--
-- (3) TTL das signed URLs: 3600 segundos (1 hora).
--
-- Lógica do CASE para foto_signed_url:
--   - foto_url IS NULL             → NULL (sem foto)
--   - foto_url LIKE '/%'           → foto_url direto (asset público: /Detalhe_Arquitetonico.png, /images/*)
--   - ELSE                         → (storage.sign('unidades-fotos', foto_url, 3600)).signedURL

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
  foto_url        text,
  foto_signed_url text
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
    u.foto_url,
    CASE
      WHEN u.foto_url IS NULL THEN NULL
      WHEN u.foto_url LIKE '/%' THEN u.foto_url
      ELSE (storage.sign('unidades-fotos', u.foto_url, 3600)).signedURL
    END AS foto_signed_url
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.status = 'disponivel'
  ORDER BY e.nome, u.nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_unidades_disponiveis() TO anon, authenticated;

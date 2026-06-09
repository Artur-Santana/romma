-- Fix: expor unidades disponíveis e edifícios para qualquer role (anon OU authenticated)
-- via RPCs SECURITY DEFINER, contornando o RLS da tabela.
--
-- Contexto: as policies "unidades_select_public" e "edificios_select_public" são
-- TO anon, então quando um usuário autenticado (ex: Proprietário B recém criado
-- sem dados) visita /unidades, o RLS aplica as policies "authenticated" que
-- retornam vazio para quem não tem edifícios nem contratos.
-- A página pública deve exibir as unidades disponíveis independentemente de
-- quem está autenticado.
--
-- Solução: funções SECURITY DEFINER com SET search_path = public que executam
-- com os privilégios do owner (postgres), contornando RLS. Acessíveis a
-- qualquer role via GRANT EXECUTE TO public.
--
-- As funções não expõem dados sensíveis — apenas colunas públicas de unidades
-- com status='disponivel' e os edifícios correspondentes.

-- Retorna todas as unidades com status='disponivel' com o nome do edifício.
-- Usada pela página pública /unidades.
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
  edificio_nome   text
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
    e.nome AS edificio_nome
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.status = 'disponivel'
  ORDER BY e.nome, u.nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_unidades_disponiveis() TO anon, authenticated;

-- Retorna os edifícios que têm pelo menos uma unidade disponível.
-- Usada pela página pública /unidades para construir as abas de filtro por edifício.
CREATE OR REPLACE FUNCTION public.get_edificios_publicos()
RETURNS TABLE (
  id       uuid,
  nome     text,
  endereco text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT e.id, e.nome, e.endereco
  FROM public.edificios e
  WHERE EXISTS (
    SELECT 1 FROM public.unidades u
    WHERE u.edificio_id = e.id AND u.status = 'disponivel'
  )
  ORDER BY e.nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_edificios_publicos() TO anon, authenticated;

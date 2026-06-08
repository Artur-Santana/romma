-- Migration: enforce single-row invariant on public.proprietarios (CR-02)
--
-- Sem esta constraint, duas confirmações de signup concorrentes podem ambas
-- ler count === 0 e inserir rows distintas (usuario_id diferente), contornando
-- a lógica de guard em tentarRegistrarProprietario e criando dois Proprietários.
--
-- A técnica ((true)) cria um índice único sobre a expressão constante TRUE,
-- garantindo que só uma row pode existir na tabela ao mesmo tempo.
--
-- ATENÇÃO: Esta migration falha se a tabela proprietarios já contiver mais de
-- uma row no momento do apply. Verificar antes de executar em produção:
--   SELECT COUNT(*) FROM public.proprietarios;
-- Deve retornar 0 ou 1. Se retornar > 1, remover as rows duplicadas primeiro.

CREATE UNIQUE INDEX IF NOT EXISTS proprietarios_single_row
  ON public.proprietarios ((true));

-- Schema base: criado a partir do remote (tabelas criadas via Supabase Studio)
-- Esta migration garante que o ambiente local tenha as tabelas antes das migrations seguintes.

-- ENUMs
CREATE TYPE public.status_contrato AS ENUM ('ativo', 'encerrado', 'cancelado');
CREATE TYPE public.status_parcela  AS ENUM ('futura', 'pendente', 'paga', 'vencida');

-- edificios
CREATE TABLE IF NOT EXISTS public.edificios (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL,
  endereco   text        NOT NULL,
  created_at timestamp   DEFAULT now()
);
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edificios_select_all" ON public.edificios FOR SELECT USING (true);

-- unidades
CREATE TABLE IF NOT EXISTS public.unidades (
  id             uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  edificio_id    uuid      NOT NULL REFERENCES public.edificios(id) ON DELETE CASCADE,
  nome           text      NOT NULL,
  descricao      text,
  area_m2        numeric,
  valor_mensal   numeric,
  valor_visivel  boolean   DEFAULT true,
  status         text      DEFAULT 'disponivel',
  created_at     timestamp DEFAULT now()
);
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unidades_select_all" ON public.unidades FOR SELECT USING (true);

-- locatarios
CREATE TABLE IF NOT EXISTS public.locatarios (
  id                uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        uuid   REFERENCES auth.users(id),
  nome_razao_social text   NOT NULL,
  tipo              text   NOT NULL CHECK (tipo = ANY (ARRAY['pf','pj'])),
  documento         text   NOT NULL,
  email             text   NOT NULL,
  telefone          text,
  created_at        timestamp DEFAULT now()
);
ALTER TABLE public.locatarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locatarios_select_auth" ON public.locatarios FOR SELECT TO authenticated USING (true);

-- contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id           uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id   uuid              NOT NULL REFERENCES public.unidades(id),
  locatario_id uuid              NOT NULL REFERENCES public.locatarios(id),
  data_inicio  date              NOT NULL,
  data_fim     date              NOT NULL,
  status       public.status_contrato NOT NULL DEFAULT 'ativo',
  observacoes  text,
  created_at   timestamptz       DEFAULT now()
);
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_select_auth" ON public.contratos FOR SELECT TO authenticated USING (true);

-- Constraint: no máx 1 contrato ativo por unidade
CREATE UNIQUE INDEX IF NOT EXISTS contratos_unidade_ativo_unique
  ON public.contratos (unidade_id)
  WHERE status = 'ativo';

-- parcelas
CREATE TABLE IF NOT EXISTS public.parcelas (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id      uuid    NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  numero           integer NOT NULL,
  data_fechamento  date    NOT NULL,
  data_vencimento  date    NOT NULL,
  data_pagamento   date,
  status           public.status_parcela NOT NULL DEFAULT 'futura',
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parcelas_select_auth" ON public.parcelas FOR SELECT TO authenticated USING (true);

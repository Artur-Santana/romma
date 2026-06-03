CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Transição de status de parcelas (roda 06:00 UTC diariamente)
SELECT cron.schedule(
  'atualizar-status-parcelas',
  '0 6 * * *',
  $$
  UPDATE parcelas
  SET status = CASE
    WHEN status = 'futura'   AND data_fechamento <= CURRENT_DATE THEN 'pendente'
    WHEN status = 'pendente' AND data_vencimento  < CURRENT_DATE THEN 'vencida'
    ELSE status
  END
  WHERE status IN ('futura', 'pendente');
  $$
);

-- Auto-encerramento de contratos vencidos (mesma janela, após parcelas)
SELECT cron.schedule(
  'encerrar-contratos-vencidos',
  '5 6 * * *',
  $$
  UPDATE unidades u
  SET status = 'disponivel'
  FROM contratos c
  WHERE c.unidade_id = u.id
    AND c.status = 'ativo'
    AND c.data_fim < CURRENT_DATE;

  UPDATE contratos
  SET status = 'encerrado'
  WHERE status = 'ativo'
    AND data_fim < CURRENT_DATE;
  $$
);

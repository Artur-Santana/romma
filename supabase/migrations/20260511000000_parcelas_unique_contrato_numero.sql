CREATE UNIQUE INDEX IF NOT EXISTS parcelas_contrato_numero_unique
  ON parcelas (contrato_id, numero);

ALTER TABLE public.locatarios
  ADD COLUMN IF NOT EXISTS status_convite text NOT NULL DEFAULT 'pendente'
  CHECK (status_convite IN ('pendente', 'aceito'));

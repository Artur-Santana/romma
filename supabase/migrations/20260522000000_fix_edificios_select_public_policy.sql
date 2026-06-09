-- Fix: corrigir a policy edificios_select_public que tinha ambiguidade de coluna.
-- Na migration 20260521000000, a subquery usava `WHERE u.edificio_id = id`
-- onde o `id` não qualificado resolvia para `u.id` (unidades.id pelo alias),
-- não para `edificios.id`. Isso fazia EXISTS sempre false → anon via 0 edificios
-- e o JOIN `unidades(...edificios(nome)...)` retornava NULL em /unidades.
--
-- Fix: qualificar explicitamente como public.edificios.id.

ALTER POLICY "edificios_select_public" ON public.edificios
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    WHERE u.edificio_id = public.edificios.id AND u.status = 'disponivel'
  )
);

-- Explicit table-level grants for all roles.
-- Supabase hosted sets these up automatically; local Docker may not in newer CLI versions.
-- Without these, service_role gets 42501 even though it has BYPASSRLS.

GRANT ALL ON public.edificios    TO service_role, authenticated;
GRANT ALL ON public.locatarios   TO service_role, authenticated;
GRANT ALL ON public.unidades     TO service_role, authenticated;
GRANT ALL ON public.contratos    TO service_role, authenticated;
GRANT ALL ON public.parcelas     TO service_role, authenticated;
GRANT ALL ON public.proprietarios TO service_role, authenticated;

GRANT SELECT ON public.edificios  TO anon;
GRANT SELECT ON public.unidades   TO anon;

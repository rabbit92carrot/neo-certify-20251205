-- ============================================================================
-- Security Enhancement: Fix virtual_codes INSERT policy
-- Only service_role can insert virtual codes (through triggers)
-- ============================================================================

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "virtual_codes_insert" ON public.virtual_codes';
  EXECUTE 'CREATE POLICY "virtual_codes_insert_service_only" ON public.virtual_codes FOR INSERT WITH CHECK ((SELECT auth.role()) = ''service_role'')';
END
$$;

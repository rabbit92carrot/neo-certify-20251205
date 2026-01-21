-- ============================================================================
-- Security Enhancement: Fix other INSERT policies
-- ============================================================================

DO $$
BEGIN
  -- histories 테이블: 직접 INSERT는 service_role만
  EXECUTE 'DROP POLICY IF EXISTS "histories_insert" ON public.histories';
  EXECUTE 'CREATE POLICY "histories_insert_service_only" ON public.histories FOR INSERT WITH CHECK ((SELECT auth.role()) = ''service_role'')';

  -- inactive_product_usage_logs: authenticated만 허용
  EXECUTE 'DROP POLICY IF EXISTS "inactive_usage_logs_insert" ON public.inactive_product_usage_logs';
  EXECUTE 'CREATE POLICY "inactive_usage_logs_insert_authenticated" ON public.inactive_product_usage_logs FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL)';

  -- organization_alerts: service_role 또는 admin만
  EXECUTE 'DROP POLICY IF EXISTS "organization_alerts_insert" ON public.organization_alerts';
  EXECUTE 'CREATE POLICY "organization_alerts_insert_service_or_admin" ON public.organization_alerts FOR INSERT WITH CHECK ((SELECT auth.role()) = ''service_role'' OR public.is_admin())';
END
$$;

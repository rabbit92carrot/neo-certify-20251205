-- ============================================================================
-- Security Enhancement: Restrict Anonymous Access - PART 1: Tables
-- ============================================================================

-- 민감한 테이블에서 anon 권한 제거
REVOKE ALL ON TABLE public.app_settings FROM anon;
REVOKE ALL ON TABLE public.histories FROM anon;
REVOKE ALL ON TABLE public.inactive_product_usage_logs FROM anon;
REVOKE ALL ON TABLE public.lots FROM anon;
REVOKE ALL ON TABLE public.manufacturer_settings FROM anon;
REVOKE ALL ON TABLE public.notification_messages FROM anon;
REVOKE ALL ON TABLE public.organization_alerts FROM anon;
REVOKE ALL ON TABLE public.patients FROM anon;
REVOKE ALL ON TABLE public.products FROM anon;
REVOKE ALL ON TABLE public.shipment_batches FROM anon;
REVOKE ALL ON TABLE public.shipment_details FROM anon;
REVOKE ALL ON TABLE public.treatment_details FROM anon;
REVOKE ALL ON TABLE public.treatment_records FROM anon;
REVOKE ALL ON TABLE public.virtual_code_verification_logs FROM anon;
REVOKE ALL ON TABLE public.virtual_codes FROM anon;
REVOKE ALL ON TABLE public.disposal_records FROM anon;
REVOKE ALL ON TABLE public.hospital_known_patients FROM anon;
REVOKE ALL ON TABLE public.hospital_known_products FROM anon;
REVOKE ALL ON TABLE public.organizations FROM anon;

-- ============================================================================
-- Security Enhancement: Restrict Anonymous Access - PART 2: Functions
-- Revoke all function privileges from anon role in public schema
-- ============================================================================

-- public 스키마의 모든 함수에서 anon 권한 제거
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon;

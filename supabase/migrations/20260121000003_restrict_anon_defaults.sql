-- ============================================================================
-- Security Enhancement: Restrict Anonymous Access - PART 3: Default Privileges
-- Ensure future objects in public schema don't grant permissions to anon
-- ============================================================================

DO $$
BEGIN
  -- 향후 생성되는 테이블에 대한 anon 기본 권한 제거
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
  -- 향후 생성되는 함수에 대한 anon 기본 권한 제거
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon';
  -- 향후 생성되는 시퀀스에 대한 anon 기본 권한 제거
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon';
END
$$;

-- Migration: 20251218150002_hmac_grants
-- Description: HMAC 관련 함수 권한 부여
--
-- 이 마이그레이션은 20251218150001_hmac_treatment_atomic.sql 이후에 실행되어야 함

-- ============================================================================
-- Step 11: 권한 설정
-- ============================================================================
GRANT EXECUTE ON FUNCTION generate_virtual_code_v2() TO authenticated;

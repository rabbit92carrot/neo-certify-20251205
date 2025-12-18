-- Migration: 20251218100003_hmac_grants_verify
-- Description: verify_virtual_code 함수 권한 부여

GRANT EXECUTE ON FUNCTION verify_virtual_code(VARCHAR) TO authenticated;

-- Migration: 20251218100004_hmac_grants_treatment
-- Description: create_treatment_atomic 함수 권한 부여

GRANT EXECUTE ON FUNCTION create_treatment_atomic(UUID, VARCHAR, DATE, JSONB) TO authenticated;

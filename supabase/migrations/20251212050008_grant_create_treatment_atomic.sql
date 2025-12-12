-- Migration: 20251212050008_grant_create_treatment_atomic
-- Description: Grant permission on create_treatment_atomic function

GRANT EXECUTE ON FUNCTION create_treatment_atomic(UUID, VARCHAR, DATE, JSONB) TO authenticated;

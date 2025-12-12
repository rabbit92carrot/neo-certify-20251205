-- Migration: 20251212063408_grant_secured_create_treatment
-- Description: Grant for secured create_treatment_atomic (new signature)

GRANT EXECUTE ON FUNCTION create_treatment_atomic(VARCHAR, DATE, JSONB) TO authenticated;

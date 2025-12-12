-- Migration: 20251212063309_regrant_create_treatment_atomic
-- Description: Re-grant after SECURITY DEFINER update

GRANT EXECUTE ON FUNCTION create_treatment_atomic(UUID, VARCHAR, DATE, JSONB) TO authenticated;

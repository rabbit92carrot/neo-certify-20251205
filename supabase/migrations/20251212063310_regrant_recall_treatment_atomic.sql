-- Migration: 20251212063310_regrant_recall_treatment_atomic
-- Description: Re-grant after SECURITY DEFINER update

GRANT EXECUTE ON FUNCTION recall_treatment_atomic(UUID, UUID, VARCHAR) TO authenticated;

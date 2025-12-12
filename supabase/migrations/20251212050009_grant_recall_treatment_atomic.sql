-- Migration: 20251212050009_grant_recall_treatment_atomic
-- Description: Grant permission on recall_treatment_atomic function

GRANT EXECUTE ON FUNCTION recall_treatment_atomic(UUID, UUID, VARCHAR) TO authenticated;

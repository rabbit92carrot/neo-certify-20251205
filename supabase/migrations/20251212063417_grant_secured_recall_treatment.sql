-- Migration: 20251212063409_grant_secured_recall_treatment
-- Description: Grant for secured recall_treatment_atomic (new signature)

GRANT EXECUTE ON FUNCTION recall_treatment_atomic(UUID, VARCHAR) TO authenticated;

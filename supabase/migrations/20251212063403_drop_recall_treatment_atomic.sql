-- Migration: 20251212063403_drop_recall_treatment_atomic
-- Description: Drop old function signature before creating secured version

DROP FUNCTION IF EXISTS recall_treatment_atomic(UUID, UUID, VARCHAR);

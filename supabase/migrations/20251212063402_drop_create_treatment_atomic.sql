-- Migration: 20251212063402_drop_create_treatment_atomic
-- Description: Drop old function signature before creating secured version

DROP FUNCTION IF EXISTS create_treatment_atomic(UUID, VARCHAR, DATE, JSONB);

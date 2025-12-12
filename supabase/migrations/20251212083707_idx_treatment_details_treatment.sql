-- Migration: 20251212083707_idx_treatment_details_treatment
-- Description: Index for treatment_details by treatment (for bulk summary)

CREATE INDEX IF NOT EXISTS idx_treatment_details_treatment
ON treatment_details(treatment_id);

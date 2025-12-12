-- Migration: 20251212083711_grant_get_treatment_summaries
-- Description: Grant permission on get_treatment_summaries function

GRANT EXECUTE ON FUNCTION get_treatment_summaries(UUID[]) TO authenticated;

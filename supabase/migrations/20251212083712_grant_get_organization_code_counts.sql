-- Migration: 20251212083712_grant_get_organization_code_counts
-- Description: Grant permission on get_organization_code_counts function

GRANT EXECUTE ON FUNCTION get_organization_code_counts(UUID[]) TO authenticated;

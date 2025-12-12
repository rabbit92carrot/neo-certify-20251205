-- Migration: 20251212050005_grant_get_or_create_patient
-- Description: Grant permission on get_or_create_patient function

GRANT EXECUTE ON FUNCTION get_or_create_patient(VARCHAR) TO authenticated;

-- Migration: 20251212063306_regrant_get_or_create_patient
-- Description: Re-grant after SECURITY DEFINER update

GRANT EXECUTE ON FUNCTION get_or_create_patient(VARCHAR) TO authenticated;

-- Migration: 20251209081002_normalize_phone_number
-- Description: Create normalize_phone_number function

CREATE OR REPLACE FUNCTION normalize_phone_number(phone VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;


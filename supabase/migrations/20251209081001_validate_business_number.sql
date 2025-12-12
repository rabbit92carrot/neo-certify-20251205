-- Migration: 20251209081001_validate_business_number
-- Description: Create validate_business_number function

CREATE OR REPLACE FUNCTION validate_business_number(bn VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN bn ~ '^[0-9]{10}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;


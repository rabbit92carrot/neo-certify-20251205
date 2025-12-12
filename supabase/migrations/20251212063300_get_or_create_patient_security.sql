-- Migration: 20251212063300_get_or_create_patient_security
-- Description: Add SECURITY DEFINER to get_or_create_patient

CREATE OR REPLACE FUNCTION get_or_create_patient(p_phone_number VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_normalized_phone VARCHAR;
BEGIN
  v_normalized_phone := regexp_replace(p_phone_number, '[^0-9]', '', 'g');
  INSERT INTO patients (phone_number)
  VALUES (v_normalized_phone)
  ON CONFLICT (phone_number) DO NOTHING;
  RETURN v_normalized_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

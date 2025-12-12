-- Migration: 20251212050000_get_or_create_patient
-- Description: Atomic patient upsert function

CREATE OR REPLACE FUNCTION get_or_create_patient(p_phone_number VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_normalized_phone VARCHAR;
BEGIN
  -- Normalize phone number
  v_normalized_phone := regexp_replace(p_phone_number, '[^0-9]', '', 'g');

  -- Insert or do nothing on conflict, then return the phone number
  INSERT INTO patients (phone_number)
  VALUES (v_normalized_phone)
  ON CONFLICT (phone_number) DO NOTHING;

  RETURN v_normalized_phone;
END;
$$ LANGUAGE plpgsql;

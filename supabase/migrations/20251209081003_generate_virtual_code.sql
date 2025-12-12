-- Migration: 20251209081003_generate_virtual_code
-- Description: Create generate_virtual_code function

CREATE OR REPLACE FUNCTION generate_virtual_code()
RETURNS VARCHAR AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
  max_attempts INT := 100;
  attempts INT := 0;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase)
    new_code := 'NC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));

    -- Check for duplicates
    SELECT EXISTS(SELECT 1 FROM virtual_codes WHERE code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique virtual code after % attempts', max_attempts;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;


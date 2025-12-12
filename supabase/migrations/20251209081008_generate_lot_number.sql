-- Migration: 20251209081008_generate_lot_number
-- Description: Create generate_lot_number function

CREATE OR REPLACE FUNCTION generate_lot_number(
  p_manufacturer_id UUID,
  p_model_name VARCHAR,
  p_manufacture_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR;
  v_model_digits INT;
  v_date_format VARCHAR;
  v_model_code VARCHAR;
  v_date_str VARCHAR;
BEGIN
  -- Get manufacturer settings
  SELECT lot_prefix, lot_model_digits, lot_date_format
  INTO v_prefix, v_model_digits, v_date_format
  FROM manufacturer_settings
  WHERE organization_id = p_manufacturer_id;

  -- Use defaults if no settings found
  IF NOT FOUND THEN
    v_prefix := 'ND';
    v_model_digits := 5;
    v_date_format := 'yymmdd';
  END IF;

  -- Extract model code (first N characters/digits from model_name)
  v_model_code := LPAD(
    SUBSTRING(REGEXP_REPLACE(p_model_name, '[^0-9A-Za-z]', '', 'g') FROM 1 FOR v_model_digits),
    v_model_digits,
    '0'
  );

  -- Format date
  CASE v_date_format
    WHEN 'yymmdd' THEN
      v_date_str := TO_CHAR(p_manufacture_date, 'YYMMDD');
    WHEN 'yyyymmdd' THEN
      v_date_str := TO_CHAR(p_manufacture_date, 'YYYYMMDD');
    WHEN 'yymm' THEN
      v_date_str := TO_CHAR(p_manufacture_date, 'YYMM');
    ELSE
      v_date_str := TO_CHAR(p_manufacture_date, 'YYMMDD');
  END CASE;

  RETURN v_prefix || v_model_code || v_date_str;
END;
$$ LANGUAGE plpgsql;


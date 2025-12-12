-- Migration: 00024_fix_lot_number_generation
-- Description: Fix lot number generation to extract only digits after leading letters
-- Created: 2025-12-12
--
-- Problem:
--   - Current logic: REGEXP_REPLACE(p_model_name, '[^0-9A-Za-z]', '', 'g')
--   - This keeps both letters and digits, resulting in incorrect lot numbers
--   - Example: 'CB23060WE020' → 'CB230' (wrong, includes letters)
--
-- Solution:
--   - Extract first continuous digits after leading letters
--   - Example: 'CB23060WE020' → '23060' (correct, digits only)
--   - Example: 'ND25600KD1246' → '25600' (stops at 'KD')
--   - Pad with leading zeros if less than required digits

-- ============================================
-- 1. Update generate_lot_number function
-- ============================================
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
  v_extracted_digits VARCHAR;
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

  -- Extract first continuous digits after leading letters
  -- Pattern: ^[A-Za-z]* matches leading letters, ([0-9]+) captures first digit sequence
  v_extracted_digits := (REGEXP_MATCH(p_model_name, '^[A-Za-z]*([0-9]+)'))[1];

  -- If no digits found, use '0'
  IF v_extracted_digits IS NULL THEN
    v_extracted_digits := '0';
  END IF;

  -- Take first N digits and pad with leading zeros
  v_model_code := LPAD(
    SUBSTRING(v_extracted_digits FROM 1 FOR v_model_digits),
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

COMMENT ON FUNCTION generate_lot_number(UUID, VARCHAR, DATE) IS
  'Lot 번호 자동 생성 (제조사 설정 기반: 접두어 + 모델코드(숫자만) + 날짜). 모델명에서 앞의 문자를 제외하고 첫 번째 연속 숫자를 추출합니다.';

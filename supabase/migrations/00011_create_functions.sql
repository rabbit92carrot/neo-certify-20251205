-- Migration: 00011_create_functions
-- Description: Create helper functions for business logic
-- Created: 2025-12-09

-- ============================================
-- Common Helper Functions
-- ============================================

-- Function: update_updated_at_column
-- Automatically updates the updated_at column on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS '트리거용: updated_at 컬럼 자동 갱신';

-- ============================================
-- Validation Functions
-- ============================================

-- Function: validate_business_number
-- Validates Korean business registration number format (10 digits)
CREATE OR REPLACE FUNCTION validate_business_number(bn VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN bn ~ '^[0-9]{10}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_business_number(VARCHAR) IS '사업자등록번호 형식 검증 (10자리 숫자)';

-- Function: normalize_phone_number
-- Removes non-digit characters from phone number
CREATE OR REPLACE FUNCTION normalize_phone_number(phone VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalize_phone_number(VARCHAR) IS '전화번호 정규화 (하이픈 등 제거, 숫자만 반환)';

-- ============================================
-- Virtual Code Generation
-- ============================================

-- Function: generate_virtual_code
-- Generates a unique virtual identification code (e.g., NC-ABC12345)
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

COMMENT ON FUNCTION generate_virtual_code() IS '고유 가상 식별코드 생성 (형식: NC-XXXXXXXX)';

-- ============================================
-- FIFO Code Selection
-- ============================================

-- Function: select_fifo_codes
-- Selects virtual codes based on FIFO (First In First Out) principle
-- Uses FOR UPDATE SKIP LOCKED for concurrent access handling
CREATE OR REPLACE FUNCTION select_fifo_codes(
  p_product_id UUID,
  p_owner_id VARCHAR,
  p_quantity INT,
  p_lot_id UUID DEFAULT NULL  -- Optional: specific lot selection (manufacturer only)
)
RETURNS TABLE(virtual_code_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT vc.id
  FROM virtual_codes vc
  JOIN lots l ON vc.lot_id = l.id
  WHERE l.product_id = p_product_id
    AND vc.status = 'IN_STOCK'
    AND vc.owner_id = p_owner_id
    AND (p_lot_id IS NULL OR vc.lot_id = p_lot_id)
  ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
  LIMIT p_quantity
  FOR UPDATE OF vc SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION select_fifo_codes(UUID, VARCHAR, INT, UUID) IS
  'FIFO 기반 가상코드 선택 (동시성 처리: FOR UPDATE SKIP LOCKED)';

-- ============================================
-- Recall Validation
-- ============================================

-- Function: is_recall_allowed
-- Checks if a shipment batch can still be recalled (within 24 hours)
CREATE OR REPLACE FUNCTION is_recall_allowed(p_shipment_batch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_shipment_date TIMESTAMPTZ;
  v_is_recalled BOOLEAN;
BEGIN
  SELECT shipment_date, is_recalled
  INTO v_shipment_date, v_is_recalled
  FROM shipment_batches
  WHERE id = p_shipment_batch_id;

  -- Not found
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already recalled
  IF v_is_recalled THEN
    RETURN FALSE;
  END IF;

  -- Check 24-hour limit
  RETURN (NOW() - v_shipment_date) <= INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_recall_allowed(UUID) IS '회수 가능 여부 확인 (24시간 이내, 미회수 상태)';

-- ============================================
-- Inventory Count Functions
-- ============================================

-- Function: get_inventory_count
-- Gets the inventory count for a specific product and owner
CREATE OR REPLACE FUNCTION get_inventory_count(
  p_product_id UUID,
  p_owner_id VARCHAR
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM virtual_codes vc
  JOIN lots l ON vc.lot_id = l.id
  WHERE l.product_id = p_product_id
    AND vc.owner_id = p_owner_id
    AND vc.status = 'IN_STOCK';

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_inventory_count(UUID, VARCHAR) IS '특정 제품의 재고 수량 조회';

-- Function: get_inventory_by_lot
-- Gets inventory breakdown by lot for a specific product and owner
CREATE OR REPLACE FUNCTION get_inventory_by_lot(
  p_product_id UUID,
  p_owner_id VARCHAR
)
RETURNS TABLE(
  lot_id UUID,
  lot_number VARCHAR,
  manufacture_date DATE,
  expiry_date DATE,
  quantity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.lot_number,
    l.manufacture_date,
    l.expiry_date,
    COUNT(vc.id)
  FROM lots l
  LEFT JOIN virtual_codes vc ON vc.lot_id = l.id
    AND vc.owner_id = p_owner_id
    AND vc.status = 'IN_STOCK'
  WHERE l.product_id = p_product_id
  GROUP BY l.id, l.lot_number, l.manufacture_date, l.expiry_date
  HAVING COUNT(vc.id) > 0
  ORDER BY l.manufacture_date ASC, l.created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_inventory_by_lot(UUID, VARCHAR) IS 'Lot별 재고 수량 조회 (FIFO 순서)';

-- ============================================
-- Lot Number Generation (Helper)
-- ============================================

-- Function: generate_lot_number
-- Generates a lot number based on manufacturer settings
-- Format: {prefix}{model_code}{date}
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

COMMENT ON FUNCTION generate_lot_number(UUID, VARCHAR, DATE) IS
  'Lot 번호 자동 생성 (제조사 설정 기반: 접두어 + 모델코드 + 날짜)';

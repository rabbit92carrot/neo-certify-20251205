-- =====================================================
-- Migration: 20251211053700_inventory_and_lot_functions
-- Description: 재고 요약 조회 및 Lot 추가 생산 함수
-- =====================================================

-- =====================================================
-- 1. 재고 요약 조회 함수 (제품별 그룹화)
-- Supabase 기본 limit 제한을 우회하여 정확한 재고 집계
-- =====================================================
CREATE OR REPLACE FUNCTION get_inventory_summary(p_owner_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name::TEXT AS product_name,
    COUNT(vc.id) AS quantity
  FROM virtual_codes vc
  INNER JOIN lots l ON l.id = vc.lot_id
  INNER JOIN products p ON p.id = l.product_id
  WHERE vc.owner_id = p_owner_id::VARCHAR
    AND vc.owner_type = 'ORGANIZATION'
    AND vc.status = 'IN_STOCK'
  GROUP BY p.id, p.name
  ORDER BY p.name;
END;
$$;

-- =====================================================
-- 2. 기존 Lot에 수량 추가 함수
-- 동일 제품을 같은 날 추가 생산할 때 사용
-- =====================================================
CREATE OR REPLACE FUNCTION add_quantity_to_lot(
  p_lot_id UUID,
  p_additional_quantity INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_manufacturer_id UUID;
  v_current_quantity INT;
  v_new_quantity INT;
  i INT;
BEGIN
  -- 입력 검증
  IF p_additional_quantity <= 0 THEN
    RAISE EXCEPTION 'Additional quantity must be positive: %', p_additional_quantity;
  END IF;

  -- 현재 Lot 정보 조회
  SELECT l.quantity, p.organization_id
  INTO v_current_quantity, v_manufacturer_id
  FROM lots l
  JOIN products p ON p.id = l.product_id
  WHERE l.id = p_lot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot not found: %', p_lot_id;
  END IF;

  -- 최대 수량 체크 (100,000개 제한)
  v_new_quantity := v_current_quantity + p_additional_quantity;
  IF v_new_quantity > 100000 THEN
    RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000): current=%, additional=%, total=%',
      v_current_quantity, p_additional_quantity, v_new_quantity;
  END IF;

  -- 수량 업데이트
  UPDATE lots
  SET quantity = v_new_quantity
  WHERE id = p_lot_id;

  -- 추가 수량만큼 virtual_codes 생성
  FOR i IN 1..p_additional_quantity LOOP
    INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
    VALUES (
      generate_virtual_code(),
      p_lot_id,
      'IN_STOCK',
      'ORGANIZATION',
      v_manufacturer_id::VARCHAR
    );
  END LOOP;

  RETURN v_new_quantity;
END;
$$;

-- =====================================================
-- 3. Lot 조회 또는 생성 함수 (Upsert 패턴)
-- 동일한 제품+Lot번호가 있으면 수량 추가, 없으면 새로 생성
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_lot(
  p_product_id UUID,
  p_lot_number VARCHAR,
  p_quantity INT,
  p_manufacture_date DATE,
  p_expiry_date DATE
)
RETURNS TABLE (
  lot_id UUID,
  lot_number VARCHAR,
  total_quantity INT,
  is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_lot_id UUID;
  v_existing_quantity INT;
  v_manufacturer_id UUID;
  v_new_quantity INT;
  v_is_new BOOLEAN := FALSE;
  i INT;
BEGIN
  -- 제품의 제조사 ID 조회
  SELECT organization_id INTO v_manufacturer_id
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- 기존 Lot 확인
  SELECT l.id, l.quantity
  INTO v_existing_lot_id, v_existing_quantity
  FROM lots l
  WHERE l.product_id = p_product_id
    AND l.lot_number = p_lot_number;

  IF FOUND THEN
    -- 기존 Lot에 수량 추가
    v_new_quantity := v_existing_quantity + p_quantity;

    -- 최대 수량 체크
    IF v_new_quantity > 100000 THEN
      RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000): current=%, additional=%, total=%',
        v_existing_quantity, p_quantity, v_new_quantity;
    END IF;

    -- 수량 업데이트
    UPDATE lots SET quantity = v_new_quantity WHERE id = v_existing_lot_id;

    -- 추가 수량만큼 virtual_codes 생성
    FOR i IN 1..p_quantity LOOP
      INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
      VALUES (
        generate_virtual_code(),
        v_existing_lot_id,
        'IN_STOCK',
        'ORGANIZATION',
        v_manufacturer_id::VARCHAR
      );
    END LOOP;

    RETURN QUERY SELECT v_existing_lot_id, p_lot_number, v_new_quantity, FALSE;
  ELSE
    -- 새 Lot 생성
    INSERT INTO lots (product_id, lot_number, quantity, manufacture_date, expiry_date)
    VALUES (p_product_id, p_lot_number, p_quantity, p_manufacture_date, p_expiry_date)
    RETURNING id INTO v_existing_lot_id;

    -- 트리거가 virtual_codes를 자동 생성하므로 여기서는 생성하지 않음
    v_is_new := TRUE;

    RETURN QUERY SELECT v_existing_lot_id, p_lot_number, p_quantity, TRUE;
  END IF;
END;
$$;


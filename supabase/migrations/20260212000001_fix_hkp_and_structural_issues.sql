-- =============================================================================
-- Issue #42: HKP 트리거 타이밍 버그 수정 + 구조적 정합성 개선
--
-- 근본 원인:
--   trg_register_hospital_known_product 트리거가 shipment_batches INSERT 시점에
--   발동하지만, create_shipment_atomic 내에서 shipment_details는 그 이후에
--   INSERT되므로 트리거의 SELECT가 0행을 반환 → HKP 레코드 미생성
--
-- 수정 사항:
-- 1. 트리거/함수 삭제 → create_shipment_atomic 양쪽 버전에 HKP 등록 내장
-- 2. 4-param create_shipment_atomic: RECEIVED 히스토리 누락 수정 (C2)
-- 3. get_hospital_known_products: COALESCE 적용 (null 통일)
-- 4. get_active_products_for_treatment: COALESCE 적용 (null 통일)
-- 5. 누락 HKP 레코드 backfill
-- =============================================================================

-- ============================================================================
-- Step 1: 트리거 및 함수 삭제
-- ============================================================================
DROP TRIGGER IF EXISTS trg_register_hospital_known_product ON shipment_batches;
DROP FUNCTION IF EXISTS register_hospital_known_product();

-- ============================================================================
-- Step 2: create_shipment_atomic (3-param) 재정의
--   기반: 20260106000003 보안 강화 버전
--   변경: FOR LOOP 종료 후, HKP 등록 로직 추가
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."create_shipment_atomic"(
  "p_to_org_id" "uuid",
  "p_to_org_type" "public"."organization_type",
  "p_items" "jsonb"
)
RETURNS TABLE(
  "shipment_batch_id" "uuid",
  "total_quantity" integer,
  "error_code" character varying,
  "error_message" character varying
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_org_id UUID;
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_from_org_id := get_user_organization_id();

  IF v_from_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요하거나 조직에 소속되어 있지 않습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'SELF_SHIPMENT'::VARCHAR,
      '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO shipment_batches (from_organization_id, to_organization_id, to_organization_type)
  VALUES (v_from_org_id, p_to_org_id, p_to_org_type)
  RETURNING id INTO v_batch_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_lot_id := NULLIF(v_item->>'lotId', '')::UUID;

    -- FIFO 선택: owner_type = 'ORGANIZATION' 조건 추가 (보안 강화)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = v_from_org_id::VARCHAR
        AND vc.owner_type = 'ORGANIZATION'
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
      VALUES (v_batch_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = p_to_org_id::VARCHAR, owner_type = 'ORGANIZATION'
      WHERE id = v_code_id;

      -- SHIPPED history (sender's perspective)
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'SHIPPED', 'ORGANIZATION', v_from_org_id::VARCHAR,
        'ORGANIZATION', p_to_org_id::VARCHAR, v_batch_id, FALSE
      );

      -- RECEIVED history (receiver's perspective)
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'RECEIVED', 'ORGANIZATION', v_from_org_id::VARCHAR,
        'ORGANIZATION', p_to_org_id::VARCHAR, v_batch_id, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  -- [신규] 병원 수신 시 hospital_known_products 자동 등록
  IF p_to_org_type = 'HOSPITAL' THEN
    INSERT INTO hospital_known_products (hospital_id, product_id, first_received_at)
    SELECT DISTINCT p_to_org_id, l.product_id, NOW()
    FROM shipment_details sd
    JOIN virtual_codes vc ON sd.virtual_code_id = vc.id
    JOIN lots l ON vc.lot_id = l.id
    WHERE sd.shipment_batch_id = v_batch_id
    ON CONFLICT (hospital_id, product_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_batch_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;

-- ============================================================================
-- Step 3: create_shipment_atomic (4-param) 재정의
--   기반: 20260106000003 보안 강화 버전
--   변경1: RECEIVED 히스토리 추가 (C2 버그 수정)
--   변경2: HKP 등록 로직 추가
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."create_shipment_atomic"(
  "p_from_org_id" "uuid",
  "p_to_org_id" "uuid",
  "p_to_org_type" "public"."organization_type",
  "p_items" "jsonb"
)
RETURNS TABLE(
  "shipment_batch_id" "uuid",
  "total_quantity" integer,
  "error_code" character varying,
  "error_message" character varying
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
  v_item_quantity INT;
BEGIN
  -- Validate input
  IF p_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT
      NULL::UUID,
      0,
      'SELF_SHIPMENT'::VARCHAR,
      '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Verify target organization exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT
      NULL::UUID,
      0,
      'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Create shipment batch
  INSERT INTO shipment_batches (
    from_organization_id,
    to_organization_id,
    to_organization_type
  ) VALUES (
    p_from_org_id,
    p_to_org_id,
    p_to_org_type
  ) RETURNING id INTO v_batch_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_lot_id := NULLIF(v_item->>'lotId', '')::UUID;
    v_item_quantity := 0;

    -- FIFO 선택: owner_type = 'ORGANIZATION' 조건 추가 (보안 강화)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_from_org_id::VARCHAR
        AND vc.owner_type = 'ORGANIZATION'
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    -- Check if we got enough codes
    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    -- Insert shipment details
    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
      VALUES (v_batch_id, v_code_id);

      -- Update ownership
      UPDATE virtual_codes
      SET owner_id = p_to_org_id::VARCHAR,
          owner_type = 'ORGANIZATION'
      WHERE id = v_code_id;

      -- SHIPPED history (sender's perspective)
      INSERT INTO histories (
        virtual_code_id,
        action_type,
        from_owner_type,
        from_owner_id,
        to_owner_type,
        to_owner_id,
        shipment_batch_id,
        is_recall
      ) VALUES (
        v_code_id,
        'SHIPPED',
        'ORGANIZATION',
        p_from_org_id::VARCHAR,
        'ORGANIZATION',
        p_to_org_id::VARCHAR,
        v_batch_id,
        FALSE
      );

      -- [수정] RECEIVED history 추가 (기존 4-param에서 누락되어 있었음)
      INSERT INTO histories (
        virtual_code_id,
        action_type,
        from_owner_type,
        from_owner_id,
        to_owner_type,
        to_owner_id,
        shipment_batch_id,
        is_recall
      ) VALUES (
        v_code_id,
        'RECEIVED',
        'ORGANIZATION',
        p_from_org_id::VARCHAR,
        'ORGANIZATION',
        p_to_org_id::VARCHAR,
        v_batch_id,
        FALSE
      );

      v_total := v_total + 1;
      v_item_quantity := v_item_quantity + 1;
    END LOOP;

    -- 비활성 제품 사용 로그 (아이템별로 기록)
    PERFORM log_inactive_product_usage(
      'SHIPMENT',
      v_batch_id,
      v_product_id,
      p_from_org_id,
      v_item_quantity
    );
  END LOOP;

  -- [신규] 병원 수신 시 hospital_known_products 자동 등록
  IF p_to_org_type = 'HOSPITAL' THEN
    INSERT INTO hospital_known_products (hospital_id, product_id, first_received_at)
    SELECT DISTINCT p_to_org_id, l.product_id, NOW()
    FROM shipment_details sd
    JOIN virtual_codes vc ON sd.virtual_code_id = vc.id
    JOIN lots l ON vc.lot_id = l.id
    WHERE sd.shipment_batch_id = v_batch_id
    ON CONFLICT (hospital_id, product_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_batch_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    -- Parse custom error format
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT
        NULL::UUID,
        0,
        'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT
        NULL::UUID,
        0,
        'INTERNAL_ERROR'::VARCHAR,
        SQLERRM::VARCHAR;
    END IF;
END;
$$;

-- ============================================================================
-- Step 4: get_hospital_known_products 재정의 (COALESCE 적용)
--   기반: 20251222200000 CTE 최적화 버전
--   변경: model_name, udi_di에 COALESCE 적용
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."get_hospital_known_products"(
    p_hospital_id UUID,
    p_search TEXT DEFAULT NULL,
    p_alias_filter TEXT DEFAULT NULL,
    p_active_filter BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    product_name VARCHAR,
    model_name VARCHAR,
    udi_di VARCHAR,
    alias VARCHAR,
    is_active BOOLEAN,
    first_received_at TIMESTAMPTZ,
    current_inventory BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH inventory_counts AS (
        SELECT
            l.product_id,
            COUNT(vc.id) AS stock_count
        FROM virtual_codes vc
        JOIN lots l ON vc.lot_id = l.id
        WHERE vc.owner_id = p_hospital_id::VARCHAR
          AND vc.status = 'IN_STOCK'
        GROUP BY l.product_id
    )
    SELECT
        hkp.id,
        hkp.product_id,
        p.name AS product_name,
        COALESCE(p.model_name, '')::VARCHAR AS model_name,
        COALESCE(p.udi_di, '')::VARCHAR AS udi_di,
        hkp.alias,
        hkp.is_active,
        hkp.first_received_at,
        COALESCE(ic.stock_count, 0)::BIGINT AS current_inventory
    FROM hospital_known_products hkp
    JOIN products p ON hkp.product_id = p.id
    LEFT JOIN inventory_counts ic ON ic.product_id = hkp.product_id
    WHERE hkp.hospital_id = p_hospital_id
      AND (
          p_search IS NULL
          OR p_search = ''
          OR p.name ILIKE '%' || p_search || '%'
          OR p.model_name ILIKE '%' || p_search || '%'
          OR hkp.alias ILIKE '%' || p_search || '%'
      )
      AND (
          p_alias_filter IS NULL
          OR (p_alias_filter = 'with_alias' AND hkp.alias IS NOT NULL)
          OR (p_alias_filter = 'without_alias' AND hkp.alias IS NULL)
      )
      AND (
          p_active_filter IS NULL
          OR hkp.is_active = p_active_filter
      )
    ORDER BY
        hkp.is_active DESC,
        CASE WHEN hkp.alias IS NOT NULL THEN 0 ELSE 1 END,
        p.name ASC;
END;
$$;

COMMENT ON FUNCTION "public"."get_hospital_known_products"(UUID, TEXT, TEXT, BOOLEAN)
    IS '병원의 known products 목록 조회 (CTE 최적화, COALESCE 적용)';

-- ============================================================================
-- Step 5: get_active_products_for_treatment 재정의 (COALESCE 적용)
--   기반: 20251222000003 원본
--   변경: model_name, udi_di에 COALESCE 적용
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."get_active_products_for_treatment"(
    p_hospital_id UUID
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    model_name VARCHAR,
    udi_di VARCHAR,
    alias VARCHAR,
    available_quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        COALESCE(p.model_name, '')::VARCHAR AS model_name,
        COALESCE(p.udi_di, '')::VARCHAR AS udi_di,
        hkp.alias,
        COUNT(vc.id)::BIGINT AS available_quantity
    FROM products p
    JOIN lots l ON l.product_id = p.id
    JOIN virtual_codes vc ON vc.lot_id = l.id
    LEFT JOIN hospital_known_products hkp
        ON hkp.product_id = p.id
        AND hkp.hospital_id = p_hospital_id
    WHERE vc.owner_id = p_hospital_id::VARCHAR
      AND vc.status = 'IN_STOCK'
      AND p.is_active = true
      AND (hkp.id IS NULL OR hkp.is_active = true)
    GROUP BY p.id, p.name, p.model_name, p.udi_di, hkp.alias
    HAVING COUNT(vc.id) > 0
    ORDER BY
        CASE WHEN hkp.alias IS NOT NULL THEN 0 ELSE 1 END,
        hkp.alias NULLS LAST,
        p.name ASC;
END;
$$;

COMMENT ON FUNCTION "public"."get_active_products_for_treatment"(UUID)
    IS '시술 등록용 활성 제품 목록 (COALESCE 적용)';

-- ============================================================================
-- Step 6: 누락 HKP 레코드 backfill
--   기존 20251222000002에서 backfill 했으나, 트리거 버그로 인해
--   그 이후 출고된 건들의 HKP가 누락되었을 수 있음
-- ============================================================================
INSERT INTO hospital_known_products (hospital_id, product_id, first_received_at)
SELECT DISTINCT
    sb.to_organization_id,
    l.product_id,
    MIN(sb.shipment_date)
FROM shipment_batches sb
JOIN organizations o ON sb.to_organization_id = o.id
JOIN shipment_details sd ON sb.id = sd.shipment_batch_id
JOIN virtual_codes vc ON sd.virtual_code_id = vc.id
JOIN lots l ON vc.lot_id = l.id
WHERE o.type = 'HOSPITAL'
  AND sb.is_recalled = false
GROUP BY sb.to_organization_id, l.product_id
ON CONFLICT (hospital_id, product_id) DO NOTHING;

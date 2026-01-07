-- =============================================================================
-- 핵심 Atomic 함수 보안 강화
--
-- 목적: create_shipment_atomic, create_treatment_atomic 함수에
--       search_path 설정 및 owner_type 검증 추가
--
-- 변경 사항:
-- 1. create_shipment_atomic (3-param): search_path 추가, owner_type 검증 추가
-- 2. create_shipment_atomic (4-param): SECURITY DEFINER, search_path 추가, owner_type 검증 추가
-- 3. create_treatment_atomic (3-param): search_path 추가, owner_type 검증 추가
-- 4. create_treatment_atomic (4-param): SECURITY DEFINER, search_path 추가, owner_type 검증 추가
--
-- 참조: create_disposal_atomic의 개선된 보안 패턴 적용
-- =============================================================================

-- ============================================================================
-- 1. create_shipment_atomic (3-param 버전) - 보안 강화
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
        AND vc.owner_type = 'ORGANIZATION'  -- 보안: 소유 타입 검증
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
-- 2. create_shipment_atomic (4-param 버전) - 보안 강화
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
  v_item_quantity INT;  -- 각 아이템별 수량 추적
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
        AND vc.owner_type = 'ORGANIZATION'  -- 보안: 소유 타입 검증
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    -- Check if we got enough codes
    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      -- Rollback by raising exception
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

      -- Record history
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
-- 3. create_treatment_atomic (3-param 버전) - 보안 강화
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."create_treatment_atomic"(
  "p_patient_phone" character varying,
  "p_treatment_date" "date",
  "p_items" "jsonb"
)
RETURNS TABLE(
  "treatment_id" "uuid",
  "total_quantity" integer,
  "error_code" character varying,
  "error_message" character varying
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital_id UUID;
  v_hospital_type organization_type;
  v_treatment_id UUID;
  v_normalized_phone VARCHAR;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Verify the user is from a hospital
  v_hospital_type := get_user_organization_type();
  IF v_hospital_type != 'HOSPITAL' THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'FORBIDDEN'::VARCHAR,
      '병원만 시술을 등록할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  v_normalized_phone := get_or_create_patient(p_patient_phone);

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = v_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR,
      '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO treatment_records (hospital_id, patient_phone, treatment_date)
  VALUES (v_hospital_id, v_normalized_phone, p_treatment_date)
  RETURNING id INTO v_treatment_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- FIFO 선택: owner_type = 'ORGANIZATION' 조건 추가 (보안 강화)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = v_hospital_id::VARCHAR
        AND vc.owner_type = 'ORGANIZATION'  -- 보안: 소유 타입 검증
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
      INSERT INTO treatment_details (treatment_id, virtual_code_id)
      VALUES (v_treatment_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = v_normalized_phone, owner_type = 'PATIENT', status = 'USED'
      WHERE id = v_code_id;

      -- 수정: treatment_id 추가
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, is_recall, treatment_id
      ) VALUES (
        v_code_id, 'TREATED', 'ORGANIZATION', v_hospital_id::VARCHAR,
        'PATIENT', v_normalized_phone, FALSE, v_treatment_id
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  -- 병원 환자 캐시 동기화
  PERFORM upsert_hospital_known_patient(v_hospital_id, v_normalized_phone, p_treatment_date::TIMESTAMPTZ);

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

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
-- 4. create_treatment_atomic (4-param 버전) - 보안 강화
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."create_treatment_atomic"(
  "p_hospital_id" "uuid",
  "p_patient_phone" character varying,
  "p_treatment_date" "date",
  "p_items" "jsonb"
)
RETURNS TABLE(
  "treatment_id" "uuid",
  "total_quantity" integer,
  "error_code" character varying,
  "error_message" character varying
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_treatment_id UUID;
  v_normalized_phone VARCHAR;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  v_normalized_phone := get_or_create_patient(p_patient_phone);

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR, '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO treatment_records (hospital_id, patient_phone, treatment_date)
  VALUES (p_hospital_id, v_normalized_phone, p_treatment_date)
  RETURNING id INTO v_treatment_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- FIFO 선택: owner_type = 'ORGANIZATION' 조건 추가 (보안 강화)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_hospital_id::VARCHAR
        AND vc.owner_type = 'ORGANIZATION'  -- 보안: 소유 타입 검증
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
      INSERT INTO treatment_details (treatment_id, virtual_code_id)
      VALUES (v_treatment_id, v_code_id);

      UPDATE virtual_codes
      SET owner_id = v_normalized_phone, owner_type = 'PATIENT', status = 'USED'
      WHERE id = v_code_id;

      -- 수정: treatment_id 추가
      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, is_recall, treatment_id
      ) VALUES (
        v_code_id, 'TREATED', 'ORGANIZATION', p_hospital_id::VARCHAR,
        'PATIENT', v_normalized_phone, FALSE, v_treatment_id
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  -- 병원 환자 캐시 동기화
  PERFORM upsert_hospital_known_patient(p_hospital_id, v_normalized_phone, p_treatment_date::TIMESTAMPTZ);

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;

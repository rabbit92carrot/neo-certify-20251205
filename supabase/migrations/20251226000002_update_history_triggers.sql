-- 트리거 및 함수 수정: 새 이력에 배치 ID 자동 저장
--
-- 변경 사항:
-- 1. record_production_history(): lot_id 저장 추가
-- 2. create_treatment_atomic(): treatment_id 저장 추가 (3개 버전 모두)
-- 3. recall_treatment_atomic(): treatment_id 저장 추가

-- ============================================================================
-- 1. record_production_history() - PRODUCED 이력에 lot_id 저장
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."record_production_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    lot_id  -- 추가: 로트 ID 저장
  ) VALUES (
    NEW.id,
    'PRODUCED',
    'ORGANIZATION',
    NEW.owner_id,  -- Manufacturer
    'ORGANIZATION',
    NEW.owner_id,  -- Same (produced and owned by manufacturer)
    NEW.lot_id     -- 추가: virtual_codes의 lot_id 사용
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. create_treatment_atomic (3 파라미터 버전) - TREATED 이력에 treatment_id 저장
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

    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = v_hospital_id::VARCHAR
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
-- 3. create_treatment_atomic (4 파라미터 버전) - TREATED 이력에 treatment_id 저장
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
LANGUAGE "plpgsql"
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

    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = p_hospital_id::VARCHAR
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

-- ============================================================================
-- 4. recall_treatment_atomic (2 파라미터 버전) - RECALLED 이력에 treatment_id 저장
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."recall_treatment_atomic"(
    "p_treatment_id" "uuid",
    "p_reason" character varying
)
RETURNS TABLE(
    "success" boolean,
    "recalled_count" integer,
    "error_code" character varying,
    "error_message" character varying
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_hospital_id UUID;
  v_treatment treatment_records;
  v_code_ids UUID[];
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  -- Get hospital_id from authenticated user
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get treatment record
  SELECT * INTO v_treatment
  FROM treatment_records
  WHERE id = p_treatment_id AND hospital_id = v_hospital_id;

  IF v_treatment IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'NOT_FOUND'::VARCHAR, '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_treatment.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR, '이미 회수된 시술입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour window
  IF NOW() > v_treatment.treatment_date::TIMESTAMP + INTERVAL '24 hours' + INTERVAL '1 day' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_WINDOW_EXPIRED'::VARCHAR, '회수 가능 기간(24시간)이 지났습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code ids from treatment
  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td
  WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_CODES'::VARCHAR, '회수할 코드가 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Revert ownership and record history
  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    UPDATE virtual_codes
    SET owner_id = v_hospital_id::VARCHAR,
        owner_type = 'ORGANIZATION',
        status = 'IN_STOCK'
    WHERE id = v_code_id;

    -- 수정: treatment_id 추가
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, is_recall, recall_reason, treatment_id
    ) VALUES (
      v_code_id, 'RECALLED', 'PATIENT', v_treatment.patient_phone,
      'ORGANIZATION', v_hospital_id::VARCHAR, TRUE, p_reason, p_treatment_id
    );

    v_count := v_count + 1;
  END LOOP;

  -- Mark treatment as recalled
  UPDATE treatment_records
  SET is_recalled = TRUE,
      recall_reason = p_reason,
      recall_date = NOW()
  WHERE id = p_treatment_id;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;
END;
$$;

-- ============================================================================
-- 5. recall_treatment_atomic (3 파라미터 버전) - RECALLED 이력에 treatment_id 저장
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."recall_treatment_atomic"(
    "p_hospital_id" "uuid",
    "p_treatment_id" "uuid",
    "p_reason" character varying
)
RETURNS TABLE(
    "success" boolean,
    "recalled_count" integer,
    "error_code" character varying,
    "error_message" character varying
)
LANGUAGE "plpgsql"
AS $$
DECLARE
  v_treatment treatment_records;
  v_code_ids UUID[];
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  -- Get treatment record
  SELECT * INTO v_treatment
  FROM treatment_records
  WHERE id = p_treatment_id AND hospital_id = p_hospital_id;

  IF v_treatment IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'NOT_FOUND'::VARCHAR, '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_treatment.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR, '이미 회수된 시술입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour window
  IF NOW() > v_treatment.treatment_date::TIMESTAMP + INTERVAL '24 hours' + INTERVAL '1 day' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_WINDOW_EXPIRED'::VARCHAR, '회수 가능 기간(24시간)이 지났습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code ids from treatment
  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td
  WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_CODES'::VARCHAR, '회수할 코드가 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Revert ownership and record history
  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    UPDATE virtual_codes
    SET owner_id = p_hospital_id::VARCHAR,
        owner_type = 'ORGANIZATION',
        status = 'IN_STOCK'
    WHERE id = v_code_id;

    -- 수정: treatment_id 추가
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, is_recall, recall_reason, treatment_id
    ) VALUES (
      v_code_id, 'RECALLED', 'PATIENT', v_treatment.patient_phone,
      'ORGANIZATION', p_hospital_id::VARCHAR, TRUE, p_reason, p_treatment_id
    );

    v_count := v_count + 1;
  END LOOP;

  -- Mark treatment as recalled
  UPDATE treatment_records
  SET is_recalled = TRUE,
      recall_reason = p_reason,
      recall_date = NOW()
  WHERE id = p_treatment_id;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;
END;
$$;

-- 코멘트는 Supabase 원격 마이그레이션에서 multiple statements 오류를 방지하기 위해
-- 각 함수 정의 내부의 주석으로 대체합니다.

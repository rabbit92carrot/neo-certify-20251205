-- ============================================================================
-- 병원 환자 캐시 동기화 함수
--
-- 시술 등록/회수 시 hospital_known_patients 테이블 자동 동기화
-- RPC 함수 내에서 호출되어 원자적 트랜잭션 내에서 동작
--
-- 전화번호 저장 형식:
-- - 입력: 01012345678 (정규화된 전체 번호)
-- - 저장: 12345678 (010 제거)
-- ============================================================================

-- ============================================================================
-- 1. 환자 등록/업데이트 함수 (시술 등록 시 호출)
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."upsert_hospital_known_patient"(
    p_hospital_id UUID,
    p_patient_phone VARCHAR,
    p_treatment_date TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_phone_without_010 VARCHAR;
BEGIN
    -- 010 제거하여 저장 (010으로 시작하고 4자 이상일 때만)
    IF LENGTH(p_patient_phone) >= 4 AND p_patient_phone LIKE '010%' THEN
        v_phone_without_010 := SUBSTRING(p_patient_phone FROM 4);
    ELSE
        v_phone_without_010 := p_patient_phone;
    END IF;

    INSERT INTO hospital_known_patients (
        hospital_id,
        patient_phone,
        treatment_count,
        first_treatment_at,
        last_treatment_at
    )
    VALUES (
        p_hospital_id,
        v_phone_without_010,
        1,
        p_treatment_date,
        p_treatment_date
    )
    ON CONFLICT (hospital_id, patient_phone)
    DO UPDATE SET
        treatment_count = hospital_known_patients.treatment_count + 1,
        last_treatment_at = GREATEST(hospital_known_patients.last_treatment_at, p_treatment_date),
        updated_at = now();
END;
$$;

COMMENT ON FUNCTION "public"."upsert_hospital_known_patient"(UUID, VARCHAR, TIMESTAMPTZ)
    IS '병원 환자 캐시 등록/업데이트 (시술 등록 시 호출, 010 제거하여 저장)';


-- ============================================================================
-- 2. 환자 시술 횟수 감소 함수 (시술 회수 시 호출)
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."decrement_hospital_known_patient"(
    p_hospital_id UUID,
    p_patient_phone VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_phone_without_010 VARCHAR;
BEGIN
    -- 010 제거하여 검색 (저장 형식과 동일하게)
    IF LENGTH(p_patient_phone) >= 4 AND p_patient_phone LIKE '010%' THEN
        v_phone_without_010 := SUBSTRING(p_patient_phone FROM 4);
    ELSE
        v_phone_without_010 := p_patient_phone;
    END IF;

    -- treatment_count 감소 (최소 0 유지, 레코드는 삭제하지 않음)
    UPDATE hospital_known_patients
    SET
        treatment_count = GREATEST(treatment_count - 1, 0),
        updated_at = now()
    WHERE hospital_id = p_hospital_id
      AND patient_phone = v_phone_without_010;

    -- 존재하지 않는 경우 무시 (이미 삭제된 경우 등)
END;
$$;

COMMENT ON FUNCTION "public"."decrement_hospital_known_patient"(UUID, VARCHAR)
    IS '병원 환자 시술 횟수 감소 (시술 회수 시 호출, 010 제거하여 검색)';


-- ============================================================================
-- 3. create_treatment_atomic 함수 업데이트 (환자 캐시 동기화 추가)
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

      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, is_recall
      ) VALUES (
        v_code_id, 'TREATED', 'ORGANIZATION', v_hospital_id::VARCHAR,
        'PATIENT', v_normalized_phone, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  -- ★ 병원 환자 캐시 동기화 (신규 추가)
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
-- 4. recall_treatment_atomic 함수 업데이트 (환자 캐시 동기화 추가)
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
  v_treatment RECORD;
  v_code_ids UUID[];
  v_code_id UUID;
  v_count INT := 0;
BEGIN
  -- Derive organization_id from authenticated user
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT * INTO v_treatment FROM treatment_records WHERE id = p_treatment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR,
      '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_treatment.hospital_id != v_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR,
      '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR,
      '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  UPDATE virtual_codes
  SET owner_id = v_hospital_id::VARCHAR, owner_type = 'ORGANIZATION', status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM treatment_details WHERE treatment_id = p_treatment_id;
  DELETE FROM treatment_records WHERE id = p_treatment_id;

  FOREACH v_code_id IN ARRAY v_code_ids
  LOOP
    INSERT INTO histories (
      virtual_code_id, action_type, from_owner_type, from_owner_id,
      to_owner_type, to_owner_id, is_recall, recall_reason
    ) VALUES (
      v_code_id, 'RECALLED', 'PATIENT', v_treatment.patient_phone,
      'ORGANIZATION', v_hospital_id::VARCHAR, TRUE, p_reason
    );
  END LOOP;

  -- ★ 병원 환자 캐시 동기화 (신규 추가)
  PERFORM decrement_hospital_known_patient(v_hospital_id, v_treatment.patient_phone);

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;


-- ============================================================================
-- 5. 오버로드된 함수들도 업데이트 (p_hospital_id 파라미터 버전)
-- ============================================================================

-- create_treatment_atomic with p_hospital_id
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

      INSERT INTO histories (
        virtual_code_id, action_type, from_owner_type, from_owner_id,
        to_owner_type, to_owner_id, is_recall
      ) VALUES (
        v_code_id, 'TREATED', 'ORGANIZATION', p_hospital_id::VARCHAR,
        'PATIENT', v_normalized_phone, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  -- ★ 병원 환자 캐시 동기화 (신규 추가)
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


-- recall_treatment_atomic with p_hospital_id
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
  v_treatment RECORD;
  v_code_ids UUID[];
  v_count INT := 0;
BEGIN
  -- Get treatment info with lock
  SELECT * INTO v_treatment
  FROM treatment_records
  WHERE id = p_treatment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR, '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check ownership
  IF v_treatment.hospital_id != p_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR, '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Check 24-hour limit (using created_at)
  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR, '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- Get all virtual code IDs for this treatment
  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td
  WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR, '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- BULK UPDATE: ownership back to hospital and status to IN_STOCK
  UPDATE virtual_codes
  SET owner_id = p_hospital_id::VARCHAR,
      owner_type = 'ORGANIZATION',
      status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Delete treatment details
  DELETE FROM treatment_details WHERE treatment_id = p_treatment_id;

  -- Delete treatment record
  DELETE FROM treatment_records WHERE id = p_treatment_id;

  -- BULK INSERT: recall history
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    is_recall,
    recall_reason
  )
  SELECT
    UNNEST(v_code_ids),
    'RECALLED'::history_action_type,
    'PATIENT'::owner_type,
    v_treatment.patient_phone,
    'ORGANIZATION'::owner_type,
    p_hospital_id::VARCHAR,
    TRUE,
    p_reason;

  -- ★ 병원 환자 캐시 동기화 (신규 추가)
  PERFORM decrement_hospital_known_patient(p_hospital_id, v_treatment.patient_phone);

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

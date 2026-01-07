-- =============================================================================
-- 병원 폐기 기능 (Hospital Disposal Feature)
--
-- 목적: 병원에서 시술 중 손실, 유효기간 만료, 제품 불량 등의 이유로
--       재고 제품을 자발적으로 폐기할 수 있는 기능 추가
--
-- 변경 사항:
-- 1. disposal_reason_type ENUM 생성
-- 2. disposal_records 테이블 생성
-- 3. disposal_details 테이블 생성
-- 4. histories 테이블에 disposal_id 컬럼 추가
-- 5. create_disposal_atomic() RPC 함수 생성
-- 6. RLS 정책 설정
-- =============================================================================

-- 1. Enum: 폐기 사유 타입
CREATE TYPE disposal_reason_type AS ENUM (
  'TREATMENT_LOSS',  -- 시술 중 손실
  'EXPIRED',         -- 유효기간 만료
  'DEFECTIVE',       -- 제품 불량
  'OTHER'            -- 기타
);

-- 2. disposal_records 테이블: 폐기 기록
CREATE TABLE IF NOT EXISTS disposal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  disposal_date DATE NOT NULL,
  disposal_reason_type disposal_reason_type NOT NULL,
  disposal_reason_custom TEXT,  -- OTHER 선택 시 필수
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 제약조건: OTHER 선택 시 custom 사유 필수
  CONSTRAINT chk_disposal_reason_consistency CHECK (
    (disposal_reason_type != 'OTHER' AND disposal_reason_custom IS NULL) OR
    (disposal_reason_type = 'OTHER' AND disposal_reason_custom IS NOT NULL AND TRIM(disposal_reason_custom) != '')
  )
);

-- 3. disposal_details 테이블: 폐기 상세 (코드별)
CREATE TABLE IF NOT EXISTS disposal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disposal_id UUID NOT NULL REFERENCES disposal_records(id) ON DELETE CASCADE,
  virtual_code_id UUID NOT NULL REFERENCES virtual_codes(id) ON DELETE RESTRICT
);

-- 4. histories 테이블에 disposal_id 컬럼 추가
ALTER TABLE histories ADD COLUMN IF NOT EXISTS disposal_id UUID REFERENCES disposal_records(id) ON DELETE SET NULL;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_disposal_records_hospital_id ON disposal_records(hospital_id);
CREATE INDEX IF NOT EXISTS idx_disposal_records_created_at ON disposal_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disposal_records_disposal_date ON disposal_records(disposal_date DESC);
CREATE INDEX IF NOT EXISTS idx_disposal_details_disposal_id ON disposal_details(disposal_id);
CREATE INDEX IF NOT EXISTS idx_disposal_details_virtual_code_id ON disposal_details(virtual_code_id);
CREATE INDEX IF NOT EXISTS idx_histories_disposal_id ON histories(disposal_id) WHERE disposal_id IS NOT NULL;

-- 6. RLS 활성화
ALTER TABLE disposal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_details ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책: disposal_records
-- 병원은 자신의 폐기 기록만 조회 가능, Admin은 전체 조회 가능
CREATE POLICY "Hospitals can view own disposal records"
  ON disposal_records FOR SELECT
  USING (hospital_id = get_user_organization_id() OR is_admin());

CREATE POLICY "Hospitals can insert own disposal records"
  ON disposal_records FOR INSERT
  WITH CHECK (hospital_id = get_user_organization_id());

-- 8. RLS 정책: disposal_details
CREATE POLICY "Users can view disposal details of own records"
  ON disposal_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM disposal_records dr
      WHERE dr.id = disposal_id
      AND (dr.hospital_id = get_user_organization_id() OR is_admin())
    )
  );

CREATE POLICY "Users can insert disposal details for own records"
  ON disposal_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM disposal_records dr
      WHERE dr.id = disposal_id
      AND dr.hospital_id = get_user_organization_id()
    )
  );

-- 9. RPC 함수: create_disposal_atomic (SECURITY DEFINER 버전)
-- 병원이 FIFO 방식으로 재고를 폐기하는 원자적 함수
CREATE OR REPLACE FUNCTION "public"."create_disposal_atomic"(
  "p_disposal_date" DATE,
  "p_disposal_reason_type" disposal_reason_type,
  "p_disposal_reason_custom" TEXT,
  "p_items" JSONB
)
RETURNS TABLE(
  "disposal_id" UUID,
  "total_quantity" INTEGER,
  "error_code" VARCHAR,
  "error_message" VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital_id UUID;
  v_hospital_type organization_type;
  v_disposal_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  -- 1. 인증된 사용자의 조직 ID 가져오기
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR, '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 2. 병원 조직 유형 확인
  v_hospital_type := get_user_organization_type();
  IF v_hospital_type != 'HOSPITAL' THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'FORBIDDEN'::VARCHAR, '병원만 폐기를 등록할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 3. 병원 활성 상태 확인
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = v_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR, '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 4. 사유 일관성 검증 (OTHER 선택 시 custom 필수)
  IF p_disposal_reason_type = 'OTHER' AND (p_disposal_reason_custom IS NULL OR TRIM(p_disposal_reason_custom) = '') THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'REASON_REQUIRED'::VARCHAR, '기타 사유를 입력해주세요.'::VARCHAR;
    RETURN;
  END IF;

  -- 5. 폐기 기록 생성
  INSERT INTO disposal_records (
    hospital_id,
    disposal_date,
    disposal_reason_type,
    disposal_reason_custom
  )
  VALUES (
    v_hospital_id,
    p_disposal_date,
    p_disposal_reason_type,
    CASE WHEN p_disposal_reason_type = 'OTHER' THEN TRIM(p_disposal_reason_custom) ELSE NULL END
  )
  RETURNING id INTO v_disposal_id;

  -- 6. 각 제품별 FIFO 선택 및 폐기 처리
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- FIFO 기반 코드 선택 (가장 오래된 lot부터)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_id = v_hospital_id::VARCHAR
        AND vc.owner_type = 'ORGANIZATION'
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    -- 재고 부족 확인
    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    -- 각 코드별 처리
    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      -- 폐기 상세 기록
      INSERT INTO disposal_details (disposal_id, virtual_code_id)
      VALUES (v_disposal_id, v_code_id);

      -- 가상 코드 상태 변경: IN_STOCK -> DISPOSED (소유자는 유지)
      UPDATE virtual_codes
      SET status = 'DISPOSED', updated_at = NOW()
      WHERE id = v_code_id;

      -- 이력 기록: DISPOSED 액션
      INSERT INTO histories (
        virtual_code_id,
        action_type,
        from_owner_type,
        from_owner_id,
        to_owner_type,
        to_owner_id,
        disposal_id,
        is_recall
      ) VALUES (
        v_code_id,
        'DISPOSED',
        'ORGANIZATION',
        v_hospital_id::VARCHAR,
        'ORGANIZATION',
        v_hospital_id::VARCHAR,  -- 폐기는 동일 조직 내에서 발생
        v_disposal_id,
        FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_disposal_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR, SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;

-- 10. 권한 부여
GRANT ALL ON disposal_records TO authenticated;
GRANT ALL ON disposal_details TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."create_disposal_atomic"(DATE, disposal_reason_type, TEXT, JSONB) TO authenticated;

-- =============================================================================
-- 반품 체인 지원 및 부분 반품 기능
--
-- 목적:
-- 1. 반품 체인 지원: A→B→C 출고 후 C→B→A 재반품 가능
-- 2. 부분 반품 지원: 배치 전체가 아닌 일부 수량만 반품 가능 (FIFO 적용)
--
-- 변경 사항:
-- 1. shipment_batches에 parent_batch_id, is_return_batch 컬럼 추가
-- 2. return_shipment_atomic() 함수 재작성 (반품 배치 생성 + 부분 반품)
-- =============================================================================

-- 1. shipment_batches 테이블에 새 컬럼 추가
-- parent_batch_id: 반품 배치가 참조하는 원래 출고/반품 배치
-- is_return_batch: 이 배치가 반품으로 생성되었는지 여부
ALTER TABLE "public"."shipment_batches"
  ADD COLUMN IF NOT EXISTS "parent_batch_id" UUID REFERENCES "public"."shipment_batches"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "is_return_batch" BOOLEAN DEFAULT FALSE NOT NULL;

-- 인덱스 생성 (반품 체인 조회 최적화)
CREATE INDEX IF NOT EXISTS "idx_shipment_batches_parent" ON "public"."shipment_batches"("parent_batch_id") WHERE "parent_batch_id" IS NOT NULL;

-- 설명 추가
COMMENT ON COLUMN "public"."shipment_batches"."parent_batch_id" IS '반품 배치가 참조하는 원래 출고/반품 배치 ID. 반품 체인 추적에 사용.';
COMMENT ON COLUMN "public"."shipment_batches"."is_return_batch" IS '이 배치가 반품으로 생성되었는지 여부. TRUE면 from→to가 수신자→발송자 방향.';

-- 2. return_shipment_atomic() 함수 재작성 (DROP + CREATE)
-- 기존 함수 삭제 (파라미터 시그니처 변경)
DROP FUNCTION IF EXISTS "public"."return_shipment_atomic"(UUID, VARCHAR);

-- 새 함수 생성 (부분 반품 + 재반품 지원)
CREATE OR REPLACE FUNCTION "public"."return_shipment_atomic"(
  "p_shipment_batch_id" UUID,
  "p_reason" VARCHAR,
  "p_product_quantities" JSONB DEFAULT NULL  -- [{"productId": "...", "quantity": 3}]
                                              -- NULL이면 전량 반품
)
RETURNS TABLE(
  "success" BOOLEAN,
  "returned_count" INTEGER,
  "new_batch_id" UUID,
  "error_code" VARCHAR,
  "error_message" VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_org_id UUID;
  v_batch RECORD;
  v_all_code_ids UUID[];
  v_owned_code_ids UUID[];
  v_selected_code_ids UUID[];
  v_sender_org_id UUID;
  v_sender_org_type organization_type;
  v_new_batch_id UUID;
  v_count INT := 0;
  v_item RECORD;
  v_product_code_ids UUID[];
  v_quantity_to_select INT;
BEGIN
  -- 1. 인증된 사용자의 조직 ID 가져오기
  v_recipient_org_id := get_user_organization_id();

  IF v_recipient_org_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 2. 출고 뭉치 정보 조회 (락 획득)
  SELECT * INTO v_batch
  FROM shipment_batches
  WHERE id = p_shipment_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'BATCH_NOT_FOUND'::VARCHAR,
      '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 3. 반품 대상(발송자) 결정
  -- 일반 출고 배치: from_organization_id가 발송자
  -- 반품 배치: 수신자(to_organization_id)에서 왔으므로 from_organization_id가 반품자
  v_sender_org_id := v_batch.from_organization_id;

  -- 발송자의 조직 타입 조회
  SELECT type INTO v_sender_org_type
  FROM organizations
  WHERE id = v_sender_org_id;

  IF v_sender_org_type IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '발송 조직 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 4. 해당 배치의 모든 가상 코드 ID 조회
  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_all_code_ids
  FROM shipment_details sd
  WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_all_code_ids IS NULL OR array_length(v_all_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'NO_DETAILS'::VARCHAR,
      '반품할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 5. 현재 조직이 소유한 코드만 필터링 (재반품 지원: 소유권 기반 검증)
  SELECT ARRAY_AGG(vc.id) INTO v_owned_code_ids
  FROM virtual_codes vc
  WHERE vc.id = ANY(v_all_code_ids)
    AND vc.owner_id = v_recipient_org_id::VARCHAR
    AND vc.owner_type = 'ORGANIZATION';

  IF v_owned_code_ids IS NULL OR array_length(v_owned_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'CODES_NOT_OWNED'::VARCHAR,
      '반품할 제품이 없습니다. 현재 조직이 소유한 코드가 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 6. 반품 대상 코드 선택 (전량 or 부분)
  IF p_product_quantities IS NULL THEN
    -- 전량 반품: 소유한 모든 코드 반품
    v_selected_code_ids := v_owned_code_ids;
  ELSE
    -- 부분 반품: 수량 지정에 따라 FIFO로 선택
    v_selected_code_ids := ARRAY[]::UUID[];

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_product_quantities)
      AS x("productId" UUID, "quantity" INT)
    LOOP
      v_quantity_to_select := v_item."quantity";

      -- 해당 제품의 코드를 FIFO 순서로 선택 (오래된 제조일 우선)
      SELECT ARRAY_AGG(sub.id ORDER BY sub.manufacture_date, sub.created_at)
      INTO v_product_code_ids
      FROM (
        SELECT vc.id, l.manufacture_date, vc.created_at
        FROM virtual_codes vc
        JOIN lots l ON vc.lot_id = l.id
        WHERE vc.id = ANY(v_owned_code_ids)
          AND l.product_id = v_item."productId"
        ORDER BY l.manufacture_date ASC, vc.created_at ASC
        LIMIT v_quantity_to_select
      ) sub;

      IF v_product_code_ids IS NOT NULL AND array_length(v_product_code_ids, 1) > 0 THEN
        v_selected_code_ids := v_selected_code_ids || v_product_code_ids;
      END IF;
    END LOOP;

    IF array_length(v_selected_code_ids, 1) IS NULL OR array_length(v_selected_code_ids, 1) = 0 THEN
      RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'NO_MATCHING_CODES'::VARCHAR,
        '선택한 제품/수량에 해당하는 코드가 없습니다.'::VARCHAR;
      RETURN;
    END IF;
  END IF;

  -- 7. 새 반품 배치 생성 (후속 반품 가능하도록)
  INSERT INTO shipment_batches (
    from_organization_id,
    to_organization_id,
    to_organization_type,
    parent_batch_id,
    is_return_batch,
    is_recalled,
    recall_reason,
    recall_date
  ) VALUES (
    v_recipient_org_id,       -- 반품 요청자 (현재 조직)
    v_sender_org_id,          -- 반품 받는 조직 (원래 발송자)
    v_sender_org_type,        -- 발송자 조직 타입
    p_shipment_batch_id,      -- 원래 배치 참조
    TRUE,                     -- 반품 배치 표시
    FALSE,                    -- 이 새 배치는 아직 반품되지 않음
    NULL,
    NULL
  ) RETURNING id INTO v_new_batch_id;

  -- 8. shipment_details 생성 (새 배치용)
  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT v_new_batch_id, UNNEST(v_selected_code_ids);

  -- 9. 코드 소유권을 발송자에게 이전
  UPDATE virtual_codes
  SET owner_id = v_sender_org_id::VARCHAR,
      owner_type = 'ORGANIZATION',
      updated_at = NOW()
  WHERE id = ANY(v_selected_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 10. 반품 이력 기록 (action_type = 'RETURNED')
  INSERT INTO histories (
    virtual_code_id,
    action_type,
    from_owner_type,
    from_owner_id,
    to_owner_type,
    to_owner_id,
    shipment_batch_id,
    is_recall,
    recall_reason
  )
  SELECT
    UNNEST(v_selected_code_ids),
    'RETURNED'::history_action_type,
    'ORGANIZATION'::owner_type,
    v_recipient_org_id::VARCHAR,           -- 반품 요청자 (현재 조직)
    'ORGANIZATION'::owner_type,
    v_sender_org_id::VARCHAR,              -- 반품 받는 조직
    v_new_batch_id,                        -- 새 배치 ID 참조
    TRUE,
    p_reason;

  -- 11. 전량 반품인 경우 원래 배치도 반품 완료 표시
  IF p_product_quantities IS NULL AND
     array_length(v_owned_code_ids, 1) = array_length(v_all_code_ids, 1) THEN
    UPDATE shipment_batches
    SET is_recalled = TRUE,
        recall_reason = p_reason,
        recall_date = NOW()
    WHERE id = p_shipment_batch_id
      AND is_recalled = FALSE;  -- 이미 반품되지 않은 경우만
  END IF;

  RETURN QUERY SELECT TRUE, v_count, v_new_batch_id, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

-- 함수 소유자 설정
ALTER FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB) OWNER TO postgres;

-- 함수 설명 추가
COMMENT ON FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB) IS
  '출고 반품 (소유권 기반 검증, 반품 체인 지원, 부분 반품 가능).
   - p_shipment_batch_id: 반품할 원래 출고/반품 배치 ID
   - p_reason: 반품 사유 (필수)
   - p_product_quantities: 부분 반품 시 제품별 수량 [{"productId": "...", "quantity": 3}], NULL이면 전량 반품
   반품 시 새로운 반품 배치가 생성되어 후속 반품이 가능합니다.';

-- 권한 부여
GRANT EXECUTE ON FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR, JSONB) TO authenticated;

-- =============================================================================
-- 출고 회수 → 반품 시스템 변경
--
-- 목적: 기존 발송자 주도의 "회수"를 수신자 주도의 "반품"으로 변경
--       - 출고(조직 간): 수신자 주도 반품, 24시간 제한 제거
--       - 시술(병원→환자): 기존 병원 주도 회수, 24시간 제한 유지
--
-- 변경 사항:
-- 1. history_action_type ENUM에 'RETURNED' 추가
-- 2. return_shipment_atomic() RPC 함수 생성
-- 3. 기존 recall_shipment_atomic()은 유지 (호환성)
-- =============================================================================

-- 1. history_action_type에 'RETURNED' 추가
-- Note: ALTER TYPE ADD VALUE cannot be executed inside a transaction block
-- Supabase migrations run in a transaction, so we use a workaround
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'RETURNED'
    AND enumtypid = 'history_action_type'::regtype
  ) THEN
    ALTER TYPE history_action_type ADD VALUE 'RETURNED';
  END IF;
END $$;

-- 2. return_shipment_atomic() 함수 생성 (SECURITY DEFINER 버전)
-- 수신자(to_organization_id)가 호출하여 발송자(from_organization_id)에게 반품
CREATE OR REPLACE FUNCTION "public"."return_shipment_atomic"(
  "p_shipment_batch_id" UUID,
  "p_reason" VARCHAR
)
RETURNS TABLE(
  "success" BOOLEAN,
  "returned_count" INTEGER,
  "error_code" VARCHAR,
  "error_message" VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_org_id UUID;
  v_batch RECORD;
  v_code_ids UUID[];
  v_not_owned_count INT;
  v_count INT := 0;
BEGIN
  -- 1. 인증된 사용자의 조직 ID 가져오기 (수신자)
  v_recipient_org_id := get_user_organization_id();

  IF v_recipient_org_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 2. 출고 뭉치 정보 조회 (락 획득)
  SELECT * INTO v_batch
  FROM shipment_batches
  WHERE id = p_shipment_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'BATCH_NOT_FOUND'::VARCHAR,
      '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 3. 수신자 권한 확인 (발송자가 아닌 수신자만 반품 가능)
  IF v_batch.to_organization_id != v_recipient_org_id THEN
    RETURN QUERY SELECT FALSE, 0, 'FORBIDDEN'::VARCHAR,
      '수신 조직만 반품을 요청할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 4. 이미 반품/회수된 건인지 확인
  IF v_batch.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RETURNED'::VARCHAR,
      '이미 반품된 출고 뭉치입니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 5. 24시간 제한 체크 제거됨 (반품은 시간 제한 없음)

  -- 6. 해당 뭉치의 모든 가상 코드 ID 조회
  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_code_ids
  FROM shipment_details sd
  WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR,
      '반품할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 7. 소유권 검증: 모든 코드가 현재 수신자(반품 요청자) 소유인지 확인
  SELECT COUNT(*) INTO v_not_owned_count
  FROM virtual_codes vc
  WHERE vc.id = ANY(v_code_ids)
    AND (vc.owner_id != v_recipient_org_id::VARCHAR OR vc.owner_type != 'ORGANIZATION');

  IF v_not_owned_count > 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'CODES_NOT_OWNED'::VARCHAR,
      '일부 제품이 더 이상 현재 조직 소유가 아닙니다. 하위 조직에서 먼저 반품해야 합니다.'::VARCHAR;
    RETURN;
  END IF;

  -- 8. 코드 소유권을 발송자에게 반환
  UPDATE virtual_codes
  SET owner_id = v_batch.from_organization_id::VARCHAR,
      owner_type = 'ORGANIZATION',
      updated_at = NOW()
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 9. 출고 뭉치 반품 상태 업데이트 (기존 컬럼 재사용)
  UPDATE shipment_batches
  SET is_recalled = TRUE,
      recall_reason = p_reason,
      recall_date = NOW()
  WHERE id = p_shipment_batch_id;

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
    UNNEST(v_code_ids),
    'RETURNED'::history_action_type,
    'ORGANIZATION'::owner_type,
    v_recipient_org_id::VARCHAR,           -- 반품 요청자 (수신자)
    'ORGANIZATION'::owner_type,
    v_batch.from_organization_id::VARCHAR, -- 반품 받는 조직 (발송자)
    p_shipment_batch_id,
    TRUE,
    p_reason;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

-- 함수 소유자 설정
ALTER FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR) OWNER TO postgres;

-- 함수 설명 추가
COMMENT ON FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR) IS
  '출고 반품 (수신자 주도, 시간 제한 없음). 수신 조직이 발송 조직에게 제품을 반품합니다.';

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION "public"."return_shipment_atomic"(UUID, VARCHAR) TO authenticated;

-- 4. is_recall_allowed() 함수는 치료 회수에만 사용되므로 유지
-- recall_shipment_atomic()도 호환성을 위해 유지하지만, 서비스에서는 사용하지 않음

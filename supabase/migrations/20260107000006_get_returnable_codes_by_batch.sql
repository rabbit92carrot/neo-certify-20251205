-- =============================================================================
-- 반품 가능 코드 조회 함수
--
-- 목적:
-- 반품 다이얼로그에서 현재 보유 중인 코드 수량을 조회하기 위함
-- 원래 수량 vs 현재 보유 수량을 비교하여 UI에 표시
--
-- 사용처:
-- - TransactionHistoryTable 반품 다이얼로그 오픈 시 lazy load
-- - 부분 반품 시 max 수량 제한
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."get_returnable_codes_by_batch"(
  "p_shipment_batch_id" UUID
)
RETURNS TABLE(
  "product_id" UUID,
  "product_name" VARCHAR,
  "model_name" VARCHAR,
  "original_quantity" INTEGER,
  "owned_quantity" INTEGER,
  "codes" TEXT[]
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_org_id UUID;
BEGIN
  -- 1. 호출자의 조직 ID 가져오기
  v_caller_org_id := get_user_organization_id();

  IF v_caller_org_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. 배치별 제품 요약 반환 (원래 수량 + 현재 보유 수량)
  RETURN QUERY
  WITH batch_codes AS (
    -- 해당 배치의 모든 코드
    SELECT sd.virtual_code_id
    FROM shipment_details sd
    WHERE sd.shipment_batch_id = p_shipment_batch_id
  ),
  code_details AS (
    -- 코드별 상세 정보 (소유 여부 포함)
    SELECT
      vc.id AS code_id,
      vc.code AS code_string,
      l.product_id,
      p.name AS product_name,
      p.model_name,
      CASE
        WHEN vc.owner_id = v_caller_org_id::VARCHAR
             AND vc.owner_type = 'ORGANIZATION'
        THEN 1
        ELSE 0
      END AS is_owned
    FROM batch_codes bc
    JOIN virtual_codes vc ON vc.id = bc.virtual_code_id
    JOIN lots l ON l.id = vc.lot_id
    JOIN products p ON p.id = l.product_id
  )
  SELECT
    cd.product_id,
    cd.product_name::VARCHAR,
    cd.model_name::VARCHAR,
    COUNT(*)::INTEGER AS original_quantity,
    SUM(cd.is_owned)::INTEGER AS owned_quantity,
    ARRAY_AGG(cd.code_string) FILTER (WHERE cd.is_owned = 1) AS codes
  FROM code_details cd
  GROUP BY cd.product_id, cd.product_name, cd.model_name
  ORDER BY cd.product_name;
END;
$$;

-- 함수 소유자 설정
ALTER FUNCTION "public"."get_returnable_codes_by_batch"(UUID) OWNER TO postgres;

-- 함수 설명
COMMENT ON FUNCTION "public"."get_returnable_codes_by_batch"(UUID) IS
  '반품 가능 코드 조회. 배치의 제품별 원래 수량과 현재 보유 수량을 반환.
   반품 다이얼로그에서 lazy load로 호출됨.';

-- 권한 부여
GRANT EXECUTE ON FUNCTION "public"."get_returnable_codes_by_batch"(UUID) TO authenticated;

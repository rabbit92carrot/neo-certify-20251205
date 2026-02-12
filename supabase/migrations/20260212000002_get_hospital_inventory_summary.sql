-- ============================================================================
-- Issue #43: 병원 전용 재고 요약 RPC
--
-- 기존 get_inventory_summary + get_hospital_known_products 2회 호출을
-- 단일 RPC로 통합하여 병원 재고 페이지 데이터 일관성 확보
--
-- 반환 필드:
--   - product_id, product_name, model_name, udi_di, quantity (기존 동일)
--   - product_is_active: 제조사 글로벌 활성화 상태
--   - hkp_is_active: 병원 로컬 활성화 상태 (NULL = HKP 레코드 없음)
--   - alias: 병원 별칭 (NULL = 별칭 미설정)
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."get_hospital_inventory_summary"(
    p_hospital_id UUID
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    model_name TEXT,
    udi_di TEXT,
    quantity BIGINT,
    product_is_active BOOLEAN,
    hkp_is_active BOOLEAN,
    alias VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name::TEXT AS product_name,
        COALESCE(p.model_name, '')::TEXT AS model_name,
        COALESCE(p.udi_di, '')::TEXT AS udi_di,
        COUNT(vc.id) AS quantity,
        p.is_active AS product_is_active,
        hkp.is_active AS hkp_is_active,
        hkp.alias
    FROM virtual_codes vc
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    LEFT JOIN hospital_known_products hkp
        ON hkp.product_id = p.id
        AND hkp.hospital_id = p_hospital_id
    WHERE vc.owner_id = p_hospital_id::VARCHAR
      AND vc.owner_type = 'ORGANIZATION'
      AND vc.status = 'IN_STOCK'
    GROUP BY p.id, p.name, p.model_name, p.udi_di, p.is_active, hkp.is_active, hkp.alias
    ORDER BY p.is_active DESC, p.name, p.model_name;
END;
$$;

COMMENT ON FUNCTION "public"."get_hospital_inventory_summary"(UUID)
    IS '병원 전용 재고 요약 조회 (제품 활성화 상태 + HKP 상태 + 별칭 포함)';

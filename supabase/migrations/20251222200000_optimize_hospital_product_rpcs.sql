-- ============================================================================
-- 병원 제품 조회 RPC 성능 최적화
--
-- 기존: correlated subquery로 각 제품별 재고 조회 (N+1 패턴)
-- 변경: CTE + LEFT JOIN으로 재고 일괄 집계 후 조인 (1회 스캔)
--
-- 성능 비교:
-- - 기존: O(n) 서브쿼리 (제품 수만큼 반복)
-- - 변경: O(1) CTE 집계 + O(1) 조인 (제품 수와 무관)
-- ============================================================================

-- ============================================================================
-- 1. get_hospital_known_products 최적화
--    (correlated subquery → CTE + LEFT JOIN)
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."get_hospital_known_products"(
    p_hospital_id UUID,
    p_search TEXT DEFAULT NULL,
    p_alias_filter TEXT DEFAULT NULL,  -- 'with_alias', 'without_alias', NULL (전체)
    p_active_filter BOOLEAN DEFAULT NULL  -- true (활성만), false (비활성만), NULL (전체)
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
        -- 병원의 모든 제품별 재고를 한 번에 집계
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
        p.model_name,
        p.udi_di,
        hkp.alias,
        hkp.is_active,
        hkp.first_received_at,
        COALESCE(ic.stock_count, 0)::BIGINT AS current_inventory
    FROM hospital_known_products hkp
    JOIN products p ON hkp.product_id = p.id
    LEFT JOIN inventory_counts ic ON ic.product_id = hkp.product_id
    WHERE hkp.hospital_id = p_hospital_id
      -- 검색 필터 (별칭, 제품명, 모델명)
      AND (
          p_search IS NULL
          OR p_search = ''
          OR p.name ILIKE '%' || p_search || '%'
          OR p.model_name ILIKE '%' || p_search || '%'
          OR hkp.alias ILIKE '%' || p_search || '%'
      )
      -- 별칭 필터
      AND (
          p_alias_filter IS NULL
          OR (p_alias_filter = 'with_alias' AND hkp.alias IS NOT NULL)
          OR (p_alias_filter = 'without_alias' AND hkp.alias IS NULL)
      )
      -- 활성화 필터
      AND (
          p_active_filter IS NULL
          OR hkp.is_active = p_active_filter
      )
    ORDER BY
        hkp.is_active DESC,  -- 활성 제품 먼저
        CASE WHEN hkp.alias IS NOT NULL THEN 0 ELSE 1 END,  -- 별칭 있는 제품 먼저
        p.name ASC;
END;
$$;

COMMENT ON FUNCTION "public"."get_hospital_known_products"(UUID, TEXT, TEXT, BOOLEAN)
    IS '병원의 known products 목록 조회 (CTE 최적화: correlated subquery 제거)';

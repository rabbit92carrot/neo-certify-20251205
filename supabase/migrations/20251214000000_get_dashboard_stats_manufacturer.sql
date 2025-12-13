-- 제조사 대시보드 통계 통합 함수
-- 4개의 개별 쿼리를 1개의 RPC 호출로 통합하여 DB 왕복 75% 감소
CREATE OR REPLACE FUNCTION get_dashboard_stats_manufacturer(p_organization_id UUID)
RETURNS TABLE (
  total_inventory BIGINT,
  today_production BIGINT,
  today_shipments BIGINT,
  active_products BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 재고량: 현재 보유 중인 가상 코드 수
    (
      SELECT COALESCE(COUNT(vc.id), 0)::BIGINT
      FROM virtual_codes vc
      INNER JOIN lots l ON l.id = vc.lot_id
      INNER JOIN products p ON p.id = l.product_id
      WHERE p.organization_id = p_organization_id
        AND vc.owner_id = p_organization_id::TEXT
        AND vc.owner_type = 'ORGANIZATION'
        AND vc.status = 'IN_STOCK'
    ) AS total_inventory,

    -- 2. 오늘 생산량: 오늘 생성된 Lot의 수량 합계
    (
      SELECT COALESCE(SUM(l.quantity), 0)::BIGINT
      FROM lots l
      INNER JOIN products p ON p.id = l.product_id
      WHERE p.organization_id = p_organization_id
        AND l.created_at >= v_today_start
        AND l.created_at < v_today_end
    ) AS today_production,

    -- 3. 오늘 출고량: 오늘 출고된 가상 코드 수
    (
      SELECT COALESCE(COUNT(sd.id), 0)::BIGINT
      FROM shipment_details sd
      INNER JOIN shipment_batches sb ON sb.id = sd.shipment_batch_id
      WHERE sb.from_organization_id = p_organization_id
        AND sb.shipment_date >= v_today_start
        AND sb.shipment_date < v_today_end
        AND sb.is_recalled = FALSE
    ) AS today_shipments,

    -- 4. 활성 제품 수
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM products
      WHERE organization_id = p_organization_id
        AND is_active = TRUE
    ) AS active_products;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_dashboard_stats_manufacturer(UUID) TO authenticated;

COMMENT ON FUNCTION get_dashboard_stats_manufacturer(UUID) IS
  '제조사 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';

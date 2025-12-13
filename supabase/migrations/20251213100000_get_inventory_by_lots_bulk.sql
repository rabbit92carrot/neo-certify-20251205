-- 여러 제품의 Lot별 재고를 한 번에 조회하는 함수 (N+1 쿼리 방지)
-- 출고 페이지에서 제품별 Lot 정보를 효율적으로 조회하기 위해 사용
CREATE OR REPLACE FUNCTION get_inventory_by_lots_bulk(
  p_owner_id UUID,
  p_product_ids UUID[]
)
RETURNS TABLE (
  product_id UUID,
  lot_id UUID,
  lot_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  quantity BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    l.product_id,
    l.id AS lot_id,
    l.lot_number,
    l.manufacture_date,
    l.expiry_date,
    COUNT(vc.id)::BIGINT AS quantity
  FROM lots l
  INNER JOIN virtual_codes vc ON vc.lot_id = l.id
  WHERE
    l.product_id = ANY(p_product_ids)
    AND vc.owner_id = p_owner_id
    AND vc.status = 'ACTIVE'
  GROUP BY l.id, l.product_id, l.lot_number, l.manufacture_date, l.expiry_date
  HAVING COUNT(vc.id) > 0
  ORDER BY l.manufacture_date ASC, l.lot_number ASC;
$$;

-- authenticated 역할에 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_inventory_by_lots_bulk(UUID, UUID[]) TO authenticated;

COMMENT ON FUNCTION get_inventory_by_lots_bulk IS '여러 제품의 Lot별 재고를 한 번에 조회 (N+1 쿼리 방지용)';

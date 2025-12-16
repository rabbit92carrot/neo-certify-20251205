-- =====================================================
-- Migration: 20251216150000_update_inventory_summary_with_model
-- Description: 재고 요약에 model_name, udi_code 추가
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경을 위해 필요)
DROP FUNCTION IF EXISTS get_inventory_summary(UUID);

-- 재고 요약 조회 함수 업데이트 (model_name, udi_di 추가)
CREATE OR REPLACE FUNCTION get_inventory_summary(p_owner_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  model_name TEXT,
  udi_di TEXT,
  quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name::TEXT AS product_name,
    COALESCE(p.model_name, '')::TEXT AS model_name,
    COALESCE(p.udi_di, '')::TEXT AS udi_di,
    COUNT(vc.id) AS quantity
  FROM virtual_codes vc
  INNER JOIN lots l ON l.id = vc.lot_id
  INNER JOIN products p ON p.id = l.product_id
  WHERE vc.owner_id = p_owner_id::VARCHAR
    AND vc.owner_type = 'ORGANIZATION'
    AND vc.status = 'IN_STOCK'
  GROUP BY p.id, p.name, p.model_name, p.udi_di
  ORDER BY p.name, p.model_name;
END;
$$;

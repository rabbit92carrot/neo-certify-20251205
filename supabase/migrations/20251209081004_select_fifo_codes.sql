-- Migration: 20251209081004_select_fifo_codes
-- Description: Create select_fifo_codes function

CREATE OR REPLACE FUNCTION select_fifo_codes(
  p_product_id UUID,
  p_owner_id VARCHAR,
  p_quantity INT,
  p_lot_id UUID DEFAULT NULL
)
RETURNS TABLE(virtual_code_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT vc.id
  FROM virtual_codes vc
  JOIN lots l ON vc.lot_id = l.id
  WHERE l.product_id = p_product_id
    AND vc.status = 'IN_STOCK'
    AND vc.owner_id = p_owner_id
    AND (p_lot_id IS NULL OR vc.lot_id = p_lot_id)
  ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
  LIMIT p_quantity
  FOR UPDATE OF vc SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;


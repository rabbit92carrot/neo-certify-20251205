-- Migration: 20251209081007_get_inventory_by_lot
-- Description: Create get_inventory_by_lot function

CREATE OR REPLACE FUNCTION get_inventory_by_lot(
  p_product_id UUID,
  p_owner_id VARCHAR
)
RETURNS TABLE(
  lot_id UUID,
  lot_number VARCHAR,
  manufacture_date DATE,
  expiry_date DATE,
  quantity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.lot_number,
    l.manufacture_date,
    l.expiry_date,
    COUNT(vc.id)
  FROM lots l
  LEFT JOIN virtual_codes vc ON vc.lot_id = l.id
    AND vc.owner_id = p_owner_id
    AND vc.status = 'IN_STOCK'
  WHERE l.product_id = p_product_id
  GROUP BY l.id, l.lot_number, l.manufacture_date, l.expiry_date
  HAVING COUNT(vc.id) > 0
  ORDER BY l.manufacture_date ASC, l.created_at ASC;
END;
$$ LANGUAGE plpgsql;


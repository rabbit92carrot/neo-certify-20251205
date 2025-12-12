-- Migration: 20251209081006_get_inventory_count
-- Description: Create get_inventory_count function

CREATE OR REPLACE FUNCTION get_inventory_count(
  p_product_id UUID,
  p_owner_id VARCHAR
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM virtual_codes vc
  JOIN lots l ON vc.lot_id = l.id
  WHERE l.product_id = p_product_id
    AND vc.owner_id = p_owner_id
    AND vc.status = 'IN_STOCK';

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;


-- Migration: 20251212083602_add_quantity_to_lot_bulk
-- Description: Optimized add_quantity_to_lot function with BULK INSERT

CREATE OR REPLACE FUNCTION add_quantity_to_lot(
  p_lot_id UUID,
  p_additional_quantity INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_manufacturer_id UUID;
  v_current_quantity INT;
  v_new_quantity INT;
BEGIN
  -- Input validation
  IF p_additional_quantity <= 0 THEN
    RAISE EXCEPTION 'Additional quantity must be positive: %', p_additional_quantity;
  END IF;

  -- Get current Lot info
  SELECT l.quantity, p.organization_id
  INTO v_current_quantity, v_manufacturer_id
  FROM lots l
  JOIN products p ON p.id = l.product_id
  WHERE l.id = p_lot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot not found: %', p_lot_id;
  END IF;

  -- Maximum quantity check (100,000 limit)
  v_new_quantity := v_current_quantity + p_additional_quantity;
  IF v_new_quantity > 100000 THEN
    RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000): current=%, additional=%, total=%',
      v_current_quantity, p_additional_quantity, v_new_quantity;
  END IF;

  -- Update quantity
  UPDATE lots
  SET quantity = v_new_quantity
  WHERE id = p_lot_id;

  -- BULK INSERT: Generate virtual_codes in single query
  INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
  SELECT
    generate_virtual_code(),
    p_lot_id,
    'IN_STOCK',
    'ORGANIZATION',
    v_manufacturer_id::VARCHAR
  FROM generate_series(1, p_additional_quantity);

  RETURN v_new_quantity;
END;
$$;


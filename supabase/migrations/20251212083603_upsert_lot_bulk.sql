-- Migration: 20251212083603_upsert_lot_bulk
-- Description: Optimized upsert_lot function with BULK INSERT

CREATE OR REPLACE FUNCTION upsert_lot(
  p_product_id UUID,
  p_lot_number VARCHAR,
  p_quantity INT,
  p_manufacture_date DATE,
  p_expiry_date DATE
)
RETURNS TABLE (
  lot_id UUID,
  lot_number VARCHAR,
  total_quantity INT,
  is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_lot_id UUID;
  v_existing_quantity INT;
  v_manufacturer_id UUID;
  v_new_quantity INT;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Get manufacturer ID
  SELECT organization_id INTO v_manufacturer_id
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- Check existing Lot
  SELECT l.id, l.quantity
  INTO v_existing_lot_id, v_existing_quantity
  FROM lots l
  WHERE l.product_id = p_product_id
    AND l.lot_number = p_lot_number;

  IF FOUND THEN
    -- Add quantity to existing Lot
    v_new_quantity := v_existing_quantity + p_quantity;

    -- Maximum quantity check
    IF v_new_quantity > 100000 THEN
      RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000): current=%, additional=%, total=%',
        v_existing_quantity, p_quantity, v_new_quantity;
    END IF;

    -- Update quantity
    UPDATE lots SET quantity = v_new_quantity WHERE id = v_existing_lot_id;

    -- BULK INSERT: Generate virtual_codes in single query
    INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
    SELECT
      generate_virtual_code(),
      v_existing_lot_id,
      'IN_STOCK',
      'ORGANIZATION',
      v_manufacturer_id::VARCHAR
    FROM generate_series(1, p_quantity);

    RETURN QUERY SELECT v_existing_lot_id, p_lot_number, v_new_quantity, FALSE;
  ELSE
    -- Create new Lot
    INSERT INTO lots (product_id, lot_number, quantity, manufacture_date, expiry_date)
    VALUES (p_product_id, p_lot_number, p_quantity, p_manufacture_date, p_expiry_date)
    RETURNING id INTO v_existing_lot_id;

    -- Trigger will auto-generate virtual_codes
    v_is_new := TRUE;

    RETURN QUERY SELECT v_existing_lot_id, p_lot_number, p_quantity, TRUE;
  END IF;
END;
$$;


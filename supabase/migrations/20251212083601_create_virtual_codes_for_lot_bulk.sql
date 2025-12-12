-- Migration: 20251212083601_create_virtual_codes_for_lot_bulk
-- Description: Optimized trigger function using BULK INSERT

CREATE OR REPLACE FUNCTION create_virtual_codes_for_lot()
RETURNS TRIGGER AS $$
DECLARE
  v_manufacturer_id UUID;
BEGIN
  -- Get the manufacturer ID from the product
  SELECT p.organization_id INTO v_manufacturer_id
  FROM products p
  WHERE p.id = NEW.product_id;

  -- BULK INSERT: Single query instead of FOR loop
  INSERT INTO virtual_codes (code, lot_id, status, owner_type, owner_id)
  SELECT
    generate_virtual_code(),
    NEW.id,
    'IN_STOCK',
    'ORGANIZATION',
    v_manufacturer_id::VARCHAR
  FROM generate_series(1, NEW.quantity);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trg_lot_create_virtual_codes
  AFTER INSERT ON lots
  FOR EACH ROW
  EXECUTE FUNCTION create_virtual_codes_for_lot();


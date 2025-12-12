-- Migration: 20251209081005_is_recall_allowed
-- Description: Create is_recall_allowed function

CREATE OR REPLACE FUNCTION is_recall_allowed(p_shipment_batch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_shipment_date TIMESTAMPTZ;
  v_is_recalled BOOLEAN;
BEGIN
  SELECT shipment_date, is_recalled
  INTO v_shipment_date, v_is_recalled
  FROM shipment_batches
  WHERE id = p_shipment_batch_id;

  -- Not found
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already recalled
  IF v_is_recalled THEN
    RETURN FALSE;
  END IF;

  -- Check 24-hour limit
  RETURN (NOW() - v_shipment_date) <= INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;


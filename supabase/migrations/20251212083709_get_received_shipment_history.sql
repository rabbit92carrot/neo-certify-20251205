-- Migration: 20251212083709_get_received_shipment_history
-- Description: Function to get received shipment history with pagination

CREATE OR REPLACE FUNCTION get_received_shipment_history(
  p_org_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20
)
RETURNS TABLE (
  batch_id UUID,
  from_org_id UUID,
  from_org_name TEXT,
  shipment_date TIMESTAMPTZ,
  is_recalled BOOLEAN,
  recall_reason TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INT;
  v_total BIGINT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM shipment_batches
  WHERE to_organization_id = p_org_id;

  RETURN QUERY
  SELECT
    sb.id AS batch_id,
    sb.from_organization_id AS from_org_id,
    o.name::TEXT AS from_org_name,
    sb.shipment_date,
    sb.is_recalled,
    sb.recall_reason::TEXT,
    v_total AS total_count
  FROM shipment_batches sb
  JOIN organizations o ON o.id = sb.from_organization_id
  WHERE sb.to_organization_id = p_org_id
  ORDER BY sb.shipment_date DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

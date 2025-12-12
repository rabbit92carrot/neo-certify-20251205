-- Migration: 20251212083700_get_shipment_batch_summaries
-- Description: Bulk shipment batch summary function (N+1 optimization)

CREATE OR REPLACE FUNCTION get_shipment_batch_summaries(p_batch_ids UUID[])
RETURNS TABLE (
  batch_id UUID,
  product_id UUID,
  product_name TEXT,
  lot_id UUID,
  lot_number TEXT,
  quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.shipment_batch_id AS batch_id,
    p.id AS product_id,
    p.name::TEXT AS product_name,
    l.id AS lot_id,
    l.lot_number::TEXT AS lot_number,
    COUNT(sd.id) AS quantity
  FROM shipment_details sd
  JOIN virtual_codes vc ON vc.id = sd.virtual_code_id
  JOIN lots l ON l.id = vc.lot_id
  JOIN products p ON p.id = l.product_id
  WHERE sd.shipment_batch_id = ANY(p_batch_ids)
  GROUP BY sd.shipment_batch_id, p.id, p.name, l.id, l.lot_number
  ORDER BY sd.shipment_batch_id, p.name, l.lot_number;
END;
$$;

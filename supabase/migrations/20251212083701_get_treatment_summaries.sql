-- Migration: 20251212083701_get_treatment_summaries
-- Description: Bulk treatment summary function (N+1 optimization)

CREATE OR REPLACE FUNCTION get_treatment_summaries(p_treatment_ids UUID[])
RETURNS TABLE (
  treatment_id UUID,
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
    td.treatment_id AS treatment_id,
    p.id AS product_id,
    p.name::TEXT AS product_name,
    l.id AS lot_id,
    l.lot_number::TEXT AS lot_number,
    COUNT(td.id) AS quantity
  FROM treatment_details td
  JOIN virtual_codes vc ON vc.id = td.virtual_code_id
  JOIN lots l ON l.id = vc.lot_id
  JOIN products p ON p.id = l.product_id
  WHERE td.treatment_id = ANY(p_treatment_ids)
  GROUP BY td.treatment_id, p.id, p.name, l.id, l.lot_number
  ORDER BY td.treatment_id, p.name, l.lot_number;
END;
$$;

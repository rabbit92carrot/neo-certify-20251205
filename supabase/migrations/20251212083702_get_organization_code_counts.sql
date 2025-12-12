-- Migration: 20251212083702_get_organization_code_counts
-- Description: Bulk organization code count function (N+1 optimization)

CREATE OR REPLACE FUNCTION get_organization_code_counts(p_org_ids UUID[])
RETURNS TABLE (
  org_id UUID,
  code_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS org_id,
    COALESCE(COUNT(vc.id), 0)::BIGINT AS code_count
  FROM UNNEST(p_org_ids) AS o(id)
  LEFT JOIN virtual_codes vc ON vc.owner_id = o.id::VARCHAR
    AND vc.status = 'IN_STOCK'
    AND vc.owner_type = 'ORGANIZATION'
  GROUP BY o.id;
END;
$$;

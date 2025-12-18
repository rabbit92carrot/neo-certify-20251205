-- =====================================================
-- Migration: 20251219200001_fix_get_history_summary_restore_codes
-- Description: Restore codes field and fix type casting in get_history_summary
--
-- Issue: 20251219200000 accidentally removed 'codes' field from product_summaries
-- while fixing the type casting issue for h.action_type comparison.
--
-- This migration combines:
-- 1. codes field restoration (from 20251219100000)
-- 2. enum to TEXT type casting (from 20251219200000)
-- =====================================================

-- Drop and recreate function (return type changed)
DROP FUNCTION IF EXISTS get_history_summary(UUID, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, INT, INT);

CREATE OR REPLACE FUNCTION get_history_summary(
  p_organization_id UUID,
  p_action_types TEXT[] DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_is_recall BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  group_key TEXT,
  action_type VARCHAR,
  from_owner_type VARCHAR,
  from_owner_id VARCHAR,
  from_owner_name TEXT,
  to_owner_type VARCHAR,
  to_owner_id VARCHAR,
  to_owner_name TEXT,
  is_recall BOOLEAN,
  recall_reason TEXT,
  created_at TIMESTAMPTZ,
  total_quantity BIGINT,
  product_summaries JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
      h.action_type::TEXT || '_' ||
      COALESCE(h.from_owner_id, '') || '_' ||
      COALESCE(h.to_owner_id, '') AS grp_key,
      h.action_type::TEXT AS act_type,
      h.from_owner_type::TEXT AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type::TEXT AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      COUNT(*) AS qty,
      p.id AS prod_id,
      p.name AS prod_name,
      -- Collect unique virtual code strings, ordered alphabetically
      ARRAY_AGG(DISTINCT vc.code ORDER BY vc.code) AS codes
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (p_start_date IS NULL OR h.created_at >= p_start_date)
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_is_recall IS NULL OR h.is_recall = p_is_recall)
    GROUP BY
      DATE_TRUNC('minute', h.created_at),
      h.action_type,
      h.from_owner_type,
      h.from_owner_id,
      h.to_owner_type,
      h.to_owner_id,
      h.is_recall,
      p.id,
      p.name
  ),
  aggregated AS (
    SELECT
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc,
      MAX(gh.latest_at) AS latest_at,
      SUM(gh.qty) AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'quantity', gh.qty,
          'codes', TO_JSONB(gh.codes)
        )
      ) AS prod_summaries
    FROM grouped_histories gh
    GROUP BY
      gh.grp_key,
      gh.act_type,
      gh.from_type,
      gh.from_id,
      gh.to_type,
      gh.to_id,
      gh.recall_flag,
      gh.recall_desc
  )
  SELECT
    a.grp_key,
    a.act_type::VARCHAR,
    a.from_type::VARCHAR,
    a.from_id,
    CASE
      WHEN a.from_type = 'ORGANIZATION' THEN (
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = a.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    a.to_type::VARCHAR,
    a.to_id,
    CASE
      WHEN a.to_type = 'ORGANIZATION' THEN (
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = a.to_id LIMIT 1
      )
      ELSE NULL
    END AS to_name,
    a.recall_flag,
    a.recall_desc,
    a.latest_at,
    a.total_qty,
    a.prod_summaries
  FROM aggregated a
  ORDER BY a.latest_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Preserve permissions
GRANT EXECUTE ON FUNCTION get_history_summary TO authenticated;

COMMENT ON FUNCTION get_history_summary IS 'Returns grouped transaction history with organization names and product codes. Includes codes array in product_summaries.';

-- =====================================================
-- Migration: 00019_fix_history_action_type_cast.sql
-- Description: Fix history_action_type enum vs TEXT comparison
--
-- Problem: The get_history_summary and get_history_summary_count functions
-- compare history_action_type (enum) with TEXT[] directly, causing:
-- "operator does not exist: history_action_type = text"
--
-- Solution: Add explicit type cast h.action_type::TEXT
-- =====================================================

-- =====================================================
-- 1. Fix get_history_summary function
-- =====================================================
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
  to_owner_type VARCHAR,
  to_owner_id VARCHAR,
  is_recall BOOLEAN,
  recall_reason TEXT,
  created_at TIMESTAMPTZ,
  total_quantity BIGINT,
  product_summaries JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
      h.action_type::TEXT || '_' ||
      COALESCE(h.from_owner_id, '') || '_' ||
      COALESCE(h.to_owner_id, '') AS grp_key,
      h.action_type::VARCHAR AS act_type,
      h.from_owner_type::VARCHAR AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type::VARCHAR AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      COUNT(*) AS qty,
      p.id AS prod_id,
      p.name AS prod_name
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
      SUM(gh.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'quantity', gh.qty
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
    a.to_type::VARCHAR,
    a.to_id,
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

COMMENT ON FUNCTION get_history_summary IS '조직의 거래이력을 시간+액션+당사자별로 그룹화하여 반환합니다. (Fixed: enum type cast)';

-- =====================================================
-- 2. Fix get_history_summary_count function
-- =====================================================
CREATE OR REPLACE FUNCTION get_history_summary_count(
  p_organization_id UUID,
  p_action_types TEXT[] DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_is_recall BOOLEAN DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT (
    DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
    h.action_type::TEXT || '_' ||
    COALESCE(h.from_owner_id, '') || '_' ||
    COALESCE(h.to_owner_id, '')
  ))
  INTO v_count
  FROM histories h
  WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
    AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
    AND (p_start_date IS NULL OR h.created_at >= p_start_date)
    AND (p_end_date IS NULL OR h.created_at <= p_end_date)
    AND (p_is_recall IS NULL OR h.is_recall = p_is_recall);

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_history_summary_count IS '거래이력 그룹의 총 개수를 반환합니다. (Fixed: enum type cast)';

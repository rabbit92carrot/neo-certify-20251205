-- Fix get_history_summary_cursor function type mismatch
-- Error: "Returned type character varying does not match expected type text in column 5"
-- Solution: Add ::TEXT cast to o.name in subqueries (from_owner_name, to_owner_name)

CREATE OR REPLACE FUNCTION public.get_history_summary_cursor(
  p_organization_id uuid,
  p_action_types text[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_is_recall boolean DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_key text DEFAULT NULL
)
RETURNS TABLE(
  group_key text,
  action_type character varying,
  from_owner_type character varying,
  from_owner_id character varying,
  from_owner_name text,
  to_owner_type character varying,
  to_owner_id character varying,
  to_owner_name text,
  is_recall boolean,
  recall_reason text,
  created_at timestamptz,
  total_quantity bigint,
  product_summaries jsonb,
  has_more boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH grouped_histories AS (
    SELECT
      DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
      h.action_type || '_' ||
      COALESCE(h.from_owner_id, '') || '_' ||
      COALESCE(h.to_owner_id, '') AS grp_key,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      COUNT(*) AS qty,
      p.id AS prod_id,
      p.name AS prod_name,
      (ARRAY_AGG(h.virtual_code_id ORDER BY h.created_at DESC))[1:10] AS code_ids
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND h.created_at >= v_start_date
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
          'codes', gh.code_ids
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
  ),
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      p_cursor_time IS NULL
      OR (a.latest_at < p_cursor_time)
      OR (a.latest_at = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.latest_at DESC, cf.grp_key DESC) AS rn,
      COUNT(*) OVER () AS total_fetched
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  SELECT
    l.grp_key,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    -- Fix: Cast VARCHAR to TEXT for type consistency
    CASE
      WHEN l.from_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = l.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    l.to_type::VARCHAR,
    l.to_id,
    -- Fix: Cast VARCHAR to TEXT for type consistency
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = l.to_id LIMIT 1
      )
      ELSE NULL
    END AS to_name,
    l.recall_flag,
    l.recall_desc,
    l.latest_at,
    l.total_qty,
    l.prod_summaries,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit
  ORDER BY l.latest_at DESC, l.grp_key DESC;
END;
$$;

COMMENT ON FUNCTION public.get_history_summary_cursor IS '조직별 이력 요약 커서 기반 페이지네이션 (기본 3일, timeout 30s) - type cast fix';

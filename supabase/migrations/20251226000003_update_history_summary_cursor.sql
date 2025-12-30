-- get_history_summary_cursor 함수 수정
-- SSOT 기반 배치 ID 그룹핑 + modelName 추가
--
-- 변경사항:
-- 1. 그룹핑 기준을 분 단위에서 배치 ID 기반으로 변경
--    - SHIPPED/RECEIVED/RECALLED(출고): shipment_batch_id
--    - PRODUCED: lot_id
--    - TREATED/RECALLED(시술): treatment_id
--    - DISPOSED 등: 기존 분 단위 그룹핑 (fallback)
-- 2. product_summaries에 modelName 추가
-- 3. shipment_batch_id 반환 (회수 기능용)

-- 반환 타입이 변경되었으므로 기존 함수를 먼저 삭제
DROP FUNCTION IF EXISTS public.get_history_summary_cursor(uuid, text[], timestamptz, timestamptz, boolean, integer, timestamptz, text);

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
  shipment_batch_id uuid,
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
      -- SSOT 기반 그룹 키: 배치 ID 우선, fallback으로 분 단위 그룹핑
      COALESCE(
        h.shipment_batch_id::TEXT,
        h.lot_id::TEXT,
        h.treatment_id::TEXT,
        -- fallback: 기존 분 단위 그룹핑 (DISPOSED 등 배치 ID가 없는 경우)
        DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
        h.action_type || '_' ||
        COALESCE(h.from_owner_id, '') || '_' ||
        COALESCE(h.to_owner_id, '')
      ) AS grp_key,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      MAX(h.recall_reason) AS recall_desc,
      MAX(h.created_at) AS latest_at,
      -- 회수 기능용: shipment_batch_id 반환
      MAX(h.shipment_batch_id) AS batch_id,
      COUNT(*) AS qty,
      p.id AS prod_id,
      p.name AS prod_name,
      p.model_name AS prod_model,
      -- 코드 목록 (최대 10개)
      (ARRAY_AGG(vc.code ORDER BY h.created_at DESC))[1:10] AS code_ids
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
      COALESCE(
        h.shipment_batch_id::TEXT,
        h.lot_id::TEXT,
        h.treatment_id::TEXT,
        DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
        h.action_type || '_' ||
        COALESCE(h.from_owner_id, '') || '_' ||
        COALESCE(h.to_owner_id, '')
      ),
      h.action_type,
      h.from_owner_type,
      h.from_owner_id,
      h.to_owner_type,
      h.to_owner_id,
      h.is_recall,
      p.id,
      p.name,
      p.model_name
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
      MAX(gh.batch_id) AS batch_id,
      SUM(gh.qty) AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'productId', gh.prod_id,
          'productName', gh.prod_name,
          'modelName', gh.prod_model,
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
    CASE
      WHEN l.from_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = l.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    l.to_type::VARCHAR,
    l.to_id,
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN (
        SELECT o.name::TEXT FROM organizations o WHERE o.id::VARCHAR = l.to_id LIMIT 1
      )
      ELSE NULL
    END AS to_name,
    l.recall_flag,
    l.recall_desc,
    l.latest_at,
    l.total_qty::BIGINT,
    l.prod_summaries,
    l.batch_id,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit
  ORDER BY l.latest_at DESC, l.grp_key DESC;
END;
$$;

-- Optimize: get_admin_event_summary_cursor에 조직명 직접 포함
--
-- 문제: RPC 호출 후 별도로 조직명 조회 쿼리 실행 (추가 ~100-200ms)
-- 해결: RPC 내부에서 organizations 테이블 LEFT JOIN으로 조직명 포함
--
-- 반환 타입 변경되므로 DROP + CREATE 필요
-- (단, 동일 트랜잭션 내에서 즉시 재생성하므로 문제 없음)

DROP FUNCTION IF EXISTS public.get_admin_event_summary_cursor;

CREATE OR REPLACE FUNCTION public.get_admin_event_summary_cursor(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_action_types text[] DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_lot_number text DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_include_recalled boolean DEFAULT TRUE,
  p_limit integer DEFAULT 50,
  p_cursor_time timestamptz DEFAULT NULL,
  p_cursor_key text DEFAULT NULL
)
RETURNS TABLE(
  group_key text,
  event_time timestamptz,
  action_type varchar,
  from_owner_type varchar,
  from_owner_id varchar,
  from_owner_name text,  -- 추가: 조직명 (ORGANIZATION) 또는 NULL (PATIENT)
  to_owner_type varchar,
  to_owner_id varchar,
  to_owner_name text,    -- 추가: 조직명 (ORGANIZATION) 또는 NULL (PATIENT)
  is_recall boolean,
  recall_reason text,
  total_quantity bigint,
  lot_summaries jsonb,
  sample_code_ids uuid[],
  batch_id uuid,
  has_more boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET statement_timeout TO '30s'
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 기본 날짜 범위: 최근 3일
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '3 days');

  RETURN QUERY
  WITH filtered_histories AS (
    SELECT
      h.id AS history_id,
      h.virtual_code_id,
      h.action_type AS act_type,
      h.from_owner_type AS from_type,
      h.from_owner_id AS from_id,
      h.to_owner_type AS to_type,
      h.to_owner_id AS to_id,
      h.is_recall AS recall_flag,
      h.recall_reason AS recall_desc,
      h.created_at,
      -- 배치 ID들 (SSOT 기반 그룹핑용)
      h.shipment_batch_id,
      h.lot_id AS history_lot_id,
      h.treatment_id,
      -- 로트/제품 정보
      l.id AS lot_id,
      l.lot_number,
      p.id AS product_id,
      p.name AS product_name,
      p.model_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      h.created_at >= v_start_date
      AND (p_end_date IS NULL OR h.created_at <= p_end_date)
      AND (p_action_types IS NULL OR h.action_type::TEXT = ANY(p_action_types))
      AND (p_organization_id IS NULL OR
           h.from_owner_id = p_organization_id::VARCHAR OR
           h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_lot_number IS NULL OR l.lot_number ILIKE '%' || p_lot_number || '%')
      AND (p_product_id IS NULL OR p.id = p_product_id)
      AND (p_include_recalled OR h.is_recall = FALSE)
  ),
  grouped AS (
    SELECT
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) || '_' || fh.act_type AS grp_key,
      COALESCE(fh.shipment_batch_id, fh.history_lot_id, fh.treatment_id) AS batch_id,
      MAX(fh.created_at) AS latest_time,
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      MAX(fh.recall_desc) AS recall_desc,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name,
      fh.model_name,
      COUNT(*) AS qty,
      (ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at DESC))[1:10] AS lot_code_ids
    FROM filtered_histories fh
    GROUP BY
      COALESCE(
        fh.shipment_batch_id::TEXT,
        fh.history_lot_id::TEXT,
        fh.treatment_id::TEXT,
        DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
          COALESCE(fh.from_id, '') || '_' ||
          COALESCE(fh.to_id, '')
      ) || '_' || fh.act_type,
      COALESCE(fh.shipment_batch_id, fh.history_lot_id, fh.treatment_id),
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name,
      fh.model_name
  ),
  aggregated AS (
    SELECT
      g.grp_key,
      g.batch_id,
      MAX(g.latest_time) AS event_time,
      g.act_type,
      MAX(g.from_type) AS from_type,
      g.from_id,
      MAX(g.to_type) AS to_type,
      g.to_id,
      g.recall_flag,
      MAX(g.recall_desc) AS recall_desc,
      SUM(g.qty)::BIGINT AS total_qty,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'lotId', g.lot_id,
          'lotNumber', g.lot_number,
          'productId', g.product_id,
          'productName', g.product_name,
          'modelName', g.model_name,
          'quantity', g.qty,
          'codeIds', g.lot_code_ids
        )
      ) AS lot_summaries,
      (ARRAY_AGG(g.lot_code_ids[1]))[1:10] AS sample_codes
    FROM grouped g
    GROUP BY
      g.grp_key,
      g.batch_id,
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  ),
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      p_cursor_time IS NULL
      OR (a.event_time < p_cursor_time)
      OR (a.event_time = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.event_time DESC, cf.grp_key DESC) AS rn,
      COUNT(*) OVER () AS total_fetched
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  -- 최종 SELECT에서 조직명 JOIN
  SELECT
    l.grp_key,
    l.event_time,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    -- from_owner_name: ORGANIZATION인 경우만 조직명 조회
    CASE
      WHEN l.from_type = 'ORGANIZATION' THEN from_org.name
      ELSE NULL
    END::TEXT AS from_owner_name,
    l.to_type::VARCHAR,
    l.to_id,
    -- to_owner_name: ORGANIZATION인 경우만 조직명 조회
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN to_org.name
      ELSE NULL
    END::TEXT AS to_owner_name,
    l.recall_flag,
    l.recall_desc,
    l.total_qty,
    l.lot_summaries,
    l.sample_codes,
    l.batch_id,
    (l.total_fetched > p_limit) AS has_more
  FROM limited l
  -- LEFT JOIN으로 조직명 조회 (from_id가 유효한 UUID인 경우만)
  LEFT JOIN organizations from_org
    ON l.from_type = 'ORGANIZATION'
    AND l.from_id IS NOT NULL
    AND l.from_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND from_org.id = l.from_id::UUID
  -- LEFT JOIN으로 조직명 조회 (to_id가 유효한 UUID인 경우만)
  LEFT JOIN organizations to_org
    ON l.to_type = 'ORGANIZATION'
    AND l.to_id IS NOT NULL
    AND l.to_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND to_org.id = l.to_id::UUID
  WHERE l.rn <= p_limit
  ORDER BY l.event_time DESC, l.grp_key DESC;
END;
$$;

COMMENT ON FUNCTION public.get_admin_event_summary_cursor IS
  'Admin 이벤트 요약 커서 조회. 조직명을 RPC 내부에서 직접 조회하여 추가 쿼리 제거 (성능 최적화)';

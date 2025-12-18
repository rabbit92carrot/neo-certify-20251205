-- =====================================================
-- Migration: 20251219000003_add_cursor_pagination_support
-- Description: 커서 기반 페이지네이션 지원 함수 추가
-- - OFFSET 기반 대비 대용량 데이터에서 일관된 성능
-- - created_at + id 복합 커서로 안정적인 페이지네이션
-- - 예상 개선: 100K+ 데이터에서 OFFSET 대비 10-50배 성능 향상
-- =====================================================

-- =====================================================
-- 1. 이력 요약 - 커서 기반 페이지네이션 버전
-- =====================================================
CREATE OR REPLACE FUNCTION get_history_summary_cursor(
  p_organization_id UUID,
  p_action_types TEXT[] DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_is_recall BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50,
  -- 커서 파라미터 (이전 페이지의 마지막 항목)
  p_cursor_time TIMESTAMPTZ DEFAULT NULL,
  p_cursor_key TEXT DEFAULT NULL
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
  product_summaries JSONB,
  has_more BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_has_more BOOLEAN := FALSE;
  v_actual_limit INT := p_limit + 1; -- 다음 페이지 존재 여부 확인용
BEGIN
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
      p.name AS prod_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
      AND (p_action_types IS NULL OR h.action_type = ANY(p_action_types))
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
  ),
  -- 커서 조건 적용 (시간 기준 내림차순)
  cursor_filtered AS (
    SELECT *
    FROM aggregated a
    WHERE (
      -- 첫 페이지: 커서가 없으면 모든 결과
      p_cursor_time IS NULL
      OR
      -- 다음 페이지: 커서보다 이전(오래된) 데이터
      (a.latest_at < p_cursor_time)
      OR
      -- 같은 시간일 경우 그룹 키로 정렬
      (a.latest_at = p_cursor_time AND a.grp_key < p_cursor_key)
    )
  ),
  limited AS (
    SELECT
      cf.*,
      ROW_NUMBER() OVER (ORDER BY cf.latest_at DESC, cf.grp_key DESC) AS rn
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
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = l.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    l.to_type::VARCHAR,
    l.to_id,
    CASE
      WHEN l.to_type = 'ORGANIZATION' THEN (
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = l.to_id LIMIT 1
      )
      ELSE NULL
    END AS to_name,
    l.recall_flag,
    l.recall_desc,
    l.latest_at,
    l.total_qty,
    l.prod_summaries,
    (l.rn > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit -- 실제 반환은 limit 개수만
  ORDER BY l.latest_at DESC, l.grp_key DESC;
END;
$$;

-- =====================================================
-- 2. 관리자 이벤트 요약 - 커서 기반 페이지네이션 버전
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_event_summary_cursor(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_action_types TEXT[] DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_lot_number TEXT DEFAULT NULL,
  p_product_id UUID DEFAULT NULL,
  p_include_recalled BOOLEAN DEFAULT TRUE,
  p_limit INT DEFAULT 50,
  p_cursor_time TIMESTAMPTZ DEFAULT NULL,
  p_cursor_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  group_key TEXT,
  event_time TIMESTAMPTZ,
  action_type VARCHAR,
  from_owner_type VARCHAR,
  from_owner_id VARCHAR,
  to_owner_type VARCHAR,
  to_owner_id VARCHAR,
  is_recall BOOLEAN,
  recall_reason TEXT,
  total_quantity BIGINT,
  lot_summaries JSONB,
  sample_code_ids UUID[],
  has_more BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
BEGIN
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
      l.id AS lot_id,
      l.lot_number,
      p.id AS product_id,
      p.name AS product_name
    FROM histories h
    INNER JOIN virtual_codes vc ON vc.id = h.virtual_code_id
    INNER JOIN lots l ON l.id = vc.lot_id
    INNER JOIN products p ON p.id = l.product_id
    WHERE
      (p_start_date IS NULL OR h.created_at >= p_start_date)
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
      DATE_TRUNC('minute', fh.created_at)::TEXT || '_' ||
        fh.act_type || '_' ||
        COALESCE(fh.from_id, '') || '_' ||
        COALESCE(fh.to_id, '') AS grp_key,
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
      COUNT(*) AS qty,
      (ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at))[1:10] AS sample_code_ids
    FROM filtered_histories fh
    GROUP BY
      DATE_TRUNC('minute', fh.created_at),
      fh.act_type,
      fh.from_type,
      fh.from_id,
      fh.to_type,
      fh.to_id,
      fh.recall_flag,
      fh.lot_id,
      fh.lot_number,
      fh.product_id,
      fh.product_name
  ),
  aggregated AS (
    SELECT
      g.grp_key,
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
          'quantity', g.qty
        )
      ) AS lot_summaries,
      (ARRAY_AGG(g.sample_code_ids[1]))[1:10] AS sample_codes
    FROM grouped g
    GROUP BY
      g.grp_key,
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
      ROW_NUMBER() OVER (ORDER BY cf.event_time DESC, cf.grp_key DESC) AS rn
    FROM cursor_filtered cf
    LIMIT v_actual_limit
  )
  SELECT
    l.grp_key,
    l.event_time,
    l.act_type::VARCHAR,
    l.from_type::VARCHAR,
    l.from_id,
    l.to_type::VARCHAR,
    l.to_id,
    l.recall_flag,
    l.recall_desc,
    l.total_qty,
    l.lot_summaries,
    l.sample_codes,
    (l.rn > p_limit) AS has_more
  FROM limited l
  WHERE l.rn <= p_limit
  ORDER BY l.event_time DESC, l.grp_key DESC;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_history_summary_cursor TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_event_summary_cursor TO authenticated;

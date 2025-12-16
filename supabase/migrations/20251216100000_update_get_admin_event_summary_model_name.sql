-- =====================================================
-- Migration: 20251216100000_update_get_admin_event_summary_model_name
-- Description: get_admin_event_summary 함수에 model_name 추가
-- =====================================================

-- 기존 함수 재정의 (model_name 추가)
CREATE OR REPLACE FUNCTION get_admin_event_summary(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_action_types TEXT[] DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,    -- 출발지 OR 도착지 조직 필터
  p_lot_number TEXT DEFAULT NULL,         -- Lot 번호 부분 검색
  p_product_id UUID DEFAULT NULL,
  p_include_recalled BOOLEAN DEFAULT TRUE,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
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
  sample_code_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_histories AS (
    -- 필터 조건에 맞는 이력 조회
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
      p.name AS product_name,
      p.model_name AS product_model_name  -- model_name 추가
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
  -- 이벤트 그룹별 집계 (분 단위 + 액션 + 출발지 + 도착지)
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
      fh.product_model_name,  -- model_name 추가
      COUNT(*) AS qty,
      ARRAY_AGG(fh.virtual_code_id ORDER BY fh.created_at) AS code_ids
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
      fh.product_name,
      fh.product_model_name  -- model_name 추가
  ),
  -- 최종 집계: 여러 Lot을 하나의 이벤트로 묶기
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
          'modelName', g.product_model_name,  -- modelName 추가
          'quantity', g.qty
        )
      ) AS lot_summaries,
      -- 샘플 코드 ID 추출 (최대 10개)
      (ARRAY_AGG(g.code_ids[1]))[1:10] AS sample_codes
    FROM grouped g
    GROUP BY
      g.grp_key,
      g.act_type,
      g.from_id,
      g.to_id,
      g.recall_flag
  )
  SELECT
    a.grp_key,
    a.event_time,
    a.act_type::VARCHAR,
    a.from_type::VARCHAR,
    a.from_id,
    a.to_type::VARCHAR,
    a.to_id,
    a.recall_flag,
    a.recall_desc,
    a.total_qty,
    a.lot_summaries,
    a.sample_codes
  FROM aggregated a
  ORDER BY a.event_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_admin_event_summary TO authenticated;

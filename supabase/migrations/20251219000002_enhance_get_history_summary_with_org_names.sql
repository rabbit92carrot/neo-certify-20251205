-- =====================================================
-- Migration: 20251219000002_enhance_get_history_summary_with_org_names
-- Description: get_history_summary에 조직명 포함 (별도 쿼리 제거)
-- - 서비스 레이어의 getOrganizationNames() 호출 제거
-- - 예상 개선: DB 왕복 1회 감소, 120ms → 80ms (33% 개선)
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경을 위해 필수)
DROP FUNCTION IF EXISTS get_history_summary(UUID, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, INT, INT);

-- 새 함수 생성 (from_owner_name, to_owner_name 추가)
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
  from_owner_name TEXT,       -- 추가: 출발지 조직명
  to_owner_type VARCHAR,
  to_owner_id VARCHAR,
  to_owner_name TEXT,         -- 추가: 도착지 조직명
  is_recall BOOLEAN,
  recall_reason TEXT,
  created_at TIMESTAMPTZ,
  total_quantity BIGINT,
  product_summaries JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE  -- 캐싱 최적화
AS $$
BEGIN
  RETURN QUERY
  WITH grouped_histories AS (
    -- 먼저 분 단위 + 액션 + 당사자로 그룹화
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
  -- 제품별 요약을 JSON으로 집계
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
  )
  SELECT
    a.grp_key,
    a.act_type,
    a.from_type,
    a.from_id,
    -- 출발지 조직명: ORGANIZATION이면 조직 테이블에서 조회, 아니면 NULL
    CASE
      WHEN a.from_type = 'ORGANIZATION' THEN (
        SELECT o.name FROM organizations o WHERE o.id::VARCHAR = a.from_id LIMIT 1
      )
      ELSE NULL
    END AS from_name,
    a.to_type,
    a.to_id,
    -- 도착지 조직명: ORGANIZATION이면 조직 테이블에서 조회, 아니면 NULL
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

-- 권한 재부여
GRANT EXECUTE ON FUNCTION get_history_summary TO authenticated;

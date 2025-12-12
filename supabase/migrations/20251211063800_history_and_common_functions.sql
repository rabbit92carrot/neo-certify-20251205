-- =====================================================
-- Migration: 20251211063800_history_and_common_functions
-- Description: 거래이력 요약 조회 및 공통 유틸리티 함수
-- =====================================================

-- =====================================================
-- 1. 거래이력 요약 조회 함수 (시간+액션+당사자별 그룹화)
-- 대량의 이력을 효율적으로 그룹화하여 반환
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
    a.to_type,
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

-- =====================================================
-- 2. 거래이력 총 그룹 수 조회 함수
-- 페이지네이션용 총 개수 반환
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
    h.action_type || '_' ||
    COALESCE(h.from_owner_id, '') || '_' ||
    COALESCE(h.to_owner_id, '')
  ))
  INTO v_count
  FROM histories h
  WHERE (h.from_owner_id = p_organization_id::VARCHAR OR h.to_owner_id = p_organization_id::VARCHAR)
    AND (p_action_types IS NULL OR h.action_type = ANY(p_action_types))
    AND (p_start_date IS NULL OR h.created_at >= p_start_date)
    AND (p_end_date IS NULL OR h.created_at <= p_end_date)
    AND (p_is_recall IS NULL OR h.is_recall = p_is_recall);

  RETURN v_count;
END;
$$;

-- =====================================================
-- 3. 조직 이름 일괄 조회 함수
-- 여러 조직 ID를 한 번에 조회하여 성능 최적화
-- =====================================================
CREATE OR REPLACE FUNCTION get_organization_names(p_org_ids UUID[])
RETURNS TABLE (
  org_id UUID,
  org_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name::TEXT
  FROM organizations o
  WHERE o.id = ANY(p_org_ids);
END;
$$;

-- =====================================================
-- 4. 통계 요약 함수 (notification 관련)
-- 여러 COUNT 쿼리를 하나로 통합
-- =====================================================
CREATE OR REPLACE FUNCTION get_notification_stats(p_organization_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_count BIGINT,
  auth_count BIGINT,
  recall_count BIGINT,
  sent_count BIGINT,
  pending_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE nm.type = 'AUTHENTICATION') AS auth_count,
    COUNT(*) FILTER (WHERE nm.type = 'RECALL') AS recall_count,
    COUNT(*) FILTER (WHERE nm.status = 'SENT') AS sent_count,
    COUNT(*) FILTER (WHERE nm.status = 'PENDING') AS pending_count
  FROM notification_messages nm
  WHERE p_organization_id IS NULL OR nm.organization_id = p_organization_id;
END;
$$;


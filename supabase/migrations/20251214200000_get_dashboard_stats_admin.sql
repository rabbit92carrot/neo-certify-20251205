-- Admin 대시보드 통계 통합 함수
-- 4개의 개별 쿼리를 1개의 RPC 호출로 통합하여 DB 왕복 75% 감소
CREATE OR REPLACE FUNCTION get_dashboard_stats_admin()
RETURNS TABLE (
  total_organizations BIGINT,
  pending_approvals BIGINT,
  today_recalls BIGINT,
  total_virtual_codes BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 한국 시간대 기준 오늘 날짜 (UTC+9)
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_today_end := v_today_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    -- 1. 총 조직 수 (관리자 제외)
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM organizations
      WHERE type != 'ADMIN'
    ) AS total_organizations,

    -- 2. 승인 대기 조직 수
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM organizations
      WHERE status = 'PENDING_APPROVAL'
        AND type != 'ADMIN'
    ) AS pending_approvals,

    -- 3. 오늘 회수 건수 (출고 회수 + 시술 회수)
    (
      SELECT COALESCE(
        (
          -- 출고 회수
          SELECT COUNT(*)
          FROM shipment_batches
          WHERE is_recalled = TRUE
            AND recall_date >= v_today_start
            AND recall_date < v_today_end
        ) + (
          -- 시술 회수 (histories 테이블에서)
          SELECT COUNT(DISTINCT h.id)
          FROM histories h
          WHERE h.action_type = 'RECALLED'
            AND h.from_owner_type = 'PATIENT'
            AND h.created_at >= v_today_start
            AND h.created_at < v_today_end
        ), 0
      )::BIGINT
    ) AS today_recalls,

    -- 4. 총 가상 코드 수
    (
      SELECT COALESCE(COUNT(*), 0)::BIGINT
      FROM virtual_codes
    ) AS total_virtual_codes;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_dashboard_stats_admin() TO authenticated;

COMMENT ON FUNCTION get_dashboard_stats_admin() IS
  'Admin 대시보드 통계 통합 조회. 4개 쿼리를 1개 RPC로 통합하여 DB 왕복 감소';

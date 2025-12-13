-- 조직 상태별 카운트를 SQL에서 직접 집계하는 함수
-- 기존 JavaScript에서 for 루프로 집계하던 로직을 DB에서 처리
CREATE OR REPLACE FUNCTION get_organization_status_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    o.status::text,
    COUNT(*)::bigint as count
  FROM organizations o
  WHERE o.type != 'ADMIN'
  GROUP BY o.status
  ORDER BY o.status;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_organization_status_counts() TO authenticated;

COMMENT ON FUNCTION get_organization_status_counts() IS
  '조직 상태별 카운트 조회 (관리자 대시보드용). ADMIN 제외, GROUP BY로 집계';

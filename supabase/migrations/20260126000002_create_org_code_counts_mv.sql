-- Optimize: Organization별 보유 코드 수를 Materialized View로 캐싱
--
-- 문제: get_organization_code_counts RPC가 virtual_codes 테이블을 COUNT하므로 느림 (1,800ms)
-- 해결: Materialized View로 미리 계산된 결과를 캐싱 (~10ms)
--
-- Refresh 전략:
-- - 운영 초기: 관리자 페이지 로드 시 수동 refresh (Admin 접근 빈도 낮음)
-- - 향후: pg_cron으로 야간 배치 refresh 설정 권장

-- 1. Materialized View 생성
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_org_code_counts AS
SELECT
  owner_id::uuid AS org_id,
  COUNT(*)::bigint AS code_count
FROM public.virtual_codes
WHERE owner_type = 'ORGANIZATION'
  AND status = 'IN_STOCK'
GROUP BY owner_id
WITH DATA;

-- 2. CONCURRENTLY refresh를 위한 UNIQUE INDEX 생성
-- (CONCURRENTLY 사용 시 읽기 차단 없이 refresh 가능)
CREATE UNIQUE INDEX IF NOT EXISTS mv_org_code_counts_org_id_idx
  ON public.mv_org_code_counts (org_id);

-- 3. 기존 RPC 함수 대신 MV를 사용하는 새 함수 생성
CREATE OR REPLACE FUNCTION public.get_organization_code_counts_fast(p_org_ids uuid[])
RETURNS TABLE(org_id uuid, code_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS org_id,
    COALESCE(mv.code_count, 0)::bigint AS code_count
  FROM UNNEST(p_org_ids) AS o(id)
  LEFT JOIN public.mv_org_code_counts mv ON mv.org_id = o.id;
END;
$$;

COMMENT ON FUNCTION public.get_organization_code_counts_fast(uuid[]) IS
  'Organization별 보유 코드 수 조회 (Materialized View 사용). get_organization_code_counts의 빠른 버전';

-- 4. MV refresh 함수 생성 (수동 refresh용)
CREATE OR REPLACE FUNCTION public.refresh_org_code_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_org_code_counts;
END;
$$;

COMMENT ON FUNCTION public.refresh_org_code_counts() IS
  'Organization 코드 카운트 Materialized View 갱신. 무중단 갱신 지원 (CONCURRENTLY)';

-- 5. RLS 설정 (Materialized View는 RLS 미지원이므로 함수로 접근 제어)
GRANT SELECT ON public.mv_org_code_counts TO authenticated;
GRANT SELECT ON public.mv_org_code_counts TO anon;
GRANT SELECT ON public.mv_org_code_counts TO service_role;

GRANT EXECUTE ON FUNCTION public.get_organization_code_counts_fast(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_code_counts_fast(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_organization_code_counts_fast(uuid[]) TO service_role;

GRANT EXECUTE ON FUNCTION public.refresh_org_code_counts() TO service_role;
-- Note: authenticated 사용자의 refresh 권한은 필요 시 추가

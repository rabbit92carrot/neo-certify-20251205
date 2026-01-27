-- Issue #001: MV 갱신 주기 단축 (24시간 → 3시간)
--
-- 문제: mv_org_code_counts MV가 하루 1회만 갱신되어 데이터 불일치 시
--       폴백 쿼리(COUNT)가 실행되어 11초 이상 지연 발생
--
-- 해결: pg_cron 스케줄을 매 3시간마다로 변경하여 MV 최신성 유지

-- 1. 기존 스케줄 삭제
DO $$
BEGIN
  PERFORM cron.unschedule('refresh-org-code-counts');
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- pg_cron이 없으면 무시
  WHEN OTHERS THEN
    NULL; -- 스케줄이 없으면 무시
END;
$$;

-- 2. 새 스케줄 등록 (매 3시간마다)
-- cron 표현식: '분 시 일 월 요일'
-- 0 */3 * * * = 매일 0, 3, 6, 9, 12, 15, 18, 21시 (UTC)
SELECT cron.schedule(
  'refresh-org-code-counts',
  '0 */3 * * *',
  'SELECT public.refresh_org_code_counts()'
);

-- 3. 코멘트 업데이트
COMMENT ON FUNCTION public.refresh_org_code_counts() IS
  'Organization 코드 카운트 MV 갱신. pg_cron으로 매 3시간마다 자동 실행 (Issue #001)';

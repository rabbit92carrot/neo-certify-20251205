-- Setup: pg_cron을 사용하여 mv_org_code_counts Materialized View 자동 refresh
--
-- 목적: 조직별 코드 카운트 MV를 매일 새벽 3시 KST에 자동 갱신
-- 요구사항: Supabase Pro (pg_cron 확장 사용 가능)
--
-- 참고: pg_cron은 Supabase Dashboard → Database → Extensions에서 활성화 필요

-- 1. pg_cron 확장 활성화
-- (이미 활성화된 경우 무시됨)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 기존 스케줄 삭제 (멱등성 보장)
-- cron.unschedule은 jobname이 없으면 에러가 발생하므로 DO 블록으로 처리
DO $$
BEGIN
  PERFORM cron.unschedule('refresh-org-code-counts');
EXCEPTION
  WHEN undefined_table THEN
    -- pg_cron이 방금 설치된 경우 cron 스키마가 없을 수 있음
    NULL;
  WHEN OTHERS THEN
    -- 스케줄이 없는 경우 에러 무시
    NULL;
END;
$$;

-- 3. 매일 새벽 3시 KST (18:00 UTC) refresh 스케줄 등록
-- cron 표현식: '분 시 일 월 요일'
-- 0 18 * * * = 매일 18:00 UTC = 03:00 KST (다음날)
SELECT cron.schedule(
  'refresh-org-code-counts',           -- job 이름
  '0 18 * * *',                        -- cron 표현식 (매일 18:00 UTC = 03:00 KST)
  'SELECT public.refresh_org_code_counts()'  -- 실행할 SQL
);

-- 4. 스케줄 확인용 코멘트
COMMENT ON FUNCTION public.refresh_org_code_counts() IS
  'Organization 코드 카운트 MV 갱신. pg_cron으로 매일 03:00 KST 자동 실행';

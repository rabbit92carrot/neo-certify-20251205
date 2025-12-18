-- =====================================================
-- Migration: 20251219000001_add_histories_performance_indexes
-- Description: 이력 테이블 성능 최적화 인덱스 추가
-- - 분 단위 그룹화 쿼리 최적화
-- - 예상 개선: 이벤트 요약 쿼리 20-30% 성능 향상
-- =====================================================

-- IMMUTABLE wrapper 함수 생성 (타임존 없는 버전으로 인덱스에서 사용 가능)
CREATE OR REPLACE FUNCTION date_trunc_minute_immutable(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
  SELECT DATE_TRUNC('minute', ts AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- 분 단위 + 액션 타입 인덱스 (이벤트 요약 그룹화 최적화)
-- Note: CONCURRENTLY 제거 - db push는 트랜잭션 내 실행이라 사용 불가
CREATE INDEX IF NOT EXISTS idx_histories_minute_action
ON histories (date_trunc_minute_immutable(created_at), action_type);

-- 조직 필터 + 시간 복합 인덱스 (조직별 이력 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_histories_from_org_time
ON histories (from_owner_id, created_at DESC)
WHERE from_owner_type = 'ORGANIZATION';

CREATE INDEX IF NOT EXISTS idx_histories_to_org_time
ON histories (to_owner_id, created_at DESC)
WHERE to_owner_type = 'ORGANIZATION';

-- 회수 이력 조회 최적화
CREATE INDEX IF NOT EXISTS idx_histories_recall_time
ON histories (created_at DESC)
WHERE is_recall = TRUE;

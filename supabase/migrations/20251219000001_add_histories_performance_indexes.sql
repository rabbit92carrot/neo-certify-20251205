-- =====================================================
-- Migration: 20251219000001_add_histories_performance_indexes
-- Description: 이력 테이블 성능 최적화 인덱스 추가
-- - 분 단위 그룹화 쿼리 최적화
-- - 예상 개선: 이벤트 요약 쿼리 20-30% 성능 향상
-- =====================================================

-- 분 단위 + 액션 타입 인덱스 (이벤트 요약 그룹화 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_histories_minute_action
ON histories (DATE_TRUNC('minute', created_at), action_type);

-- 조직 필터 + 시간 복합 인덱스 (조직별 이력 조회 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_histories_from_org_time
ON histories (from_owner_id, created_at DESC)
WHERE from_owner_type = 'ORGANIZATION';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_histories_to_org_time
ON histories (to_owner_id, created_at DESC)
WHERE to_owner_type = 'ORGANIZATION';

-- 회수 이력 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_histories_recall_time
ON histories (created_at DESC)
WHERE is_recall = TRUE;
